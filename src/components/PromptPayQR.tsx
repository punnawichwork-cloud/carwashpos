import { useEffect, useState } from 'react'
import { generatePromptPayQR } from '@/lib/promptpay'
import { Spinner } from './Spinner'

interface Props {
  promptpayId: string
  amount: number
  shopName: string
}

/** Blue gradient card containing the generated PromptPay QR. */
export function PromptPayQR({ promptpayId, amount, shopName }: Props) {
  const [dataUrl, setDataUrl] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    setDataUrl('')
    setError(false)
    if (!promptpayId || amount <= 0) {
      setError(true)
      return
    }
    generatePromptPayQR(promptpayId, amount)
      .then((url) => alive && setDataUrl(url))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [promptpayId, amount])

  return (
    <div
      className="mx-auto my-4 w-[236px] rounded-3xl p-3.5 shadow-sheet"
      style={{ background: 'linear-gradient(135deg,#0EA5E9,#0284C7)' }}
    >
      <div className="flex items-center justify-between px-1 pb-3 pt-0.5 text-white">
        <span className="font-kanit text-sm font-bold">PromptPay</span>
        <span className="font-kanit rounded bg-white/90 px-2 py-0.5 text-[9px] font-bold text-brand-600">
          ฿ QR
        </span>
      </div>
      <div className="flex min-h-[180px] items-center justify-center rounded-2xl bg-white p-3">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="PromptPay QR"
            className="block h-auto w-full"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : error ? (
          <span className="font-kanit px-4 text-center text-xs text-slate-400">
            ตั้งค่าเลขพร้อมเพย์ในหน้า “จัดการร้าน” ก่อนสร้าง QR
          </span>
        ) : (
          <Spinner />
        )}
      </div>
      <div className="font-kanit pt-2.5 text-center text-[13px] font-semibold text-white">{shopName}</div>
    </div>
  )
}
