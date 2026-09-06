import type { ARCard, RSVPResponse } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

function mapDbToCard(row: any): ARCard {
  const custom = row.custom_data || {};
  const base = {
    id: row.id,
    type: row.type,
    title: row.title,
    createdAt: row.created_at || new Date().toISOString(),
    targetImageUrl: row.target_image_url,
    videoUrl: row.video_url || undefined,
    audioUrl: row.audio_url || undefined,
    effect: row.effect,
    scansCount: row.scans_count || 0,
    ...custom
  };
  return base as ARCard;
}

function mapCardToDb(card: ARCard) {
  const { id, type, title, createdAt, targetImageUrl, videoUrl, audioUrl, effect, scansCount, ...customData } = card as any;
  return {
    id,
    title,
    type,
    target_image_url: targetImageUrl,
    video_url: videoUrl || null,
    audio_url: audioUrl || null,
    effect: effect || 'golden_sparkles',
    scans_count: scansCount || 0,
    created_at: createdAt || new Date().toISOString(),
    custom_data: customData
  };
}

function mapDbToRSVP(row: any): RSVPResponse {
  return {
    id: row.id,
    cardId: row.card_id,
    guestName: row.guest_name,
    attending: row.attending,
    plusOne: row.plus_one,
    dietary: row.dietary || '',
    submittedAt: row.submitted_at || new Date().toISOString()
  };
}

export const StorageService = {
  isCloudConnected(): boolean {
    return isSupabaseConfigured();
  },

  getCards(): ARCard[] {
    const data = localStorage.getItem(STORAGE_KEY_CARDS);
    if (!data) {
      this.saveCardsLocal(INITIAL_CARDS);
      return INITIAL_CARDS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_CARDS;
    }
  },

  saveCardsLocal(cards: ARCard[]) {
    localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards));
  },

  async fetchCardsAsync(): Promise<ARCard[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('argon_cards')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const cards = data.map(mapDbToCard);
          this.saveCardsLocal(cards);
          return cards;
        }
      } catch (err) {
        console.warn('Supabase fetch cards failed, falling back to local storage:', err);
      }
    }
    return this.getCards();
  },

  async updateCard(card: ARCard): Promise<void> {
    const cards = this.getCards();
    const index = cards.findIndex((c) => c.id === card.id);
    if (index !== -1) {
      cards[index] = card;
      this.saveCardsLocal(cards);
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const dbRow = mapCardToDb(card);
        await supabase.from('argon_cards').upsert(dbRow);
      } catch (err) {
        console.error('Failed to sync updated card to Supabase:', err);
      }
    }
  },

  async addCard(card: ARCard): Promise<void> {
    const cards = this.getCards();
    cards.unshift(card);
    this.saveCardsLocal(cards);

    if (isSupabaseConfigured() && supabase) {
      try {
        const dbRow = mapCardToDb(card);
        await supabase.from('argon_cards').upsert(dbRow);
      } catch (err) {
        console.error('Failed to sync new card to Supabase:', err);
      }
    }
  },

  async deleteCard(id: string): Promise<void> {
    const cards = this.getCards().filter((c) => c.id !== id);
    this.saveCardsLocal(cards);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('argon_cards').delete().eq('id', id);
      } catch (err) {
        console.error('Failed to delete card from Supabase:', err);
      }
    }
  },

  getCardById(id: string): ARCard | undefined {
    return this.getCards().find((c) => c.id === id);
  },

  async fetchCardByIdAsync(id: string): Promise<ARCard | undefined> {
    const local = this.getCardById(id);
    if (local) return local;

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('argon_cards')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          const fetchedCard = mapDbToCard(data);
          const all = this.getCards();
          all.unshift(fetchedCard);
          this.saveCardsLocal(all);
          return fetchedCard;
        }
      } catch (err) {
        console.warn('Failed to fetch card from Supabase:', err);
      }
    }
    return undefined;
  },

  async recordScan(cardId: string) {
    const cards = this.getCards();
    const target = cards.find((c) => c.id === cardId);
    if (target) {
      target.scansCount += 1;
      this.saveCardsLocal(cards);
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        // Record scan event
        await supabase.from('argon_scans').insert({
          card_id: cardId,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
        });

        if (target) {
          await supabase
            .from('argon_cards')
            .update({ scans_count: target.scansCount })
            .eq('id', cardId);
        }
      } catch (err) {
        console.warn('Could not record scan in Supabase:', err);
      }
    }
  },

  async recordRSVP(rsvp: RSVPResponse) {
    const existing: RSVPResponse[] = JSON.parse(localStorage.getItem(STORAGE_KEY_RSVPS) || '[]');
    existing.unshift(rsvp);
    localStorage.setItem(STORAGE_KEY_RSVPS, JSON.stringify(existing));

    const cards = this.getCards();
    const card = cards.find((c) => c.id === rsvp.cardId);
    if (card && (card.type === 'wedding' || card.type === 'birthday')) {
      card.rsvpsCount += 1;
      this.saveCardsLocal(cards);
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('argon_rsvps').insert({
          id: rsvp.id,
          card_id: rsvp.cardId,
          guest_name: rsvp.guestName,
          attending: rsvp.attending,
          plus_one: rsvp.plusOne,
          dietary: rsvp.dietary || null,
          submitted_at: rsvp.submittedAt
        });

        if (card && (card.type === 'wedding' || card.type === 'birthday')) {
          const custom = (card as any);
          await supabase
            .from('argon_cards')
            .update({
              custom_data: {
                ...custom,
                rsvpsCount: card.rsvpsCount
              }
            })
            .eq('id', card.id);
        }
      } catch (err) {
        console.error('Failed to sync RSVP to Supabase:', err);
      }
    }
  },

  recordVCardDownload(cardId: string) {
    const cards = this.getCards();
    const card = cards.find((c) => c.id === cardId);
    if (card && card.type === 'business') {
      card.vCardsSavedCount += 1;
      this.saveCardsLocal(cards);
    }
  },

  getRSVPs(): RSVPResponse[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_RSVPS) || '[]');
    } catch {
      return [];
    }
  },

  async fetchRSVPsAsync(cardId?: string): Promise<RSVPResponse[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase.from('argon_rsvps').select('*').order('submitted_at', { ascending: false });
        if (cardId) {
          query = query.eq('card_id', cardId);
        }
        const { data, error } = await query;
        if (!error && data) {
          return data.map(mapDbToRSVP);
        }
      } catch (err) {
        console.warn('Failed to fetch RSVPs from Supabase:', err);
      }
    }
    const local = this.getRSVPs();
    return cardId ? local.filter((r) => r.cardId === cardId) : local;
  },

  getTheme(): 'dark' | 'light' {
    return (localStorage.getItem(STORAGE_KEY_THEME) as 'dark' | 'light') || 'dark';
  },

  setTheme(theme: 'dark' | 'light') {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }
};
