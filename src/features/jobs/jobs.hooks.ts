import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { JobStatus, PaymentMethod } from '@/lib/database.types'
import {
  createJob,
  getTodayJobs,
  markPaid,
  updateJobServices,
  updateJobStatus,
  type CreateJobHeader,
  type CreateJobLine,
} from './jobs.service'

export function useTodayJobs() {
  return useQuery({ queryKey: ['jobs', 'today'], queryFn: getTodayJobs })
}

function useInvalidateJobs() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['jobs'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

export function useCreateJob() {
  const invalidate = useInvalidateJobs()
  return useMutation({
    mutationFn: (vars: { header: CreateJobHeader; lines: CreateJobLine[] }) =>
      createJob(vars.header, vars.lines),
    onSuccess: invalidate,
  })
}

export function useUpdateJobStatus() {
  const invalidate = useInvalidateJobs()
  return useMutation({
    mutationFn: (vars: { id: number; status: JobStatus }) => updateJobStatus(vars.id, vars.status),
    onSuccess: invalidate,
  })
}

export function useMarkPaid() {
  const invalidate = useInvalidateJobs()
  return useMutation({
    mutationFn: (vars: { id: number; method: PaymentMethod }) => markPaid(vars.id, vars.method),
    onSuccess: invalidate,
  })
}

export function useUpdateJobServices() {
  const invalidate = useInvalidateJobs()
  return useMutation({
    mutationFn: (vars: { jobId: number; lines: CreateJobLine[] }) =>
      updateJobServices(vars.jobId, vars.lines),
    onSuccess: invalidate,
  })
}
