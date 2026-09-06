import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { ARCard, CardType, ParticleEffect } from '../types';
import { StorageService } from '../utils/storage';
import { MediaDropzone } from './MediaDropzone';

interface CreateCardWizardProps {
  theme: 'dark' | 'light';
  onCancel: () => void;
  onCreated: (cardId: string) => void;
}

export const CreateCardWizard: React.FC<CreateCardWizardProps> = ({
  theme,
  onCancel,
  onCreated,
}) => {
  const isDark = theme === 'dark';

  const [cardType, setCardType] = useState<CardType>('wedding');
  const [title, setTitle] = useState('');
  const [targetImageUrl, setTargetImageUrl] = useState('https://images.unsplash.com/photo-1519741497674-611481863552?w=800');
  const [videoUrl, setVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [effect, setEffect] = useState<ParticleEffect>('rose_petals');

  // Wedding
  const [partner1, setPartner1] = useState('');
  const [partner2, setPartner2] = useState('');
  const [weddingDate, setWeddingDate] = useState('2026-10-24');
  const [venueName, setVenueName] = useState('');
  const [venueMapUrl, setVenueMapUrl] = useState('');
  const [dressCode, setDressCode] = useState('Black Tie Formal');
  const [registryUrl, setRegistryUrl] = useState('');

  // Birthday
  const [celebrantName, setCelebrantName] = useState('');
  const [ageTurning, setAgeTurning] = useState<number | undefined>(undefined);
  const [partyTheme, setPartyTheme] = useState('');
  const [birthdayDate, setBirthdayDate] = useState('2026-11-15');

  // Business
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [calendarBookingUrl, setCalendarBookingUrl] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `card-${cardType}-${Date.now()}`;

    let newCard: ARCard;

    if (cardType === 'wedding') {
      newCard = {
        id,
        type: 'wedding',
        title: title || `${partner1} & ${partner2}'s Wedding`,
        partner1,
        partner2,
        eventDate: new Date(weddingDate).toISOString(),
        venueName: venueName || 'Grand Ballroom',
        venueMapUrl: venueMapUrl || 'https://maps.google.com',
        dressCode,
        registryUrl,
        rsvpEnabled: true,
        rsvpsCount: 0,
        scansCount: 0,
        createdAt: new Date().toISOString(),
        targetImageUrl,
        videoUrl,
        effect,
      };
    } else if (cardType === 'birthday') {
      newCard = {
        id,
        type: 'birthday',
        title: title || `${celebrantName}'s Birthday Celebration`,
        celebrantName,
        ageTurning,
        partyTheme,
        eventDate: new Date(birthdayDate).toISOString(),
        venueName: venueName || 'Party Venue',
        venueMapUrl: venueMapUrl || 'https://maps.google.com',
        rsvpEnabled: true,
        rsvpsCount: 0,
        scansCount: 0,
        createdAt: new Date().toISOString(),
        targetImageUrl,
        videoUrl,
        effect,
      };
    } else {
      newCard = {
        id,
        type: 'business',
        title: title || `${fullName} | ${companyName}`,
        fullName,
        jobTitle,
        companyName,
        tagline,
        phone,
        email,
        websiteUrl,
        linkedinUrl,
        calendarBookingUrl,
        vCardsSavedCount: 0,
        scansCount: 0,
        createdAt: new Date().toISOString(),
        targetImageUrl,
        videoUrl,
        effect,
      };
    }

    StorageService.addCard(newCard);
    onCreated(id);
  };

  return (
    <div className="max-w-5xl mx-auto py-4 animate-fadeIn">
      <div className="flex items-center justify-between pb-6 border-b border-neutral-700/30">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-neutral-400 hover:text-[#D4AF37] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Cards</span>
        </button>

        <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4AF37]">
          Campaign Creator Wizard
        </span>
      </div>

      <form onSubmit={handleCreate} className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
              1. Select Card Template
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['wedding', 'business', 'birthday'] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => {
                    setCardType(type);
                    if (type === 'wedding') setEffect('rose_petals');
                    if (type === 'business') setEffect('golden_sparkles');
                    if (type === 'birthday') setEffect('stardust');
                  }}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    cardType === type
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-md'
                      : 'border-neutral-700/40 bg-neutral-800/30 hover:border-neutral-500'
                  }`}
                >
                  <span className="block text-lg mb-1">
                    {type === 'wedding' ? '💍' : type === 'business' ? '💼' : '🎂'}
                  </span>
                  <span className="block text-xs font-semibold capitalize">{type}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'glass-panel-dark' : 'glass-panel-light'}`}>
            <h3 className="font-serif-luxury text-lg font-bold text-[#D4AF37]">
              2. Campaign Essentials
            </h3>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Internal Campaign Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Sarah & David's Royal Wedding"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none transition-colors"
              />
            </div>

            {cardType === 'wedding' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Partner 1 Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Sarah Jenkins"
                      value={partner1}
                      onChange={(e) => setPartner1(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Partner 2 Name</label>
                    <input
                      type="text"
                      required
                      placeholder="David Vance"
                      value={partner2}
                      onChange={(e) => setPartner2(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Event Date</label>
                    <input
                      type="date"
                      required
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Dress Code</label>
                    <input
                      type="text"
                      placeholder="Black Tie Formal"
                      value={dressCode}
                      onChange={(e) => setDressCode(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Venue Name &amp; Address</label>
                  <input
                    type="text"
                    required
                    placeholder="The Grand St. Regis Palace, New York"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Google Maps Link</label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/?q=..."
                    value={venueMapUrl}
                    onChange={(e) => setVenueMapUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Registry URL</label>
                  <input
                    type="url"
                    placeholder="https://registry.theknot.com/..."
                    value={registryUrl}
                    onChange={(e) => setRegistryUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </>
            )}

            {cardType === 'business' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Alex Vance"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Job Title</label>
                    <input
                      type="text"
                      required
                      placeholder="Principal Architect"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Company / Agency Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Vance Spatial Design Studio"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Tagline</label>
                  <input
                    type="text"
                    placeholder="Architecting spatial computing environments"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Direct Phone</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 392-8192"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Work Email</label>
                    <input
                      type="email"
                      placeholder="alex@vancedesign.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Website</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full px-2 py-1.5 rounded bg-neutral-900/60 border border-neutral-700/60 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">LinkedIn</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full px-2 py-1.5 rounded bg-neutral-900/60 border border-neutral-700/60 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Calendly</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={calendarBookingUrl}
                      onChange={(e) => setCalendarBookingUrl(e.target.value)}
                      className="w-full px-2 py-1.5 rounded bg-neutral-900/60 border border-neutral-700/60 text-xs text-white"
                    />
                  </div>
                </div>
              </>
            )}

            {cardType === 'birthday' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Celebrant Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Liam"
                      value={celebrantName}
                      onChange={(e) => setCelebrantName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Age Turning</label>
                    <input
                      type="number"
                      placeholder="7"
                      value={ageTurning || ''}
                      onChange={(e) => setAgeTurning(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Birthday Date</label>
                    <input
                      type="date"
                      required
                      value={birthdayDate}
                      onChange={(e) => setBirthdayDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Party Theme</label>
                    <input
                      type="text"
                      placeholder="Galactic Cosmic Space Explorers"
                      value={partyTheme}
                      onChange={(e) => setPartyTheme(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700/60 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'glass-panel-dark' : 'glass-panel-light'}`}>
            <h3 className="font-serif-luxury text-lg font-bold text-[#D4AF37]">
              3. AR Target &amp; Media Layers
            </h3>

            <MediaDropzone
              type="image"
              label="1. Printed Card Artwork (AR Target)"
              accept="image/*"
              value={targetImageUrl}
              onChange={setTargetImageUrl}
              theme={theme}
              maxSizeMB={30}
            />

            <MediaDropzone
              type="video"
              label="2. Augmented Video Texture Overlay"
              accept="video/*"
              value={videoUrl}
              onChange={setVideoUrl}
              theme={theme}
              maxSizeMB={50}
            />

            <div>
              <label className="block text-xs text-neutral-400 mb-2">Ambient 3D Particle Effect</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['rose_petals', 'golden_sparkles', 'floating_hearts', 'stardust'] as const).map((eff) => (
                  <button
                    type="button"
                    key={eff}
                    onClick={() => setEffect(eff)}
                    className={`py-2 px-3 rounded-lg border capitalize transition-all ${
                      effect === eff
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] font-semibold'
                        : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    {eff.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-neutral-950 font-bold text-sm tracking-wide shadow-lg hover:shadow-[#D4AF37]/30 hover:scale-[1.01] transition-all"
              >
                Publish &amp; Generate AR Target
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
