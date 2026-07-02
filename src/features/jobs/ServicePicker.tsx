import type { Service } from '@/lib/database.types'
import type { PriceMap } from '@/features/reference/reference.service'
import { baht } from '@/lib/format'
import { priceOf, type DraftServices } from './pricing'
import { cn } from '@/lib/utils'

interface Props {
  services: Service[]
  priceMap: PriceMap
  size: string | null
  draft: DraftServices
  onToggleService: (id: string) => void
  onToggleCustom: () => void
  onCustomName: (v: string) => void
  onCustomPrice: (v: string) => void
}

function Checkbox({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'flex h-[19px] w-[19px] flex-none items-center justify-center rounded-md border-2',
        active ? 'border-sky bg-sky' : 'border-slate-300',
      )}
    >
      {active && <span className="text-[12px] font-bold leading-none text-white">✓</span>}
    </span>
  )
}

export function ServicePicker({
  services,
  priceMap,
  size,
  draft,
  onToggleService,
  onToggleCustom,
  onCustomName,
  onCustomPrice,
}: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {services.map((v) => {
        const active = draft.selectedIds.includes(v.id)
        const p = priceOf(priceMap, v.id, size)
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onToggleService(v.id)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-xl border-2 px-3 py-2 transition active:scale-[.98]',
              active ? 'border-sky bg-[#E0F2FE]' : 'border-slate-200 bg-slate-50',
            )}
          >
            <Checkbox active={active} />
            <span className="font-kanit flex-1 text-left text-sm font-semibold">{v.name_th}</span>
            <span
              className="font-kanit text-sm font-bold"
              style={{ color: active ? '#0369A1' : '#94A3B8' }}
            >
              {p != null ? baht(p) : size ? '' : 'เลือกขนาด'}
            </span>
          </button>
        )
      })}

      <button
        type="button"
        onClick={onToggleCustom}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-xl border-2 px-3 py-2 transition active:scale-[.98]',
          draft.customOn ? 'border-sky bg-[#E0F2FE]' : 'border-dashed border-slate-300 bg-slate-50',
        )}
      >
        <Checkbox active={draft.customOn} />
        <span className="font-kanit flex-1 text-left text-sm font-semibold">
          บริการพิเศษ · กรอกราคาเอง
        </span>
        <span className="text-[15px]">✎</span>
      </button>

      {draft.customOn && (
        <div className="animate-pop flex items-center gap-2">
          <input
            value={draft.customName}
            onChange={(e) => onCustomName(e.target.value)}
            placeholder="ชื่อบริการ (ไม่บังคับ)"
            className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky focus:bg-white"
          />
          <div className="relative w-[118px] flex-none">
            <span className="font-kanit pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
              ฿
            </span>
            <input
              value={draft.customPrice}
              onChange={(e) => onCustomPrice(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              placeholder="0"
              className="font-kanit w-full rounded-xl border-2 border-sky bg-white py-2.5 pl-6 pr-2.5 text-right text-[15px] font-bold outline-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}
