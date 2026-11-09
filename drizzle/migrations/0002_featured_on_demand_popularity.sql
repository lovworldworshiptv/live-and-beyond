CREATE INDEX IF NOT EXISTS playback_events_title_starts_idx ON public.playback_events (title_id) WHERE event = 'start' AND service IN ('vod', 'podcast');

CREATE OR REPLACE FUNCTION public.featured_on_demand_rankings()
RETURNS TABLE (slug text, plays bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT t.slug, count(p.id) AS plays
  FROM public.cms_titles t
  JOIN public.playback_events p ON p.title_id = t.id
  WHERE t.is_published = true AND t.deleted_at IS NULL
    AND t.kind IN ('movie', 'series', 'podcast')
    AND (t.channel_id IS NULL OR EXISTS (
      SELECT 1 FROM public.cms_channels c
      WHERE c.id = t.channel_id AND c.is_published = true AND c.deleted_at IS NULL
    ))
    AND p.event = 'start' AND p.service IN ('vod', 'podcast')
  GROUP BY t.id, t.slug
  ORDER BY count(p.id) DESC, t.slug ASC
  LIMIT 12;
$$;
REVOKE ALL ON FUNCTION public.featured_on_demand_rankings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.featured_on_demand_rankings() TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.featured_on_demand_rankings() IS 'Public aggregate of actual on-demand playback starts for published movies, series and podcasts across all channels. Does not expose viewer identities or raw playback events.';