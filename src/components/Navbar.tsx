import React from 'react';
import {
  Monitor,
  Smartphone,
  Columns2,
  Users,
  Settings2,
  QrCode,
  Radio,
  Vote,
  ExternalLink,
} from 'lucide-react';

export type AppMode = 'presenter' | 'participant' | 'split';

interface NavbarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  roomCode: string;
  totalFirms: number;
  claimedFirmsCount: number;
  onOpenQR: () => void;
  onOpenRoster: () => void;
  onOpenSettings: () => void;
  isConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  roomCode,
  totalFirms,
  claimedFirmsCount,
  onOpenQR,
  onOpenRoster,
  onOpenSettings,
  isConnected,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand & Room Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Vote className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 sm:text-base">
                MemberPulse
              </span>
              <span className="hidden rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:inline-block">
                Open Source
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>PIN: <strong className="font-mono text-slate-800">{roomCode}</strong></span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline-flex items-center gap-1">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {isConnected ? 'Real-Time' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <nav className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            id="nav-mode-presenter"
            onClick={() => onSelectMode('presenter')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              currentMode === 'presenter'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Presenter View</span>
            <span className="md:hidden">Stage</span>
          </button>

          <button
            id="nav-mode-participant"
            onClick={() => onSelectMode('participant')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              currentMode === 'participant'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Voter / Delegate</span>
            <span className="md:hidden">Vote</span>
          </button>

          <button
            id="nav-mode-split"
            onClick={() => onSelectMode('split')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              currentMode === 'split'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'hover:text-slate-900'
            }`}
            title="Side-by-side simulator to test firm disappearance between 2 delegates"
          >
            <Columns2 className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Side-by-Side Test</span>
            <span className="sm:hidden">Test</span>
          </button>
        </nav>

        {/* Right Tools & Management */}
        <div className="flex items-center gap-2">
          {/* Quorum / Roster Button */}
          <button
            id="nav-open-roster-btn"
            onClick={onOpenRoster}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100 transition"
            title="Open Member Firm Roster & Quorum"
          >
            <Users className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden lg:inline">Quorum:</span>
            <span className="font-bold text-slate-900">{claimedFirmsCount}/{totalFirms}</span>
          </button>

          {/* QR Code Button */}
          <button
            id="nav-open-qr-btn"
            onClick={onOpenQR}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:border-slate-300 hover:bg-slate-100 transition"
            title="Scan QR Code to Join"
          >
            <QrCode className="h-4 w-4 text-slate-700" />
          </button>

          {/* Poll Builder / Settings Button */}
          <button
            id="nav-open-settings-btn"
            onClick={onOpenSettings}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:border-slate-300 hover:bg-slate-100 transition"
            title="Poll Builder & Session Settings"
          >
            <Settings2 className="h-4 w-4 text-slate-700" />
          </button>
        </div>
      </div>
    </header>
  );
};
