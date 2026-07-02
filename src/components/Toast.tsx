import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

interface ToastContextValue {
  show: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((msg: string) => {
    if (timer.current) clearTimeout(timer.current)
    setMessage(msg)
    timer.current = setTimeout(() => setMessage(null), 2200)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <div
          className="animate-fadein font-kanit fixed bottom-7 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-2xl"
          style={{ background: '#0F172A' }}
        >
          <span className="text-lg text-emerald-400">✓</span>
          {message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
