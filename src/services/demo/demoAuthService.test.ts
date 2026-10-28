import { describe, expect, it } from 'vitest'
import { DemoAuthService } from '@/services/demo/demoAuthService'

describe('DemoAuthService', () => {
  it('creates an account, normalizes the email, and signs in', async () => {
    const service = new DemoAuthService(false)
    const created = await service.signUp({
      email: '  Student@Example.EDU ',
      password: 'a-strong-password',
      displayName: '  Test Student  ',
    })

    expect(created.email).toBe('student@example.edu')
    expect(created.displayName).toBe('Test Student')
    expect(created.uid).toMatch(/^demo_/)

    const signedOut = new DemoAuthService(false)
    await expect(signedOut.signIn('student@example.edu', 'wrong-password')).rejects.toMatchObject({
      code: 'auth/invalid-credential',
    })

    const signedIn = await service.signIn('STUDENT@example.edu', 'a-strong-password')
    expect(signedIn.uid).toBe(created.uid)
    expect(signedIn.displayName).toBe('Test Student')
  })

  it('rejects duplicate emails and weak or invalid input', async () => {
    const service = new DemoAuthService(false)
    const input = {
      email: 'student@example.edu',
      password: 'a-strong-password',
      displayName: 'Test Student',
    }
    await service.signUp(input)

    await expect(service.signUp(input)).rejects.toMatchObject({
      code: 'auth/email-already-in-use',
    })
    await expect(
      service.signUp({ ...input, email: 'other@example.edu', password: 'short' }),
    ).rejects.toMatchObject({ code: 'auth/weak-password' })
    await expect(
      service.signUp({ ...input, email: 'not-an-email', password: 'a-strong-password' }),
    ).rejects.toMatchObject({ code: 'auth/invalid-email' })
    await expect(
      service.signUp({ ...input, email: 'third@example.edu', displayName: 'A' }),
    ).rejects.toMatchObject({ code: 'auth/invalid-display-name' })
  })

  it('updates the display name and notifies subscribers', async () => {
    const service = new DemoAuthService(false)
    const user = await service.signUp({
      email: 'student@example.edu',
      password: 'a-strong-password',
      displayName: 'Test Student',
    })
    const listener = vi.fn()
    service.subscribe(listener)

    const updated = await service.updateDisplayName(user, '  New Name  ')
    expect(updated.displayName).toBe('New Name')
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ displayName: 'New Name' }))

    await expect(service.updateDisplayName(user, 'x')).rejects.toMatchObject({
      code: 'auth/invalid-display-name',
    })
  })

  it('persists the session across service instances and signs out cleanly', async () => {
    const service = new DemoAuthService(true)
    const created = await service.signUp({
      email: 'student@example.edu',
      password: 'a-strong-password',
      displayName: 'Test Student',
    })

    const restored = new DemoAuthService(true)
    const listener = vi.fn()
    restored.subscribe(listener)
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ uid: created.uid }))

    await restored.signOut()
    expect(listener).toHaveBeenLastCalledWith(null)

    const afterSignOut = new DemoAuthService(true)
    const afterListener = vi.fn()
    afterSignOut.subscribe(afterListener)
    expect(afterListener).toHaveBeenCalledWith(null)
  })

  it('explains that password reset is unavailable in demo mode', async () => {
    const service = new DemoAuthService(false)
    await expect(service.sendPasswordReset('student@example.edu')).rejects.toMatchObject({
      code: 'auth/demo-password-reset-unavailable',
    })
  })
})
