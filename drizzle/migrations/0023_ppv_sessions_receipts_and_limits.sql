ALTER TABLE public.ppv_playback_assets ADD COLUMN allowed_countries text[] NOT NULL DEFAULT '{}';
CREATE TABLE public.ppv_playback_sessions(id uuid PRIMARY KEY,order_id uuid NOT NULL REFERENCES public.ppv_orders(id),user_id uuid NOT NULL,heartbeat_at timestamptz NOT NULL DEFAULT now(),ended_at timestamptz);
REVOKE ALL ON public.ppv_playback_sessions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.ppv_playback_sessions TO authenticated;
GRANT ALL ON public.ppv_playback_sessions TO service_role;
ALTER TABLE public.ppv_playback_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ppv_session_buyer_read ON public.ppv_playback_sessions FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE INDEX ppv_session_order_active ON public.ppv_playback_sessions(order_id,heartbeat_at) WHERE ended_at IS NULL;
CREATE FUNCTION public.acquire_ppv_session(_order_id uuid,_user_id uuid,_session_id uuid,_country text,_start boolean) RETURNS boolean LANGUAGE plpgsql SET search_path=public AS $$
DECLARE a public.ppv_playback_assets; existing public.ppv_playback_sessions;
BEGIN
 PERFORM 1 FROM public.ppv_orders WHERE id=_order_id AND user_id=_user_id AND status='paid' AND payment_state='fulfilled' AND verified_at IS NOT NULL AND refunded_at IS NULL AND access_starts_at<=now() AND access_expires_at>now() FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 SELECT p.* INTO a FROM public.ppv_playback_assets p JOIN public.ppv_orders o ON o.event_id=p.event_id WHERE o.id=_order_id;
 IF a.event_id IS NULL OR (cardinality(a.allowed_countries)>0 AND NOT coalesce(upper(_country)=ANY(a.allowed_countries),false)) THEN RETURN false; END IF;
 SELECT * INTO existing FROM public.ppv_playback_sessions WHERE id=_session_id;
 IF existing.id IS NOT NULL THEN
  IF existing.order_id<>_order_id OR existing.user_id<>_user_id OR existing.ended_at IS NOT NULL OR existing.heartbeat_at<=now()-interval '90 seconds' THEN RETURN false; END IF;
  UPDATE public.ppv_playback_sessions SET heartbeat_at=now() WHERE id=_session_id; RETURN true;
 END IF;
 IF NOT _start THEN RETURN false; END IF;
 UPDATE public.ppv_playback_sessions SET ended_at=now() WHERE order_id=_order_id AND ended_at IS NULL;
 INSERT INTO public.ppv_playback_sessions(id,order_id,user_id) VALUES(_session_id,_order_id,_user_id);
 INSERT INTO public.ppv_payment_audit(order_id,action) VALUES(_order_id,'playback_session_started');
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.acquire_ppv_session(uuid,uuid,uuid,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_ppv_session(uuid,uuid,uuid,text,boolean) TO service_role;
CREATE TABLE public.ppv_request_limits(user_id uuid NOT NULL,action text NOT NULL,window_at timestamptz NOT NULL DEFAULT now(),attempts integer NOT NULL DEFAULT 0,PRIMARY KEY(user_id,action));
REVOKE ALL ON public.ppv_request_limits FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.ppv_request_limits TO service_role;
ALTER TABLE public.ppv_request_limits ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.consume_ppv_request(_user_id uuid,_action text) RETURNS boolean LANGUAGE plpgsql SET search_path=public AS $$
DECLARE maximum integer; seconds integer; counter public.ppv_request_limits;
BEGIN
 IF _action='checkout' THEN maximum:=5;seconds:=600; ELSIF _action='confirm' THEN maximum:=45;seconds:=300; ELSE RAISE EXCEPTION 'Invalid limit action'; END IF;
 INSERT INTO public.ppv_request_limits(user_id,action) VALUES(_user_id,_action) ON CONFLICT DO NOTHING;
 SELECT * INTO counter FROM public.ppv_request_limits WHERE user_id=_user_id AND action=_action FOR UPDATE;
 IF counter.window_at<=now()-make_interval(secs=>seconds) THEN UPDATE public.ppv_request_limits SET window_at=now(),attempts=1 WHERE user_id=_user_id AND action=_action; RETURN true; END IF;
 IF counter.attempts>=maximum THEN RETURN false; END IF;
 UPDATE public.ppv_request_limits SET attempts=attempts+1 WHERE user_id=_user_id AND action=_action; RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.consume_ppv_request(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ppv_request(uuid,text) TO service_role;
CREATE TABLE public.ppv_ledger_entries(order_id uuid NOT NULL REFERENCES public.ppv_orders(id),kind text NOT NULL CHECK(kind IN ('sale','refund')),account text NOT NULL CHECK(account IN ('gateway_clearing','platform_pending','channel_pending')),amount_minor bigint NOT NULL,currency text NOT NULL DEFAULT 'NGN',created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(order_id,kind,account));
REVOKE ALL ON public.ppv_ledger_entries FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.ppv_ledger_entries TO authenticated;
GRANT SELECT,INSERT ON public.ppv_ledger_entries TO service_role;
ALTER TABLE public.ppv_ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY ppv_ledger_manager_read ON public.ppv_ledger_entries FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.ppv_orders o JOIN public.ppv_events e ON e.id=o.event_id WHERE o.id=order_id AND public.can_manage_channel(e.channel_id,auth.uid())));
CREATE TRIGGER ppv_ledger_immutable BEFORE UPDATE OR DELETE ON public.ppv_ledger_entries FOR EACH ROW EXECUTE FUNCTION public.guard_ppv_payment_audit();
CREATE FUNCTION public.ppv_receipt_ledger() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.ppv_orders;
BEGIN
 SELECT * INTO o FROM public.ppv_orders WHERE id=NEW.order_id;
 INSERT INTO public.ppv_ledger_entries(order_id,kind,account,amount_minor,currency) VALUES(o.id,'sale','gateway_clearing',NEW.amount_minor,o.currency),(o.id,'sale','platform_pending',-NEW.platform_minor,o.currency),(o.id,'sale','channel_pending',-NEW.channel_minor,o.currency);
 INSERT INTO public.notifications(user_id,title,body,kind,link) VALUES(o.user_id,'PPV Payment Confirmed','Your ticket payment is verified. Your receipt is available on the event page.','ppv_receipt','/ppv/'||o.event_id::text);
 RETURN NEW;
END $$;
CREATE TRIGGER ppv_receipt_finance AFTER INSERT ON public.ppv_receipts FOR EACH ROW EXECUTE FUNCTION public.ppv_receipt_ledger();
CREATE FUNCTION public.ppv_refund_ledger() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.status='refunded' AND OLD.status<>'refunded' THEN
  INSERT INTO public.ppv_ledger_entries(order_id,kind,account,amount_minor,currency) SELECT order_id,'refund',account,-amount_minor,currency FROM public.ppv_ledger_entries WHERE order_id=NEW.id AND kind='sale' ON CONFLICT DO NOTHING;
  UPDATE public.ppv_playback_sessions SET ended_at=now() WHERE order_id=NEW.id AND ended_at IS NULL;
  INSERT INTO public.ppv_payment_audit(order_id,action) VALUES(NEW.id,'refund_revoked_access');
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER ppv_refund_finance AFTER UPDATE ON public.ppv_orders FOR EACH ROW EXECUTE FUNCTION public.ppv_refund_ledger();
