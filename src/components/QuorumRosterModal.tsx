import React, { useState } from 'react';
import { MemberFirm, PollRoom } from '../types';
import {
  X,
  Building2,
  Users,
  Plus,
  RotateCcw,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';

interface QuorumRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: PollRoom;
  onAddFirm: (name: string, country: string) => void;
  onBulkImport: (rawText: string) => void;
  onReleaseFirmClaim: (firmId: string) => void;
  onResetAllClaims: () => void;
  onExportCSV: () => void;
}

export const QuorumRosterModal: React.FC<QuorumRosterModalProps> = ({
  isOpen,
  onClose,
  room,
  onAddFirm,
  onBulkImport,
  onReleaseFirmClaim,
  onResetAllClaims,
  onExportCSV,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'claimed' | 'available'>('all');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [newFirmName, setNewFirmName] = useState('');
  const [newFirmCountry, setNewFirmCountry] = useState('');

  if (!isOpen) return null;

  const totalFirms = room.memberFirms.length;
  const claimedFirms = room.memberFirms.filter(f => f.claimedBySessionId);
  const claimedCount = claimedFirms.length;
  const quorumPct = totalFirms > 0 ? Math.round((claimedCount / totalFirms) * 100) : 0;

  // Filter firms
  const filteredFirms = room.memberFirms.filter(firm => {
    const matchesSearch =
      firm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (firm.country && firm.country.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (filter === 'claimed') return !!firm.claimedBySessionId;
    if (filter === 'available') return !firm.claimedBySessionId;
    return true;
  });

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirmName.trim()) return;
    onAddFirm(newFirmName.trim(), newFirmCountry.trim());
    setNewFirmName('');
    setNewFirmCountry('');
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;
    onBulkImport(bulkText.trim());
    setBulkText('');
    setShowBulkAdd(false);
  };

  return (
    <div
      id="quorum-roster-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="quorum-roster-modal-content"
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Member Firm Quorum & Roster</h3>
              <p className="text-xs text-slate-500">
                Live delegation attendance, accreditation verification & voting credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quorum Metric Bar */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Assembly Quorum
                </span>
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                  {quorumPct}% Present
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {claimedCount} of {totalFirms} Member Firms represented
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onExportCSV}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Export Roll Call (CSV)</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Reset all member firm claims? Participants will be required to re-check-in.')) {
                    onResetAllClaims();
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Claims</span>
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${quorumPct}%` }}
            />
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Controls: Search, Filters, Add toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search firms or countries..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Filter tabs */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-lg px-2.5 py-1 transition ${
                  filter === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                All ({totalFirms})
              </button>
              <button
                onClick={() => setFilter('claimed')}
                className={`rounded-lg px-2.5 py-1 transition ${
                  filter === 'claimed' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Checked In ({claimedCount})
              </button>
              <button
                onClick={() => setFilter('available')}
                className={`rounded-lg px-2.5 py-1 transition ${
                  filter === 'available' ? 'bg-white text-slate-800 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Pending ({totalFirms - claimedCount})
              </button>
            </div>

            {/* Toggle Add Firm / Bulk Import */}
            <button
              onClick={() => setShowBulkAdd(!showBulkAdd)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showBulkAdd ? 'Hide Add Panel' : 'Add / Import Firms'}</span>
            </button>
          </div>

          {/* Add / Bulk Import Drawer */}
          {showBulkAdd && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
              <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Add Member Firms to Roster
              </p>

              {/* Single add */}
              <form onSubmit={handleAddSingle} className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={newFirmName}
                  onChange={e => setNewFirmName(e.target.value)}
                  placeholder="Firm Name (e.g. Dupont & Associés)"
                  className="flex-1 min-w-[200px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
                <input
                  type="text"
                  value={newFirmCountry}
                  onChange={e => setNewFirmCountry(e.target.value)}
                  placeholder="Country (e.g. France)"
                  className="w-36 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!newFirmName.trim()}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add Firm
                </button>
              </form>

              {/* Bulk paste */}
              <form onSubmit={handleBulkSubmit} className="pt-2 border-t border-indigo-200/60">
                <label className="block text-[11px] font-semibold text-indigo-800 mb-1">
                  Or Bulk Import (paste one firm per line, optionally with "Firm Name, Country"):
                </label>
                <textarea
                  rows={3}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  placeholder="Grant & Co, United Kingdom&#10;Müller & Partner, Germany&#10;Tokyo Horizon Advisory, Japan"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!bulkText.trim()}
                  className="mt-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Import All Lines
                </button>
              </form>
            </div>
          )}

          {/* Roster Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">Member Firm Name</th>
                  <th className="py-2.5 px-3">Country</th>
                  <th className="py-2.5 px-3">Accreditation Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredFirms.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No member firms match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredFirms.map(firm => {
                    const isClaimed = !!firm.claimedBySessionId;
                    return (
                      <tr
                        key={firm.id}
                        className={`hover:bg-slate-50/80 transition ${
                          isClaimed ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span>{firm.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{firm.country || '—'}</td>
                        <td className="py-3 px-3">
                          {isClaimed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>
                                Checked In {firm.delegateName ? `(${firm.delegateName})` : ''}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span>Available (Pending)</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isClaimed && (
                            <button
                              onClick={() => onReleaseFirmClaim(firm.id)}
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition"
                              title="Release claim if delegate entered incorrectly"
                            >
                              Release
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>* Each accredited firm receives exactly 1 vote per question.</span>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
