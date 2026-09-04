import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PollRoom, Question, Vote } from '../types';
import { MemberFirmCheckIn } from './MemberFirmCheckIn';
import {
  Building2,
  CheckCircle2,
  Lock,
  RotateCcw,
  Send,
  Sparkles,
  ShieldCheck,
  UserCheck,
  BarChart2,
} from 'lucide-react';

interface ParticipantScreenProps {
  room: PollRoom;
  sessionId: string;
  myFirmId?: string;
  myDelegateName?: string;
  onClaimFirm: (firmId: string, delegateName: string) => Promise<{ success: boolean; error?: string }>;
  onReleaseFirm: (firmId: string) => Promise<{ success: boolean }>;
  onSubmitVote: (questionId: string, value: any) => Promise<{ success: boolean; error?: string }>;
}

export const ParticipantScreen: React.FC<ParticipantScreenProps> = ({
  room,
  sessionId,
  myFirmId,
  myDelegateName,
  onClaimFirm,
  onReleaseFirm,
  onSubmitVote,
}) => {
  const [selectedValue, setSelectedValue] = useState<any>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVotedJustNow, setHasVotedJustNow] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  // Identify claimed firm
  const myFirm = room.memberFirms.find(
    f => f.id === myFirmId || f.claimedBySessionId === sessionId
  );

  const currentQ: Question | undefined = room.questions[room.currentQuestionIndex];

  // Find existing vote for this firm on this question
  const existingVote: Vote | undefined = currentQ && myFirm
    ? room.votes.find(v => v.questionId === currentQ.id && v.memberFirmId === myFirm.id)
    : undefined;

  // Sync selected value with existing vote if available
  useEffect(() => {
    if (existingVote) {
      setSelectedValue(existingVote.value);
    } else {
      setSelectedValue('');
    }
    setVoteError(null);
    setHasVotedJustNow(false);
  }, [currentQ?.id, existingVote]);

  // Handle vote submit
  const handleVoteSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentQ || selectedValue === undefined || selectedValue === '') return;

    setIsSubmitting(true);
    setVoteError(null);

    const result = await onSubmitVote(currentQ.id, selectedValue);
    setIsSubmitting(false);

    if (result.success) {
      setHasVotedJustNow(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } else if (result.error) {
      setVoteError(result.error);
    }
  };

  // 1. If not yet verified with a member firm, render the Member Firm Check-In screen!
  if (!myFirm) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
        <div className="mx-auto max-w-xl text-center mb-6">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
            Room Code: {room.code}
          </span>
          <h1 className="mt-2 text-xl font-bold text-slate-900">{room.title}</h1>
        </div>

        <MemberFirmCheckIn
          memberFirms={room.memberFirms}
          currentSessionId={sessionId}
          onClaimFirm={onClaimFirm}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  // 2. If verified, render the active voting interface
  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6">
      <div className="mx-auto max-w-lg space-y-4">
        {/* Verified Member Firm Banner */}
        <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Accredited Voting Firm
                </span>
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">{myFirm.name}</h2>
              {myFirm.country && (
                <p className="text-xs text-slate-500">
                  {myFirm.country} {myFirm.delegateName ? `• ${myFirm.delegateName}` : ''}
                </p>
              )}
            </div>
          </div>

          <button
            id="switch-firm-btn"
            onClick={() => onReleaseFirm(myFirm.id)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            title="Release claim if you need to choose a different firm"
          >
            Change
          </button>
        </div>

        {/* Current Active Question Card */}
        {currentQ ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Question Header & Type */}
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                Question {room.currentQuestionIndex + 1} of {room.questions.length}
              </span>

              {room.votingLocked ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Open
                </span>
              )}
            </div>

            {/* Title & Description */}
            <h3 className="mt-3 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {currentQ.title}
            </h3>
            {currentQ.description && (
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                {currentQ.description}
              </p>
            )}

            {/* Error banner */}
            {voteError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {voteError}
              </div>
            )}

            {/* Locked notice */}
            {room.votingLocked && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Voting on this question has been closed by the session chair.
              </div>
            )}

            {/* Form Input Widgets */}
            <div className="mt-6">
              {/* 1. Multiple Choice Options */}
              {currentQ.type === 'multiple_choice' && (
                <div className="space-y-2.5">
                  {(currentQ.options || []).map(opt => {
                    const isSelected = selectedValue === opt.id;
                    return (
                      <button
                        key={opt.id}
                        id={`opt-btn-${opt.id}`}
                        type="button"
                        disabled={room.votingLocked}
                        onClick={() => setSelectedValue(opt.id)}
                        className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left text-sm font-medium transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-semibold ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                        } ${room.votingLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      >
                        <span>{opt.text}</span>
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. Yes / No / Abstain Action Cards */}
              {currentQ.type === 'yes_no_abstain' && (
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={room.votingLocked}
                    onClick={() => setSelectedValue('opt-yes')}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left font-semibold transition ${
                      selectedValue === 'opt-yes'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-800 hover:bg-emerald-50/50 hover:border-emerald-300'
                    } ${room.votingLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    <span className="text-base text-emerald-800">In Favor (Yes)</span>
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        selectedValue === 'opt-yes'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {selectedValue === 'opt-yes' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={room.votingLocked}
                    onClick={() => setSelectedValue('opt-no')}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left font-semibold transition ${
                      selectedValue === 'opt-no'
                        ? 'border-rose-600 bg-rose-50 text-rose-950 ring-2 ring-rose-500/20'
                        : 'border-slate-200 bg-white text-slate-800 hover:bg-rose-50/50 hover:border-rose-300'
                    } ${room.votingLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    <span className="text-base text-rose-800">Against (No)</span>
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        selectedValue === 'opt-no'
                          ? 'border-rose-600 bg-rose-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {selectedValue === 'opt-no' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={room.votingLocked}
                    onClick={() => setSelectedValue('opt-abstain')}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left font-semibold transition ${
                      selectedValue === 'opt-abstain'
                        ? 'border-slate-600 bg-slate-100 text-slate-900 ring-2 ring-slate-400/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    } ${room.votingLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    <span className="text-base text-slate-700">Abstain</span>
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        selectedValue === 'opt-abstain'
                          ? 'border-slate-600 bg-slate-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {selectedValue === 'opt-abstain' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                </div>
              )}

              {/* 3. Scale Rating (1 to 5) */}
              {currentQ.type === 'scale' && (
                <div>
                  <div className="flex items-center justify-between gap-2 py-4">
                    {[1, 2, 3, 4, 5].map(rating => {
                      const isSelected = Number(selectedValue) === rating;
                      return (
                        <button
                          key={rating}
                          type="button"
                          disabled={room.votingLocked}
                          onClick={() => setSelectedValue(rating)}
                          className={`flex h-14 flex-1 items-center justify-center rounded-2xl border text-lg font-bold transition ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                          } ${room.votingLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        >
                          {rating}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 px-1">
                    <span>{currentQ.scaleMinLabel || '1 (Low)'}</span>
                    <span>{currentQ.scaleMaxLabel || '5 (High)'}</span>
                  </div>
                </div>
              )}

              {/* 4. Word Cloud Input */}
              {currentQ.type === 'word_cloud' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    disabled={room.votingLocked}
                    value={selectedValue || ''}
                    onChange={e => setSelectedValue(e.target.value)}
                    placeholder="Enter 1-3 keywords (e.g. Audit Automation, ESG)..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-xs text-slate-400">
                    Your words will dynamically appear on the main stage word cloud.
                  </p>
                </div>
              )}

              {/* 5. Open Ended Text */}
              {currentQ.type === 'open_ended' && (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    disabled={room.votingLocked}
                    value={selectedValue || ''}
                    onChange={e => setSelectedValue(e.target.value)}
                    placeholder="Type your delegation's feedback or suggestion here..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}

              {/* Submit Vote Button */}
              <button
                id="participant-submit-vote-btn"
                type="button"
                disabled={room.votingLocked || selectedValue === undefined || selectedValue === '' || isSubmitting}
                onClick={() => handleVoteSubmit()}
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-sm font-semibold shadow-xs transition ${
                  room.votingLocked || selectedValue === undefined || selectedValue === '' || isSubmitting
                    ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
                }`}
              >
                {isSubmitting ? (
                  <span>Recording vote...</span>
                ) : existingVote ? (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    <span>Update Ballot for {myFirm.name}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Cast Vote as {myFirm.name}</span>
                  </>
                )}
              </button>

              {/* Success badge if already voted */}
              {existingVote && (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>
                    Official Ballot Recorded for {myFirm.name}
                    {existingVote.timestamp && ` (at ${new Date(existingVote.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            <p>Session is currently paused or no question is active.</p>
          </div>
        )}
      </div>
    </div>
  );
};
