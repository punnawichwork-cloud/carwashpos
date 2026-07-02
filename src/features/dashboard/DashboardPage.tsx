import { useState, type ReactNode } from 'react'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis } from 'recharts'
import type { RangeKind } from '@/lib/format'
import { baht } from '@/lib/format'
import { serviceDot, sizeBadge } from '@/lib/constants'
import { useCarSizes, useServices } from '@/features/reference/reference.hooks'
import { PaymentBadge } from '@/components/StatusBadge'
import { carText, jobServiceText } from '@/features/jobs/jobDisplay'
import { timeHM } from '@/lib/format'
import {
  useKpis,
  usePeakHours,
  useRecentJobs,
  useRevenue7d,
  useServiceBreakdown,
  useSizeBreakdown,
  useTopCustomers,
} from './dashboard.hooks'
import { cn } from '@/lib/utils'

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[20px] border border-slate-100 bg-white p-6 shadow-card', className)}>
      {children}
    </div>
  )
}

function CardTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <div className="font-kanit text-[17px] font-bold text-slate-900">{children}</div>
      {sub && <div className="mt-0.5 text-[12.5px] text-slate-400">{sub}</div>}
    </div>
  )
}

function RangeSwitcher({ value, onChange }: { value: RangeKind; onChange: (v: RangeKind) => void }) {
  const opts: { key: RangeKind; label: string }[] = [
    { key: 'today', label: 'วันนี้' },
    { key: 'week', label: 'สัปดาห์' },
    { key: 'month', label: 'เดือน' },
  ]
  return (
    <div className="flex rounded-xl bg-slate-100 p-1">
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            'font-kanit rounded-lg px-4 py-1.5 text-[13.5px] font-semibold transition',
            value === o.key ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Delta({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-[12px] text-slate-400">—</span>
  const up = pct >= 0
  return (
    <span className="font-kanit text-[12.5px] font-bold" style={{ color: up ? '#15803D' : '#BE123C' }}>
      {up ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  )
}

export function DashboardPage() {
  const [range, setRange] = useState<RangeKind>('today')
  const { data: kpis } = useKpis(range)
  const { data: revenue7 = [] } = useRevenue7d()
  const { data: serviceBreak = [] } = useServiceBreakdown()
  const { data: peak = [] } = usePeakHours(range)
  const { data: sizeBreak = [] } = useSizeBreakdown(range)
  const { data: recent = [] } = useRecentJobs()
  const { data: topCustomers = [] } = useTopCustomers()
  const { data: services = [] } = useServices(false)
  const { data: sizes = [] } = useCarSizes()

  const svcTotal = serviceBreak.reduce((s, x) => s + x.revenue, 0) || 1
  const sizeTotal = sizeBreak.reduce((s, x) => s + x.count, 0) || 1
  const peakMax = Math.max(1, ...peak.map((p) => p.count))
  const todayDate = revenue7.length ? revenue7[revenue7.length - 1].date : ''

  const kpiCards = [
    { label: 'รายรับ (ชำระแล้ว)', value: baht(kpis?.revenue ?? 0), delta: kpis?.revenueDeltaPct ?? null, icon: '💰', bg: '#DCFCE7' },
    { label: 'จำนวนงาน', value: String(kpis?.jobCount ?? 0), delta: kpis?.jobCountDeltaPct ?? null, icon: '🚗', bg: '#DBEAFE' },
    { label: 'เฉลี่ยต่อคัน', value: baht(kpis?.avgPerJob ?? 0), delta: null, icon: '📊', bg: '#FEF3C7' },
    { label: 'ลูกค้าประจำกลับมา', value: String(kpis?.repeatCustomers ?? 0), delta: null, icon: '⭐', bg: '#EDE9FE' },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-end">
        <RangeSwitcher value={range} onChange={setRange} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold text-slate-500">{k.label}</div>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                style={{ background: k.bg }}
              >
                {k.icon}
              </div>
            </div>
            <div className="font-kanit mt-2.5 text-[31px] font-bold leading-none text-slate-900">{k.value}</div>
            <div className="mt-2 flex items-center gap-1.5">
              <Delta pct={k.delta} />
              <span className="text-[12px] text-slate-400">เทียบช่วงก่อน</span>
            </div>
          </Card>
        ))}
      </div>

      {/* revenue + service */}
      <div className="grid grid-cols-[1.55fr_1fr] gap-4">
        <Card>
          <CardTitle sub="บาท / วัน">รายรับ 7 วันล่าสุด</CardTitle>
          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue7} margin={{ top: 20, right: 4, left: 4, bottom: 0 }}>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Bar dataKey="amount" radius={[9, 9, 4, 4]} maxBarSize={46}>
                  <LabelList
                    dataKey="amount"
                    position="top"
                    formatter={(v: number) => (v ? v.toLocaleString('th-TH') : '')}
                    style={{ fontSize: 11, fill: '#0F172A', fontWeight: 700 }}
                  />
                  {revenue7.map((b) => (
                    <Cell key={b.date} fill={b.date === todayDate ? '#0284C7' : '#0EA5E9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>บริการยอดนิยม</CardTitle>
          <div className="flex flex-col gap-4">
            {serviceBreak.length === 0 && <div className="text-sm text-slate-400">ยังไม่มีข้อมูล</div>}
            {serviceBreak.map((s, i) => {
              const pct = Math.round((s.revenue / svcTotal) * 100)
              const color = serviceDot(i)
              return (
                <div key={s.name}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
                      {s.name}
                    </span>
                    <span className="font-kanit text-[13.5px] font-bold text-slate-900">{pct}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-md bg-slate-100">
                    <div className="h-full rounded-md" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div className="mt-1 text-[11.5px] text-slate-400">
                    {s.lineCount} รายการ · {baht(s.revenue)}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* peak + size */}
      <div className="grid grid-cols-[1.55fr_1fr] gap-4">
        <Card>
          <CardTitle sub="จำนวนคัน / ชั่วโมง">ช่วงเวลาที่รถเข้าเยอะ</CardTitle>
          <div className="flex h-[130px] items-end gap-2">
            {peak.map((p) => {
              const h = Math.round((p.count / peakMax) * 100)
              const strong = p.count === peakMax && peakMax > 0
              return (
                <div key={p.hour} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <div
                    className="w-full rounded-md"
                    style={{ height: `${Math.max(h, 3)}%`, background: strong ? '#0284C7' : '#7DD3FC' }}
                  />
                  <div className="font-kanit text-[10.5px] text-slate-400">{p.hour}</div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <CardTitle>สัดส่วนขนาดรถ</CardTitle>
          <div className="flex flex-col gap-3">
            {sizeBreak.length === 0 && <div className="text-sm text-slate-400">ยังไม่มีข้อมูล</div>}
            {[...sizeBreak]
              .sort((a, b) => {
                const oa = sizes.find((s) => s.code === a.size_code)?.sort_order ?? 99
                const ob = sizes.find((s) => s.code === b.size_code)?.sort_order ?? 99
                return oa - ob
              })
              .map((z) => {
                const pct = Math.round((z.count / sizeTotal) * 100)
                const { bg, fg } = sizeBadge(z.size_code)
                const name = sizes.find((s) => s.code === z.size_code)?.name_th ?? ''
                return (
                  <div key={z.size_code} className="flex items-center gap-3">
                    <div
                      className="font-kanit flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] text-sm font-bold"
                      style={{ background: bg, color: fg }}
                    >
                      {z.size_code}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between text-[12.5px] text-slate-500">
                        <span>{name}</span>
                        <span className="font-kanit font-bold text-slate-900">{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded bg-slate-100">
                        <div className="h-full rounded" style={{ width: `${pct}%`, background: fg }} />
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </Card>
      </div>

      {/* recent + customers */}
      <div className="grid grid-cols-[1.55fr_1fr] gap-4">
        <Card>
          <div className="mb-3.5 flex items-center justify-between">
            <div className="font-kanit text-[17px] font-bold text-slate-900">งานล่าสุดวันนี้</div>
            <span className="text-[12.5px] font-semibold text-sky">ทั้งหมด {recent.length} งาน</span>
          </div>
          <div className="grid grid-cols-[64px_1.4fr_1.3fr_70px_88px] gap-1 border-b border-slate-100 px-1 pb-2.5 text-[11.5px] font-semibold text-slate-400">
            <div>เวลา</div>
            <div>ทะเบียน</div>
            <div>บริการ</div>
            <div className="text-right">ยอด</div>
            <div className="text-right">ชำระ</div>
          </div>
          {recent.length === 0 && <div className="py-6 text-center text-sm text-slate-400">ยังไม่มีงานวันนี้</div>}
          {recent.map((j) => (
            <div
              key={j.id}
              className="grid grid-cols-[64px_1.4fr_1.3fr_70px_88px] items-center gap-1 border-b border-slate-50 px-1 py-2.5"
            >
              <div className="font-kanit text-[12.5px] text-slate-500">{timeHM(j.created_at)}</div>
              <div className="min-w-0">
                <div className="font-kanit text-[13.5px] font-bold text-slate-900">{j.plate}</div>
                <div className="truncate text-[11px] text-slate-400">
                  {[j.brand, j.model].filter(Boolean).join(' ')}
                </div>
              </div>
              <div className="truncate text-[12.5px] text-slate-600">
                {jobServiceText(j, services)} <span className="text-slate-400">· {j.size_code}</span>
              </div>
              <div className="font-kanit text-right text-[13.5px] font-bold text-slate-900">{baht(j.total)}</div>
              <div className="flex justify-end">
                <PaymentBadge method={j.payment_method} />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <CardTitle>ลูกค้าประจำ</CardTitle>
          <div className="flex flex-col gap-2.5">
            {topCustomers.length === 0 && <div className="text-sm text-slate-400">ยังไม่มีข้อมูล</div>}
            {topCustomers.map((c, i) => (
              <div key={c.plate} className="flex items-center gap-3">
                <div
                  className="font-kanit flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] text-[13px] font-bold"
                  style={{
                    background: i === 0 ? '#FEF3C7' : '#F1F5F9',
                    color: i === 0 ? '#B45309' : '#475569',
                  }}
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-kanit text-[13.5px] font-bold text-slate-900">{c.plate}</div>
                  <div className="truncate text-[11.5px] text-slate-400">
                    {carText({ brand: c.brand, model: c.model, size_code: c.size_code ?? '-' })}
                  </div>
                </div>
                <div className="flex-none text-right">
                  <div className="font-kanit text-sm font-bold text-[#EAB308]">{c.visit_count}</div>
                  <div className="text-[10.5px] text-slate-400">ครั้ง</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
