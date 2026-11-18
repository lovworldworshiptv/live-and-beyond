REVOKE ALL ON public.ppv_webhook_events FROM PUBLIC,anon,authenticated;
REVOKE ALL ON public.ppv_payment_audit FROM PUBLIC,anon,authenticated;
REVOKE UPDATE,DELETE,TRUNCATE ON public.ppv_payment_audit FROM service_role;
CREATE FUNCTION public.guard_ppv_payment_audit() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN RAISE EXCEPTION 'Payment audit is append only'; END $$;
CREATE TRIGGER ppv_payment_audit_immutable BEFORE UPDATE OR DELETE ON public.ppv_payment_audit FOR EACH ROW EXECUTE FUNCTION public.guard_ppv_payment_audit();