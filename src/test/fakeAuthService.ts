import type { AuthService, AuthUser, SignUpInput, Unsubscribe } from '@/types/auth'

export interface FakeAuthOptions {
  user?: AuthUser | null
  signInError?: Error
}

/**
 * Deterministic AuthService for component tests. It mirrors the contract of the
 * real services without touching Firebase or Web Crypto.
 */
export class FakeAuthService implements AuthService {
  readonly mode = 'demo' as const
  private listeners = new Set<(user: AuthUser | null) => void>()
  current: AuthUser | null
  signInError?: Error
  signInCalls: Array<{ email: string; password: string }> = []
  signUpCalls: SignUpInput[] = []

  constructor(options: FakeAuthOptions = {}) {
    this.current = options.user ?? null
    this.signInError = options.signInError
  }

  subscribe(listener: (user: AuthUser | null) => void): Unsubscribe {
    this.listeners.add(listener)
    listener(this.current)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit() {
    this.listeners.forEach((listener) => listener(this.current))
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    this.signInCalls.push({ email, password })
    if (this.signInError) throw this.signInError
    this.current = {
      uid: 'test-user',
      email,
      displayName: 'Test Student',
      createdAt: 1,
    }
    this.emit()
    return this.current
  }

  async signUp(input: SignUpInput): Promise<AuthUser> {
    this.signUpCalls.push(input)
    this.current = {
      uid: 'test-user',
      email: input.email,
      displayName: input.displayName,
      createdAt: 1,
    }
    this.emit()
    return this.current
  }

  async signOut(): Promise<void> {
    this.current = null
    this.emit()
  }

  async updateDisplayName(user: AuthUser, displayName: string): Promise<AuthUser> {
    this.current = { ...user, displayName }
    this.emit()
    return this.current
  }

  async sendPasswordReset(): Promise<void> {
    return Promise.resolve()
  }
}

export const testUser: AuthUser = {
  uid: 'test-user',
  email: 'student@example.edu',
  displayName: 'Test Student',
  createdAt: 1,
}
