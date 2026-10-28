const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/missing-email': 'Enter your email address first.',
  'auth/user-disabled': 'This account has been disabled. Contact support if you think this is a mistake.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/invalid-login-credentials': 'Email or password is incorrect.',
  'auth/email-already-in-use': 'An account already exists for this email. Try signing in instead.',
  'auth/weak-password': 'Use at least 8 characters for your password.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment, then try again.',
  'auth/network-request-failed': 'We could not reach the authentication server. Check your connection.',
  'auth/operation-not-allowed': 'Email and password sign-in is not enabled for this Firebase project.',
  'auth/requires-recent-login': 'Please sign in again before making this change.',
  'auth/invalid-display-name': 'Enter a display name between 2 and 40 characters.',
  'auth/demo-password-reset-unavailable':
    'Password reset is not available in demo mode. Create a new demo account or connect Firebase.',
  'auth/unauthorized-domain':
    'This domain is not authorized in Firebase Authentication. Add it under Authentication → Settings.',
}

export function authErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code?: unknown }).code)
    if (AUTH_MESSAGES[code]) return AUTH_MESSAGES[code]
  }
  if (error instanceof Error && error.message) {
    // Demo/store errors are already user-facing; Firebase messages are not.
    if (!error.message.startsWith('Firebase:')) return error.message
  }
  return 'Something went wrong. Please try again.'
}
