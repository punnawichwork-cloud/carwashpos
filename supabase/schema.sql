-- ============================================================
-- Car Wash POS — Supabase Schema v2 (Postgres 15)
-- ปรับจาก carwash_pos_schema.sql ให้ตรงกับ mockup ปัจจุบัน
--
-- สิ่งที่เพิ่มจาก v1:
--   + car_sizes  : เพิ่ม 2XL / 3XL / 4XL (รวมเป็น 7 ระดับ)
--   + brands / car_models : ยี่ห้อ-รุ่นรถ (owner แก้ CRUD ได้, ใช้ auto-fill ขนาด)
--   + job_services : ตารางลูกของ jobs — 1 งานมีได้หลายบริการ + บริการพิเศษกรอกราคาเอง
--   + jobs.total : ยอดรวมทั้งงาน (trigger คำนวณจาก job_services อัตโนมัติ)
--   ~ jobs.service_id / jobs.price : ยกเลิกการใช้ (ย้ายไป job_services) — คงไว้ nullable เพื่อ backward compat
--   ~ view สรุป : อ่านจาก job_services
--
-- รันทั้งไฟล์นี้ใน Supabase SQL Editor ของ project ใหม่ได้เลย
-- (ถ้าเคยรัน v1 ไปแล้ว ให้รันบน project ใหม่ หรือดูหมายเหตุ ALTER ท้ายไฟล์)
-- ============================================================


-- ============================================================
-- 1) PROFILES + ROLE  (เหมือน v1)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  role        text not null default 'staff' check (role in ('owner','staff')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create or replace function public.is_owner()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner' and active = true
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 2) ตารางอ้างอิง: ขนาดรถ / บริการ / ราคา / ตั้งค่าร้าน
-- ============================================================
create table if not exists public.car_sizes (
  code        text primary key,          -- S / M / L / XL / 2XL / 3XL / 4XL
  name_th     text not null,
  note        text,
  sort_order  int not null default 0
);

create table if not exists public.services (
  id          text primary key,           -- slug เช่น wash_vacuum
  name_th     text not null,
  active      boolean not null default true,
  sort_order  int not null default 0
);

create table if not exists public.price_matrix (
  service_id  text not null references public.services(id) on delete cascade,
  size_code   text not null references public.car_sizes(code) on delete cascade,
  price       int  not null check (price >= 0),
  primary key (service_id, size_code)
);

create table if not exists public.shop_config (
  id            int primary key default 1 check (id = 1),
  shop_name     text not null default 'ร้านล้างรถ',
  promptpay_id  text not null default '',
  updated_at    timestamptz not null default now()
);
insert into public.shop_config (id) values (1) on conflict (id) do nothing;


-- ============================================================
-- 2.1) ยี่ห้อ & รุ่นรถ (ใหม่ v2) — owner แก้ CRUD, ใช้ auto-fill ขนาดตอนเปิดงาน
-- ============================================================
create table if not exists public.brands (
  id          bigint generated always as identity primary key,
  name_th     text not null,
  sort_order  int not null default 0
);

create table if not exists public.car_models (
  id          bigint generated always as identity primary key,
  brand_id    bigint not null references public.brands(id) on delete cascade,
  name        text not null,
  size_code   text references public.car_sizes(code),   -- ขนาดเริ่มต้นของรุ่นนี้ (auto-fill)
  sort_order  int not null default 0
);
create index if not exists car_models_brand_idx on public.car_models (brand_id);


-- ============================================================
-- 3) CUSTOMERS (auto-fill ลูกค้าประจำ — เขียนผ่าน trigger เท่านั้น)
-- ============================================================
create table if not exists public.customers (
  plate        text primary key,
  province     text,
  brand        text,
  model        text,
  size_code    text references public.car_sizes(code),
  visit_count  int not null default 0,
  last_seen    timestamptz not null default now()
);


-- ============================================================
-- 4) JOBS (header) + JOB_SERVICES (line items)
-- ============================================================
create table if not exists public.jobs (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  plate          text not null,
  province       text,
  brand          text,
  model          text,
  size_code      text not null references public.car_sizes(code),
  total          int not null default 0,       -- ยอดรวมทั้งงาน (trigger คำนวณจาก job_services)
  staff_id       uuid not null references public.profiles(id) default auth.uid(),
  status         text not null default 'open'
                  check (status in ('open','in_progress','done','paid','void')),
  payment_method text check (payment_method in ('cash','promptpay')),
  paid_at        timestamptz,
  closed_at      timestamptz,
  note           text,
  -- legacy (ยกเลิกการใช้ ย้ายไป job_services) — คงไว้ nullable เพื่อ backward compat
  service_id     text references public.services(id),
  price          int
);

create index if not exists jobs_created_at_idx on public.jobs (created_at);
create index if not exists jobs_staff_idx      on public.jobs (staff_id);
create index if not exists jobs_plate_idx      on public.jobs (plate);

-- รายการบริการต่องาน: บริการปกติ (service_id) หรือบริการพิเศษกรอกเอง (custom_name)
create table if not exists public.job_services (
  id          bigint generated always as identity primary key,
  job_id      bigint not null references public.jobs(id) on delete cascade,
  service_id  text references public.services(id),   -- null = บริการพิเศษ
  custom_name text,                                   -- ใช้เมื่อ service_id เป็น null
  price       int not null check (price >= 0),        -- snapshot ราคา ณ เวลาเปิดงาน
  constraint job_service_kind check (service_id is not null or custom_name is not null)
);
create index if not exists job_services_job_idx on public.job_services (job_id);

-- เติมราคา line จาก price_matrix ถ้าเป็นบริการปกติและ client ไม่ได้ส่ง price
create or replace function public.set_line_price()
returns trigger language plpgsql security definer set search_path = public as $$
declare j_size text;
begin
  if new.price is null and new.service_id is not null then
    select size_code into j_size from public.jobs where id = new.job_id;
    select price into new.price
    from public.price_matrix
    where service_id = new.service_id and size_code = j_size;
  end if;
  new.price := coalesce(new.price, 0);
  return new;
end;
$$;

drop trigger if exists trg_set_line_price on public.job_services;
create trigger trg_set_line_price
  before insert on public.job_services
  for each row execute function public.set_line_price();

-- คำนวณ jobs.total ใหม่ทุกครั้งที่ line เปลี่ยน
create or replace function public.recalc_job_total()
returns trigger language plpgsql security definer set search_path = public as $$
declare jid bigint;
begin
  jid := coalesce(new.job_id, old.job_id);
  update public.jobs
    set total = coalesce((select sum(price) from public.job_services where job_id = jid), 0)
    where id = jid;
  return null;
end;
$$;

drop trigger if exists trg_recalc_job_total on public.job_services;
create trigger trg_recalc_job_total
  after insert or update or delete on public.job_services
  for each row execute function public.recalc_job_total();

-- upsert ลูกค้าประจำทุกครั้งที่เปิดงาน (เหมือน v1)
create or replace function public.upsert_customer()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.customers (plate, province, brand, model, size_code, visit_count, last_seen)
  values (new.plate, new.province, new.brand, new.model, new.size_code, 1, now())
  on conflict (plate) do update set
    province    = coalesce(excluded.province, customers.province),
    brand       = coalesce(excluded.brand, customers.brand),
    model       = coalesce(excluded.model, customers.model),
    size_code   = coalesce(excluded.size_code, customers.size_code),
    visit_count = customers.visit_count + 1,
    last_seen   = now();
  return new;
end;
$$;

drop trigger if exists trg_upsert_customer on public.jobs;
create trigger trg_upsert_customer
  after insert on public.jobs
  for each row execute function public.upsert_customer();


-- ============================================================
-- 5) ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles     enable row level security;
alter table public.car_sizes    enable row level security;
alter table public.services     enable row level security;
alter table public.price_matrix enable row level security;
alter table public.shop_config  enable row level security;
alter table public.brands       enable row level security;
alter table public.car_models   enable row level security;
alter table public.customers    enable row level security;
alter table public.jobs         enable row level security;
alter table public.job_services enable row level security;

-- PROFILES
create policy profiles_select on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_owner());
create policy profiles_update_owner on public.profiles
  for update to authenticated using (public.is_owner()) with check (public.is_owner());

-- ตารางอ้างอิง: login แล้วอ่านได้ / แก้ได้เฉพาะ owner
create policy ref_sizes_read   on public.car_sizes    for select to authenticated using (true);
create policy ref_sizes_write  on public.car_sizes    for all    to authenticated using (public.is_owner()) with check (public.is_owner());
create policy ref_svc_read     on public.services     for select to authenticated using (true);
create policy ref_svc_write    on public.services     for all    to authenticated using (public.is_owner()) with check (public.is_owner());
create policy ref_price_read   on public.price_matrix for select to authenticated using (true);
create policy ref_price_write  on public.price_matrix for all    to authenticated using (public.is_owner()) with check (public.is_owner());
create policy ref_cfg_read     on public.shop_config  for select to authenticated using (true);
create policy ref_cfg_write    on public.shop_config  for all    to authenticated using (public.is_owner()) with check (public.is_owner());
create policy ref_brand_read   on public.brands       for select to authenticated using (true);
create policy ref_brand_write  on public.brands       for all    to authenticated using (public.is_owner()) with check (public.is_owner());
create policy ref_model_read   on public.car_models   for select to authenticated using (true);
create policy ref_model_write  on public.car_models   for all    to authenticated using (public.is_owner()) with check (public.is_owner());

-- CUSTOMERS: อ่านได้ทุกคน เขียนผ่าน trigger เท่านั้น
create policy cust_read on public.customers for select to authenticated using (true);

-- JOBS: owner ทุกแถว / staff เฉพาะแถวตัวเอง
create policy jobs_select on public.jobs
  for select to authenticated using (public.is_owner() or staff_id = auth.uid());
create policy jobs_insert on public.jobs
  for insert to authenticated with check (staff_id = auth.uid());
create policy jobs_update on public.jobs
  for update to authenticated
  using (public.is_owner() or staff_id = auth.uid())
  with check (public.is_owner() or staff_id = auth.uid());
create policy jobs_delete_owner on public.jobs
  for delete to authenticated using (public.is_owner());

-- JOB_SERVICES: สิทธิ์ตามงานแม่ (staff แก้ได้เฉพาะ line ของงานตัวเอง)
create policy jobsvc_select on public.job_services
  for select to authenticated
  using (exists (select 1 from public.jobs j where j.id = job_id
                 and (public.is_owner() or j.staff_id = auth.uid())));
create policy jobsvc_insert on public.job_services
  for insert to authenticated
  with check (exists (select 1 from public.jobs j where j.id = job_id
                      and (public.is_owner() or j.staff_id = auth.uid())));
create policy jobsvc_update on public.job_services
  for update to authenticated
  using (exists (select 1 from public.jobs j where j.id = job_id
                 and (public.is_owner() or j.staff_id = auth.uid())))
  with check (exists (select 1 from public.jobs j where j.id = job_id
                      and (public.is_owner() or j.staff_id = auth.uid())));
create policy jobsvc_delete on public.job_services
  for delete to authenticated
  using (exists (select 1 from public.jobs j where j.id = job_id
                 and (public.is_owner() or j.staff_id = auth.uid())));


-- ============================================================
-- 6) REALTIME
-- ============================================================
alter publication supabase_realtime add table public.jobs;
alter publication supabase_realtime add table public.job_services;


-- ============================================================
-- 7) VIEW สรุป (security_invoker=on -> owner เท่านั้นที่เห็นภาพรวมทั้งร้าน)
-- ============================================================
create or replace view public.v_daily_revenue
with (security_invoker = on) as
  select (created_at at time zone 'Asia/Bangkok')::date as biz_date,
         count(*)                                              as job_count,
         coalesce(sum(total) filter (where status = 'paid'), 0) as revenue_paid,
         coalesce(sum(total), 0)                                as revenue_all
  from public.jobs
  where status <> 'void'
  group by 1
  order by 1 desc;

create or replace view public.v_service_breakdown
with (security_invoker = on) as
  select coalesce(s.name_th, js.custom_name, 'บริการพิเศษ') as service,
         j.size_code,
         count(*)                                            as line_count,
         coalesce(sum(js.price) filter (where j.status = 'paid'), 0) as revenue
  from public.job_services js
  join public.jobs j     on j.id = js.job_id
  left join public.services s on s.id = js.service_id
  where j.status <> 'void'
  group by 1, 2
  order by revenue desc;


-- ============================================================
-- 8) SEED DATA (ขนาดรถ 7 ระดับ + บริการ + ราคา + ยี่ห้อตัวอย่าง)
-- ============================================================
insert into public.car_sizes (code, name_th, note, sort_order) values
  ('S',   'เล็ก',        'อีโคคาร์ / เก๋งเล็ก',      1),
  ('M',   'กลาง',        'เก๋ง / กระบะตอนเดียว',     2),
  ('L',   'ใหญ่',        'SUV / กระบะ 4 ประตู',      3),
  ('XL',  'พิเศษ',       'รถตู้ / รถใหญ่',           4),
  ('2XL', '2 ตอน',       'กระบะ 2 ตอนยกสูง',         5),
  ('3XL', 'ตู้ใหญ่',     'รถตู้ใหญ่ / รถบ้าน',       6),
  ('4XL', 'บรรทุก',      'รถบรรทุก 6 ล้อ+',          7)
on conflict (code) do nothing;

insert into public.services (id, name_th, sort_order) values
  ('wash_vacuum', 'ล้างสี + ดูดฝุ่น', 1),
  ('wash_only',   'ล้างอย่างเดียว',   2),
  ('wax',         'เคลือบเงา',        3)
on conflict (id) do nothing;

insert into public.price_matrix (service_id, size_code, price) values
  ('wash_vacuum','S',100),('wash_vacuum','M',120),('wash_vacuum','L',150),('wash_vacuum','XL',200),
  ('wash_vacuum','2XL',250),('wash_vacuum','3XL',300),('wash_vacuum','4XL',400),
  ('wash_only','S',60),('wash_only','M',80),('wash_only','L',100),('wash_only','XL',130),
  ('wash_only','2XL',160),('wash_only','3XL',200),('wash_only','4XL',260),
  ('wax','S',200),('wax','M',250),('wax','L',300),('wax','XL',400),
  ('wax','2XL',500),('wax','3XL',650),('wax','4XL',850)
on conflict (service_id, size_code) do nothing;


-- ============================================================
-- หมายเหตุ: ถ้าเคยรัน v1 (มี jobs.service_id / jobs.price แบบ NOT NULL) มาก่อน
-- ให้รันชุดนี้เพื่อ migrate โครงเดิม (ไม่ต้องรันถ้าเป็น project ใหม่):
--
--   alter table public.jobs alter column service_id drop not null;
--   alter table public.jobs alter column price      drop not null;
--   alter table public.jobs add column if not exists total int not null default 0;
--   -- ย้ายข้อมูลเดิมเข้า job_services:
--   insert into public.job_services (job_id, service_id, price)
--     select id, service_id, coalesce(price,0) from public.jobs where service_id is not null;
-- ============================================================
