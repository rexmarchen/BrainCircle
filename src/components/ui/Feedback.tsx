import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        {icon}
      </div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const tones: Record<AlertTone, { wrapper: string; icon: string }> = {
  info: { wrapper: 'border-brand-100 bg-brand-50/70 text-brand-900', icon: 'text-brand-600' },
  success: { wrapper: 'border-emerald-100 bg-emerald-50/80 text-emerald-900', icon: 'text-emerald-600' },
  warning: { wrapper: 'border-amber-200/70 bg-amber-50/80 text-amber-900', icon: 'text-amber-600' },
  danger: { wrapper: 'border-rose-100 bg-rose-50/80 text-rose-900', icon: 'text-rose-600' },
}

export function Alert({
  tone = 'info',
  icon,
  title,
  children,
  action,
  className,
}: {
  tone?: AlertTone
  icon?: ReactNode
  title?: string
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  const palette = tones[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm',
        palette.wrapper,
        className,
      )}
    >
      {icon ? <span className={cn('mt-0.5 shrink-0', palette.icon)}>{icon}</span> : null}
      <div className="min-w-0 flex-1">
        {title ? <p className="font-bold">{title}</p> : null}
        <div className={cn('leading-relaxed', title && 'mt-0.5 opacity-90')}>{children}</div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-2xl border border-line bg-surface shadow-card', className)}>
      {children}
    </div>
  )
}
