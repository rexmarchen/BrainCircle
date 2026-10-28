import { get, ref, serverTimestamp, update } from 'firebase/database'
import { getFirebaseDatabase } from '@/firebase/client'

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  createdAt?: number
  updatedAt?: number
}

interface RawProfile {
  displayName?: string
  email?: string
  createdAt?: number
  updatedAt?: number
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await get(ref(getFirebaseDatabase(), `users/${uid}`))
  if (!snapshot.exists()) return null
  const raw = snapshot.val() as RawProfile
  return {
    uid,
    displayName: raw.displayName ?? 'Student',
    email: raw.email ?? '',
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : undefined,
  }
}

/** Creates the private profile document on first sign-in, or repairs a partial one. */
export async function ensureUserProfile(uid: string, email: string, displayName: string) {
  const existing = await fetchUserProfile(uid)
  const db = getFirebaseDatabase()
  if (!existing) {
    await update(ref(db, `users/${uid}`), {
      displayName,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return
  }
  if (existing.displayName !== displayName || existing.email !== email) {
    await update(ref(db, `users/${uid}`), {
      displayName,
      email,
      updatedAt: serverTimestamp(),
    })
  }
}

export async function saveDisplayName(uid: string, displayName: string): Promise<void> {
  await update(ref(getFirebaseDatabase(), `users/${uid}`), {
    displayName,
    updatedAt: serverTimestamp(),
  })
}
