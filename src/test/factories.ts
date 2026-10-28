import type { Room, RoomParticipant } from '@/types/room'

export function participant(
  uid: string,
  overrides: Partial<RoomParticipant> = {},
): RoomParticipant {
  return {
    uid,
    displayName: `Student ${uid}`,
    joinedAt: 1_000,
    lastSeenAt: Date.now(),
    seat: 0,
    seatKey: '0',
    ...overrides,
  }
}

export function room(overrides: Partial<Room> = {}): Room {
  const creatorId = overrides.creatorId ?? 'creator'
  const participants =
    overrides.participants ?? ({ [creatorId]: participant(creatorId) } as Record<string, RoomParticipant>)

  return {
    id: 'room-1',
    name: 'Graphs and DP',
    subject: 'DSA',
    description: 'A focused session on graph traversal.',
    creatorId,
    creatorName: 'Creator',
    maxCapacity: 4,
    status: 'open',
    createdAt: 1_000,
    participants,
    ...overrides,
  }
}

export function fullRoom(overrides: Partial<Room> = {}): Room {
  return room({
    maxCapacity: 2,
    participants: {
      creator: participant('creator'),
      alice: participant('alice', { seat: 1, seatKey: '1' }),
    },
    ...overrides,
  })
}
