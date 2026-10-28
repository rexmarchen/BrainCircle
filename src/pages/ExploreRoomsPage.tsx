import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Compass, Plus, SearchX, ServerCrash, SlidersHorizontal, Users } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useRooms } from '@/hooks/useRooms'
import { RoomCard } from '@/components/rooms/RoomCard'
import { RoomFilters } from '@/components/rooms/RoomFilters'
import { RoomCardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState, Alert } from '@/components/ui/Feedback'
import { Button, buttonStyles } from '@/components/ui/Button'
import { roomBackend } from '@/services'
import { availableSeats, participantCount } from '@/config/rooms'
import { toRoomError } from '@/types/errors'
import type { Room } from '@/types/room'
import {
  DEFAULT_ROOM_FILTERS,
  filterRooms,
  subjectOptions,
  type RoomFilterState,
} from '@/utils/roomFilters'
import { loginRedirect } from '@/utils/navigation'

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-card">
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-xl font-extrabold tabular-nums text-ink">{value}</p>
    </div>
  )
}

export function ExploreRoomsPage() {
  useDocumentTitle('Explore study rooms')
  const { rooms, loading, error, refresh } = useRooms()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [joiningId, setJoiningId] = useState<string | null>(null)

  const subjectParam = searchParams.get('subject')
  const queryParam = searchParams.get('q')

  const [filters, setFilters] = useState<RoomFilterState>({
    ...DEFAULT_ROOM_FILTERS,
    subject: subjectParam ?? 'all',
    query: queryParam ?? '',
  })

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      ...(subjectParam ? { subject: subjectParam } : {}),
      ...(queryParam ? { query: queryParam } : {}),
    }))
  }, [subjectParam, queryParam])

  const openRooms = useMemo(() => rooms.filter((room) => room.status === 'open'), [rooms])
  const filtered = useMemo(() => filterRooms(rooms, filters), [rooms, filters])
  const seatsOpen = useMemo(
    () => openRooms.reduce((total, room) => total + availableSeats(room), 0),
    [openRooms],
  )
  const subjects = useMemo(() => subjectOptions(rooms), [rooms])
  const hasFilters = Boolean(filters.query.trim()) || filters.subject !== 'all' || filters.availableOnly

  const handleFilterChange = (next: Partial<RoomFilterState>) => {
    setFilters((current) => ({ ...current, ...next }))
  }

  const handleJoin = async (room: Room) => {
    if (!user) {
      toast.info('Sign in to join', 'Your seat is waiting — sign in and we will bring you back.')
      navigate(loginRedirect(`/rooms/${room.id}?join=1`))
      return
    }
    setJoiningId(room.id)
    try {
      const result = await roomBackend.joinRoom(room.id, {
        uid: user.uid,
        displayName: user.displayName,
      })
      toast.success(
        result.status === 'joined' ? 'Seat claimed' : 'Already a member',
        result.status === 'joined'
          ? `You joined ${room.name}.`
          : `Opening ${room.name}.`,
      )
      navigate(`/rooms/${room.id}`)
    } catch (joinError) {
      toast.error('Could not join this room', toRoomError(joinError).message)
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
            <Compass className="size-3.5" aria-hidden="true" />
            Explore
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-[2.5rem]">
            Find a room that fits your focus.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Every room here is live. Join a circle, see who is studying alongside you, and leave
            whenever you are done.
          </p>
        </div>
        <Link to="/rooms/create" className={buttonStyles({ size: 'lg', className: 'shrink-0' })}>
          <Plus className="size-4" aria-hidden="true" />
          Create a room
        </Link>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-3 sm:max-w-xl">
        <StatBlock label="Open rooms" value={loading ? '—' : openRooms.length} />
        <StatBlock label="Seats open" value={loading ? '—' : seatsOpen} />
        <StatBlock label="Subjects" value={loading ? '—' : subjects.length} />
      </div>

      <div className="mt-6">
        <RoomFilters
          value={filters}
          onChange={handleFilterChange}
          subjects={subjects}
          resultCount={filtered.length}
        />
      </div>

      {error ? (
        <div className="mt-6">
          <Alert
            tone="danger"
            icon={<ServerCrash className="size-4" />}
            title="Live rooms could not be loaded"
            action={
              <Button variant="outline" size="sm" onClick={refresh}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </div>
      ) : null}

      <div className="mt-6" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <RoomCardSkeleton key={index} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                currentUserId={user?.uid}
                onJoin={handleJoin}
                joining={joiningId === room.id}
                joinDisabled={joiningId !== null && joiningId !== room.id}
              />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <EmptyState
            icon={<Users className="size-5" aria-hidden="true" />}
            title="No rooms are open yet"
            description="Be the first to start a circle. Pick a subject, set a seat limit, and take the first seat."
            action={
              <Link to="/rooms/create" className={buttonStyles({})}>
                <Plus className="size-4" aria-hidden="true" />
                Create the first room
              </Link>
            }
          />
        ) : hasFilters ? (
          <EmptyState
            icon={<SearchX className="size-5" aria-hidden="true" />}
            title="No rooms match those filters"
            description="Try a different subject or clear the filters to see every live room."
            action={
              <Button
                variant="outline"
                onClick={() => setFilters({ ...DEFAULT_ROOM_FILTERS })}
                icon={<SlidersHorizontal className="size-4" />}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Users className="size-5" aria-hidden="true" />}
            title="Nothing open right now"
            description="The current rooms are full or closed. Open a new circle and invite your subject-mates in."
            action={
              <Link to="/rooms/create" className={buttonStyles({})}>
                <Plus className="size-4" aria-hidden="true" />
                Create a room
              </Link>
            }
          />
        )}
      </div>

      {!loading && filtered.length > 0 ? (
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <Users className="size-3.5" aria-hidden="true" />
          Showing {filtered.length} live {filtered.length === 1 ? 'room' : 'rooms'}. Participant
          counts update in real time.
          {openRooms.length > 0
            ? ` ${openRooms.reduce((total, room) => total + participantCount(room), 0)} students are in circles now.`
            : ''}
        </p>
      ) : null}
    </div>
  )
}
