import React, { useState } from 'react';
import { X, Save, Sparkles, CheckCircle2 } from 'lucide-react';
import type { ARCard, ParticleEffect } from '../types';
import { StorageService } from '../utils/storage';
import { MediaDropzone } from './MediaDropzone';

interface EditCardModalProps {
  card: ARCard;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  theme: 'dark' | 'light';
}

export const EditCardModal: React.FC<EditCardModalProps> = ({
  card,
  isOpen,
  onClose,
  onUpdated,
  theme
}) => {
  const isDark = theme === 'dark';

  // Common fields
  const [title, setTitle] = useState(card.title);
  const [targetImageUrl, setTargetImageUrl] = useState(card.targetImageUrl);
  const [videoUrl, setVideoUrl] = useState(card.videoUrl || '');
  const [effect, setEffect] = useState<ParticleEffect>(card.effect);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Wedding fields
  const [partner1, setPartner1] = useState(card.type === 'wedding' ? card.partner1 : '');
  const [partner2, setPartner2] = useState(card.type === 'wedding' ? card.partner2 : '');
  const [weddingDate, setWeddingDate] = useState(
    card.type === 'wedding' ? card.eventDate.split('T')[0] : '2026-10-24'
  );
  const [venueName, setVenueName] = useState(
    card.type === 'wedding' || card.type === 'birthday' ? card.venueName : ''
  );
  const [venueMapUrl, setVenueMapUrl] = useState(
    card.type === 'wedding' || card.type === 'birthday' ? card.venueMapUrl : ''
  );
  const [dressCode, setDressCode] = useState(card.type === 'wedding' ? card.dressCode || '' : '');
  const [registryUrl, setRegistryUrl] = useState(
    card.type === 'wedding' ? card.registryUrl || '' : ''
  );

  // Birthday fields
  const [celebrantName, setCelebrantName] = useState(
    card.type === 'birthday' ? card.celebrantName : ''
  );
  const [ageTurning, setAgeTurning] = useState<number | undefined>(
    card.type === 'birthday' ? card.ageTurning : undefined
  );
  const [partyTheme, setPartyTheme] = useState(
    card.type === 'birthday' ? card.partyTheme || '' : ''
  );
  const [birthdayDate, setBirthdayDate] = useState(
    card.type === 'birthday' ? card.eventDate.split('T')[0] : '2026-11-15'
  );

  // Business fields
  const [fullName, setFullName] = useState(card.type === 'business' ? card.fullName : '');
  const [jobTitle, setJobTitle] = useState(card.type === 'business' ? card.jobTitle : '');
  const [companyName, setCompanyName] = useState(
    card.type === 'business' ? card.companyName : ''
  );
  const [tagline, setTagline] = useState(card.type === 'business' ? card.tagline || '' : '');
  const [phone, setPhone] = useState(card.type === 'business' ? card.phone || '' : '');
  const [email, setEmail] = useState(card.type === 'business' ? card.email || '' : '');
  const [websiteUrl, setWebsiteUrl] = useState(
    card.type === 'business' ? card.websiteUrl || '' : ''
  );
  const [linkedinUrl, setLinkedinUrl] = useState(
    card.type === 'business' ? card.linkedinUrl || '' : ''
  );
  const [calendarBookingUrl, setCalendarBookingUrl] = useState(
    card.type === 'business' ? card.calendarBookingUrl || '' : ''
  );

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    let updatedCard: ARCard;

    if (card.type === 'wedding') {
      updatedCard = {
        ...card,
        title: title.trim(),
        targetImageUrl,
        videoUrl: videoUrl.trim() || undefined,
        effect,
        partner1,
        partner2,
        eventDate: new Date(weddingDate).toISOString(),
        venueName,
        venueMapUrl,
        dressCode: dressCode || undefined,
        registryUrl: registryUrl || undefined
      };
    } else if (card.type === 'birthday') {
      updatedCard = {
        ...card,
        title: title.trim(),
        targetImageUrl,
        videoUrl: videoUrl.trim() || undefined,
        effect,
        celebrantName,
        ageTurning: ageTurning ? Number(ageTurning) : undefined,
        partyTheme: partyTheme || undefined,
        eventDate: new Date(birthdayDate).toISOString(),
        venueName,
        venueMapUrl
      };
    } else {
      updatedCard = {
        ...card,
        title: title.trim(),
        targetImageUrl,
        videoUrl: videoUrl.trim() || undefined,
        effect,
        fullName,
        jobTitle,
        companyName,
        tagline: tagline || undefined,
        phone: phone || undefined,
        email: email || undefined,
        websiteUrl: websiteUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        calendarBookingUrl: calendarBookingUrl || undefined
      };
    }

    await StorageService.updateCard(updatedCard);
    setIsSaving(false);
    setShowSavedToast(true);

    setTimeout(() => {
      setShowSavedToast(false);
      onUpdated();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${
          isDark ? 'bg-[#121215] border-[#D4AF37]/40 text-white' : 'bg-white border-[#D4AF37]/50 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-700/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-luxury text-xl font-bold tracking-wide">
                  Edit AR Card Campaign
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                  {card.type}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Campaign ID: <strong className="text-neutral-300">{card.id}</strong> (QR Code and links remain unchanged)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {showSavedToast && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Card updated successfully! Synced across devices.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Event & Text Details */}
            <div className="space-y-4">
              <h4 className="font-serif-luxury text-sm font-bold text-[#D4AF37] uppercase tracking-wider border-b border-neutral-700/30 pb-2">
                1. Campaign Details
              </h4>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Card Display Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Wedding Fields */}
              {card.type === 'wedding' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Partner 1</label>
                      <input
                        type="text"
                        required
                        value={partner1}
                        onChange={(e) => setPartner1(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Partner 2</label>
                      <input
                        type="text"
                        required
                        value={partner2}
                        onChange={(e) => setPartner2(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Wedding Date</label>
                    <input
                      type="date"
                      required
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Venue Location</label>
                    <input
                      type="text"
                      required
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Google Maps Venue URL</label>
                    <input
                      type="url"
                      value={venueMapUrl}
                      onChange={(e) => setVenueMapUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Dress Code</label>
                      <input
                        type="text"
                        value={dressCode}
                        onChange={(e) => setDressCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Gift Registry URL</label>
                      <input
                        type="url"
                        value={registryUrl}
                        onChange={(e) => setRegistryUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Birthday Fields */}
              {card.type === 'birthday' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Celebrant Name</label>
                      <input
                        type="text"
                        required
                        value={celebrantName}
                        onChange={(e) => setCelebrantName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Milestone Age</label>
                      <input
                        type="number"
                        value={ageTurning || ''}
                        onChange={(e) => setAgeTurning(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Party Theme</label>
                    <input
                      type="text"
                      value={partyTheme}
                      onChange={(e) => setPartyTheme(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Party Date</label>
                    <input
                      type="date"
                      required
                      value={birthdayDate}
                      onChange={(e) => setBirthdayDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Venue Location</label>
                    <input
                      type="text"
                      required
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </>
              )}

              {/* Business Fields */}
              {card.type === 'business' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Job Title</label>
                      <input
                        type="text"
                        required
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Company Name</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Tagline</label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Website URL</label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">LinkedIn URL</label>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Calendar Booking URL</label>
                      <input
                        type="url"
                        value={calendarBookingUrl}
                        onChange={(e) => setCalendarBookingUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Particle Effect Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Ambient 3D Particle Effect
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(['rose_petals', 'golden_sparkles', 'floating_hearts', 'stardust'] as const).map((eff) => (
                    <button
                      type="button"
                      key={eff}
                      onClick={() => setEffect(eff)}
                      className={`py-2 px-3 rounded-lg border capitalize transition-all ${
                        effect === eff
                          ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37] font-semibold'
                          : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      {eff.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Media Layers (Dropzones) */}
            <div className="space-y-4">
              <h4 className="font-serif-luxury text-sm font-bold text-[#D4AF37] uppercase tracking-wider border-b border-neutral-700/30 pb-2">
                2. Target & Video Media
              </h4>

              <MediaDropzone
                type="image"
                label="Printed Card Artwork (AR Target)"
                accept="image/*"
                value={targetImageUrl}
                onChange={setTargetImageUrl}
                theme={theme}
                maxSizeMB={30}
              />

              <MediaDropzone
                type="video"
                label="Augmented Video Texture (MP4/WebM)"
                accept="video/*"
                value={videoUrl}
                onChange={setVideoUrl}
                theme={theme}
                maxSizeMB={50}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-700/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-neutral-700 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-neutral-950 font-bold text-xs shadow-lg gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save & Update Campaign'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};