/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_DATABASE_URL?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  /** Explicitly opt into the local demo backend. Never enable for a real deployment. */
  readonly VITE_DEMO_MODE?: string
  /** Point the app at local Firebase Auth and Realtime Database emulators. Development only. */
  readonly VITE_USE_FIREBASE_EMULATORS?: string
  readonly VITE_FIREBASE_AUTH_EMULATOR_URL?: string
  readonly VITE_FIREBASE_DATABASE_EMULATOR_HOST?: string
  readonly VITE_FIREBASE_DATABASE_EMULATOR_PORT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
