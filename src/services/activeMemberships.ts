import type { RoomBackend } from '@/types/room'

interface MembershipKey {
  roomId: string
  uid: string
}

/**
 * Memberships held by this tab. Used to release seats on sign-out. Presence
 * (onDisconnect) is still the primary mechanism for unexpected disconnects.
 */
const memberships = new Map<string, MembershipKey>()

function keyOf(roomId: string, uid: string) {
  return `${roomId}:${uid}`
}

export function trackMembership(roomId: string, uid: string) {
  memberships.set(keyOf(roomId, uid), { roomId, uid })
}

export function untrackMembership(roomId: string, uid: string) {
  memberships.delete(keyOf(roomId, uid))
}

export async function releaseTrackedMemberships(backend: RoomBackend): Promise<void> {
  const entries = Array.from(memberships.values())
  memberships.clear()
  await Promise.allSettled(entries.map((entry) => backend.leaveRoom(entry.roomId, entry.uid)))
}

export function trackedMembershipCount() {
  return memberships.size
}
