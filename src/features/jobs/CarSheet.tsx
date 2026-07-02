import { useState } from 'react'
import { BottomSheet } from '@/components/BottomSheet'
import { SizeBadge } from '@/components/SizeBadge'
import type { BrandWithModels } from '@/features/reference/reference.service'
import { OTHER_BRAND_LABEL } from '@/lib/constants'
import { cn } from '@/lib/utils'

export interface CarPick {
  brandName: string
  model: string | null
  size: string | null // null => let user pick size manually
}

interface Props {
  open: boolean
  onClose: () => void
  brands: BrandWithModels[]
  selectedBrandName: string | null
  selectedModel: string | null
  onPick: (pick: CarPick) => void
}

export function CarSheet({ open, onClose, brands, selectedBrandName, selectedModel, onPick }: Props) {
  const [activeBrandId, setActiveBrandId] = useState<number | 'other' | null>(null)

  const activeBrand = typeof activeBrandId === 'number' ? brands.find((b) => b.id === activeBrandId) : null
  const showModels = !!activeBrand && activeBrand.models.length > 0

  function pickBrand(b: BrandWithModels) {
    if (b.models.length > 0) {
      setActiveBrandId(b.id)
    } else {
      onPick({ brandName: b.name_th, model: null, size: null })
      onClose()
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} heightClass="h-[88%]" z={75}>
      <div className="font-kanit mb-3.5 px-1 text-xl font-bold">เลือกยี่ห้อ</div>
      <div className="grid grid-cols-4 gap-2.5">
        {brands.map((b) => {
          const active = activeBrandId === b.id
          return (
            <button
              key={b.id}
              onClick={() => pickBrand(b)}
              className={cn(
                'font-kanit flex min-h-[52px] items-center justify-center rounded-2xl border-2 px-1 py-3.5 text-center text-sm font-semibold transition active:scale-95',
                active ? 'border-sky bg-[#E0F2FE] text-brand-700' : 'border-slate-200 bg-slate-50 text-slate-700',
              )}
            >
              {b.name_th}
            </button>
          )
        })}
        <button
          onClick={() => {
            onPick({ brandName: OTHER_BRAND_LABEL, model: null, size: null })
            onClose()
          }}
          className="font-kanit flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 px-1 py-3.5 text-center text-sm font-semibold text-slate-700 transition active:scale-95"
        >
          {OTHER_BRAND_LABEL}
        </button>
      </div>

      {showModels && activeBrand && (
        <div className="animate-pop mt-4 overflow-y-auto border-t border-app-bg pt-3.5">
          <div className="font-kanit mb-2.5 text-[17px] font-bold">
            รุ่น {activeBrand.name_th}{' '}
            <span className="thai text-[11.5px] font-normal text-slate-400">— คิดขนาดให้อัตโนมัติ</span>
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            {activeBrand.models.map((m) => {
              const active = selectedBrandName === activeBrand.name_th && selectedModel === m.name
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    onPick({ brandName: activeBrand.name_th, model: m.name, size: m.size_code })
                    onClose()
                  }}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl border-2 px-3.5 py-2.5 transition active:scale-95',
                    active ? 'border-sky bg-[#E0F2FE]' : 'border-slate-200 bg-slate-50',
                  )}
                >
                  <span className="font-kanit text-[14.5px] font-semibold">{m.name}</span>
                  {m.size_code && <SizeBadge code={m.size_code} label={m.size_code} className="text-[10.5px]" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
