import { BottomSheet } from '@/components/BottomSheet'
import { baht } from '@/lib/format'

interface Props {
  open: boolean
  onClose: () => void
  amount: number
  onCash: () => void
  onPromptPay: () => void
}

export function PaySheet({ open, onClose, amount, onCash, onPromptPay }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} z={80}>
      <div className="font-kanit mb-1 text-center text-[17px] font-bold">รับเงินด้วยวิธีไหน?</div>
      <div className="font-kanit mb-4 text-center text-3xl font-bold text-sky">{baht(amount)}</div>
      <div className="flex gap-3">
        <button
          onClick={onCash}
          className="font-kanit flex flex-1 flex-col items-center gap-2 rounded-[20px] border-2 border-slate-200 bg-[#F0FDF4] px-2.5 py-5 text-base font-bold text-[#15803D] transition active:scale-95"
        >
          <span className="text-3xl">💵</span>เงินสด
        </button>
        <button
          onClick={onPromptPay}
          className="font-kanit flex flex-1 flex-col items-center gap-2 rounded-[20px] border-2 border-slate-200 bg-app-bg px-2.5 py-5 text-base font-bold text-[#1D4ED8] transition active:scale-95"
        >
          <span className="text-3xl">📱</span>พร้อมเพย์
        </button>
      </div>
    </BottomSheet>
  )
}
