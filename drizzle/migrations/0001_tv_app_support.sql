ALTER TABLE public.kingschat_login_attempts ADD COLUMN IF NOT EXISTS device text;
ALTER TABLE public.kingschat_login_attempts ADD COLUMN IF NOT EXISTS short_code text;
CREATE UNIQUE INDEX IF NOT EXISTS kingschat_login_attempts_short_code_key ON public.kingschat_login_attempts (short_code) WHERE short_code IS NOT NULL;
ALTER TABLE public.playback_events ADD COLUMN IF NOT EXISTS platform text;
ALTER TABLE public.playback_events DROP CONSTRAINT IF EXISTS playback_events_event_check;
ALTER TABLE public.playback_events ADD CONSTRAINT playback_events_event_check CHECK (event = ANY (ARRAY['start'::text, 'heartbeat'::text, 'end'::text, 'stop'::text]));
GRANT INSERT ON public.playback_events TO anon, authenticated;
GRANT ALL ON public.playback_events TO service_role;