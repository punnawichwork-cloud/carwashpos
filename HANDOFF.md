# HANDOFF — Car Wash POS (ระบบ POS ร้านล้างรถ)

เอกสารส่งต่อสำหรับทีมพัฒนา — อ่านจบแล้วรับช่วงพัฒนา/ดูแลต่อได้ทันที
สถานะ: **แอป live บน production แล้ว ใช้งานได้จริง** (staff + owner ครบทุกฟีเจอร์)

---

## 0. ลิงก์สำคัญ (Quick reference)

| อย่าง | ค่า |
|---|---|
| Production URL | https://carwashpos.pages.dev |
| GitHub repo | https://github.com/punnawichwork-cloud/carwashpos (branch `main`) |
| Hosting | Cloudflare Pages (auto-deploy เมื่อ push `main`) |
| Supabase project ref | `xpgnsshnxknxxpvuhwyh` (region ap-southeast-1) |
| Supabase URL | https://xpgnsshnxknxxpvuhwyh.supabase.co |
| เอกสารออกแบบ/สเปคเดิม | `../design_handoff_carwash_pos/` (README.md + mockups .dc.html) |
| แผนพัฒนาเดิม (WP-0..5) | `../DEV_PLAN.md` |

> **anon key** เปิดเผยใน client ได้ (RLS ปกป้องข้อมูล) — เก็บใน `.env` (gitignore) และตั้งเป็น env var ใน Cloudflare

---

## 1. ระบบทำอะไร

POS ร้านล้างรถขนาดเล็ก–กลาง เป้าหมาย **ต้นทุน ฿0/เดือน** (free tier ล้วน) มี 2 บทบาท:

- **staff (พนักงาน · มือถือ/PWA):** เปิดงานใหม่ → สร้าง QR พร้อมเพย์ → จัดการงานใน **คิวรวม**
- **owner (เจ้าของ · เดสก์ท็อป):** ทุกอย่างของ staff + แดชบอร์ดรายรับ + จัดการราคา/บริการ/ยี่ห้อ-รุ่น/ตั้งค่าร้าน + ส่งออก CSV

**หลักการที่ห้ามละเมิด:**
1. เส้นแบ่งสิทธิ์บังคับที่ **ระดับฐานข้อมูล (RLS)** — UI แค่สะท้อนสิทธิ์
2. Deploy ได้เฉพาะ **Cloudflare Pages** (Vercel Hobby / GitHub Pages ห้ามใช้เชิงพาณิชย์บน free tier)
3. ไม่มี payment gateway — QR พร้อมเพย์สร้าง client-side เงินเข้าบัญชีร้านตรง ยืนยันจ่ายด้วยมือ

**คิวงานรวม (ปรับจากสเปคเดิม):** เดิมสเปคว่า staff เห็นเฉพาะงานตัวเอง — ปัจจุบันเปลี่ยนเป็น **staff ทุกคนเห็น + จัดการงานที่ยังไม่จ่าย (open/in_progress/done) ของกันและกันได้** ส่วนงานที่จ่ายแล้ว/void เห็นเฉพาะเจ้าของงาน + owner (รายรับไม่รั่วถึงพนักงาน) — บังคับด้วย migration `0002_shared_job_queue.sql`

---

## 2. Tech stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Vite 5 + React 18 + TypeScript |
| Styling | Tailwind CSS 3 (design tokens ใน `tailwind.config.js`) |
| Routing | react-router-dom v6 |
| Server state | @tanstack/react-query v5 |
| Backend/DB/Auth/Realtime | Supabase (free tier) + @supabase/supabase-js v2 |
| Charts | recharts |
| PromptPay QR | `promptpay-qr` + `qrcode` (client-side) |
| Deploy | Cloudflare Pages, build `npm run build` → `dist` |
| Node | **22** (pin ไว้ที่ `.node-version`) |

**Conventions:** TypeScript ทุกไฟล์ · UI copy = ภาษาไทย, code/identifier/comment = อังกฤษ · feature folders + thin `*.service.ts` (การยิง Supabase อยู่ใน service layer เท่านั้น) · component เป็น presentational · ห้ามสร้าง God component

---

## 3. โครงสร้างโปรเจกต์

```
carwashpos/ (repo = โฟลเดอร์ app/)
├── HANDOFF.md              ← เอกสารนี้
├── .node-version           ← "22" (Cloudflare อ่านเพื่อเลือก Node)
├── wrangler.jsonc          ← config สำหรับ deploy แบบ Workers (ปัจจุบันใช้ Pages — ดูข้อ 6)
├── .env.example            ← template env (ห้ามใส่ค่าจริง)
├── supabase/
│   ├── schema.sql          ← schema หลัก v2 (ตาราง/RLS/trigger/view/seed)
│   └── migrations/
│       └── 0002_shared_job_queue.sql   ← RLS คิวงานรวม (ต้องรันเพิ่มหลัง schema)
└── src/
    ├── main.tsx            ← providers: QueryClient + Router + Auth + Toast
    ├── App.tsx             ← route table + role guards
    ├── index.css           ← Tailwind + base + CSS vars
    ├── lib/
    │   ├── supabase.ts         ← client singleton (อ่าน VITE_SUPABASE_*)
    │   ├── database.types.ts   ← DB types (เขียนมือจาก schema — ดู §5.4)
    │   ├── format.ts           ← baht(), timeHM(), dateTH(), todayRange/weekRange/monthRange (TZ Asia/Bangkok)
    │   ├── promptpay.ts        ← generatePromptPayQR(id, amount) → data-URL
    │   ├── csv.ts              ← downloadCsv() (BOM + escape)
    │   ├── constants.ts        ← design tokens: badge สี, palette, provinces
    │   └── utils.ts            ← cn() (clsx + tailwind-merge)
    ├── components/         ← SizeBadge, StatusBadge, BottomSheet, PromptPayQR, Toast, Spinner
    ├── layouts/            ← StaffShell (มือถือ), OwnerShell (เดสก์ท็อป)
    └── features/
        ├── auth/           ← AuthProvider, useAuth, RequireRole, LoginPage, auth.service.ts
        ├── reference/      ← reference.service.ts + hooks (sizes/services/prices/brands/config)
        ├── jobs/           ← เปิดงาน/คิวงาน/QR/รับเงิน/แก้ไข + realtime (ดู §7)
        ├── dashboard/      ← DashboardPage + dashboard.service.ts
        ├── manage/         ← ManagePage + PriceMatrixEditor + manage.service.ts
        └── export/         ← ExportPage (CSV)
```

**Routes** (`src/App.tsx`):

| Route | Role | Shell | หน้า |
|---|---|---|---|
| `/login` | public | — | เข้าสู่ระบบ / สมัคร |
| `/new` | staff+owner | StaffShell | เปิดงานใหม่ |
| `/jobs` | staff+owner | StaffShell | คิวงานวันนี้ |
| `/dashboard` | owner | OwnerShell | แดชบอร์ด |
| `/manage` | owner | OwnerShell | จัดการราคา/บริการ/ยี่ห้อ/ตั้งค่าร้าน |
| `/export` | owner | OwnerShell | ส่งออก CSV |

หลัง login: อ่าน `profiles.role` → staff ไป `/new`, owner ไป `/dashboard` (owner เข้าหน้า staff ได้)

---

## 4. Local development

> ⚠️ เครื่อง dev ต้องมี **Node.js 18+ (แนะนำ 22)** พร้อม npm — ตรวจด้วย `node -v && npm -v`
> (บนเครื่องที่ setup ครั้งแรกไม่มี Node เลย ติดตั้งผ่าน nvm/homebrew/ตัวติดตั้งทางการก่อน)

```bash
git clone https://github.com/punnawichwork-cloud/carwashpos.git
cd carwashpos
cp .env.example .env          # แล้วใส่ค่า VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY จริง
npm install
npm run dev                   # http://localhost:5173
```

Scripts (`package.json`):
- `npm run dev` — dev server
- `npm run build` — `tsc && vite build` → `dist/`
- `npm run preview` — เสิร์ฟ `dist` ที่ build แล้ว
- `npm run typecheck` — `tsc --noEmit`

---

## 5. Backend — Supabase

### 5.1 Environment variables
```
VITE_SUPABASE_URL       = https://xpgnsshnxknxxpvuhwyh.supabase.co
VITE_SUPABASE_ANON_KEY  = <anon key จาก Supabase → Settings → API>
```
ต้องตั้ง **ทั้งใน `.env` (local)** และใน **Cloudflare Pages env vars** (Production + Preview) — Vite ฝังค่าตอน **build** ถ้าขาดตัวใดตัวหนึ่ง client จะ fallback ไป `placeholder.supabase.co` แล้วทุก request พัง

### 5.2 การตั้งฐานข้อมูล (ถ้าต้องสร้าง project ใหม่)
1. สร้าง Supabase project → SQL Editor → รัน `supabase/schema.sql` ทั้งไฟล์
2. รัน `supabase/migrations/0002_shared_job_queue.sql` (คิวงานรวม — **จำเป็น**)
3. สมัครบัญชีแรกผ่านหน้า `/login` ของแอป → เลื่อนเป็น owner:
   ```sql
   update public.profiles set role='owner' where id='<uuid>';   -- ดู uuid: select id,email from auth.users;
   ```
4. ตั้งค่าร้าน (หรือทำผ่านหน้า "จัดการร้าน" ใน UI ก็ได้):
   ```sql
   update public.shop_config set shop_name='ชื่อร้าน', promptpay_id='เบอร์/เลขบัตร' where id=1;
   ```

### 5.3 ตาราง / RLS / Trigger (สรุป — รายละเอียดใน `supabase/schema.sql`)

| ตาราง | หน้าที่ | สิทธิ์ client |
|---|---|---|
| `profiles` | 1:1 auth.users; `role`, `active` | อ่าน role ตัวเอง; owner แก้ได้ |
| `car_sizes` (7 ขนาด) / `services` / `price_matrix` | ตารางอ้างอิง + ราคา | อ่านทุกคน / เขียน owner |
| `brands` / `car_models` | ยี่ห้อ-รุ่น (auto-fill ขนาด) | อ่านทุกคน / เขียน owner · **ไม่มี seed** owner เพิ่มเอง |
| `customers` | auto-fill ลูกค้าประจำ + `visit_count` | อ่านอย่างเดียว (เขียนผ่าน trigger) |
| `jobs` / `job_services` | งาน + line items; `total` คำนวณอัตโนมัติ | คิวงานรวม (ดู migration 0002) |
| `shop_config` | แถวเดียว id=1 | อ่านทุกคน / เขียน owner |

**Trigger ที่อยู่ใน DB แล้ว — ห้าม re-implement ในแอป:**
- `handle_new_user` — สมัคร user → สร้าง `profiles` (role=staff)
- `set_line_price` — เติมราคา line จาก `price_matrix` ถ้า client ไม่ส่ง price
- `recalc_job_total` — คำนวณ `jobs.total` ใหม่เมื่อ line เปลี่ยน
- `upsert_customer` — upsert `customers` + นับ visit_count เมื่อเปิดงาน

**RPC:** `create_job(header jsonb, lines jsonb)` — insert `jobs` + หลาย `job_services` แบบ atomic (client เรียกผ่าน `supabase.rpc('create_job', ...)`)

**กติกาสำคัญ:**
- ส่ง `price` ที่แสดงบนจอไปกับทุก line เสมอ (กัน race กับ trigger)
- `jobs.service_id` / `jobs.price` เป็น **legacy ห้ามใช้** — ใช้ `job_services` + `jobs.total`
- ขอบเขต "วันนี้/สัปดาห์/เดือน" ต้องคิดจาก **Asia/Bangkok** (helper ใน `lib/format.ts`) — view ใช้ TZ นี้
- Auth: email+password, `mailer_autoconfirm = true` (สมัครเสร็จใช้ได้ทันที ไม่ต้องยืนยันอีเมล)

### 5.4 DB types
`src/lib/database.types.ts` **เขียนมือ** ให้ตรง `schema.sql` (ตอน setup ยังไม่มี Supabase CLI login)
เมื่อ schema เปลี่ยน แนะนำ regenerate จริง:
```bash
npx supabase gen types typescript --project-id xpgnsshnxknxxpvuhwyh > src/lib/database.types.ts
```

---

## 6. Deployment (Cloudflare Pages)

**ตั้งค่าปัจจุบัน:** Cloudflare Pages เชื่อม GitHub repo → **auto-deploy ทุกครั้งที่ push `main`**
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variables (Production + Preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Node: อ่านจาก `.node-version` (22)
- SPA fallback: Pages เสิร์ฟ `index.html` ให้ route ที่ไม่ตรง asset อัตโนมัติ (ทดสอบแล้ว `/dashboard`,`/manage`,`/jobs` refresh ได้ 200 — **ไม่ต้องมี `_redirects`**)

### ⚠️ บทเรียนตอน deploy (กันทีมพลาดซ้ำ)
1. **env var ต้องตั้งใน Cloudflare ให้ครบ 2 ตัว ชื่อเป๊ะ** และอยู่ใน environment **Production** — ถ้าขาด `URL` หรือ `ANON_KEY` แม้ตัวเดียว → client ใช้ placeholder → หน้าเว็บโหลดแต่ล็อกอิน/ยิง API ไม่ได้ (ขึ้น `Invalid API key` หรือ `ERR_NAME_NOT_RESOLVED`)
2. แก้ env แล้ว **ต้อง Retry deployment** (Vite ฝังค่าตอน build — ของเก่าไม่อัปเดตเอง) แล้ว **hard refresh** (Cmd+Shift+R) เพื่อทิ้ง JS ที่ browser แคช
3. `wrangler.jsonc` มีไว้เผื่อ deploy สาย **Workers static-assets** (ถ้าบัญชี Cloudflare ดันเข้าสาย Workers) — สาย Workers **ห้ามมี `public/_redirects`** (validator มองว่าเป็น infinite loop) และต้อง register **workers.dev subdomain** ครั้งแรกผ่าน UI ก่อน · ปัจจุบันใช้ **Pages** จึงไม่แตะ wrangler.jsonc
4. ตรวจ bundle ที่ deploy ว่าฝัง env ถูกไหม: `curl -s https://carwashpos.pages.dev/assets/index-*.js | grep -c xpgnsshnxknxxpvuhwyh` (ควร > 0) และ `grep -c placeholder.supabase.co` (ควร 0)

---

## 7. Feature map (โค้ดอยู่ตรงไหน)

### Staff (มือถือ)
- **เปิดงานใหม่** `features/jobs/NewJobPage.tsx` — ทะเบียน (debounce lookup `customers` → การ์ดลูกค้าประจำ + "เติมให้") · จังหวัด (`ProvinceSheet`) · ยี่ห้อ/รุ่น (`CarSheet` → auto-fill ขนาด) · ขนาด · บริการหลายอย่าง + บริการพิเศษ (`ServicePicker`) · footer ยอดรวม → RPC `create_job`
- **คิวงานวันนี้** `features/jobs/MyJobsPage.tsx` — การ์ดงานที่ยังไม่จ่าย (`JobCard`) · ปุ่มตามสถานะ (เริ่มล้าง/เสร็จ/รับเงิน·QR/แก้ไข)
- **QR + รับเงิน** `QrSheet.tsx` + `PaySheet.tsx` + `components/PromptPayQR.tsx` — สร้าง QR จาก `shop_config.promptpay_id` + `job.total`
- **แก้ไขงาน** `EditJobSheet.tsx` — ปรับบริการ → `updateJobServices` (ลบ+insert ใหม่ ให้ trigger recalc total)
- **Realtime** `useJobsRealtime.ts` — subscribe `postgres_changes` บน `jobs`+`job_services` → invalidate react-query cache (mount ใน shell ทั้งสองฝั่ง)
- ราคา/รวม: logic กลางใน `features/jobs/pricing.ts`

### Owner (เดสก์ท็อป)
- **แดชบอร์ด** `features/dashboard/DashboardPage.tsx` + `dashboard.service.ts` — KPI 4 การ์ด (+delta), กราฟรายรับ 7 วัน (recharts), บริการยอดนิยม, ช่วงเวลารถเข้า, สัดส่วนขนาด, งานล่าสุด, ลูกค้าประจำ top 5 · range switcher วันนี้/สัปดาห์/เดือน
- **จัดการร้าน** `features/manage/ManagePage.tsx` + `PriceMatrixEditor.tsx` + `manage.service.ts` — pattern: โหลดเข้า local draft → แก้ → "บันทึกการเปลี่ยนแปลง" batch save → invalidate `['ref']`
- **ส่งออก CSV** `features/export/ExportPage.tsx` — เลือกช่วงวันที่ → query jobs+job_services+staff → CSV 1 แถวต่อ line item (BOM + escape)

---

## 8. Known issues / Tech debt / TODO

**ต้องทำ / ตรวจ:**
- [ ] ยืนยันว่าได้รัน `0002_shared_job_queue.sql` บน production DB แล้ว (ถ้ายัง คิวงานจะยังเห็นเฉพาะของตัวเอง)
- [ ] ตั้ง `shop_config.promptpay_id` จริง (ไม่งั้น QR ขึ้นข้อความให้ไปตั้งค่า)
- [ ] owner เพิ่มยี่ห้อ/รุ่น ในหน้าจัดการร้าน (ตาราง `brands`/`car_models` ว่างเปล่า ไม่มี seed) — ถ้าไม่เพิ่ม พนักงานเลือกขนาดเองได้ปกติ

**Tech debt / ปรับปรุงได้:**
- **Bundle ใหญ่ ~955 kB** (recharts + supabase) — ยังไม่ทำ code-splitting; ใส่ `manualChunks` หรือ `React.lazy` ต่อ route ได้
- **คิวงานรวมไม่โชว์ว่า "ใครเปิดงาน"** — เพราะ `profiles` RLS ให้ staff อ่านได้เฉพาะชื่อตัวเอง ถ้าอยากโชว์ชื่อคนเปิด ต้องเพิ่ม policy ให้ authenticated อ่าน `full_name` ของทุกคน แล้ว join มาแสดง
- **`database.types.ts` เขียนมือ** — ควร regenerate จาก Supabase CLI เมื่อ schema เปลี่ยน (ดู §5.4)
- **error message ที่ login** map เฉพาะบางเคส (`friendlyError` ใน `LoginPage.tsx`) — เคสอื่นตกไป generic
- ยังไม่มี test อัตโนมัติ (unit/e2e) — DoD เดิมใช้ manual + `npm run build`/`tsc`

---

## 9. Common tasks (how-to)

- **เพิ่มบริการ/แก้ราคา/เพิ่มยี่ห้อ** — ทำผ่าน UI หน้า "จัดการร้าน" (owner) ไม่ต้องแตะโค้ด
- **เพิ่มหน้า/route ใหม่** — สร้าง feature folder ใหม่ + service.ts + เพิ่ม `<Route>` ใน `App.tsx` ใต้ shell ที่เหมาะสม + ครอบ `RequireRole`
- **เพิ่ม query ใหม่** — เขียน fetcher ใน `*.service.ts` (ยิง `supabase`) แล้วห่อด้วย `useQuery` ใน `*.hooks.ts` — อย่ายิง supabase ตรงใน component
- **เปลี่ยน design token** — แก้ `tailwind.config.js` + `lib/constants.ts` (badge/palette)
- **แก้ schema DB** — แก้ใน Supabase SQL Editor + บันทึกไฟล์ migration ใหม่ใน `supabase/migrations/` + regenerate `database.types.ts`

---

## 10. Verification checklist (หลังแก้ก่อน push)

- [ ] `npm run typecheck` ผ่าน (0 errors)
- [ ] `npm run build` ผ่าน (`dist/` สร้างได้)
- [ ] ทดสอบ flow จริงในเบราว์เซอร์: login 2 role, เปิดงาน, QR, คิวงานรวม (staff A เห็นงาน staff B), แก้ไข, รับเงิน, dashboard, manage save, export CSV
- [ ] push `main` → รอ Cloudflare build เขียว → hard refresh production → ตรวจ Console ไม่มี error
- [ ] ตรวจว่า `.env` ไม่ถูก commit (`git ls-files | grep -x .env` ต้องว่าง)

---

_อ้างอิงเพิ่มเติม: `../DEV_PLAN.md` (แผน WP-0..5 เดิม) · `../design_handoff_carwash_pos/README.md` (สเปค + design tokens ฉบับเต็ม) · mockups `.dc.html` เปิดในเบราว์เซอร์ดูดีไซน์ต้นฉบับได้_
