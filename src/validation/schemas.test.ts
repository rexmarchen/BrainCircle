import { describe, expect, it } from 'vitest'
import {
  displayNameSchema,
  emailSchema,
  passwordSchema,
  profileSchema,
  roomSchema,
  signInSchema,
  signUpSchema,
} from '@/validation/schemas'
import { ROOM_LIMITS } from '@/config/rooms'

const validSignUp = {
  displayName: 'Ananya Sharma',
  email: 'ananya@university.edu',
  password: 'correct-horse',
  confirmPassword: 'correct-horse',
}

const validRoom = {
  name: 'Graphs and DP',
  subject: 'DSA',
  description: 'Working through graph traversal problems.',
  maxCapacity: 6,
}

describe('auth schemas', () => {
  it('accepts a valid sign-up and trims text fields', () => {
    const result = signUpSchema.parse({
      ...validSignUp,
      displayName: '  Ananya Sharma  ',
      email: '  ananya@university.edu ',
    })

    expect(result.displayName).toBe('Ananya Sharma')
    expect(result.email).toBe('ananya@university.edu')
  })

  it('rejects mismatched passwords on the confirm field', () => {
    const result = signUpSchema.safeParse({ ...validSignUp, confirmPassword: 'different-pass' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword'])
      expect(result.error.issues[0]?.message).toBe('Passwords do not match')
    }
  })

  it('enforces email, password, and display-name rules', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false)
    expect(emailSchema.safeParse('a@b.co').success).toBe(true)
    expect(passwordSchema.safeParse('short').success).toBe(false)
    expect(passwordSchema.safeParse('x'.repeat(129)).success).toBe(false)
    expect(displayNameSchema.safeParse('A').success).toBe(false)
    expect(displayNameSchema.safeParse('x'.repeat(41)).success).toBe(false)
    expect(profileSchema.safeParse({ displayName: 'Ananya' }).success).toBe(true)
  })

  it('requires both sign-in fields', () => {
    expect(signInSchema.safeParse({ email: '', password: '' }).success).toBe(false)
    expect(signInSchema.safeParse({ email: 'a@b.co', password: 'secret' }).success).toBe(true)
  })
})

describe('room schema', () => {
  it('accepts valid room input and trims strings', () => {
    const result = roomSchema.parse({
      ...validRoom,
      name: '  Graphs and DP  ',
      subject: '  DSA  ',
    })

    expect(result.name).toBe('Graphs and DP')
    expect(result.subject).toBe('DSA')
  })

  it('enforces capacity boundaries', () => {
    expect(roomSchema.safeParse({ ...validRoom, maxCapacity: ROOM_LIMITS.minCapacity - 1 }).success).toBe(
      false,
    )
    expect(roomSchema.safeParse({ ...validRoom, maxCapacity: ROOM_LIMITS.minCapacity }).success).toBe(
      true,
    )
    expect(roomSchema.safeParse({ ...validRoom, maxCapacity: ROOM_LIMITS.maxCapacity }).success).toBe(
      true,
    )
    expect(roomSchema.safeParse({ ...validRoom, maxCapacity: ROOM_LIMITS.maxCapacity + 1 }).success).toBe(
      false,
    )
    expect(roomSchema.safeParse({ ...validRoom, maxCapacity: 3.5 }).success).toBe(false)
  })

  it('rejects short names and overlong descriptions', () => {
    expect(roomSchema.safeParse({ ...validRoom, name: 'ab' }).success).toBe(false)
    expect(roomSchema.safeParse({ ...validRoom, subject: 'x' }).success).toBe(false)
    expect(
      roomSchema.safeParse({
        ...validRoom,
        description: 'x'.repeat(ROOM_LIMITS.maxDescriptionLength + 1),
      }).success,
    ).toBe(false)
  })
})
