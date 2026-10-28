export type RoomStatus = 'open' | 'closed'

/** A member of a live study room. Stored at `rooms/{roomId}/participants/{uid}`. */
export interface RoomParticipant {
  uid: string
  displayName: string
  /** Server timestamp (ms). */
  joinedAt: number
  /** Client heartbeat timestamp (ms), used for stale-member cleanup. */
  lastSeenAt: number
  /** Seat number shown in the UI. */
  seat: number
  /** String form of the seat index used by security rules to look up the seat claim. */
  seatKey: string
}

/** A capacity token at `rooms/{roomId}/seats/{seatIndex}`. */
export interface SeatClaim {
  uid: string
  /** Claim time (ms). A claim without a participant is reclaimable after a short TTL. */
  claimedAt: number
}

export interface Room {
  id: string
  name: string
  subject: string
  description: string
  creatorId: string
  creatorName: string
  maxCapacity: number
  status: RoomStatus
  createdAt: number
  closedAt?: number
  participants: Record<string, RoomParticipant>
}

export interface CreateRoomInput {
  name: string
  subject: string
  description: string
  maxCapacity: number
}

export type JoinResult = {
  status: 'joined' | 'already-member'
  seat: number
}

export type BackendMode = 'firebase' | 'demo'

/** Snapshot used by the UI; `seats` is only present in internal reads. */
export interface RoomWithSeats extends Room {
  seats?: Record<string, SeatClaim>
}

export interface RoomBackend {
  readonly mode: BackendMode
  subscribeRooms(
    listener: (rooms: Room[]) => void,
    onError: (error: Error) => void,
  ): () => void
  subscribeRoom(
    roomId: string,
    listener: (room: RoomWithSeats | null) => void,
    onError: (error: Error) => void,
  ): () => void
  /** Reads a room once. Returns null when the room does not exist. */
  getRoom(roomId: string): Promise<RoomWithSeats | null>
  createRoom(input: CreateRoomInput, user: { uid: string; displayName: string }): Promise<string>
  joinRoom(roomId: string, user: { uid: string; displayName: string }): Promise<JoinResult>
  leaveRoom(roomId: string, uid: string): Promise<void>
  /** Refreshes the presence heartbeat for an existing member. */
  touchMembership(roomId: string, uid: string): Promise<void>
  /** Closes an open room when it has no participants. Safe to call repeatedly. */
  closeIfEmpty(roomId: string): Promise<void>
  /** Releases stale seats, stale members, and closes long-empty rooms. */
  pruneRoom(roomId: string): Promise<void>
  subscribeConnection(listener: (online: boolean) => void): () => void
}
