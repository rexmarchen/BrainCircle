import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/firebase/client'
import { ensureUserProfile, fetchUserProfile, saveDisplayName } from '@/firebase/userProfile'
import type { AuthService, AuthUser, SignUpInput } from '@/types/auth'

function fallbackName(user: User): string {
  const profileName = user.displayName?.trim()
  if (profileName) return profileName
  const emailName = user.email?.split('@')[0]
  return emailName ? emailName.slice(0, 40) : 'Student'
}

async function toAuthUser(user: User): Promise<AuthUser> {
  let createdAt: number | undefined
  let displayName = fallbackName(user)
  try {
    const profile = await fetchUserProfile(user.uid)
    if (profile) {
      displayName = profile.displayName
      createdAt = profile.createdAt
    }
  } catch {
    // A profile read failure should not lock the user out of the app.
  }
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName,
    createdAt,
  }
}

class FirebaseAuthService implements AuthService {
  readonly mode = 'firebase' as const

  subscribe(listener: (user: AuthUser | null) => void) {
    let active = true
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (!active) return
      if (!user) {
        listener(null)
        return
      }
      void toAuthUser(user).then((authUser) => {
        if (active) listener(authUser)
      })
    })
    return () => {
      active = false
      unsubscribe()
    }
  }

  async signUp(input: SignUpInput): Promise<AuthUser> {
    const auth = getFirebaseAuth()
    const credential = await createUserWithEmailAndPassword(
      auth,
      input.email.trim(),
      input.password,
    )
    const displayName = input.displayName.trim()
    await updateProfile(credential.user, { displayName })
    await ensureUserProfile(credential.user.uid, input.email.trim(), displayName)
    return {
      uid: credential.user.uid,
      email: credential.user.email ?? input.email.trim(),
      displayName,
      createdAt: Date.now(),
    }
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)
    return toAuthUser(credential.user)
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(getFirebaseAuth())
  }

  async updateDisplayName(user: AuthUser, displayName: string): Promise<AuthUser> {
    const auth = getFirebaseAuth()
    const current = auth.currentUser
    if (!current || current.uid !== user.uid) {
      throw Object.assign(new Error('Please sign in again to update your profile.'), {
        code: 'auth/requires-recent-login',
      })
    }
    const name = displayName.trim()
    await updateProfile(current, { displayName: name })
    await ensureUserProfile(user.uid, user.email, name)
    await saveDisplayName(user.uid, name)
    return { ...user, displayName: name }
  }

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim())
  }
}

export function createFirebaseAuthService(): AuthService {
  return new FirebaseAuthService()
}
