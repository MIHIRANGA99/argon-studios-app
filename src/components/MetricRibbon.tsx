import React from 'react';
import { Layers, Scan, UserCheck, Contact2 } from 'lucide-react';
import type { ARCard } from '../types';

interface MetricRibbonProps {
  cards: ARCard[];
  theme: 'dark' | 'light';
}

export const MetricRibbon: React.FC<MetricRibbonProps> = ({ cards, theme }) => {
  const isDark = theme === 'dark';

  const totalCards = cards.length;
  const totalScans = cards.reduce((acc, c) => acc + c.scansCount, 0);
  const totalRSVPs = cards.reduce((acc, c) => acc + (c.type === 'wedding' || c.type === 'birthday' ? c.rsvpsCount : 0), 0);
  const totalVCards = cards.reduce((acc, c) => acc + (c.type === 'business' ? c.vCardsSavedCount : 0), 0);

  const items = [
    {
      label: 'Active AR Cards',
      value: totalCards,
      change: '+12% this month',
      icon: Layers,
      color: '#D4AF37',
    },
    {
      label: 'Total Guest Scans',
      value: totalScans.toLocaleString(),
      change: 'Across all events',
      icon: Scan,
      color: '#E11D48',
    },
    {
      label: 'Confirmed RSVPs',
      value: totalRSVPs.toLocaleString(),
      change: '84.6% avg conversion',
      icon: UserCheck,
      color: '#10B981',
    },
    {
      label: 'vCards Saved',
      value: totalVCards.toLocaleString(),
      change: 'Direct contacts saved',
      icon: Contact2,
      color: '#3B82F6',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
      {items.map((m, idx) => {
        const Icon = m.icon;
        return (
          <div
            key={idx}
            className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${
              isDark ? 'glass-panel-dark' : 'glass-panel-light'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
                {m.label}
              </span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${m.color}15`, color: m.color }}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-serif-luxury text-3xl font-bold tracking-tight text-[#D4AF37]">
                {m.value}
              </span>
            </div>

            <p className="mt-1 text-[11px] text-neutral-400 font-medium tracking-wide">
              {m.change}
            </p>
          </div>
        );
      })}
    </div>
  );
};
