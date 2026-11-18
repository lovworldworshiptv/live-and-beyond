ALTER TABLE public.ppv_events ADD COLUMN sales_starts_at timestamptz NOT NULL DEFAULT '1970-01-01T00:00:00Z';
ALTER TABLE public.ppv_events ADD CONSTRAINT ppv_sales_before_event CHECK(sales_starts_at<=starts_at);
CREATE FUNCTION public.guard_ppv_sales_start() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.ppv_events WHERE id=NEW.event_id AND sales_starts_at<=now()) THEN RAISE EXCEPTION 'Ticket sales have not started yet'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_ppv_sales_start BEFORE INSERT ON public.ppv_orders FOR EACH ROW EXECUTE FUNCTION public.guard_ppv_sales_start();
CREATE OR REPLACE FUNCTION public.public_ppv_sales(_event_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.ppv_events e JOIN public.ppv_playback_assets a ON a.event_id=e.id JOIN public.cms_channels c ON c.id=e.channel_id JOIN public.ppv_channel_settings s ON s.channel_id=c.id JOIN public.ppv_platform_settings p ON p.id=true WHERE e.id=_event_id AND e.status='approved' AND e.sales_starts_at<=now() AND a.sales_enabled AND a.sandbox AND c.is_published AND c.deleted_at IS NULL AND s.enabled AND p.enabled) $$;
CREATE FUNCTION public.public_ppv_sales_schedule() RETURNS TABLE(id uuid,sales_starts_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT e.id,CASE WHEN e.sales_starts_at='1970-01-01T00:00:00Z'::timestamptz THEN e.created_at ELSE e.sales_starts_at END FROM public.ppv_events e CROSS JOIN LATERAL public.public_ppv_event(e.id) d $$;
REVOKE ALL ON FUNCTION public.public_ppv_sales_schedule() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_ppv_sales_schedule() TO anon,authenticated,service_role;