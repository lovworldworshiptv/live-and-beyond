CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.cms_channels(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  media_type text NOT NULL DEFAULT 'video' CHECK (media_type IN ('video','audio')),
  source_url text,
  poster_url text,
  duration_seconds integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('uploading','processing','ready','errored')),
  title_id uuid REFERENCES public.cms_titles(id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT SELECT ON public.media_assets TO anon;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all media assets" ON public.media_assets FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Creators manage their own media assets" ON public.media_assets FOR ALL USING (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = media_assets.channel_id AND c.creator_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = media_assets.channel_id AND c.creator_id = auth.uid()));
CREATE POLICY "Public can view media of published channels" ON public.media_assets FOR SELECT USING (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = media_assets.channel_id AND c.is_published AND c.deleted_at IS NULL));

CREATE TABLE public.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.cms_channels(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  service text NOT NULL DEFAULT 'tv' CHECK (service IN ('tv','radio')),
  loop_enabled boolean NOT NULL DEFAULT true,
  shuffle boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlists TO authenticated;
GRANT SELECT ON public.playlists TO anon;
GRANT ALL ON public.playlists TO service_role;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all playlists" ON public.playlists FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Creators manage their own playlists" ON public.playlists FOR ALL USING (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = playlists.channel_id AND c.creator_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = playlists.channel_id AND c.creator_id = auth.uid()));
CREATE POLICY "Public can view playlists of published channels" ON public.playlists FOR SELECT USING (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = playlists.channel_id AND c.is_published AND c.deleted_at IS NULL));

CREATE TABLE public.playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  media_asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlist_items TO authenticated;
GRANT SELECT ON public.playlist_items TO anon;
GRANT ALL ON public.playlist_items TO service_role;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all playlist items" ON public.playlist_items FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Creators manage their own playlist items" ON public.playlist_items FOR ALL USING (EXISTS (SELECT 1 FROM public.playlists p JOIN public.cms_channels c ON c.id = p.channel_id WHERE p.id = playlist_items.playlist_id AND c.creator_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.playlists p JOIN public.cms_channels c ON c.id = p.channel_id WHERE p.id = playlist_items.playlist_id AND c.creator_id = auth.uid()));
CREATE POLICY "Public can view items of published channel playlists" ON public.playlist_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.playlists p JOIN public.cms_channels c ON c.id = p.channel_id WHERE p.id = playlist_items.playlist_id AND c.is_published AND c.deleted_at IS NULL));

CREATE TABLE public.playout_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.cms_channels(id) ON DELETE CASCADE,
  playlist_id uuid REFERENCES public.playlists(id) ON DELETE SET NULL,
  name text NOT NULL,
  service text NOT NULL DEFAULT 'tv' CHECK (service IN ('tv','radio')),
  starts_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  recurrence text NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none','daily','weekly')),
  days_of_week integer[] NOT NULL DEFAULT '{}'::integer[],
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playout_schedules TO authenticated;
GRANT SELECT ON public.playout_schedules TO anon;
GRANT ALL ON public.playout_schedules TO service_role;
ALTER TABLE public.playout_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all playout schedules" ON public.playout_schedules FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Creators manage their own playout schedules" ON public.playout_schedules FOR ALL USING (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = playout_schedules.channel_id AND c.creator_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = playout_schedules.channel_id AND c.creator_id = auth.uid()));
CREATE POLICY "Public can view playout of published channels" ON public.playout_schedules FOR SELECT USING (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = playout_schedules.channel_id AND c.is_published AND c.deleted_at IS NULL));

ALTER TABLE public.cms_channels
  ADD COLUMN IF NOT EXISTS playout_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fallback_playlist_id uuid REFERENCES public.playlists(id) ON DELETE SET NULL;

CREATE INDEX idx_media_assets_channel ON public.media_assets(channel_id);
CREATE INDEX idx_playlists_channel ON public.playlists(channel_id);
CREATE INDEX idx_playlist_items_playlist ON public.playlist_items(playlist_id, position);
CREATE INDEX idx_playout_schedules_channel ON public.playout_schedules(channel_id, starts_at);

CREATE TRIGGER trg_media_assets_updated BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_playlists_updated BEFORE UPDATE ON public.playlists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_playlist_items_updated BEFORE UPDATE ON public.playlist_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_playout_schedules_updated BEFORE UPDATE ON public.playout_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();