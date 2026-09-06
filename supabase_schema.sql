-- =========================================================
-- ARGON Studios: Spatial Print & WebAR Platform
-- Database Migration Script for Supabase (PostgreSQL)
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- =========================================================

-- 1. Create Cards Table
CREATE TABLE IF NOT EXISTS argon_cards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('wedding', 'birthday', 'business')),
    target_image_url TEXT NOT NULL,
    video_url TEXT,
    audio_url TEXT,
    effect TEXT NOT NULL DEFAULT 'golden_sparkles',
    theme TEXT NOT NULL DEFAULT 'gold',
    custom_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    scans_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create RSVPs Table
CREATE TABLE IF NOT EXISTS argon_rsvps (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES argon_cards(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    attending BOOLEAN NOT NULL DEFAULT TRUE,
    plus_one BOOLEAN NOT NULL DEFAULT FALSE,
    dietary TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Scans / Analytics Table
CREATE TABLE IF NOT EXISTS argon_scans (
    id BIGSERIAL PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES argon_cards(id) ON DELETE CASCADE,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE argon_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE argon_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE argon_scans ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Public Read/Write for seamless guest QR scanning without login)
CREATE POLICY "Public Read Cards" ON argon_cards FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Cards" ON argon_cards FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public Read RSVPs" ON argon_rsvps FOR SELECT USING (true);
CREATE POLICY "Public Insert RSVPs" ON argon_rsvps FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Insert Scans" ON argon_scans FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Scans" ON argon_scans FOR SELECT USING (true);

-- 6. Insert Starter Seed Cards (if empty)
INSERT INTO argon_cards (id, title, type, target_image_url, video_url, audio_url, effect, theme, custom_data, scans_count)
VALUES
(
    'card-wedding-01',
    'Alexander & Elena Wedding',
    'wedding',
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://actions.google.com/sounds/v1/ambiences/outdoor_ambience.ogg',
    'rose_petals',
    'gold',
    '{
        "partner1": "Alexander Vance",
        "partner2": "Elena Rostova",
        "date": "2026-10-18",
        "venue": "Villa Ephrussi de Rothschild, French Riviera",
        "venueMapUrl": "https://maps.google.com",
        "rsvpsCount": 84
    }'::jsonb,
    142
),
(
    'card-bday-01',
    'Marcus Thorne — 30th Gala',
    'birthday',
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://actions.google.com/sounds/v1/celebration/horns_cheering.ogg',
    'golden_sparkles',
    'crimson',
    '{
        "celebrantName": "Marcus Thorne",
        "milestoneAge": 30,
        "date": "2026-11-05",
        "venue": "The Shard Skyline Lounge, London",
        "venueMapUrl": "https://maps.google.com",
        "rsvpsCount": 38
    }'::jsonb,
    96
),
(
    'card-biz-01',
    'Julian Sterling — Executive Card',
    'business',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    '',
    'stardust',
    'emerald',
    '{
        "fullName": "Julian Sterling",
        "company": "Sterling & Cole Spatial Capital",
        "title": "Managing Principal",
        "email": "julian@sterlingcole.vip",
        "phone": "+1 (555) 234-8901",
        "website": "https://argonstudios.app",
        "linkedin": "https://linkedin.com",
        "downloadsCount": 54
    }'::jsonb,
    215
)
ON CONFLICT (id) DO NOTHING;
