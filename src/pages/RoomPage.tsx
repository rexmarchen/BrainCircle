import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  DoorClosed,
  DoorOpen,
  Link2,
  LogOut,
  Radio,
  ServerCrash,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useRoom } from '@/hooks/useRooms'
import { useRoomMembership } from '@/hooks/useRoomMembership'
import {
  availabilityLabel,
  isRoomFull,
  participantCount,
  participantList,
  roomAvailability,
} from '@/config/rooms'
import { Avatar, AvatarStack } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonStyles } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Alert, Card, EmptyState } from '@/components/ui/Feedback'
import { Skeleton } from '@/components/ui/Skeleton'
import { ParticipantList } from '@/components/rooms/ParticipantList'
import { ConnectionPill, CopyLinkButton } from '@/components/rooms/RoomActions'
import { formatRelativeTime } from '@/utils/format'
import { loginRedirect } from '@/utils/navigation'
import { cn } from '@/utils/cn'

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { room, loading, error, refresh } = useRoom(roomId)
  const { user } = useAuth()
  const connection = useConnectionStatus()
  const membership = useRoomMembership({ room, user, online: connection.online })
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const autoJoinAttempted = useRef(false)

  useDocumentTitle(room ? room.name : 'Study room')

  const joinParam = searchParams.get('join') === '1'
  const availability = roomAvailability(room)
  const members = room ? participantList(room) : []
  const count = participantCount(room)

  useEffect(() => {
    if (!joinParam || autoJoinAttempted.current || loading || !room || !user) return
    autoJoinAttempted.current = true
    const next = new URLSearchParams(searchParams)
    next.delete('join')
    setSearchParams(next, { replace: true })
    if (membership.isMember || room.status !== 'open' || isRoomFull(room)) return
    void membership.join()
  }, [joinParam, loading, room, user, membership, searchParams, setSearchParams])

  if (loading) {
    return (
      <div className="container-page py-10 lg:py-14">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="mt-5 h-64 w-full rounded-3xl" />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-page py-16 lg:py-24">
        <div className="mx-auto max-w-xl">
          <Alert
            tone="danger"
            icon={<ServerCrash className="size-4" />}
            title="This room could not be loaded"
            action={
              <Button variant="outline" size="sm" onClick={refresh}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
          <Link
            to="/rooms"
            className={buttonStyles({ variant: 'ghost', className: 'mt-4 px-0 text-brand-700' })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to all rooms
          </Link>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="container-page py-16 lg:py-20">
        <div className="mx-auto max-w-xl">
          <EmptyState
            icon={<DoorClosed className="size-5" aria-hidden="true" />}
            title="This room isn't here"
            description="The link may have expired, or the room closed when its last member left. Live rooms close themselves so stale circles never linger."
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link to="/rooms" className={buttonStyles({ variant: 'outline' })}>
                  Explore live rooms
                </Link>
                <Link to="/rooms/create" className={buttonStyles({})}>
                  Create a room
                </Link>
              </div>
            }
          />
        </div>
      </div>
    )
  }

  const isMember = membership.isMember
  const closed = room.status === 'closed'
  const full = availability === 'full'
  const fillPercent = Math.min(100, Math.round((count / Math.max(1, room.maxCapacity)) * 100))
  const joinLabel =
    membership.pending === 'join'
      ? 'Joining…'
      : closed
        ? 'Room closed'
        : full
          ? 'Room full'
          : 'Join room'

  return (
    <div className="container-page py-8 lg:py-12">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/rooms"
          className="inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-muted transition-colors hover:text-brand-700"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          All rooms
        </Link>
        <ConnectionPill status={connection.status} />
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        <div className="relative p-6 sm:p-8">
          <div
            className="pointer-events-none absolute right-0 top-0 h-40 w-2/3 bg-gradient-to-bl from-brand-50/80 to-transparent"
            aria-hidden="true"
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">{room.subject}</Badge>
              <Badge
                variant={closed ? 'neutral' : full ? 'warning' : 'success'}
                className="gap-1.5"
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    closed ? 'bg-slate-400' : full ? 'bg-amber-500' : 'bg-emerald-500',
                  )}
                  aria-hidden="true"
                />
                {closed ? 'Closed' : full ? 'Full' : 'Open'}
              </Badge>
              {isMember ? (
                <Badge variant="brand" icon={<ShieldCheck className="size-3.5" />}>
                  You're in
                </Badge>
              ) : null}
            </div>

            <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
              {room.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              {room.description || 'No description provided. This circle is here to focus.'}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <Avatar name={room.creatorName} uid={room.creatorId} size="xs" />
                Hosted by <span className="font-semibold text-ink-soft">{room.creatorName}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarClock className="size-3.5" aria-hidden="true" />
                Opened {formatRelativeTime(room.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden="true" />
                {count} / {room.maxCapacity} members
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-line bg-canvas/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="min-w-0 flex-1 sm:max-w-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {members.length > 0 ? <AvatarStack people={members} max={4} /> : null}
                <span className="text-xs font-bold text-ink">
                  {count} / {room.maxCapacity}
                </span>
              </div>
              <span className="text-xs font-medium text-muted">{availabilityLabel(room)}</span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-label={`${count} of ${room.maxCapacity} seats filled`}
              aria-valuemin={0}
              aria-valuemax={room.maxCapacity}
              aria-valuenow={count}
            >
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  full ? 'bg-amber-400' : 'bg-gradient-to-r from-brand-500 to-violet-accent',
                )}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CopyLinkButton roomName={room.name} />
            {!user ? (
              <Link to={loginRedirect(`/rooms/${room.id}?join=1`)} className={buttonStyles({})}>
                Sign in to join
              </Link>
            ) : isMember ? (
              <Button
                variant="outline"
                onClick={() => setLeaveOpen(true)}
                loading={membership.pending === 'leave'}
                className="border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                icon={<LogOut className="size-4" />}
              >
                Leave room
              </Button>
            ) : (
              <Button
                onClick={() => void membership.join()}
                loading={membership.pending === 'join'}
                disabled={closed || full}
                title={closed ? 'This room is closed' : full ? 'This room is full' : undefined}
                icon={<DoorOpen className="size-4" />}
              >
                {joinLabel}
              </Button>
            )}
          </div>
        </div>
      </div>

      {membership.actionError ? (
        <div className="mt-4">
          <Alert
            tone="danger"
            icon={<AlertTriangle className="size-4" />}
            title="That action did not complete"
            action={
              <button
                type="button"
                onClick={membership.clearActionError}
                className="text-xs font-semibold underline underline-offset-2"
              >
                Dismiss
              </button>
            }
          >
            {membership.actionError}
          </Alert>
        </div>
      ) : null}

      {closed ? (
        <div className="mt-4">
          <Alert
            tone="warning"
            icon={<DoorClosed className="size-4" />}
            title="This room is closed"
            action={
              <Link to="/rooms" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
                Find another room
              </Link>
            }
          >
            The last member left, so this circle closed itself. Closed rooms cannot be joined.
          </Alert>
        </div>
      ) : null}

      {full && !isMember ? (
        <div className="mt-4">
          <Alert
            tone="warning"
            icon={<Users className="size-4" />}
            title="Every seat is taken"
            action={
              <Link to="/rooms" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
                Explore rooms
              </Link>
            }
          >
            Seats free up the moment someone leaves. Join is blocked here and enforced by the
            database rules as well.
          </Alert>
        </div>
      ) : null}

      {isMember && connection.status !== 'online' ? (
        <div className="mt-4">
          <Alert
            tone="warning"
            icon={<Radio className="size-4" />}
            title="Reconnecting to your circle"
          >
            Your seat is held while we reconnect. If the connection dropped long enough for the
            server to release your seat, we will try to reclaim it automatically.
          </Alert>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-bold text-ink">In this circle</h2>
              <p className="mt-0.5 text-xs text-muted">
                {count === 0
                  ? 'Waiting for the first member.'
                  : `${count} ${count === 1 ? 'student is' : 'students are'} here right now.`}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <span className="relative flex size-1.5" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-600" />
              </span>
              Live
            </span>
          </div>
          <div className="px-5 sm:px-6">
            <ParticipantList room={room} currentUserId={user?.uid} />
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-base font-bold text-ink">Room details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-line/70 pb-3">
                <dt className="text-muted">Subject</dt>
                <dd className="font-semibold text-ink">{room.subject}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line/70 pb-3">
                <dt className="text-muted">Status</dt>
                <dd className="font-semibold text-ink">
                  {closed ? 'Closed' : full ? 'Full' : 'Open'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line/70 pb-3">
                <dt className="text-muted">Capacity</dt>
                <dd className="font-semibold tabular-nums text-ink">
                  {count} / {room.maxCapacity}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Host</dt>
                <dd className="max-w-[60%] truncate font-semibold text-ink">{room.creatorName}</dd>
              </div>
            </dl>

            {isMember ? (
              <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/70 p-3.5">
                <p className="text-xs font-bold text-brand-800">You hold a seat</p>
                <p className="mt-1 text-xs leading-relaxed text-brand-700/80">
                  Seat {room.participants[user!.uid]?.seat !== undefined ? room.participants[user!.uid].seat + 1 : '—'} of{' '}
                  {room.maxCapacity}. Leaving frees it immediately.
                </p>
              </div>
            ) : null}

            <div className="mt-5 flex items-start gap-2 rounded-xl bg-canvas/80 p-3.5 text-xs leading-relaxed text-muted">
              <Link2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                Share this room link with your subject-mates. Anyone with an account can take an
                open seat.
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row lg:flex-col">
              <CopyLinkButton roomName={room.name} />
              <Link
                to="/rooms/create"
                className={buttonStyles({ variant: 'secondary', className: 'w-full' })}
              >
                Create your own room
              </Link>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <ShieldCheck className="size-4 text-brand-600" aria-hidden="true" />
              How this room stays healthy
            </h2>
            <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted">
              <li>Seats are limited and enforced by server-side rules.</li>
              <li>One membership per account, even with multiple tabs.</li>
              <li>Closing the tab releases your seat via presence.</li>
              <li>The room closes when the last member leaves.</li>
            </ul>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => {
          void membership.leave().then((left) => {
            if (left) setLeaveOpen(false)
          })
        }}
        loading={membership.pending === 'leave'}
        title="Leave this study room?"
        description={
          count <= 1
            ? 'You are the last member. Leaving will release your seat and close this room.'
            : 'Your seat will be released immediately so another student can take it.'
        }
        confirmLabel="Leave room"
        cancelLabel="Stay"
      />

      <div className="mt-8 text-center text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden="true" />
          This is a presence room — there is no chat, video, or voice.
        </span>
      </div>
    </div>
  )
}
