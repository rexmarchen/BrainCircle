import type { Room } from '@/types/room'
import { participantCount, roomAvailability } from '@/config/rooms'

export type RoomSort = 'newest' | 'availability'

export interface RoomFilterState {
  query: string
  subject: string
  availableOnly: boolean
  sort: RoomSort
}

export const DEFAULT_ROOM_FILTERS: RoomFilterState = {
  query: '',
  subject: 'all',
  availableOnly: false,
  sort: 'newest',
}

/**
 * Filters and sorts rooms for discovery. Only active (open) rooms are returned;
 * closed rooms stay reachable by direct link but never appear in Explore.
 */
export function filterRooms(rooms: Room[], filters: RoomFilterState): Room[] {
  const query = filters.query.trim().toLowerCase()

  return rooms
    .filter((room) => room.status === 'open')
    .filter((room) => {
      if (filters.subject !== 'all' && room.subject.toLowerCase() !== filters.subject.toLowerCase()) {
        return false
      }
      if (filters.availableOnly && roomAvailability(room) !== 'open') return false
      if (!query) return true
      return (
        room.name.toLowerCase().includes(query) ||
        room.subject.toLowerCase().includes(query) ||
        room.description.toLowerCase().includes(query) ||
        room.creatorName.toLowerCase().includes(query)
      )
    })
    .sort((first, second) => {
      if (filters.sort === 'availability') {
        const seats =
          second.maxCapacity -
          participantCount(second) -
          (first.maxCapacity - participantCount(first))
        if (seats !== 0) return seats
      }
      return second.createdAt - first.createdAt
    })
}

export function subjectOptions(rooms: Room[]): string[] {
  const subjects = new Set<string>()
  for (const room of rooms) {
    if (room.status === 'open') subjects.add(room.subject)
  }
  return Array.from(subjects).sort((first, second) => first.localeCompare(second))
}
