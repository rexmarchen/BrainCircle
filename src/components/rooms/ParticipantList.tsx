import { useEffect, useState } from 'react'
import { Crown, Radio, UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { isFreshParticipant, participantList } from '@/config/rooms'
import type { Room, RoomParticipant } from '@/types/room'
import { cn } from '@/utils/cn'
import { formatRelativeTime } from '@/utils/format'

function ParticipantRow({
  participant,
  room,
  currentUserId,
  now,
}: {
  participant: RoomParticipant
  room: Room
  currentUserId?: string
  now: number
}) {
  const isHost = participant.uid === room.creatorId
  const isYou = participant.uid === currentUserId
  const live = isFreshParticipant(participant, now)

  return (
    <li className="flex items-center gap-3 py-3">
      <span className="relative">
        <Avatar name={participant.displayName} uid={participant.uid} size="md" />
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-surface',
            live ? 'bg-emerald-500' : 'bg-amber-400',
          )}
          aria-hidden="true"
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-ink">{participant.displayName}</p>
          {isYou ? (
            <Badge variant="brand" className="px-1.5 py-0 text-[0.65rem]">
              You
            </Badge>
          ) : null}
          {isHost ? (
            <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[0.65rem]">
              <Crown className="size-3" aria-hidden="true" />
              Host
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
          <Radio className={cn('size-3', live ? 'text-emerald-500' : 'text-amber-500')} aria-hidden="true" />
          {live ? `Joined ${formatRelativeTime(participant.joinedAt, now)}` : 'Reconnecting…'}
          <span className="text-line-strong" aria-hidden="true">
            ·
          </span>
          Seat {participant.seat + 1}
        </p>
        {participant.goal ? (
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-0.5 text-[0.72rem] font-medium text-brand-800">
            <span>🎯</span>
            <span className="max-w-[280px] truncate">{participant.goal}</span>
          </p>
        ) : null}
      </div>
    </li>
  )
}

export function ParticipantList({
  room,
  currentUserId,
}: {
  room: Room
  currentUserId?: string
}) {
  const [now, setNow] = useState(() => Date.now())
  const participants = participantList(room)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-canvas/50 px-4 py-10 text-center">
        <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-surface text-muted shadow-sm">
          <UserRound className="size-5" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-ink">No one here yet</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Take the first seat and open the circle.
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-line/70" aria-label="Room participants">
      {participants.map((participant) => (
        <ParticipantRow
          key={participant.uid}
          participant={participant}
          room={room}
          currentUserId={currentUserId}
          now={now}
        />
      ))}
    </ul>
  )
}
