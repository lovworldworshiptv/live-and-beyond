DROP POLICY IF EXISTS "Anyone can record playback events" ON public.playback_events;
CREATE POLICY "Anyone can record own playback events"
  ON public.playback_events FOR INSERT TO anon, authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND service IS NOT NULL AND event IS NOT NULL
    AND seconds >= 0
  );

DROP POLICY IF EXISTS "media_read_authenticated" ON storage.objects;
CREATE POLICY "media_read_owner_or_admin" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND (owner_id = (select auth.uid()::text) OR public.has_role(auth.uid(),'admin')));

DROP POLICY IF EXISTS "media_update_staff" ON storage.objects;
CREATE POLICY "media_update_owner_or_admin" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND (owner_id = (select auth.uid()::text) OR public.has_role(auth.uid(),'admin')))
  WITH CHECK (bucket_id = 'media' AND (owner_id = (select auth.uid()::text) OR public.has_role(auth.uid(),'admin')));