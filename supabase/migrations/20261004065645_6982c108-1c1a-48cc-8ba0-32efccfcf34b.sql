create table public.chat_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('chat_open','chat_message','recommendation_click','checkout_start')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

grant insert on public.chat_events to anon, authenticated;
grant select on public.chat_events to authenticated;
grant all on public.chat_events to service_role;

alter table public.chat_events enable row level security;

create policy "Anyone can log a chat event"
on public.chat_events for insert to anon, authenticated
with check (true);

create policy "Admins can read chat events"
on public.chat_events for select to authenticated
using (public.has_role(auth.uid(), 'admin'));