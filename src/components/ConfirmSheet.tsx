import { BottomSheet } from './BottomSheet'

interface Props {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmSheet({ open, title, message, confirmLabel = 'ลบ', onConfirm, onClose }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} z={85}>
      <div className="px-1 pb-1">
        <div className="font-kanit text-lg font-bold text-slate-900">{title}</div>
        {message && <div className="mt-1 text-[13px] leading-relaxed text-slate-500">{message}</div>}
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="font-kanit flex-1 rounded-xl border border-slate-200 bg-white py-3 text-[15px] font-semibold text-slate-600 transition active:scale-[.97]"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="font-kanit flex-1 rounded-xl bg-rose-500 py-3 text-[15px] font-bold text-white shadow-lg transition active:scale-[.97]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
