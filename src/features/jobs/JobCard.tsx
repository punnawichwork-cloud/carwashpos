import type { Service } from '@/lib/database.types'
import type { JobWithServices } from './jobs.service'
import { StatusBadge, PaymentBadge } from '@/components/StatusBadge'
import { carText, jobServiceText } from './jobDisplay'
import { baht, timeHM } from '@/lib/format'

interface Props {
  job: JobWithServices
  services: Service[]
  onEdit: (job: JobWithServices) => void
  onStartWash: (job: JobWithServices) => void
  onFinishWash: (job: JobWithServices) => void
  onShowQr: (job: JobWithServices) => void
}

export function JobCard({ job, services, onEdit, onStartWash, onFinishWash, onShowQr }: Props) {
  return (
    <div className="rounded-[20px] border border-app-bg bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-kanit text-lg font-bold text-slate-900">{job.plate}</span>
            <span className="text-[11px] text-slate-400">{job.province}</span>
          </div>
          <div className="mt-0.5 text-[12.5px] text-slate-500">{carText(job)}</div>
        </div>
        <div className="flex-none text-right">
          <div className="font-kanit text-lg font-bold text-slate-900">{baht(job.total)}</div>
          <div className="text-[11px] text-slate-400">{timeHM(job.created_at)}</div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <StatusBadge status={job.status} />
        <PaymentBadge method={job.payment_method} />
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
          {jobServiceText(job, services)}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onEdit(job)}
          className="font-kanit flex-none rounded-xl border-2 border-[#E0F2FE] bg-app-bg px-3.5 py-2.5 text-[13.5px] font-bold text-brand-700 transition active:scale-95"
        >
          ✎ แก้ไข
        </button>
        {job.status === 'open' && (
          <button
            onClick={() => onStartWash(job)}
            className="font-kanit flex-1 rounded-xl px-2 py-2.5 text-[13.5px] font-bold transition active:scale-95"
            style={{ background: '#FEF3C7', color: '#B45309' }}
          >
            เริ่มล้าง
          </button>
        )}
        {job.status === 'in_progress' && (
          <button
            onClick={() => onFinishWash(job)}
            className="font-kanit flex-1 rounded-xl px-2 py-2.5 text-[13.5px] font-bold transition active:scale-95"
            style={{ background: '#DCFCE7', color: '#15803D' }}
          >
            เสร็จแล้ว
          </button>
        )}
        <button
          onClick={() => onShowQr(job)}
          className="font-kanit flex-1 rounded-xl px-2 py-2.5 text-[13.5px] font-bold text-white transition active:scale-95"
          style={{ background: 'linear-gradient(90deg,#10B981,#059669)' }}
        >
          รับเงิน · QR
        </button>
      </div>
    </div>
  )
}
