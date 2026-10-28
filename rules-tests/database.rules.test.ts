import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { get, ref, remove, serverTimestamp, set, update } from 'firebase/database'
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest'

const PROJECT_ID = 'demo-braincircle-rules'
const ROOM_ID = 'room1'
const ROOM_PATH = `rooms/${ROOM_ID}`

let environment: RulesTestEnvironment

function databaseFor(uid: string) {
  return environment.authenticatedContext(uid).database()
}

function anonymousDatabase() {
  return environment.unauthenticatedContext().database()
}

function roomPayload(creatorId = 'alice', overrides: Record<string, unknown> = {}) {
  return {
    name: 'Graphs and DP',
    subject: 'DSA',
    description: 'Working through graph traversal problems.',
    creatorId,
    creatorName: creatorId === 'bob' ? 'Bob' : 'Alice',
    maxCapacity: 2,
    status: 'open',
    createdAt: serverTimestamp(),
    ...overrides,
  }
}

function participantPayload(uid: string, seat: number, overrides: Record<string, unknown> = {}) {
  return {
    uid,
    displayName: uid === 'bob' ? 'Bob' : uid === 'charlie' ? 'Charlie' : 'Alice',
    joinedAt: serverTimestamp(),
    lastSeenAt: Date.now(),
    seat,
    seatKey: String(seat),
    ...overrides,
  }
}

function seatPayload(uid: string, overrides: Record<string, unknown> = {}) {
  return { uid, claimedAt: Date.now(), ...overrides }
}

async function createRoom(uid = 'alice', overrides: Record<string, unknown> = {}) {
  await assertSucceeds(set(ref(databaseFor(uid), ROOM_PATH), roomPayload(uid, overrides)))
}

async function joinRoom(uid: string, seat: number) {
  const db = databaseFor(uid)
  await assertSucceeds(set(ref(db, `${ROOM_PATH}/seats/${seat}`), seatPayload(uid)))
  await assertSucceeds(
    set(ref(db, `${ROOM_PATH}/participants/${uid}`), participantPayload(uid, seat)),
  )
}

async function leaveRoom(uid: string, seat: number) {
  const db = databaseFor(uid)
  await assertSucceeds(remove(ref(db, `${ROOM_PATH}/participants/${uid}`)))
  await assertSucceeds(remove(ref(db, `${ROOM_PATH}/seats/${seat}`)))
}

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    database: {
      host: '127.0.0.1',
      port: 9000,
      rules: readFileSync(resolve('database.rules.json'), 'utf8'),
    },
  })
})

afterEach(async () => {
  await environment.clearDatabase()
})

afterAll(async () => {
  await environment.cleanup()
})

describe('default deny and privacy', () => {
  it('denies unauthenticated room creation', async () => {
    await assertFails(set(ref(anonymousDatabase(), ROOM_PATH), roomPayload()))
  })

  it('keeps user profiles private to their owner', async () => {
    await assertSucceeds(
      set(ref(databaseFor('alice'), 'users/alice'), {
        displayName: 'Alice',
        email: 'alice@example.edu',
        createdAt: serverTimestamp(),
      }),
    )

    await assertFails(get(ref(databaseFor('bob'), 'users/alice')))
    await assertFails(get(ref(anonymousDatabase(), 'users/alice')))
    await assertFails(
      set(ref(databaseFor('bob'), 'users/alice'), {
        displayName: 'Mallory',
        email: 'mallory@example.edu',
        createdAt: Date.now(),
      }),
    )
  })

  it('allows anyone to read rooms', async () => {
    await createRoom('alice')
    await assertSucceeds(get(ref(anonymousDatabase(), ROOM_PATH)))
  })
})

describe('room creation validation', () => {
  it('accepts a valid room with a server timestamp', async () => {
    await createRoom('alice')
    await assertSucceeds(get(ref(databaseFor('alice'), ROOM_PATH)))
  })

  it('rejects oversized, undersized, fractional, and impersonated rooms', async () => {
    const cases: Array<Record<string, unknown>> = [
      { maxCapacity: 1 },
      { maxCapacity: 21 },
      { maxCapacity: 2.5 },
      { name: 'ab' },
      { subject: 'x' },
      { description: 'x'.repeat(281) },
      { status: 'closed' },
      { creatorId: 'bob' },
      { participants: { alice: participantPayload('alice', 0) } },
      { seats: { '0': seatPayload('alice') } },
      { unexpected: true },
    ]

    for (const overrides of cases) {
      await assertFails(
        set(ref(databaseFor('alice'), ROOM_PATH), roomPayload('alice', overrides)),
      )
    }
  })
})

describe('seat ownership and capacity', () => {
  it('lets exactly two students take seats 0 and 1 in a two-seat room', async () => {
    await createRoom('alice')
    await joinRoom('alice', 0)
    await joinRoom('bob', 1)

    const snapshot = await get(ref(databaseFor('charlie'), ROOM_PATH))
    expect(Object.keys(snapshot.val().participants)).toEqual(['alice', 'bob'])
    expect(Object.keys(snapshot.val().seats)).toEqual(['0', '1'])
  })

  it('rejects a third student, an unclaimed seat, and a stolen seat', async () => {
    await createRoom('alice')
    await joinRoom('alice', 0)
    await joinRoom('bob', 1)
    const charlie = databaseFor('charlie')

    await assertFails(set(ref(charlie, `${ROOM_PATH}/seats/2`), seatPayload('charlie')))
    await assertFails(set(ref(charlie, `${ROOM_PATH}/seats/0`), seatPayload('charlie')))
    await assertFails(
      set(ref(charlie, `${ROOM_PATH}/participants/charlie`), participantPayload('charlie', 1)),
    )
    await assertFails(
      set(ref(charlie, `${ROOM_PATH}/participants/charlie`), participantPayload('charlie', 2, {
        seatKey: '2',
      })),
    )
    await assertFails(
      set(ref(charlie, `${ROOM_PATH}/participants/charlie`), participantPayload('alice', 0)),
    )
  })

  it('does not let a member free their seat while staying in the room', async () => {
    await createRoom('alice')
    await joinRoom('alice', 0)

    await assertFails(remove(ref(databaseFor('alice'), `${ROOM_PATH}/seats/0`)))

    await leaveRoom('alice', 0)
    await joinRoom('bob', 0)
    await assertSucceeds(get(ref(databaseFor('bob'), `${ROOM_PATH}/participants/bob`)))
  })

  it('allows only the seat owner to remove a seat', async () => {
    await createRoom('alice')
    await joinRoom('alice', 0)

    await assertFails(remove(ref(databaseFor('bob'), `${ROOM_PATH}/seats/0`)))
  })

  it('prevents non-owners from editing or removing another participant', async () => {
    await createRoom('alice')
    await joinRoom('alice', 0)

    await assertFails(
      update(ref(databaseFor('bob'), `${ROOM_PATH}/participants/alice`), {
        lastSeenAt: Date.now(),
      }),
    )
    await assertFails(remove(ref(databaseFor('bob'), `${ROOM_PATH}/participants/alice`)))
    await assertSucceeds(
      update(ref(databaseFor('alice'), `${ROOM_PATH}/participants/alice`), {
        lastSeenAt: Date.now(),
      }),
    )
  })

  it('allows stale members and orphaned seats to be cleaned up by another client', async () => {
    await createRoom('alice')
    const stale = Date.now() - 6 * 60_000
    await assertSucceeds(
      set(ref(databaseFor('alice'), `${ROOM_PATH}/seats/0`), seatPayload('alice', {
        claimedAt: stale,
      })),
    )
    await assertSucceeds(
      set(ref(databaseFor('alice'), `${ROOM_PATH}/participants/alice`), participantPayload('alice', 0, {
        joinedAt: stale,
        lastSeenAt: stale,
      })),
    )

    await assertSucceeds(
      update(ref(databaseFor('alice'), `${ROOM_PATH}/participants/alice`), {
        lastSeenAt: Date.now(),
      }),
    )
    await assertFails(remove(ref(databaseFor('bob'), `${ROOM_PATH}/participants/alice`)))
    await assertSucceeds(
      update(ref(databaseFor('alice'), `${ROOM_PATH}/participants/alice`), {
        lastSeenAt: stale,
      }),
    )
    await assertSucceeds(remove(ref(databaseFor('bob'), `${ROOM_PATH}/participants/alice`)))
    await assertSucceeds(remove(ref(databaseFor('bob'), `${ROOM_PATH}/seats/0`)))
  })

  it('rejects timestamps that are in the future', async () => {
    await createRoom('alice')
    const future = Date.now() + 5 * 60_000
    await assertFails(
      set(ref(databaseFor('alice'), `${ROOM_PATH}/seats/0`), seatPayload('alice', {
        claimedAt: future,
      })),
    )
    await assertSucceeds(
      set(ref(databaseFor('alice'), `${ROOM_PATH}/seats/0`), seatPayload('alice')),
    )
    await assertFails(
      set(ref(databaseFor('alice'), `${ROOM_PATH}/participants/alice`), participantPayload('alice', 0, {
        lastSeenAt: future,
      })),
    )
  })
})

describe('room lifecycle', () => {
  it('refuses to close an occupied room, then allows closing an empty one', async () => {
    await createRoom('alice')
    await joinRoom('alice', 0)

    await assertFails(
      update(ref(databaseFor('bob'), ROOM_PATH), {
        status: 'closed',
        closedAt: Date.now(),
      }),
    )

    await leaveRoom('alice', 0)
    await assertSucceeds(
      update(ref(databaseFor('bob'), ROOM_PATH), { status: 'closed', closedAt: Date.now() }),
    )
  })

  it('refuses joins after a room is closed', async () => {
    await createRoom('alice')
    await joinRoom('alice', 0)
    await leaveRoom('alice', 0)
    await assertSucceeds(
      update(ref(databaseFor('alice'), ROOM_PATH), { status: 'closed', closedAt: Date.now() }),
    )

    const bob = databaseFor('bob')
    await assertFails(set(ref(bob, `${ROOM_PATH}/seats/0`), seatPayload('bob')))
    await assertFails(
      set(ref(bob, `${ROOM_PATH}/participants/bob`), participantPayload('bob', 0)),
    )
  })

  it('allows an empty room to report stale activity while rejecting invalid fields', async () => {
    await createRoom('alice')
    const alice = databaseFor('alice')

    await assertFails(update(ref(alice, ROOM_PATH), { creatorId: 'bob' }))
    await assertFails(update(ref(alice, ROOM_PATH), { unknownField: true }))
    await assertFails(update(ref(alice, ROOM_PATH), { closedAt: Date.now() }))
  })
})
