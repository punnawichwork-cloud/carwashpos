import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { UserRole } from '@/lib/database.types'
import { FullPageSpinner } from '@/components/Spinner'
import { useAuth } from './AuthProvider'

export function homeFor(role: UserRole | null): string {
  return role === 'owner' ? '/dashboard' : '/new'
}

interface Props {
  allow: UserRole[]
  children: ReactNode
}

export function RequireRole({ allow, children }: Props) {
  const { session, profile, role, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner />

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // Session exists but profile row not created/loaded yet.
  if (!profile) return <FullPageSpinner />

  if (!profile.active) {
    return (
      <div className="flex h-full min-h-[100dvh] flex-col items-center justify-center gap-2 bg-app-bg p-8 text-center">
        <div className="text-4xl">🚫</div>
        <div className="font-kanit text-lg font-bold text-slate-800">บัญชีถูกปิดใช้งาน</div>
        <div className="text-sm text-slate-500">กรุณาติดต่อเจ้าของร้านเพื่อเปิดใช้งานบัญชีอีกครั้ง</div>
      </div>
    )
  }

  if (!allow.includes(role as UserRole)) {
    return <Navigate to={homeFor(role)} replace />
  }

  return <>{children}</>
}
