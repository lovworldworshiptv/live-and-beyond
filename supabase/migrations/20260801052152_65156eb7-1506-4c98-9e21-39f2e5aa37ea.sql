-- 1. Lock down internal trigger/definer functions from API callers
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_creator_approval() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_audit_actors() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role is required by RLS policies evaluated as the caller; keep it for
-- signed-in users only, never for anonymous visitors.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 2. Public content: split anon (published only) from authenticated (published or admin)
DROP POLICY IF EXISTS "Published channels are public" ON public.cms_channels;
CREATE POLICY "Channels anon read published" ON public.cms_channels
  FOR SELECT TO anon USING (is_published AND deleted_at IS NULL);
CREATE POLICY "Channels authed read" ON public.cms_channels
  FOR SELECT TO authenticated USING ((is_published AND deleted_at IS NULL) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Published collections are public" ON public.cms_collections;
CREATE POLICY "Collections anon read published" ON public.cms_collections
  FOR SELECT TO anon USING (is_published AND deleted_at IS NULL);
CREATE POLICY "Collections authed read" ON public.cms_collections
  FOR SELECT TO authenticated USING ((is_published AND deleted_at IS NULL) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "events public read" ON public.cms_events;
CREATE POLICY "Events anon read published" ON public.cms_events
  FOR SELECT TO anon USING (is_published AND deleted_at IS NULL);
CREATE POLICY "Events authed read" ON public.cms_events
  FOR SELECT TO authenticated USING ((is_published AND deleted_at IS NULL) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "schedule public read" ON public.cms_schedule;
CREATE POLICY "Schedule anon read published" ON public.cms_schedule
  FOR SELECT TO anon USING (is_published AND deleted_at IS NULL);
CREATE POLICY "Schedule authed read" ON public.cms_schedule
  FOR SELECT TO authenticated USING ((is_published AND deleted_at IS NULL) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "sponsors public read" ON public.cms_sponsors;
CREATE POLICY "Sponsors anon read active" ON public.cms_sponsors
  FOR SELECT TO anon USING (is_active AND deleted_at IS NULL);
CREATE POLICY "Sponsors authed read" ON public.cms_sponsors
  FOR SELECT TO authenticated USING ((is_active AND deleted_at IS NULL) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Published titles are public" ON public.cms_titles;
CREATE POLICY "Titles anon read published" ON public.cms_titles
  FOR SELECT TO anon USING (is_published AND deleted_at IS NULL);
CREATE POLICY "Titles authed read" ON public.cms_titles
  FOR SELECT TO authenticated USING ((is_published AND deleted_at IS NULL) OR public.has_role(auth.uid(), 'admin'));

-- Admin-only reads should never be evaluated for anon
DROP POLICY IF EXISTS "settings admin read" ON public.cms_settings;
CREATE POLICY "settings admin read" ON public.cms_settings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "audit admin read" ON public.audit_log;
CREATE POLICY "audit admin read" ON public.audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "login history own read" ON public.login_history;
CREATE POLICY "login history own read" ON public.login_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "login history own insert" ON public.login_history;
CREATE POLICY "login history own insert" ON public.login_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. Profiles: hide security metadata; expose safe columns via a view
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

REVOKE SELECT ON public.profiles FROM anon;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
  SELECT id, display_name, handle, avatar_url FROM public.profiles;

-- view rows are still filtered by profiles RLS for the invoker
GRANT SELECT ON public.public_profiles TO authenticated;

-- 4. Enterprise leads: replace always-true insert check with validation
DROP POLICY IF EXISTS "leads anyone submit" ON public.enterprise_leads;
CREATE POLICY "leads anyone submit" ON public.enterprise_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) BETWEEN 1 AND 120
    AND length(email) BETWEEN 5 AND 200
    AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (org IS NULL OR length(org) <= 200)
    AND (plan IS NULL OR length(plan) <= 80)
    AND (message IS NULL OR length(message) <= 4000)
    AND status = 'new'
  );