import type { PriceMap } from '@/features/reference/reference.service'
import type { CreateJobLine } from './jobs.service'

export function priceOf(priceMap: PriceMap, serviceId: string, size: string | null): number | null {
  if (!size) return null
  const v = priceMap[serviceId]?.[size]
  return v == null ? null : v
}

export function parseCustomAmount(customOn: boolean, customPrice: string): number {
  if (!customOn) return 0
  return parseInt(customPrice.replace(/\D/g, ''), 10) || 0
}

export interface DraftServices {
  selectedIds: string[]
  customOn: boolean
  customName: string
  customPrice: string
}

export function draftTotal(priceMap: PriceMap, size: string | null, d: DraftServices): number {
  let total = 0
  for (const id of d.selectedIds) {
    const p = priceOf(priceMap, id, size)
    if (p != null) total += p
  }
  return total + parseCustomAmount(d.customOn, d.customPrice)
}

export function selectedCount(d: DraftServices): number {
  return d.selectedIds.length + (parseCustomAmount(d.customOn, d.customPrice) > 0 ? 1 : 0)
}

export function buildLines(priceMap: PriceMap, size: string | null, d: DraftServices): CreateJobLine[] {
  const lines: CreateJobLine[] = d.selectedIds.map((id) => ({
    service_id: id,
    custom_name: null,
    price: priceOf(priceMap, id, size) ?? 0,
  }))
  const custom = parseCustomAmount(d.customOn, d.customPrice)
  if (custom > 0) {
    lines.push({ service_id: null, custom_name: d.customName.trim() || null, price: custom })
  }
  return lines
}
