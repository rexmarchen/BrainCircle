import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthService, AuthUser } from '@/types/auth'
import { authService as defaultAuthService, roomBackend } from '@/services'
import { releaseTrackedMemberships } from '@/services/activeMemberships'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthUser>
  signUp: (input: { email: string; password: string; displayName: string }) => Promise<AuthUser>
  signOut: () => Promise<void>
  updateDisplayName: (displayName: string) => Promise<AuthUser>
  sendPasswordReset: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  service = defaultAuthService,
}: {
  children: ReactNode
  service?: AuthService
}) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = service.subscribe((nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return unsubscribe
  }, [service])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const nextUser = await service.signIn(email, password)
      setUser(nextUser)
      return nextUser
    },
    [service],
  )

  const signUp = useCallback(
    async (input: { email: string; password: string; displayName: string }) => {
      const nextUser = await service.signUp(input)
      setUser(nextUser)
      return nextUser
    },
    [service],
  )

  const signOut = useCallback(async () => {
    try {
      await releaseTrackedMemberships(roomBackend)
    } catch {
      // Never block sign-out on a courtesy cleanup.
    }
    await service.signOut()
    setUser(null)
  }, [service])

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      if (!user) throw new Error('You need to be signed in to update your profile.')
      const nextUser = await service.updateDisplayName(user, displayName)
      setUser(nextUser)
      return nextUser
    },
    [service, user],
  )

  const sendPasswordReset = useCallback(
    async (email: string) => {
      await service.sendPasswordReset(email)
    },
    [service],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signUp, signOut, updateDisplayName, sendPasswordReset }),
    [user, loading, signIn, signUp, signOut, updateDisplayName, sendPasswordReset],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}
