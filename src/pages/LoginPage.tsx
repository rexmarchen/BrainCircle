import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageLoader } from '@/components/ui/PageLoader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { signInSchema, type SignInValues } from '@/validation/schemas'
import { authErrorMessage } from '@/utils/authErrors'
import { safeRedirect } from '@/utils/navigation'
import { appMode } from '@/app/config'

export function LoginPage() {
  useDocumentTitle('Sign in')
  const { user, loading, signIn, sendPasswordReset } = useAuth()
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get('redirect'))
  const navigate = useNavigate()
  const toast = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [resetPending, setResetPending] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  if (loading) return <PageLoader label="Checking your session…" />
  if (user) return <Navigate to={redirect} replace />

  const onSubmit = async (values: SignInValues) => {
    setFormError(null)
    try {
      await signIn(values.email, values.password)
      toast.success('Welcome back', 'Your study circle is waiting.')
      navigate(redirect, { replace: true })
    } catch (error) {
      setFormError(authErrorMessage(error))
    }
  }

  const handleReset = async () => {
    const email = getValues('email').trim()
    if (!email) {
      setError('email', { message: 'Enter your email address first.' })
      return
    }
    setResetPending(true)
    try {
      await sendPasswordReset(email)
      toast.success('Reset email sent', `Check ${email} for a link to reset your password.`)
    } catch (error) {
      toast.error('Could not send a reset email', authErrorMessage(error))
    } finally {
      setResetPending(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to take your seat and keep your study circle moving."
      footer={
        <p>
          New to BrainCircle?{' '}
          <Link
            to={`/signup${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="font-semibold text-brand-700 hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {formError ? (
          <Alert tone="danger" icon={<AlertCircle className="size-4" />}>
            {formError}
          </Alert>
        ) : null}

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

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Your password"
            required
            icon={<LockKeyhole className="size-4" aria-hidden="true" />}
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
          <div className="mt-1.5 flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={resetPending}
              className="rounded text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800 hover:underline disabled:opacity-60"
            >
              {resetPending ? 'Sending…' : 'Forgot password?'}
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>

        {appMode === 'demo' ? (
          <p className="text-center text-xs leading-relaxed text-muted">
            Demo mode is on. Sign in with an account you created in this browser, or{' '}
            <Link to="/signup" className="font-semibold text-brand-700 hover:underline">
              create one now
            </Link>
            .
          </p>
        ) : null}
      </form>
    </AuthLayout>
  )
}
