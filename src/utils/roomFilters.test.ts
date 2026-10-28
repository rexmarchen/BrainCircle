import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ROOM_FILTERS,
  filterRooms,
  subjectOptions,
  type RoomFilterState,
} from '@/utils/roomFilters'
import { fullRoom, room } from '@/test/factories'

function filters(overrides: Partial<RoomFilterState> = {}): RoomFilterState {
  return { ...DEFAULT_ROOM_FILTERS, ...overrides }
}

describe('filterRooms', () => {
  it('only returns open rooms', () => {
    const rooms = [
      room({ id: 'open' }),
      room({ id: 'closed', status: 'closed' }),
      fullRoom({ id: 'full' }),
    ]
    const result = filterRooms(rooms, filters())

    expect(result.map((entry) => entry.id)).toEqual(['open', 'full'])
  })

  it('filters by subject regardless of casing', () => {
    const rooms = [
      room({ id: 'dsa', subject: 'DSA' }),
      room({ id: 'math', subject: 'Mathematics' }),
    ]
    expect(filterRooms(rooms, filters({ subject: 'dsa' })).map((entry) => entry.id)).toEqual([
      'dsa',
    ])
  })

  it('filters to rooms with an available seat', () => {
    const rooms = [room({ id: 'open' }), fullRoom({ id: 'full' })]
    expect(
      filterRooms(rooms, filters({ availableOnly: true })).map((entry) => entry.id),
    ).toEqual(['open'])
  })

  it('searches name, subject, description, and creator', () => {
    const rooms = [
      room({ id: 'name', name: 'Organic chemistry lab' }),
      room({ id: 'subject', subject: 'Physics', name: 'Problem set' }),
      room({ id: 'description', description: 'Reviewing thermodynamics' }),
      room({ id: 'creator', creatorName: 'Priya' }),
      room({ id: 'miss', name: 'Unrelated', description: 'Nothing here', creatorName: 'Sam' }),
    ]

    expect(filterRooms(rooms, filters({ query: 'ORGANIC' })).map((entry) => entry.id)).toEqual([
      'name',
    ])
    expect(filterRooms(rooms, filters({ query: 'physics' })).map((entry) => entry.id)).toEqual([
      'subject',
    ])
    expect(
      filterRooms(rooms, filters({ query: 'thermo' })).map((entry) => entry.id),
    ).toEqual(['description'])
    expect(filterRooms(rooms, filters({ query: 'priya' })).map((entry) => entry.id)).toEqual([
      'creator',
    ])
  })

  it('sorts by newest first by default without mutating the input', () => {
    const rooms = [room({ id: 'older', createdAt: 1 }), room({ id: 'newer', createdAt: 9 })]
    const snapshot = [...rooms]
    const result = filterRooms(rooms, filters())

    expect(result.map((entry) => entry.id)).toEqual(['newer', 'older'])
    expect(rooms).toEqual(snapshot)
  })

  it('sorts by most available seats when requested', () => {
    const rooms = [
      room({
        id: 'one-seat',
        maxCapacity: 2,
        participants: { creator: room().participants.creator },
      }),
      room({ id: 'three-seats', maxCapacity: 4 }),
    ]

    expect(filterRooms(rooms, filters({ sort: 'availability' })).map((entry) => entry.id)).toEqual(
      ['three-seats', 'one-seat'],
    )
  })
})

describe('subjectOptions', () => {
  it('deduplicates, sorts, and ignores closed rooms', () => {
    const options = subjectOptions([
      room({ subject: 'Physics' }),
      room({ subject: 'DSA' }),
      room({ subject: 'Physics', id: 'another' }),
      room({ subject: 'History', status: 'closed' }),
    ])

    expect(options).toEqual(['DSA', 'Physics'])
  })
})
