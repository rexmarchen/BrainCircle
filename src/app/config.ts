import type { BackendMode } from '@/types/room'

const FIREBASE_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const

const env = import.meta.env

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  databaseURL: env.VITE_FIREBASE_DATABASE_URL ?? '',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
  appId: env.VITE_FIREBASE_APP_ID ?? '',
}

export const missingFirebaseKeys = FIREBASE_ENV_KEYS.filter((key) => !env[key])
export const isFirebaseConfigured = missingFirebaseKeys.length === 0
export const isDemoForced = String(env.VITE_DEMO_MODE).toLowerCase() === 'true'

const DEMO_ACK_KEY = 'braincircle:demo-ack'

function readDemoAck(): boolean {
  try {
    return globalThis.localStorage?.getItem(DEMO_ACK_KEY) === '1'
  } catch {
    return false
  }
}

export function acknowledgeDemoMode(): void {
  try {
    globalThis.localStorage?.setItem(DEMO_ACK_KEY, '1')
  } catch {
    // Storage can be unavailable in private browsing; the page still reloads into demo mode
    // for this session via the query string fallback below.
  }
}

export type AppMode = BackendMode | 'unconfigured'

export function resolveAppMode(): AppMode {
  if (isDemoForced) return 'demo'
  if (isFirebaseConfigured) return 'firebase'
  const allowDemo = env.DEV || readDemoAck()
  return allowDemo ? 'demo' : 'unconfigured'
}

export const appMode: AppMode = resolveAppMode()

export function isDemoMode(): boolean {
  return appMode === 'demo'
}

export const demoNotice =
  'Demo mode: data is stored in this browser only. Connect a Firebase project to use live rooms.'
