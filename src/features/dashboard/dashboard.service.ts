import { supabase } from '@/lib/supabase'
import type { Customer, PaymentMethod } from '@/lib/database.types'
import type { JobWithServices } from '@/features/jobs/jobs.service'
import { bkkHour, dateISO, rangeFor, type RangeKind } from '@/lib/format'

interface JobRow {
  id: number
  created_at: string
  plate: string
  size_code: string
  total: number
  status: string
  payment_method: PaymentMethod | null
}

export interface Kpis {
  revenue: number
  jobCount: number
  avgPerJob: number
  repeatCustomers: number
  revenueDeltaPct: number | null
  jobCountDeltaPct: number | null
}

async function fetchJobsInRange(fromISO: string, toISO: string): Promise<JobRow[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('id, created_at, plate, size_code, total, status, payment_method')
    .gte('created_at', fromISO)
    .lt('created_at', toISO)
  if (error) throw error
  return (data ?? []) as JobRow[]
}

async function returningPlates(): Promise<Set<string>> {
  const { data, error } = await supabase.from('customers').select('plate, visit_count').gt('visit_count', 1)
  if (error) throw error
  return new Set((data ?? []).map((c) => c.plate))
}

function summarize(rows: JobRow[], returning: Set<string>) {
  const active = rows.filter((r) => r.status !== 'void')
  const revenue = rows.filter((r) => r.status === 'paid').reduce((s, r) => s + r.total, 0)
  const jobCount = active.length
  const avgPerJob = jobCount > 0 ? Math.round(revenue / jobCount) : 0
  const repeatCustomers = new Set(active.filter((r) => returning.has(r.plate)).map((r) => r.plate)).size
  return { revenue, jobCount, avgPerJob, repeatCustomers }
}

function pctDelta(current: number, prev: number): number | null {
  if (prev === 0) return current === 0 ? 0 : null
  return Math.round(((current - prev) / prev) * 100)
}

export async function getKpis(kind: RangeKind): Promise<Kpis> {
  const r = rangeFor(kind)
  const [cur, prev, returning] = await Promise.all([
    fetchJobsInRange(r.fromISO, r.toISO),
    fetchJobsInRange(r.prevFromISO, r.prevToISO),
    returningPlates(),
  ])
  const c = summarize(cur, returning)
  const p = summarize(prev, returning)
  return {
    ...c,
    revenueDeltaPct: pctDelta(c.revenue, p.revenue),
    jobCountDeltaPct: pctDelta(c.jobCount, p.jobCount),
  }
}

export interface RevenueBar {
  date: string
  label: string
  amount: number
}

export async function getRevenue7d(): Promise<RevenueBar[]> {
  const { data, error } = await supabase
    .from('v_daily_revenue')
    .select('biz_date, revenue_paid')
    .order('biz_date', { ascending: false })
    .limit(30)
  if (error) throw error
  const byDate = new Map<string, number>()
  for (const row of data ?? []) {
    if (row.biz_date) byDate.set(row.biz_date, row.revenue_paid ?? 0)
  }
  const bars: RevenueBar[] = []
  const fmt = new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'short' })
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000)
    const date = dateISO(d.toISOString())
    bars.push({ date, label: fmt.format(d), amount: byDate.get(date) ?? 0 })
  }
  return bars
}

export interface ServiceSlice {
  name: string
  revenue: number
  lineCount: number
}

export async function getServiceBreakdown(): Promise<ServiceSlice[]> {
  const { data, error } = await supabase
    .from('v_service_breakdown')
    .select('service, line_count, revenue')
  if (error) throw error
  const byService = new Map<string, ServiceSlice>()
  for (const row of data ?? []) {
    const name = row.service ?? 'บริการพิเศษ'
    const cur = byService.get(name) ?? { name, revenue: 0, lineCount: 0 }
    cur.revenue += row.revenue ?? 0
    cur.lineCount += row.line_count ?? 0
    byService.set(name, cur)
  }
  return [...byService.values()].sort((a, b) => b.revenue - a.revenue)
}

export interface HourBar {
  hour: string
  count: number
}

export async function getPeakHours(kind: RangeKind): Promise<HourBar[]> {
  const r = rangeFor(kind)
  const rows = await fetchJobsInRange(r.fromISO, r.toISO)
  const counts = new Map<number, number>()
  for (const row of rows) {
    if (row.status === 'void') continue
    const h = bkkHour(row.created_at)
    counts.set(h, (counts.get(h) ?? 0) + 1)
  }
  const bars: HourBar[] = []
  for (let h = 8; h <= 19; h++) {
    bars.push({ hour: String(h).padStart(2, '0'), count: counts.get(h) ?? 0 })
  }
  return bars
}

export interface SizeSlice {
  size_code: string
  count: number
}

export async function getSizeBreakdown(kind: RangeKind): Promise<SizeSlice[]> {
  const r = rangeFor(kind)
  const rows = await fetchJobsInRange(r.fromISO, r.toISO)
  const counts = new Map<string, number>()
  for (const row of rows) {
    if (row.status === 'void') continue
    counts.set(row.size_code, (counts.get(row.size_code) ?? 0) + 1)
  }
  return [...counts.entries()].map(([size_code, count]) => ({ size_code, count }))
}

export async function getRecentJobs(): Promise<JobWithServices[]> {
  const r = rangeFor('today')
  const { data, error } = await supabase
    .from('jobs')
    .select('*, job_services(*)')
    .gte('created_at', r.fromISO)
    .lt('created_at', r.toISO)
    .order('created_at', { ascending: false })
    .limit(8)
  if (error) throw error
  return (data ?? []) as unknown as JobWithServices[]
}

export async function getTopCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('visit_count', { ascending: false })
    .limit(5)
  if (error) throw error
  return (data ?? []) as Customer[]
}
