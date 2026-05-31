
-- ============ LOCALITIES ============
CREATE TABLE public.localities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  overall_score NUMERIC(3,2) NOT NULL DEFAULT 0.7 CHECK (overall_score >= 0 AND overall_score <= 1),
  ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.localities TO anon, authenticated;
GRANT ALL ON public.localities TO service_role;
ALTER TABLE public.localities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Localities public read" ON public.localities FOR SELECT USING (true);

-- ============ PROPERTIES ============
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  builder TEXT NOT NULL,
  locality_id UUID REFERENCES public.localities(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  price_min BIGINT NOT NULL,
  price_max BIGINT NOT NULL,
  bhk INTEGER[] NOT NULL DEFAULT '{}',
  property_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready',
  images TEXT[] NOT NULL DEFAULT '{}',
  highlights TEXT[] NOT NULL DEFAULT '{}',
  manual_priority NUMERIC(3,2) NOT NULL DEFAULT 0.5 CHECK (manual_priority >= 0 AND manual_priority <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT properties_builder_whitelist CHECK (
    lower(builder) IN (
      'prestige', 'sobha', 'brigade', 'godrej', 'embassy',
      'birla', 'mahindra lifespaces', 'puravankara', 'total environment'
    )
  )
);
GRANT SELECT ON public.properties TO anon, authenticated;
GRANT ALL ON public.properties TO service_role;
CREATE INDEX idx_properties_locality ON public.properties(locality_id);
CREATE INDEX idx_properties_coords ON public.properties(lat, lng);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Properties public read" ON public.properties FOR SELECT USING (true);

-- ============ USERS (soft leads) ============
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.users TO service_role;
-- No anon/authenticated grants: all writes/reads go through server functions.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- (No policies = no client access; service_role bypasses RLS.)

-- ============ BOOKINGS ============
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  preferred_time TEXT,
  status TEXT NOT NULL DEFAULT 'intent' CHECK (status IN ('intent','requested','confirmed','cancelled')),
  session_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bookings TO service_role;
CREATE INDEX idx_bookings_property ON public.bookings(property_id);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
-- Backend-only; no client policies.

-- ============ EVENTS ============
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.events TO service_role;
CREATE INDEX idx_events_session ON public.events(session_id);
CREATE INDEX idx_events_type ON public.events(event_type);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
-- Backend-only; no client policies.

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
