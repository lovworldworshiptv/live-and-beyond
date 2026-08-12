CREATE TABLE public.kingschat_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_secret text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  return_path text NOT NULL DEFAULT '/',
  session jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.kingschat_login_attempts TO service_role;
ALTER TABLE public.kingschat_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE INDEX kingschat_login_attempts_created_at_idx ON public.kingschat_login_attempts (created_at);