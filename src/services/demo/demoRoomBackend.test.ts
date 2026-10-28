import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DemoRoomBackend } from '@/services/demo/demoRoomBackend'
import type { CreateRoomInput } from '@/types/room'
import {
  EMPTY_ROOM_TTL_MS,
  SEAT_CLAIM_TTL_MS,
  STALE_MEMBER_TTL_MS,
} from '@/config/rooms'

const creator = { uid: 'creator', displayName: 'Creator' }
const alice = { uid: 'alice', displayName: 'Alice' }
const bob = { uid: 'bob', displayName: 'Bob' }

const baseInput: CreateRoomInput = {
  name: 'Graphs and DP',
  subject: 'DSA',
  description: 'Working through graph traversal problems.',
  maxCapacity: 3,
}

function setup(clock: () => number = () => Date.now()) {
  return new DemoRoomBackend({ persist: false, clock })
}

async function expectRoomError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ name: 'RoomError', code })
}

describe('DemoRoomBackend', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a room and gives the creator the first seat', async () => {
    const backend = setup()
    const id = await backend.createRoom(baseInput, creator)
    const room = await backend.getRoom(id)

    expect(room).not.toBeNull()
    expect(room?.status).toBe('open')
    expect(room?.creatorId).toBe(creator.uid)
    expect(room?.participants[creator.uid]).toMatchObject({
      displayName: 'Creator',
      seat: 0,
      seatKey: '0',
    })
    expect(room?.seats?.['0']?.uid).toBe(creator.uid)
  })

  it('trims room input and rejects invalid capacity and short names', async () => {
    const backend = setup()
    const id = await backend.createRoom(
      { ...baseInput, name: '  Focus room  ', subject: '  Math  ' },
      creator,
    )
    const room = await backend.getRoom(id)
    expect(room?.name).toBe('Focus room')
    expect(room?.subject).toBe('Math')

    await expectRoomError(
      backend.createRoom({ ...baseInput, maxCapacity: 1 }, creator),
      'invalid-input',
    )
    await expectRoomError(
      backend.createRoom({ ...baseInput, maxCapacity: 21 }, creator),
      'invalid-input',
    )
    await expectRoomError(backend.createRoom({ ...baseInput, name: 'x' }, creator), 'invalid-input')
    await expectRoomError(
      backend.createRoom({ ...baseInput, description: 'x'.repeat(281) }, creator),
      'invalid-input',
    )
    await expectRoomError(
      backend.createRoom(baseInput, { uid: '', displayName: 'Nobody' }),
      'unauthenticated',
    )
  })

  it('treats a repeat join as already-member without taking another seat', async () => {
    const backend = setup()
    const id = await backend.createRoom({ ...baseInput, maxCapacity: 2 }, creator)

    const result = await backend.joinRoom(id, creator)
    const room = await backend.getRoom(id)

    expect(result).toEqual({ status: 'already-member', seat: 0 })
    expect(Object.keys(room?.participants ?? {})).toHaveLength(1)
    expect(Object.keys(room?.seats ?? {})).toHaveLength(1)
  })

  it('rejects a join when the last seat has been taken', async () => {
    const backend = setup()
    const id = await backend.createRoom({ ...baseInput, maxCapacity: 2 }, creator)
    await backend.joinRoom(id, alice)

    await expectRoomError(backend.joinRoom(id, bob), 'full')
    const room = await backend.getRoom(id)
    expect(Object.keys(room?.participants ?? {})).toHaveLength(2)
    expect(Object.keys(room?.seats ?? {}).sort()).toEqual(['0', '1'])
  })

  it('never exceeds capacity when two students race for the last seat', async () => {
    const backend = setup()
    const id = await backend.createRoom({ ...baseInput, maxCapacity: 2 }, creator)

    const results = await Promise.allSettled([
      backend.joinRoom(id, alice),
      backend.joinRoom(id, bob),
    ])
    const fulfilled = results.filter((result) => result.status === 'fulfilled')
    const rejected = results.filter((result) => result.status === 'rejected')

    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({ code: 'full' })

    const room = await backend.getRoom(id)
    expect(Object.keys(room?.participants ?? {})).toHaveLength(2)
    expect(Object.keys(room?.seats ?? {}).sort()).toEqual(['0', '1'])
  })

  it('closes the room when the last participant leaves and rejects later joins', async () => {
    const backend = setup()
    const id = await backend.createRoom({ ...baseInput, maxCapacity: 2 }, creator)
    await backend.joinRoom(id, alice)

    await backend.leaveRoom(id, alice.uid)
    let room = await backend.getRoom(id)
    expect(room?.status).toBe('open')

    await backend.leaveRoom(id, creator.uid)
    room = await backend.getRoom(id)
    expect(room?.status).toBe('closed')
    expect(room?.closedAt).toBeTypeOf('number')
    expect(room?.seats).toEqual({})

    await expectRoomError(backend.joinRoom(id, alice), 'closed')
  })

  it('is idempotent for leave, closeIfEmpty, and pruneRoom on missing rooms', async () => {
    const backend = setup()
    await expect(backend.leaveRoom('missing', creator.uid)).resolves.toBeUndefined()
    await expect(backend.closeIfEmpty('missing')).resolves.toBeUndefined()
    await expect(backend.pruneRoom('missing')).resolves.toBeUndefined()
    await expect(backend.getRoom('missing')).resolves.toBeNull()
  })

  it('prunes participants whose heartbeat is stale and frees their seat', async () => {
    let now = 1_000
    const backend = setup(() => now)
    const id = await backend.createRoom({ ...baseInput, maxCapacity: 2 }, creator)

    now += STALE_MEMBER_TTL_MS + 1
    const result = await backend.joinRoom(id, alice)
    const room = await backend.getRoom(id)

    expect(result).toEqual({ status: 'joined', seat: 0 })
    expect(room?.participants[creator.uid]).toBeUndefined()
    expect(Object.keys(room?.participants ?? {})).toEqual([alice.uid])
  })

  it('keeps a participant alive when they send a heartbeat', async () => {
    let now = 1_000
    const backend = setup(() => now)
    const id = await backend.createRoom({ ...baseInput, maxCapacity: 2 }, creator)

    now += STALE_MEMBER_TTL_MS - 60_000
    await backend.touchMembership(id, creator.uid)
    now += 120_000
    await backend.joinRoom(id, alice)

    const room = await backend.getRoom(id)
    expect(room?.participants[creator.uid]).toBeDefined()
    expect(room?.participants[alice.uid]?.seat).toBe(1)
  })

  it('closes a long-empty open room during prune', async () => {
    const createdAt = 10_000
    const now = createdAt + EMPTY_ROOM_TTL_MS + 1
    localStorage.setItem(
      'braincircle:demo:rooms:v1',
      JSON.stringify({
        version: 1,
        rooms: {
          abandoned: {
            id: 'abandoned',
            name: 'Abandoned room',
            subject: 'DSA',
            description: '',
            creatorId: 'ghost',
            creatorName: 'Ghost',
            maxCapacity: 3,
            status: 'open',
            createdAt,
            participants: {},
            seats: {},
          },
        },
      }),
    )
    const backend = new DemoRoomBackend({ persist: true, clock: () => now })

    await backend.pruneRoom('abandoned')
    const room = await backend.getRoom('abandoned')
    expect(room?.status).toBe('closed')
  })

  it('reclaims orphaned seats but leaves fresh ones alone', async () => {
    const now = 50_000
    const participantSeat = {
      uid: alice.uid,
      claimedAt: now,
    }
    localStorage.setItem(
      'braincircle:demo:rooms:v1',
      JSON.stringify({
        version: 1,
        rooms: {
          seeded: {
            id: 'seeded',
            name: 'Seeded room',
            subject: 'DSA',
            description: '',
            creatorId: alice.uid,
            creatorName: alice.displayName,
            maxCapacity: 3,
            status: 'open',
            createdAt: now - 1_000,
            participants: {
              [alice.uid]: {
                uid: alice.uid,
                displayName: alice.displayName,
                joinedAt: now - 1_000,
                lastSeenAt: now,
                seat: 0,
                seatKey: '0',
              },
            },
            seats: {
              '0': participantSeat,
              '1': { uid: 'ghost', claimedAt: now - SEAT_CLAIM_TTL_MS - 1 },
              '2': { uid: 'ghost', claimedAt: now - 1_000 },
            },
          },
        },
      }),
    )
    const backend = new DemoRoomBackend({ persist: true, clock: () => now })

    await backend.pruneRoom('seeded')
    const room = await backend.getRoom('seeded')
    const seatKeys = Object.keys(room?.seats ?? {}).sort()

    expect(seatKeys).toEqual(['0', '2'])
    expect(room?.participants[alice.uid]).toBeDefined()
  })

  it('notifies room and list subscribers of changes', async () => {
    const backend = setup()
    const listListener = vi.fn()
    const unsubscribeList = backend.subscribeRooms(listListener, vi.fn())
    const id = await backend.createRoom(baseInput, creator)

    const roomListener = vi.fn()
    const unsubscribeRoom = backend.subscribeRoom(id, roomListener, vi.fn())
    expect(roomListener).toHaveBeenLastCalledWith(
      expect.objectContaining({ id, participants: expect.any(Object) }),
    )

    await backend.joinRoom(id, alice)

    expect(roomListener.mock.calls.at(-1)?.[0]?.participants).toHaveProperty(alice.uid)
    expect(listListener.mock.calls.at(-1)?.[0]).toHaveLength(1)

    unsubscribeRoom()
    unsubscribeList()
  })

  it('forwards backend errors to subscribers until they unsubscribe', () => {
    const backend = setup()
    const onError = vi.fn()
    const unsubscribe = backend.subscribeRooms(vi.fn(), onError)

    backend.emitErrorForTests('boom')
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }))

    unsubscribe()
    backend.emitErrorForTests('ignored')
    expect(onError).toHaveBeenCalledTimes(1)
  })
})
