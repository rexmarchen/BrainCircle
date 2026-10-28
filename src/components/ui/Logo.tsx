import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-9', className)}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="12" fill="currentColor" />
      <circle cx="20" cy="20" r="10.75" stroke="white" strokeOpacity="0.32" strokeWidth="1.5" />
      <path
        d="M20 11.5 27.8 25.6H12.2L20 11.5Z"
        stroke="white"
        strokeOpacity="0.75"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="11.5" r="2.4" fill="white" />
      <circle cx="27.8" cy="25.6" r="2.4" fill="white" />
      <circle cx="12.2" cy="25.6" r="2.4" fill="white" />
      <circle cx="20" cy="20" r="2.9" fill="#A5B4FC" />
    </svg>
  )
}

export function Logo({
  className,
  compact = false,
  inverted = false,
}: {
  className?: string
  compact?: boolean
  inverted?: boolean
}) {
  return (
    <Link
      to="/"
      className={cn(
        'group inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500',
        className,
      )}
      aria-label="BrainCircle home"
    >
      <LogoMark
        className={cn(
          'transition-transform duration-300 group-hover:-rotate-3',
          inverted ? 'text-white' : 'text-brand-700',
        )}
      />
      {!compact ? (
        <span
          className={cn(
            'text-[1.15rem] font-extrabold tracking-[-0.04em]',
            inverted ? 'text-white' : 'text-ink',
          )}
        >
          Brain<span className={inverted ? 'text-brand-200' : 'text-brand-600'}>Circle</span>
        </span>
      ) : null}
    </Link>
  )
}
