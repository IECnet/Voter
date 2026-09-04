import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_MEMBER_FIRMS, DEFAULT_QUESTIONS } from './src/defaultData';
import { PollRoom, MemberFirm, Vote, Question } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory data store for Poll Rooms
const rooms = new Map<string, PollRoom>();
// SSE client subscribers by room ID
const sseClients = new Map<string, Set<express.Response>>();

// Helper to broadcast room state to all connected SSE clients
function broadcastRoomUpdate(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  const clients = sseClients.get(roomId);
  if (!clients || clients.size === 0) return;

  const data = JSON.stringify({ type: 'ROOM_UPDATE', room });
  for (const client of clients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      clients.delete(client);
    }
  }
}

// Initialize default room for instant ready-to-use experience
function initDefaultRoom(): PollRoom {
  const defaultRoom: PollRoom = {
    id: 'room-main',
    title: 'International Network Assembly & AGM 2026',
    code: '842 109',
    currentQuestionIndex: 0,
    questions: JSON.parse(JSON.stringify(DEFAULT_QUESTIONS)),
    memberFirms: JSON.parse(JSON.stringify(DEFAULT_MEMBER_FIRMS)),
    votes: [],
    createdAt: Date.now(),
    votingLocked: false,
    resultsVisible: true,
  };
  rooms.set(defaultRoom.id, defaultRoom);
  return defaultRoom;
}

initDefaultRoom();

// Helper to find or normalize room by ID or 6-digit Code
function findRoom(identifier: string): PollRoom | undefined {
  if (rooms.has(identifier)) return rooms.get(identifier);
  const cleanCode = identifier.replace(/\s+/g, '').toUpperCase();
  for (const room of rooms.values()) {
    if (room.code.replace(/\s+/g, '').toUpperCase() === cleanCode) {
      return room;
    }
  }
  return undefined;
}

// ---------------- API ROUTES ----------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// List or get default room
app.get('/api/rooms', (req, res) => {
  const list = Array.from(rooms.values()).map(r => ({
    id: r.id,
    title: r.title,
    code: r.code,
    totalFirms: r.memberFirms.length,
    claimedFirms: r.memberFirms.filter(f => f.claimedBySessionId).length,
    totalVotes: r.votes.length,
    questionsCount: r.questions.length,
  }));
  res.json(list);
});

// Get room details
app.get('/api/rooms/:roomId', (req, res) => {
  const room = findRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room);
});

// SSE endpoint for live real-time sync
app.get('/api/rooms/:roomId/events', (req, res) => {
  const room = findRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  if (!sseClients.has(room.id)) {
    sseClients.set(room.id, new Set());
  }
  const clients = sseClients.get(room.id)!;
  clients.add(res);

  // Send initial room state
  res.write(`data: ${JSON.stringify({ type: 'INIT', room })}\n\n`);

  // Keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
      clients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

// CRITICAL FEATURE: Claim member firm before voting
// If the member firm has already been chosen by someone with another sessionId, it fails.
app.post('/api/rooms/:roomId/claim-firm', (req, res) => {
  const room = findRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const { firmId, delegateName, sessionId } = req.body;
  if (!firmId || !sessionId) {
    return res.status(400).json({ error: 'firmId and sessionId are required' });
  }

  const firm = room.memberFirms.find(f => f.id === firmId);
  if (!firm) {
    return res.status(404).json({ error: 'Member firm not found in roster' });
  }

  // Check if firm is already claimed by a different session
  if (firm.claimedBySessionId && firm.claimedBySessionId !== sessionId) {
    return res.status(409).json({
      error: `Member firm "${firm.name}" has already been claimed by another attendee (${firm.delegateName || 'Delegate'}). Each member firm is limited to one voting delegate.`,
      alreadyClaimed: true,
      firmName: firm.name,
    });
  }

  // Also release any previous firm claimed by this same session in this room
  for (const f of room.memberFirms) {
    if (f.id !== firmId && f.claimedBySessionId === sessionId) {
      delete f.claimedBySessionId;
      delete f.claimedAt;
      delete f.delegateName;
    }
  }

  // Assign claim
  firm.claimedBySessionId = sessionId;
  firm.claimedAt = Date.now();
  if (delegateName && delegateName.trim()) {
    firm.delegateName = delegateName.trim();
  }

  broadcastRoomUpdate(room.id);
  res.json({ success: true, firm });
});

// Release a firm claim
app.post('/api/rooms/:roomId/release-firm', (req, res) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { firmId, sessionId, isAdmin } = req.body;
  const firm = room.memberFirms.find(f => f.id === firmId);
  if (!firm) return res.status(404).json({ error: 'Member firm not found' });

  // Only the session that claimed it or an admin can release it
  if (!isAdmin && firm.claimedBySessionId !== sessionId) {
    return res.status(403).json({ error: 'Not authorized to release this firm' });
  }

  delete firm.claimedBySessionId;
  delete firm.claimedAt;
  delete firm.delegateName;

  broadcastRoomUpdate(room.id);
  res.json({ success: true, firmId });
});

// Cast a Vote (Enforces 1 vote per member firm per question)
app.post('/api/rooms/:roomId/vote', (req, res) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  if (room.votingLocked) {
    return res.status(400).json({ error: 'Voting is currently closed by the presenter.' });
  }

  const { questionId, memberFirmId, sessionId, value, delegateName } = req.body;
  if (!questionId || !memberFirmId || !sessionId || value === undefined) {
    return res.status(400).json({ error: 'Missing required voting parameters' });
  }

  const firm = room.memberFirms.find(f => f.id === memberFirmId);
  if (!firm) {
    return res.status(404).json({ error: 'Member firm not recognized' });
  }

  // Verify that this firm is claimed by this session
  if (firm.claimedBySessionId && firm.claimedBySessionId !== sessionId) {
    return res.status(409).json({
      error: `Firm "${firm.name}" was claimed by another attendee. You cannot vote on their behalf.`,
    });
  }

  // Auto-claim if not already set
  if (!firm.claimedBySessionId) {
    firm.claimedBySessionId = sessionId;
    firm.claimedAt = Date.now();
    if (delegateName) firm.delegateName = delegateName;
  }

  // Check if this firm already voted on this question
  const existingVoteIndex = room.votes.findIndex(
    v => v.questionId === questionId && v.memberFirmId === memberFirmId
  );

  const newVote: Vote = {
    id: `vote-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    questionId,
    memberFirmId,
    memberFirmName: firm.name,
    delegateName: delegateName || firm.delegateName,
    sessionId,
    value,
    timestamp: Date.now(),
  };

  if (existingVoteIndex >= 0) {
    // Update existing vote
    room.votes[existingVoteIndex] = newVote;
  } else {
    // Add new vote
    room.votes.push(newVote);
  }

  broadcastRoomUpdate(room.id);
  res.json({ success: true, vote: newVote });
});

// Admin: Navigate slide or change presentation controls
app.post('/api/rooms/:roomId/slide', (req, res) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { currentQuestionIndex, votingLocked, resultsVisible } = req.body;

  if (typeof currentQuestionIndex === 'number' && currentQuestionIndex >= 0 && currentQuestionIndex < room.questions.length) {
    room.currentQuestionIndex = currentQuestionIndex;
  }
  if (typeof votingLocked === 'boolean') {
    room.votingLocked = votingLocked;
  }
  if (typeof resultsVisible === 'boolean') {
    room.resultsVisible = resultsVisible;
  }

  broadcastRoomUpdate(room.id);
  res.json({ success: true, room });
});

// Admin: Update Member Firms Roster
app.post('/api/rooms/:roomId/firms', (req, res) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { firms, action } = req.body;

  if (action === 'reset_claims') {
    // Reset all claims so firms can be chosen anew
    room.memberFirms.forEach(f => {
      delete f.claimedBySessionId;
      delete f.claimedAt;
      delete f.delegateName;
    });
  } else if (Array.isArray(firms)) {
    // Replace or set new roster
    room.memberFirms = firms.map((f: any, idx: number) => ({
      id: f.id || `firm-${Date.now()}-${idx}`,
      name: f.name.trim(),
      country: f.country?.trim() || '',
      claimedBySessionId: f.claimedBySessionId,
      claimedAt: f.claimedAt,
      delegateName: f.delegateName,
    }));
  }

  broadcastRoomUpdate(room.id);
  res.json({ success: true, memberFirms: room.memberFirms });
});

// Admin: Update Questions List or Add Question
app.post('/api/rooms/:roomId/questions', (req, res) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { questions } = req.body;
  if (Array.isArray(questions)) {
    room.questions = questions;
    if (room.currentQuestionIndex >= room.questions.length) {
      room.currentQuestionIndex = Math.max(0, room.questions.length - 1);
    }
    broadcastRoomUpdate(room.id);
    return res.json({ success: true, questions: room.questions });
  }

  res.status(400).json({ error: 'Invalid questions payload' });
});

// Admin: Reset all votes or claims
app.post('/api/rooms/:roomId/reset', (req, res) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { resetVotes, resetClaims } = req.body;
  if (resetVotes) {
    room.votes = [];
  }
  if (resetClaims) {
    room.memberFirms.forEach(f => {
      delete f.claimedBySessionId;
      delete f.claimedAt;
      delete f.delegateName;
    });
  }

  broadcastRoomUpdate(room.id);
  res.json({ success: true, room });
});

// Export voting roll call as CSV or JSON
app.get('/api/rooms/:roomId/export', (req, res) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const format = req.query.format === 'csv' ? 'csv' : 'json';
  if (format === 'json') {
    return res.json({
      roomTitle: room.title,
      roomCode: room.code,
      exportedAt: new Date().toISOString(),
      quorum: {
        totalFirms: room.memberFirms.length,
        claimedFirms: room.memberFirms.filter(f => f.claimedBySessionId).length,
      },
      questions: room.questions,
      memberFirms: room.memberFirms,
      votes: room.votes,
    });
  }

  // CSV format
  const rows: string[] = [
    'Question ID,Question Title,Member Firm ID,Member Firm Name,Country,Delegate,Vote Value,Timestamp',
  ];

  for (const v of room.votes) {
    const q = room.questions.find(item => item.id === v.questionId);
    const f = room.memberFirms.find(item => item.id === v.memberFirmId);
    const qTitle = `"${(q?.title || '').replace(/"/g, '""')}"`;
    const fName = `"${v.memberFirmName.replace(/"/g, '""')}"`;
    const country = `"${(f?.country || '').replace(/"/g, '""')}"`;
    const delegate = `"${(v.delegateName || '').replace(/"/g, '""')}"`;
    const val = `"${String(v.value).replace(/"/g, '""')}"`;
    const dateStr = new Date(v.timestamp).toISOString();

    rows.push(`${v.questionId},${qTitle},${v.memberFirmId},${fName},${country},${delegate},${val},${dateStr}`);
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="voting-results-${room.code.replace(/\s+/g, '')}.csv"`);
  res.send(rows.join('\n'));
});

// ---------------- VITE & STATIC SERVING ----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Member Firm Voting Tool server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
