import { supabase } from '@/lib/supabase'
import type { Brand, CarModel, CarSize, PriceMatrixRow, Service, ShopConfig } from '@/lib/database.types'

export type PriceMap = Record<string, Record<string, number>>
export interface BrandWithModels extends Brand {
  models: CarModel[]
}

export async function fetchCarSizes(): Promise<CarSize[]> {
  const { data, error } = await supabase.from('car_sizes').select('*').order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function fetchServices(activeOnly = false): Promise<Service[]> {
  let q = supabase.from('services').select('*').order('sort_order')
  if (activeOnly) q = q.eq('active', true)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function fetchPriceMatrix(): Promise<PriceMap> {
  const { data, error } = await supabase.from('price_matrix').select('*')
  if (error) throw error
  const map: PriceMap = {}
  for (const row of (data ?? []) as PriceMatrixRow[]) {
    ;(map[row.service_id] ??= {})[row.size_code] = row.price
  }
  return map
}

export async function fetchBrandsWithModels(): Promise<BrandWithModels[]> {
  const [{ data: brands, error: bErr }, { data: models, error: mErr }] = await Promise.all([
    supabase.from('brands').select('*').order('sort_order'),
    supabase.from('car_models').select('*').order('sort_order'),
  ])
  if (bErr) throw bErr
  if (mErr) throw mErr
  const byBrand = new Map<number, CarModel[]>()
  for (const m of (models ?? []) as CarModel[]) {
    const list = byBrand.get(m.brand_id) ?? []
    list.push(m)
    byBrand.set(m.brand_id, list)
  }
  return ((brands ?? []) as Brand[]).map((b) => ({ ...b, models: byBrand.get(b.id) ?? [] }))
}

export async function fetchShopConfig(): Promise<ShopConfig | null> {
  const { data, error } = await supabase.from('shop_config').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  return data
}
