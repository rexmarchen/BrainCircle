import type { AuthService } from '@/types/auth'
import type { RoomBackend } from '@/types/room'
import { appMode } from '@/app/config'
import { createDemoAuthService } from '@/services/demo/demoAuthService'
import { createDemoRoomBackend } from '@/services/demo/demoRoomBackend'
import { createFirebaseAuthService } from '@/services/firebase/firebaseAuthService'
import { createFirebaseRoomBackend } from '@/services/firebase/firebaseRoomBackend'

const useFirebase = appMode === 'firebase'

export const authService: AuthService = useFirebase
  ? createFirebaseAuthService()
  : createDemoAuthService(true)

export const roomBackend: RoomBackend = useFirebase
  ? createFirebaseRoomBackend()
  : createDemoRoomBackend()

export const backendLabel = useFirebase ? 'Firebase' : 'local demo'
