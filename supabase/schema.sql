-- =====================================================================
-- Paraguay en motorhome · esquema de Supabase
-- Ejecutar UNA vez en: Supabase → SQL Editor → New query → Run
-- Antes de ejecutar, cambia 'CAMBIA-ESTA-CLAVE' por la clave del viaje
-- (la que compartirás solo con quienes pueden hacer check-in).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- Clave del viaje: nadie la puede leer desde el sitio (RLS sin políticas)
create table if not exists public.trip_secret (
  id int primary key default 1 check (id = 1),
  pass_hash text not null
);
alter table public.trip_secret enable row level security;
insert into public.trip_secret (id, pass_hash)
values (1, extensions.crypt('CAMBIA-ESTA-CLAVE', extensions.gen_salt('bf')))
on conflict (id) do update set pass_hash = excluded.pass_hash;

-- Check-ins: una fila por estadía (llegada y, cuando se registra, salida)
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  stop_key text not null,               -- clave de la parada del plan, o 'x-…' si no estaba planificada
  stop_name text,                       -- nombre visible (para paradas no planificadas)
  place_id int,                         -- id iOverlander del hospedaje elegido (null si no está listado)
  place_name text,
  lat double precision,
  lon double precision,
  arrived date not null,
  departed date,
  cost_amount numeric,
  cost_currency text default 'PYG',
  rating int check (rating between 1 and 5),
  comment text,
  author text,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.checkins enable row level security;
drop policy if exists "checkins lectura publica" on public.checkins;
create policy "checkins lectura publica" on public.checkins for select using (true);

-- Plan compartido (paradas, noches, hospedaje elegido, escenario de salida)
create table if not exists public.trip_plan (
  id int primary key default 1 check (id = 1),
  data jsonb not null,
  updated_by text,
  updated_at timestamptz not null default now()
);
alter table public.trip_plan enable row level security;
drop policy if exists "plan lectura publica" on public.trip_plan;
create policy "plan lectura publica" on public.trip_plan for select using (true);

-- ---------------------------------------------------------------------
-- Escritura solo mediante funciones que validan la clave del viaje
-- ---------------------------------------------------------------------
create or replace function public._trip_check(p_pass text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_pass is null or not exists (select 1 from trip_secret where pass_hash = crypt(p_pass, pass_hash)) then
    raise exception 'Clave del viaje incorrecta' using errcode = '28000';
  end if;
end $$;
revoke all on function public._trip_check(text) from public, anon, authenticated;

create or replace function public.trip_login(p_pass text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform _trip_check(p_pass);
  return true;
end $$;

create or replace function public.save_checkin(p_pass text, p jsonb) returns public.checkins
language plpgsql security definer set search_path = public, extensions as $$
declare r public.checkins;
begin
  perform _trip_check(p_pass);
  if (p->>'id') is not null then
    update checkins set
      stop_key = coalesce(p->>'stop_key', stop_key),
      stop_name = p->>'stop_name',
      place_id = (p->>'place_id')::int,
      place_name = p->>'place_name',
      lat = (p->>'lat')::double precision,
      lon = (p->>'lon')::double precision,
      arrived = coalesce((p->>'arrived')::date, arrived),
      departed = (p->>'departed')::date,
      cost_amount = (p->>'cost_amount')::numeric,
      cost_currency = p->>'cost_currency',
      rating = (p->>'rating')::int,
      comment = p->>'comment',
      author = p->>'author',
      deleted = coalesce((p->>'deleted')::boolean, false),
      updated_at = now()
    where id = (p->>'id')::uuid
    returning * into r;
  else
    insert into checkins (stop_key, stop_name, place_id, place_name, lat, lon, arrived, departed,
                          cost_amount, cost_currency, rating, comment, author)
    values (p->>'stop_key', p->>'stop_name', (p->>'place_id')::int, p->>'place_name',
            (p->>'lat')::double precision, (p->>'lon')::double precision,
            (p->>'arrived')::date, (p->>'departed')::date,
            (p->>'cost_amount')::numeric, coalesce(p->>'cost_currency', 'PYG'),
            (p->>'rating')::int, p->>'comment', p->>'author')
    returning * into r;
  end if;
  return r;
end $$;

create or replace function public.save_plan(p_pass text, p_data jsonb, p_by text) returns public.trip_plan
language plpgsql security definer set search_path = public, extensions as $$
declare r public.trip_plan;
begin
  perform _trip_check(p_pass);
  insert into trip_plan (id, data, updated_by, updated_at) values (1, p_data, p_by, now())
  on conflict (id) do update set data = excluded.data, updated_by = excluded.updated_by, updated_at = now()
  returning * into r;
  return r;
end $$;

grant execute on function public.trip_login(text) to anon, authenticated;
grant execute on function public.save_checkin(text, jsonb) to anon, authenticated;
grant execute on function public.save_plan(text, jsonb, text) to anon, authenticated;

-- Para cambiar la clave más adelante:
-- update public.trip_secret set pass_hash = extensions.crypt('NUEVA-CLAVE', extensions.gen_salt('bf')) where id = 1;
