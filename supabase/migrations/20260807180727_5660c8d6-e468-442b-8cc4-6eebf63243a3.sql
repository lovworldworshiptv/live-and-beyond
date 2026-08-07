CREATE TABLE public.kingschat_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kingschat_user_id text NOT NULL,
  username text,
  name text,
  avatar_url text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kingschat_user_id),
  UNIQUE (user_id)
);

GRANT ALL ON public.kingschat_identities TO service_role;

ALTER TABLE public.kingschat_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to kingschat identities"
ON public.kingschat_identities
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);