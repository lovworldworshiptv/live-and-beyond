CREATE TABLE public.audience_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  target_type text NOT NULL,
  channel_id uuid REFERENCES public.cms_channels(id) ON DELETE CASCADE,
  creator_id uuid,
  title_id uuid,
  service text,
  session_id text,
  country text,
  city text,
  platform text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audience_events_channel_idx ON public.audience_events(channel_id, created_at DESC);
CREATE INDEX audience_events_creator_idx ON public.audience_events(creator_id, created_at DESC);
GRANT SELECT ON public.audience_events TO authenticated;
GRANT ALL ON public.audience_events TO service_role;
ALTER TABLE public.audience_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audience readable by channel managers, creator and admins"
ON public.audience_events FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR creator_id = auth.uid()
  OR (channel_id IS NOT NULL AND public.can_manage_channel(channel_id, auth.uid()))
);