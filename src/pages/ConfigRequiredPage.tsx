import { Database, KeyRound, Rocket, ShieldCheck, Terminal, UserCheck } from 'lucide-react'
import { acknowledgeDemoMode, missingFirebaseKeys } from '@/app/config'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const steps = [
  {
    icon: <Database className="size-4" aria-hidden="true" />,
    title: 'Create a Firebase project',
    body: 'Add a Realtime Database and enable Email/Password under Authentication → Sign-in method.',
  },
  {
    icon: <KeyRound className="size-4" aria-hidden="true" />,
    title: 'Add the web app config',
    body: 'Copy .env.example to .env.local and fill in VITE_FIREBASE_API_KEY, AUTH_DOMAIN, DATABASE_URL, PROJECT_ID, and APP_ID.',
  },
  {
    icon: <UserCheck className="size-4" aria-hidden="true" />,
    title: 'Authorize your domains',
    body: 'Add localhost and your deployment domain under Authentication → Settings → Authorized domains.',
  },
  {
    icon: <ShieldCheck className="size-4" aria-hidden="true" />,
    title: 'Deploy the database rules',
    body: 'Run firebase deploy --only database so capacity and lifecycle rules are enforced server-side.',
  },
]

export function ConfigRequiredPage() {
  useDocumentTitle('Finish setup')

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Logo />
        <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
          <Rocket className="size-3.5" aria-hidden="true" />
          One step before launch
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          BrainCircle needs its Firebase project.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          This production build has no Firebase configuration, so live rooms are switched off. We
          do not fall back to fake data silently. Finish the setup below, or explicitly continue in
          local demo mode.
        </p>

        <div className="mt-8 space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="flex gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                {step.icon}
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink">
                  {index + 1}. {step.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        {missingFirebaseKeys.length > 0 ? (
          <div className="mt-6 rounded-xl border border-line bg-surface p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Missing variables</p>
            <ul className="mt-2 space-y-1 font-mono text-xs text-ink-soft">
              {missingFirebaseKeys.map((key) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            onClick={() => {
              acknowledgeDemoMode()
              window.location.reload()
            }}
          >
            Continue in demo mode
          </Button>
          <span className="text-xs leading-relaxed text-muted">
            Demo mode keeps accounts and rooms in this browser only. It is clearly labelled and is
            not a production backend.
          </span>
        </div>

        <div className="mt-10 rounded-2xl border border-line bg-surface p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Terminal className="size-4 text-brand-600" aria-hidden="true" />
            Or build a self-contained demo
          </h2>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-ink px-4 py-3 text-xs text-white/85">
            <code>{'# .env.production.local\nVITE_DEMO_MODE=true\n\nnpm run build'}</code>
          </pre>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            See the README for the full Firebase, rules, and deployment walkthrough.
          </p>
        </div>
      </div>
    </div>
  )
}
