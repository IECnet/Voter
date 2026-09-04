import React, { useState, useMemo } from 'react';
import { PollRoom, Question, Vote } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  QrCode,
  RotateCcw,
  Maximize2,
  Users,
  CheckCircle,
  XCircle,
  MinusCircle,
  Sparkles,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import { WordCloudView } from './WordCloudView';

interface PresenterScreenProps {
  room: PollRoom;
  onNavigateSlide: (newIndex: number) => void;
  onToggleLock: (locked: boolean) => void;
  onToggleResults: (visible: boolean) => void;
  onResetVotesForQuestion: (questionId: string) => void;
  onOpenQR: () => void;
  onOpenRoster: () => void;
  appUrl: string;
}

export const PresenterScreen: React.FC<PresenterScreenProps> = ({
  room,
  onNavigateSlide,
  onToggleLock,
  onToggleResults,
  onResetVotesForQuestion,
  onOpenQR,
  onOpenRoster,
  appUrl,
}) => {
  const currentQIndex = room.currentQuestionIndex;
  const currentQ: Question | undefined = room.questions[currentQIndex];

  // Filter votes for current question
  const currentVotes = useMemo(() => {
    if (!currentQ) return [];
    return room.votes.filter(v => v.questionId === currentQ.id);
  }, [room.votes, currentQ]);

  // Statistics
  const totalFirms = room.memberFirms.length;
  const claimedFirmsCount = room.memberFirms.filter(f => f.claimedBySessionId).length;
  const votesCount = currentVotes.length;
  const quorumPercent = totalFirms > 0 ? Math.round((claimedFirmsCount / totalFirms) * 100) : 0;

  // Toggle fullscreen
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!currentQ) {
    return (
      <div className="flex h-96 flex-col items-center justify-center p-8 text-center text-slate-500">
        <HelpCircle className="h-12 w-12 text-slate-300" />
        <h3 className="mt-4 text-xl font-bold text-slate-800">No Questions in Session</h3>
        <p className="mt-1 text-sm">Add questions using the Poll Builder tab.</p>
      </div>
    );
  }

  // Calculate results for Multiple Choice
  const multipleChoiceStats = useMemo(() => {
    if (currentQ.type !== 'multiple_choice') return [];
    const options = currentQ.options || [];
    const counts: Record<string, { count: number; firms: string[] }> = {};
    options.forEach(opt => {
      counts[opt.id] = { count: 0, firms: [] };
    });

    for (const vote of currentVotes) {
      const selected = Array.isArray(vote.value) ? vote.value : [vote.value];
      for (const val of selected) {
        if (counts[val]) {
          counts[val].count += 1;
          counts[val].firms.push(vote.memberFirmName);
        }
      }
    }

    const totalSelections = Object.values(counts).reduce((sum, item) => sum + item.count, 0);

    return options.map(opt => {
      const c = counts[opt.id]?.count || 0;
      const pct = totalSelections > 0 ? Math.round((c / totalSelections) * 100) : 0;
      return {
        option: opt,
        count: c,
        percent: pct,
        firms: counts[opt.id]?.firms || [],
      };
    });
  }, [currentQ, currentVotes]);

  // Calculate results for Yes / No / Abstain
  const resolutionStats = useMemo(() => {
    if (currentQ.type !== 'yes_no_abstain') return null;
    let yes = 0, no = 0, abstain = 0;
    const yesFirms: string[] = [];
    const noFirms: string[] = [];
    const abstainFirms: string[] = [];

    for (const vote of currentVotes) {
      if (vote.value === 'opt-yes' || vote.value === 'yes') {
        yes++;
        yesFirms.push(vote.memberFirmName);
      } else if (vote.value === 'opt-no' || vote.value === 'no') {
        no++;
        noFirms.push(vote.memberFirmName);
      } else {
        abstain++;
        abstainFirms.push(vote.memberFirmName);
      }
    }

    const total = currentVotes.length;
    const activeVotes = yes + no; // Excluding abstain for simple majority threshold
    const passThreshold = activeVotes > 0 ? (yes / activeVotes) > 0.5 : false;

    return {
      yes,
      no,
      abstain,
      yesPct: total > 0 ? Math.round((yes / total) * 100) : 0,
      noPct: total > 0 ? Math.round((no / total) * 100) : 0,
      abstainPct: total > 0 ? Math.round((abstain / total) * 100) : 0,
      passThreshold,
      yesFirms,
      noFirms,
      abstainFirms,
    };
  }, [currentQ, currentVotes]);

  // Calculate results for Scale (1-5 or 1-10)
  const scaleStats = useMemo(() => {
    if (currentQ.type !== 'scale') return null;
    const min = currentQ.scaleMin || 1;
    const max = currentQ.scaleMax || 5;
    const distribution: Record<number, number> = {};

    for (let i = min; i <= max; i++) {
      distribution[i] = 0;
    }

    let sum = 0;
    for (const vote of currentVotes) {
      const num = Number(vote.value);
      if (!isNaN(num)) {
        distribution[num] = (distribution[num] || 0) + 1;
        sum += num;
      }
    }

    const total = currentVotes.length;
    const average = total > 0 ? (sum / total).toFixed(2) : '0.00';

    return {
      min,
      max,
      distribution,
      average,
      total,
    };
  }, [currentQ, currentVotes]);

  // Clean join display URL
  const cleanDisplayUrl = appUrl.replace(/^https?:\/\//, '');

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col justify-between bg-slate-900 text-slate-50">
      {/* Top Projector Stage Banner (Mentimeter Style Header) */}
      <header className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          {/* Join Instructions */}
          <div className="flex items-center gap-4">
            <button
              id="presenter-qr-btn"
              onClick={onOpenQR}
              className="flex items-center gap-2 rounded-xl bg-slate-800/90 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-700 active:bg-slate-600 transition"
              title="Show enlarged QR code for auditorium scanning"
            >
              <QrCode className="h-4 w-4 text-indigo-400" />
              <span>Show QR Code</span>
            </button>

            <div className="text-xs sm:text-sm">
              <span className="text-slate-400">Join at </span>
              <span className="font-semibold text-indigo-300">{cleanDisplayUrl}</span>
              <span className="text-slate-400"> with PIN: </span>
              <span className="rounded-md bg-indigo-950 border border-indigo-700/60 px-2.5 py-1 font-mono text-sm font-bold tracking-widest text-indigo-200">
                {room.code}
              </span>
            </div>
          </div>

          {/* Quorum and Live Vote Counters */}
          <div className="flex items-center gap-3">
            {/* Member Firm Quorum Pill */}
            <button
              id="presenter-quorum-pill"
              onClick={onOpenRoster}
              className="group flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-600 hover:bg-slate-700 transition"
              title="Click to view Member Firm Quorum Roll Call"
            >
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span>
                Quorum: <strong className="text-white">{claimedFirmsCount}/{totalFirms}</strong> ({quorumPercent}%)
              </span>
            </button>

            {/* Total Votes Count */}
            <div
              id="presenter-votes-count-pill"
              className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-950/60 px-3 py-1.5 text-xs font-semibold text-indigo-300"
            >
              <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
              <span>
                {votesCount} {votesCount === 1 ? 'Firm' : 'Firms'} Voted
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Presentation Stage */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-8 sm:px-8">
        {/* Status Indicators */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium uppercase tracking-wider text-slate-400">
              Question {currentQIndex + 1} of {room.questions.length}
            </span>
            <span className="rounded-full bg-indigo-950 border border-indigo-800/50 px-3 py-1 text-xs font-semibold capitalize text-indigo-300">
              {currentQ.type.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {room.votingLocked ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-950/80 border border-rose-800 px-3 py-1 text-xs font-semibold text-rose-300">
                <Lock className="h-3 w-3" />
                Voting Locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Voting Live
              </span>
            )}

            {!room.resultsVisible && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 border border-amber-800 px-3 py-1 text-xs font-semibold text-amber-300">
                <EyeOff className="h-3 w-3" />
                Results Hidden
              </span>
            )}
          </div>
        </div>

        {/* Question Title & Description */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl leading-tight">
            {currentQ.title}
          </h1>
          {currentQ.description && (
            <p className="mt-2 text-base text-slate-400 max-w-3xl mx-auto">
              {currentQ.description}
            </p>
          )}
        </div>

        {/* Visualizations (if results are visible) */}
        {!room.resultsVisible ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/60 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
              <EyeOff className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-white">Results are Hidden</h3>
            <p className="mt-1 text-sm text-slate-400 max-w-md">
              Votes are actively being recorded in real-time. Click "Show Results" in the presenter bar below to reveal the live outcome.
            </p>
            <button
              onClick={() => onToggleResults(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition"
            >
              <Eye className="h-4 w-4" />
              <span>Reveal Results Now</span>
            </button>
          </div>
        ) : (
          <div className="w-full">
            {/* 1. Multiple Choice Visualization */}
            {currentQ.type === 'multiple_choice' && (
              <div className="space-y-3.5">
                {multipleChoiceStats.map(stat => (
                  <div
                    key={stat.option.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-sm transition-all"
                  >
                    {/* Animated Progress Bar Fill */}
                    <div
                      className="absolute inset-0 bg-indigo-600/30 transition-all duration-700 ease-out"
                      style={{ width: `${stat.percent}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-semibold text-slate-200 text-sm">
                          {stat.percent}%
                        </div>
                        <span className="text-base font-semibold text-white sm:text-lg">
                          {stat.option.text}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-full bg-slate-800/90 px-3 py-1 text-xs font-semibold text-indigo-300">
                          {stat.count} {stat.count === 1 ? 'vote' : 'votes'}
                        </span>
                      </div>
                    </div>

                    {/* Member firms who voted for this option (transparency in firm voting) */}
                    {stat.firms.length > 0 && (
                      <div className="relative z-10 mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <span className="font-medium text-slate-500">Firms:</span>
                        {stat.firms.map(fName => (
                          <span
                            key={fName}
                            className="rounded-md bg-slate-800/80 px-2 py-0.5 text-slate-300"
                          >
                            {fName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 2. Formal Resolution (Yes / No / Abstain) */}
            {currentQ.type === 'yes_no_abstain' && resolutionStats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* IN FAVOR */}
                  <div className="flex flex-col justify-between rounded-2xl border border-emerald-800/60 bg-emerald-950/40 p-6 text-center shadow-sm">
                    <div>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-900/60 text-emerald-400">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <h4 className="mt-3 text-lg font-bold text-emerald-300">In Favor</h4>
                      <p className="text-4xl font-extrabold text-white mt-2">
                        {resolutionStats.yesPct}%
                      </p>
                      <p className="text-xs text-emerald-400 mt-1 font-medium">
                        {resolutionStats.yes} Member Firms
                      </p>
                    </div>

                    {resolutionStats.yesFirms.length > 0 && (
                      <div className="mt-4 flex flex-wrap justify-center gap-1 border-t border-emerald-900/50 pt-3 text-[10px] text-emerald-300">
                        {resolutionStats.yesFirms.map(f => (
                          <span key={f} className="rounded bg-emerald-900/80 px-1.5 py-0.5">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AGAINST */}
                  <div className="flex flex-col justify-between rounded-2xl border border-rose-800/60 bg-rose-950/40 p-6 text-center shadow-sm">
                    <div>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-900/60 text-rose-400">
                        <XCircle className="h-6 w-6" />
                      </div>
                      <h4 className="mt-3 text-lg font-bold text-rose-300">Against</h4>
                      <p className="text-4xl font-extrabold text-white mt-2">
                        {resolutionStats.noPct}%
                      </p>
                      <p className="text-xs text-rose-400 mt-1 font-medium">
                        {resolutionStats.no} Member Firms
                      </p>
                    </div>

                    {resolutionStats.noFirms.length > 0 && (
                      <div className="mt-4 flex flex-wrap justify-center gap-1 border-t border-rose-900/50 pt-3 text-[10px] text-rose-300">
                        {resolutionStats.noFirms.map(f => (
                          <span key={f} className="rounded bg-rose-900/80 px-1.5 py-0.5">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ABSTAIN */}
                  <div className="flex flex-col justify-between rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-center shadow-sm">
                    <div>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                        <MinusCircle className="h-6 w-6" />
                      </div>
                      <h4 className="mt-3 text-lg font-bold text-slate-300">Abstain</h4>
                      <p className="text-4xl font-extrabold text-white mt-2">
                        {resolutionStats.abstainPct}%
                      </p>
                      <p className="text-xs text-slate-400 mt-1 font-medium">
                        {resolutionStats.abstain} Member Firms
                      </p>
                    </div>

                    {resolutionStats.abstainFirms.length > 0 && (
                      <div className="mt-4 flex flex-wrap justify-center gap-1 border-t border-slate-800 pt-3 text-[10px] text-slate-400">
                        {resolutionStats.abstainFirms.map(f => (
                          <span key={f} className="rounded bg-slate-800 px-1.5 py-0.5">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Assembly Governance Majority Indicator */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                  <span className="text-xs uppercase tracking-wider text-slate-400">
                    Governance Status
                  </span>
                  <p className="mt-1 text-base font-semibold">
                    {resolutionStats.yes + resolutionStats.no > 0 ? (
                      resolutionStats.passThreshold ? (
                        <span className="text-emerald-400">
                          ✓ Majority Threshold Reached ({resolutionStats.yes} of{' '}
                          {resolutionStats.yes + resolutionStats.no} active votes in favor)
                        </span>
                      ) : (
                        <span className="text-rose-400">
                          ✗ Simple Majority Not Reached
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400">Awaiting ballots from member firms</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* 3. Rating Scale (1 to 5) */}
            {currentQ.type === 'scale' && scaleStats && (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 shadow-sm">
                <div className="mb-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Average Mean Score
                  </p>
                  <p className="mt-2 text-6xl font-black tracking-tight text-indigo-400">
                    {scaleStats.average}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Out of {scaleStats.max} ({scaleStats.total} member firms voted)
                  </p>
                </div>

                {/* Distribution Bars */}
                <div className="mt-8 flex items-end justify-center gap-4 sm:gap-8 h-48 border-b border-slate-800 pb-4">
                  {Object.entries(scaleStats.distribution).map(([rating, rawCount]) => {
                    const count = Number(rawCount) || 0;
                    const maxCount = Math.max(...Object.values(scaleStats.distribution).map(Number), 1);
                    const heightPercent = scaleStats.total > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <div key={rating} className="flex flex-col items-center gap-2 flex-1 max-w-16">
                        <span className="text-xs font-semibold text-slate-300">{count}</span>
                        <div className="w-full bg-slate-800 rounded-t-lg h-36 flex items-end justify-center p-1">
                          <div
                            className="w-full bg-indigo-500 rounded-t-md transition-all duration-500"
                            style={{ height: `${Math.max(heightPercent, count > 0 ? 8 : 0)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-white">{rating}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex justify-between text-xs text-slate-400">
                  <span>{currentQ.scaleMinLabel || `Min (${scaleStats.min})`}</span>
                  <span>{currentQ.scaleMaxLabel || `Max (${scaleStats.max})`}</span>
                </div>
              </div>
            )}

            {/* 4. Word Cloud */}
            {currentQ.type === 'word_cloud' && (
              <div>
                <WordCloudView votes={currentVotes} />
              </div>
            )}

            {/* 5. Open Ended Cards */}
            {currentQ.type === 'open_ended' && (
              <div>
                {currentVotes.length === 0 ? (
                  <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center text-slate-400">
                    <p className="text-base font-medium">Awaiting member firm responses...</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Entries will appear here as live response cards.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {currentVotes.map(vote => (
                      <div
                        key={vote.id}
                        className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-sm"
                      >
                        <p className="text-sm text-slate-100 font-medium whitespace-pre-wrap">
                          "{String(vote.value)}"
                        </p>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs text-slate-400">
                          <span className="font-semibold text-indigo-300">
                            {vote.memberFirmName}
                          </span>
                          {vote.delegateName && (
                            <span className="text-slate-500">{vote.delegateName}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Presenter Control Dock (Sleek Mentimeter Floating Bar) */}
      <footer className="sticky bottom-0 z-20 border-t border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              id="slide-prev-btn"
              onClick={() => onNavigateSlide(Math.max(0, currentQIndex - 1))}
              disabled={currentQIndex === 0}
              className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                currentQIndex === 0
                  ? 'cursor-not-allowed bg-slate-900 text-slate-600'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 active:bg-slate-600'
              }`}
              title="Previous question"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Quick slide selector */}
            <select
              id="slide-selector"
              value={currentQIndex}
              onChange={e => onNavigateSlide(Number(e.target.value))}
              className="rounded-xl border border-slate-800 bg-slate-900 py-1.5 px-3 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-hidden"
            >
              {room.questions.map((q, idx) => (
                <option key={q.id} value={idx}>
                  {idx + 1}. {q.title.length > 35 ? q.title.substring(0, 35) + '...' : q.title}
                </option>
              ))}
            </select>

            <button
              id="slide-next-btn"
              onClick={() => onNavigateSlide(Math.min(room.questions.length - 1, currentQIndex + 1))}
              disabled={currentQIndex === room.questions.length - 1}
              className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                currentQIndex === room.questions.length - 1
                  ? 'cursor-not-allowed bg-slate-900 text-slate-600'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 active:bg-slate-600'
              }`}
              title="Next question"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            {/* Show / Hide Results Toggle */}
            <button
              id="toggle-results-btn"
              onClick={() => onToggleResults(!room.resultsVisible)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                room.resultsVisible
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-amber-600 text-white hover:bg-amber-500'
              }`}
              title={room.resultsVisible ? 'Hide results from audience' : 'Show results to audience'}
            >
              {room.resultsVisible ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Hide Results</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Show Results</span>
                </>
              )}
            </button>

            {/* Lock / Unlock Voting Toggle */}
            <button
              id="toggle-lock-btn"
              onClick={() => onToggleLock(!room.votingLocked)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                room.votingLocked
                  ? 'bg-rose-600 text-white hover:bg-rose-500'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title={room.votingLocked ? 'Unlock voting' : 'Lock voting (prevent new votes)'}
            >
              {room.votingLocked ? (
                <>
                  <Unlock className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Unlock Voting</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Lock Voting</span>
                </>
              )}
            </button>

            {/* Reset Votes for Question */}
            <button
              id="reset-question-votes-btn"
              onClick={() => {
                if (window.confirm('Reset votes for this question?')) {
                  onResetVotesForQuestion(currentQ.id);
                }
              }}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Clear votes for current slide"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Clear Slide</span>
            </button>

            {/* Fullscreen Button */}
            <button
              id="fullscreen-toggle-btn"
              onClick={handleFullscreen}
              className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
