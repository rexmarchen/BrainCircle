import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Atom,
  Binary,
  BrainCircuit,
  Check,
  Coffee,
  Compass,
  DoorOpen,
  Sigma,
  Sparkles,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { appMode } from '@/app/config'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import { useRooms } from '@/hooks/useRooms'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { buttonStyles } from '@/components/ui/Button'
import { RoomCardSkeleton } from '@/components/ui/Skeleton'
import { ConnectionPill } from '@/components/rooms/RoomActions'
import { availableSeats, participantCount, isRoomFull } from '@/config/rooms'
import type { Room } from '@/types/room'
import { cn } from '@/utils/cn'

const SUBJECT_META: Record<string, { icon: typeof Binary; note: string }> = {
  DSA: { icon: Binary, note: 'Patterns, problems, and practice' },
  Java: { icon: Coffee, note: 'OOP, Spring, and interview prep' },
  Mathematics: { icon: Sigma, note: 'Problem sets and proofs' },
  Physics: { icon: Atom, note: 'Concepts, derivations, and revision' },
  'AI/ML': { icon: BrainCircuit, note: 'Models, maths, and experiments' },
}

const STEPS = [
  {
    icon: Compass,
    title: 'Find a subject',
    body: 'Browse live rooms or search by name, subject, or host. No scheduling forms, no group-chat archaeology.',
  },
  {
    icon: UserPlus,
    title: 'Take a seat',
    body: 'Join in one click. Every room has a hard seat limit, so the circle stays small enough to focus.',
  },
  {
    icon: Sparkles,
    title: 'Show up together',
    body: 'See who is in the room live. Leave anytime — when the last person leaves, the room closes itself.',
  },
]

const BENEFITS = [
  {
    icon: Users,
    title: 'Small by design',
    body: 'Rooms hold 2–20 students. Capacity is enforced on the server, so a circle never overfills.',
  },
  {
    icon: Zap,
    title: 'Live presence',
    body: 'Participant lists and seat counts update instantly. No refreshing, no stale attendee lists.',
  },
  {
    icon: DoorOpen,
    title: 'Ephemeral rooms',
    body: 'Seats release when you leave or close the tab. Empty rooms close instead of lingering forever.',
  },
  {
    icon: Check,
    title: 'No calls, no cameras',
    body: 'A quiet, presence-first space. BrainCircle never asks for microphone or camera permissions.',
  },
]

function PreviewRoom({ room }: { room: Room }) {
  const count = participantCount(room)
  const full = isRoomFull(room)
  const seats = availableSeats(room)

  return (
    <Link
      to={`/rooms/${room.id}`}
      className={cn(
        'group block rounded-xl border px-3.5 py-3 transition-all',
        full
          ? 'border-amber-200/70 bg-amber-50/50 hover:border-amber-300'
          : 'border-line bg-canvas/40 hover:border-brand-200 hover:bg-brand-50/40',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant="brand">{room.subject}</Badge>
        <span className="flex items-center gap-1 text-xs font-semibold text-ink-soft">
          <Users className="size-3.5 text-muted" aria-hidden="true" />
          {count}/{room.maxCapacity}
        </span>
      </div>
      <p className="mt-2 truncate text-sm font-bold text-ink transition-colors group-hover:text-brand-700">
        {room.name}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
          <Avatar name={room.creatorName} uid={room.creatorId} size="xs" />
          <span className="truncate">{room.creatorName}</span>
        </span>
        <span className={cn('shrink-0 text-[0.7rem] font-semibold', full ? 'text-amber-700' : 'text-emerald-700')}>
          {full ? 'Full' : `${seats} ${seats === 1 ? 'seat' : 'seats'} open`}
        </span>
      </div>
    </Link>
  )
}

export function LandingPage() {
  useDocumentTitle('Find your circle')
  const { user } = useAuth()
  const { rooms, loading } = useRooms()
  const connection = useConnectionStatus()
  const openRooms = rooms.filter((room) => room.status === 'open')
  const previewRooms = openRooms.slice(0, 3)
  const totalSeats = openRooms.reduce((total, room) => total + availableSeats(room), 0)
  const createHref = user ? '/rooms/create' : '/signup?redirect=%2Frooms%2Fcreate'

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 grid-lines opacity-70" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-40 top-0 -z-10 size-[34rem] rounded-full bg-brand-200/35 blur-[110px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-52 top-56 -z-10 size-[28rem] rounded-full bg-violet-200/30 blur-[110px]"
          aria-hidden="true"
        />

        <div className="container-page grid items-center gap-12 py-14 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/80 px-3 py-1.5 text-xs font-semibold text-brand-700">
              <span className="relative flex size-1.5" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-500 opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-brand-600" />
              </span>
              Live study circles for real focus
            </span>

            <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.05] tracking-[-0.045em] text-ink sm:text-[3.4rem] lg:text-[3.8rem]">
              Find your <span className="text-gradient">circle</span>.
              <br />
              Focus together.
            </h1>

            <p className="mt-5 max-w-xl text-[0.98rem] leading-relaxed text-muted sm:text-base">
              BrainCircle is a live room finder for students who want to study the same subject at
              the same time. Pick a subject, take a seat, and see exactly who is in the circle —
              no calls, no scheduling, no endless group chats.
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <Link to="/rooms" className={buttonStyles({ size: 'lg' })}>
                Explore Study Rooms
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to={createHref}
                className={buttonStyles({ variant: 'outline', size: 'lg' })}
              >
                Create a Room
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted">
              {['Free to use', 'No downloads', '2–20 students per room'].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <dl className="mt-8 flex w-fit gap-8 rounded-2xl border border-line bg-surface/70 px-5 py-3.5 shadow-card backdrop-blur-sm">
              <div>
                <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-muted">
                  Open right now
                </dt>
                <dd className="mt-0.5 text-lg font-extrabold tabular-nums text-ink">
                  {loading ? <span className="skeleton inline-block h-5 w-8 rounded" /> : openRooms.length}
                </dd>
              </div>
              <div className="border-l border-line pl-8">
                <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-muted">
                  Seats available
                </dt>
                <dd className="mt-0.5 text-lg font-extrabold tabular-nums text-ink">
                  {loading ? <span className="skeleton inline-block h-5 w-8 rounded" /> : totalSeats}
                </dd>
              </div>
            </dl>
          </div>

          {/* Live preview */}
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-100/70 via-transparent to-violet-100/60 blur-2xl"
              aria-hidden="true"
            />
            <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-pop">
              <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-rose-300" aria-hidden="true" />
                  <span className="size-2 rounded-full bg-amber-300" aria-hidden="true" />
                  <span className="size-2 rounded-full bg-emerald-300" aria-hidden="true" />
                  <span className="ml-2 text-xs font-bold text-ink-soft">Live rooms</span>
                </div>
                <ConnectionPill status={connection.status} />
              </div>

              <div className="space-y-2.5 p-4 sm:p-5">
                {loading ? (
                  <>
                    <RoomCardSkeleton />
                    <RoomCardSkeleton />
                  </>
                ) : previewRooms.length > 0 ? (
                  previewRooms.map((room) => <PreviewRoom key={room.id} room={room} />)
                ) : (
                  <div className="rounded-xl border border-dashed border-line-strong bg-canvas/50 px-5 py-10 text-center">
                    <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <Users className="size-5" aria-hidden="true" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-ink">The first circle is yours</p>
                    <p className="mx-auto mt-1 max-w-[15rem] text-xs leading-relaxed text-muted">
                      No rooms are open right now. Open one for your subject and take the first seat.
                    </p>
                    <Link
                      to={createHref}
                      className={buttonStyles({ size: 'sm', variant: 'secondary', className: 'mt-4' })}
                    >
                      Create a room
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-line bg-canvas/50 px-5 py-3">
                <span className="text-[0.7rem] font-medium text-muted">
                  {appMode === 'demo'
                    ? 'Local demo data · updates live in this browser'
                    : 'Synced live from Realtime Database'}
                </span>
                <Link
                  to="/rooms"
                  className="inline-flex items-center gap-1 rounded text-xs font-bold text-brand-700 hover:text-brand-800 hover:underline"
                >
                  See all rooms
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 hidden items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-card sm:flex">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Users className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
                  Presence
                </p>
                <p className="text-xs font-bold text-ink">Updates without refreshing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular subjects */}
      <section className="border-y border-line bg-surface/60 py-14 sm:py-16" aria-labelledby="subjects-heading">
        <div className="container-page">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Start here</p>
              <h2 id="subjects-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Popular subjects
              </h2>
              <p className="mt-2 max-w-lg text-sm text-muted">
                Jump into a subject and see which circles are open. Counts come straight from live
                room data.
              </p>
            </div>
            <Link
              to="/rooms"
              className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline"
            >
              Browse every room
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(SUBJECT_META).map(([subject, meta]) => {
              const Icon = meta.icon
              const count = openRooms.filter((room) => room.subject.toLowerCase() === subject.toLowerCase()).length
              return (
                <Link
                  key={subject}
                  to={`/rooms?subject=${encodeURIComponent(subject)}`}
                  className="group rounded-2xl border border-line bg-surface p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-ink">{subject}</p>
                  <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted">{meta.note}</p>
                  <p className="mt-3 text-[0.7rem] font-semibold text-brand-700">
                    {loading ? 'Checking rooms…' : count === 0 ? 'No rooms yet' : `${count} open ${count === 1 ? 'room' : 'rooms'}`}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20" id="how-it-works">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">How it works</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Three steps from “I should study” to a full circle
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              No calendar Tetris. No waiting for replies. Just the people studying what you are
              studying, right now.
            </p>
          </div>

          <div className="relative mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.title}
                  className="relative rounded-2xl border border-line bg-surface p-6 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-extrabold tabular-nums text-line-strong">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-line bg-surface/60 py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Why BrainCircle
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              A quieter way to study with other people
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              Most study tools try to become a meeting. BrainCircle is simply a live map of who is
              studying what — so you can join the right circle and get to work.
            </p>
            <Link
              to="/how-it-works"
              className={buttonStyles({ variant: 'outline', className: 'mt-6' })}
            >
              See how rooms behave
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div key={benefit.title} className="rounded-2xl border border-line bg-surface p-5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-sm font-bold text-ink">{benefit.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{benefit.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-6 py-12 text-center shadow-pop sm:px-12 sm:py-16">
            <div
              className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-violet-accent/30 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-28 -right-20 size-72 rounded-full bg-cyan-accent/20 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-300">
                Your next session
              </p>
              <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                Your circle is already studying. Pull up a seat.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/65">
                Find a room for your subject, or open one and let the right people find you.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
                <Link
                  to="/rooms"
                  className={buttonStyles({ size: 'lg', variant: 'secondary', className: 'bg-white text-brand-800 hover:bg-brand-50' })}
                >
                  Explore Study Rooms
                </Link>
                <Link
                  to={createHref}
                  className={buttonStyles({
                    size: 'lg',
                    className: 'border border-white/20 bg-white/10 text-white shadow-none hover:bg-white/15',
                  })}
                >
                  Create a Room
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
