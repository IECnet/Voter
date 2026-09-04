import React, { useState, useMemo } from 'react';
import { MemberFirm } from '../types';
import { Building2, Search, CheckCircle2, User, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface MemberFirmCheckInProps {
  memberFirms: MemberFirm[];
  currentSessionId: string;
  onClaimFirm: (firmId: string, delegateName: string) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

export const MemberFirmCheckIn: React.FC<MemberFirmCheckInProps> = ({
  memberFirms,
  currentSessionId,
  onClaimFirm,
  isSubmitting,
  errorMessage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFirmId, setSelectedFirmId] = useState<string>('');
  const [delegateName, setDelegateName] = useState('');
  const [showClaimedFirms, setShowClaimedFirms] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // KEY REQUIREMENT: Filter out firms that have already been chosen!
  // If a firm is claimed by another session, it NO LONGER APPEARS in the available list.
  const availableFirms = useMemo(() => {
    return memberFirms.filter(firm => {
      // If it's not claimed, or it's claimed by the current session, it's available for this user
      const isUnclaimed = !firm.claimedBySessionId;
      const isMine = firm.claimedBySessionId === currentSessionId;
      return isUnclaimed || isMine;
    });
  }, [memberFirms, currentSessionId]);

  // Already claimed firms for inspection/transparency
  const claimedFirms = useMemo(() => {
    return memberFirms.filter(firm => firm.claimedBySessionId && firm.claimedBySessionId !== currentSessionId);
  }, [memberFirms, currentSessionId]);

  // Filtered available firms by search query
  const filteredAvailableFirms = useMemo(() => {
    if (!searchTerm.trim()) return availableFirms;
    const term = searchTerm.toLowerCase();
    return availableFirms.filter(
      f => f.name.toLowerCase().includes(term) || (f.country && f.country.toLowerCase().includes(term))
    );
  }, [availableFirms, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!selectedFirmId) {
      setLocalError('Please select your member firm from the list before voting.');
      return;
    }

    const res = await onClaimFirm(selectedFirmId, delegateName);
    if (!res.success && res.error) {
      setLocalError(res.error);
    }
  };

  const selectedFirm = memberFirms.find(f => f.id === selectedFirmId);

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Header with governance icon */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Accreditation Check
              </span>
              <span className="text-xs text-slate-500">One Vote per Member Firm</span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Select Your Member Firm
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Please identify your accredited member firm before casting votes. Once your firm is chosen, it will no longer appear for other attendees to prevent duplicate voting.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {(localError || errorMessage) && (
          <div
            id="checkin-error-alert"
            className="mt-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold">Selection Notice</p>
              <p className="mt-0.5">{localError || errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Delegate Name Input */}
          <div>
            <label
              htmlFor="delegate-name-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Voting Delegate Name (Optional)
            </label>
            <div className="relative mt-1.5">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="delegate-name-input"
                type="text"
                value={delegateName}
                onChange={e => setDelegateName(e.target.value)}
                placeholder="e.g., Sarah Jenkins (Managing Partner)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Member Firm Search & List */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="firm-search-input"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Available Member Firms ({availableFirms.length} remaining)
              </label>
              {claimedFirms.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClaimedFirms(!showClaimedFirms)}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {showClaimedFirms ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" /> Hide claimed ({claimedFirms.length})
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" /> Show claimed ({claimedFirms.length})
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative mt-1.5">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="firm-search-input"
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by firm name or country..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* List of Available Firms */}
            <div
              id="available-firms-list"
              className="mt-3 max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2"
            >
              {filteredAvailableFirms.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  {searchTerm ? (
                    <>
                      No matching available member firm found for "{searchTerm}".
                      <p className="mt-1 text-xs text-slate-400">
                        If your firm was already selected by a colleague, it will not appear in this list.
                      </p>
                    </>
                  ) : (
                    <>
                      All member firms in the roster have already been claimed!
                      <p className="mt-1 text-xs text-slate-400">
                        Contact the session chair if you require a firm reassignment.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                filteredAvailableFirms.map(firm => {
                  const isSelected = selectedFirmId === firm.id;
                  return (
                    <div
                      key={firm.id}
                      id={`firm-option-${firm.id}`}
                      onClick={() => {
                        setSelectedFirmId(firm.id);
                        setLocalError(null);
                      }}
                      className={`group flex cursor-pointer items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-xs'
                          : 'border-transparent bg-white hover:border-slate-300 hover:bg-slate-100/70 text-slate-850'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                          }`}
                        >
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{firm.name}</p>
                          {firm.country && (
                            <p className="text-xs text-slate-500">{firm.country}</p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        {isSelected ? (
                          <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-slate-300 group-hover:border-slate-400" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Notice explaining disappearance rule */}
            <p className="mt-2 text-xs text-slate-500">
              * Notice: Once you click confirm, <strong className="text-slate-700">{selectedFirm ? selectedFirm.name : 'your chosen firm'}</strong> will disappear from the list for all other delegates.
            </p>
          </div>

          {/* Already Claimed / Unavailable Firms Drawer (for transparency) */}
          {showClaimedFirms && claimedFirms.length > 0 && (
            <div
              id="already-claimed-firms-panel"
              className="rounded-xl border border-slate-200 bg-slate-100/70 p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Already Claimed / Unavailable ({claimedFirms.length} firms)
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                These firms have already been selected by other attendees and cannot be chosen again:
              </p>
              <div className="mt-2 max-h-36 space-y-1 overflow-y-auto text-xs">
                {claimedFirms.map(f => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5 text-slate-600 border border-slate-200/60"
                  >
                    <span className="font-medium text-slate-800 line-through opacity-75">{f.name}</span>
                    <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      {f.delegateName ? `Claimed by ${f.delegateName}` : 'Claimed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            id="confirm-member-firm-btn"
            type="submit"
            disabled={!selectedFirmId || isSubmitting}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold shadow-xs transition ${
              !selectedFirmId || isSubmitting
                ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
            }`}
          >
            {isSubmitting ? (
              <span>Verifying firm credential...</span>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {selectedFirm
                    ? `Confirm as ${selectedFirm.name} & Vote`
                    : 'Select a Member Firm Above'}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
