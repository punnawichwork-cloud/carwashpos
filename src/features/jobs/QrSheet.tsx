import { BottomSheet } from '@/components/BottomSheet'
import { PromptPayQR } from '@/components/PromptPayQR'
import { PaymentBadge } from '@/components/StatusBadge'
import type { Service, ShopConfig } from '@/lib/database.types'
import type { JobWithServices } from './jobs.service'
import { carText, jobServiceText } from './jobDisplay'
import { baht } from '@/lib/format'

interface Props {
  open: boolean
  onClose: () => void
  job: JobWithServices | null
  services: Service[]
  shop: ShopConfig | null
  onAskPay: () => void
}

export function QrSheet({ open, onClose, job, services, shop, onAskPay }: Props) {
  if (!job) return null
  const paid = job.status === 'paid' || !!job.payment_method

  return (
    <BottomSheet open={open} onClose={onClose} heightClass="max-h-[94%] overflow-y-auto" z={60}>
      <div className="text-center">
        <div className="font-kanit text-sm font-semibold text-slate-500">สแกนจ่ายด้วยพร้อมเพย์</div>
        <div className="font-kanit mt-0.5 text-[40px] font-bold leading-tight text-sky">{baht(job.total)}</div>
      </div>

      <PromptPayQR promptpayId={shop?.promptpay_id ?? ''} amount={job.total} shopName={shop?.shop_name ?? 'ร้านล้างรถ'} />

      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
        <div>
          <div className="font-kanit text-base font-bold text-slate-900">{job.plate}</div>
          <div className="text-xs text-slate-500">
            {carText(job)} · {jobServiceText(job, services)}
          </div>
        </div>
        <PaymentBadge method={job.payment_method} />
      </div>

      {paid ? (
        <div className="font-kanit mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#DCFCE7] py-4 text-base font-bold text-[#15803D]">
          ✓ รับเงินเรียบร้อยแล้ว
        </div>
      ) : (
        <button
          onClick={onAskPay}
          className="font-kanit mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[17px] font-bold text-white shadow-lg transition active:scale-[.98]"
          style={{ background: 'linear-gradient(90deg,#10B981,#059669)' }}
        >
          ✓ รับเงินแล้ว
        </button>
      )}
      <button
        onClick={onClose}
        className="font-kanit mt-2.5 w-full rounded-2xl border-2 border-slate-200 bg-white py-3 text-[15px] font-semibold text-slate-600 transition active:scale-[.98]"
      >
        ปิด
      </button>
    </BottomSheet>
  )
}
