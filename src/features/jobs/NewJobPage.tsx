import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrands, useCarSizes, usePriceMatrix, useServices } from '@/features/reference/reference.hooks'
import { getCustomerByPlate } from './jobs.service'
import { useCreateJob } from './jobs.hooks'
import { buildLines, draftTotal, selectedCount } from './pricing'
import { CarSheet, type CarPick } from './CarSheet'
import { ProvinceSheet } from './ProvinceSheet'
import { ServicePicker } from './ServicePicker'
import { SizeBadge } from '@/components/SizeBadge'
import { useToast } from '@/components/Toast'
import { baht } from '@/lib/format'
import type { Customer } from '@/lib/database.types'
import { cn } from '@/lib/utils'

interface Draft {
  plate: string
  province: string | null
  brandName: string | null
  model: string | null
  size: string | null
  sizeAuto: boolean
  selectedIds: string[]
  customOn: boolean
  customName: string
  customPrice: string
}

const EMPTY_DRAFT: Draft = {
  plate: '',
  province: null,
  brandName: null,
  model: null,
  size: null,
  sizeAuto: false,
  selectedIds: [],
  customOn: false,
  customName: '',
  customPrice: '',
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-kanit mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
      <span className="inline-block h-3 w-[5px] rounded-sm bg-sky" />
      {children}
    </div>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl bg-white p-3 shadow-card', className)}>{children}</div>
}

export function NewJobPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data: sizes = [] } = useCarSizes()
  const { data: services = [] } = useServices(true)
  const { data: priceMap = {} } = usePriceMatrix()
  const { data: brands = [] } = useBrands()
  const createJob = useCreateJob()

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [returning, setReturning] = useState<Customer | null>(null)
  const [carOpen, setCarOpen] = useState(false)
  const [provinceOpen, setProvinceOpen] = useState(false)

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }))

  // Debounced returning-customer lookup on plate.
  useEffect(() => {
    const plate = draft.plate.trim()
    if (!plate) {
      setReturning(null)
      return
    }
    const t = setTimeout(() => {
      getCustomerByPlate(plate)
        .then((c) => setReturning(c && c.visit_count > 0 ? c : null))
        .catch(() => setReturning(null))
    }, 300)
    return () => clearTimeout(t)
  }, [draft.plate])

  function applyReturning() {
    if (!returning) return
    patch({
      province: returning.province,
      brandName: returning.brand,
      model: returning.model,
      size: returning.size_code,
      sizeAuto: !!returning.size_code,
    })
  }

  function applyCarPick(pick: CarPick) {
    patch({
      brandName: pick.brandName,
      model: pick.model,
      size: pick.size ?? draft.size,
      sizeAuto: pick.size != null,
    })
  }

  const total = useMemo(() => draftTotal(priceMap, draft.size, draft), [priceMap, draft])
  const count = selectedCount(draft)
  const anySelected = count > 0
  const canCreate = !!(draft.plate.trim() && draft.brandName && draft.size && anySelected)
  const showSize = !!draft.brandName && !draft.sizeAuto

  const carLabel = draft.model
    ? `${draft.brandName} ${draft.model}`
    : draft.brandName || 'แตะเพื่อเลือกยี่ห้อ / รุ่น'

  async function submit() {
    if (!canCreate || createJob.isPending) return
    const lines = buildLines(priceMap, draft.size, draft)
    try {
      await createJob.mutateAsync({
        header: {
          plate: draft.plate.trim(),
          province: draft.province,
          brand: draft.brandName,
          model: draft.model,
          size_code: draft.size as string,
        },
        lines,
      })
      toast.show('รับงานเข้าคิวแล้ว')
      setDraft(EMPTY_DRAFT)
      setReturning(null)
      navigate('/jobs')
    } catch (e) {
      toast.show('เปิดงานไม่สำเร็จ: ' + (e instanceof Error ? e.message : 'ลองใหม่'))
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 pb-[150px] pt-2">
        {/* plate */}
        <Card>
          <FieldLabel>ทะเบียนรถ</FieldLabel>
          <input
            value={draft.plate}
            onChange={(e) => patch({ plate: e.target.value })}
            placeholder="เช่น 1กก 1234"
            className="font-kanit w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-base font-semibold tracking-wide outline-none focus:border-sky focus:bg-white"
          />
          {returning && (
            <div
              className="animate-pop mt-2.5 flex items-center gap-2.5 rounded-2xl border-[1.5px] px-3 py-2.5"
              style={{ background: 'linear-gradient(90deg,#FEF9C3,#FEF08A)', borderColor: '#FDE047' }}
            >
              <div className="text-2xl">⭐</div>
              <div className="flex-1 leading-tight">
                <div className="font-kanit text-[13.5px] font-bold text-[#854D0E]">
                  ลูกค้าประจำ · มาครั้งที่ {returning.visit_count}
                </div>
                <div className="text-xs text-[#a16207]">
                  {[returning.brand, returning.model].filter(Boolean).join(' ')}
                  {returning.province ? ` · ${returning.province}` : ''}
                </div>
              </div>
              <button
                onClick={applyReturning}
                className="font-kanit rounded-xl bg-[#EAB308] px-3 py-2 text-[12.5px] font-bold text-white transition active:scale-95"
              >
                เติมให้
              </button>
            </div>
          )}
        </Card>

        {/* province */}
        <Card>
          <FieldLabel>จังหวัด</FieldLabel>
          <button
            onClick={() => setProvinceOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2.5 transition active:scale-[.99]"
          >
            <span
              className="font-kanit text-[15px] font-semibold"
              style={{ color: draft.province ? '#0369A1' : '#94A3B8' }}
            >
              {draft.province || 'เลือกจังหวัด'}
            </span>
            <span className="font-bold text-slate-400">›</span>
          </button>
        </Card>

        {/* car */}
        <Card>
          <FieldLabel>ยี่ห้อ / รุ่นรถ</FieldLabel>
          <button
            onClick={() => setCarOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2.5 transition active:scale-[.99]"
          >
            <span
              className="font-kanit text-[15px] font-semibold"
              style={{ color: draft.brandName ? '#0F172A' : '#94A3B8' }}
            >
              {carLabel}
            </span>
            <span className="flex items-center gap-2">
              {draft.size && draft.sizeAuto && <SizeBadge code={draft.size} label={`ไซส์ ${draft.size}`} />}
              <span className="font-bold text-slate-400">›</span>
            </span>
          </button>
        </Card>

        {/* size */}
        {showSize && (
          <Card className="animate-pop">
            <FieldLabel>ขนาดรถ</FieldLabel>
            <div
              className="font-kanit mb-1.5 ml-3.5 text-[11.5px] font-semibold"
              style={{ color: draft.size && draft.sizeAuto ? '#0EA5E9' : '#94A3B8' }}
            >
              {draft.size
                ? draft.sizeAuto
                  ? '⚡ คิดขนาดจากรุ่นอัตโนมัติ — แตะเปลี่ยนได้'
                  : 'เลือกขนาดเอง'
                : 'เลือกรุ่นหรือแตะเลือกขนาด'}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {sizes.map((s) => {
                const active = draft.size === s.code
                return (
                  <button
                    key={s.code}
                    onClick={() => patch({ size: s.code, sizeAuto: false })}
                    className={cn(
                      'flex flex-col items-center justify-center gap-px rounded-xl border-2 px-1 py-1.5 transition active:scale-95',
                      active ? 'border-sky bg-[#E0F2FE] text-brand-700' : 'border-slate-200 bg-slate-50 text-slate-700',
                    )}
                  >
                    <span className="font-kanit text-lg font-bold leading-none">{s.code}</span>
                    <span className="text-[11px] leading-tight">{s.name_th}</span>
                  </button>
                )
              })}
            </div>
          </Card>
        )}

        {/* services */}
        <Card>
          <FieldLabel>บริการ</FieldLabel>
          <ServicePicker
            services={services}
            priceMap={priceMap}
            size={draft.size}
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
        </Card>
      </div>

      {/* footer */}
      <div
        className="absolute inset-x-0 bottom-[78px] px-3 pb-2 pt-2.5"
        style={{ background: 'linear-gradient(180deg,rgba(239,246,255,0),#EFF6FF 36%)' }}
      >
        <div
          className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5"
          style={{ boxShadow: '0 -3px 18px -10px rgba(2,132,199,.5),0 0 0 1px #E0F2FE' }}
        >
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] text-slate-500">
              {count > 0 ? `ยอดชำระ · ${count} รายการ` : 'ยอดชำระ'}
            </div>
            <div
              className="font-kanit text-[22px] font-bold leading-none"
              style={{ color: anySelected ? '#0EA5E9' : '#CBD5E1' }}
            >
              {anySelected ? baht(total) : '฿ —'}
            </div>
          </div>
          <button
            onClick={submit}
            disabled={!canCreate || createJob.isPending}
            className={cn(
              'font-kanit inline-flex flex-none items-center gap-1.5 rounded-xl px-4 py-3 text-[14.5px] font-bold text-white transition active:scale-[.97]',
              canCreate ? 'shadow-lg' : 'cursor-not-allowed',
            )}
            style={{
              background: canCreate ? 'linear-gradient(90deg,#0EA5E9,#0284C7)' : '#CBD5E1',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6 9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            รับงานเข้าคิว
          </button>
        </div>
      </div>

      <CarSheet
        open={carOpen}
        onClose={() => setCarOpen(false)}
        brands={brands}
        selectedBrandName={draft.brandName}
        selectedModel={draft.model}
        onPick={applyCarPick}
      />
      <ProvinceSheet
        open={provinceOpen}
        onClose={() => setProvinceOpen(false)}
        selected={draft.province}
        onPick={(p) => patch({ province: p })}
      />
    </>
  )
}
