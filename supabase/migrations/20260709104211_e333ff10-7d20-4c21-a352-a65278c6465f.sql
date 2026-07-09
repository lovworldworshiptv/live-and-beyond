
-- Extend sponsors with multi-placement targeting and publish windows
ALTER TABLE public.cms_sponsors
  ADD COLUMN IF NOT EXISTS placements text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS home_sections text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS channel_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS event_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz;

-- Backfill placements from legacy single 'placement' column so existing rows still target somewhere.
UPDATE public.cms_sponsors
SET placements = ARRAY[placement]
WHERE (placements IS NULL OR array_length(placements, 1) IS NULL) AND placement IS NOT NULL;
