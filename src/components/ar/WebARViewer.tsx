import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, CheckCircle, Navigation, Calendar, Send, Contact2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ARCard } from '../../types';
import { StorageService } from '../../utils/storage';
import { downloadVCard } from '../../utils/vcard';

interface WebARViewerProps {
  card: ARCard;
  onClose: () => void;
}

export const WebARViewer: React.FC<WebARViewerProps> = ({ card, onClose }) => {
  const [isTrackingLocked, setIsTrackingLocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRSVPOpen, setIsRSVPOpen] = useState(false);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [attending, setAttending] = useState(true);
  const [plusOne, setPlusOne] = useState(false);
  const [dietary, setDietary] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    StorageService.recordScan(card.id);

    const timer = setTimeout(() => {
      setIsTrackingLocked(true);
      triggerAmbientParticles(card.effect);
    }, 1200);

    return () => clearTimeout(timer);
  }, [card.id, card.effect]);

  const triggerAmbientParticles = (effect: string) => {
    if (effect === 'rose_petals') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#E11D48', '#FB7185', '#F43F5E', '#FFE4E6'],
      });
    } else if (effect === 'golden_sparkles' || effect === 'stardust') {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#FDE047', '#E5C158', '#FFFFFF'],
      });
    }
  };

  const handleRSVPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    StorageService.recordRSVP({
      id: `rsvp-${Date.now()}`,
      cardId: card.id,
      guestName,
      attending,
      plusOne,
      dietary,
      submittedAt: new Date().toISOString(),
    });

    setRsvpSubmitted(true);
    triggerAmbientParticles('golden_sparkles');
    setTimeout(() => {
      setIsRSVPOpen(false);
      setRsvpSubmitted(false);
    }, 2000);
  };

  const handleDownloadContact = () => {
    if (card.type === 'business') {
      downloadVCard(card);
      StorageService.recordVCardDownload(card.id);
      triggerAmbientParticles('golden_sparkles');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden select-none">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={card.targetImageUrl}
          alt="Tracking surface"
          className="w-full h-full object-cover filter blur-[2px] scale-105 opacity-60"
        />

        {card.videoUrl && (
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-[340px] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl transition-all duration-700 ${
              isTrackingLocked
                ? 'scale-100 opacity-100 border-2 border-[#D4AF37] gold-glow'
                : 'scale-90 opacity-20 border border-white/20'
            }`}
          >
            <video
              ref={videoRef}
              src={card.videoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
            />

            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#D4AF37]/50 text-[10px] font-bold tracking-wider text-[#D4AF37] flex items-center gap-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{isTrackingLocked ? 'AR TARGET LOCKED' : 'SCANNING CARD...'}</span>
            </div>
          </div>
        )}
      </div>

      <header className="relative z-10 p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-sm">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 border border-white/20 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit AR</span>
        </button>

        <div className="text-center">
          <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#D4AF37]">
            ARGON Studios WebAR
          </span>
          <h2 className="font-serif-luxury text-base font-bold text-white tracking-wide truncate max-w-[200px]">
            {card.title}
          </h2>
        </div>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2.5 rounded-full bg-black/50 border border-white/20 text-neutral-300 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#D4AF37]" />}
        </button>
      </header>

      <footer className="relative z-10 p-4 sm:p-6 pb-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center gap-3">
        <div className="w-full max-w-sm flex items-center justify-center gap-2.5">
          {(card.type === 'wedding' || card.type === 'birthday') && card.venueMapUrl && (
            <a
              href={card.venueMapUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-neutral-200 hover:border-[#D4AF37] transition-all"
            >
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>Directions</span>
            </a>
          )}

          {card.type !== 'business' && (
            <button
              onClick={() => setIsRSVPOpen(true)}
              className="flex-[1.4] flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-neutral-950 text-xs font-bold tracking-wide shadow-lg gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Send className="w-4 h-4 fill-neutral-950" />
              <span>RSVP Now</span>
            </button>
          )}

          {card.type === 'business' && (
            <button
              onClick={handleDownloadContact}
              className="flex-[1.4] flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-neutral-950 text-xs font-bold tracking-wide shadow-lg gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Contact2 className="w-4 h-4" />
              <span>Save Contact</span>
            </button>
          )}

          {(card.type === 'wedding' || card.type === 'birthday') && (
            <button
              onClick={() => {
                alert(`Added ${card.title} to calendar for ${new Date(card.eventDate).toLocaleDateString()}!`);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-neutral-200 hover:border-[#D4AF37] transition-all"
            >
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              <span>Calendar</span>
            </button>
          )}
        </div>
      </footer>

      {isRSVPOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-t-3xl p-6 bg-[#131316] border-t border-[#D4AF37]/50 shadow-2xl text-neutral-200">
            {rsvpSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h3 className="font-serif-luxury text-xl font-bold text-white">
                  RSVP Confirmed!
                </h3>
                <p className="text-xs text-neutral-400">
                  We look forward to celebrating with you.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRSVPSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <h3 className="font-serif-luxury text-lg font-bold text-[#D4AF37]">
                    Confirm Attendance
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsRSVPOpen(false)}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAttending(true)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      attending
                        ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400'
                    }`}
                  >
                    Accept with Pleasure
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttending(false)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      !attending
                        ? 'border-rose-500 bg-rose-500/20 text-rose-400'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400'
                    }`}
                  >
                    Declines with Regret
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Jessica Miller"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-sm focus:border-[#D4AF37] outline-none text-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="plusOne"
                    checked={plusOne}
                    onChange={(e) => setPlusOne(e.target.checked)}
                    className="accent-[#D4AF37] w-4 h-4 rounded"
                  />
                  <label htmlFor="plusOne" className="text-xs text-neutral-300 select-none cursor-pointer">
                    Bringing a Plus-One
                  </label>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Dietary Requirements</label>
                  <input
                    type="text"
                    placeholder="Vegan, Halal, Gluten-Free, etc."
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs focus:border-[#D4AF37] outline-none text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-neutral-950 font-bold text-sm tracking-wide shadow-lg hover:brightness-110 transition-all"
                >
                  Send Reply
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
