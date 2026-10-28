import { useEffect, useState } from 'react'
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface RoomExpiryTimerProps {
  expiresAt?: number
  createdAt: number
  onExpire?: () => void
  status: 'open' | 'closed'
}

export function RoomExpiryTimer({
  expiresAt,
  createdAt,
  onExpire,
  status,
}: RoomExpiryTimerProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // If no explicit expiresAt, default to 45 minutes from createdAt for hackathon compliance
  const effectiveExpiresAt = expiresAt ?? createdAt + 45 * 60 * 1000
  const totalDuration = effectiveExpiresAt - createdAt
  const remainingMs = Math.max(0, effectiveExpiresAt - now)
  const isExpired = status === 'closed' || remainingMs <= 0

  useEffect(() => {
    if (remainingMs <= 0 && status === 'open' && onExpire) {
      onExpire()
    }
  }, [remainingMs, status, onExpire])

  const totalSeconds = Math.floor(remainingMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const formattedTime =
    hours > 0
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalDuration - remainingMs) / Math.max(1, totalDuration)) * 100)),
  )

  const isUrgent = remainingMs > 0 && remainingMs < 5 * 60 * 1000 // under 5 minutes

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock
            className={`size-4 ${isExpired ? 'text-slate-400' : isUrgent ? 'animate-pulse text-amber-500' : 'text-brand-600'}`}
            aria-hidden="true"
          />
          <span className="text-xs font-bold text-ink">Room Expiry Countdown</span>
        </div>
        {isExpired ? (
          <Badge variant="neutral" icon={<CheckCircle2 className="size-3" />}>
            Session Ended
          </Badge>
        ) : (
          <span
            className={`font-mono text-sm font-extrabold tracking-tight ${
              isUrgent ? 'text-amber-600 animate-pulse' : 'text-brand-700'
            }`}
          >
            {formattedTime} left
          </span>
        )}
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isExpired ? 'bg-slate-300' : isUrgent ? 'bg-amber-500' : 'bg-gradient-to-r from-brand-500 to-violet-accent'
          }`}
          style={{ width: `${isExpired ? 100 : progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[0.7rem] text-muted">
        <span>Session timer</span>
        <span>
          {isExpired
            ? 'Room is now closed'
            : isUrgent
            ? 'Less than 5 minutes remaining!'
            : 'Closes automatically on 00:00'}
        </span>
      </div>

      {isUrgent && !isExpired ? (
        <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[0.7rem] font-medium text-amber-800">
          <AlertTriangle className="size-3 shrink-0" />
          <span>Wrap up your study topics — room expires soon.</span>
        </div>
      ) : null}
    </div>
  )
}
