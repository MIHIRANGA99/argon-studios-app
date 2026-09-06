import React, { useState } from 'react';
import { QrCode, Eye, Calendar, Sparkles, Mail, MapPin, Edit3, Printer } from 'lucide-react';
import type { ARCard, CardType } from '../types';

interface CardGridProps {
  cards: ARCard[];
  theme: 'dark' | 'light';
  onSelectCard: (card: ARCard) => void;
  onPreviewAR: (cardId: string) => void;
  onEditCard: (card: ARCard) => void;
  onPrintSheet: (card: ARCard) => void;
}

export const CardGrid: React.FC<CardGridProps> = ({
  cards,
  theme,
  onSelectCard,
  onPreviewAR,
  onEditCard,
  onPrintSheet,
}) => {
  const [filter, setFilter] = useState<'all' | CardType>('all');
  const isDark = theme === 'dark';

  const filteredCards = filter === 'all' ? cards : cards.filter((c) => c.type === filter);

  const getBadgeStyle = (type: CardType) => {
    switch (type) {
      case 'wedding':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'business':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'birthday':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-neutral-700/30 pb-4">
        <h2 className="font-serif-luxury text-2xl font-bold tracking-tight flex items-center gap-2">
          <span>Active AR Campaigns</span>
          <span className="text-xs font-normal text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded-full">
            {cards.length}
          </span>
        </h2>

        <div className="flex items-center gap-2 p-1 rounded-xl bg-neutral-800/40 border border-neutral-700/40 text-xs font-medium">
          {(['all', 'wedding', 'business', 'birthday'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                filter === type
                  ? 'bg-[#D4AF37] text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {type === 'all' ? 'All Cards' : `${type}s`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card) => {
          return (
            <div
              key={card.id}
              className={`rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:border-[#D4AF37]/50 flex flex-col justify-between ${
                isDark ? 'glass-panel-dark' : 'glass-panel-light'
              }`}
            >
              <div className="relative h-48 w-full overflow-hidden bg-neutral-900 group">
                <img
                  src={card.targetImageUrl}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <div className="absolute top-3 left-3">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${getBadgeStyle(
                      card.type
                    )}`}
                  >
                    {card.type}
                  </span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-[#D4AF37] border border-[#D4AF37]/30">
                  <Sparkles className="w-3 h-3" />
                  <span className="capitalize">{card.effect.replace('_', ' ')}</span>
                </div>

                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="font-serif-luxury text-lg font-bold text-white tracking-wide truncate">
                    {card.title}
                  </h3>
                </div>
              </div>

              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="text-xs text-neutral-400 space-y-1.5">
                  {card.type === 'wedding' && (
                    <>
                      <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                        <span>{card.partner1} &amp; {card.partner2}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{new Date(card.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span className="truncate">{card.venueName}</span>
                      </div>
                    </>
                  )}

                  {card.type === 'business' && (
                    <>
                      <div className="text-neutral-200 font-semibold truncate">
                        {card.fullName} — <span className="text-neutral-400 font-normal">{card.jobTitle}</span>
                      </div>
                      <div className="truncate italic text-neutral-400">
                        {card.companyName}
                      </div>
                      {card.email && (
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <Mail className="w-3.5 h-3.5 text-blue-400" />
                          <span className="truncate">{card.email}</span>
                        </div>
                      )}
                    </>
                  )}

                  {card.type === 'birthday' && (
                    <>
                      <div className="text-neutral-200 font-semibold">
                        {card.celebrantName} {card.ageTurning ? `• Turning ${card.ageTurning}!` : ''}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{new Date(card.eventDate).toLocaleDateString()}</span>
                      </div>
                      {card.partyTheme && (
                        <div className="text-amber-300/80 truncate">
                          Theme: {card.partyTheme}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-700/20 text-xs">
                  <span className="text-neutral-400">
                    <strong className="text-[#D4AF37] font-semibold">{card.scansCount}</strong> Scans
                  </span>
                  {(card.type === 'wedding' || card.type === 'birthday') && (
                    <span className="text-neutral-400">
                      <strong className="text-emerald-400 font-semibold">{card.rsvpsCount}</strong> RSVPs
                    </span>
                  )}
                  {card.type === 'business' && (
                    <span className="text-neutral-400">
                      <strong className="text-blue-400 font-semibold">{card.vCardsSavedCount}</strong> Saved
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    onClick={() => onPreviewAR(card.id)}
                    className="flex items-center justify-center gap-1 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#E5C158] text-neutral-950 font-semibold text-xs transition-colors shadow-sm"
                    title="Launch Spatial WebAR"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => onSelectCard(card)}
                    className="flex items-center justify-center gap-1 py-2 rounded-lg border border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 text-[#D4AF37] font-semibold text-xs transition-colors"
                    title="Printable QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR</span>
                  </button>

                  <button
                    onClick={() => onEditCard(card)}
                    className="flex items-center justify-center gap-1 py-2 rounded-lg border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs transition-colors"
                    title="Edit Card Campaign"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => onPrintSheet(card)}
                    className="flex items-center justify-center gap-1 py-2 rounded-lg border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400 font-semibold text-xs transition-colors"
                    title="Print Sheet Generator (Bleed & Crop Marks)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
