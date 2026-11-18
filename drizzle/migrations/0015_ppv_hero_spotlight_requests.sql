ALTER TABLE public.hero_requests ADD COLUMN ppv_event_id uuid REFERENCES public.ppv_events(id);
CREATE UNIQUE INDEX ppv_pending_hero_request_idx ON public.hero_requests(ppv_event_id) WHERE ppv_event_id IS NOT NULL AND status = 'pending';
CREATE FUNCTION public.validate_ppv_spotlight_request() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.ppv_event_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.ppv_events e JOIN public.ppv_channel_settings c ON c.channel_id=e.channel_id JOIN public.ppv_platform_settings p ON p.id
  WHERE e.id=NEW.ppv_event_id AND e.channel_id=NEW.channel_id AND e.status='approved' AND c.enabled AND p.enabled AND e.poster_url IS NOT NULL
 ) THEN RAISE EXCEPTION 'Enable PPV and approve the event with artwork before requesting spotlight'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_ppv_spotlight BEFORE INSERT OR UPDATE ON public.hero_requests FOR EACH ROW EXECUTE FUNCTION public.validate_ppv_spotlight_request();
CREATE FUNCTION public.review_ppv_spotlight(_request_id uuid, _approve boolean, _note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.hero_requests; e public.ppv_events; channel_name text; hero jsonb; slide jsonb;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF length(coalesce(_note,'')) > 1000 THEN RAISE EXCEPTION 'Review note too long'; END IF;
 SELECT * INTO r FROM public.hero_requests WHERE id=_request_id AND status='pending' AND ppv_event_id IS NOT NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pending PPV request not found'; END IF;
 IF _approve THEN
  SELECT * INTO e FROM public.ppv_events WHERE id=r.ppv_event_id;
  IF e.status <> 'approved' OR e.channel_id <> r.channel_id OR e.poster_url IS NULL OR NOT EXISTS(SELECT 1 FROM public.ppv_platform_settings WHERE id AND enabled) OR NOT EXISTS(SELECT 1 FROM public.ppv_channel_settings WHERE channel_id=e.channel_id AND enabled) OR NOT EXISTS(SELECT 1 FROM public.cms_channels WHERE id=e.channel_id AND is_published AND deleted_at IS NULL) THEN RAISE EXCEPTION 'Event is not eligible for homepage spotlight'; END IF;
  SELECT name INTO channel_name FROM public.cms_channels WHERE id=e.channel_id;
  INSERT INTO public.cms_settings(key,value) VALUES('hero','{"visible":false,"slides":[]}'::jsonb) ON CONFLICT(key) DO NOTHING;
  SELECT value INTO hero FROM public.cms_settings WHERE key='hero' FOR UPDATE;
  slide := jsonb_build_object('visible',true,'imageUrl',e.poster_url,'badge','Pay-Per-View','badgeMeta',channel_name,'title',e.title,'description',e.description,'meta','Pay-Per-View · '||channel_name,'ppvEventId',e.id,'primaryCta',jsonb_build_object('label','Event Details','to','/ppv/'||e.id),'secondaryCta',jsonb_build_object('label','','to',''));
  UPDATE public.cms_settings SET value=jsonb_set(hero,'{slides}',jsonb_build_array(slide)||coalesce(hero->'slides','[]'::jsonb)),updated_at=now() WHERE key='hero';
 END IF;
 UPDATE public.hero_requests SET status=CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,admin_note=_note,reviewed_by=auth.uid(),reviewed_at=now() WHERE id=r.id;
END $$;
REVOKE ALL ON FUNCTION public.review_ppv_spotlight(uuid,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_ppv_spotlight(uuid,boolean,text) TO authenticated, service_role;
CREATE FUNCTION public.public_ppv_event(_id uuid) RETURNS TABLE(id uuid,title text,description text,poster_url text,event_type text,starts_at timestamptz,duration_minutes integer,replay_hours integer,rental_start_days integer,price_ngn_minor bigint,price_usd_minor bigint,channel_name text,channel_slug text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT e.id,e.title,e.description,e.poster_url,e.event_type,e.starts_at,e.duration_minutes,e.replay_hours,e.rental_start_days,e.price_ngn_minor,e.price_usd_minor,c.name,c.slug FROM public.ppv_events e JOIN public.cms_channels c ON c.id=e.channel_id JOIN public.ppv_channel_settings s ON s.channel_id=c.id JOIN public.ppv_platform_settings p ON p.id WHERE e.id=_id AND e.status='approved' AND s.enabled AND p.enabled AND c.is_published AND c.deleted_at IS NULL
$$;
REVOKE ALL ON FUNCTION public.public_ppv_event(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_ppv_event(uuid) TO anon, authenticated, service_role;