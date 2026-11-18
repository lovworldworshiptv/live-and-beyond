REVOKE ALL ON public.ppv_orders FROM anon,authenticated;
GRANT SELECT ON public.ppv_orders TO authenticated;
GRANT ALL ON public.ppv_orders TO service_role;
REVOKE ALL ON public.ppv_playback_assets FROM anon,authenticated;
GRANT ALL ON public.ppv_playback_assets TO service_role;