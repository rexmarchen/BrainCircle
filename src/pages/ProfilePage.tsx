import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, LogOut, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { appMode } from '@/app/config'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Feedback'
import { Input } from '@/components/ui/Input'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useSignOut } from '@/hooks/useSignOut'
import { authErrorMessage } from '@/utils/authErrors'
import { formatDate } from '@/utils/format'
import { profileSchema, type ProfileValues } from '@/validation/schemas'

export function ProfilePage() {
  useDocumentTitle('Your profile')
  const { user, updateDisplayName } = useAuth()
  const toast = useToast()
  const signOut = useSignOut()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: user?.displayName ?? '' },
  })

  useEffect(() => {
    if (user?.displayName) reset({ displayName: user.displayName })
  }, [reset, user?.displayName])

  if (!user) return null

  const onSubmit = async (values: ProfileValues) => {
    try {
      const updated = await updateDisplayName(values.displayName)
      reset({ displayName: updated.displayName })
      toast.success('Profile updated', 'Your new display name is live in future room visits.')
    } catch (error) {
      toast.error('Could not update your profile', authErrorMessage(error))
    }
  }

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Account</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Your profile</h1>
            <p className="mt-2 text-sm text-muted">
              Keep your display name recognizable so your study circle knows who joined.
            </p>
          </div>
          <Badge variant={appMode === 'firebase' ? 'success' : 'warning'} icon={<ShieldCheck className="size-3.5" />}>
            {appMode === 'firebase' ? 'Firebase account' : 'Local demo account'}
          </Badge>
        </div>

        <Card className="mt-7 overflow-hidden">
          <div className="flex flex-col gap-5 border-b border-line bg-gradient-to-br from-brand-50/70 via-surface to-surface p-6 sm:flex-row sm:items-center sm:p-8">
            <Avatar name={user.displayName} uid={user.uid} size="xl" />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-extrabold tracking-tight text-ink">
                {user.displayName}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted">
                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                {user.email}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="brand" icon={<Sparkles className="size-3.5" />}>
                  Study circle member
                </Badge>
                {user.createdAt ? (
                  <Badge variant="outline" icon={<CalendarDays className="size-3.5" />}>
                    Joined {formatDate(user.createdAt)}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
            <section aria-labelledby="edit-profile-heading">
              <h2 id="edit-profile-heading" className="text-sm font-bold text-ink">
                Display name
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                This is shown to other students in rooms you join. Your email stays private.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
                <Input
                  label="Display name"
                  type="text"
                  autoComplete="name"
                  maxLength={40}
                  icon={<UserRound className="size-4" aria-hidden="true" />}
                  error={errors.displayName?.message}
                  required
                  {...register('displayName')}
                />
                <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                  Save changes
                </Button>
              </form>
            </section>

            <section aria-labelledby="account-details-heading" className="md:border-l md:border-line md:pl-8">
              <h2 id="account-details-heading" className="text-sm font-bold text-ink">
                Account details
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4 border-b border-line/70 pb-3">
                  <dt className="text-muted">Email</dt>
                  <dd className="max-w-[60%] truncate text-right font-medium text-ink">{user.email}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 border-b border-line/70 pb-3">
                  <dt className="text-muted">Member since</dt>
                  <dd className="text-right font-medium text-ink">
                    {user.createdAt ? formatDate(user.createdAt) : 'Not available'}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted">Authentication</dt>
                  <dd className="text-right font-medium text-ink">
                    {appMode === 'firebase' ? 'Firebase Authentication' : 'Local demo mode'}
                  </dd>
                </div>
              </dl>
              <div className="mt-6 rounded-xl border border-line bg-canvas/70 p-4 text-xs leading-relaxed text-muted">
                Your email is readable only by you in the database rules. Rooms store your display
                name and user ID so other members can see who is present.
              </div>
            </section>
          </div>
        </Card>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink">Sign out of BrainCircle</h2>
            <p className="mt-1 text-xs text-muted">
              Your seats are released so another student can take them.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void signOut()}
            icon={<LogOut className="size-4" />}
            className="text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
