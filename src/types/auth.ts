export interface AuthUser {
  uid: string
  email: string
  displayName: string
  createdAt?: number
}

export interface SignUpInput {
  email: string
  password: string
  displayName: string
}

export type Unsubscribe = () => void

export interface AuthService {
  readonly mode: 'firebase' | 'demo'
  subscribe(listener: (user: AuthUser | null) => void): Unsubscribe
  signUp(input: SignUpInput): Promise<AuthUser>
  signIn(email: string, password: string): Promise<AuthUser>
  signOut(): Promise<void>
  updateDisplayName(user: AuthUser, displayName: string): Promise<AuthUser>
  sendPasswordReset(email: string): Promise<void>
}
