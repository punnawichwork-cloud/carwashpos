import { Routes, Route, Navigate } from 'react-router-dom'
import { RequireRole } from '@/features/auth/RequireRole'
import { LoginPage } from '@/features/auth/LoginPage'
import { StaffShell } from '@/layouts/StaffShell'
import { OwnerShell } from '@/layouts/OwnerShell'
import { NewJobPage } from '@/features/jobs/NewJobPage'
import { MyJobsPage } from '@/features/jobs/MyJobsPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ManagePage } from '@/features/manage/ManagePage'
import { ExportPage } from '@/features/export/ExportPage'

export function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Staff routes — inside StaffShell */}
      <Route
        element={
          <RequireRole allow={['staff', 'owner']}>
            <StaffShell />
          </RequireRole>
        }
      >
        <Route path="/new" element={<NewJobPage />} />
        <Route path="/jobs" element={<MyJobsPage />} />
      </Route>

      {/* Owner-only routes — inside OwnerShell */}
      <Route
        element={
          <RequireRole allow={['owner']}>
            <OwnerShell />
          </RequireRole>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/manage" element={<ManagePage />} />
        <Route path="/export" element={<ExportPage />} />
      </Route>

      {/* Fallback: redirect to login (RequireRole will redirect to role home) */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
