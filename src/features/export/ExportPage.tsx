import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  dateISO,
  rangeFromDates,
  rangeFor,
  baht,
  timeHM,
  dateTH,
} from '@/lib/format'
import { useServices } from '@/features/reference/reference.hooks'
import { PaymentBadge } from '@/components/StatusBadge'
import { downloadCsv, type CsvValue } from '@/lib/csv'
import { useToast } from '@/components/Toast'
import { jobServiceText } from '@/features/jobs/jobDisplay'
import { Spinner } from '@/components/Spinner'
import type { JobService, Job } from '@/lib/database.types'

interface JobWithServicesAndStaff extends Job {
  job_services: JobService[]
  staff: { full_name: string } | null
}

const HEADERS = [
  'วันที่',
  'เวลา',
  'ทะเบียน',
  'จังหวัด',
  'ยี่ห้อ',
  'รุ่น',
  'ขนาด',
  'บริการ',
  'ราคา',
  'ยอดรวมงาน',
  'สถานะ',
  'วิธีชำระ',
  'เวลาชำระ',
  'พนักงาน',
]

export function ExportPage() {
  const toast = useToast()
  const todayStr = dateISO(new Date().toISOString())

  const [fromDate, setFromDate] = useState(todayStr)
  const [toDate, setToDate] = useState(todayStr)

  const { data: services = [] } = useServices(false)

  const { fromISO, toISO } = rangeFromDates(fromDate, toDate)

  const { data: jobs = [], isLoading } = useQuery<JobWithServicesAndStaff[]>({
    queryKey: ['jobs', 'export', fromDate, toDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, job_services(*), staff:profiles(full_name)')
        .gte('created_at', fromISO)
        .lt('created_at', toISO)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as JobWithServicesAndStaff[]
    },
  })

  const summary = useMemo(() => {
    let jobCount = 0
    let revenue = 0
    let voidCount = 0

    for (const j of jobs) {
      if (j.status === 'void') {
        voidCount++
      } else {
        jobCount++
        if (j.status === 'paid') {
          revenue += j.total
        }
      }
    }

    return { jobCount, revenue, voidCount }
  }, [jobs])

  function applyPreset(preset: 'today' | 'week' | 'month') {
    const range = rangeFor(preset)
    setFromDate(dateISO(range.fromISO))
    const toDateVal = dateISO(new Date(new Date(range.toISO).getTime() - 1000).toISOString())
    setToDate(toDateVal)
  }

  function handleDownload() {
    if (!jobs.length) {
      toast.show('ไม่มีข้อมูลในช่วงวันที่เลือก')
      return
    }
    const csvRows: CsvValue[][] = []

    for (const j of jobs) {
      const dateStr = dateISO(j.created_at)
      const timeStr = timeHM(j.created_at)
      const staffName = j.staff?.full_name || 'ไม่ระบุ'
      const statusLabel =
        j.status === 'void' ? 'ยกเลิก' : j.status === 'paid' ? 'ชำระเงินแล้ว' : 'ค้างชำระ'
      const paymentLabel =
        j.payment_method === 'cash'
          ? 'เงินสด'
          : j.payment_method === 'promptpay'
            ? 'พร้อมเพย์'
            : '—'
      const paidTime = j.paid_at ? timeHM(j.paid_at) : '—'

      for (const line of j.job_services) {
        const svcName = line.service_id
          ? services.find((s) => s.id === line.service_id)?.name_th || 'บริการทั่วไป'
          : line.custom_name || 'บริการพิเศษ'

        csvRows.push([
          dateStr,
          timeStr,
          j.plate,
          j.province || '—',
          j.brand || '—',
          j.model || '—',
          j.size_code,
          svcName,
          line.price,
          j.total,
          statusLabel,
          paymentLabel,
          paidTime,
          staffName,
        ])
      }
    }

    const filename = `carwash_jobs_${fromDate}_ถึง_${toDate}.csv`
    downloadCsv(filename, HEADERS, csvRows)
    toast.show('ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว')
  }

  const previewJobs = jobs.slice(0, 10)

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    )

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* Date Range Card */}
      <div className="rounded-[20px] border border-slate-100 bg-white p-6 shadow-card">
        <div className="font-kanit mb-4 text-lg font-bold text-slate-900">เลือกช่วงวันที่ต้องการ</div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[140px] flex-1 lg:min-w-[200px]">
            <label className="font-kanit mb-1.5 block text-sm font-semibold text-slate-700">
              ตั้งแต่วันที่
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="font-kanit w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-sky focus:bg-white"
            />
          </div>
          <div className="min-w-[140px] flex-1 lg:min-w-[200px]">
            <label className="font-kanit mb-1.5 block text-sm font-semibold text-slate-700">
              ถึงวันที่
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="font-kanit w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-sky focus:bg-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyPreset('today')}
              className="font-kanit rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition active:scale-95"
            >
              วันนี้
            </button>
            <button
              onClick={() => applyPreset('week')}
              className="font-kanit rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition active:scale-95"
            >
              7 วันล่าสุด
            </button>
            <button
              onClick={() => applyPreset('month')}
              className="font-kanit rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition active:scale-95"
            >
              เดือนนี้
            </button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div
        className="flex flex-col gap-4 rounded-[20px] p-5 text-white shadow-card lg:flex-row lg:items-center lg:justify-between lg:p-6"
        style={{ background: 'linear-gradient(135deg,#0EA5E9 0%,#0284C7 60%,#0369A1 100%)' }}
      >
        <div className="grid grid-cols-3 gap-2 lg:flex lg:items-center lg:gap-8">
          <div>
            <div className="text-xs opacity-80">จำนวนรายการ (ไม่รวมยกเลิก)</div>
            <div className="font-kanit mt-1 text-lg font-bold lg:text-2xl">{summary.jobCount} งาน</div>
          </div>
          <div className="hidden h-10 w-px bg-white/20 lg:block" />
          <div>
            <div className="text-xs opacity-80">รายรับรวม (ชำระแล้ว)</div>
            <div className="font-kanit mt-1 text-lg font-bold lg:text-2xl">{baht(summary.revenue)}</div>
          </div>
          <div className="hidden h-10 w-px bg-white/20 lg:block" />
          <div>
            <div className="text-xs opacity-80">ยกเลิก (void)</div>
            <div className="font-kanit mt-1 text-lg font-bold text-rose-300 lg:text-2xl">{summary.voidCount} งาน</div>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="font-kanit flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-700 shadow-md transition hover:bg-slate-50 active:scale-95 lg:w-auto"
        >
          📥 ดาวน์โหลด CSV
        </button>
      </div>

      {/* Preview Table */}
      <div className="rounded-[20px] border border-slate-100 bg-white p-6 shadow-card overflow-hidden">
        <div className="font-kanit mb-4 text-lg font-bold text-slate-900">
          ตัวอย่างข้อมูลนำเข้า (10 รายการล่าสุด)
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 pb-3 text-xs font-semibold text-slate-400">
                <th className="pb-3">วันที่ / เวลา</th>
                <th className="pb-3">ทะเบียนรถ</th>
                <th className="pb-3">บริการ</th>
                <th className="pb-3">ขนาดรถ</th>
                <th className="pb-3 text-right">ยอดรวม</th>
                <th className="pb-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {previewJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    ไม่มีข้อมูลในช่วงวันที่เลือก
                  </td>
                </tr>
              )}
              {previewJobs.map((j) => {
                const isVoid = j.status === 'void'
                return (
                  <tr
                    key={j.id}
                    className={`border-b border-slate-50 py-3 ${isVoid ? 'opacity-40 line-through' : ''}`}
                  >
                    <td className="py-3.5">
                      <div className="font-kanit text-slate-800">{dateTH(j.created_at)}</div>
                      <div className="text-xs text-slate-400">{timeHM(j.created_at)}</div>
                    </td>
                    <td className="py-3.5">
                      <div className="font-kanit font-bold text-slate-900">{j.plate}</div>
                      <div className="text-xs text-slate-400">{j.province}</div>
                    </td>
                    <td className="py-3.5 font-kanit">
                      {jobServiceText(j as any, services)}
                    </td>
                    <td className="py-3.5 font-kanit font-bold text-slate-800">{j.size_code}</td>
                    <td className="py-3.5 text-right font-kanit font-bold text-slate-900">
                      {baht(j.total)}
                    </td>
                    <td className="py-3.5 text-center">
                      <PaymentBadge method={j.payment_method} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

