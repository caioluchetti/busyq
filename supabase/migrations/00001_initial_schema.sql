-- Supabase Schema Migration (reference for production setup)
-- Run: supabase db push or supabase migration up

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'owner')),
  claimed_place_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Places table (cached Google Places data)
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_place_id TEXT UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  types TEXT[] DEFAULT '{}',
  rating DOUBLE PRECISION DEFAULT 0,
  user_ratings_total INTEGER DEFAULT 0,
  claimed_by UUID REFERENCES profiles(id),
  queue_enabled BOOLEAN DEFAULT true,
  reservation_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_places_location ON places USING GIST (location);

-- Queue entries
CREATE TABLE queues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  party_size INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'notified', 'seated', 'cancelled')),
  position INTEGER NOT NULL DEFAULT 0,
  estimated_wait_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_queues_place_status ON queues(place_id, status);

-- Reservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'denied', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservations_place_date ON reservations(place_id, reservation_date);

-- User photos
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  caption TEXT,
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_photos_place ON photos(place_id);

-- Busyness reports
CREATE TABLE busyness_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_place ON busyness_reports(place_id);

-- Row Level Security policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE busyness_reports ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Places: everyone can read, only claimed owner can update
CREATE POLICY "Places are viewable by everyone" ON places FOR SELECT USING (true);
CREATE POLICY "Owners can update their places" ON places FOR UPDATE
  USING (claimed_by = auth.uid());

-- Queues: read all, users manage own entries, owners manage place entries
CREATE POLICY "Queues are viewable by everyone" ON queues FOR SELECT USING (true);
CREATE POLICY "Users can insert own queue entry" ON queues FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own queue entry" ON queues FOR UPDATE
  USING (auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM places WHERE id = queues.place_id AND claimed_by = auth.uid()));

-- Reservations: similar to queues
CREATE POLICY "Reservations are viewable by everyone" ON reservations FOR SELECT USING (true);
CREATE POLICY "Users can create reservations" ON reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users and owners can update reservations" ON reservations FOR UPDATE
  USING (auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM places WHERE id = reservations.place_id AND claimed_by = auth.uid()));

-- Photos: everyone can view, users can upload
CREATE POLICY "Photos are viewable by everyone" ON photos FOR SELECT USING (true);
CREATE POLICY "Users can upload photos" ON photos FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reports: everyone can view, users can create
CREATE POLICY "Reports are viewable by everyone" ON busyness_reports FOR SELECT USING (true);
CREATE POLICY "Users can submit reports" ON busyness_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE queues;
ALTER PUBLICATION supabase_realtime ADD TABLE photos;
