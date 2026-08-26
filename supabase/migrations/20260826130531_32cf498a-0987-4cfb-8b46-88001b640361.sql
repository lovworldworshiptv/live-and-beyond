ALTER TABLE public.cms_channels
  ADD COLUMN IF NOT EXISTS tv_source text NOT NULL DEFAULT 'none';

ALTER TABLE public.cms_channels
  DROP CONSTRAINT IF EXISTS cms_channels_tv_source_check;
ALTER TABLE public.cms_channels
  ADD CONSTRAINT cms_channels_tv_source_check
  CHECK (tv_source IN ('none','ingest','external','playout'));

UPDATE public.cms_channels
  SET tv_source = CASE
    WHEN playout_enabled THEN 'playout'
    WHEN stream_url IS NOT NULL AND stream_url <> '' THEN 'external'
    ELSE 'none' END
  WHERE tv_source = 'none';

ALTER TABLE public.cms_titles
  ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES public.cms_channels(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS cms_titles_channel_id_idx ON public.cms_titles(channel_id);

DROP POLICY IF EXISTS "Channel owners manage own titles" ON public.cms_titles;
CREATE POLICY "Channel owners manage own titles"
  ON public.cms_titles FOR ALL TO authenticated
  USING (channel_id IS NOT NULL AND public.can_manage_channel(channel_id, auth.uid()))
  WITH CHECK (channel_id IS NOT NULL AND public.can_manage_channel(channel_id, auth.uid()));