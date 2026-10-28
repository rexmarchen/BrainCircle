export type RoomErrorCode =
  | 'not-found'
  | 'closed'
  | 'full'
  | 'already-member'
  | 'unauthenticated'
  | 'permission-denied'
  | 'network'
  | 'invalid-input'
  | 'unknown'

export class RoomError extends Error {
  readonly code: RoomErrorCode

  constructor(code: RoomErrorCode, message?: string) {
    super(message ?? defaultRoomErrorMessage(code))
    this.name = 'RoomError'
    this.code = code
  }
}

export function defaultRoomErrorMessage(code: RoomErrorCode): string {
  switch (code) {
    case 'not-found':
      return 'This study room no longer exists. It may have been closed by its host.'
    case 'closed':
      return 'This study room is closed and is no longer accepting members.'
    case 'full':
      return 'This study room just filled up. Try another circle or create your own.'
    case 'already-member':
      return 'You are already a member of this study room.'
    case 'unauthenticated':
      return 'Please sign in to join a study room.'
    case 'permission-denied':
      return 'You do not have permission to do that.'
    case 'network':
      return 'We could not reach the server. Check your connection and try again.'
    case 'invalid-input':
      return 'Some of the information provided is not valid.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

const FIREBASE_CODE_MAP: Record<string, RoomErrorCode> = {
  'permission-denied': 'permission-denied',
  'PERMISSION_DENIED': 'permission-denied',
  'network-request-failed': 'network',
  'app/network-error': 'network',
  'database/unavailable': 'network',
  'unauthenticated': 'unauthenticated',
  'auth/network-request-failed': 'network',
}

export function toRoomError(error: unknown): RoomError {
  if (error instanceof RoomError) return error
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : ''
  const mapped = FIREBASE_CODE_MAP[code]
  if (mapped) return new RoomError(mapped, undefined)
  if (error instanceof Error) return new RoomError('unknown', error.message)
  return new RoomError('unknown')
}
