-- Helper: channel access (owner, team member, or admin)
CREATE TABLE public.channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.cms_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('manager','editor')),
  invited_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_members TO authenticated;
GRANT ALL ON public.channel_members TO service_role;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_manage_channel(_channel_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cms_channels c
    WHERE c.id = _channel_id AND c.creator_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.channel_members m
    WHERE m.channel_id = _channel_id AND m.user_id = _user_id
  ) OR public.has_role(_user_id, 'admin');
$$;

CREATE POLICY "Channel team readable by team and admins"
  ON public.channel_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_channel(channel_id, auth.uid()));

CREATE POLICY "Owners and admins add team members"
  ON public.channel_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = channel_id AND c.creator_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners and admins update team members"
  ON public.channel_members FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = channel_id AND c.creator_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners and admins remove team members"
  ON public.channel_members FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = channel_id AND c.creator_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER channel_members_updated_at
  BEFORE UPDATE ON public.channel_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RADIO
CREATE TABLE public.radio_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL UNIQUE REFERENCES public.cms_channels(id) ON DELETE CASCADE,
  stream_url text,
  format text NOT NULL DEFAULT 'aac',
  bitrate_kbps integer NOT NULL DEFAULT 128,
  metadata_provider text NOT NULL DEFAULT 'none' CHECK (metadata_provider IN ('none','manual','icecast','shoutcast','azuracast','json')),
  metadata_url text,
  now_playing_title text,
  now_playing_artist text,
  now_playing_artwork_url text,
  now_playing_updated_at timestamptz,
  station_message text,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.radio_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.radio_settings TO authenticated;
GRANT ALL ON public.radio_settings TO service_role;
ALTER TABLE public.radio_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Radio settings public for published channels"
  ON public.radio_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_channels c
      WHERE c.id = channel_id AND c.is_published = true AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "Channel team manages radio settings"
  ON public.radio_settings FOR ALL TO authenticated
  USING (public.can_manage_channel(channel_id, auth.uid()))
  WITH CHECK (public.can_manage_channel(channel_id, auth.uid()));

CREATE TRIGGER radio_settings_updated_at
  BEFORE UPDATE ON public.radio_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FOLLOWS
CREATE TABLE public.channel_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.cms_channels(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel_id)
);
GRANT SELECT, INSERT, DELETE ON public.channel_follows TO authenticated;
GRANT ALL ON public.channel_follows TO service_role;
ALTER TABLE public.channel_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own follows"
  ON public.channel_follows FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_channel(channel_id, auth.uid()));
CREATE POLICY "Users follow channels"
  ON public.channel_follows FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users unfollow channels"
  ON public.channel_follows FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text,
  link text,
  image_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- PLAYBACK ANALYTICS
CREATE TABLE public.playback_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.cms_channels(id) ON DELETE CASCADE,
  title_id uuid REFERENCES public.cms_titles(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  service text NOT NULL DEFAULT 'tv',
  event text NOT NULL DEFAULT 'heartbeat' CHECK (event IN ('start','heartbeat','end')),
  seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX playback_events_channel_created_idx ON public.playback_events (channel_id, created_at DESC);
GRANT INSERT ON public.playback_events TO anon;
GRANT SELECT, INSERT ON public.playback_events TO authenticated;
GRANT ALL ON public.playback_events TO service_role;
ALTER TABLE public.playback_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record playback events"
  ON public.playback_events FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Channel team reads playback events"
  ON public.playback_events FOR SELECT TO authenticated
  USING (channel_id IS NOT NULL AND public.can_manage_channel(channel_id, auth.uid()));