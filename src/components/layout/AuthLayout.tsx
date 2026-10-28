import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

const benefits = [
  'A live seat in a small, focused circle',
  'No video calls, no microphones, no downloads',
  'Leave anytime — your seat frees up instantly',
]

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="container-page py-10 lg:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-line bg-surface shadow-card lg:grid-cols-[1.05fr_1fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-900 p-10 text-white lg:flex">
          <div
            className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-violet-accent/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-cyan-accent/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            <Logo inverted />
            <p className="mt-14 max-w-xs text-[1.7rem] font-extrabold leading-tight tracking-tight">
              Better together.
              <br />
              Smarter every day.
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              BrainCircle makes it easy to find the people who are studying what you are studying —
              right now.
            </p>
            <ul className="mt-8 space-y-3.5">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-white/85">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden="true" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mt-12 flex items-center gap-2 text-xs font-medium text-white/55">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Study circles, without the schedule Tetris.
          </div>
        </div>

        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
            <Logo />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[1.7rem]">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
          </div>
          <div className="mt-7">{children}</div>
          <div className="mt-7 border-t border-line pt-5 text-sm text-muted">{footer}</div>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-md text-center text-xs leading-relaxed text-muted">
        BrainCircle rooms are text-free study spaces. We never ask for camera or microphone access.{' '}
        <Link to="/how-it-works#privacy" className="font-semibold text-brand-700 hover:underline">
          How your data works
        </Link>
        .
      </p>
    </div>
  )
}
