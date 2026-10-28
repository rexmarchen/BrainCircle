import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageLoader } from '@/components/ui/PageLoader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { signUpSchema, type SignUpValues } from '@/validation/schemas'
import { authErrorMessage } from '@/utils/authErrors'
import { safeRedirect } from '@/utils/navigation'

export function SignupPage() {
  useDocumentTitle('Create your account')
  const { user, loading, signUp } = useAuth()
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get('redirect'))
  const navigate = useNavigate()
  const toast = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  })

  if (loading) return <PageLoader label="Checking your session…" />
  if (user) return <Navigate to={redirect} replace />

  const onSubmit = async (values: SignUpValues) => {
    setFormError(null)
    try {
      await signUp({
        displayName: values.displayName,
        email: values.email,
        password: values.password,
      })
      toast.success('Your account is ready', 'Now find a circle and take a seat.')
      navigate(redirect, { replace: true })
    } catch (error) {
      setFormError(authErrorMessage(error))
    }
  }

  return (
    <AuthLayout
      title="Find your circle"
      subtitle="Create an account in under a minute. Your display name is the only profile detail other students see."
      footer={
        <p>
          Already have an account?{' '}
          <Link
            to={`/login${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="font-semibold text-brand-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5" noValidate>
        {formError ? (
          <Alert tone="danger" icon={<AlertCircle className="size-4" />}>
            {formError}
          </Alert>
        ) : null}

        <Input
          label="Display name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Ananya Sharma"
          required
          maxLength={40}
          icon={<UserRound className="size-4" aria-hidden="true" />}
          hint="This is what other students see in a room."
          error={errors.displayName?.message}
          {...register('displayName')}
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@university.edu"
          required
          icon={<Mail className="size-4" aria-hidden="true" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          icon={<LockKeyhole className="size-4" aria-hidden="true" />}
          hint="Use 8 or more characters. We never store your password in plain text."
          error={errors.password?.message}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-canvas-deep hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-500"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repeat your password"
          required
          icon={<LockKeyhole className="size-4" aria-hidden="true" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <p className="text-xs leading-relaxed text-muted">
          By creating an account you agree to keep rooms respectful and focused. BrainCircle never
          requests camera or microphone access.
        </p>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Create free account
        </Button>
      </form>
    </AuthLayout>
  )
}
