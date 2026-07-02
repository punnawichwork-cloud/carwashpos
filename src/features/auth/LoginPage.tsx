import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { homeFor } from './RequireRole'
import { useShopConfig } from '@/features/reference/reference.hooks'
import { Spinner } from '@/components/Spinner'

type Mode = 'signin' | 'signup'

function friendlyError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  if (m.includes('already registered') || m.includes('already exists')) return 'อีเมลนี้ถูกใช้สมัครแล้ว'
  if (m.includes('password') && m.includes('6')) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
  if (m.includes('email')) return 'อีเมลไม่ถูกต้อง'
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่'
}

export function LoginPage() {
  const { session, profile, role, loading, signIn, signUp } = useAuth()
  const { data: shop } = useShopConfig()
  const [mode, setMode] = useState<Mode>('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState('')

  if (!loading && session && profile) {
    return <Navigate to={homeFor(role)} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password, fullName.trim())
        setInfo('สมัครสำเร็จ! หากระบบตั้งค่ายืนยันอีเมล กรุณาตรวจอีเมลก่อนเข้าสู่ระบบ')
        setMode('signin')
      }
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : String(err)))
    } finally {
      setBusy(false)
    }
  }

  const shopName = shop?.shop_name || 'ร้านล้างรถ'

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-1.5 px-8 py-10 text-center text-white"
      style={{ background: 'linear-gradient(180deg,#0EA5E9 0%,#0284C7 60%,#0369A1 100%)' }}
    >
      <div className="mb-2.5 flex h-24 w-24 items-center justify-center rounded-[30px] bg-white/[.16] shadow-xl">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
          <path d="M12 2.5C12 2.5 5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.5-7-12.5Z" fill="#fff" />
          <circle cx="9.4" cy="14" r="1.6" fill="#7DD3FC" />
        </svg>
      </div>
      <div className="font-kanit text-2xl font-bold tracking-wide">{shopName}</div>
      <div className="mb-6 text-sm opacity-80">ระบบ POS ร้านล้างรถ</div>

      <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-3">
        {mode === 'signup' && (
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="ชื่อ (พนักงาน)"
            className="font-kanit w-full rounded-2xl border border-white/25 bg-white/[.14] px-4 py-3.5 text-white outline-none placeholder:text-white/60 focus:border-white/60"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="อีเมล"
          autoComplete="email"
          required
          className="font-kanit w-full rounded-2xl border border-white/25 bg-white/[.14] px-4 py-3.5 text-white outline-none placeholder:text-white/60 focus:border-white/60"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="รหัสผ่าน"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          required
          className="font-kanit w-full rounded-2xl border border-white/25 bg-white/[.14] px-4 py-3.5 text-white outline-none placeholder:text-white/60 focus:border-white/60"
        />

        {error && <div className="rounded-xl bg-rose-500/90 px-3 py-2 text-sm font-semibold">{error}</div>}
        {info && <div className="rounded-xl bg-emerald-500/90 px-3 py-2 text-sm font-semibold">{info}</div>}

        <button
          type="submit"
          disabled={busy}
          className="font-kanit mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-lg font-bold text-brand-700 shadow-xl transition active:scale-[.97] disabled:opacity-70"
        >
          {busy && <Spinner className="h-5 w-5" />}
          {mode === 'signin' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin')
          setError('')
          setInfo('')
        }}
        className="mt-4 text-sm underline opacity-90"
      >
        {mode === 'signin' ? 'ยังไม่มีบัญชี? สมัครพนักงานใหม่' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
      </button>
    </div>
  )
}
