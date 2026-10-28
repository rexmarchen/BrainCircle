import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, Home } from 'lucide-react'
import { buttonStyles } from '@/components/ui/Button'
import { LogoMark } from '@/components/ui/Logo'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <div className="relative mb-6">
        <div
          className="absolute inset-0 -z-10 scale-150 rounded-full bg-brand-100/60 blur-2xl"
          aria-hidden="true"
        />
        <LogoMark className="size-16" />
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">404 · Out of orbit</p>
      <h1 className="mt-3 max-w-lg text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        You've wandered out of the circle.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        This page doesn't exist, or the room link has expired. The good news: there are live study
        circles waiting for you.
      </p>
      <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
        <Link to="/" className={buttonStyles({ variant: 'outline' })}>
          <Home className="size-4" aria-hidden="true" />
          Back home
        </Link>
        <Link to="/rooms" className={buttonStyles({})}>
          <Compass className="size-4" aria-hidden="true" />
          Explore rooms
        </Link>
      </div>
      <Link
        to="/how-it-works"
        className="mt-8 inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Or see how BrainCircle works
      </Link>
    </div>
  )
}
