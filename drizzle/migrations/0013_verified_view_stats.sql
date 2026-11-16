CREATE INDEX IF NOT EXISTS playback_events_channel_created_idx ON public.playback_events (channel_id, created_at);

CREATE OR REPLACE FUNCTION public.channel_view_stats(_channel_id uuid, _days integer DEFAULT 30)
RETURNS TABLE(channel_id uuid, service text, title_id uuid, views bigint, streams bigint, watch_seconds bigint, unique_viewers bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF _channel_id IS NULL THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not authorized'; END IF;
  ELSIF NOT (public.has_role(auth.uid(), 'admin') OR public.can_manage_channel(_channel_id, auth.uid())) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
  WITH ev AS (
    SELECT p.channel_id AS ch, p.service AS svc, p.title_id AS tid, p.event, p.seconds, p.created_at,
           COALESCE(p.user_id::text, p.session_id, p.id::text) AS viewer
    FROM public.playback_events p
    WHERE p.created_at >= now() - make_interval(days => GREATEST(1, LEAST(_days, 365)))
      AND (_channel_id IS NULL OR p.channel_id = _channel_id)
  ), per_viewer_day AS (
    SELECT ch, svc, tid, viewer, date_trunc('day', created_at) AS d,
           sum(CASE WHEN event <> 'start' THEN seconds ELSE 0 END) AS secs,
           count(*) FILTER (WHERE event = 'start') AS starts
    FROM ev GROUP BY ch, svc, tid, viewer, date_trunc('day', created_at)
  )
  SELECT ch, svc, tid,
         count(*) FILTER (WHERE secs >= 30)::bigint,
         sum(starts)::bigint,
         sum(secs)::bigint,
         count(DISTINCT viewer)::bigint
  FROM per_viewer_day GROUP BY ch, svc, tid;
END;
$$;
REVOKE ALL ON FUNCTION public.channel_view_stats(uuid, integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.channel_view_stats(uuid, integer) TO authenticated;