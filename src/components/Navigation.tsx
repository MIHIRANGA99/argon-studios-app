import React from 'react';
import { Plus, Sun, Moon, Bell } from 'lucide-react';

interface NavigationProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeTab: 'cards' | 'new';
  onTabChange: (tab: 'cards' | 'new') => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  theme,
  onToggleTheme,
  activeTab,
  onTabChange,
}) => {
  const isDark = theme === 'dark';

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
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
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
          <span className="text-xs text-neutral-400 cursor-not-allowed opacity-60">Analytics</span>
          <span className="text-xs text-neutral-400 cursor-not-allowed opacity-60">Templates</span>
          <span className="text-xs text-neutral-400 cursor-not-allowed opacity-60">Clients</span>
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

          <div className="hidden sm:flex relative p-2.5 rounded-full border border-neutral-700/50 text-neutral-400">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E11D48] rounded-full"></span>
          </div>

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
