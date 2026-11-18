CREATE FUNCTION public.can_read_ppv_finance(_order_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.ppv_orders o JOIN public.ppv_events e ON e.id=o.event_id WHERE o.id=_order_id AND public.can_manage_channel(e.channel_id,auth.uid())) $$;
REVOKE ALL ON FUNCTION public.can_read_ppv_finance(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_read_ppv_finance(uuid) TO authenticated;
ALTER POLICY ppv_ledger_manager_read ON public.ppv_ledger_entries USING(public.can_read_ppv_finance(order_id));
CREATE FUNCTION public.check_ppv_ledger_balance() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF (SELECT coalesce(sum(amount_minor),0) FROM public.ppv_ledger_entries WHERE order_id=NEW.order_id AND kind=NEW.kind)<>0 THEN RAISE EXCEPTION 'Financial entries must balance'; END IF; RETURN NEW; END $$;
CREATE CONSTRAINT TRIGGER ppv_ledger_balanced AFTER INSERT ON public.ppv_ledger_entries DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_ppv_ledger_balance();
CREATE OR REPLACE FUNCTION public.ppv_receipt_ledger() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.ppv_orders;
BEGIN
 SELECT * INTO o FROM public.ppv_orders WHERE id=NEW.order_id;
 INSERT INTO public.ppv_ledger_entries(order_id,kind,account,amount_minor,currency) VALUES(o.id,'sale','gateway_clearing',NEW.amount_minor,o.currency),(o.id,'sale','platform_pending',-NEW.platform_minor,o.currency),(o.id,'sale','channel_pending',-NEW.channel_minor,o.currency);
 BEGIN
  INSERT INTO public.notifications(user_id,title,body,kind,link) VALUES(o.user_id,'PPV Payment Confirmed','Your ticket payment is verified. Your receipt is available on the event page.','ppv_receipt','/ppv/'||o.event_id::text);
 EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.ppv_payment_audit(order_id,action) VALUES(o.id,'receipt_notification_retry_required');
 END;
 RETURN NEW;
END $$;
CREATE FUNCTION public.lock_sold_ppv_terms() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.ppv_orders WHERE event_id=OLD.id AND verified_at IS NOT NULL) AND (NEW.price_ngn_minor IS DISTINCT FROM OLD.price_ngn_minor OR NEW.price_usd_minor IS DISTINCT FROM OLD.price_usd_minor OR NEW.starts_at IS DISTINCT FROM OLD.starts_at OR NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes OR NEW.replay_hours IS DISTINCT FROM OLD.replay_hours OR NEW.rental_start_days IS DISTINCT FROM OLD.rental_start_days OR NEW.event_type IS DISTINCT FROM OLD.event_type) THEN RAISE EXCEPTION 'Sold ticket prices and access terms are locked'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER lock_sold_ppv_terms BEFORE UPDATE ON public.ppv_events FOR EACH ROW EXECUTE FUNCTION public.lock_sold_ppv_terms();