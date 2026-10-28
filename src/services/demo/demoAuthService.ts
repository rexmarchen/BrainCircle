import type { AuthService, AuthUser, SignUpInput, Unsubscribe } from '@/types/auth'

interface StoredDemoUser extends AuthUser {
  salt: string
  passwordHash: string
  iterations: number
}

interface DemoStore {
  version: 1
  users: Record<string, StoredDemoUser>
}

const USERS_KEY = 'braincircle:demo:users:v1'
const SESSION_KEY = 'braincircle:demo:session:v1'
const ITERATIONS = 150_000

const encoder = new TextEncoder()

function base64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes)
  let binary = ''
  for (const byte of view) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function randomToken(bytes = 16): string {
  const buffer = new Uint8Array(bytes)
  crypto.getRandomValues(buffer)
  return base64(buffer.buffer).replace(/[+/=]/g, '').slice(0, 22)
}

async function derivePassword(password: string, salt: string, iterations: number): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('This browser cannot create a secure demo account. Please use Firebase Authentication.')
  }
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  return base64(bits)
}

function authError(code: string, message: string): Error {
  const error = new Error(message)
  ;(error as Error & { code: string }).code = code
  return error
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function publicUser(user: StoredDemoUser): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  }
}

/**
 * Local demo authentication. Passwords are salted and hashed with PBKDF2; they
 * are never stored in plaintext. This is still NOT production authentication —
 * see README for the demo-mode boundary.
 */
export class DemoAuthService implements AuthService {
  readonly mode = 'demo' as const

  private users = new Map<string, StoredDemoUser>()
  private listeners = new Set<(user: AuthUser | null) => void>()
  private current: AuthUser | null = null

  constructor(private readonly persist = true) {
    this.load()
    this.restoreSession()
  }

  private storageAvailable() {
    return this.persist && typeof globalThis.localStorage !== 'undefined'
  }

  private load() {
    if (!this.storageAvailable()) return
    try {
      const raw = globalThis.localStorage?.getItem(USERS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<DemoStore>
      if (parsed?.version !== 1 || !parsed.users) return
      for (const [id, user] of Object.entries(parsed.users)) {
        this.users.set(id, user)
      }
    } catch {
      this.users.clear()
    }
  }

  private save() {
    if (!this.storageAvailable()) return
    try {
      const store: DemoStore = {
        version: 1,
        users: Object.fromEntries(this.users.entries()),
      }
      globalThis.localStorage?.setItem(USERS_KEY, JSON.stringify(store))
    } catch {
      // Best effort only.
    }
  }

  private restoreSession() {
    if (!this.storageAvailable()) return
    try {
      const uid = globalThis.localStorage?.getItem(SESSION_KEY)
      if (!uid) return
      const user = this.users.get(uid)
      if (user) this.current = publicUser(user)
    } catch {
      this.current = null
    }
  }

  private emit() {
    this.listeners.forEach((listener) => listener(this.current))
  }

  subscribe(listener: (user: AuthUser | null) => void): Unsubscribe {
    this.listeners.add(listener)
    listener(this.current)
    return () => {
      this.listeners.delete(listener)
    }
  }

  async signUp(input: SignUpInput): Promise<AuthUser> {
    const email = normalizeEmail(input.email)
    const displayName = input.displayName.trim()
    if (!email || !email.includes('@')) throw authError('auth/invalid-email', 'Enter a valid email address.')
    if (input.password.length < 8) {
      throw authError('auth/weak-password', 'Use at least 8 characters for your password.')
    }
    if (displayName.length < 2) {
      throw authError('auth/invalid-display-name', 'Enter a display name with at least 2 characters.')
    }
    if (Array.from(this.users.values()).some((user) => user.email === email)) {
      throw authError('auth/email-already-in-use', 'An account already exists for this email.')
    }

    const salt = randomToken(16)
    const passwordHash = await derivePassword(input.password, salt, ITERATIONS)
    const user: StoredDemoUser = {
      uid: `demo_${randomToken(10)}`,
      email,
      displayName,
      createdAt: Date.now(),
      salt,
      passwordHash,
      iterations: ITERATIONS,
    }
    this.users.set(user.uid, user)
    this.save()
    this.current = publicUser(user)
    if (this.storageAvailable()) {
      try {
        globalThis.localStorage?.setItem(SESSION_KEY, user.uid)
      } catch {
        // ignore
      }
    }
    this.emit()
    return this.current
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const normalized = normalizeEmail(email)
    const stored = Array.from(this.users.values()).find((user) => user.email === normalized)
    if (!stored) {
      throw authError('auth/invalid-credential', 'Email or password is incorrect.')
    }
    const hash = await derivePassword(password, stored.salt, stored.iterations)
    if (hash !== stored.passwordHash) {
      throw authError('auth/invalid-credential', 'Email or password is incorrect.')
    }
    this.current = publicUser(stored)
    if (this.storageAvailable()) {
      try {
        globalThis.localStorage?.setItem(SESSION_KEY, stored.uid)
      } catch {
        // ignore
      }
    }
    this.emit()
    return this.current
  }

  async signOut(): Promise<void> {
    this.current = null
    if (this.storageAvailable()) {
      try {
        globalThis.localStorage?.removeItem(SESSION_KEY)
      } catch {
        // ignore
      }
    }
    this.emit()
  }

  async updateDisplayName(user: AuthUser, displayName: string): Promise<AuthUser> {
    const name = displayName.trim()
    if (name.length < 2 || name.length > 40) {
      throw authError('auth/invalid-display-name', 'Name must be between 2 and 40 characters.')
    }
    const stored = this.users.get(user.uid)
    if (!stored) throw authError('auth/user-not-found', 'Account not found. Please sign in again.')
    stored.displayName = name
    this.save()
    if (this.current?.uid === user.uid) {
      this.current = publicUser(stored)
      this.emit()
    }
    return publicUser(stored)
  }

  async sendPasswordReset(_email: string): Promise<void> {
    throw authError(
      'auth/demo-password-reset-unavailable',
      'Password reset is not available in demo mode. Use Firebase Authentication for real accounts.',
    )
  }
}

export function createDemoAuthService(persist = true) {
  return new DemoAuthService(persist)
}
