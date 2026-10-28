import { RoomError } from '@/types/errors'
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
  EMPTY_ROOM_TTL_MS,
  MAX_ROOMS,
  ROOM_LIMITS,
  SEAT_CLAIM_TTL_MS,
  STALE_MEMBER_TTL_MS,
} from '@/config/rooms'
import { generateRoomId } from '@/utils/avatar'

type DemoRoom = Room & { seats: Record<string, SeatClaim> }

interface DemoStoreState {
  version: 1
  rooms: Record<string, DemoRoom>
}

const STORAGE_KEY = 'braincircle:demo:rooms:v1'
const CHANNEL_NAME = 'braincircle:demo:rooms'

export interface DemoRoomBackendOptions {
  persist?: boolean
  clock?: () => number
  /** Artificial latency for UI testing. Defaults to 0. */
  latencyMs?: number
}

function cloneRoom(room: DemoRoom): DemoRoom {
  return {
    ...room,
    participants: Object.fromEntries(
      Object.entries(room.participants ?? {}).map(([uid, participant]) => [uid, { ...participant }]),
    ),
    seats: Object.fromEntries(
      Object.entries(room.seats ?? {}).map(([key, seat]) => [key, { ...seat }]),
    ),
  }
}

function withoutSeats(room: DemoRoom): RoomWithSeats {
  const { seats, ...publicRoom } = room
  return {
    ...publicRoom,
    participants: Object.fromEntries(
      Object.entries(publicRoom.participants ?? {}).map(([uid, participant]) => [
        uid,
        { ...participant },
      ]),
    ),
    seats: Object.fromEntries(Object.entries(seats ?? {}).map(([key, seat]) => [key, { ...seat }])),
  }
}

function validStoredState(value: unknown): value is DemoStoreState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<DemoStoreState>
  return candidate.version === 1 && Boolean(candidate.rooms) && typeof candidate.rooms === 'object'
}

/**
 * Explicit, local-only backend used for development, automated tests, and the
 * opt-in demo experience. It intentionally lives behind the same interface as
 * the Firebase backend so production code paths stay honest.
 */
export class DemoRoomBackend implements RoomBackend {
  readonly mode = 'demo' as const

  private rooms = new Map<string, DemoRoom>()
  private roomListeners = new Map<string, Set<() => void>>()
  private listListeners = new Set<() => void>()
  private errors: Array<(error: Error) => void> = []
  private locks = new Map<string, Promise<void>>()
  private channel: BroadcastChannel | null = null
  private persist: boolean
  private clock: () => number
  private latencyMs: number

  constructor(options: DemoRoomBackendOptions = {}) {
    this.persist =
      options.persist ?? (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined')
    this.clock = options.clock ?? (() => Date.now())
    this.latencyMs = options.latencyMs ?? 0
    this.load()
    this.setupCrossTabSync()
  }

  private load() {
    if (!this.persist) return
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed: unknown = JSON.parse(raw)
      if (!validStoredState(parsed)) return
      for (const [id, room] of Object.entries(parsed.rooms)) {
        this.rooms.set(id, room)
      }
    } catch {
      // Corrupt demo state should never break the app; start clean instead.
      this.rooms.clear()
    }
  }

  private save() {
    if (!this.persist) return
    try {
      const state: DemoStoreState = {
        version: 1,
        rooms: Object.fromEntries(
          Array.from(this.rooms.entries()).map(([id, room]) => [id, cloneRoom(room)]),
        ),
      }
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state))
      this.channel?.postMessage({ type: 'sync' })
    } catch {
      // Storage can be full or disabled. The in-memory store still works.
    }
  }

  private setupCrossTabSync() {
    if (typeof BroadcastChannel === 'undefined') return
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME)
      this.channel.onmessage = (event) => {
        if (event.data?.type !== 'sync') return
        this.rooms.clear()
        this.load()
        this.emitAll()
      }
    } catch {
      this.channel = null
    }
  }

  private async wait() {
    if (this.latencyMs <= 0) return
    await new Promise((resolve) => setTimeout(resolve, this.latencyMs))
  }

  private async withLock<T>(roomId: string, operation: () => T | Promise<T>): Promise<T> {
    const previous = this.locks.get(roomId) ?? Promise.resolve()
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    this.locks.set(roomId, previous.then(() => gate))
    await previous
    try {
      await this.wait()
      return await operation()
    } finally {
      release()
    }
  }

  private emitRoom(roomId: string) {
    this.roomListeners.get(roomId)?.forEach((listener) => listener())
    this.listListeners.forEach((listener) => listener())
  }

  private emitAll() {
    this.roomListeners.forEach((listeners) => listeners.forEach((listener) => listener()))
    this.listListeners.forEach((listener) => listener())
  }

  private notifyError(error: Error) {
    this.errors.forEach((listener) => listener(error))
  }

  private pruneInMemory(room: DemoRoom) {
    const now = this.clock()
    for (const [uid, participant] of Object.entries(room.participants)) {
      if (now - participant.lastSeenAt > STALE_MEMBER_TTL_MS) {
        delete room.participants[uid]
        for (const [key, seat] of Object.entries(room.seats)) {
          if (seat.uid === uid) delete room.seats[key]
        }
      }
    }
    for (const [key, seat] of Object.entries(room.seats)) {
      if (!room.participants[seat.uid] && now - seat.claimedAt > SEAT_CLAIM_TTL_MS) {
        delete room.seats[key]
      }
    }
  }

  private publicRoom(room: DemoRoom): RoomWithSeats {
    return withoutSeats(room)
  }

  private requireRoom(roomId: string): DemoRoom {
    const room = this.rooms.get(roomId)
    if (!room) throw new RoomError('not-found')
    return room
  }

  private sortedRooms(): Room[] {
    return Array.from(this.rooms.values())
      .sort((first, second) => second.createdAt - first.createdAt)
      .slice(0, MAX_ROOMS)
      .map((room) => withoutSeats(room))
  }

  subscribeRooms(listener: (rooms: Room[]) => void, onError: (error: Error) => void) {
    const notify = () => listener(this.sortedRooms())
    this.listListeners.add(notify)
    this.errors.push(onError)
    notify()
    return () => {
      this.listListeners.delete(notify)
      this.errors = this.errors.filter((entry) => entry !== onError)
    }
  }

  subscribeRoom(
    roomId: string,
    listener: (room: RoomWithSeats | null) => void,
    onError: (error: Error) => void,
  ) {
    const notify = () => {
      const room = this.rooms.get(roomId)
      listener(room ? this.publicRoom(room) : null)
    }
    const listeners = this.roomListeners.get(roomId) ?? new Set()
    listeners.add(notify)
    this.roomListeners.set(roomId, listeners)
    this.errors.push(onError)
    notify()
    return () => {
      listeners.delete(notify)
      if (listeners.size === 0) this.roomListeners.delete(roomId)
      this.errors = this.errors.filter((entry) => entry !== onError)
    }
  }

  async getRoom(roomId: string): Promise<RoomWithSeats | null> {
    const room = this.rooms.get(roomId)
    return room ? this.publicRoom(room) : null
  }

  subscribeConnection(listener: (online: boolean) => void) {
    listener(typeof navigator === 'undefined' ? true : navigator.onLine !== false)
    const update = () => listener(navigator.onLine !== false)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }

  async createRoom(input: CreateRoomInput, user: { uid: string; displayName: string }) {
    if (!user.uid) throw new RoomError('unauthenticated')
    const name = input.name.trim()
    const subject = input.subject.trim()
    const description = input.description.trim()
    if (
      name.length < ROOM_LIMITS.minNameLength ||
      name.length > ROOM_LIMITS.maxNameLength ||
      subject.length < ROOM_LIMITS.minSubjectLength ||
      subject.length > ROOM_LIMITS.maxSubjectLength ||
      description.length > ROOM_LIMITS.maxDescriptionLength ||
      !Number.isInteger(input.maxCapacity) ||
      input.maxCapacity < ROOM_LIMITS.minCapacity ||
      input.maxCapacity > ROOM_LIMITS.maxCapacity
    ) {
      throw new RoomError('invalid-input')
    }

    const id = generateRoomId()
    const now = this.clock()
    const room: DemoRoom = {
      id,
      name,
      subject,
      description,
      creatorId: user.uid,
      creatorName: user.displayName,
      maxCapacity: input.maxCapacity,
      status: 'open',
      createdAt: now,
      durationMinutes: input.durationMinutes,
      expiresAt: input.durationMinutes ? now + input.durationMinutes * 60 * 1000 : undefined,
      participants: {},
      seats: {},
    }
    this.rooms.set(id, room)
    this.save()
    this.emitRoom(id)

    // Keep parity with the Firebase backend: the creator takes the first seat.
    try {
      await this.joinRoom(id, user)
    } catch (error) {
      await this.closeIfEmpty(id).catch(() => undefined)
      throw error
    }
    return id
  }

  async joinRoom(roomId: string, user: { uid: string; displayName: string }): Promise<JoinResult> {
    if (!user.uid) throw new RoomError('unauthenticated')
    return this.withLock(roomId, () => {
      const room = this.requireRoom(roomId)
      this.pruneInMemory(room)
      if (room.status !== 'open') {
        throw new RoomError('closed')
      }
      const existing = room.participants[user.uid]
      if (existing) {
        existing.lastSeenAt = this.clock()
        existing.displayName = user.displayName
        this.save()
        this.emitRoom(roomId)
        return { status: 'already-member', seat: existing.seat }
      }
      const count = Object.keys(room.participants).length
      if (count >= room.maxCapacity) throw new RoomError('full')

      let seatKey: string | null = null
      for (let index = 0; index < room.maxCapacity; index += 1) {
        const key = String(index)
        if (!room.seats[key]) {
          seatKey = key
          break
        }
      }
      if (!seatKey) throw new RoomError('full')

      const seat = Number(seatKey)
      const now = this.clock()
      room.seats[seatKey] = { uid: user.uid, claimedAt: now }
      room.participants[user.uid] = {
        uid: user.uid,
        displayName: user.displayName,
        joinedAt: now,
        lastSeenAt: now,
        seat,
        seatKey,
      }
      this.save()
      this.emitRoom(roomId)
      return { status: 'joined', seat }
    })
  }

  async leaveRoom(roomId: string, uid: string): Promise<void> {
    await this.withLock(roomId, () => {
      const room = this.rooms.get(roomId)
      if (!room) return
      delete room.participants[uid]
      for (const [key, seat] of Object.entries(room.seats)) {
        if (seat.uid === uid) delete room.seats[key]
      }
      if (Object.keys(room.participants).length === 0 && room.status === 'open') {
        room.status = 'closed'
        room.closedAt = this.clock()
      }
      this.save()
      this.emitRoom(roomId)
    })
  }

  async touchMembership(roomId: string, uid: string): Promise<void> {
    await this.withLock(roomId, () => {
      const room = this.rooms.get(roomId)
      const participant = room?.participants[uid]
      if (!room || !participant || room.status !== 'open') return
      participant.lastSeenAt = this.clock()
      this.save()
      this.emitRoom(roomId)
    })
  }

  async closeIfEmpty(roomId: string): Promise<void> {
    await this.withLock(roomId, () => {
      const room = this.rooms.get(roomId)
      if (!room || room.status !== 'open') return
      if (Object.keys(room.participants).length > 0) return
      room.status = 'closed'
      room.closedAt = this.clock()
      this.save()
      this.emitRoom(roomId)
    })
  }

  async pruneRoom(roomId: string): Promise<void> {
    await this.withLock(roomId, () => {
      const room = this.rooms.get(roomId)
      if (!room) return
      const before = JSON.stringify({ participants: room.participants, seats: room.seats })
      this.pruneInMemory(room)
      let changed = before !== JSON.stringify({ participants: room.participants, seats: room.seats })
      if (
        room.status === 'open' &&
        Object.keys(room.participants).length === 0 &&
        this.clock() - room.createdAt > EMPTY_ROOM_TTL_MS
      ) {
        room.status = 'closed'
        room.closedAt = this.clock()
        changed = true
      }
      if (changed) {
        this.save()
        this.emitRoom(roomId)
      }
    })
  }

  private messages = new Map<string, RoomMessage[]>()
  private notes = new Map<string, RoomNotes>()
  private messageListeners = new Map<string, Set<() => void>>()
  private notesListeners = new Map<string, Set<() => void>>()

  async sendMessage(roomId: string, message: { text: string; uid: string; displayName: string }): Promise<void> {
    let list = this.messages.get(roomId)
    if (!list) {
      list = []
      this.messages.set(roomId, list)
    }
    const newMsg: RoomMessage = {
      id: generateRoomId(),
      uid: message.uid,
      displayName: message.displayName,
      text: message.text.trim(),
      timestamp: this.clock(),
    }
    list.push(newMsg)
    this.messageListeners.get(roomId)?.forEach((l) => l())
  }

  subscribeMessages(roomId: string, listener: (messages: RoomMessage[]) => void): () => void {
    const emit = () => listener([...(this.messages.get(roomId) ?? [])])
    emit()
    let set = this.messageListeners.get(roomId)
    if (!set) {
      set = new Set()
      this.messageListeners.set(roomId, set)
    }
    set.add(emit)
    return () => {
      set?.delete(emit)
    }
  }

  async saveNotes(roomId: string, content: string, user: { uid: string; displayName: string }): Promise<void> {
    const note: RoomNotes = {
      content,
      updatedAt: this.clock(),
      updatedBy: user.displayName,
    }
    this.notes.set(roomId, note)
    this.notesListeners.get(roomId)?.forEach((l) => l())
  }

  subscribeNotes(roomId: string, listener: (notes: RoomNotes | null) => void): () => void {
    const emit = () => listener(this.notes.get(roomId) ?? null)
    emit()
    let set = this.notesListeners.get(roomId)
    if (!set) {
      set = new Set()
      this.notesListeners.set(roomId, set)
    }
    set.add(emit)
    return () => {
      set?.delete(emit)
    }
  }

  async setGoal(roomId: string, uid: string, goal: string): Promise<void> {
    const room = this.rooms.get(roomId)
    if (room && room.participants[uid]) {
      room.participants[uid].goal = goal.trim()
      this.save()
      this.emitRoom(roomId)
    }
  }

  /** Test helper: force an error path without touching private state. */
  emitErrorForTests(message = 'Demo backend error') {
    this.notifyError(new Error(message))
  }
}

export function createDemoRoomBackend(options?: DemoRoomBackendOptions) {
  return new DemoRoomBackend(options)
}
