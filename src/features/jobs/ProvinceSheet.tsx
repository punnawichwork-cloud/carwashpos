import { BottomSheet } from '@/components/BottomSheet'
import { PROVINCES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  selected: string | null
  onPick: (province: string) => void
}

export function ProvinceSheet({ open, onClose, selected, onPick }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} heightClass="max-h-[72%]" z={70}>
      <div className="font-kanit mb-3 px-1 text-[17px] font-bold">เลือกจังหวัด</div>
      <div className="flex flex-col gap-0.5 overflow-y-auto">
        {PROVINCES.map((name) => {
          const active = selected === name
          return (
            <button
              key={name}
              onClick={() => {
                onPick(name)
                onClose()
              }}
              className={cn(
                'font-kanit flex items-center justify-between rounded-xl px-3.5 py-3.5 text-left text-[15px] transition',
                active ? 'bg-[#E0F2FE] font-bold text-brand-700' : 'font-medium text-slate-700',
              )}
            >
              {name}
              {active && <span className="font-bold text-sky">✓</span>}
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}
