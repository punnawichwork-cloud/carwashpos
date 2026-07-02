import type { JobStatus, PaymentMethod } from './database.types'

// ---- car size badge colors [bg, fg] ----
export const SIZE_BADGE: Record<string, { bg: string; fg: string }> = {
  S: { bg: '#DBEAFE', fg: '#1D4ED8' },
  M: { bg: '#DCFCE7', fg: '#15803D' },
  L: { bg: '#FEF3C7', fg: '#B45309' },
  XL: { bg: '#FFE4E6', fg: '#BE123C' },
  '2XL': { bg: '#EDE9FE', fg: '#6D28D9' },
  '3XL': { bg: '#FFEDD5', fg: '#C2410C' },
  '4XL': { bg: '#E0E7FF', fg: '#4338CA' },
}

export function sizeBadge(code: string | null | undefined) {
  return (code && SIZE_BADGE[code]) || { bg: '#F1F5F9', fg: '#475569' }
}

// ---- service dot palette (cycled by index) ----
export const SERVICE_DOTS = [
  '#0EA5E9',
  '#FBBF24',
  '#10B981',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#14B8A6',
  '#EF4444',
  '#6366F1',
  '#84CC16',
]

export function serviceDot(index: number): string {
  return SERVICE_DOTS[index % SERVICE_DOTS.length]
}

// ---- job status meta ----
export const STATUS_META: Record<
  Exclude<JobStatus, 'paid' | 'void'>,
  { label: string; bg: string; fg: string; dot: string }
> = {
  open: { label: 'รอคิว', bg: '#F1F5F9', fg: '#475569', dot: '#94A3B8' },
  in_progress: { label: 'กำลังล้าง', bg: '#FEF3C7', fg: '#B45309', dot: '#F59E0B' },
  done: { label: 'เสร็จแล้ว', bg: '#DCFCE7', fg: '#15803D', dot: '#22C55E' },
}

export function statusMeta(status: JobStatus) {
  return (
    STATUS_META[status as keyof typeof STATUS_META] ?? {
      label: status === 'paid' ? 'จ่ายแล้ว' : 'ยกเลิก',
      bg: '#DCFCE7',
      fg: '#15803D',
      dot: '#22C55E',
    }
  )
}

// ---- payment meta ----
export function paymentMeta(method: PaymentMethod | null) {
  if (method === 'cash') return { label: 'เงินสด', bg: '#DCFCE7', fg: '#15803D' }
  if (method === 'promptpay') return { label: 'พร้อมเพย์', bg: '#DBEAFE', fg: '#1D4ED8' }
  return { label: 'ค้างชำระ', bg: '#FFE4E6', fg: '#BE123C' }
}

// ---- Thai provinces (77) ----
export const PROVINCES = [
  'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี',
  'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง',
  'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์',
  'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์',
  'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก',
  'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร',
  'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย',
  'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว',
  'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย',
  'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี',
]

export const OTHER_BRAND_LABEL = 'อื่นๆ'
