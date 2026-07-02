import { supabase } from '@/lib/supabase'
import type { Customer, Job, JobService, JobStatus, PaymentMethod } from '@/lib/database.types'
import type { Json } from '@/lib/database.types'
import { todayRange } from '@/lib/format'

export interface JobWithServices extends Job {
  job_services: JobService[]
}

export interface CreateJobHeader {
  plate: string
  province: string | null
  brand: string | null
  model: string | null
  size_code: string
  note?: string | null
}

export interface CreateJobLine {
  service_id: string | null
  custom_name: string | null
  price: number
}

export async function getCustomerByPlate(plate: string): Promise<Customer | null> {
  const trimmed = plate.trim()
  if (!trimmed) return null
  const { data, error } = await supabase.from('customers').select('*').eq('plate', trimmed).maybeSingle()
  if (error) throw error
  return data
}

/** Atomic insert of a job header + its service lines via the create_job RPC. */
export async function createJob(header: CreateJobHeader, lines: CreateJobLine[]): Promise<number> {
  const { data, error } = await supabase.rpc('create_job', {
    header: header as unknown as Json,
    lines: lines as unknown as Json,
  })
  if (error) throw error
  return data as number
}

// Shared queue: RLS returns every staff's still-in-queue job (open/in_progress/done)
// plus the caller's own jobs. Owner gets everything.
export async function getTodayJobs(): Promise<JobWithServices[]> {
  const { fromISO, toISO } = todayRange()
  const { data, error } = await supabase
    .from('jobs')
    .select('*, job_services(*)')
    .gte('created_at', fromISO)
    .lt('created_at', toISO)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as JobWithServices[]
}

export async function updateJobStatus(id: number, status: JobStatus): Promise<void> {
  const patch: Partial<Job> = { status }
  if (status === 'done') patch.closed_at = new Date().toISOString()
  const { error } = await supabase.from('jobs').update(patch).eq('id', id)
  if (error) throw error
}

export async function markPaid(id: number, method: PaymentMethod): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('jobs')
    .update({ status: 'paid', payment_method: method, paid_at: now, closed_at: now })
    .eq('id', id)
  if (error) throw error
}

/** Replace all service lines of a job (trigger recalculates jobs.total). */
export async function updateJobServices(jobId: number, lines: CreateJobLine[]): Promise<void> {
  const { error: delErr } = await supabase.from('job_services').delete().eq('job_id', jobId)
  if (delErr) throw delErr
  const rows = lines.map((l) => ({ ...l, job_id: jobId }))
  const { error: insErr } = await supabase.from('job_services').insert(rows)
  if (insErr) throw insErr
}
