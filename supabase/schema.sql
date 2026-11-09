-- Needverse backend for Supabase. Paste into: Dashboard -> SQL Editor -> Run.
-- Safe to re-run.

-- ---------- Tables ----------
create table if not exists public.products (
  id          text primary key,
  name        text not null,
  price_cents integer not null check (price_cents > 0),
  active      boolean not null default true
);

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  number         text not null unique,
  name           text not null,
  email          text not null,
  address        text not null,
  city           text not null,
  postal         text not null,
  payment_method text not null check (payment_method in ('card', 'online', 'delivery')),
  status         text not null default 'pending',
  total_cents    integer not null,
  created_at     timestamptz not null default now()
);

create table if not exists public.order_items (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  text not null references public.products(id),
  name        text not null,
  unit_cents  integer not null,
  qty         integer not null check (qty between 1 and 20)
);

insert into public.products (id, name, price_cents) values
  -- Amounts are in PAISE (INR x 100): 399900 = Rs 3,999.
  ('relaxer', 'Cordless Massage Gun',     399900),
  ('slate',   'Compact Car Vacuum',       549900),
  ('landing', 'Shiatsu Foot Massager',    599900),
  ('rinse',   'Portable Pressure Washer', 749900)
on conflict (id) do update
  set name = excluded.name, price_cents = excluded.price_cents;

-- ---------- Razorpay migration (safe to re-run) ----------
alter table public.orders add column if not exists currency text not null default 'INR';
alter table public.orders add column if not exists razorpay_order_id text unique;
alter table public.orders add column if not exists razorpay_payment_id text;
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
-- Fulfilment / supplier tracking (supplier-neutral)
alter table public.products add column if not exists supplier_name text;
alter table public.products add column if not exists supplier_sku text;
alter table public.orders add column if not exists fulfilment_status text not null default 'new';
alter table public.orders add column if not exists supplier_order_id text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_url text;
alter table public.orders add column if not exists shipped_at timestamptz;
alter table public.orders add column if not exists confirmation_sent_at timestamptz;
alter table public.orders drop constraint if exists orders_payment_method_check;
update public.orders set payment_method = 'online' where payment_method = 'card';
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('online', 'delivery'));

-- ---------- Row Level Security ----------
-- Visitors (anon key) can ONLY read active products. They cannot read or write
-- orders directly; orders are created only through place_order() below.
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "public can read active products" on public.products;
create policy "public can read active products" on public.products
  for select to anon, authenticated using (active);

revoke all on public.orders, public.order_items from anon, authenticated;
revoke insert, update, delete on public.products from anon, authenticated;

-- ---------- place_order(): the only write path ----------
create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name    text := left(btrim(coalesce(payload->>'name',    '')), 120);
  v_email   text := left(btrim(coalesce(payload->>'email',   '')), 254);
  v_address text := left(btrim(coalesce(payload->>'address', '')), 200);
  v_city    text := left(btrim(coalesce(payload->>'city',    '')), 100);
  v_postal  text := left(btrim(coalesce(payload->>'postal',  '')), 20);
  v_payment text := coalesce(payload->>'payment', '');
  v_items   jsonb := payload->'items';
  v_line    jsonb;
  v_prod    public.products%rowtype;
  v_qty     integer;
  v_total   integer := 0;
  v_order   uuid;
  v_number  text;
  v_seen    text[] := '{}';
  v_tries   integer := 0;
begin
  -- Only signed-in customers can place orders.
  if auth.uid() is null then
    raise exception 'not_signed_in' using errcode = '28000';
  end if;
  if v_name = '' or v_address = '' or v_city = '' or v_postal = '' then
    raise exception 'invalid_order: missing customer details' using errcode = 'P0001';
  end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'invalid_order: bad email' using errcode = 'P0001';
  end if;
  if v_payment not in ('online', 'delivery') then
    raise exception 'invalid_order: bad payment method' using errcode = 'P0001';
  end if;
  if jsonb_typeof(v_items) is distinct from 'array'
     or jsonb_array_length(v_items) not between 1 and 20 then
    raise exception 'invalid_order: bad items' using errcode = 'P0001';
  end if;

  -- First pass: validate every line and compute the total from OUR prices.
  for v_line in select * from jsonb_array_elements(v_items) loop
    if jsonb_typeof(v_line->'qty') is distinct from 'number'
       or (v_line->>'qty') !~ '^[0-9]{1,2}$' then
      raise exception 'invalid_order: bad quantity' using errcode = 'P0001';
    end if;
    v_qty := (v_line->>'qty')::integer;
    select * into v_prod from products where id = (v_line->>'id') and active;
    if not found or v_qty not between 1 and 20 or (v_line->>'id') = any (v_seen) then
      raise exception 'invalid_order: bad item' using errcode = 'P0001';
    end if;
    v_seen  := v_seen || v_prod.id;
    v_total := v_total + v_prod.price_cents * v_qty;
  end loop;

  -- Unique order number (retry on the rare collision).
  loop
    v_number := 'NV-' || (100000 + floor(random() * 900000))::int;
    exit when not exists (select 1 from orders where number = v_number);
    v_tries := v_tries + 1;
    if v_tries > 5 then raise exception 'could not allocate order number'; end if;
  end loop;

  insert into orders (number, name, email, address, city, postal, payment_method, total_cents, user_id)
  values (v_number, v_name, v_email, v_address, v_city, v_postal, v_payment, v_total, auth.uid())
  returning id into v_order;

  insert into order_items (order_id, product_id, name, unit_cents, qty)
  select v_order, p.id, p.name, p.price_cents, (l->>'qty')::integer
  from jsonb_array_elements(v_items) l
  join products p on p.id = l->>'id';

  return jsonb_build_object('id', v_order, 'number', v_number, 'total', v_total / 100.0, 'status', 'pending');
end;
$$;

revoke all on function public.place_order(jsonb) from public, anon;
grant execute on function public.place_order(jsonb) to authenticated;
