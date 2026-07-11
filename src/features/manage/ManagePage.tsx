import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCarSizes, useServices, usePriceMatrix, useBrands, useShopConfig } from '@/features/reference/reference.hooks'
import { PriceMatrixEditor } from './PriceMatrixEditor'
import {
  savePrices,
  saveServices,
  saveBrands,
  saveShopConfig,
  type DraftService,
  type DraftBrand,
  type PriceChange,
} from './manage.service'
import { serviceDot } from '@/lib/constants'
import { useToast } from '@/components/Toast'
import { Spinner } from '@/components/Spinner'
import { ConfirmSheet } from '@/components/ConfirmSheet'
import { BottomSheet } from '@/components/BottomSheet'
import { cn } from '@/lib/utils'

type PendingDelete =
  | { kind: 'service'; key: string; label: string }
  | { kind: 'brand'; key: string; label: string }
  | { kind: 'model'; brandKey: string; idx: number; label: string }

export function ManagePage() {
  const qc = useQueryClient()
  const toast = useToast()

  const { data: sizes = [], isLoading: loadSizes } = useCarSizes()
  const { data: services = [], isLoading: loadServices } = useServices(false)
  const { data: priceMap = {}, isLoading: loadPrices } = usePriceMatrix()
  const { data: brands = [], isLoading: loadBrands } = useBrands()
  const { data: shop = null, isLoading: loadConfig } = useShopConfig()

  const [draftPrices, setDraftPrices] = useState<Record<string, Record<string, string>>>({})
  const [draftServices, setDraftServices] = useState<DraftService[]>([])
  const [draftBrands, setDraftBrands] = useState<DraftBrand[]>([])
  const [shopName, setShopName] = useState('')
  const [promptpayId, setPromptpayId] = useState('')
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({})
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [brandSheet, setBrandSheet] = useState<{ mode: 'add' | 'edit'; brandKey?: string; name: string } | null>(null)
  const [modelSheet, setModelSheet] = useState<{ brandKey: string; name: string; size: string } | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (initialized) return
    // Wait until every reference query has finished loading. brands can be
    // legitimately empty on a fresh shop (the owner creates them on this very
    // page), so gate on the load flags — not on data length — or the page
    // would spin forever with no brands seeded.
    if (loadSizes || loadServices || loadPrices || loadBrands || loadConfig) return

    // Init prices draft
    const priceDraft: Record<string, Record<string, string>> = {}
    for (const s of services) {
      priceDraft[s.id] = {}
      for (const sz of sizes) {
        const val = priceMap[s.id]?.[sz.code]
        priceDraft[s.id][sz.code] = val != null ? String(val) : ''
      }
    }
    setDraftPrices(priceDraft)

    // Init services draft
    setDraftServices(services.map((s) => ({ id: s.id, name_th: s.name_th, active: s.active })))

    // Init brands draft
    setDraftBrands(
      brands.map((b, idx) => ({
        id: b.id,
        tempKey: `brand_${b.id || `new_${idx}`}`,
        name_th: b.name_th,
        models: b.models.map((m) => ({ id: m.id, name: m.name, size_code: m.size_code })),
      })),
    )

    // Init shop config draft
    setShopName(shop?.shop_name ?? '')
    setPromptpayId(shop?.promptpay_id ?? '')

    setInitialized(true)
    setDirty(false)
  }, [loadSizes, loadServices, loadPrices, loadBrands, loadConfig, services, sizes, priceMap, brands, shop, initialized])

  if (loadSizes || loadServices || loadPrices || loadBrands || loadConfig || !initialized) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  function markDirty() {
    setDirty(true)
  }

  function handlePriceChange(serviceId: string, size: string, value: string) {
    setDraftPrices((prev) => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] ?? {}),
        [size]: value,
      },
    }))
    markDirty()
  }

  // --- Service functions ---
  function addService() {
    const newId = `svc_${Date.now()}`
    const newSvc: DraftService = { id: newId, name_th: 'บริการใหม่', active: true, isNew: true }
    setDraftServices([...draftServices, newSvc])
    setDraftPrices((prev) => ({
      ...prev,
      [newId]: sizes.reduce((acc, sz) => ({ ...acc, [sz.code]: '0' }), {}),
    }))
    markDirty()
  }

  function editServiceName(id: string, name: string) {
    setDraftServices(draftServices.map((s) => (s.id === id ? { ...s, name_th: name } : s)))
    markDirty()
  }

  function toggleServiceActive(id: string) {
    setDraftServices(draftServices.map((s) => (s.id === id ? { ...s, active: !s.active } : s)))
    markDirty()
  }

  function deleteService(id: string) {
    const svc = draftServices.find((s) => s.id === id)
    setPendingDelete({ kind: 'service', key: id, label: svc?.name_th ?? '' })
  }

  // --- Brand & Model functions ---
  function addBrand(name = 'ยี่ห้อใหม่') {
    const newKey = `brand_new_${Date.now()}`
    const newBrand: DraftBrand = {
      id: null,
      tempKey: newKey,
      name_th: name,
      models: [],
    }
    setDraftBrands([...draftBrands, newBrand])
    setExpandedBrands((prev) => ({ ...prev, [newKey]: true }))
    markDirty()
  }

  function editBrandName(key: string, name: string) {
    setDraftBrands(draftBrands.map((b) => (b.tempKey === key ? { ...b, name_th: name } : b)))
    markDirty()
  }

  function deleteBrand(key: string) {
    const brand = draftBrands.find((b) => b.tempKey === key)
    setPendingDelete({ kind: 'brand', key, label: brand?.name_th ?? '' })
  }

  // --- Delete confirmation ---
  function performDelete(del: PendingDelete) {
    if (del.kind === 'service') {
      setDraftServices(draftServices.filter((s) => s.id !== del.key))
      const nextPrices = { ...draftPrices }
      delete nextPrices[del.key]
      setDraftPrices(nextPrices)
    } else if (del.kind === 'brand') {
      setDraftBrands(draftBrands.filter((b) => b.tempKey !== del.key))
    } else {
      setDraftBrands(
        draftBrands.map((b) => {
          if (b.tempKey !== del.brandKey) return b
          return { ...b, models: b.models.filter((_, i) => i !== del.idx) }
        }),
      )
    }
    markDirty()
  }

  function openAddBrandSheet() {
    setBrandSheet({ mode: 'add', name: '' })
  }
  function openEditBrandSheet(brandKey: string) {
    const b = draftBrands.find((x) => x.tempKey === brandKey)
    setBrandSheet({ mode: 'edit', brandKey, name: b?.name_th ?? '' })
  }
  function submitBrandSheet() {
    if (!brandSheet) return
    const name = brandSheet.name.trim()
    if (!name) return
    if (brandSheet.mode === 'add') addBrand(name)
    else if (brandSheet.brandKey) editBrandName(brandSheet.brandKey, name)
    setBrandSheet(null)
  }
  function deleteFromBrandSheet() {
    if (!brandSheet || brandSheet.mode !== 'edit' || !brandSheet.brandKey) return
    const key = brandSheet.brandKey
    setBrandSheet(null)
    deleteBrand(key)
  }
  function openAddModelSheet(brandKey: string) {
    setModelSheet({ brandKey, name: '', size: sizes[0]?.code ?? 'S' })
  }
  function submitModelSheet() {
    if (!modelSheet) return
    const name = modelSheet.name.trim()
    if (!name) return
    addModel(modelSheet.brandKey, name, modelSheet.size)
    setModelSheet(null)
  }

  function toggleBrandExpand(key: string) {
    setExpandedBrands((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function addModel(brandKey: string, name = 'รุ่นใหม่', size = 'S') {
    setDraftBrands(
      draftBrands.map((b) => {
        if (b.tempKey !== brandKey) return b
        return {
          ...b,
          models: [...b.models, { id: null, name, size_code: size }],
        }
      }),
    )
    markDirty()
  }

  function editModelName(brandKey: string, modelIndex: number, name: string) {
    setDraftBrands(
      draftBrands.map((b) => {
        if (b.tempKey !== brandKey) return b
        const nextModels = [...b.models]
        nextModels[modelIndex] = { ...nextModels[modelIndex], name }
        return { ...b, models: nextModels }
      }),
    )
    markDirty()
  }

  function editModelSize(brandKey: string, modelIndex: number, size: string) {
    setDraftBrands(
      draftBrands.map((b) => {
        if (b.tempKey !== brandKey) return b
        const nextModels = [...b.models]
        nextModels[modelIndex] = { ...nextModels[modelIndex], size_code: size }
        return { ...b, models: nextModels }
      }),
    )
    markDirty()
  }

  function deleteModel(brandKey: string, idx: number) {
    const brand = draftBrands.find((b) => b.tempKey === brandKey)
    const label = brand?.models[idx]?.name?.trim() || 'รุ่นนี้'
    setPendingDelete({ kind: 'model', brandKey, idx, label })
  }

  // --- Save ---
  async function handleSave() {
    if (!shopName.trim()) {
      toast.show('กรุณากรอกชื่อร้าน')
      return
    }
    setSaving(true)
    try {
      // 1. Save Config
      await saveShopConfig(shopName.trim(), promptpayId.trim())

      // 2. Save Services
      const originalServiceIds = services.map((s) => s.id)
      await saveServices(originalServiceIds, draftServices)

      // 3. Save Brands & Models
      await saveBrands(brands, draftBrands)

      // 4. Save Prices
      const changedPrices: PriceChange[] = []
      for (const svc of draftServices) {
        for (const sz of sizes) {
          const draftVal = parseInt(draftPrices[svc.id]?.[sz.code], 10) || 0
          const origVal = priceMap[svc.id]?.[sz.code] ?? 0
          if (draftVal !== origVal) {
            changedPrices.push({
              service_id: svc.id,
              size_code: sz.code,
              price: draftVal,
            })
          }
        }
      }
      await savePrices(changedPrices)

      toast.show('✓ บันทึกการเปลี่ยนแปลงแล้ว')
      setDirty(false)

      // Invalidate ref queries so that all parts of the app are updated
      await qc.invalidateQueries({ queryKey: ['ref'] })
      setInitialized(false) // Trigger re-init
    } catch (e) {
      toast.show('บันทึกไม่สำเร็จ: ' + (e instanceof Error ? e.message : 'กรุณาลองใหม่'))
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-2 pt-2 lg:pb-28">
      {/* 1. Price Matrix */}
      <PriceMatrixEditor
        services={draftServices}
        sizes={sizes}
        prices={draftPrices}
        onChange={handlePriceChange}
      />

      {/* 2. Services */}
      <div className="rounded-[20px] border border-slate-100 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="font-kanit text-lg font-bold text-slate-900">จัดการบริการ</div>
            <div className="text-[12.5px] text-slate-400">เพิ่ม/ลบ หรือปิดใช้งานบริการชั่วคราว</div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {draftServices.map((svc, i) => (
            <div
              key={svc.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5"
            >
              <span className="h-3 w-3 flex-none rounded-sm" style={{ background: serviceDot(i) }} />
              <input
                value={svc.name_th}
                onChange={(e) => editServiceName(svc.id, e.target.value)}
                placeholder="ชื่อบริการ"
                className="font-kanit min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-sky"
              />
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-slate-400 sm:block">{svc.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
                <button
                  type="button"
                  onClick={() => toggleServiceActive(svc.id)}
                  className={cn(
                    'relative inline-flex h-[26px] w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none',
                    svc.active ? 'bg-sky' : 'bg-slate-300',
                  )}
                  style={{ backgroundColor: svc.active ? '#0EA5E9' : '#CBD5E1' }}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow transition duration-200 ease-in-out',
                      svc.active ? 'translate-x-[18px]' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>
              <button
                type="button"
                onClick={() => deleteService(svc.id)}
                className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition active:scale-95 lg:h-9 lg:w-9"
              >
                🗑️
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addService}
            className="font-kanit border-2 border-dashed border-slate-300 hover:border-sky py-3 text-center text-sm font-semibold text-slate-500 hover:text-sky rounded-2xl transition"
          >
            + เพิ่มบริการ
          </button>
        </div>
      </div>

      {/* 3. Brands & Models — desktop (unchanged) */}
      <div className="hidden rounded-[20px] border border-slate-100 bg-white p-6 shadow-card lg:block">
        <div className="mb-4">
          <div className="font-kanit text-lg font-bold text-slate-900">ยี่ห้อ & รุ่นรถ</div>
          <div className="text-[12.5px] text-slate-400">ระบบจะช่วยเติมข้อมูลขนาดรถให้อัตโนมัติในฝั่งพนักงาน</div>
        </div>

        <div className="flex flex-col gap-3">
          {draftBrands.map((b) => {
            const isExpanded = expandedBrands[b.tempKey!]
            return (
              <div
                key={b.tempKey}
                className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleBrandExpand(b.tempKey!)}
                  className="flex items-center justify-between bg-white p-4 cursor-pointer select-none hover:bg-slate-50/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="font-bold text-slate-400 transition-transform duration-200"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    >
                      ▸
                    </span>
                    <input
                      value={b.name_th}
                      onChange={(e) => editBrandName(b.tempKey!, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="ชื่อยี่ห้อ"
                      className="font-kanit font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-slate-300 outline-none px-1 py-0.5"
                    />
                    <span className="text-xs text-slate-400">({b.models.length} รุ่น)</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteBrand(b.tempKey!)
                    }}
                    className="font-kanit text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
                  >
                    ลบยี่ห้อ
                  </button>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-100/80 flex flex-col gap-2.5">
                    {b.models.map((m, mIdx) => (
                      <div
                        key={mIdx}
                        className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white p-3 lg:flex-row lg:items-center lg:gap-3"
                      >
                        <div className="flex items-center gap-2 lg:min-w-0 lg:flex-1">
                          <input
                            value={m.name}
                            onChange={(e) => editModelName(b.tempKey!, mIdx, e.target.value)}
                            placeholder="ชื่อรุ่น"
                            className="font-kanit min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-sky focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => deleteModel(b.tempKey!, mIdx)}
                            className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition active:scale-95 lg:hidden"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7 lg:flex lg:gap-1">
                          {sizes.map((sz) => {
                            const active = m.size_code === sz.code
                            return (
                              <button
                                key={sz.code}
                                type="button"
                                onClick={() => editModelSize(b.tempKey!, mIdx, sz.code)}
                                className={cn(
                                  'font-kanit min-w-0 rounded-lg px-2 py-2 text-center text-[13px] font-bold transition border lg:px-2.5 lg:py-1 lg:text-xs',
                                  active
                                    ? 'bg-[#E0F2FE] text-brand-700 border-sky shadow-sm'
                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300',
                                )}
                              >
                                {sz.code}
                              </button>
                            )
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteModel(b.tempKey!, mIdx)}
                          className="hidden h-8 w-8 flex-none items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition lg:flex"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addModel(b.tempKey!)}
                      className="font-kanit border border-dashed border-slate-300 bg-white py-2 text-center text-xs font-semibold text-slate-500 hover:text-sky hover:border-sky rounded-xl transition"
                    >
                      + เพิ่มรุ่น
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          <button
            type="button"
            onClick={() => addBrand()}
            className="font-kanit border-2 border-dashed border-slate-300 hover:border-sky py-3 text-center text-sm font-semibold text-slate-500 hover:text-sky rounded-2xl transition"
          >
            + เพิ่มยี่ห้อรถ
          </button>
        </div>
      </div>

      {/* 3b. Brands & Models — mobile */}
      <div className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-card lg:hidden">
        <div className="mb-4">
          <div className="font-kanit text-lg font-bold text-slate-900">ยี่ห้อ &amp; รุ่นรถ</div>
          <div className="text-[12.5px] text-slate-400">ระบบจะช่วยเติมข้อมูลขนาดรถให้อัตโนมัติในฝั่งพนักงาน</div>
        </div>

        <div className="flex flex-col gap-3">
          {draftBrands.map((b) => {
            const isExpanded = expandedBrands[b.tempKey!]
            return (
              <div key={b.tempKey} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                <div className="flex items-stretch bg-white">
                  <button
                    type="button"
                    onClick={() => toggleBrandExpand(b.tempKey!)}
                    className="flex min-h-[52px] flex-1 items-center gap-3 px-4 py-3 text-left"
                  >
                    <span
                      className="flex-none font-bold text-slate-400 transition-transform duration-200"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    >
                      ▸
                    </span>
                    <span className="font-kanit min-w-0 flex-1 truncate font-bold text-slate-800">
                      {b.name_th.trim() || 'ยังไม่ตั้งชื่อ'}
                    </span>
                    <span className="flex-none text-xs text-slate-400">({b.models.length} รุ่น)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditBrandSheet(b.tempKey!)}
                    aria-label="แก้ไขยี่ห้อ"
                    className="flex h-[52px] w-12 flex-none items-center justify-center text-slate-400 transition active:scale-95"
                  >
                    ✏️
                  </button>
                </div>

                {isExpanded && (
                  <div className="flex flex-col gap-2.5 border-t border-slate-100/80 bg-slate-50 p-4">
                    {b.models.length === 0 && (
                      <div className="font-kanit py-2 text-center text-[13px] text-slate-400">ยังไม่มีรุ่นในยี่ห้อนี้</div>
                    )}
                    {b.models.map((m, mIdx) => (
                      <div key={mIdx} className="flex flex-col gap-2.5 rounded-xl border border-slate-100 bg-white p-3">
                        <div className="flex items-center gap-2">
                          <input
                            value={m.name}
                            onChange={(e) => editModelName(b.tempKey!, mIdx, e.target.value)}
                            placeholder="ชื่อรุ่น"
                            inputMode="text"
                            enterKeyHint="done"
                            autoComplete="off"
                            autoCapitalize="off"
                            className="font-kanit min-h-[44px] min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => deleteModel(b.tempKey!, mIdx)}
                            aria-label="ลบรุ่น"
                            className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition active:scale-95"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sizes.map((sz) => {
                            const active = m.size_code === sz.code
                            return (
                              <button
                                key={sz.code}
                                type="button"
                                onClick={() => editModelSize(b.tempKey!, mIdx, sz.code)}
                                className={cn(
                                  'font-kanit flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border px-3 text-[13px] font-bold transition',
                                  active
                                    ? 'border-sky bg-[#E0F2FE] text-brand-700 shadow-sm'
                                    : 'border-slate-200 bg-slate-50 text-slate-500',
                                )}
                              >
                                {sz.code}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => openAddModelSheet(b.tempKey!)}
                      className="font-kanit min-h-[44px] rounded-xl border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-500 transition active:scale-[.98]"
                    >
                      + เพิ่มรุ่น
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          <button
            type="button"
            onClick={openAddBrandSheet}
            className="font-kanit min-h-[48px] rounded-2xl border-2 border-dashed border-slate-300 text-sm font-semibold text-slate-500 transition active:scale-[.98]"
          >
            + เพิ่มยี่ห้อ
          </button>
        </div>
      </div>

      {/* 4. Shop Config */}
      <div className="rounded-[20px] border border-slate-100 bg-white p-6 shadow-card">
        <div className="mb-4">
          <div className="font-kanit text-lg font-bold text-slate-900">ตั้งค่าร้าน</div>
          <div className="text-[12.5px] text-slate-400">ข้อมูลที่แสดงในหน้ารับเงินและสร้าง QR Code</div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="font-kanit mb-1.5 block text-sm font-semibold text-slate-700">ชื่อร้าน</label>
            <input
              value={shopName}
              onChange={(e) => { setShopName(e.target.value); markDirty() }}
              placeholder="เช่น ร้านล้างรถสมใจ"
              className="font-kanit w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-sky focus:bg-white"
            />
          </div>
          <div>
            <label className="font-kanit mb-1.5 block text-sm font-semibold text-slate-700">
              เลขพร้อมเพย์ (PromptPay ID)
            </label>
            <input
              value={promptpayId}
              onChange={(e) => { setPromptpayId(e.target.value); markDirty() }}
              placeholder="เช่น เบอร์มือถือ หรือ เลขบัตร ปชช."
              className="font-kanit w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-sky focus:bg-white"
            />
            <span className="mt-1 block text-[11px] text-slate-400">
              ใช้สร้าง QR ให้ลูกค้าสแกนจ่ายเข้าบัญชีร้านโดยตรง
            </span>
          </div>
        </div>
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t border-slate-200 py-4 px-8 z-40 hidden items-center justify-end lg:flex">
        <button
          onClick={handleSave}
          disabled={saving}
          className="font-kanit inline-flex min-w-[180px] items-center justify-center gap-2 rounded-xl bg-brand-700 py-3.5 text-[15px] font-bold text-white shadow-lg transition hover:bg-brand-600 active:scale-95 disabled:opacity-75"
          style={{ background: 'linear-gradient(90deg,#0EA5E9,#0284C7)' }}
        >
          {saving && <Spinner className="h-[18px] w-[18px]" />}
          บันทึกการเปลี่ยนแปลง
        </button>
      </div>

      {/* แถบบันทึก — มือถือ */}
      <div
        className="sticky bottom-0 z-10 -mx-4 px-4 pb-4 pt-10 lg:hidden"
        style={{ background: 'linear-gradient(180deg,rgba(239,246,255,0),#EFF6FF 55%)' }}
      >
        {dirty && (
          <div className="font-kanit mb-2 flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-amber-600">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            มีการเปลี่ยนแปลงที่ยังไม่บันทึก
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="font-kanit flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-bold text-white shadow-lg transition active:scale-[.97] disabled:opacity-75"
          style={{ background: 'linear-gradient(90deg,#0EA5E9,#0284C7)' }}
        >
          {saving && <Spinner className="h-[18px] w-[18px]" />}
          บันทึกการเปลี่ยนแปลง
        </button>
      </div>

      <ConfirmSheet
        open={!!pendingDelete}
        title={
          pendingDelete?.kind === 'service'
            ? 'ลบบริการนี้?'
            : pendingDelete?.kind === 'brand'
              ? 'ลบยี่ห้อนี้?'
              : 'ลบรุ่นนี้?'
        }
        message={pendingDelete ? `"${pendingDelete.label}" จะถูกลบเมื่อกดบันทึกการเปลี่ยนแปลง` : undefined}
        onConfirm={() => pendingDelete && performDelete(pendingDelete)}
        onClose={() => setPendingDelete(null)}
      />

      <BottomSheet open={!!brandSheet} onClose={() => setBrandSheet(null)}>
        <div className="px-1 pb-1">
          <div className="font-kanit text-lg font-bold text-slate-900">
            {brandSheet?.mode === 'edit' ? 'แก้ไขยี่ห้อ' : 'เพิ่มยี่ห้อใหม่'}
          </div>
          <input
            value={brandSheet?.name ?? ''}
            onChange={(e) => setBrandSheet((s) => (s ? { ...s, name: e.target.value } : s))}
            placeholder="ชื่อยี่ห้อ เช่น Toyota"
            inputMode="text"
            enterKeyHint="done"
            autoComplete="off"
            autoCapitalize="off"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && submitBrandSheet()}
            className="font-kanit mt-4 min-h-[48px] w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 text-[15px] outline-none focus:border-sky focus:bg-white"
          />
          <button
            type="button"
            onClick={submitBrandSheet}
            disabled={!brandSheet?.name.trim()}
            className="font-kanit mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl text-[15px] font-bold text-white shadow-lg transition active:scale-[.98] disabled:opacity-40"
            style={{ background: 'linear-gradient(90deg,#0EA5E9,#0284C7)' }}
          >
            {brandSheet?.mode === 'edit' ? 'บันทึกชื่อ' : 'เพิ่มยี่ห้อ'}
          </button>
          {brandSheet?.mode === 'edit' && (
            <button
              type="button"
              onClick={deleteFromBrandSheet}
              className="font-kanit mt-2.5 min-h-[44px] w-full rounded-xl text-[14px] font-semibold text-rose-500 transition active:scale-[.98]"
            >
              ลบยี่ห้อนี้
            </button>
          )}
        </div>
      </BottomSheet>

      <BottomSheet open={!!modelSheet} onClose={() => setModelSheet(null)}>
        <div className="px-1 pb-1">
          <div className="font-kanit text-lg font-bold text-slate-900">เพิ่มรุ่นรถ</div>
          <input
            value={modelSheet?.name ?? ''}
            onChange={(e) => setModelSheet((s) => (s ? { ...s, name: e.target.value } : s))}
            placeholder="ชื่อรุ่น เช่น Yaris"
            inputMode="text"
            enterKeyHint="done"
            autoComplete="off"
            autoCapitalize="off"
            autoFocus
            className="font-kanit mt-4 min-h-[48px] w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 text-[15px] outline-none focus:border-sky focus:bg-white"
          />
          <div className="font-kanit mb-1.5 mt-4 text-sm font-semibold text-slate-700">ขนาดรถ</div>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((sz) => {
              const active = modelSheet?.size === sz.code
              return (
                <button
                  key={sz.code}
                  type="button"
                  onClick={() => setModelSheet((s) => (s ? { ...s, size: sz.code } : s))}
                  className={cn(
                    'font-kanit flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border px-3 text-[13px] font-bold transition',
                    active
                      ? 'border-sky bg-[#E0F2FE] text-brand-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-500',
                  )}
                >
                  {sz.code}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={submitModelSheet}
            disabled={!modelSheet?.name.trim()}
            className="font-kanit mt-5 flex min-h-[48px] w-full items-center justify-center rounded-xl text-[15px] font-bold text-white shadow-lg transition active:scale-[.98] disabled:opacity-40"
            style={{ background: 'linear-gradient(90deg,#0EA5E9,#0284C7)' }}
          >
            เพิ่มรุ่น
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}

