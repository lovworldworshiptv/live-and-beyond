
ALTER TABLE public.cms_channels ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.cms_titles ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS cms_channels_display_order_idx ON public.cms_channels(display_order);
CREATE INDEX IF NOT EXISTS cms_titles_display_order_idx ON public.cms_titles(display_order);

INSERT INTO public.cms_sponsors (
  name, headline, description, cta_label, cta_url,
  placement, placements, home_sections, channel_ids, event_ids,
  priority, is_active
)
SELECT
  'Lettflix Premium',
  'Never miss a broadcast. See what''s on across every channel.',
  'Open the full Electronic Program Guide — 7 days of scheduling across live TV, radio and events.',
  'Open the Guide',
  '/guide',
  'channels',
  ARRAY['channels'],
  ARRAY[]::text[],
  ARRAY[]::uuid[],
  ARRAY[]::uuid[],
  100,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.cms_sponsors WHERE name = 'Lettflix Premium'
);
