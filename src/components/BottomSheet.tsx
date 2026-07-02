import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Tailwind height / max-height class for the sheet body. */
  heightClass?: string
  className?: string
  /** z-index override when stacking sheets. */
  z?: number
}

export function BottomSheet({ open, onClose, children, heightClass, className, z = 70 }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="animate-fadein absolute inset-0 flex flex-col justify-end"
      style={{ zIndex: z, background: 'rgba(15,23,42,.4)' }}
      onClick={onClose}
    >
      <div
        className={cn(
          'animate-sheetup flex flex-col rounded-t-[28px] bg-white px-4 pb-8 pt-5',
          heightClass,
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3.5 h-[5px] w-11 rounded-full bg-slate-200" />
        {children}
      </div>
    </div>
  )
}
