ALTER TABLE public.ppv_playback_assets ADD COLUMN sales_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.ppv_orders ADD COLUMN commission_bps integer NOT NULL DEFAULT 2500 CHECK(commission_bps BETWEEN 0 AND 10000);
CREATE TABLE public.ppv_receipts (
 order_id uuid PRIMARY KEY REFERENCES public.ppv_orders(id), amount_minor bigint NOT NULL, platform_minor bigint NOT NULL, channel_minor bigint NOT NULL, verified_at timestamptz NOT NULL DEFAULT now(), CHECK(amount_minor=platform_minor+channel_minor)
);
REVOKE ALL ON public.ppv_receipts FROM anon,authenticated;
GRANT SELECT ON public.ppv_receipts TO authenticated;
GRANT ALL ON public.ppv_receipts TO service_role;
ALTER TABLE public.ppv_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY receipt_buyer_read ON public.ppv_receipts FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.ppv_orders o WHERE o.id=order_id AND o.user_id=(SELECT auth.uid())));
CREATE FUNCTION public.prepare_ppv_order(_event_id uuid,_user_id uuid,_reference text) RETURNS SETOF public.ppv_orders LANGUAGE plpgsql SET search_path=public AS $$
DECLARE e public.ppv_events; a public.ppv_playback_assets; rate integer; finish timestamptz;
BEGIN
 SELECT * INTO e FROM public.ppv_events WHERE id=_event_id FOR SHARE;
 SELECT * INTO a FROM public.ppv_playback_assets WHERE event_id=_event_id FOR SHARE;
 IF e.id IS NULL OR a.event_id IS NULL OR NOT a.sales_enabled OR e.status<>'approved' OR NOT EXISTS(SELECT 1 FROM public.cms_channels c JOIN public.ppv_channel_settings s ON s.channel_id=c.id JOIN public.ppv_platform_settings p ON p.id=true WHERE c.id=e.channel_id AND c.is_published AND c.deleted_at IS NULL AND s.enabled AND p.enabled) THEN RAISE EXCEPTION 'Sales unavailable'; END IF;
 IF e.event_type='vod' THEN finish:=greatest(e.starts_at,now())+make_interval(hours=>e.replay_hours); ELSE finish:=e.starts_at+make_interval(mins=>e.duration_minutes)+make_interval(hours=>CASE WHEN e.event_type='live_replay' THEN e.replay_hours ELSE 0 END); END IF;
 IF finish<=now() THEN RAISE EXCEPTION 'Event ended'; END IF;
 SELECT coalesce(e.platform_commission_bps,s.platform_commission_bps,p.platform_commission_bps) INTO rate FROM public.ppv_channel_settings s CROSS JOIN public.ppv_platform_settings p WHERE s.channel_id=e.channel_id AND p.id=true;
 RETURN QUERY INSERT INTO public.ppv_orders(event_id,user_id,reference,sandbox,amount_minor,currency,access_starts_at,access_expires_at,commission_bps) VALUES(e.id,_user_id,_reference,a.sandbox,e.price_ngn_minor,'NGN',e.starts_at,finish,rate) RETURNING *;
END $$;
REVOKE ALL ON FUNCTION public.prepare_ppv_order(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_ppv_order(uuid,uuid,text) TO service_role;
CREATE FUNCTION public.confirm_ppv_payment(_order_id uuid,_reference text,_amount bigint,_currency text,_sandbox boolean) RETURNS text LANGUAGE plpgsql SET search_path=public AS $$
DECLARE o public.ppv_orders; platform bigint;
BEGIN
 SELECT * INTO o FROM public.ppv_orders WHERE id=_order_id FOR UPDATE;
 IF o.id IS NULL OR o.reference<>_reference OR o.amount_minor<>_amount OR o.currency<>_currency OR o.sandbox<>_sandbox THEN RAISE EXCEPTION 'Payment mismatch'; END IF;
 IF o.status='refunded' THEN RETURN 'refunded'; END IF;
 IF o.status='paid' THEN RETURN 'paid'; END IF;
 UPDATE public.ppv_orders SET status='paid',verified_at=now() WHERE id=o.id;
 platform:=round(o.amount_minor::numeric*o.commission_bps/10000)::bigint;
 INSERT INTO public.ppv_receipts(order_id,amount_minor,platform_minor,channel_minor) VALUES(o.id,o.amount_minor,platform,o.amount_minor-platform);
 RETURN 'paid';
END $$;
REVOKE ALL ON FUNCTION public.confirm_ppv_payment(uuid,text,bigint,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_ppv_payment(uuid,text,bigint,text,boolean) TO service_role;