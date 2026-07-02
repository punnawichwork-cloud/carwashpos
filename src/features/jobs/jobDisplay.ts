import type { Service } from '@/lib/database.types'
import type { JobWithServices } from './jobs.service'

export function serviceNames(job: JobWithServices, services: Service[]): string[] {
  return job.job_services.map((ls) => {
    if (ls.service_id) {
      return services.find((s) => s.id === ls.service_id)?.name_th ?? ls.service_id
    }
    return ls.custom_name || 'บริการพิเศษ'
  })
}

export function jobServiceText(job: JobWithServices, services: Service[]): string {
  const names = serviceNames(job, services)
  return names.length ? names.join(' + ') : '—'
}

export function carText(job: { brand: string | null; model: string | null; size_code: string }): string {
  const car = [job.brand, job.model].filter(Boolean).join(' ')
  return `${car || 'ไม่ระบุรถ'} · ไซส์ ${job.size_code}`
}
