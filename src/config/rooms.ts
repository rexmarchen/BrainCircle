import type { Room, RoomParticipant } from '@/types/room'

export const ROOM_LIMITS = {
  minCapacity: 2,
  maxCapacity: 20,
  minNameLength: 3,
  maxNameLength: 60,
  minSubjectLength: 2,
  maxSubjectLength: 40,
  maxDescriptionLength: 280,
} as const

/** A seat claimed but with no participant record is reclaimable after this long. */
export const SEAT_CLAIM_TTL_MS = 45_000
/** A participant that has not sent a heartbeat for this long is considered gone. */
export const STALE_MEMBER_TTL_MS = 5 * 60_000
/** A participant is shown as "live" when their heartbeat is this fresh. */
export const LIVE_PRESENCE_WINDOW_MS = 75_000
export const HEARTBEAT_INTERVAL_MS = 30_000
/** Open rooms with zero participants are closed after this grace period. */
export const EMPTY_ROOM_TTL_MS = 10 * 60_000
export const MAX_ROOMS = 100

export const SUBJECTS = [
  'DSA',
  'Java',
  'Mathematics',
  'Physics',
  'AI/ML',
  'Web Development',
  'System Design',
  'Chemistry',
  'Biology',
  'Economics',
  'English',
  'History',
] as const

export function participantList(room: Room | null | undefined): RoomParticipant[] {
  if (!room) return []
  return Object.values(room.participants ?? {}).sort((a, b) => {
    if (a.uid === room.creatorId) return -1
    if (b.uid === room.creatorId) return 1
    return a.joinedAt - b.joinedAt
  })
}

export function participantCount(room: Room | null | undefined): number {
  return room ? Object.keys(room.participants ?? {}).length : 0
}

export function availableSeats(room: Room | null | undefined): number {
  if (!room || room.status !== 'open') return 0
  return Math.max(0, room.maxCapacity - participantCount(room))
}

export function isRoomFull(room: Room | null | undefined): boolean {
  return Boolean(room && participantCount(room) >= room.maxCapacity)
}

export type RoomAvailability = 'open' | 'full' | 'closed'

export function roomAvailability(room: Room | null | undefined): RoomAvailability {
  if (!room) return 'closed'
  if (room.status === 'closed') return 'closed'
  return isRoomFull(room) ? 'full' : 'open'
}

export function availabilityLabel(room: Room | null | undefined): string {
  switch (roomAvailability(room)) {
    case 'open': {
      const seats = availableSeats(room)
      return seats === 1 ? '1 seat open' : `${seats} seats open`
    }
    case 'full':
      return 'Room full'
    default:
      return 'Closed'
  }
}

export function isParticipant(room: Room | null | undefined, uid: string | undefined): boolean {
  if (!room || !uid) return false
  return Boolean(room.participants?.[uid])
}

export function isFreshParticipant(
  participant: RoomParticipant,
  now = Date.now(),
): boolean {
  return now - participant.lastSeenAt < LIVE_PRESENCE_WINDOW_MS
}
