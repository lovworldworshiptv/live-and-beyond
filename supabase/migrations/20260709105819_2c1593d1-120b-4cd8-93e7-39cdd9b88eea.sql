
-- Add is_published to cms_schedule
alter table public.cms_schedule
  add column if not exists is_published boolean not null default true;

-- ---- Fix: cms_settings public read → admin-only ----
drop policy if exists "settings public read" on public.cms_settings;
create policy "settings admin read"
  on public.cms_settings for select
  using (public.has_role(auth.uid(), 'admin'));

-- ---- Lock down SECURITY DEFINER helpers ----
revoke execute on function public.handle_new_user() from public, authenticated, anon;
revoke execute on function public.set_updated_at() from public, authenticated, anon;
revoke execute on function public.has_role(uuid, app_role) from public, anon;

-- ============================================================
-- Data hygiene: audit columns on all CMS tables
-- ============================================================
do $$
declare
  t text;
  cms_tables text[] := array[
    'cms_channels','cms_titles','cms_collections',
    'cms_events','cms_schedule','cms_sponsors'
  ];
begin
  foreach t in array cms_tables loop
    execute format('alter table public.%I
      add column if not exists deleted_at timestamptz,
      add column if not exists created_by uuid references auth.users(id) on delete set null,
      add column if not exists updated_by uuid references auth.users(id) on delete set null,
      add column if not exists deleted_by uuid references auth.users(id) on delete set null', t);
    execute format('create index if not exists %I on public.%I (deleted_at) where deleted_at is null', t || '_not_deleted_idx', t);
  end loop;
end$$;

-- ---- Public reads must exclude soft-deleted rows ----
drop policy if exists "Published channels are public" on public.cms_channels;
create policy "Published channels are public"
  on public.cms_channels for select
  using ((is_published and deleted_at is null) or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Published titles are public" on public.cms_titles;
create policy "Published titles are public"
  on public.cms_titles for select
  using ((is_published and deleted_at is null) or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Published collections are public" on public.cms_collections;
create policy "Published collections are public"
  on public.cms_collections for select
  using ((is_published and deleted_at is null) or public.has_role(auth.uid(), 'admin'));

drop policy if exists "events public read" on public.cms_events;
create policy "events public read"
  on public.cms_events for select
  using ((is_published and deleted_at is null) or public.has_role(auth.uid(), 'admin'));

drop policy if exists "schedule public read" on public.cms_schedule;
create policy "schedule public read"
  on public.cms_schedule for select
  using ((is_published and deleted_at is null) or public.has_role(auth.uid(), 'admin'));

drop policy if exists "sponsors public read" on public.cms_sponsors;
create policy "sponsors public read"
  on public.cms_sponsors for select
  using ((is_active and deleted_at is null) or public.has_role(auth.uid(), 'admin'));

-- ---- Trigger: populate created_by/updated_by/deleted_by ----
create or replace function public.set_audit_actors()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
    new.updated_by := coalesce(new.updated_by, auth.uid());
  elsif tg_op = 'UPDATE' then
    new.updated_by := coalesce(auth.uid(), new.updated_by);
    if new.deleted_at is not null and old.deleted_at is null then
      new.deleted_by := coalesce(auth.uid(), new.deleted_by);
    end if;
  end if;
  return new;
end$$;

do $$
declare t text;
declare cms_tables text[] := array[
  'cms_channels','cms_titles','cms_collections',
  'cms_events','cms_schedule','cms_sponsors'
];
begin
  foreach t in array cms_tables loop
    execute format('drop trigger if exists %I on public.%I', 'trg_' || t || '_audit_actors', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.set_audit_actors()', 'trg_' || t || '_audit_actors', t);
  end loop;
end$$;

-- ============================================================
-- Audit log
-- ============================================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "audit admin read" on public.audit_log for select
  using (public.has_role(auth.uid(), 'admin'));
create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor_id);
create index if not exists audit_log_resource_idx on public.audit_log (resource_type, resource_id);

-- ============================================================
-- Login history
-- ============================================================
create table if not exists public.login_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null,
  provider text,
  ip_address text,
  user_agent text,
  success boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert on public.login_history to authenticated;
grant all on public.login_history to service_role;
alter table public.login_history enable row level security;
create policy "login history own read" on public.login_history for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "login history own insert" on public.login_history for insert
  with check (auth.uid() = user_id);
create index if not exists login_history_user_idx on public.login_history (user_id, created_at desc);

-- ============================================================
-- Profile bookkeeping
-- ============================================================
alter table public.profiles
  add column if not exists last_sign_in_at timestamptz,
  add column if not exists mfa_enrolled boolean not null default false;
