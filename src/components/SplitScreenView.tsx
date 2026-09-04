import React, { useState } from 'react';
import { PollRoom } from '../types';
import { ParticipantScreen } from './ParticipantScreen';
import { PresenterScreen } from './PresenterScreen';
import { Smartphone, Monitor, ShieldCheck, ArrowRightLeft, Sparkles } from 'lucide-react';

interface SplitScreenViewProps {
  room: PollRoom;
  session1Id: string;
  session2Id: string;
  onClaimFirm: (sessionId: string, firmId: string, delegateName: string) => Promise<{ success: boolean; error?: string }>;
  onReleaseFirm: (sessionId: string, firmId: string) => Promise<{ success: boolean }>;
  onSubmitVote: (sessionId: string, questionId: string, value: any) => Promise<{ success: boolean; error?: string }>;
  onNavigateSlide: (index: number) => void;
  onToggleLock: (locked: boolean) => void;
  onToggleResults: (visible: boolean) => void;
  onResetVotesForQuestion: (qId: string) => void;
  onOpenQR: () => void;
  onOpenRoster: () => void;
  appUrl: string;
}

export const SplitScreenView: React.FC<SplitScreenViewProps> = ({
  room,
  session1Id,
  session2Id,
  onClaimFirm,
  onReleaseFirm,
  onSubmitVote,
  onNavigateSlide,
  onToggleLock,
  onToggleResults,
  onResetVotesForQuestion,
  onOpenQR,
  onOpenRoster,
  appUrl,
}) => {
  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-100 p-4">
      {/* Informative Guidance Banner */}
      <div className="mx-auto mb-4 max-w-7xl rounded-2xl border border-indigo-200 bg-indigo-50/80 p-3.5 text-xs text-indigo-950 shadow-2xs">
        <div className="flex items-center gap-2 font-bold text-sm text-indigo-900">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <span>Real-Time Member Firm Verification Test Arena</span>
        </div>
        <p className="mt-1 text-indigo-850">
          <strong>Test the requested rule below:</strong> When <em>Delegate A (Left Phone)</em> selects and confirms a member firm (e.g. "Grant & Partners"), observe how that firm <strong>instantly vanishes</strong> from <em>Delegate B's list (Right Phone)</em>! Both devices sync live with the central assembly server.
        </p>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Device 1: Delegate A */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-indigo-600" />
              <span>Delegate A (Terminal 1)</span>
            </div>
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] text-indigo-800 font-mono">
              Session: Alpha
            </span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[750px]">
            <ParticipantScreen
              room={room}
              sessionId={session1Id}
              onClaimFirm={(fId, name) => onClaimFirm(session1Id, fId, name)}
              onReleaseFirm={fId => onReleaseFirm(session1Id, fId)}
              onSubmitVote={(qId, val) => onSubmitVote(session1Id, qId, val)}
            />
          </div>
        </div>

        {/* Device 2: Delegate B */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-600" />
              <span>Delegate B (Terminal 2)</span>
            </div>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 font-mono">
              Session: Beta
            </span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[750px]">
            <ParticipantScreen
              room={room}
              sessionId={session2Id}
              onClaimFirm={(fId, name) => onClaimFirm(session2Id, fId, name)}
              onReleaseFirm={fId => onReleaseFirm(session2Id, fId)}
              onSubmitVote={(qId, val) => onSubmitVote(session2Id, qId, val)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
