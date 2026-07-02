import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { useShopConfig } from '@/features/reference/reference.hooks'
import { useTodayJobs } from '@/features/jobs/jobs.hooks'
import { isOpenJob } from '@/features/jobs/MyJobsPage'
import { useJobsRealtime } from '@/features/jobs/useJobsRealtime'
import { cn } from '@/lib/utils'

function TabIcon({ kind }: { kind: 'new' | 'jobs' }) {
  if (kind === 'new') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 12h16M12 4v16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="4" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="4" y="14" width="16" height="4" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export function StaffShell() {
  useJobsRealtime()
  const { profile, role, signOut } = useAuth()
  const { data: shop } = useShopConfig()
  const { data: jobs = [] } = useTodayJobs()
  const location = useLocation()

  const openCount = jobs.filter(isOpenJob).length
  const staffName = profile?.full_name || 'พนักงาน'
  const initial = staffName.charAt(0)
  const title = location.pathname.startsWith('/jobs') ? 'คิวงานวันนี้' : 'เปิดงานใหม่'

  const tabClass = (active: boolean) =>
    cn(
      'relative flex flex-1 flex-col items-center gap-0.5 pt-1',
      active ? 'text-sky' : 'text-slate-400',
    )

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-app-bg">
      {/* header */}
      <header
        className="rounded-b-[26px] px-5 pb-3.5 text-white shadow-lg"
        style={{
          background: 'linear-gradient(180deg,#0EA5E9,#0284C7)',
          paddingTop: 'calc(env(safe-area-inset-top,0px) + 20px)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12.5px] opacity-85">{shop?.shop_name || 'ร้านล้างรถ'}</div>
            <div className="font-kanit text-[21px] font-bold leading-tight">{title}</div>
          </div>
          <div className="flex items-center gap-2">
            {role === 'owner' && (
              <Link
                to="/dashboard"
                title="แดชบอร์ดเจ้าของ"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[.16]"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </Link>
            )}
            <div className="flex items-center gap-2 rounded-full bg-white/[.16] py-1.5 pl-1.5 pr-3">
              <div className="font-kanit flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#FBBF24] text-[15px] font-bold text-[#78350F]">
                {initial}
              </div>
              <span className="font-kanit text-[13.5px] font-semibold">{staffName}</span>
            </div>
            <button
              onClick={() => signOut()}
              title="ออกจากระบบ"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[.16]"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
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
      </header>

      {/* content */}
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>

      {/* tab bar */}
      <nav
        className="flex h-[78px] border-t border-slate-200 bg-white px-4 pb-5 pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 20px)' }}
      >
        <NavLink to="/new" className={({ isActive }) => tabClass(isActive)}>
          <TabIcon kind="new" />
          <span className="font-kanit text-[11.5px] font-semibold">เปิดงาน</span>
        </NavLink>
        <NavLink to="/jobs" className={({ isActive }) => tabClass(isActive)}>
          <TabIcon kind="jobs" />
          <span className="font-kanit text-[11.5px] font-semibold">คิวงาน</span>
          {openCount > 0 && (
            <span className="font-kanit absolute right-6 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-rose-400 px-1 text-[10px] font-bold text-white">
              {openCount}
            </span>
          )}
        </NavLink>
      </nav>
    </div>
  )
}
