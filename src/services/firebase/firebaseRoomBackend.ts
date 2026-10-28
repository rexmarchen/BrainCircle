import { getFirebaseAuth, getFirebaseDatabase } from '@/firebase/client'
import { participantCount } from '@/config/rooms'
import {
  EMPTY_ROOM_TTL_MS,
  MAX_ROOMS,
  SEAT_CLAIM_TTL_MS,
  STALE_MEMBER_TTL_MS,
} from '@/config/rooms'
import { RoomError, toRoomError } from '@/types/errors'
import type {
  CreateRoomInput,
  JoinResult,
  Room,
  RoomBackend,
  RoomMessage,
  RoomNotes,
  RoomWithSeats,
  SeatClaim,
} from '@/types/room'
import {
  get,
  limitToLast,
  onDisconnect,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  remove,
  runTransaction,
  serverTimestamp,
  set,
  update,
  type OnDisconnect,
  type TransactionResult,
  type Unsubscribe as FirebaseUnsubscribe,
} from 'firebase/database'

interface RawParticipant {
  uid?: string
  displayName?: string
  joinedAt?: number
  lastSeenAt?: number
  seat?: number
  seatKey?: string
  goal?: string
}

interface RawSeat {
  uid?: string
  claimedAt?: number
}

interface RawRoom {
  name?: string
  subject?: string
  description?: string
  creatorId?: string
  creatorName?: string
  maxCapacity?: number
  status?: 'open' | 'closed'
  createdAt?: number
  closedAt?: number
  durationMinutes?: number
  expiresAt?: number
  participants?: Record<string, RawParticipant> | null
  seats?: Record<string, RawSeat> | null
}

function normalizeRoom(id: string, raw: RawRoom): RoomWithSeats {
  const participants: Room['participants'] = {}
  for (const [uid, record] of Object.entries(raw.participants ?? {})) {
    if (!record) continue
    participants[uid] = {
      uid,
      displayName: record.displayName ?? 'Student',
      joinedAt: Number(record.joinedAt ?? 0),
      lastSeenAt: Number(record.lastSeenAt ?? record.joinedAt ?? 0),
      seat: Number(record.seat ?? 0),
      seatKey: record.seatKey ?? String(record.seat ?? 0),
      goal: typeof record.goal === 'string' ? record.goal : undefined,
    }
  }

  const seats: Record<string, SeatClaim> = {}
  for (const [key, record] of Object.entries(raw.seats ?? {})) {
    if (!record?.uid) continue
    seats[key] = { uid: record.uid, claimedAt: Number(record.claimedAt ?? 0) }
  }

  return {
    id,
    name: raw.name ?? 'Untitled study room',
    subject: raw.subject ?? 'General',
    description: raw.description ?? '',
    creatorId: raw.creatorId ?? '',
    creatorName: raw.creatorName ?? 'Student',
    maxCapacity: Number(raw.maxCapacity ?? 2),
    status: raw.status === 'closed' ? 'closed' : 'open',
    createdAt: Number(raw.createdAt ?? 0),
    closedAt: typeof raw.closedAt === 'number' ? raw.closedAt : undefined,
    durationMinutes: typeof raw.durationMinutes === 'number' ? raw.durationMinutes : undefined,
    expiresAt: typeof raw.expiresAt === 'number' ? raw.expiresAt : undefined,
    participants,
    seats,
  }
}

class FirebaseRoomBackend implements RoomBackend {
  readonly mode = 'firebase' as const

  private presence = new Map<string, { participant: OnDisconnect; seat: OnDisconnect }>()

  private db() {
    return getFirebaseDatabase()
  }

  private participantRef(roomId: string, uid: string) {
    return ref(this.db(), `rooms/${roomId}/participants/${uid}`)
  }

  private seatRef(roomId: string, seatKey: string) {
    return ref(this.db(), `rooms/${roomId}/seats/${seatKey}`)
  }

  subscribeRooms(listener: (rooms: Room[]) => void, onError: (error: Error) => void): FirebaseUnsubscribe {
    try {
      const roomsQuery = query(
        ref(this.db(), 'rooms'),
        orderByChild('createdAt'),
        limitToLast(MAX_ROOMS),
      )
      return onValue(
        roomsQuery,
        (snapshot) => {
          const value = snapshot.val() as Record<string, RawRoom> | null
          if (!value) {
            listener([])
            return
          }
          const rooms = Object.entries(value)
            .map(([id, raw]) => normalizeRoom(id, raw ?? {}))
            .sort((first, second) => second.createdAt - first.createdAt)
          listener(rooms)
        },
        (error) => onError(toRoomError(error)),
      )
    } catch (error) {
      onError(toRoomError(error))
      return () => undefined
    }
  }

  subscribeRoom(
    roomId: string,
    listener: (room: RoomWithSeats | null) => void,
    onError: (error: Error) => void,
  ): FirebaseUnsubscribe {
    try {
      return onValue(
        ref(this.db(), `rooms/${roomId}`),
        (snapshot) => {
          listener(snapshot.exists() ? normalizeRoom(roomId, snapshot.val() as RawRoom) : null)
        },
        (error) => onError(toRoomError(error)),
      )
    } catch (error) {
      onError(toRoomError(error))
      return () => undefined
    }
  }

  subscribeConnection(listener: (online: boolean) => void): FirebaseUnsubscribe {
    try {
      return onValue(
        ref(this.db(), '.info/connected'),
        (snapshot) => listener(snapshot.val() === true),
        () => listener(false),
      )
    } catch {
      listener(false)
      return () => undefined
    }
  }

  async getRoom(roomId: string): Promise<RoomWithSeats | null> {
    try {
      const snapshot = await get(ref(this.db(), `rooms/${roomId}`))
      return snapshot.exists() ? normalizeRoom(roomId, snapshot.val() as RawRoom) : null
    } catch (error) {
      throw toRoomError(error)
    }
  }

  async createRoom(input: CreateRoomInput, user: { uid: string; displayName: string }) {
    const authUser = getFirebaseAuth().currentUser
    if (!authUser || authUser.uid !== user.uid) throw new RoomError('unauthenticated')
    try {
      const roomRef = push(ref(this.db(), 'rooms'))
      const roomId = roomRef.key
      if (!roomId) throw new RoomError('unknown', 'Could not allocate a room id.')
      const roomPayload: Record<string, unknown> = {
        name: input.name.trim(),
        subject: input.subject.trim(),
        description: input.description.trim(),
        creatorId: user.uid,
        creatorName: user.displayName,
        maxCapacity: input.maxCapacity,
        status: 'open',
        createdAt: serverTimestamp(),
      }
      if (typeof input.durationMinutes === 'number' && input.durationMinutes > 0) {
        roomPayload.durationMinutes = input.durationMinutes
        roomPayload.expiresAt = Date.now() + input.durationMinutes * 60 * 1000
      }
      await set(roomRef, roomPayload)
      try {
        await this.joinRoom(roomId, user)
      } catch (error) {
        // The room exists but the host could not take the first seat. Close the
        // empty room so it never shows up as joinable.
        await this.closeIfEmpty(roomId).catch(() => undefined)
        throw error
      }
      return roomId
    } catch (error) {
      throw toRoomError(error)
    }
  }

  async joinRoom(roomId: string, user: { uid: string; displayName: string }): Promise<JoinResult> {
    const authUser = getFirebaseAuth().currentUser
    if (!authUser || authUser.uid !== user.uid) throw new RoomError('unauthenticated')

    let room = await this.getRoom(roomId)
    if (!room) throw new RoomError('not-found')
    if (room.status !== 'open') throw new RoomError('closed')

    const existing = room.participants[user.uid]
    if (existing) {
      const seatKey = existing.seatKey ?? String(existing.seat)
      await this.touchMembership(roomId, user.uid).catch(() => undefined)
      await this.registerPresence(roomId, user.uid, seatKey)
      return { status: 'already-member', seat: existing.seat }
    }

    if (this.freeSeatIndexes(room).length === 0) {
      await this.pruneRoom(roomId)
      room = await this.getRoom(roomId)
      if (!room) throw new RoomError('not-found')
      if (room.status !== 'open') throw new RoomError('closed')
      const raced = room.participants[user.uid]
      if (raced) {
        const seatKey = raced.seatKey ?? String(raced.seat)
        await this.registerPresence(roomId, user.uid, seatKey)
        return { status: 'already-member', seat: raced.seat }
      }
      if (participantCount(room) >= room.maxCapacity) throw new RoomError('full')
    }

    const seat = await this.claimSeat(roomId, room)
    if (seat === null) throw new RoomError('full')
    const seatKey = String(seat)

    try {
      await set(this.participantRef(roomId, user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        joinedAt: serverTimestamp(),
        lastSeenAt: Date.now(),
        seat,
        seatKey,
      })
    } catch (error) {
      await remove(this.seatRef(roomId, seatKey)).catch(() => undefined)
      const latest = await this.getRoom(roomId).catch(() => null)
      if (!latest) throw new RoomError('not-found')
      if (latest.status !== 'open') throw new RoomError('closed')
      if (latest.participants[user.uid]) {
        return { status: 'already-member', seat: latest.participants[user.uid].seat }
      }
      if (participantCount(latest) >= latest.maxCapacity) throw new RoomError('full')
      throw toRoomError(error)
    }

    await this.registerPresence(roomId, user.uid, seatKey)
    return { status: 'joined', seat }
  }

  private freeSeatIndexes(room: RoomWithSeats): number[] {
    const indexes: number[] = []
    for (let index = 0; index < room.maxCapacity; index += 1) {
      if (!room.seats?.[String(index)]) indexes.push(index)
    }
    return indexes
  }

  private async claimSeat(roomId: string, room: RoomWithSeats): Promise<number | null> {
    const uid = getFirebaseAuth().currentUser?.uid
    if (!uid) throw new RoomError('unauthenticated')

    // Reuse a seat this user already owns (e.g. a previous participant write failed).
    for (const [key, seat] of Object.entries(room.seats ?? {})) {
      if (seat.uid === uid) return Number(key)
    }

    for (const index of this.freeSeatIndexes(room)) {
      const seatRef = this.seatRef(roomId, String(index))
      try {
        const result: TransactionResult = await runTransaction(
          seatRef,
          (current: RawSeat | null): RawSeat | null | undefined => {
            if (current === null) return { uid, claimedAt: Date.now() }
            return undefined
          },
          { applyLocally: false },
        )
        if (result.committed && (result.snapshot.val() as RawSeat | null)?.uid === uid) {
          return index
        }
      } catch (error) {
        const mapped = toRoomError(error)
        if (mapped.code !== 'permission-denied') throw mapped
        // The seat was taken by a concurrent join or the room closed; try the next one.
      }
    }
    return null
  }

  async leaveRoom(roomId: string, uid: string): Promise<void> {
    const authUser = getFirebaseAuth().currentUser
    if (!authUser || authUser.uid !== uid) throw new RoomError('unauthenticated')

    await this.cancelPresence(roomId, uid)

    try {
      const room = await this.getRoom(roomId)
      const participant = room?.participants[uid]
      await remove(this.participantRef(roomId, uid)).catch((error) => {
        if (toRoomError(error).code === 'permission-denied') throw error
      })
      if (participant) {
        await remove(this.seatRef(roomId, participant.seatKey ?? String(participant.seat))).catch(
          () => undefined,
        )
      }
      await this.closeIfEmpty(roomId)
    } catch (error) {
      throw toRoomError(error)
    }
  }

  async touchMembership(roomId: string, uid: string): Promise<void> {
    const authUser = getFirebaseAuth().currentUser
    if (!authUser || authUser.uid !== uid) return
    try {
      await update(this.participantRef(roomId, uid), { lastSeenAt: Date.now() })
    } catch (error) {
      throw toRoomError(error)
    }
  }

  async closeIfEmpty(roomId: string): Promise<void> {
    const room = await this.getRoom(roomId)
    if (!room || room.status !== 'open') return
    if (participantCount(room) > 0) return
    try {
      await update(ref(this.db(), `rooms/${roomId}`), {
        status: 'closed',
        closedAt: serverTimestamp(),
      })
    } catch (error) {
      throw toRoomError(error)
    }
  }

  async pruneRoom(roomId: string): Promise<void> {
    const room = await this.getRoom(roomId)
    if (!room) return
    const now = Date.now()
    const operations: Array<Promise<unknown>> = []

    for (const participant of Object.values(room.participants)) {
      if (now - participant.lastSeenAt > STALE_MEMBER_TTL_MS) {
        operations.push(remove(this.participantRef(roomId, participant.uid)))
        operations.push(
          remove(this.seatRef(roomId, participant.seatKey ?? String(participant.seat))),
        )
      }
    }

    for (const [key, seat] of Object.entries(room.seats ?? {})) {
      const participant = room.participants[seat.uid]
      if (!participant && now - seat.claimedAt > SEAT_CLAIM_TTL_MS) {
        operations.push(remove(this.seatRef(roomId, key)))
      }
    }

    await Promise.allSettled(operations)

    const latest = await this.getRoom(roomId).catch(() => null)
    if (
      latest &&
      latest.status === 'open' &&
      participantCount(latest) === 0 &&
      now - latest.createdAt > EMPTY_ROOM_TTL_MS
    ) {
      await this.closeIfEmpty(roomId)
    }
  }

  private async registerPresence(roomId: string, uid: string, seatKey: string) {
    const key = `${roomId}:${uid}`
    await this.cancelPresence(roomId, uid)
    try {
      const participantOnDisconnect = onDisconnect(this.participantRef(roomId, uid))
      const seatOnDisconnect = onDisconnect(this.seatRef(roomId, seatKey))
      await Promise.all([
        participantOnDisconnect.remove(),
        seatOnDisconnect.remove(),
      ])
      this.presence.set(key, {
        participant: participantOnDisconnect,
        seat: seatOnDisconnect,
      })
    } catch {
      // Presence registration is best effort; the stale-member sweep is the backup.
    }
  }

  async sendMessage(roomId: string, message: { text: string; uid: string; displayName: string }): Promise<void> {
    const messagesRef = ref(this.db(), `room_messages/${roomId}`)
    const newMsgRef = push(messagesRef)
    await set(newMsgRef, {
      uid: message.uid,
      displayName: message.displayName,
      text: message.text.trim(),
      timestamp: Date.now(),
    })
  }

  subscribeMessages(roomId: string, listener: (messages: RoomMessage[]) => void): () => void {
    const messagesQuery = query(
      ref(this.db(), `room_messages/${roomId}`),
      orderByChild('timestamp'),
      limitToLast(100),
    )
    return onValue(messagesQuery, (snapshot) => {
      const data = snapshot.val() as Record<string, { uid?: string; displayName?: string; text?: string; timestamp?: number }> | null
      if (!data) {
        listener([])
        return
      }
      const messages: RoomMessage[] = Object.entries(data)
        .map(([id, item]) => ({
          id,
          uid: item.uid ?? '',
          displayName: item.displayName ?? 'Student',
          text: item.text ?? '',
          timestamp: Number(item.timestamp ?? 0),
        }))
        .sort((a, b) => a.timestamp - b.timestamp)
      listener(messages)
    })
  }

  async saveNotes(roomId: string, content: string, user: { uid: string; displayName: string }): Promise<void> {
    const notesRef = ref(this.db(), `room_notes/${roomId}`)
    await set(notesRef, {
      content,
      updatedAt: Date.now(),
      updatedBy: user.displayName,
    })
  }

  subscribeNotes(roomId: string, listener: (notes: RoomNotes | null) => void): () => void {
    const notesRef = ref(this.db(), `room_notes/${roomId}`)
    return onValue(notesRef, (snapshot) => {
      const data = snapshot.val() as { content?: string; updatedAt?: number; updatedBy?: string } | null
      if (!data) {
        listener(null)
        return
      }
      listener({
        content: data.content ?? '',
        updatedAt: Number(data.updatedAt ?? 0),
        updatedBy: data.updatedBy ?? 'Student',
      })
    })
  }

  async setGoal(roomId: string, uid: string, goal: string): Promise<void> {
    const participantRef = this.participantRef(roomId, uid)
    await update(participantRef, { goal: goal.trim() })
  }

  private async cancelPresence(roomId: string, uid: string) {
    const key = `${roomId}:${uid}`
    const entry = this.presence.get(key)
    if (!entry) return
    this.presence.delete(key)
    await Promise.allSettled([entry.participant.cancel(), entry.seat.cancel()])
  }
}

export function createFirebaseRoomBackend(): RoomBackend {
  return new FirebaseRoomBackend()
}
