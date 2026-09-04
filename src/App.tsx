import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PollRoom, Question, MemberFirm } from './types';
import { Navbar, AppMode } from './components/Navbar';
import { PresenterScreen } from './components/PresenterScreen';
import { ParticipantScreen } from './components/ParticipantScreen';
import { SplitScreenView } from './components/SplitScreenView';
import { QRCodeModal } from './components/QRCodeModal';
import { QuorumRosterModal } from './components/QuorumRosterModal';
import { PollBuilderModal } from './components/PollBuilderModal';

// Helper for unique session IDs
function getOrCreateSessionId(key = 'voter_session_id'): string {
  let id = localStorage.getItem(key);
  if (!id) {
    id = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export default function App() {
  const [room, setRoom] = useState<PollRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // App mode: 'presenter' | 'participant' | 'split'
  const [mode, setMode] = useState<AppMode>('presenter');

  // Modals
  const [showQRModal, setShowQRModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showBuilderModal, setShowBuilderModal] = useState(false);

  // Session IDs
  const mainSessionId = useRef(getOrCreateSessionId('main_voter_session')).current;
  const splitSessionAlpha = useRef(getOrCreateSessionId('split_alpha_session')).current;
  const splitSessionBeta = useRef(getOrCreateSessionId('split_beta_session')).current;

  const currentRoomId = room?.id || 'room-main';

  // Check URL query parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'participant' || viewParam === 'vote') {
      setMode('participant');
    } else if (viewParam === 'split') {
      setMode('split');
    }
  }, []);

  // Fetch room data
  const fetchRoom = useCallback(async (roomId = 'room-main') => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) throw new Error('Failed to load voting room');
      const data = await res.json();
      setRoom(data);
      setError(null);
    } catch (err: any) {
      console.error('Fetch room error:', err);
      setError(err.message || 'Error connecting to voting service');
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup Real-Time Server-Sent Events (SSE)
  useEffect(() => {
    fetchRoom('room-main');

    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      eventSource = new EventSource(`/api/rooms/room-main/events`);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'ROOM_UPDATE' || payload.type === 'INIT') {
            setRoom(payload.room);
          }
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        // Retry connection in 3 seconds
        setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      eventSource?.close();
    };
  }, [fetchRoom]);

  // Periodic polling fallback (every 5 seconds) to ensure state stays in sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRoom(currentRoomId);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentRoomId, fetchRoom]);

  // ---------------- ACTION HANDLERS ----------------

  // Claim Member Firm (Checks if already claimed by someone else!)
  const handleClaimFirm = async (
    sessionId: string,
    firmId: string,
    delegateName: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/rooms/${currentRoomId}/claim-firm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, firmId, delegateName }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to claim member firm' };
      }

      // Optimistic update
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          memberFirms: prev.memberFirms.map(f => {
            if (f.id === firmId) {
              return { ...f, claimedBySessionId: sessionId, delegateName, claimedAt: Date.now() };
            }
            if (f.claimedBySessionId === sessionId) {
              // Unclaim previous
              const copy = { ...f };
              delete copy.claimedBySessionId;
              delete copy.delegateName;
              return copy;
            }
            return f;
          }),
        };
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // Release Member Firm
  const handleReleaseFirm = async (sessionId: string, firmId: string): Promise<{ success: boolean }> => {
    try {
      const res = await fetch(`/api/rooms/${currentRoomId}/release-firm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, firmId }),
      });
      if (res.ok) {
        setRoom(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            memberFirms: prev.memberFirms.map(f => {
              if (f.id === firmId) {
                const copy = { ...f };
                delete copy.claimedBySessionId;
                delete copy.delegateName;
                delete copy.claimedAt;
                return copy;
              }
              return f;
            }),
          };
        });
        return { success: true };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  };

  // Submit Vote (Enforces 1 vote per member firm)
  const handleSubmitVote = async (
    sessionId: string,
    questionId: string,
    value: any
  ): Promise<{ success: boolean; error?: string }> => {
    if (!room) return { success: false, error: 'Room not loaded' };

    const firm = room.memberFirms.find(f => f.claimedBySessionId === sessionId);
    if (!firm) {
      return { success: false, error: 'No member firm accredited to this session.' };
    }

    try {
      const res = await fetch(`/api/rooms/${currentRoomId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId,
          memberFirmId: firm.id,
          value,
          delegateName: firm.delegateName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to submit vote' };
      }

      // Optimistic update
      setRoom(prev => {
        if (!prev) return prev;
        const exists = prev.votes.findIndex(
          v => v.questionId === questionId && v.memberFirmId === firm.id
        );
        const newVotes = [...prev.votes];
        if (exists >= 0) {
          newVotes[exists] = data.vote;
        } else {
          newVotes.push(data.vote);
        }
        return { ...prev, votes: newVotes };
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to record vote' };
    }
  };

  // Slide navigation
  const handleNavigateSlide = async (newIndex: number) => {
    try {
      await fetch(`/api/rooms/${currentRoomId}/slide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentQuestionIndex: newIndex }),
      });
      setRoom(prev => prev ? { ...prev, currentQuestionIndex: newIndex } : prev);
    } catch (err) {
      console.error(err);
    }
  };

  // Lock toggle
  const handleToggleLock = async (locked: boolean) => {
    try {
      await fetch(`/api/rooms/${currentRoomId}/slide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votingLocked: locked }),
      });
      setRoom(prev => prev ? { ...prev, votingLocked: locked } : prev);
    } catch (err) {
      console.error(err);
    }
  };

  // Results toggle
  const handleToggleResults = async (visible: boolean) => {
    try {
      await fetch(`/api/rooms/${currentRoomId}/slide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultsVisible: visible }),
      });
      setRoom(prev => prev ? { ...prev, resultsVisible: visible } : prev);
    } catch (err) {
      console.error(err);
    }
  };

  // Reset votes for question
  const handleResetVotesForQuestion = async (questionId: string) => {
    if (!room) return;
    const remainingVotes = room.votes.filter(v => v.questionId !== questionId);
    setRoom({ ...room, votes: remainingVotes });
    try {
      await fetch(`/api/rooms/${currentRoomId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetVotes: true }),
      });
      fetchRoom(currentRoomId);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Member Firm
  const handleAddMemberFirm = async (name: string, country: string) => {
    if (!room) return;
    const newFirm: MemberFirm = {
      id: `firm-${Date.now()}`,
      name,
      country,
    };
    const updatedFirms = [...room.memberFirms, newFirm];
    setRoom({ ...room, memberFirms: updatedFirms });

    try {
      await fetch(`/api/rooms/${currentRoomId}/firms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firms: updatedFirms }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk import firms
  const handleBulkImportFirms = async (rawText: string) => {
    if (!room) return;
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const newFirms: MemberFirm[] = lines.map((line, idx) => {
      const parts = line.split(/[,;\t]+/);
      return {
        id: `firm-bulk-${Date.now()}-${idx}`,
        name: parts[0]?.trim() || line,
        country: parts[1]?.trim() || '',
      };
    });

    const updated = [...room.memberFirms, ...newFirms];
    setRoom({ ...room, memberFirms: updated });

    try {
      await fetch(`/api/rooms/${currentRoomId}/firms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firms: updated }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Release claim as Admin
  const handleAdminReleaseClaim = async (firmId: string) => {
    try {
      await fetch(`/api/rooms/${currentRoomId}/release-firm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firmId, isAdmin: true }),
      });
      fetchRoom(currentRoomId);
    } catch (err) {
      console.error(err);
    }
  };

  // Reset all claims
  const handleResetAllClaims = async () => {
    try {
      await fetch(`/api/rooms/${currentRoomId}/firms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_claims' }),
      });
      fetchRoom(currentRoomId);
    } catch (err) {
      console.error(err);
    }
  };

  // Reset all votes
  const handleResetAllVotes = async () => {
    try {
      await fetch(`/api/rooms/${currentRoomId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetVotes: true }),
      });
      fetchRoom(currentRoomId);
    } catch (err) {
      console.error(err);
    }
  };

  // Update questions list
  const handleUpdateQuestions = async (questions: Question[]) => {
    try {
      await fetch(`/api/rooms/${currentRoomId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      });
      fetchRoom(currentRoomId);
    } catch (err) {
      console.error(err);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    window.location.href = `/api/rooms/${currentRoomId}/export?format=csv`;
  };

  // Get current site URL
  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const participantJoinUrl = `${originUrl}?view=participant`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Loading Member Firm Voting Session...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 text-white">
        <div className="max-w-md rounded-2xl border border-rose-800 bg-slate-950 p-6 text-center">
          <h2 className="text-lg font-bold text-rose-400">Connection Error</h2>
          <p className="mt-2 text-sm text-slate-400">{error || 'Could not connect to voting room.'}</p>
          <button
            onClick={() => fetchRoom('room-main')}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const claimedCount = room.memberFirms.filter(f => f.claimedBySessionId).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 flex flex-col">
      {/* Navbar with Mode Switcher */}
      <Navbar
        currentMode={mode}
        onSelectMode={setMode}
        roomCode={room.code}
        totalFirms={room.memberFirms.length}
        claimedFirmsCount={claimedCount}
        onOpenQR={() => setShowQRModal(true)}
        onOpenRoster={() => setShowRosterModal(true)}
        onOpenSettings={() => setShowBuilderModal(true)}
        isConnected={isConnected}
      />

      {/* Main View Render */}
      <div className="flex-1">
        {mode === 'presenter' && (
          <PresenterScreen
            room={room}
            onNavigateSlide={handleNavigateSlide}
            onToggleLock={handleToggleLock}
            onToggleResults={handleToggleResults}
            onResetVotesForQuestion={handleResetVotesForQuestion}
            onOpenQR={() => setShowQRModal(true)}
            onOpenRoster={() => setShowRosterModal(true)}
            appUrl={originUrl}
          />
        )}

        {mode === 'participant' && (
          <ParticipantScreen
            room={room}
            sessionId={mainSessionId}
            onClaimFirm={(fId, name) => handleClaimFirm(mainSessionId, fId, name)}
            onReleaseFirm={fId => handleReleaseFirm(mainSessionId, fId)}
            onSubmitVote={(qId, val) => handleSubmitVote(mainSessionId, qId, val)}
          />
        )}

        {mode === 'split' && (
          <SplitScreenView
            room={room}
            session1Id={splitSessionAlpha}
            session2Id={splitSessionBeta}
            onClaimFirm={handleClaimFirm}
            onReleaseFirm={handleReleaseFirm}
            onSubmitVote={handleSubmitVote}
            onNavigateSlide={handleNavigateSlide}
            onToggleLock={handleToggleLock}
            onToggleResults={handleToggleResults}
            onResetVotesForQuestion={handleResetVotesForQuestion}
            onOpenQR={() => setShowQRModal(true)}
            onOpenRoster={() => setShowRosterModal(true)}
            appUrl={originUrl}
          />
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        roomCode={room.code}
        joinUrl={participantJoinUrl}
      />

      {/* Quorum & Member Firm Roster Modal */}
      <QuorumRosterModal
        isOpen={showRosterModal}
        onClose={() => setShowRosterModal(false)}
        room={room}
        onAddFirm={handleAddMemberFirm}
        onBulkImport={handleBulkImportFirms}
        onReleaseFirmClaim={handleAdminReleaseClaim}
        onResetAllClaims={handleResetAllClaims}
        onExportCSV={handleExportCSV}
      />

      {/* Poll Builder & Session Modal */}
      <PollBuilderModal
        isOpen={showBuilderModal}
        onClose={() => setShowBuilderModal(false)}
        room={room}
        onUpdateQuestions={handleUpdateQuestions}
        onResetVotes={handleResetAllVotes}
        onExportCSV={handleExportCSV}
      />
    </div>
  );
}
