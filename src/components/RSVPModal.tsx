import React, { useState, useEffect } from 'react';
import { X, Download, UserCheck, Users, CheckCircle2, RefreshCw } from 'lucide-react';
import type { ARCard, RSVPResponse } from '../types';
import { StorageService } from '../utils/storage';

interface RSVPModalProps {
  cards: ARCard[];
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export const RSVPModal: React.FC<RSVPModalProps> = ({
  cards,
  isOpen,
  onClose,
  theme
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>('all');
  const [rsvps, setRsvps] = useState<RSVPResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isDark = theme === 'dark';
  const eventCards = cards.filter((c) => c.type === 'wedding' || c.type === 'birthday');

  const loadRSVPs = async () => {
    setIsLoading(true);
    const filterId = selectedCardId === 'all' ? undefined : selectedCardId;
    const data = await StorageService.fetchRSVPsAsync(filterId);
    setRsvps(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadRSVPs();
    }
  }, [isOpen, selectedCardId]);

  if (!isOpen) return null;

  const attendingCount = rsvps.filter((r) => r.attending).length;
  const totalGuests = rsvps.reduce((acc, r) => acc + (r.attending ? (r.plusOne ? 2 : 1) : 0), 0);

  const exportCSV = () => {
    const headers = ['Card Title', 'Guest Name', 'Attending', 'Plus One', 'Dietary Restrictions', 'Submitted At'];
    const rows = rsvps.map((r) => {
      const card = cards.find((c) => c.id === r.cardId);
      return [
        `"${card ? card.title : r.cardId}"`,
        `"${r.guestName}"`,
        r.attending ? 'Yes' : 'No',
        r.plusOne ? 'Yes (+1)' : 'No',
        `"${r.dietary || 'None'}"`,
        `"${new Date(r.submittedAt).toLocaleString()}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `argon-rsvps-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border transition-all ${
          isDark
            ? 'bg-[#121215] border-[#D4AF37]/30 text-white'
            : 'bg-white border-[#D4AF37]/40 text-neutral-900 shadow-[#D4AF37]/10'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-700/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-xl font-bold tracking-wide">
                Guest RSVP Management
              </h3>
              <p className="text-xs text-neutral-400">
                Live multi-device attendance tracker & guest dietary notes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadRSVPs}
              disabled={isLoading}
              title="Refresh RSVPs"
              className="p-2 rounded-lg border border-neutral-700 hover:border-[#D4AF37] text-neutral-400 hover:text-white transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Metric Bar */}
        <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${
          isDark ? 'bg-[#0E0E11] border-neutral-800' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-neutral-400">Filter Event:</label>
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className={`text-xs px-3 py-1.5 rounded-lg border focus:outline-none focus:border-[#D4AF37] ${
                isDark
                  ? 'bg-neutral-900 border-neutral-700 text-neutral-200'
                  : 'bg-white border-neutral-300 text-neutral-800'
              }`}
            >
              <option value="all">All Events</option>
              {eventCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{attendingCount} Confirmed</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#D4AF37]">
              <Users className="w-4 h-4" />
              <span>{totalGuests} Total Seats (w/ +1s)</span>
            </div>
            <button
              onClick={exportCSV}
              disabled={rsvps.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] text-neutral-950 font-bold text-xs shadow hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* RSVP List Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {rsvps.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30 stroke-[1.5]" />
              <p className="text-sm">No guest RSVPs recorded yet.</p>
              <p className="text-xs mt-1 text-neutral-400">
                Guests who submit their RSVP through the WebAR viewer will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-500'}`}>
                    <th className="pb-3 font-semibold">Guest</th>
                    <th className="pb-3 font-semibold">Event</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Plus One</th>
                    <th className="pb-3 font-semibold">Dietary</th>
                    <th className="pb-3 font-semibold text-right">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40">
                  {rsvps.map((rsvp) => {
                    const card = cards.find((c) => c.id === rsvp.cardId);
                    return (
                      <tr key={rsvp.id} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="py-3 font-semibold text-neutral-200">
                          {rsvp.guestName}
                        </td>
                        <td className="py-3 text-neutral-400 truncate max-w-[150px]">
                          {card?.title || rsvp.cardId}
                        </td>
                        <td className="py-3">
                          {rsvp.attending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              Attending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                              Declined
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-neutral-400">
                          {rsvp.plusOne ? '+1 Guest' : 'Solo'}
                        </td>
                        <td className="py-3 text-neutral-400 italic">
                          {rsvp.dietary || 'None'}
                        </td>
                        <td className="py-3 text-right text-neutral-500">
                          {new Date(rsvp.submittedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
