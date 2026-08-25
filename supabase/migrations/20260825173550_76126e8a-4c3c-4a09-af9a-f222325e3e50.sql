REVOKE ALL ON FUNCTION public.can_manage_channel(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_channel(uuid, uuid) TO authenticated, service_role;