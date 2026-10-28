import { useEffect, useRef, useState } from 'react'
import type { Room, RoomWithSeats } from '@/types/room'
import { roomBackend } from '@/services'
import { toRoomError } from '@/types/errors'
import { EMPTY_ROOM_TTL_MS, participantCount } from '@/config/rooms'

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    const unsubscribe = roomBackend.subscribeRooms(
      (nextRooms) => {
        if (!active) return
        setRooms(nextRooms)
        setLoading(false)
      },
      (subscriptionError) => {
        if (!active) return
        setError(toRoomError(subscriptionError).message)
        setLoading(false)
      },
    )
    return () => {
      active = false
      unsubscribe()
    }
  }, [reloadKey])

  useRoomReaper(rooms)

  return {
    rooms,
    loading,
    error,
    refresh: () => setReloadKey((key) => key + 1),
  }
}

export function useRoom(roomId: string | undefined) {
  const [room, setRoom] = useState<RoomWithSeats | null>(null)
  const [loading, setLoading] = useState(Boolean(roomId))
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!roomId) {
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    const unsubscribe = roomBackend.subscribeRoom(
      roomId,
      (nextRoom) => {
        if (!active) return
        setRoom(nextRoom)
        setLoading(false)
      },
      (subscriptionError) => {
        if (!active) return
        setError(toRoomError(subscriptionError).message)
        setLoading(false)
      },
    )
    return () => {
      active = false
      unsubscribe()
    }
  }, [roomId, reloadKey])

  useRoomReaper(room ? [room] : [])

  return {
    room,
    loading,
    error,
    refresh: () => setReloadKey((key) => key + 1),
  }
}

/**
 * Closes long-empty open rooms. Without trusted server code, cleanup is
 * eventual: a room abandoned through a disconnect is closed by the next
 * client that sees it after the grace period.
 */
export function useRoomReaper(rooms: Room[]) {
  const attempted = useRef(new Set<string>())

  useEffect(() => {
    const now = Date.now()
    for (const room of rooms) {
      if (
        room.status === 'open' &&
        room.createdAt > 0 &&
        participantCount(room) === 0 &&
        now - room.createdAt > EMPTY_ROOM_TTL_MS &&
        !attempted.current.has(room.id)
      ) {
        attempted.current.add(room.id)
        void roomBackend.pruneRoom(room.id).catch(() => {
          // Allow a later snapshot to retry after a transient failure.
          attempted.current.delete(room.id)
        })
      }
    }
  }, [rooms])
}
