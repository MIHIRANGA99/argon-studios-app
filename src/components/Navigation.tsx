import React, { useState } from 'react';
import { Plus, Sun, Moon, Database, Users, CheckCircle2, HelpCircle } from 'lucide-react';
import { StorageService } from '../utils/storage';

interface NavigationProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeTab: 'cards' | 'new';
  onTabChange: (tab: 'cards' | 'new') => void;
  onOpenRSVPInbox: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  theme,
  onToggleTheme,
  activeTab,
  onTabChange,
  onOpenRSVPInbox
}) => {
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const isDark = theme === 'dark';
  const isCloud = StorageService.isCloudConnected();

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-300 border-b backdrop-blur-xl ${
        isDark
          ? 'bg-[#0A0A0C]/85 border-[#D4AF37]/20 text-[#E5E2E3]'
          : 'bg-[#FBFBFA]/90 border-[#D4AF37]/35 text-[#1A1A1A]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div
          onClick={() => onTabChange('cards')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <img
            src="/brand/logo_2d.jpg"
            alt="ARGON Studios Logo"
            className="w-10 h-10 rounded-lg object-cover border border-[#D4AF37]/50 shadow-md group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="font-serif-luxury text-xl font-bold tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              ARGON <span className="font-script-luxury text-2xl font-normal lowercase tracking-normal -mt-1 text-[#E5E2E3] group-hover:text-[#E11D48] transition-colors">studios</span>
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-neutral-400">
              Spatial Print Atelier
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide">
          <button
            onClick={() => onTabChange('cards')}
            className={`transition-all py-1.5 px-1 relative ${
              activeTab === 'cards'
                ? 'text-[#D4AF37] font-semibold'
                : isDark
                ? 'text-neutral-300 hover:text-[#D4AF37]'
                : 'text-neutral-700 hover:text-[#D4AF37]'
            }`}
          >
            Live AR Cards
            {activeTab === 'cards' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full gold-glow"></span>
            )}
          </button>

          <button
            onClick={onOpenRSVPInbox}
            className={`flex items-center gap-1.5 py-1.5 px-1 transition-all ${
              isDark ? 'text-neutral-300 hover:text-[#D4AF37]' : 'text-neutral-700 hover:text-[#D4AF37]'
            }`}
          >
            <Users className="w-4 h-4 text-[#D4AF37]" />
            <span>RSVP Inbox</span>
          </button>

          {/* Cloud Status Badge */}
          <div className="relative">
            <button
              onClick={() => setShowConfigHelp(!showConfigHelp)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                isCloud
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:border-amber-400'
              }`}
            >
              {isCloud ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Cloud Synced</span>
                </>
              ) : (
                <>
                  <Database className="w-3 h-3 text-amber-400" />
                  <span>Local Mode</span>
                  <HelpCircle className="w-3 h-3 opacity-60 ml-0.5" />
                </>
              )}
            </button>

            {/* Cloud Setup Tooltip Modal */}
            {showConfigHelp && (
              <div className={`absolute top-10 left-0 w-80 p-4 rounded-xl shadow-2xl border text-xs z-50 animate-in fade-in slide-in-from-top-2 ${
                isDark ? 'bg-[#18181C] border-neutral-700 text-neutral-200' : 'bg-white border-neutral-200 text-neutral-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-[#D4AF37]">
                    {isCloud ? 'Supabase Connected' : 'Connect Free Cloud DB'}
                  </span>
                  <button onClick={() => setShowConfigHelp(false)} className="text-neutral-400 hover:text-white">✕</button>
                </div>
                {isCloud ? (
                  <p className="text-neutral-400 leading-relaxed">
                    ARGON Studios is securely connected to Supabase. Cards created on this desktop will sync live to guest phones scanning QR codes.
                  </p>
                ) : (
                  <div className="space-y-2 text-neutral-300">
                    <p>
                      Cards are currently saved in your local browser. To sync live across mobile phones:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-neutral-400">
                      <li>Create a free project at <strong className="text-white">supabase.com</strong></li>
                      <li>Run <strong className="text-white">supabase_schema.sql</strong> in the SQL editor</li>
                      <li>Add your Project URL and anon key to <strong className="text-white">.env</strong></li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
            className={`p-2.5 rounded-full border transition-all ${
              isDark
                ? 'border-neutral-700 bg-neutral-900/80 text-yellow-400 hover:border-[#D4AF37]'
                : 'border-neutral-300 bg-white text-neutral-700 hover:border-[#D4AF37] shadow-sm'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onTabChange('new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-neutral-950 font-semibold text-sm tracking-wide shadow-lg hover:shadow-[#D4AF37]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New AR Card</span>
          </button>
        </div>
      </div>
    </header>
  );
};
