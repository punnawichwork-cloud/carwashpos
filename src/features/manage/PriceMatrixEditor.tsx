import type { CarSize } from '@/lib/database.types'
import type { DraftService } from './manage.service'
import { serviceDot, sizeBadge } from '@/lib/constants'

interface Props {
  services: DraftService[]
  sizes: CarSize[]
  prices: Record<string, Record<string, string>>
  onChange: (serviceId: string, size: string, value: string) => void
}

export function PriceMatrixEditor({ services, sizes, prices, onChange }: Props) {
  const cols = `1.6fr repeat(${sizes.length}, 1fr)`
  return (
    <div className="rounded-[20px] border border-slate-100 bg-white p-6 shadow-card">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="font-kanit text-lg font-bold text-slate-900">ตารางราคา</div>
        <div className="text-[12.5px] text-slate-400">บาท · แตะที่ช่องเพื่อแก้ไข</div>
      </div>
      <div className="mb-4 text-[13px] text-slate-500">
        ราคาคิดจาก <b className="text-sky">บริการ × ขนาดรถ</b> — พนักงานเห็นราคานี้ตอนเปิดงานทันที
      </div>

      <div className="grid items-center gap-2.5" style={{ gridTemplateColumns: cols }}>
        <div className="font-kanit pl-1 text-[12.5px] font-semibold text-slate-400">บริการ \ ขนาด</div>
        {sizes.map((s) => {
          const { fg } = sizeBadge(s.code)
          return (
            <div key={s.code} className="text-center">
              <div className="font-kanit text-[15px] font-bold" style={{ color: fg }}>
                {s.code}
              </div>
              <div className="text-[10.5px] text-slate-400">{s.name_th}</div>
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 max-h-[320px] overflow-y-auto pr-1">
        <div className="grid items-center gap-2.5" style={{ gridTemplateColumns: cols }}>
          {services.map((svc, i) => (
            <FragmentRow
              key={svc.id}
              svc={svc}
              sizes={sizes}
              color={serviceDot(i)}
              prices={prices[svc.id] ?? {}}
              onChange={onChange}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function FragmentRow({
  svc,
  sizes,
  color,
  prices,
  onChange,
}: {
  svc: DraftService
  sizes: CarSize[]
  color: string
  prices: Record<string, string>
  onChange: (serviceId: string, size: string, value: string) => void
}) {
  return (
    <>
      <div className="font-kanit flex items-center gap-2 p-1 text-sm font-semibold text-slate-900">
        <span className="h-[9px] w-[9px] flex-none rounded-sm" style={{ background: color }} />
        {svc.name_th}
      </div>
      {sizes.map((s) => (
        <div key={s.code} className="relative">
          <span className="font-kanit pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
            ฿
          </span>
          <input
            value={prices[s.code] ?? ''}
            onChange={(e) => onChange(svc.id, s.code, e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            className="font-kanit w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-2.5 pl-6 pr-2 text-center text-[15px] font-bold outline-none focus:border-sky focus:bg-white"
          />
        </div>
      ))}
    </>
  )
}
