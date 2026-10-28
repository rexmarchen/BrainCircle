import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  DoorOpen,
  KeyRound,
  LockKeyhole,
  Radio,
  ShieldCheck,
  Users,
  WifiOff,
} from 'lucide-react'
import { appMode } from '@/app/config'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Badge } from '@/components/ui/Badge'
import { buttonStyles } from '@/components/ui/Button'
import { Card } from '@/components/ui/Feedback'

const FAQS = [
  {
    question: 'Do I need a camera or microphone?',
    answer:
      'No. BrainCircle is a presence-first study room finder. There are no video calls, voice calls, or in-room chat. You join, see who else is focused on the same subject, and study.',
  },
  {
    question: 'What happens if my internet drops?',
    answer:
      'Firebase connection presence removes your participant record shortly after the connection drops, which frees your seat. When the connection returns while you are on the room page, BrainCircle automatically tries to reclaim your seat. If the room filled up or closed while you were away, the app tells you instead of pretending you are still in.',
  },
  {
    question: 'Can a room go over capacity?',
    answer:
      'No. Seats are claimed with database transactions and validated by security rules. Two simultaneous attempts for the last seat resolve to exactly one winner; the other receives a friendly “room full” message.',
  },
  {
    question: 'When does a room close?',
    answer:
      'When the last member leaves, the room closes immediately. If everyone disappears because of a crash or lost connection, connection presence removes their seats and connected clients close the long-empty room after a grace period. Closed rooms remain readable through their link but can never be joined.',
  },
  {
    question: 'Who can see my email?',
    answer:
      'Only you. Profile documents are readable and writable only by their owner. Public room data contains your display name, user ID, join times, and presence heartbeat — never your email or password.',
  },
  {
    question: 'Is this a video or voice product?',
    answer:
      'No, by design. Zoom, Google Meet, Agora, and WebRTC are intentionally excluded from this challenge build. BrainCircle helps you find the circle; you decide how to study together.',
  },
]

export function HowItWorksPage() {
  useDocumentTitle('How it works')

  return (
    <div>
      <section className="border-b border-line bg-surface/60">
        <div className="container-page py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">How BrainCircle works</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-[2.8rem]">
              A live seat, a small circle, and nothing else to manage.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              BrainCircle is built around one object: the study room. Rooms are created by students,
              capped at a small number of seats, and closed as soon as they are empty. Everything
              else — discovery, joining, presence, and cleanup — exists to keep that loop honest.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Link to="/rooms" className={buttonStyles({})}>
                Explore live rooms
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link to="/rooms/create" className={buttonStyles({ variant: 'outline' })}>
                Create a room
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-page">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: <BookOpen className="size-5" />,
                title: 'Pick a subject',
                body: 'Search by room name, subject, or host. Filter to seats that are actually available.',
              },
              {
                icon: <DoorOpen className="size-5" />,
                title: 'Take a seat',
                body: 'Joining claims one of the room’s hard-limited seats. You can leave whenever you want.',
              },
              {
                icon: <Users className="size-5" />,
                title: 'Stay in the loop',
                body: 'Participant lists and counts are live. No refresh button, no stale attendee lists.',
              },
            ].map((item, index) => (
              <Card key={item.title} className="p-6">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    {item.icon}
                  </span>
                  <span className="text-xs font-extrabold text-line-strong">0{index + 1}</span>
                </div>
                <h2 className="mt-5 text-base font-bold text-ink">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="lifecycle" className="scroll-mt-24 border-y border-line bg-surface/60 py-14 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Badge variant="brand">Lifecycle</Badge>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              What happens between “join” and “closed”
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Every seat is backed by two records: a participant entry keyed by your user ID, and a
              capacity token in a seat slot. Security rules tie them together, so clients can never
              invent a membership or write past the limit.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              A heartbeat refreshes your presence every 30 seconds. If your browser disappears, the
              server’s connection presence removes your participant record and frees the seat.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                icon: <Users className="size-4" />,
                title: 'Join is a race with one winner',
                body: 'The client claims a seat with a Realtime Database transaction. Concurrent attempts for the same seat are retried and resolved by the server. The participant write only succeeds if the seat is yours and the room is still open.',
              },
              {
                icon: <Radio className="size-4" />,
                title: 'Presence keeps the list honest',
                body: 'While connected, a heartbeat marks you as live. On disconnect, onDisconnect removes your membership. Stale claims and stale members are swept by the next visitor after a short grace period.',
              },
              {
                icon: <WifiOff className="size-4" />,
                title: 'Reconnection is handled',
                body: 'When your connection returns, BrainCircle attempts to rejoin if you were a member and the room is still open. If the room closed or filled, you get a clear message — never a phantom seat.',
              },
              {
                icon: <DoorOpen className="size-4" />,
                title: 'The last leave closes the room',
                body: 'Leaving removes your participant record and seat, then closes the room when no participants remain. A room with zero participants is never joinable after it has closed.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
                <div className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    {item.icon}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-ink">{item.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="scroll-mt-24 py-14 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <Badge variant="success" icon={<LockKeyhole className="size-3.5" />}>
              Privacy
            </Badge>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Public rooms, private account details
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Study room discovery is public so students can see what is happening before signing
              in. Room records contain only the room copy, creator and participant display names,
              seats, timestamps, and presence.
            </p>
            <ul className="mt-5 space-y-3">
              {[
                'Email addresses live only in your private profile document.',
                'Passwords are handled by Firebase Authentication and never stored by BrainCircle.',
                'Security rules deny all writes by default and validate every room field.',
                'The app never asks for camera or microphone permissions.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div id="safety" className="scroll-mt-24">
            <Badge variant="warning" icon={<ShieldCheck className="size-3.5" />}>
              Safety
            </Badge>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Small rooms, clear boundaries
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Capacity limits and ephemeral rooms keep circles small. Because there is no in-room
              chat or calling, there is no private messaging surface to moderate. Your display name
              is visible in rooms you join — choose one you are comfortable sharing.
            </p>
            <div className="mt-5 rounded-2xl border border-line bg-surface p-5 shadow-card">
              <h3 className="text-sm font-bold text-ink">If a room isn't right for you</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Leave immediately. Your seat is released and the participant list updates for
                everyone. If you were the last member, the room closes itself.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="scroll-mt-24 border-y border-line bg-surface/60 py-14 sm:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <Badge variant="brand" icon={<Database className="size-3.5" />}>
              Data &amp; demo mode
            </Badge>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Real Firebase by default. Explicit demo mode when configured that way.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              In production, rooms and accounts use Firebase Authentication and Realtime Database,
              with security rules enforcing capacity and lifecycle. The demo backend is a clearly
              labelled, browser-local fallback for development and preview builds — it never
              silently replaces Firebase in a configured deployment.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-surface p-5">
                <h3 className="text-sm font-bold text-ink">Firebase mode</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  Requires the five VITE_FIREBASE_* variables. Rooms sync live across devices and
                  tabs, and the deployed database rules are the source of truth for capacity.
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <h3 className="text-sm font-bold text-ink">Demo mode</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  Enabled automatically by a dev server without config, or explicitly with
                  VITE_DEMO_MODE=true. Accounts and rooms live in this browser. A banner is always
                  visible.
                </p>
              </div>
            </div>

            {appMode !== 'firebase' ? (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
                <p className="font-bold">You are currently in demo mode.</p>
                <p className="mt-1">
                  This page is using the local demo backend. See the README for the exact Firebase
                  project setup, environment variables, and rules deployment steps.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-page mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Questions</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              The short answers
            </h2>
          </div>
          <div className="mt-7 divide-y divide-line rounded-2xl border border-line bg-surface px-5 shadow-card sm:px-6">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink marker:content-none">
                  {faq.question}
                  <span className="text-muted transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="mt-2.5 pr-6 text-sm leading-relaxed text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-line bg-brand-50/50 p-6 text-center">
            <KeyRound className="size-5 text-brand-700" aria-hidden="true" />
            <p className="text-sm font-bold text-ink">Ready to see it with your own circle?</p>
            <Link to="/rooms" className={buttonStyles({})}>
              Explore Study Rooms
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
