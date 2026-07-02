import { supabase } from '@/lib/supabase'
import type { BrandWithModels } from '@/features/reference/reference.service'

// ---- draft shapes used by the Manage page ----
export interface DraftService {
  id: string
  name_th: string
  active: boolean
  isNew?: boolean
}

export interface DraftModel {
  id: number | null // null = not yet persisted
  name: string
  size_code: string | null
}

export interface DraftBrand {
  id: number | null
  tempKey?: string
  name_th: string
  models: DraftModel[]
}

export interface PriceChange {
  service_id: string
  size_code: string
  price: number
}

export async function savePrices(changed: PriceChange[]): Promise<void> {
  if (changed.length === 0) return
  const { error } = await supabase.from('price_matrix').upsert(changed)
  if (error) throw error
}

export async function saveShopConfig(shop_name: string, promptpay_id: string): Promise<void> {
  const { error } = await supabase
    .from('shop_config')
    .update({ shop_name, promptpay_id, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) throw error
}

export async function saveServices(originalIds: string[], draft: DraftService[]): Promise<void> {
  const draftIds = new Set(draft.map((d) => d.id))
  const toDelete = originalIds.filter((id) => !draftIds.has(id))
  if (toDelete.length) {
    const { error } = await supabase.from('services').delete().in('id', toDelete)
    if (error) throw error
  }
  const rows = draft.map((d, i) => ({
    id: d.id,
    name_th: d.name_th.trim() || 'บริการใหม่',
    active: d.active,
    sort_order: i,
  }))
  const { error } = await supabase.from('services').upsert(rows)
  if (error) throw error
}

export async function saveBrands(original: BrandWithModels[], draft: DraftBrand[]): Promise<void> {
  // delete removed brands (models cascade)
  const keptBrandIds = new Set(draft.filter((b) => b.id != null).map((b) => b.id))
  const delBrands = original.filter((b) => !keptBrandIds.has(b.id)).map((b) => b.id)
  if (delBrands.length) {
    const { error } = await supabase.from('brands').delete().in('id', delBrands)
    if (error) throw error
  }

  for (let i = 0; i < draft.length; i++) {
    const b = draft[i]
    let brandId = b.id
    const name = b.name_th.trim() || 'ยี่ห้อใหม่'

    if (brandId == null) {
      const { data, error } = await supabase
        .from('brands')
        .insert({ name_th: name, sort_order: i })
        .select('id')
        .single()
      if (error) throw error
      brandId = data.id
    } else {
      const { error } = await supabase.from('brands').update({ name_th: name, sort_order: i }).eq('id', brandId)
      if (error) throw error
    }

    // reconcile models for this brand
    const origBrand = original.find((o) => o.id === brandId)
    const origModelIds = origBrand ? origBrand.models.map((m) => m.id) : []
    const keptModelIds = new Set(b.models.filter((m) => m.id != null).map((m) => m.id))
    const delModels = origModelIds.filter((id) => !keptModelIds.has(id))
    if (delModels.length) {
      const { error } = await supabase.from('car_models').delete().in('id', delModels)
      if (error) throw error
    }

    const models = b.models.filter((m) => m.name.trim())
    for (let j = 0; j < models.length; j++) {
      const m = models[j]
      if (m.id == null) {
        const { error } = await supabase
          .from('car_models')
          .insert({ brand_id: brandId, name: m.name.trim(), size_code: m.size_code, sort_order: j })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('car_models')
          .update({ name: m.name.trim(), size_code: m.size_code, sort_order: j })
          .eq('id', m.id)
        if (error) throw error
      }
    }
  }
}
