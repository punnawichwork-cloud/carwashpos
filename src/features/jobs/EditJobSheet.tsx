import { useEffect, useState } from 'react'
import { BottomSheet } from '@/components/BottomSheet'
import { ServicePicker } from './ServicePicker'
import { SizeBadge } from '@/components/SizeBadge'
import type { Service } from '@/lib/database.types'
import type { PriceMap } from '@/features/reference/reference.service'
import type { JobWithServices } from './jobs.service'
import { buildLines, draftTotal, selectedCount, type DraftServices } from './pricing'
import { carText } from './jobDisplay'
import { baht } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  job: JobWithServices | null
  services: Service[]
  priceMap: PriceMap
  onSave: (lines: ReturnType<typeof buildLines>) => Promise<void> | void
  saving?: boolean
}

function initDraft(job: JobWithServices): DraftServices {
  const custom = job.job_services.find((s) => !s.service_id)
  return {
    selectedIds: job.job_services.filter((s) => s.service_id).map((s) => s.service_id as string),
    customOn: !!custom,
    customName: custom?.custom_name ?? '',
    customPrice: custom ? String(custom.price) : '',
  }
}

export function EditJobSheet({ open, onClose, job, services, priceMap, onSave, saving }: Props) {
  const [draft, setDraft] = useState<DraftServices | null>(null)

  useEffect(() => {
    if (open && job) setDraft(initDraft(job))
  }, [open, job])

  if (!job || !draft) return null

  const size = job.size_code
  const total = draftTotal(priceMap, size, draft)
  const canSave = selectedCount(draft) > 0
  const patch = (p: Partial<DraftServices>) => setDraft((d) => (d ? { ...d, ...p } : d))

  return (
    <BottomSheet open={open} onClose={onClose} heightClass="max-h-[92%]" z={82}>
      <div className="mb-1 flex items-center justify-between px-0.5">
        <div className="font-kanit text-[19px] font-bold">แก้ไขบริการ</div>
        <SizeBadge code={size} label={`ไซส์ ${size}`} />
      </div>
      <div className="mb-3.5 px-0.5 text-[12.5px] text-slate-500">
        {job.plate} · {carText(job)}
      </div>

      <div className="flex flex-col gap-1.5 overflow-y-auto">
        <ServicePicker
          services={services}
          priceMap={priceMap}
          size={size}
          draft={draft}
          onToggleService={(id) =>
            patch({
              selectedIds: draft.selectedIds.includes(id)
                ? draft.selectedIds.filter((x) => x !== id)
                : [...draft.selectedIds, id],
            })
          }
          onToggleCustom={() => patch({ customOn: !draft.customOn })}
          onCustomName={(v) => patch({ customName: v })}
          onCustomPrice={(v) => patch({ customPrice: v })}
        />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-app-bg px-3.5 py-3">
        <span className="font-kanit text-[13px] font-semibold text-slate-500">ยอดใหม่</span>
        <span className="font-kanit text-[22px] font-bold text-sky">{baht(total)}</span>
      </div>

      <div className="mt-3 flex gap-2.5">
        <button
          onClick={onClose}
          className="font-kanit flex-none rounded-2xl border-2 border-slate-200 bg-white px-5 py-3.5 text-[15px] font-bold text-slate-600 transition active:scale-[.97]"
        >
          ยกเลิก
        </button>
        <button
          disabled={!canSave || saving}
          onClick={() => onSave(buildLines(priceMap, size, draft))}
          className={cn(
            'font-kanit flex-1 rounded-2xl py-3.5 text-[15px] font-bold text-white transition active:scale-[.98]',
            !canSave && 'cursor-not-allowed',
          )}
          style={{ background: canSave ? 'linear-gradient(90deg,#0EA5E9,#0284C7)' : '#CBD5E1' }}
        >
          บันทึกการแก้ไข
        </button>
      </div>
    </BottomSheet>
  )
}
