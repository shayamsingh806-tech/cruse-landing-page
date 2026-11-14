create type public.app_role as enum ('admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users see own roles, admins see all" on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- First signed-in user can claim admin when none exist
create or replace function public.claim_first_admin()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from public.user_roles where role = 'admin') then
    return public.has_role(auth.uid(), 'admin');
  end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'admin');
  return true;
end $$;

-- Admins add staff by email (user must have signed in once)
create or replace function public.add_admin_by_email(_email text)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  select id into uid from auth.users where lower(email) = lower(trim(_email));
  if uid is null then return 'not_found'; end if;
  insert into public.user_roles (user_id, role) values (uid, 'admin') on conflict do nothing;
  return 'ok';
end $$;

create or replace function public.remove_admin(_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  if _user_id = auth.uid() then raise exception 'Cannot remove yourself'; end if;
  delete from public.user_roles where user_id = _user_id and role = 'admin';
end $$;

create or replace function public.list_admins()
returns table (user_id uuid, email text) language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  return query select r.user_id, u.email::text from public.user_roles r join auth.users u on u.id = r.user_id where r.role = 'admin';
end $$;

revoke execute on function public.claim_first_admin() from anon;
revoke execute on function public.add_admin_by_email(text) from anon;
revoke execute on function public.remove_admin(uuid) from anon;
revoke execute on function public.list_admins() from anon;

alter table public.bookings add column status text not null default 'new';
alter table public.enquiries add column status text not null default 'new';
alter table public.contact_messages add column status text not null default 'new';

grant select, update on public.bookings, public.enquiries, public.contact_messages to authenticated;

create policy "Admins read bookings" on public.bookings for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update bookings" on public.bookings for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins read enquiries" on public.enquiries for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update enquiries" on public.enquiries for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins read contact messages" on public.contact_messages for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update contact messages" on public.contact_messages for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));