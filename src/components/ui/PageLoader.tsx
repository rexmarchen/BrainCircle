import { Loader2 } from 'lucide-react'

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <Loader2 className="size-6 animate-spin text-brand-600" aria-hidden="true" />
      <p className="text-sm font-medium text-muted" role="status">
        {label}
      </p>
    </div>
  )
}

export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <div className="relative flex size-14 items-center justify-center rounded-2xl bg-brand-700">
        <span className="size-6 rounded-full border-2 border-white/30 border-t-white motion-safe:animate-spin" />
      </div>
      <p className="text-sm font-medium text-muted" role="status">
        {label}
      </p>
    </div>
  )
}
