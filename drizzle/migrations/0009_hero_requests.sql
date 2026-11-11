CREATE TABLE public.hero_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.cms_channels(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  content_kind text NOT NULL CHECK (content_kind IN ('movie','series','show','podcast','music','upcoming')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description text CHECK (description IS NULL OR char_length(description) <= 600),
  content_slug text,
  image_url text,
  starts_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_requests TO authenticated;
GRANT ALL ON public.hero_requests TO service_role;
ALTER TABLE public.hero_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hero req read" ON public.hero_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.can_manage_channel(channel_id, auth.uid()));
CREATE POLICY "hero req create" ON public.hero_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid() AND status = 'pending' AND reviewed_by IS NULL AND public.can_manage_channel(channel_id, auth.uid()));
CREATE POLICY "hero req admin update" ON public.hero_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "hero req withdraw" ON public.hero_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (status = 'pending' AND public.can_manage_channel(channel_id, auth.uid())));
CREATE TRIGGER hero_requests_updated BEFORE UPDATE ON public.hero_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();