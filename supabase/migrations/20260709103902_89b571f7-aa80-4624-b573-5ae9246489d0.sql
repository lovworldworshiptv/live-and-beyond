
-- cms_schedule
CREATE TABLE public.cms_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.cms_channels(id) ON DELETE CASCADE,
  program_title text NOT NULL,
  description text,
  category text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_schedule TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_schedule TO authenticated;
GRANT ALL ON public.cms_schedule TO service_role;
ALTER TABLE public.cms_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedule public read" ON public.cms_schedule FOR SELECT USING (true);
CREATE POLICY "schedule admin write" ON public.cms_schedule FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER cms_schedule_updated BEFORE UPDATE ON public.cms_schedule
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX cms_schedule_channel_time_idx ON public.cms_schedule(channel_id, starts_at);

-- cms_events
CREATE TABLE public.cms_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  cover_url text,
  channel_id uuid REFERENCES public.cms_channels(id) ON DELETE SET NULL,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_events TO authenticated;
GRANT ALL ON public.cms_events TO service_role;
ALTER TABLE public.cms_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events public read" ON public.cms_events FOR SELECT USING (is_published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "events admin write" ON public.cms_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER cms_events_updated BEFORE UPDATE ON public.cms_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- cms_sponsors
CREATE TABLE public.cms_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  headline text,
  description text,
  cta_label text,
  cta_url text,
  image_url text,
  placement text NOT NULL DEFAULT 'home',
  priority int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_sponsors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_sponsors TO authenticated;
GRANT ALL ON public.cms_sponsors TO service_role;
ALTER TABLE public.cms_sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sponsors public read" ON public.cms_sponsors FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sponsors admin write" ON public.cms_sponsors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER cms_sponsors_updated BEFORE UPDATE ON public.cms_sponsors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- enterprise_leads
CREATE TABLE public.enterprise_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  org text,
  email text NOT NULL,
  plan text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.enterprise_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enterprise_leads TO authenticated;
GRANT ALL ON public.enterprise_leads TO service_role;
ALTER TABLE public.enterprise_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads anyone submit" ON public.enterprise_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "leads admin read" ON public.enterprise_leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "leads admin update" ON public.enterprise_leads FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "leads admin delete" ON public.enterprise_leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER enterprise_leads_updated BEFORE UPDATE ON public.enterprise_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- cms_settings (site-wide key/value config)
CREATE TABLE public.cms_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_settings TO authenticated;
GRANT ALL ON public.cms_settings TO service_role;
ALTER TABLE public.cms_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.cms_settings FOR SELECT USING (true);
CREATE POLICY "settings admin write" ON public.cms_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER cms_settings_updated BEFORE UPDATE ON public.cms_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
