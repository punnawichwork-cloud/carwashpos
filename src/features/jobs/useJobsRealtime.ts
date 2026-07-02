import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * One shared realtime subscription for the whole app. RLS filters events by
 * role (staff receive only their own rows; owner receives all), so both shells
 * mount this hook and simply invalidate the relevant query caches.
 */
export function useJobsRealtime() {
  const qc = useQueryClient()

  useEffect(() => {
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    }

    const channel = supabase
      .channel('jobs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_services' }, invalidate)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}
