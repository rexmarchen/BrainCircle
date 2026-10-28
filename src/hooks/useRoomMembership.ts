import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { HEARTBEAT_INTERVAL_MS, isParticipant } from '@/config/rooms'
import { roomBackend } from '@/services'
import { trackMembership, untrackMembership } from '@/services/activeMemberships'
import type { AuthUser } from '@/types/auth'
import { toRoomError } from '@/types/errors'
import type { Room } from '@/types/room'

function seatStorageKey(roomId: string, uid: string) {
  return `braincircle:seat:${roomId}:${uid}`
}

function rememberSeat(roomId: string, uid: string) {
  try {
    sessionStorage.setItem(seatStorageKey(roomId, uid), '1')
  } catch {
    // ignore
  }
}

function forgetSeat(roomId: string, uid: string) {
  try {
    sessionStorage.removeItem(seatStorageKey(roomId, uid))
  } catch {
    // ignore
  }
}

function hadSeat(roomId: string, uid: string) {
  try {
    return sessionStorage.getItem(seatStorageKey(roomId, uid)) === '1'
  } catch {
    return false
  }
}

export function useRoomMembership({
  room,
  user,
  online,
}: {
  room: Room | null
  user: AuthUser | null
  online: boolean
}) {
  const toast = useToast()
  const [pending, setPending] = useState<'join' | 'leave' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const inFlight = useRef(false)
  const intent = useRef(false)
  const presenceRegistered = useRef<string | null>(null)
  const restoreAttempted = useRef(false)
  const wasOnline = useRef(online)

  const isMember = isParticipant(room, user?.uid)
  const roomId = room?.id
  const uid = user?.uid

  useEffect(() => {
    if (!isMember || !uid || !roomId) return
    intent.current = true
    trackMembership(roomId, uid)
    rememberSeat(roomId, uid)
  }, [isMember, uid, roomId])

  const join = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!user || !room || inFlight.current) return false
      inFlight.current = true
      setPending('join')
      setActionError(null)
      try {
        const result = await roomBackend.joinRoom(room.id, {
          uid: user.uid,
          displayName: user.displayName,
        })
        intent.current = true
        trackMembership(room.id, user.uid)
        rememberSeat(room.id, user.uid)
        presenceRegistered.current = `${room.id}:${user.uid}`
        if (!options.silent) {
          toast.success(
            result.status === 'joined' ? "You're in" : 'Already a member',
            result.status === 'joined'
              ? `Your seat in ${room.name} is ready.`
              : 'You already have a seat in this room.',
          )
        }
        return true
      } catch (error) {
        const roomError = toRoomError(error)
        setActionError(roomError.message)
        if (options.silent) {
          toast.error('Could not restore your seat', roomError.message)
          forgetSeat(room.id, user.uid)
          intent.current = false
        } else {
          toast.error('Could not join this room', roomError.message)
        }
        return false
      } finally {
        inFlight.current = false
        setPending(null)
      }
    },
    [room, toast, user],
  )

  const leave = useCallback(async () => {
    if (!user || !room || inFlight.current) return false
    inFlight.current = true
    setPending('leave')
    setActionError(null)
    try {
      await roomBackend.leaveRoom(room.id, user.uid)
      intent.current = false
      presenceRegistered.current = null
      untrackMembership(room.id, user.uid)
      forgetSeat(room.id, user.uid)
      toast.success('You left the room', 'Your seat is open for someone else.')
      return true
    } catch (error) {
      const roomError = toRoomError(error)
      setActionError(roomError.message)
      toast.error('Could not leave the room', roomError.message)
      return false
    } finally {
      inFlight.current = false
      setPending(null)
    }
  }, [room, toast, user])

  // Keep onDisconnect registered after a refresh or when arriving as a member.
  useEffect(() => {
    if (!isMember || !online || !user || !room) return
    const key = `${room.id}:${user.uid}`
    if (presenceRegistered.current === key) return
    presenceRegistered.current = key
    void roomBackend
      .joinRoom(room.id, { uid: user.uid, displayName: user.displayName })
      .catch(() => undefined)
  }, [isMember, online, room, user])

  // Heartbeat so crashed tabs can be swept without occupying capacity forever.
  // Depend on the ids, not the room/user objects: every room snapshot creates a
  // new object, and restarting the timer on each snapshot could starve it.
  useEffect(() => {
    if (!isMember || !uid || !roomId || !online) return
    const timer = setInterval(() => {
      void roomBackend.touchMembership(roomId, uid).catch(() => undefined)
    }, HEARTBEAT_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [isMember, online, roomId, uid])

  // Rejoin automatically after a network drop released the seat.
  useEffect(() => {
    const wasOffline = !wasOnline.current
    wasOnline.current = online
    if (!online || !wasOffline) return
    if (!intent.current || isMember || !room || room.status !== 'open' || !user) return
    void join({ silent: true }).then((joined) => {
      if (joined) {
        toast.success('Reconnected', `You're back in ${room.name}.`)
      }
    })
  }, [online, isMember, join, room, toast, user])

  // Restore a seat after a page refresh in the same tab.
  useEffect(() => {
    if (restoreAttempted.current || !user || !room || !online) return
    if (isMember) {
      restoreAttempted.current = true
      return
    }
    if (room.status !== 'open' || !hadSeat(room.id, user.uid)) return
    restoreAttempted.current = true
    void join({ silent: true }).then((joined) => {
      if (joined) {
        toast.success('Welcome back', `We saved your seat in ${room.name}.`)
      }
    })
  }, [isMember, join, online, room, toast, user])

  return {
    isMember,
    pending,
    actionError,
    join,
    leave,
    clearActionError: () => setActionError(null),
  }
}
