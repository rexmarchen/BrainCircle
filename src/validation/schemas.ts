import { z } from 'zod'
import { ROOM_LIMITS, SUBJECTS } from '@/config/rooms'

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address')
  .email('Enter a valid email address')
  .max(254, 'Email is too long')

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128, 'Password is too long')

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(40, 'Name must be 40 characters or fewer')

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password').max(128, 'Password is too long'),
})

export const signUpSchema = z
  .object({
    displayName: displayNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export const profileSchema = z.object({
  displayName: displayNameSchema,
})

export const roomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(ROOM_LIMITS.minNameLength, `Room name must be at least ${ROOM_LIMITS.minNameLength} characters`)
    .max(ROOM_LIMITS.maxNameLength, `Room name must be ${ROOM_LIMITS.maxNameLength} characters or fewer`),
  subject: z
    .string()
    .trim()
    .min(ROOM_LIMITS.minSubjectLength, 'Add a subject')
    .max(ROOM_LIMITS.maxSubjectLength, `Subject must be ${ROOM_LIMITS.maxSubjectLength} characters or fewer`),
  description: z
    .string()
    .trim()
    .max(
      ROOM_LIMITS.maxDescriptionLength,
      `Description must be ${ROOM_LIMITS.maxDescriptionLength} characters or fewer`,
    ),
  maxCapacity: z
    .number({ message: 'Choose a maximum capacity' })
    .int('Capacity must be a whole number')
    .min(ROOM_LIMITS.minCapacity, `Capacity must be at least ${ROOM_LIMITS.minCapacity}`)
    .max(ROOM_LIMITS.maxCapacity, `Capacity cannot exceed ${ROOM_LIMITS.maxCapacity}`),
  durationMinutes: z
    .number()
    .int()
    .min(5, 'Minimum session length is 5 minutes')
    .max(240, 'Maximum session length is 4 hours')
    .optional(),
})

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
export type ProfileValues = z.infer<typeof profileSchema>
export type RoomFormValues = z.infer<typeof roomSchema>

export const SUBJECT_SUGGESTIONS: readonly string[] = SUBJECTS
