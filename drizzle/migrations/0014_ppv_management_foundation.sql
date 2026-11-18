CREATE TABLE public.ppv_platform_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK (id),
 enabled boolean NOT NULL DEFAULT false,
 platform_commission_bps integer NOT NULL DEFAULT 2500 CHECK (platform_commission_bps BETWEEN 0 AND 10000),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ppv_platform_settings TO authenticated;
GRANT INSERT, UPDATE ON public.ppv_platform_settings TO authenticated;
GRANT ALL ON public.ppv_platform_settings TO service_role;
ALTER TABLE public.ppv_platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ppv_settings_read ON public.ppv_platform_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY ppv_settings_insert ON public.ppv_platform_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY ppv_settings_update ON public.ppv_platform_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TABLE public.ppv_channel_settings (
 channel_id uuid PRIMARY KEY REFERENCES public.cms_channels(id),
 enabled boolean NOT NULL DEFAULT false,
 approval_required boolean NOT NULL DEFAULT true,
 platform_commission_bps integer CHECK (platform_commission_bps BETWEEN 0 AND 10000),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ppv_channel_settings TO authenticated;
GRANT ALL ON public.ppv_channel_settings TO service_role;
ALTER TABLE public.ppv_channel_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ppv_channel_read ON public.ppv_channel_settings FOR SELECT TO authenticated USING (public.can_manage_channel(channel_id, auth.uid()));
CREATE POLICY ppv_channel_insert ON public.ppv_channel_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY ppv_channel_update ON public.ppv_channel_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TABLE public.ppv_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 channel_id uuid NOT NULL REFERENCES public.cms_channels(id),
 title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
 description text NOT NULL DEFAULT '' CHECK (length(description) <= 4000),
 poster_url text,
 event_type text NOT NULL DEFAULT 'live' CHECK (event_type IN ('live','live_replay','vod')),
 starts_at timestamptz NOT NULL,
 duration_minutes integer NOT NULL DEFAULT 120 CHECK (duration_minutes BETWEEN 1 AND 1440),
 replay_hours integer NOT NULL DEFAULT 48 CHECK (replay_hours BETWEEN 1 AND 720),
 rental_start_days integer NOT NULL DEFAULT 30 CHECK (rental_start_days BETWEEN 1 AND 365),
 price_ngn_minor bigint NOT NULL CHECK (price_ngn_minor BETWEEN 100 AND 1000000000),
 price_usd_minor bigint NOT NULL CHECK (price_usd_minor BETWEEN 100 AND 100000000),
 platform_commission_bps integer CHECK (platform_commission_bps BETWEEN 0 AND 10000),
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected')),
 admin_note text NOT NULL DEFAULT '' CHECK (length(admin_note) <= 1000),
 created_by uuid NOT NULL DEFAULT auth.uid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ppv_events TO authenticated;
GRANT ALL ON public.ppv_events TO service_role;
ALTER TABLE public.ppv_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY ppv_events_read ON public.ppv_events FOR SELECT TO authenticated USING (public.can_manage_channel(channel_id, auth.uid()));
CREATE POLICY ppv_events_insert ON public.ppv_events FOR INSERT TO authenticated WITH CHECK (public.can_manage_channel(channel_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY ppv_events_update ON public.ppv_events FOR UPDATE TO authenticated USING (public.can_manage_channel(channel_id, auth.uid())) WITH CHECK (public.can_manage_channel(channel_id, auth.uid()));
CREATE INDEX ppv_events_channel_created_idx ON public.ppv_events(channel_id, created_at DESC);
CREATE INDEX ppv_events_pending_idx ON public.ppv_events(created_at) WHERE status = 'pending';
CREATE FUNCTION public.validate_ppv_event() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE admin_user boolean := public.has_role(auth.uid(), 'admin');
DECLARE needs_review boolean;
BEGIN
 IF TG_OP = 'UPDATE' AND (NEW.channel_id <> OLD.channel_id OR NEW.created_by <> OLD.created_by OR NEW.created_at <> OLD.created_at) THEN RAISE EXCEPTION 'Event ownership cannot change'; END IF;
 IF NOT admin_user THEN
  IF NOT EXISTS (SELECT 1 FROM public.ppv_platform_settings WHERE id AND enabled) OR NOT EXISTS (SELECT 1 FROM public.ppv_channel_settings WHERE channel_id = NEW.channel_id AND enabled) THEN RAISE EXCEPTION 'Pay-Per-View is disabled for this channel'; END IF;
  IF TG_OP = 'INSERT' THEN
   IF NEW.status NOT IN ('draft','pending') OR NEW.platform_commission_bps IS NOT NULL OR NEW.admin_note <> '' THEN RAISE EXCEPTION 'Admin approval required'; END IF;
  ELSE
   IF NEW.status NOT IN ('draft','pending') OR NEW.platform_commission_bps IS DISTINCT FROM OLD.platform_commission_bps OR NEW.admin_note IS DISTINCT FROM OLD.admin_note THEN RAISE EXCEPTION 'Admin approval required'; END IF;
  END IF;
  SELECT approval_required INTO needs_review FROM public.ppv_channel_settings WHERE channel_id = NEW.channel_id;
  IF NEW.status = 'pending' AND needs_review = false THEN NEW.status := 'approved'; END IF;
 END IF;
 NEW.updated_at := now();
 RETURN NEW;
END $$;
CREATE TRIGGER validate_ppv_event BEFORE INSERT OR UPDATE ON public.ppv_events FOR EACH ROW EXECUTE FUNCTION public.validate_ppv_event();
CREATE TRIGGER ppv_platform_updated BEFORE UPDATE ON public.ppv_platform_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER ppv_channel_updated BEFORE UPDATE ON public.ppv_channel_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
COMMENT ON TABLE public.ppv_events IS 'Private PPV management foundation. Approval does not open sales; checkout and signed premium delivery must be connected before public launch.';