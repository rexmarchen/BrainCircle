import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  LayoutGrid,
  LogOut,
  Menu,
  Plus,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { Button, buttonStyles } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { useSignOut } from '@/hooks/useSignOut'
import { cn } from '@/utils/cn'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/rooms', label: 'Explore Rooms', end: false },
  { to: '/how-it-works', label: 'How It Works', end: false },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-canvas-deep hover:text-ink',
  )
}

function UserMenu() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const signOut = useSignOut()

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!user) return null

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-xl border border-transparent p-1 pr-2 transition-colors hover:border-line hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
      >
        <Avatar name={user.displayName} uid={user.uid} size="sm" />
        <span className="hidden max-w-28 truncate text-sm font-semibold text-ink sm:block">
          {user.displayName}
        </span>
        <ChevronDown
          className={cn('size-4 text-muted transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-[calc(100%+0.5rem)] w-56 animate-pop overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-pop"
        >
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-ink">{user.displayName}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{user.email}</p>
          </div>
          <Link
            to="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-canvas-deep hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            <UserRound className="size-4" aria-hidden="true" />
            Your profile
          </Link>
          <Link
            to="/rooms/create"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-canvas-deep hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            <Plus className="size-4" aria-hidden="true" />
            Create a room
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              void signOut()
            }}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-line px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-500"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function Navbar() {
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const signOut = useSignOut()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? (
            <div className="skeleton h-9 w-40 rounded-xl" aria-hidden="true" />
          ) : user ? (
            <>
              <Link to="/rooms/create" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
                <Plus className="size-4" aria-hidden="true" />
                Create room
              </Link>
              <UserMenu />
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'h-10' })}
              >
                Sign in
              </Link>
              <Link to="/signup" className={buttonStyles({ size: 'sm', className: 'h-10' })}>
                Get started
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {!loading && !user ? (
            <Link to="/signup" className={buttonStyles({ size: 'sm', className: 'h-9 px-3' })}>
              Get started
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-ink-soft transition-colors hover:border-brand-200 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-500"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div id="mobile-navigation" className="border-t border-line bg-surface md:hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-3 py-2.5 text-sm font-semibold',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-canvas-deep',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-3 border-t border-line pt-3">
              {user ? (
                <>
                  <p className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    <Avatar name={user.displayName} uid={user.uid} size="xs" />
                    {user.displayName}
                  </p>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-canvas-deep"
                  >
                    <UserRound className="size-4" aria-hidden="true" />
                    Your profile
                  </Link>
                  <Link
                    to="/rooms/create"
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-canvas-deep"
                  >
                    <LayoutGrid className="size-4" aria-hidden="true" />
                    Create a room
                  </Link>
                  <Button
                    variant="ghost"
                    className="mt-1 w-full justify-start text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    icon={<LogOut className="size-4" />}
                    onClick={() => {
                      setMobileOpen(false)
                      void signOut()
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    className={buttonStyles({ variant: 'outline', className: 'w-full' })}
                  >
                    Sign in
                  </Link>
                  <Link to="/signup" className={buttonStyles({ className: 'w-full' })}>
                    Create your account
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
