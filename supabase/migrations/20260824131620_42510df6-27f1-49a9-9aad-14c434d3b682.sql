ALTER TABLE public.cms_channels
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS setup_completed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS cms_channels_slug_key ON public.cms_channels (slug);

CREATE TABLE IF NOT EXISTS public.channel_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.cms_channels(id) ON DELETE CASCADE,
  service text NOT NULL CHECK (service IN ('tv','radio','podcasts','movies','videos')),
  enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, service)
);

GRANT SELECT ON public.channel_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_services TO authenticated;
GRANT ALL ON public.channel_services TO service_role;

ALTER TABLE public.channel_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view services of published channels"
ON public.channel_services FOR SELECT
USING (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = channel_id AND c.is_published AND c.deleted_at IS NULL));

CREATE POLICY "Creators manage their own channel services"
ON public.channel_services FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = channel_id AND c.creator_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.cms_channels c WHERE c.id = channel_id AND c.creator_id = auth.uid()));

CREATE POLICY "Admins manage all channel services"
ON public.channel_services FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_channel_services_updated_at ON public.channel_services;
CREATE TRIGGER update_channel_services_updated_at
BEFORE UPDATE ON public.channel_services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();