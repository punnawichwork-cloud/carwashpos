import { useQuery } from '@tanstack/react-query'
import {
  fetchBrandsWithModels,
  fetchCarSizes,
  fetchPriceMatrix,
  fetchServices,
  fetchShopConfig,
} from './reference.service'

const LONG_STALE = 5 * 60_000

export function useCarSizes() {
  return useQuery({ queryKey: ['ref', 'car_sizes'], queryFn: fetchCarSizes, staleTime: LONG_STALE })
}

export function useServices(activeOnly = false) {
  return useQuery({
    queryKey: ['ref', 'services', activeOnly],
    queryFn: () => fetchServices(activeOnly),
    staleTime: LONG_STALE,
  })
}

export function usePriceMatrix() {
  return useQuery({ queryKey: ['ref', 'price_matrix'], queryFn: fetchPriceMatrix, staleTime: LONG_STALE })
}

export function useBrands() {
  return useQuery({ queryKey: ['ref', 'brands'], queryFn: fetchBrandsWithModels, staleTime: LONG_STALE })
}

export function useShopConfig() {
  return useQuery({ queryKey: ['ref', 'shop_config'], queryFn: fetchShopConfig, staleTime: LONG_STALE })
}
