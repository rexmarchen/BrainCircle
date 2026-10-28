import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'outline'

const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-canvas-deep text-ink-soft border-transparent',
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-800 border-amber-100',
  danger: 'bg-rose-50 text-rose-700 border-rose-100',
  outline: 'bg-surface text-ink-soft border-line',
}

export function Badge({
  children,
  variant = 'neutral',
  className,
  icon,
}: {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
  icon?: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        variants[variant],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
