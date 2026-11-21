-- -----------------------------------------------------------------------------
-- Migrasi live: Push Notification (PWA) + tanggal jatuh tempo piutang pelanggan.
-- Jalankan di Supabase SQL Editor (urut, satu file).
-- -----------------------------------------------------------------------------

-- 1. Langganan push per perangkat (per pengguna)
--    endpoint unik: satu device = satu baris.
create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Pengguna hanya boleh mengelola langganan miliknya sendiri.
drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete to authenticated
  using (user_id = auth.uid());

-- 2. Anti-spam: mencatat notifikasi yang sudah terkirim per entitas
--    (mis. "stok:produk-12" atau "overdue:customer-5").
--    RLS aktif tetapi tanpa policy => hanya service role (server) yang bisa
--    membaca/menulis. Klien browser tidak punya akses sama sekali.
create table if not exists public.push_sent_log (
  id bigint generated always as identity primary key,
  kind text not null,
  ref_key text not null,
  sent_at timestamptz not null default now(),
  unique (kind, ref_key)
);

alter table public.push_sent_log enable row level security;

-- 3. Piutang pelanggan: tanggal jatuh tempo (nullable, format YYYY-MM-DD)
alter table public.customers
  add column if not exists debt_due_date date;
