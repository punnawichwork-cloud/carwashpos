import { useMemo, useState } from 'react'
import { useTodayJobs, useMarkPaid, useUpdateJobServices, useUpdateJobStatus } from './jobs.hooks'
import { usePriceMatrix, useServices, useShopConfig } from '@/features/reference/reference.hooks'
import { JobCard } from './JobCard'
import { QrSheet } from './QrSheet'
import { PaySheet } from './PaySheet'
import { EditJobSheet } from './EditJobSheet'
import type { JobWithServices } from './jobs.service'
import type { PaymentMethod } from '@/lib/database.types'
import { FullPageSpinner } from '@/components/Spinner'
import { useToast } from '@/components/Toast'

export function isOpenJob(j: JobWithServices): boolean {
  return j.status !== 'paid' && j.status !== 'void'
}

export function MyJobsPage() {
  const toast = useToast()
  const { data: jobs = [], isLoading } = useTodayJobs()
  const { data: services = [] } = useServices(true)
  const { data: priceMap = {} } = usePriceMatrix()
  const { data: shop = null } = useShopConfig()
  const updateStatus = useUpdateJobStatus()
  const markPaid = useMarkPaid()
  const updateServices = useUpdateJobServices()

  const [qrId, setQrId] = useState<number | null>(null)
  const [payId, setPayId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)

  const openJobs = useMemo(() => jobs.filter(isOpenJob), [jobs])
  const byId = (id: number | null) => jobs.find((j) => j.id === id) ?? null
  const qrJob = byId(qrId)
  const payJob = byId(payId)
  const editJob = byId(editId)

  async function pay(method: PaymentMethod) {
    if (payId == null) return
    try {
      await markPaid.mutateAsync({ id: payId, method })
      toast.show(method === 'cash' ? 'รับเงินสดแล้ว' : 'รับเงินพร้อมเพย์แล้ว')
    } catch (e) {
      toast.show('บันทึกการชำระไม่สำเร็จ')
      console.error(e)
    } finally {
      setPayId(null)
      setQrId(null)
    }
  }

  if (isLoading) return <FullPageSpinner />

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3.5 pb-24 pt-3.5">
      {openJobs.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <div className="mb-2 text-[44px]">🫧</div>
          <div className="font-kanit text-[15px] font-semibold text-slate-500">ยังไม่มีงานในคิวตอนนี้</div>
          <div className="mt-1 text-[12.5px]">แตะ “เปิดงาน” เพื่อเริ่มรับรถคันแรก</div>
        </div>
      ) : (
        openJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            services={services}
            onEdit={() => setEditId(job.id)}
            onStartWash={() => updateStatus.mutate({ id: job.id, status: 'in_progress' })}
            onFinishWash={() => updateStatus.mutate({ id: job.id, status: 'done' })}
            onShowQr={() => setQrId(job.id)}
          />
        ))
      )}

      <QrSheet
        open={qrId != null}
        onClose={() => setQrId(null)}
        job={qrJob}
        services={services}
        shop={shop}
        onAskPay={() => setPayId(qrId)}
      />
      <PaySheet
        open={payId != null}
        onClose={() => setPayId(null)}
        amount={payJob?.total ?? 0}
        onCash={() => pay('cash')}
        onPromptPay={() => pay('promptpay')}
      />
      <EditJobSheet
        open={editId != null}
        onClose={() => setEditId(null)}
        job={editJob}
        services={services}
        priceMap={priceMap}
        saving={updateServices.isPending}
        onSave={async (lines) => {
          if (editId == null) return
          try {
            await updateServices.mutateAsync({ jobId: editId, lines })
            toast.show('บันทึกการแก้ไขแล้ว')
          } catch (e) {
            toast.show('บันทึกไม่สำเร็จ')
            console.error(e)
          } finally {
            setEditId(null)
          }
        }}
      />
    </div>
  )
}
