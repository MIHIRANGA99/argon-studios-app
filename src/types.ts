export type CardType = 'wedding' | 'birthday' | 'business' | 'custom';

export type ParticleEffect = 'rose_petals' | 'golden_sparkles' | 'floating_hearts' | 'stardust' | 'none';

export interface BaseCard {
  id: string;
  type: CardType;
  title: string;
  createdAt: string;
  targetImageUrl: string;
  videoUrl?: string;
  audioUrl?: string;
  effect: ParticleEffect;
  scansCount: number;
}

export interface WeddingCard extends BaseCard {
  type: 'wedding';
  partner1: string;
  partner2: string;
  eventDate: string;
  venueName: string;
  venueMapUrl: string;
  dressCode?: string;
  registryUrl?: string;
  rsvpEnabled: boolean;
  rsvpsCount: number;
}

export interface BirthdayCard extends BaseCard {
  type: 'birthday';
  celebrantName: string;
  ageTurning?: number;
  partyTheme?: string;
  eventDate: string;
  venueName: string;
  venueMapUrl: string;
  rsvpEnabled: boolean;
  rsvpsCount: number;
}

export interface BusinessCard extends BaseCard {
  type: 'business';
  fullName: string;
  jobTitle: string;
  companyName: string;
  tagline?: string;
  phone?: string;
  email?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  calendarBookingUrl?: string;
  vCardsSavedCount: number;
}

export type ARCard = WeddingCard | BirthdayCard | BusinessCard;

export interface RSVPResponse {
  id: string;
  cardId: string;
  guestName: string;
  attending: boolean;
  plusOne: boolean;
  dietary?: string;
  submittedAt: string;
}
