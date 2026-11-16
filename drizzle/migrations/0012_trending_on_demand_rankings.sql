CREATE OR REPLACE FUNCTION public.trending_on_demand_rankings()
RETURNS TABLE(slug text, plays bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
  SELECT t.slug, count(p.id) AS plays
  FROM public.cms_titles t
  JOIN public.playback_events p ON p.title_id = t.id
  WHERE t.is_published = true AND t.deleted_at IS NULL
    AND (t.channel_id IS NULL OR EXISTS (
      SELECT 1 FROM public.cms_channels c
      WHERE c.id = t.channel_id AND c.is_published = true AND c.deleted_at IS NULL))
    AND p.event = 'start' AND p.service IN ('vod','podcast')
    AND p.created_at >= now() - interval '7 days'
  GROUP BY t.id, t.slug
  ORDER BY count(p.id) DESC, max(p.created_at) DESC
  LIMIT 10;
$$;
GRANT EXECUTE ON FUNCTION public.trending_on_demand_rankings() TO anon, authenticated;