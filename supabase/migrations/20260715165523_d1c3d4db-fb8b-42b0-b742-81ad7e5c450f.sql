
ALTER TABLE public.cms_channels ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS cms_channels_creator_id_idx ON public.cms_channels(creator_id);

-- Backfill creator_id from creator_applications by slug match
UPDATE public.cms_channels c
SET creator_id = a.user_id
FROM public.creator_applications a
WHERE c.creator_id IS NULL
  AND a.status = 'approved'
  AND lower(regexp_replace(a.channel_name, '[^a-zA-Z0-9]+', '-', 'g')) = c.slug;

DROP POLICY IF EXISTS "Creators manage own channel" ON public.cms_channels;
CREATE POLICY "Creators manage own channel"
ON public.cms_channels
FOR ALL
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Creators view own channel" ON public.cms_channels;
CREATE POLICY "Creators view own channel"
ON public.cms_channels
FOR SELECT
TO authenticated
USING (creator_id = auth.uid());
