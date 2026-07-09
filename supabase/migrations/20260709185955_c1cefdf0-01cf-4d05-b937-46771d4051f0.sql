
CREATE POLICY "media_read_authenticated" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media');
CREATE POLICY "media_write_staff" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'creator')));
CREATE POLICY "media_update_staff" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'creator'))) WITH CHECK (bucket_id = 'media');
CREATE POLICY "media_delete_staff" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'creator')));
