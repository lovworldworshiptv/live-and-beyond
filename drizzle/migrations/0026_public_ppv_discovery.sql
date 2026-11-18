CREATE FUNCTION public.public_ppv_events() RETURNS TABLE(id uuid,title text,description text,poster_url text,event_type text,starts_at timestamptz,duration_minutes integer,replay_hours integer,rental_start_days integer,price_ngn_minor bigint,price_usd_minor bigint,channel_name text,channel_slug text,sales_open boolean) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT d.*,public.public_ppv_sales(e.id) FROM public.ppv_events e CROSS JOIN LATERAL public.public_ppv_event(e.id) d
 WHERE e.event_type='vod' OR e.starts_at+make_interval(mins=>e.duration_minutes)+make_interval(hours=>CASE WHEN e.event_type='live_replay' THEN e.replay_hours ELSE 0 END)>now()
 ORDER BY e.starts_at,e.id
$$;
REVOKE ALL ON FUNCTION public.public_ppv_events() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_ppv_events() TO anon,authenticated,service_role;