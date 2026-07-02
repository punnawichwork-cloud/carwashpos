-- ============================================================
-- 0002_shared_job_queue.sql
-- คิวงานรวม: พนักงานทุกคนเห็น + จัดการงานที่ "ยังไม่จ่าย" (open/in_progress/done)
-- ของทุกคนได้ ("งานที่เหลือ") แต่งานที่ "จ่ายแล้ว" ยังเห็นเฉพาะเจ้าของงาน + owner
-- → ยอดรายรับของร้านยังไม่รั่วไปถึงพนักงานคนอื่น
--
-- รันไฟล์นี้ใน Supabase SQL Editor "หลัง" schema.sql (รันซ้ำได้ปลอดภัย)
-- สถานะที่ถือว่า "อยู่ในคิว": open / in_progress / done
-- ============================================================

-- ---- JOBS: select ----
drop policy if exists jobs_select on public.jobs;
create policy jobs_select on public.jobs
  for select to authenticated
  using (
    public.is_owner()
    or staff_id = auth.uid()
    or status in ('open', 'in_progress', 'done')
  );

-- ---- JOBS: update ----
-- using  = แถวที่แก้ได้: งานของตัวเอง / งานในคิว / owner
-- check  = สถานะปลายทางที่ยอมให้: คงอยู่ในคิว หรือเปลี่ยนเป็น paid ได้
--          (จึงมาร์ค "รับเงินแล้ว" ให้งานของคนอื่นได้ แล้วงานจะหลุดจากคิว)
--          void ทำได้เฉพาะเจ้าของงาน/owner เท่านั้น
drop policy if exists jobs_update on public.jobs;
create policy jobs_update on public.jobs
  for update to authenticated
  using (
    public.is_owner()
    or staff_id = auth.uid()
    or status in ('open', 'in_progress', 'done')
  )
  with check (
    public.is_owner()
    or staff_id = auth.uid()
    or status in ('open', 'in_progress', 'done', 'paid')
  );

-- jobs_insert (staff เปิดงานในนามตัวเอง) และ jobs_delete_owner คงเดิม — ไม่ต้องแก้

-- ---- JOB_SERVICES: สิทธิ์ตามงานแม่ (รวมงานในคิวของทุกคน) ----
drop policy if exists jobsvc_select on public.job_services;
create policy jobsvc_select on public.job_services
  for select to authenticated
  using (exists (
    select 1 from public.jobs j
    where j.id = job_id
      and (public.is_owner() or j.staff_id = auth.uid() or j.status in ('open', 'in_progress', 'done'))
  ));

drop policy if exists jobsvc_insert on public.job_services;
create policy jobsvc_insert on public.job_services
  for insert to authenticated
  with check (exists (
    select 1 from public.jobs j
    where j.id = job_id
      and (public.is_owner() or j.staff_id = auth.uid() or j.status in ('open', 'in_progress', 'done'))
  ));

drop policy if exists jobsvc_update on public.job_services;
create policy jobsvc_update on public.job_services
  for update to authenticated
  using (exists (
    select 1 from public.jobs j
    where j.id = job_id
      and (public.is_owner() or j.staff_id = auth.uid() or j.status in ('open', 'in_progress', 'done'))
  ))
  with check (exists (
    select 1 from public.jobs j
    where j.id = job_id
      and (public.is_owner() or j.staff_id = auth.uid() or j.status in ('open', 'in_progress', 'done'))
  ));

drop policy if exists jobsvc_delete on public.job_services;
create policy jobsvc_delete on public.job_services
  for delete to authenticated
  using (exists (
    select 1 from public.jobs j
    where j.id = job_id
      and (public.is_owner() or j.staff_id = auth.uid() or j.status in ('open', 'in_progress', 'done'))
  ));
