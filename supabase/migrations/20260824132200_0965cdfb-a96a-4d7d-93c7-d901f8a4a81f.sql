CREATE TABLE IF NOT EXISTS public.live_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.cms_channels(id) ON DELETE CASCADE,
  service text NOT NULL DEFAULT 'tv' CHECK (service IN ('tv','radio')),
  provider text NOT NULL DEFAULT 'cloudflare',
  provider_input_id text,
  rtmps_url text,
  rtmps_stream_key text,
  srt_url text,
  webrtc_url text,
  playback_hls_url text,
  playback_dash_url text,
  status text NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','connected','live','errored','disabled')),
  recording_enabled boolean NOT NULL DEFAULT true,
  last_connected_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, service)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_inputs TO authenticated;
GRANT ALL ON public.live_inputs TO service_role;

ALTER TABLE public.live_inputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage their own live inputs"
ON public.live_inputs FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = channel_id AND c.creator_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = channel_id AND c.creator_id = auth.uid()));

CREATE POLICY "Admins manage all live inputs"
ON public.live_inputs FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_live_inputs_updated_at ON public.live_inputs;
CREATE TRIGGER update_live_inputs_updated_at
BEFORE UPDATE ON public.live_inputs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.cms_channels(id) ON DELETE CASCADE,
  live_input_id uuid REFERENCES public.live_inputs(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Live broadcast',
  description text,
  poster_url text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended','cancelled')),
  scheduled_start timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  playback_hls_url text,
  recording_url text,
  peak_viewers integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.live_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_sessions TO authenticated;
GRANT ALL ON public.live_sessions TO service_role;

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view sessions of published channels"
ON public.live_sessions FOR SELECT
USING (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = channel_id AND c.is_published AND c.deleted_at IS NULL));

CREATE POLICY "Creators manage their own live sessions"
ON public.live_sessions FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = channel_id AND c.creator_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = channel_id AND c.creator_id = auth.uid()));

CREATE POLICY "Admins manage all live sessions"
ON public.live_sessions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_live_sessions_updated_at ON public.live_sessions;
CREATE TRIGGER update_live_sessions_updated_at
BEFORE UPDATE ON public.live_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS live_sessions_channel_status_idx ON public.live_sessions (channel_id, status);