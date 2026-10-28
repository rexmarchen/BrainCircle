/**
 * Only allow same-origin, absolute-path redirects. Prevents open redirects
 * through `?redirect=https://evil.example`.
 */
export function safeRedirect(value: string | null | undefined, fallback = '/rooms'): string {
  if (!value) return fallback
  if (!value.startsWith('/')) return fallback
  if (value.startsWith('//')) return fallback
  if (value.includes('\\')) return fallback
  return value
}

export function loginRedirect(path: string): string {
  return `/login?redirect=${encodeURIComponent(path)}`
}
