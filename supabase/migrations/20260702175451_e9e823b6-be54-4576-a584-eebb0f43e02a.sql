
-- Roles
create type public.app_role as enum ('viewer', 'creator', 'admin');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  handle text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users view own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

-- Admins can view all roles
create policy "Admins view all roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- New user trigger: create profile + assign viewer role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, handle, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'handle', '@' || split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'viewer')
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Updated_at trigger utility
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- CMS: Channels
create table public.cms_channels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  description text,
  category text,
  language text,
  country text,
  logo_url text,
  banner_url text,
  kind text not null default 'video', -- video | radio
  is_live boolean not null default false,
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.cms_channels to anon, authenticated;
grant all on public.cms_channels to service_role;
alter table public.cms_channels enable row level security;
create policy "Published channels are public" on public.cms_channels for select using (is_published or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage channels" on public.cms_channels for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger cms_channels_updated_at before update on public.cms_channels for each row execute function public.set_updated_at();

-- CMS: Titles (on-demand)
create table public.cms_titles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  synopsis text,
  kind text not null default 'movie', -- movie | series | podcast
  genre text,
  year int,
  duration_minutes int,
  poster_url text,
  backdrop_url text,
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.cms_titles to anon, authenticated;
grant all on public.cms_titles to service_role;
alter table public.cms_titles enable row level security;
create policy "Published titles are public" on public.cms_titles for select using (is_published or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage titles" on public.cms_titles for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger cms_titles_updated_at before update on public.cms_titles for each row execute function public.set_updated_at();

-- CMS: Collections
create table public.cms_collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  cover_url text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.cms_collections to anon, authenticated;
grant all on public.cms_collections to service_role;
alter table public.cms_collections enable row level security;
create policy "Published collections are public" on public.cms_collections for select using (is_published or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage collections" on public.cms_collections for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger cms_collections_updated_at before update on public.cms_collections for each row execute function public.set_updated_at();
