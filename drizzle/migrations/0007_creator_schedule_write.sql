CREATE POLICY "schedule channel managers write" ON public.cms_schedule FOR ALL TO authenticated
USING (public.can_manage_channel(channel_id, auth.uid()))
WITH CHECK (public.can_manage_channel(channel_id, auth.uid()));
CREATE POLICY "schedule channel managers read" ON public.cms_schedule FOR SELECT TO authenticated
USING (public.can_manage_channel(channel_id, auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_schedule TO authenticated;