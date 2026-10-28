import { Link } from 'react-router-dom'
import { ArrowUpRight, Heart } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/app/providers/AuthProvider'

const productLinks = [
  { to: '/rooms', label: 'Explore rooms' },
  { to: '/rooms/create', label: 'Create a room' },
  { to: '/how-it-works', label: 'How it works' },
]

const accountLinks = [
  { to: '/login', label: 'Sign in' },
  { to: '/signup', label: 'Create an account' },
  { to: '/profile', label: 'Your profile' },
]

export function Footer() {
  const { user } = useAuth()
  const account = user
    ? [
        { to: '/profile', label: 'Your profile' },
        { to: '/rooms/create', label: 'Create a room' },
        { to: '/rooms', label: 'Explore rooms' },
      ]
    : accountLinks

  return (
    <footer className="border-t border-line bg-canvas">
      <div className="container-page">
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Better together. Smarter every day. Find a study circle for the subject you are
              working on — no calls, no clutter, just focused people.
            </p>
            <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted">
              Built for students, with
              <Heart className="size-3.5 text-rose-500" aria-hidden="true" />
              and focus.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Product</h2>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm font-medium text-ink-soft transition-colors hover:text-brand-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Account</h2>
            <ul className="mt-4 space-y-3">
              {account.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm font-medium text-ink-soft transition-colors hover:text-brand-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Trust</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  to="/how-it-works#privacy"
                  className="text-sm font-medium text-ink-soft transition-colors hover:text-brand-700"
                >
                  Data &amp; privacy
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works#safety"
                  className="text-sm font-medium text-ink-soft transition-colors hover:text-brand-700"
                >
                  Room safety
                </Link>
              </li>
              <li>
                <a
                  href="https://firebase.google.com/docs/database/security"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition-colors hover:text-brand-700"
                >
                  Security rules
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} BrainCircle. A study room finder, built for students.</p>
          <p>No video calls. No voice calls. Just a circle that shows up.</p>
        </div>
      </div>
    </footer>
  )
}
