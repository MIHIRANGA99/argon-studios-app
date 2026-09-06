import type { ARCard, RSVPResponse } from '../types';

const STORAGE_KEY_CARDS = 'argon_studios_cards';
const STORAGE_KEY_RSVPS = 'argon_studios_rsvps';
const STORAGE_KEY_THEME = 'argon_studios_theme';

export const INITIAL_CARDS: ARCard[] = [
  {
    id: 'card-wedding-01',
    type: 'wedding',
    title: "Sarah & David's Royal Wedding",
    partner1: 'Sarah Jenkins',
    partner2: 'David Vance',
    eventDate: '2026-10-24T16:30:00Z',
    venueName: 'The Grand St. Regis Palace, Ballroom',
    venueMapUrl: 'https://maps.google.com/?q=St+Regis+New+York',
    dressCode: 'Black Tie Formal',
    registryUrl: 'https://registry.theknot.com/sarah-david',
    rsvpEnabled: true,
    rsvpsCount: 89,
    scansCount: 342,
    createdAt: '2026-08-15T10:00:00Z',
    targetImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    effect: 'rose_petals'
  },
  {
    id: 'card-business-02',
    type: 'business',
    title: 'Alex Vance | Principal Architect',
    fullName: 'Alex Vance',
    jobTitle: 'Principal Spatial Architect',
    companyName: 'Vance Design Studio',
    tagline: 'Architecting spatial computing environments for tomorrow.',
    phone: '+1 (555) 392-8192',
    email: 'alex@vancedesign.com',
    websiteUrl: 'https://vancedesign.com',
    linkedinUrl: 'https://linkedin.com/in/alexvance',
    calendarBookingUrl: 'https://calendly.com/alexvance/30min',
    vCardsSavedCount: 142,
    scansCount: 620,
    createdAt: '2026-08-20T14:30:00Z',
    targetImageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    effect: 'golden_sparkles'
  },
  {
    id: 'card-birthday-03',
    type: 'birthday',
    title: "Liam's 7th Galaxy Adventure",
    celebrantName: 'Liam',
    ageTurning: 7,
    partyTheme: 'Galactic Astronauts & Cosmic Explorers',
    eventDate: '2026-11-12T14:00:00Z',
    venueName: 'Cosmic Play Center, Arena B',
    venueMapUrl: 'https://maps.google.com/?q=Cosmic+Play+Center',
    rsvpEnabled: true,
    rsvpsCount: 34,
    scansCount: 120,
    createdAt: '2026-08-28T09:15:00Z',
    targetImageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    effect: 'stardust'
  }
];

export const StorageService = {
  getCards(): ARCard[] {
    const data = localStorage.getItem(STORAGE_KEY_CARDS);
    if (!data) {
      this.saveCards(INITIAL_CARDS);
      return INITIAL_CARDS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_CARDS;
    }
  },

  saveCards(cards: ARCard[]) {
    localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards));
  },

  addCard(card: ARCard) {
    const cards = this.getCards();
    cards.unshift(card);
    this.saveCards(cards);
  },

  getCardById(id: string): ARCard | undefined {
    return this.getCards().find((c) => c.id === id);
  },

  recordScan(cardId: string) {
    const cards = this.getCards();
    const target = cards.find((c) => c.id === cardId);
    if (target) {
      target.scansCount += 1;
      this.saveCards(cards);
    }
  },

  recordRSVP(rsvp: RSVPResponse) {
    const existing: RSVPResponse[] = JSON.parse(localStorage.getItem(STORAGE_KEY_RSVPS) || '[]');
    existing.unshift(rsvp);
    localStorage.setItem(STORAGE_KEY_RSVPS, JSON.stringify(existing));

    const cards = this.getCards();
    const card = cards.find((c) => c.id === rsvp.cardId);
    if (card && (card.type === 'wedding' || card.type === 'birthday')) {
      card.rsvpsCount += 1;
      this.saveCards(cards);
    }
  },

  recordVCardDownload(cardId: string) {
    const cards = this.getCards();
    const card = cards.find((c) => c.id === cardId);
    if (card && card.type === 'business') {
      card.vCardsSavedCount += 1;
      this.saveCards(cards);
    }
  },

  getRSVPs(): RSVPResponse[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_RSVPS) || '[]');
    } catch {
      return [];
    }
  },

  getTheme(): 'dark' | 'light' {
    return (localStorage.getItem(STORAGE_KEY_THEME) as 'dark' | 'light') || 'dark';
  },

  setTheme(theme: 'dark' | 'light') {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }
};
