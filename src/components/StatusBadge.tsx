import { paymentMeta, statusMeta } from '@/lib/constants'
import type { JobStatus, PaymentMethod } from '@/lib/database.types'

export function StatusBadge({ status }: { status: JobStatus }) {
  const m = statusMeta(status)
  return (
    <span
      className="font-kanit inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: m.bg, color: m.fg }}
    >
      <span className="h-[7px] w-[7px] rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  )
}

export function PaymentBadge({ method }: { method: PaymentMethod | null }) {
  const m = paymentMeta(method)
  return (
    <span
      className="font-kanit inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  )
}
