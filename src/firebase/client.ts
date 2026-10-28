import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectDatabaseEmulator, getDatabase, type Database } from 'firebase/database'
import { firebaseConfig, isFirebaseConfigured } from '@/app/config'

let cachedApp: FirebaseApp | null = null
let cachedAuth: Auth | null = null
let cachedDatabase: Database | null = null
let authEmulatorConnected = false
let databaseEmulatorConnected = false

const emulatorEnabled =
  import.meta.env.DEV &&
  (String(import.meta.env.VITE_USE_FIREBASE_EMULATORS).toLowerCase() === 'true' || String(import.meta.env.VITE_USE_FIREBASE_EMULATOR).toLowerCase() === 'true')

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Add the VITE_FIREBASE_* variables to your .env.local file.',
    )
  }
  if (!cachedApp) {
    cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
  }
  return cachedApp
}

export function getFirebaseAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = getAuth(getFirebaseApp())
    if (emulatorEnabled && !authEmulatorConnected) {
      const emulatorUrl =
        import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL || 'http://127.0.0.1:9099'
      try {
        connectAuthEmulator(cachedAuth, emulatorUrl, { disableWarnings: true })
        authEmulatorConnected = true
      } catch {
        // A hot reload may reconnect an already-configured emulator; ignore it.
      }
    }
  }
  return cachedAuth
}

export function getFirebaseDatabase(): Database {
  if (!cachedDatabase) {
    cachedDatabase = getDatabase(getFirebaseApp())
    if (emulatorEnabled && !databaseEmulatorConnected) {
      const host = import.meta.env.VITE_FIREBASE_DATABASE_EMULATOR_HOST || '127.0.0.1'
      const port = Number(import.meta.env.VITE_FIREBASE_DATABASE_EMULATOR_PORT) || 9000
      try {
        connectDatabaseEmulator(cachedDatabase, host, port)
        databaseEmulatorConnected = true
      } catch {
        // A hot reload may reconnect an already-configured emulator; ignore it.
      }
    }
  }
  return cachedDatabase
}
