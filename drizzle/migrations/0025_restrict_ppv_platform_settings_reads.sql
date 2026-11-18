ALTER POLICY ppv_settings_read ON public.ppv_platform_settings
TO authenticated
USING (
  public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.cms_channels AS channel
    WHERE channel.deleted_at IS NULL
      AND public.can_manage_channel(channel.id, (SELECT auth.uid()))
  )
);
