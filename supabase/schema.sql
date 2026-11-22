-- =============================================================================
-- CampusHub - database schema, security rules and storage buckets
-- =============================================================================
-- How to run: Supabase Dashboard > SQL Editor > New query > paste this whole
-- file > Run. The script is safe to run more than once.
--
-- Contents
--   1. Tables
--   2. Indexes
--   3. Helper functions and triggers
--   4. Grants (which roles may touch which tables at all)
--   5. Row Level Security policies (which ROWS each user may touch)
--   6. Storage buckets and storage policies
--
-- Roles used by Supabase
--   anon           a visitor who is not logged in
--   authenticated  any logged-in user (student or admin)
--   service_role   server-side code using the SECRET key (bypasses RLS)
-- =============================================================================


-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- One row per user. id is the same id as in auth.users (managed by Supabase Auth).
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text not null,
  student_id  text unique check (student_id ~ '^[A-Z0-9]{4,15}$'),
  department  text,
  year        smallint check (year between 1 and 5),
  bio         text check (char_length(bio) <= 500),
  avatar_url  text,
  role        text not null default 'student' check (role in ('student', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.clubs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text not null,
  category    text not null,
  image_url   text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Join table: which student is a member of which club.
create table if not exists public.club_members (
  id        uuid primary key default gen_random_uuid(),
  club_id   uuid not null references public.clubs (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (club_id, user_id)            -- a student can join a club only once
);

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null,
  event_date  date not null,
  event_time  time not null,
  location    text not null,
  organizer   text not null,
  capacity    integer not null check (capacity > 0),
  image_url   text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Join table: which student registered for which event.
create table if not exists public.event_registrations (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  registered_at timestamptz not null default now(),
  unique (event_id, user_id)           -- prevents duplicate registrations
);

create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  content    text not null,
  category   text not null default 'General'
             check (category in ('General', 'Academic', 'Examination', 'Placement', 'Event')),
  author_id  uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Metadata of an uploaded file. The file itself lives in the "resources" storage bucket.
create table if not exists public.resources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  subject     text not null,
  file_path   text not null unique,    -- path inside the storage bucket
  file_name   text not null,           -- original file name shown to users
  file_size   bigint not null check (file_size > 0),
  file_type   text,
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  -- The file must be in the uploader's own storage folder ("<user id>/<file>"),
  -- so nobody can point a row at someone else's file.
  constraint resources_file_in_uploader_folder check (split_part(file_path, '/', 1) = uploaded_by::text)
);

-- A comment belongs to exactly one club OR one event.
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  content    text not null check (char_length(content) between 1 and 1000),
  author_id  uuid not null references public.profiles (id) on delete cascade,
  club_id    uuid references public.clubs (id) on delete cascade,
  event_id   uuid references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(club_id, event_id) = 1)
);


-- =============================================================================
-- 2. INDEXES
-- =============================================================================
-- Primary keys and unique constraints are indexed automatically.
-- These cover foreign keys, columns used in RLS policies, and common sorts/filters.

create index if not exists club_members_user_id_idx        on public.club_members (user_id);
create index if not exists event_registrations_user_id_idx on public.event_registrations (user_id);
create index if not exists clubs_category_idx              on public.clubs (category);
create index if not exists clubs_created_by_idx            on public.clubs (created_by);
create index if not exists events_created_by_idx           on public.events (created_by);
create index if not exists announcements_author_id_idx     on public.announcements (author_id);
create index if not exists events_event_date_idx           on public.events (event_date);
create index if not exists announcements_created_at_idx    on public.announcements (created_at desc);
create index if not exists announcements_category_idx      on public.announcements (category);
create index if not exists resources_uploaded_by_idx       on public.resources (uploaded_by);
create index if not exists resources_created_at_idx        on public.resources (created_at desc);
create index if not exists comments_club_id_idx            on public.comments (club_id);
create index if not exists comments_event_id_idx           on public.comments (event_id);
create index if not exists comments_author_id_idx          on public.comments (author_id);


-- =============================================================================
-- 3. HELPER FUNCTIONS AND TRIGGERS
-- =============================================================================

-- The "private" schema is NOT exposed through the API, so functions in it can
-- only be used by the database itself (policies and triggers).
create schema if not exists private;

-- Is the current user an admin?
-- "security definer" makes the function read profiles with the owner's rights,
-- which avoids infinite recursion when it is used inside policies on profiles.
create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- Keeps updated_at current on every update.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

drop trigger if exists clubs_set_updated_at on public.clubs;
create trigger clubs_set_updated_at before update on public.clubs
  for each row execute function private.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events
  for each row execute function private.set_updated_at();

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at before update on public.announcements
  for each row execute function private.set_updated_at();

-- Creates the profile row automatically when someone registers.
-- The values come from the metadata sent with supabase.auth.signUp().
-- NOTE: role is never read from metadata (users control it), it always starts as 'student'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, student_id, department, year)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(upper(trim(new.raw_user_meta_data ->> 'student_id')), ''),
    nullif(trim(new.raw_user_meta_data ->> 'department'), ''),
    case
      when new.raw_user_meta_data ->> 'year' ~ '^[1-5]$'
      then (new.raw_user_meta_data ->> 'year')::smallint
    end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Refuses a registration when the event is already full.
-- Locking the event row makes two simultaneous registrations wait for each other,
-- so the last seat cannot be taken twice.
create or replace function private.check_event_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  seats integer;
  taken integer;
begin
  select capacity into seats from public.events where id = new.event_id for update;
  select count(*) into taken from public.event_registrations where event_id = new.event_id;

  if taken >= seats then
    raise exception 'EVENT_FULL';
  end if;
  return new;
end;
$$;

drop trigger if exists event_registrations_check_capacity on public.event_registrations;
create trigger event_registrations_check_capacity before insert on public.event_registrations
  for each row execute function private.check_event_capacity();


-- =============================================================================
-- 4. GRANTS
-- =============================================================================
-- New Supabase projects do not expose tables to the API automatically.
-- A GRANT decides whether a role may use a table at all; RLS (section 5)
-- then decides which rows. Both must allow an operation for it to succeed.

revoke all on table
  public.profiles, public.clubs, public.club_members, public.events,
  public.event_registrations, public.announcements, public.resources, public.comments
from anon, authenticated;

-- Server-side code using the secret key (seed script, admin "remove student").
grant select, insert, update, delete on table
  public.profiles, public.clubs, public.club_members, public.events,
  public.event_registrations, public.announcements, public.resources, public.comments
to service_role;

-- Visitors who are not logged in only see clubs and events (landing page preview).
grant select on table public.clubs, public.events to anon;

-- Logged-in users.
grant select on table public.profiles to authenticated;
-- Column-level grant: a user can edit these profile fields but can NEVER change
-- role, email or id - those columns are simply not updatable through the API.
grant update (full_name, student_id, department, year, bio, avatar_url)
  on table public.profiles to authenticated;

grant select, insert, update, delete on table
  public.clubs, public.events, public.announcements, public.resources
to authenticated;

grant select, insert, delete on table
  public.club_members, public.event_registrations, public.comments
to authenticated;


-- =============================================================================
-- 5. ROW LEVEL SECURITY
-- =============================================================================
-- With RLS enabled, a table returns NO rows until a policy allows it.
-- (select auth.uid()) is the id of the logged-in user; wrapping it in a
-- select lets Postgres evaluate it once per query instead of once per row.

alter table public.profiles            enable row level security;
alter table public.clubs               enable row level security;
alter table public.club_members        enable row level security;
alter table public.events              enable row level security;
alter table public.event_registrations enable row level security;
alter table public.announcements       enable row level security;
alter table public.resources           enable row level security;
alter table public.comments            enable row level security;

-- ---------- profiles ----------
drop policy if exists "Logged-in users can view profiles" on public.profiles;
create policy "Logged-in users can view profiles"
  on public.profiles for select to authenticated
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
-- No insert policy: rows are created by the handle_new_user trigger.
-- No delete policy: removing a user is done by an admin on the server.

-- ---------- clubs ----------
drop policy if exists "Anyone can view clubs" on public.clubs;
create policy "Anyone can view clubs"
  on public.clubs for select to anon, authenticated
  using (true);

drop policy if exists "Admins can create clubs" on public.clubs;
create policy "Admins can create clubs"
  on public.clubs for insert to authenticated
  with check ((select private.is_admin()));

drop policy if exists "Admins can update clubs" on public.clubs;
create policy "Admins can update clubs"
  on public.clubs for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists "Admins can delete clubs" on public.clubs;
create policy "Admins can delete clubs"
  on public.clubs for delete to authenticated
  using ((select private.is_admin()));

-- ---------- club_members ----------
drop policy if exists "Logged-in users can view memberships" on public.club_members;
create policy "Logged-in users can view memberships"
  on public.club_members for select to authenticated
  using (true);

drop policy if exists "Users can join clubs as themselves" on public.club_members;
create policy "Users can join clubs as themselves"
  on public.club_members for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can leave clubs, admins can remove members" on public.club_members;
create policy "Users can leave clubs, admins can remove members"
  on public.club_members for delete to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()));

-- ---------- events ----------
drop policy if exists "Anyone can view events" on public.events;
create policy "Anyone can view events"
  on public.events for select to anon, authenticated
  using (true);

drop policy if exists "Admins can create events" on public.events;
create policy "Admins can create events"
  on public.events for insert to authenticated
  with check ((select private.is_admin()));

drop policy if exists "Admins can update events" on public.events;
create policy "Admins can update events"
  on public.events for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists "Admins can delete events" on public.events;
create policy "Admins can delete events"
  on public.events for delete to authenticated
  using ((select private.is_admin()));

-- ---------- event_registrations ----------
drop policy if exists "Logged-in users can view registrations" on public.event_registrations;
create policy "Logged-in users can view registrations"
  on public.event_registrations for select to authenticated
  using (true);

drop policy if exists "Users can register themselves" on public.event_registrations;
create policy "Users can register themselves"
  on public.event_registrations for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can cancel, admins can remove registrations" on public.event_registrations;
create policy "Users can cancel, admins can remove registrations"
  on public.event_registrations for delete to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()));

-- ---------- announcements ----------
drop policy if exists "Logged-in users can view announcements" on public.announcements;
create policy "Logged-in users can view announcements"
  on public.announcements for select to authenticated
  using (true);

drop policy if exists "Admins can publish announcements" on public.announcements;
create policy "Admins can publish announcements"
  on public.announcements for insert to authenticated
  with check ((select private.is_admin()) and (select auth.uid()) = author_id);

drop policy if exists "Admins can update announcements" on public.announcements;
create policy "Admins can update announcements"
  on public.announcements for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists "Admins can delete announcements" on public.announcements;
create policy "Admins can delete announcements"
  on public.announcements for delete to authenticated
  using ((select private.is_admin()));

-- ---------- resources ----------
drop policy if exists "Logged-in users can view resources" on public.resources;
create policy "Logged-in users can view resources"
  on public.resources for select to authenticated
  using (true);

drop policy if exists "Users can upload resources as themselves" on public.resources;
create policy "Users can upload resources as themselves"
  on public.resources for insert to authenticated
  with check ((select auth.uid()) = uploaded_by);

drop policy if exists "Owners and admins can update resources" on public.resources;
create policy "Owners and admins can update resources"
  on public.resources for update to authenticated
  using ((select auth.uid()) = uploaded_by or (select private.is_admin()))
  with check ((select auth.uid()) = uploaded_by or (select private.is_admin()));

drop policy if exists "Owners and admins can delete resources" on public.resources;
create policy "Owners and admins can delete resources"
  on public.resources for delete to authenticated
  using ((select auth.uid()) = uploaded_by or (select private.is_admin()));

-- ---------- comments ----------
drop policy if exists "Logged-in users can view comments" on public.comments;
create policy "Logged-in users can view comments"
  on public.comments for select to authenticated
  using (true);

drop policy if exists "Users can comment as themselves" on public.comments;
create policy "Users can comment as themselves"
  on public.comments for insert to authenticated
  with check ((select auth.uid()) = author_id);

drop policy if exists "Authors and admins can delete comments" on public.comments;
create policy "Authors and admins can delete comments"
  on public.comments for delete to authenticated
  using ((select auth.uid()) = author_id or (select private.is_admin()));


-- =============================================================================
-- 6. STORAGE
-- =============================================================================
-- avatars    public   profile pictures, each user writes to a folder named after their id
-- images     public   club and event cover images, admins only
-- resources  private  study material, downloaded through short-lived signed URLs
-- file_size_limit is in bytes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('images', 'images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('resources', 'resources', false, 10485760, array[
    'application/pdf',
    'text/plain',
    'image/png',
    'image/jpeg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets need no select policy to SERVE files by URL. The select
-- policies below exist because deleting a file also requires reading it.
-- (storage.foldername(name))[1] is the first folder of the file path.

-- ---------- avatars ----------
drop policy if exists "avatars: users upload to their own folder" on storage.objects;
create policy "avatars: users upload to their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "avatars: users read their own files" on storage.objects;
create policy "avatars: users read their own files"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "avatars: users delete their own files" on storage.objects;
create policy "avatars: users delete their own files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- ---------- images (club and event covers) ----------
drop policy if exists "images: admins upload" on storage.objects;
create policy "images: admins upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and (select private.is_admin()));

drop policy if exists "images: admins read" on storage.objects;
create policy "images: admins read"
  on storage.objects for select to authenticated
  using (bucket_id = 'images' and (select private.is_admin()));

drop policy if exists "images: admins delete" on storage.objects;
create policy "images: admins delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'images' and (select private.is_admin()));

-- ---------- resources ----------
drop policy if exists "resources: users upload to their own folder" on storage.objects;
create policy "resources: users upload to their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'resources' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- Needed to create signed download URLs. Other students can only read files that
-- were actually shared (a resources row points at them), not uploads that were
-- picked and then cancelled. Owners and admins can read everything in their scope.
drop policy if exists "resources: logged-in users read" on storage.objects;
create policy "resources: logged-in users read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'resources'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (select private.is_admin())
      or exists (select 1 from public.resources r where r.file_path = objects.name)
    )
  );

drop policy if exists "resources: owners and admins delete" on storage.objects;
create policy "resources: owners and admins delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'resources'
    and ((storage.foldername(name))[1] = (select auth.uid()::text) or (select private.is_admin()))
  );
