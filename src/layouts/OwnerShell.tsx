import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { useShopConfig } from '@/features/reference/reference.hooks'
import { useJobsRealtime } from '@/features/jobs/useJobsRealtime'
import { todayLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

interface NavDef {
  to: string
  label: string
  short: string
  icon: ReactNode
}

const NAV: NavDef[] = [
  {
    to: '/dashboard',
    label: 'แดชบอร์ด',
    short: 'แดชบอร์ด',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/manage',
    label: 'จัดการร้าน',
    short: 'จัดการ',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 6h16M4 12h16M4 18h16M8 6v0M16 12v0M10 18v0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: '/export',
    label: 'ส่งออกข้อมูล',
    short: 'ส่งออก',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/new',
    label: 'เปิดงาน (พนักงาน)',
    short: 'เปิดงาน',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
  },
]

const META: Record<string, { title: string; sub: string }> = {
  '/dashboard': { title: 'แดชบอร์ด', sub: 'ภาพรวมรายรับและงานของร้าน' },
  '/manage': { title: 'จัดการร้าน', sub: 'ราคา บริการ ยี่ห้อ และตั้งค่าร้าน' },
  '/export': { title: 'ส่งออกข้อมูล', sub: 'ดาวน์โหลดงานเป็นไฟล์ CSV' },
}

export function OwnerShell() {
  useJobsRealtime()
  const { profile, signOut } = useAuth()
  const { data: shop } = useShopConfig()
  const location = useLocation()

  const meta = META[location.pathname] ?? { title: 'แดชบอร์ด', sub: '' }
  const ownerName = profile?.full_name || 'เจ้าของร้าน'

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-app-bg">
      {/* sidebar — เฉพาะจอใหญ่ */}
      <aside
        className="relative hidden w-64 flex-none flex-col overflow-hidden py-6 text-white lg:flex"
        style={{ background: 'linear-gradient(180deg,#0EA5E9 0%,#0284C7 55%,#0369A1 100%)', paddingInline: 18 }}
      >
        <div className="flex items-center gap-3 px-1.5">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white/[.18]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2.5C12 2.5 5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.5-7-12.5Z" fill="#fff" />
              <circle cx="9.4" cy="14" r="1.5" fill="#7DD3FC" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-kanit truncate text-[17px] font-bold leading-tight">
              {shop?.shop_name || 'ร้านล้างรถ'}
            </div>
            <div className="text-[11.5px] opacity-80">แผงควบคุมเจ้าของร้าน</div>
          </div>
        </div>

        <div className="my-5 h-px bg-white/[.16]" />

        <nav className="flex flex-col gap-1.5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-3 transition active:scale-[.98]',
                  isActive ? 'bg-white/[.18]' : 'hover:bg-white/[.10]',
                )
              }
            >
              <span className="flex h-[22px] w-[22px] flex-none items-center justify-center">{n.icon}</span>
              <span className="font-kanit text-[14.5px] font-semibold">{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[.18] bg-white/[.12] p-3">
            <div className="font-kanit flex h-[42px] w-[42px] flex-none items-center justify-center rounded-xl bg-[#FBBF24] text-lg font-bold text-[#78350F]">
              {ownerName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-kanit truncate text-sm font-semibold">{ownerName}</div>
              <div className="text-[11px] opacity-80">เจ้าของร้าน</div>
            </div>
            <button onClick={() => signOut()} title="ออกจากระบบ" className="opacity-70 transition hover:opacity-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[70px] flex-none items-center justify-between border-b border-slate-200 bg-white px-4 lg:h-[84px] lg:px-7">
          <div className="min-w-0">
            <div className="font-kanit truncate text-xl font-bold leading-tight text-slate-900 lg:text-2xl">
              {meta.title}
            </div>
            <div className="mt-0.5 hidden text-[13px] text-slate-500 sm:block">{meta.sub}</div>
          </div>
          <div className="flex flex-none items-center gap-2">
            <div className="font-kanit hidden items-center gap-2 rounded-xl bg-app-bg px-4 py-2.5 text-[13.5px] font-semibold text-brand-700 sm:flex">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="3" stroke="#0284C7" strokeWidth="2" />
                <path d="M3 9h18M8 2v4M16 2v4" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {todayLabel()}
            </div>
            {/* ปุ่มออกจากระบบ — เฉพาะมือถือ (จอใหญ่มีใน sidebar) */}
            <button
              onClick={() => signOut()}
              title="ออกจากระบบ"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-app-bg text-brand-700 lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 lg:px-7 lg:py-6 lg:pb-6">
          <Outlet />
        </div>

        {/* แถบเมนูล่าง — เฉพาะมือถือ */}
        <nav
          className="flex flex-none border-t border-slate-200 bg-white px-1 pt-2 lg:hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 14px)' }}
        >
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1',
                  isActive ? 'text-sky' : 'text-slate-400',
                )
              }
            >
              <span className="flex h-6 w-6 items-center justify-center">{n.icon}</span>
              <span className="font-kanit text-[10.5px] font-semibold">{n.short}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
