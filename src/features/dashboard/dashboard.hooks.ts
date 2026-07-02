import { useQuery } from '@tanstack/react-query'
import type { RangeKind } from '@/lib/format'
import {
  getKpis,
  getPeakHours,
  getRecentJobs,
  getRevenue7d,
  getServiceBreakdown,
  getSizeBreakdown,
  getTopCustomers,
} from './dashboard.service'

export function useKpis(range: RangeKind) {
  return useQuery({ queryKey: ['dashboard', 'kpis', range], queryFn: () => getKpis(range) })
}
export function useRevenue7d() {
  return useQuery({ queryKey: ['dashboard', 'revenue7d'], queryFn: getRevenue7d })
}
export function useServiceBreakdown() {
  return useQuery({ queryKey: ['dashboard', 'service-breakdown'], queryFn: getServiceBreakdown })
}
export function usePeakHours(range: RangeKind) {
  return useQuery({ queryKey: ['dashboard', 'peak', range], queryFn: () => getPeakHours(range) })
}
export function useSizeBreakdown(range: RangeKind) {
  return useQuery({ queryKey: ['dashboard', 'size', range], queryFn: () => getSizeBreakdown(range) })
}
export function useRecentJobs() {
  return useQuery({ queryKey: ['dashboard', 'recent'], queryFn: getRecentJobs })
}
export function useTopCustomers() {
  return useQuery({ queryKey: ['dashboard', 'top-customers'], queryFn: getTopCustomers })
}
