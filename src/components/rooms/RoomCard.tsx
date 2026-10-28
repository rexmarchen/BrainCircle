import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Clock3, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarStack } from '@/components/ui/Avatar'
import { Button, buttonStyles } from '@/components/ui/Button'
import {
  availabilityLabel,
  isParticipant,
  participantCount,
  participantList,
  roomAvailability,
} from '@/config/rooms'
import type { Room } from '@/types/room'
import { cn } from '@/utils/cn'
import { formatRelativeTime } from '@/utils/format'

export function RoomCard({
  room,
  currentUserId,
  onJoin,
  joining = false,
  joinDisabled = false,
}: {
  room: Room
  currentUserId?: string
  onJoin: (room: Room) => void
  joining?: boolean
  joinDisabled?: boolean
}) {
  const availability = roomAvailability(room)
  const members = participantList(room)
  const count = participantCount(room)
  const member = isParticipant(room, currentUserId)
  const fillPercent = Math.min(100, Math.round((count / Math.max(1, room.maxCapacity)) * 100))

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200/80 hover:shadow-card-hover">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="brand" icon={<BookOpen className="size-3.5" aria-hidden="true" />}>
          {room.subject}
        </Badge>
        <Badge
          variant={
            availability === 'open' ? 'success' : availability === 'full' ? 'warning' : 'neutral'
          }
          className="ml-auto"
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              availability === 'open'
                ? 'bg-emerald-500'
                : availability === 'full'
                  ? 'bg-amber-500'
                  : 'bg-slate-400',
            )}
            aria-hidden="true"
          />
          {availability === 'open' ? 'Open' : availability === 'full' ? 'Full' : 'Closed'}
        </Badge>
      </div>

      <h3 className="mt-4 text-lg font-bold leading-snug">
        <Link
          to={`/rooms/${room.id}`}
          className="rounded-sm text-ink transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          {room.name}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-relaxed text-muted">
        {room.description || 'No description yet — drop in and start a focused session.'}
      </p>

      <div className="mt-4 flex items-center gap-2.5">
        <Avatar name={room.creatorName} uid={room.creatorId} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-ink-soft">{room.creatorName}</p>
          <p className="flex items-center gap-1 text-[0.7rem] text-muted">
            <Clock3 className="size-3" aria-hidden="true" />
            Started {formatRelativeTime(room.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {members.length > 0 ? <AvatarStack people={members} max={3} /> : null}
            <span className="flex items-center gap-1 text-xs font-semibold text-ink-soft">
              <Users className="size-3.5 text-muted" aria-hidden="true" />
              {count}/{room.maxCapacity}
            </span>
          </div>
          <span className="text-xs font-medium text-muted">{availabilityLabel(room)}</span>
        </div>

        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas-deep"
          role="progressbar"
          aria-label={`${count} of ${room.maxCapacity} seats filled`}
          aria-valuemin={0}
          aria-valuemax={room.maxCapacity}
          aria-valuenow={count}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              availability === 'full'
                ? 'bg-amber-400'
                : 'bg-gradient-to-r from-brand-500 to-violet-accent',
            )}
            style={{ width: `${fillPercent}%` }}
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link
            to={`/rooms/${room.id}`}
            className={buttonStyles({
              variant: 'outline',
              size: 'md',
              className: 'flex-1',
            })}
          >
            View room
          </Link>
          {member ? (
            <Link
              to={`/rooms/${room.id}`}
              className={buttonStyles({
                variant: 'primary',
                size: 'md',
                className: 'flex-1',
              })}
            >
              Open
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <Button
              onClick={() => onJoin(room)}
              loading={joining}
              disabled={joinDisabled || availability !== 'open'}
              className="flex-1"
              aria-label={`Join ${room.name}`}
            >
              {availability === 'open' ? 'Join room' : availability === 'full' ? 'Full' : 'Closed'}
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
