ALTER TABLE public.ppv_orders ADD COLUMN checkout_url text;
ALTER TABLE public.ppv_orders ADD COLUMN checkout_claimed_at timestamptz;
ALTER TABLE public.ppv_orders ADD COLUMN payment_state text NOT NULL DEFAULT 'pending' CHECK(payment_state IN ('pending','fulfilled','failed','review','refunded'));
ALTER TABLE public.ppv_orders ADD COLUMN checkout_expires_at timestamptz NOT NULL DEFAULT (now()+interval '30 minutes');
UPDATE public.ppv_orders SET checkout_expires_at=created_at+interval '30 minutes',payment_state=CASE status WHEN 'paid' THEN 'fulfilled' WHEN 'refunded' THEN 'refunded' ELSE 'pending' END;
CREATE INDEX ppv_open_checkout ON public.ppv_orders(user_id,event_id,created_at DESC) WHERE status='unpaid' AND payment_state='pending';
CREATE TABLE public.ppv_webhook_events(reference text NOT NULL,event text NOT NULL,payload_sha256 text NOT NULL,received_at timestamptz NOT NULL DEFAULT now(),processed_at timestamptz,PRIMARY KEY(reference,event));
GRANT ALL ON public.ppv_webhook_events TO service_role;
ALTER TABLE public.ppv_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.ppv_payment_audit(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid REFERENCES public.ppv_orders(id),action text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT ON public.ppv_payment_audit TO service_role;
ALTER TABLE public.ppv_payment_audit ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.prepare_ppv_order(_event_id uuid,_user_id uuid,_reference text) RETURNS SETOF public.ppv_orders LANGUAGE plpgsql SET search_path=public AS $$
DECLARE e public.ppv_events; a public.ppv_playback_assets; rate integer; finish timestamptz; existing public.ppv_orders;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(_user_id::text||':'||_event_id::text,0));
 SELECT * INTO e FROM public.ppv_events WHERE id=_event_id FOR SHARE;
 SELECT * INTO a FROM public.ppv_playback_assets WHERE event_id=_event_id FOR SHARE;
 IF e.id IS NULL OR a.event_id IS NULL OR NOT a.sales_enabled OR e.status<>'approved' OR NOT EXISTS(SELECT 1 FROM public.cms_channels c JOIN public.ppv_channel_settings s ON s.channel_id=c.id JOIN public.ppv_platform_settings p ON p.id=true WHERE c.id=e.channel_id AND c.is_published AND c.deleted_at IS NULL AND s.enabled AND p.enabled) THEN RAISE EXCEPTION 'Sales unavailable'; END IF;
 IF EXISTS(SELECT 1 FROM public.ppv_orders WHERE user_id=_user_id AND event_id=_event_id AND status='paid' AND access_expires_at>now()) THEN RAISE EXCEPTION 'Already purchased'; END IF;
 SELECT * INTO existing FROM public.ppv_orders WHERE user_id=_user_id AND event_id=_event_id AND sandbox=a.sandbox AND status='unpaid' AND payment_state='pending' AND checkout_expires_at>now() ORDER BY created_at DESC LIMIT 1;
 IF existing.id IS NOT NULL THEN RETURN NEXT existing; RETURN; END IF;
 IF e.event_type='vod' THEN finish:=greatest(e.starts_at,now())+make_interval(hours=>e.replay_hours); ELSE finish:=e.starts_at+make_interval(mins=>e.duration_minutes)+make_interval(hours=>CASE WHEN e.event_type='live_replay' THEN e.replay_hours ELSE 0 END); END IF;
 IF finish<=now() THEN RAISE EXCEPTION 'Event ended'; END IF;
 SELECT coalesce(e.platform_commission_bps,s.platform_commission_bps,p.platform_commission_bps) INTO rate FROM public.ppv_channel_settings s CROSS JOIN public.ppv_platform_settings p WHERE s.channel_id=e.channel_id AND p.id=true;
 RETURN QUERY INSERT INTO public.ppv_orders(event_id,user_id,reference,sandbox,amount_minor,currency,access_starts_at,access_expires_at,commission_bps) VALUES(e.id,_user_id,_reference,a.sandbox,e.price_ngn_minor,'NGN',e.starts_at,finish,rate) RETURNING *;
END $$;
CREATE FUNCTION public.claim_ppv_checkout(_order_id uuid) RETURNS boolean LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 UPDATE public.ppv_orders SET checkout_claimed_at=now() WHERE id=_order_id AND status='unpaid' AND payment_state='pending' AND checkout_expires_at>now() AND checkout_url IS NULL AND checkout_claimed_at IS NULL;
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.claim_ppv_checkout(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ppv_checkout(uuid) TO service_role;
CREATE FUNCTION public.review_ppv_payment(_order_id uuid) RETURNS void LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 UPDATE public.ppv_orders SET payment_state='review' WHERE id=_order_id AND status<>'refunded' AND payment_state<>'review';
 IF FOUND THEN INSERT INTO public.ppv_payment_audit(order_id,action) VALUES(_order_id,'verification_mismatch'); END IF;
END $$;
REVOKE ALL ON FUNCTION public.review_ppv_payment(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.review_ppv_payment(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.confirm_ppv_payment(_order_id uuid,_reference text,_amount bigint,_currency text,_sandbox boolean) RETURNS text LANGUAGE plpgsql SET search_path=public AS $$
DECLARE o public.ppv_orders; platform bigint;
BEGIN
 SELECT * INTO o FROM public.ppv_orders WHERE id=_order_id FOR UPDATE;
 IF o.id IS NULL THEN RAISE EXCEPTION 'Purchase missing'; END IF;
 IF o.status='refunded' THEN RETURN 'refunded'; END IF;
 IF o.reference<>_reference OR o.amount_minor<>_amount OR o.currency<>_currency OR o.sandbox<>_sandbox THEN PERFORM public.review_ppv_payment(o.id); RETURN 'review'; END IF;
 IF o.payment_state='review' THEN RETURN 'review'; END IF;
 IF o.status='paid' THEN RETURN 'paid'; END IF;
 UPDATE public.ppv_orders SET status='paid',payment_state='fulfilled',verified_at=now() WHERE id=o.id;
 platform:=round(o.amount_minor::numeric*o.commission_bps/10000)::bigint;
 INSERT INTO public.ppv_receipts(order_id,amount_minor,platform_minor,channel_minor) VALUES(o.id,o.amount_minor,platform,o.amount_minor-platform);
 INSERT INTO public.ppv_payment_audit(order_id,action) VALUES(o.id,'payment_fulfilled');
 RETURN 'paid';
END $$;
CREATE OR REPLACE FUNCTION public.ppv_playback_gate(_order_id uuid,_user_id uuid) RETURNS TABLE(stream_uid text,sandbox boolean,access_expires_at timestamptz) LANGUAGE sql VOLATILE SET search_path=public AS $$
 SELECT a.stream_uid,a.sandbox,o.access_expires_at FROM public.ppv_orders o JOIN public.ppv_events e ON e.id=o.event_id JOIN public.cms_channels c ON c.id=e.channel_id JOIN public.ppv_channel_settings s ON s.channel_id=c.id JOIN public.ppv_platform_settings p ON p.id=true JOIN public.ppv_playback_assets a ON a.event_id=e.id AND a.sandbox=o.sandbox
 WHERE o.id=_order_id AND o.user_id=_user_id AND o.status='paid' AND o.payment_state='fulfilled' AND o.verified_at IS NOT NULL AND o.refunded_at IS NULL AND o.access_starts_at<=now() AND o.access_expires_at>now() AND e.status='approved' AND c.is_published AND c.deleted_at IS NULL AND s.enabled AND p.enabled
$$;
