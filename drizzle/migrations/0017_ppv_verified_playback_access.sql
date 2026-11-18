CREATE TABLE public.ppv_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 event_id uuid NOT NULL REFERENCES public.ppv_events(id),
 user_id uuid NOT NULL,
 provider text NOT NULL DEFAULT 'squad' CHECK (provider = 'squad'),
 reference text NOT NULL UNIQUE CHECK (length(reference) BETWEEN 1 AND 128),
 sandbox boolean NOT NULL,
 amount_minor bigint NOT NULL CHECK (amount_minor > 0),
 currency text NOT NULL DEFAULT 'NGN' CHECK (currency = 'NGN'),
 status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','refunded')),
 verified_at timestamptz,
 refunded_at timestamptz,
 access_starts_at timestamptz NOT NULL,
 access_expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (access_expires_at > access_starts_at),
 CHECK (status <> 'paid' OR verified_at IS NOT NULL),
 CHECK ((status = 'refunded') = (refunded_at IS NOT NULL))
);
GRANT SELECT ON public.ppv_orders TO authenticated;
GRANT ALL ON public.ppv_orders TO service_role;
ALTER TABLE public.ppv_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY ppv_buyer_read ON public.ppv_orders FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE INDEX ppv_orders_buyer_event ON public.ppv_orders(user_id,event_id);
CREATE TABLE public.ppv_playback_assets (
 event_id uuid PRIMARY KEY REFERENCES public.ppv_events(id),
 stream_uid text NOT NULL CHECK (stream_uid ~ '^[a-f0-9]{32}$'),
 sandbox boolean NOT NULL DEFAULT false
);
GRANT ALL ON public.ppv_playback_assets TO service_role;
ALTER TABLE public.ppv_playback_assets ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.guard_ppv_order_state() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.event_id IS DISTINCT FROM OLD.event_id OR NEW.reference IS DISTINCT FROM OLD.reference OR NEW.provider IS DISTINCT FROM OLD.provider OR NEW.sandbox IS DISTINCT FROM OLD.sandbox OR NEW.amount_minor IS DISTINCT FROM OLD.amount_minor OR NEW.currency IS DISTINCT FROM OLD.currency OR NEW.access_starts_at IS DISTINCT FROM OLD.access_starts_at OR NEW.access_expires_at IS DISTINCT FROM OLD.access_expires_at THEN
 RAISE EXCEPTION 'Order identity and purchase terms are immutable'; END IF;
 IF OLD.status='refunded' AND NEW IS DISTINCT FROM OLD THEN RAISE EXCEPTION 'Refunded orders are terminal'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_ppv_order_state BEFORE UPDATE ON public.ppv_orders FOR EACH ROW EXECUTE FUNCTION public.guard_ppv_order_state();
CREATE FUNCTION public.ppv_playback_gate(_order_id uuid, _user_id uuid) RETURNS TABLE(stream_uid text, sandbox boolean, access_expires_at timestamptz) LANGUAGE sql VOLATILE SET search_path=public AS $$
 SELECT a.stream_uid,a.sandbox,o.access_expires_at FROM public.ppv_orders o
 JOIN public.ppv_events e ON e.id=o.event_id
 JOIN public.cms_channels c ON c.id=e.channel_id
 JOIN public.ppv_channel_settings s ON s.channel_id=c.id
 JOIN public.ppv_platform_settings p ON p.id=true
 JOIN public.ppv_playback_assets a ON a.event_id=e.id AND a.sandbox=o.sandbox
 WHERE o.id=_order_id AND o.user_id=_user_id AND o.status='paid' AND o.verified_at IS NOT NULL AND o.refunded_at IS NULL
 AND o.access_starts_at<=now() AND o.access_expires_at>now()
 AND e.status='approved' AND c.is_published AND c.deleted_at IS NULL AND s.enabled AND p.enabled
 $$;
REVOKE ALL ON FUNCTION public.ppv_playback_gate(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ppv_playback_gate(uuid,uuid) TO service_role;