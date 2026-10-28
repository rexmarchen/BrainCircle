import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Info,
  Minus,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { roomBackend } from '@/services'
import { roomSchema, SUBJECT_SUGGESTIONS, type RoomFormValues } from '@/validation/schemas'
import { ROOM_LIMITS } from '@/config/rooms'
import { toRoomError } from '@/types/errors'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonStyles } from '@/components/ui/Button'
import { Alert, Card } from '@/components/ui/Feedback'
import { Input, Textarea } from '@/components/ui/Input'
import { cn } from '@/utils/cn'

export function CreateRoomPage() {
  useDocumentTitle('Create a study room')
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: '',
      subject: '',
      description: '',
      maxCapacity: 6,
    },
  })

  const values = watch()
  const capacity = Number.isFinite(values.maxCapacity) ? values.maxCapacity : 6

  const adjustCapacity = (delta: number) => {
    const next = Math.min(
      ROOM_LIMITS.maxCapacity,
      Math.max(ROOM_LIMITS.minCapacity, (Number.isFinite(capacity) ? capacity : 2) + delta),
    )
    setValue('maxCapacity', next, { shouldValidate: true, shouldDirty: true })
  }

  const onSubmit = async (formValues: RoomFormValues) => {
    if (!user) return
    setSubmitError(null)
    try {
      const roomId = await roomBackend.createRoom(formValues, {
        uid: user.uid,
        displayName: user.displayName,
      })
      toast.success('Room created', `${formValues.name} is live. You have the first seat.`)
      navigate(`/rooms/${roomId}`, { replace: true })
    } catch (error) {
      setSubmitError(toRoomError(error).message)
      toast.error('Could not create the room', toRoomError(error).message)
    }
  }

  return (
    <div className="container-page py-10 lg:py-14">
      <Link
        to="/rooms"
        className="inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-muted transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to all rooms
      </Link>

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">New circle</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-[2.5rem]">
          Open a study room
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Keep it small enough to stay focused. You will take the first seat automatically, and the
          room stays live until the last student leaves.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <Card className="p-5 sm:p-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {submitError ? (
              <Alert tone="danger" icon={<AlertCircle className="size-4" />} title="Room not created">
                {submitError}
              </Alert>
            ) : null}

            <Input
              label="Room name"
              placeholder="e.g. DSA grind — graphs & DP"
              required
              maxLength={ROOM_LIMITS.maxNameLength}
              error={errors.name?.message}
              icon={<BookOpen className="size-4" aria-hidden="true" />}
              hint="Make it specific so the right students can find it."
              {...register('name')}
            />

            <div className="space-y-2">
              <Input
                label="Subject"
                placeholder="e.g. DSA, Organic Chemistry, Macroeconomics"
                required
                maxLength={ROOM_LIMITS.maxSubjectLength}
                list="subject-suggestions"
                error={errors.subject?.message}
                hint="Any subject works. Pick a suggestion or type your own."
                {...register('subject')}
              />
              <datalist id="subject-suggestions">
                {SUBJECT_SUGGESTIONS.map((subject) => (
                  <option key={subject} value={subject} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECT_SUGGESTIONS.slice(0, 8).map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() =>
                      setValue('subject', subject, { shouldValidate: true, shouldDirty: true })
                    }
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold transition-colors',
                      values.subject === subject
                        ? 'border-brand-200 bg-brand-50 text-brand-700'
                        : 'border-line bg-surface text-muted hover:border-brand-200 hover:text-brand-700',
                    )}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Short description"
              placeholder="What are you working on? Add a goal, a chapter, or a time window."
              maxLength={ROOM_LIMITS.maxDescriptionLength}
              showCount
              error={errors.description?.message}
              value={values.description ?? ''}
              {...register('description')}
            />

            <div className="space-y-2">
              <p className="flex items-center gap-1 text-sm font-semibold text-ink">
                Maximum capacity
                <span className="text-brand-600" aria-hidden="true">
                  *
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
                  <button
                    type="button"
                    onClick={() => adjustCapacity(-1)}
                    disabled={capacity <= ROOM_LIMITS.minCapacity}
                    className="flex size-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-canvas-deep disabled:opacity-40"
                    aria-label="Decrease capacity"
                  >
                    <Minus className="size-4" />
                  </button>
                  <input
                    type="number"
                    min={ROOM_LIMITS.minCapacity}
                    max={ROOM_LIMITS.maxCapacity}
                    aria-label="Maximum capacity"
                    aria-invalid={errors.maxCapacity ? true : undefined}
                    className="h-8 w-12 border-0 bg-transparent text-center text-sm font-bold tabular-nums text-ink focus:outline-none"
                    {...register('maxCapacity', { valueAsNumber: true })}
                  />
                  <button
                    type="button"
                    onClick={() => adjustCapacity(1)}
                    disabled={capacity >= ROOM_LIMITS.maxCapacity}
                    className="flex size-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-canvas-deep disabled:opacity-40"
                    aria-label="Increase capacity"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  {[3, 5, 8, 10].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setValue('maxCapacity', preset, { shouldValidate: true, shouldDirty: true })
                      }
                      className={cn(
                        'rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
                        capacity === preset
                          ? 'border-brand-200 bg-brand-50 text-brand-700'
                          : 'border-line bg-surface text-muted hover:border-brand-200',
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              {errors.maxCapacity?.message ? (
                <p className="text-sm font-medium text-rose-600" role="alert">
                  {errors.maxCapacity.message}
                </p>
              ) : (
                <p className="text-xs leading-relaxed text-muted">
                  Between {ROOM_LIMITS.minCapacity} and {ROOM_LIMITS.maxCapacity} students, including
                  you. A hard limit keeps the circle focused.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Info className="size-3.5" aria-hidden="true" />
                You can leave anytime; your seat is released.
              </p>
              <Button type="submit" size="lg" loading={isSubmitting}>
                <Sparkles className="size-4" aria-hidden="true" />
                Create room
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-24">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Form preview</span>
              <Badge variant="success">Open</Badge>
            </div>
            <div className="p-5">
              <Badge variant="brand">{values.subject?.trim() || 'Your subject'}</Badge>
              <h2 className="mt-3 text-lg font-bold leading-snug text-ink">
                {values.name?.trim() || 'Your room name'}
              </h2>
              <p className="mt-1.5 line-clamp-2 min-h-9 text-sm leading-relaxed text-muted">
                {values.description?.trim() || 'Your short description will appear here.'}
              </p>
              <div className="mt-5 flex items-center gap-2.5">
                <Avatar name={user?.displayName ?? 'You'} uid={user?.uid ?? 'you'} size="sm" />
                <div>
                  <p className="text-xs font-semibold text-ink">{user?.displayName ?? 'You'}</p>
                  <p className="text-[0.7rem] text-muted">Host · first seat</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs">
                <span className="flex items-center gap-1 font-semibold text-ink-soft">
                  <Users className="size-3.5 text-muted" aria-hidden="true" />1 / {capacity || 2} members
                </span>
                <span className="font-semibold text-emerald-700">1 seat taken</span>
              </div>
            </div>
          </Card>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-sm font-bold text-ink">What happens next</h2>
            <ul className="mt-3 space-y-3">
              {[
                'Your room appears in Explore immediately.',
                'You take seat 1 and can share the room link.',
                'Membership updates live as students join.',
                'The room closes when the last member leaves.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/how-it-works#lifecycle"
              className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'mt-3 px-0 text-brand-700' })}
            >
              How room lifecycle works
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
