import { sizeBadge } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface Props {
  code: string | null | undefined
  label?: string
  className?: string
}

export function SizeBadge({ code, label, className }: Props) {
  const { bg, fg } = sizeBadge(code)
  return (
    <span
      className={cn('font-kanit inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold', className)}
      style={{ background: bg, color: fg }}
    >
      {label ?? `ไซส์ ${code}`}
    </span>
  )
}
