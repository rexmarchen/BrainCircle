# BrainCircle

**Find your circle. Focus together.**

Better together. Smarter every day.

BrainCircle is a live study-room finder for students. Browse rooms by subject, take a hard-limited seat, and see who is focusing right now. There is no video, voice, or in-room chat — just presence, small circles, and a room that closes when the last person leaves.

This repository is a complete React + TypeScript application with Firebase Authentication, Realtime Database, security rules, local demo mode, tests, and deployment configuration.

---

## Feature set

- Landing page with live room counts sourced from real room records (no invented statistics or testimonials).
- Explore page with subject filters, search across room name/subject/description/host, availability filtering, and sorting.
- Room creation with validation, sensible capacity limits (2–20), and automatic first seat for the host.
- Live room page with participant list, seat count, connection status, share link, join/leave, and confirmation before leaving.
- Duplicate membership prevention: a participant is keyed by Firebase UID, so multiple tabs cannot take two seats.
- Atomic last-seat handling: seats are claimed with Realtime Database transactions.
- Full and closed room rejection in both the UI and database rules.
- Automatic room closure when the last member explicitly leaves.
- Presence via `onDisconnect`, a 30-second heartbeat, stale-member cleanup, and refresh/reconnect seat restoration.
- Email/password authentication with display names, persistent sessions, protected routes, and password visibility toggles.
- Owner-only profile data; public room discovery data is deliberately limited to room copy, display names, UIDs, seats, and timestamps.
- Reusable design system: buttons, fields, badges, avatars, dialogs, skeletons, alerts, empty states, toasts, and responsive layouts.
- Explicit demo mode for development and previews. Demo data never masquerades as production data.
- TypeScript, ESLint, Vitest, Testing Library, and Firebase rules tests.

Intentionally excluded: video calling, voice calling, WebRTC, Zoom/Meet/Agora integrations, in-room chat, fabricated activity counters, fabricated testimonials, and fake trust logos.

---

## Stack

| Area | Choice |
| --- | --- |
| UI | React 19, TypeScript 6, Vite 8, Tailwind CSS 4 |
| Routing | React Router 7 |
| Forms | React Hook Form + Zod 4 |
| Backend | Firebase Authentication + Firebase Realtime Database 13 |
| Tests | Vitest 5, Testing Library, `@firebase/rules-unit-testing` |
| Lint | ESLint 10, typescript-eslint, React Hooks rules |

---

## Quick start

Requirements:

- Node.js 22.12 or newer (Node 24 recommended)
- npm 11+
- Java 11+ only if you want to run the Realtime Database emulator and rules tests

```bash
npm install
```

### Demo mode (no Firebase project needed)

```bash
npm run dev
```

With no Firebase environment variables, the dev server automatically uses the **explicit local demo backend**. A permanent amber banner explains that rooms and accounts live in this browser only.

### Firebase mode

```powershell
Copy-Item .env.example .env.local
# fill in the five VITE_FIREBASE_* values
npm run dev
```

In a production build without Firebase configuration, the app does **not** silently fall back to demo data. It shows a setup page with the missing variable names and an explicit “Continue in demo mode” opt-in. You can also force a demo build with `VITE_DEMO_MODE=true`.

---

## Firebase setup

1. **Create a Firebase project** in the [Firebase console](https://console.firebase.google.com/).
2. **Add a Web app** under Project settings → General → Your apps.
3. **Enable Email/Password** under Authentication → Sign-in method.
4. **Create a Realtime Database** (not Firestore). Choose a region close to your users.
5. **Copy the web config** into `.env.local`:

   ```dotenv
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_APP_ID=1:...
   VITE_DEMO_MODE=false
   ```

   Firebase web API keys are public identifiers, not admin secrets. Never put an Admin SDK service account in a frontend environment variable.

6. **Authorize domains.** Authentication → Settings → Authorized domains must include `localhost` and every deployed domain (for example `braincircle.vercel.app` and your custom domain).

7. **Deploy the database rules.**

   ```powershell
   Copy-Item .firebaserc.example .firebaserc
   # edit .firebaserc so "default" is your project id
   npx firebase login
   npx firebase deploy --only database
   ```

   `.firebaserc` is intentionally gitignored so a local project choice cannot be committed by mistake. You can also paste `database.rules.json` into the Realtime Database → Rules tab in the console. The rules file is the source of truth in this repository; do not hand-edit rules in the console without copying the change back.

8. **Run the app** with `npm run dev`.

### Optional: local Firebase emulators

The app can point at the Auth emulator (port 9099) and Database emulator (port 9000) during development:

```dotenv
VITE_USE_FIREBASE_EMULATORS=true
```

```bash
npm run emulators
npm run dev
```

The emulator flag is only honored by `import.meta.env.DEV`; production builds ignore it. All five `VITE_FIREBASE_*` values must be present so the app selects Firebase mode. Set `VITE_FIREBASE_PROJECT_ID=demo-braincircle` to match the emulator namespace started by `npm run emulators`; the other values may be placeholders.

---

## Data model

```text
users/{uid}
  displayName
  email
  createdAt
  updatedAt

rooms/{roomId}
  name
  subject
  description
  creatorId
  creatorName
  maxCapacity          // 2..20
  status               // "open" | "closed"
  createdAt
  closedAt?

  participants/{uid}
    uid
    displayName
    joinedAt
    lastSeenAt
    seat
    seatKey

  seats/{seatIndex}    // "0".."19"
    uid
    claimedAt
```

### Why both participants and seats?

A participant record alone cannot enforce capacity safely: two clients could both write member #5 and then both believe they are inside. The `seats` subtree acts as a set of capacity tokens:

- Seat indexes are only writable up to `maxCapacity`; the rules enumerate all 20 possible indexes.
- A member is only valid if their `seatKey` points at a seat whose `uid` matches their authenticated UID.
- A seat can only be claimed when empty, by the authenticated user.
- A member cannot release their seat while their participant record still exists. This closes a capacity-bypass edge case where a member could free a seat without leaving.
- A member's participant write is rejected when the room is closed or the seat is not theirs.

The client claims a seat with `runTransaction`, then writes the participant record. If the participant write fails, the client releases its seat. Concurrent claims for the last seat resolve to one winner; the loser receives “room full”.

No stored participant count is trusted. The UI derives occupancy from `Object.keys(participants)`.

---

## Room lifecycle and presence

| Event | Behaviour |
| --- | --- |
| Create | Room is created open with no participants/seats. The creator immediately claims seat `0` and joins. |
| Join | Transactionally claim a free seat; write a participant keyed by UID; register `onDisconnect` for both paths. |
| Duplicate join | The backend sees the existing UID and returns `already-member` without taking another seat. |
| Heartbeat | Every 30 seconds the participant updates `lastSeenAt`. A member is shown as live for 75 seconds after their last heartbeat. |
| Explicit leave | Remove participant, release seat, close the room if no participants remain. |
| Tab close / network drop | `onDisconnect` removes the participant and seat. A connected client closes the long-empty room the next time it observes it. |
| Refresh / reconnect | The tab remembers its seat in `sessionStorage`, restores it if the room is still open, and attempts a silent rejoin after the network comes back. |
| Stale members | Participants without a heartbeat for 5 minutes can be removed by cleanup. |
| Stale seats | A seat without a participant can be reclaimed after 45 seconds. |
| Empty rooms | Open rooms with no participants and a creation time older than 10 minutes are closed by the client-side reaper. |

Closed rooms remain readable by direct link so visitors understand what happened, but cannot be joined or reopened through the client.

### Presence cleanup is eventual, not instant

This project deliberately does **not** use Cloud Functions (see limitations). Regular client code performs cleanup:

- A crash/disconnect removes participants via `onDisconnect`, but the room-close write needs a connected observer. That can take until the next visitor or the 10-minute reaper.
- Cleanup runs only while clients are online. A completely abandoned project can retain an empty room open until someone visits.

---

## Security rules

`database.rules.json` is deny-by-default:

- Root `.read` and `.write` are `false`.
- `users/{uid}` is readable and writable only by that authenticated UID. Emails never appear in public room data.
- `rooms` is publicly readable. This powers live discovery before sign-in and exposes room copy, creator/participant display names, UIDs, seats, heartbeats, and timestamps. It does **not** expose emails or passwords.
- Room creation is restricted to the authenticated creator, requires status `open`, and forbids pre-seeded participants or seats.
- Room creation and all later writes validate name/subject/description lengths, integer capacity, status values, and timestamp bounds.
- The room creator cannot change room identity after creation; only lifecycle fields (`status`, `closedAt`) can be written by an authenticated client, and only while the room has no participants.
- A participant record must match the authenticated UID, be backed by an owned seat, keep its original `seatKey`, and use approved fields only.
- A seat can only be claimed within `maxCapacity`, by its owner, while the room is open. A seat cannot be released while a participant still occupies it.
- Unknown fields are rejected at every level.
- Future timestamps are bounded so a client cannot freeze a ghost membership far into the future.

An important Realtime Database detail: `.validate` rules at an ancestor are evaluated when descendants are written. The room-level validate rule therefore only validates stable room fields; creation-only conditions such as “no participants/seats yet” live in the room's `.write` rule. Without that split, the first seat or participant write would be rejected.

### Automated rules tests

Fifteen rules tests run against the real Realtime Database emulator:

```bash
npm run rules:test
```

They cover unauthenticated creation, private profiles, public room reads, input validation, capacity, seat stealing, participant spoofing, the seat-release bypass, non-owner mutation, stale cleanup, timestamp bounds, closing occupied rooms, and rejecting joins to closed rooms.

The emulator requires Java. On Windows, if a failed run leaves port 9000 occupied, stop the leftover Java process before rerunning:

```powershell
Get-Process java | Stop-Process -Force
```

---

## Demo mode boundary

Demo mode is a **browser-local implementation**, not a second production backend.

| Condition | Mode | User-visible signal |
| --- | --- | --- |
| `VITE_DEMO_MODE=true` | Demo | Permanent demo banner |
| Dev server with no Firebase config | Demo | Permanent demo banner |
| Production build with no Firebase config | Setup page | Explicit opt-in before demo |
| All five Firebase values present | Firebase | No demo banner |

Demo details:

- Rooms persist in `localStorage`; cross-tab updates use `BroadcastChannel` on a best-effort basis.
- Accounts are local. Passwords are salted and hashed with PBKDF2-SHA-256 (150,000 iterations), never stored in plaintext, but the data is still accessible to same-origin browser code. Demo authentication is not a security boundary.
- Password reset is unavailable in demo mode; the UI explains this.
- Capacity and lifecycle rules are enforced by demo code, not by a server. Concurrent tabs can race because there is no shared transactional server.
- Demo data is not multi-device and should never be presented as a real backend.
- To clear demo data, remove the `braincircle:demo:*` keys from `localStorage` and `sessionStorage`.

---

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and create a production build in `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | `tsc -b` across app and tooling configs |
| `npm run lint` | ESLint |
| `npm test` | Unit/component tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run rules:test` | Start the Database emulator and run security-rules tests |
| `npm run emulators` | Start Auth + Database emulators for manual app testing |
| `npm run verify` | Typecheck, lint, unit tests, production build |
| `npm run verify:all` | `verify` plus emulator-backed rules tests |

The suite that was actually executed for this build:

- `npm run typecheck` — passed
- `npm run lint` — passed with no warnings
- `npm test` — **53 tests across 10 files**, passed
- `npm run build` — passed; production assets emitted to `dist/`
- `npm run rules:test` — **15 rules tests**, passed against `firebase-tools` Database emulator

The Firebase browser backend was type-checked and built, and its rules were exercised in the emulator. It was **not** end-to-end tested against a live Firebase project because no project credentials were supplied.

---

## Deployment

### Vercel

1. Push the repository to GitHub/GitLab.
2. Import the project in Vercel.
3. Vercel detects Vite; confirm:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add the five `VITE_FIREBASE_*` environment variables for Production (and Preview if desired).
5. Deploy. `vercel.json` supplies SPA rewrites, immutable asset caching, and basic security headers.
6. Add the deployed domain to Firebase Authentication → Settings → Authorized domains.
7. Deploy the database rules separately:

   ```bash
   npx firebase deploy --only database
   ```

### Firebase Hosting

```bash
npm run build
npx firebase deploy --only hosting,database
```

`firebase.json` serves `dist/`, rewrites all routes to `index.html`, and sets cache/security headers.

### Post-deploy checklist

- [ ] `VITE_DEMO_MODE` is unset or `false`.
- [ ] All five Firebase values are present in the deployment environment.
- [ ] Email/Password is enabled in Firebase Authentication.
- [ ] The production domain is in Authorized domains.
- [ ] `database.rules.json` is deployed to the correct project/database.
- [ ] Two browsers can create, join, fill, and leave a room.
- [ ] A third browser is rejected when the room is full.
- [ ] Closing a member's tab eventually frees their seat.
- [ ] A room closes when its last member leaves.
- [ ] Password reset works with a real email.
- [ ] `npm run verify` and `npm run rules:test` pass in CI.
- [ ] For social previews, replace the relative `og:image` URL in `index.html` with the absolute deployed URL.

### Environment variable safety

Only Vite `VITE_*` variables are exposed to the browser. Keep the following out of the repository and out of frontend env files:

- Firebase Admin SDK service-account JSON
- CI tokens
- SMTP credentials
- Any private API keys

`.gitignore` excludes environment files, service-account patterns, build output, logs, emulator state, and coverage.

---

## Project structure

```text
BrainCircle/
├─ database.rules.json          # authoritative Realtime Database rules
├─ firebase.json                # Hosting, rules, emulator ports, headers
├─ .env.example                 # documented Firebase and emulator variables
├─ .firebaserc.example          # copy to the gitignored .firebaserc
├─ vercel.json                  # SPA rewrites, caching, security headers
├─ vitest.rules.config.ts       # Emulator-only test runner config
├─ rules-tests/
│  └─ database.rules.test.ts    # 15 security-rules tests
├─ src/
│  ├─ app/
│  │  ├─ App.tsx                # mode gate + providers
│  │  ├─ config.ts              # env config, demo/unconfigured resolution
│  │  └─ providers/             # AuthProvider, ToastProvider
│  ├─ components/
│  │  ├─ layout/                # Navbar, Footer, AuthLayout, demo banner
│  │  ├─ rooms/                 # cards, filters, participants, actions
│  │  └─ ui/                    # design-system primitives
│  ├─ config/rooms.ts           # limits, presence TTLs, derived selectors
│  ├─ firebase/                 # lazy client + private profile helpers
│  ├─ hooks/                    # rooms, membership/presence, reaper, auth
│  ├─ pages/                    # landing, explore, create, room, auth, profile, 404
│  ├─ routes/                   # route map + protected route
│  ├─ services/
│  │  ├─ demo/                  # local auth + room backends
│  │  ├─ firebase/              # Firebase auth + transactional room backend
│  │  └─ index.ts               # explicit backend selection
│  ├─ styles/index.css          # Tailwind + design tokens
│  ├─ test/                     # setup, factories, fake auth service
│  ├─ types/                    # auth, room, error types
│  ├─ utils/                    # filters, formatting, redirects, avatars
│  └─ validation/schemas.ts     # Zod auth/room/profile schemas
└─ README.md
```

---

## Limitations and trade-offs

These are deliberate for a no-billing hackathon deployment:

1. **No Cloud Functions.** The project uses client transactions plus security rules instead of trusted server code. Deploying functions requires the Blaze plan and billing. With a paid project, a scheduled function could close abandoned rooms and a callable function could own seat allocation and rate limiting.
2. **Seat squatting is possible.** An authenticated malicious client can claim every seat and never join. Orphan seats become reclaimable after 45 seconds, but there is no server-side rate limit or identity check beyond Firebase Auth. This is the main reason trusted functions are recommended for a public launch.
3. **Cleanup is client-driven.** Disconnect presence frees seats, but closing a room after an abandoned session requires a connected client or the 10-minute reaper. Empty rooms are not closed while nobody visits.
4. **Room data is public.** At the database level, anyone can read rooms, participant UIDs, display names, seats, and heartbeat timestamps. This supports live discovery. Emails are owner-only. If privacy requirements grow, route discovery through a server/API or add a public projection.
5. **Client clocks drive staleness.** Room/member timestamps are bounded against future values, but clock skew still affects heartbeat and cleanup timing.
6. **No email verification requirement.** Firebase accounts can join without a verified email address.
7. **No moderation, reporting, or chat.** There is no user-generated text beyond room name/description and display name, and no admin console.
8. **Demo mode is not a production backend.** It is local, non-transactional across tabs, and clearly labelled.
9. **Firebase deployment is not automated here.** Rules and hosting must be deployed with your own project credentials. Nothing was pushed or deployed by this build.
10. **Live Firebase integration was not executed.** No Firebase project was available. The rules were tested against the emulator, and the client compiles and builds, but you should run the post-deploy checklist against a real project before presenting it.

---

## License

No license has been declared. Treat this as a hackathon submission unless a license is added.
