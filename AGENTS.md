# AGENTS.md — SIGNoFF

## What we're building

SIGNoFF is a subscription SaaS for freelancers and small agencies. Agencies run client projects (workspaces, projects, milestones, Kanban tasks, deliverables) and their clients approve work or request changes in their own portal. Agencies pay monthly or annually on Free, Pro and Agency plans. An admin dashboard shows subscribers and monthly revenue.

- **Builder:** solo developer
- **Time budget:** 60 hours
- **Hosting:** Vercel, on a `*.vercel.app` address
- **Priorities when choosing tools:** 1) AI tooling support, 2) documentation quality, 3) time to first feature
- **Dependency goal:** 10 runtime packages or fewer

### Demo mode (important)
This is a portfolio demo, not a live business. It runs on a **Clerk development instance** with Clerk's **development payment gateway** (a shared test Stripe account run by Clerk). No real money is taken and we do **not** need our own Stripe account. Every payment uses Stripe test cards. The app must say so where it matters ("Stripe test mode", "Demo data").

---

## Tech stack

### 1. Framework: Next.js (App Router) + TypeScript, on Vercel
- **Why:** AI tools know it best, its docs are excellent, and Vercel deploys on every push. Server Components and Server Actions remove the need for a separate API layer.
- **Considered:** Next.js plus a separate Express or NestJS API. Rejected because it means two deploys and twice the wiring, which doesn't fit 60 hours.

### 2. Accounts, workspaces and subscriptions: Clerk (`@clerk/nextjs`)
One package covers sign-in, workspaces, team roles, invites and subscriptions.

- **Sign-in:** Clerk's sign-in and sign-up components, placed inside our Sign-in screen layout and styled to match the designs with Clerk's `appearance` setting.
- **Workspaces and team:** Clerk Organizations. Each agency workspace is one organization.
  - Owner = Clerk role `org:admin`
  - Team member = Clerk role `org:member`
  - Team invites and invitation emails are built in.
- **Subscriptions:** Clerk Billing, with plans set up for **Organizations** (each workspace pays, not each person).
  - Plans: Free, Pro, Agency. Pro and Agency each have a monthly and an annual price.
  - Demo prices: Pro $19 a month or $190 a year; Agency $49 a month or $490 a year.
  - Plans and subscriptions live in Clerk. Stripe (through Clerk's gateway) only processes the test payments.
- **AI tooling:** Clerk publishes official agent skills. Install them with `npx skills add clerk/skills`.
- **Considered:** Auth.js plus Stripe Billing used directly. Rejected because Stripe doesn't support businesses in Zimbabwe, and hand-building checkout, webhooks, invites and roles costs about 10–12 extra hours.

### 3. Database: Neon Postgres, added through the Vercel Marketplace
- **Why:** free to start, one environment variable, and already used on Quote Agent.
- **Considered:** Supabase. Its own auth and storage overlap with Clerk and Vercel Blob.

### 4. Database layer: Prisma 7 with `@prisma/adapter-neon` and `@neondatabase/serverless`
- **Why:** the job post names Prisma, so it's also a portfolio signal. It has the best docs, and the typed schema helps AI tools write correct queries.
- **Watch out:** Prisma 7 only connects through driver adapters. AI tools trained on older Prisma often write the old setup. Use the Prisma 7 client setup in `lib/db.ts` and don't change it.
- **Considered:** Drizzle. Lighter and faster to start on Vercel, but it doesn't match the job post and AI tools write it less reliably.

### 5. Styling: Tailwind CSS, with icons as inline SVGs copied from the designs
- **Why:** the designs are already simple layout and style rules, so they translate to Tailwind almost one-to-one. Icons are 1.7 px outline SVGs already drawn in the designs, so no icon package is needed.
- **Considered:** shadcn/ui and lucide-react. They pull in 5–8 extra packages, and the designs are already finished.

### 6. Kanban drag and drop: `@dnd-kit/core`
- **Why:** works with touch and keyboard, which matters because the app must work on phones.
- **Considered:** the browser's built-in drag and drop (no package, but unreliable on phones) and `@hello-pangea/dnd` (heavier).

### 7. File uploads (deliverables): Vercel Blob (`@vercel/blob`)
- **Why:** uploads straight from the browser, one environment variable, same Vercel bill.
- **Considered:** UploadThing or S3 (more setup and another account).

### 8. Form checks: `zod`
- **Why:** checks Server Action inputs (invite forms, approval comments, task edits). AI tools write it fluently.
- **Considered:** checking inputs by hand. Saves a package but costs time and safety.

### Deliberately left out
- **Chart library (e.g. Recharts):** the admin revenue chart is plain styled bars, as in the design.
- **Email service (e.g. Resend):** Clerk sends team and client invitation emails. Approvals show in the in-app activity feed.
- **Extra data-fetching libraries (tRPC, React Query):** Server Actions cover it.
- **Webhook signature package (e.g. svix):** Clerk's own `verifyWebhook` helper from `@clerk/nextjs/webhooks` checks webhook signatures.

---

## Runtime packages (10)

| # | Package | Used for |
|---|---|---|
| 1 | `next` | Framework |
| 2 | `react` | Framework |
| 3 | `react-dom` | Framework |
| 4 | `@clerk/nextjs` (exact version pinned) | Sign-in, workspaces, roles, invites, subscriptions |
| 5 | `@prisma/client` | Database queries |
| 6 | `@prisma/adapter-neon` | Prisma 7 connection to Neon |
| 7 | `@neondatabase/serverless` | Neon driver |
| 8 | `@dnd-kit/core` | Kanban drag and drop |
| 9 | `@vercel/blob` | Deliverable uploads |
| 10 | `zod` | Form and Server Action input checks |

Development-only tools (`prisma`, `typescript`, `tailwindcss` and similar) don't ship to users and don't count towards the limit.

---

## How the features map to Clerk and our database

- **Workspaces and roles:** Clerk Organizations. Use Clerk's role checks (`auth()` and `has({ role })`) in every page and Server Action through one `requireRole()` helper. Roles are exactly two inside a workspace: Owner (`org:admin`) and Team member (`org:member`).
- **Clients:** clients are **not** organization members (Clerk custom roles need a paid add-on in production). A client is an ordinary Clerk user. Our `ClientAccess` table links that user to specific projects. Client invites use Clerk's invitations API, with the client and project IDs stored in the invitation's metadata.
- **Users in our database:** we don't keep a full user table. Records store the Clerk user ID (and the organization ID for workspace data). Display names come from Clerk.
- **Plan limits:** check the workspace's plan with Clerk's `has({ plan })` or plan features. Free allows 1 workspace and 2 projects; a third project shows the upgrade pop-up.
- **Checkout and plan changes:** use Clerk Billing's components (pricing table, checkout and subscription details) so our Pricing and Billing screens keep their own layout. "Manage subscription" opens Clerk's subscription details panel, not a Stripe portal.
- **Admin numbers:** Clerk keeps the subscriptions, so save Clerk Billing webhook events (subscription created, updated, ended and payment events) into our own `Subscription` table. The Admin dashboard and Subscribers list read monthly revenue, paying subscribers, new subscribers and cancellations from that table. An annual plan counts as its yearly price divided by 12. Past months are seeded demo data and must be labelled "Demo data".

Roles across the whole app are exactly three: **Owner**, **Team member** and **Client**, plus the **SIGNoFF admin** (us). Do not add more.

---

## Screen wording to update for Clerk

The designs were drawn for Stripe's own portal. When building, change:
- **Billing:** "Opens the Stripe portal…" → "Opens your subscription details, where you can change plan, switch to monthly or annual, update your card or cancel."
- **Billing / Pricing:** "You'll pay on Stripe's secure checkout page, then come back here." → "You'll pay in a secure checkout window."
- Keep "Secure payment with Stripe" and "Stripe test mode": payments are still processed by Stripe through Clerk.

---

## Folder structure

One Next.js app, organised around the four kinds of users in the designs.

```
signoff/
├─ prisma/
│  ├─ schema.prisma            # all tables in one file
│  └─ seed.ts                  # demo agency, clients, projects, past subscribers
├─ prisma.config.ts            # Prisma 7 config (connection URL lives here)
├─ public/                     # favicon, og image
├─ src/
│  ├─ proxy.ts                 # Clerk route protection (Next 16's name for middleware)
│  ├─ app/
│  │  ├─ layout.tsx            # <ClerkProvider>, Inter font, globals.css
│  │  ├─ globals.css           # Tailwind + the design colours as theme tokens
│  │  │
│  │  ├─ (public)/             # Public frame: top bar, no side menu
│  │  │  ├─ layout.tsx
│  │  │  ├─ page.tsx                     # 01 Landing
│  │  │  ├─ pricing/page.tsx             # 02 Pricing
│  │  │  ├─ sign-in/[[...sign-in]]/page.tsx   # 03 Sign in + demo role cards
│  │  │  └─ sign-up/[[...sign-up]]/page.tsx
│  │  │
│  │  ├─ (agency)/             # Agency frame: icon menu + side panel
│  │  │  ├─ layout.tsx                   # checks: signed in + in a workspace
│  │  │  ├─ dashboard/page.tsx           # 04 Dashboard
│  │  │  ├─ clients/page.tsx             # 05 Clients
│  │  │  ├─ projects/
│  │  │  │  ├─ page.tsx                  # 06 Projects list
│  │  │  │  └─ [projectId]/
│  │  │  │     ├─ layout.tsx             # project header, milestone strip, tabs
│  │  │  │     ├─ page.tsx               # 07 Board  (?task=id opens 08 Task detail)
│  │  │  │     ├─ list/page.tsx
│  │  │  │     ├─ milestones/page.tsx    # Milestones + send for approval
│  │  │  │     └─ activity/page.tsx
│  │  │  ├─ settings/page.tsx            # 09 Team settings
│  │  │  └─ billing/page.tsx             # 10 Billing
│  │  │
│  │  ├─ (portal)/             # Client frame
│  │  │  ├─ layout.tsx                   # checks: signed in + has ClientAccess
│  │  │  └─ portal/
│  │  │     ├─ page.tsx                  # 11 Client home
│  │  │     └─ projects/[projectId]/page.tsx   # 12 Client project view
│  │  │
│  │  ├─ (admin)/              # Admin frame
│  │  │  ├─ layout.tsx                   # checks: signed-in user is the SIGNoFF admin
│  │  │  └─ admin/
│  │  │     ├─ page.tsx                  # 13 Admin dashboard
│  │  │     └─ subscribers/page.tsx      # 14 Subscribers
│  │  │
│  │  └─ api/
│  │     ├─ webhooks/clerk/route.ts      # billing + invitation events → database
│  │     └─ uploads/route.ts             # Vercel Blob upload token
│  │
│  ├─ features/                # one folder per feature: logic + its own UI
│  │  ├─ workspaces/   { actions.ts, queries.ts, components/ }
│  │  ├─ clients/      { actions.ts, queries.ts, schemas.ts, components/ }
│  │  ├─ projects/     { actions.ts, queries.ts, schemas.ts, components/ }
│  │  ├─ tasks/        { actions.ts, queries.ts, schemas.ts, components/ }   # Kanban, task panel
│  │  ├─ deliverables/ { actions.ts, queries.ts, schemas.ts, components/ }   # uploads, approvals
│  │  ├─ activity/     { queries.ts, record.ts, components/ }
│  │  ├─ billing/      { plans.ts, queries.ts, components/ }                 # limits, upgrade pop-up
│  │  └─ admin/        { queries.ts, components/ }                           # revenue, subscribers
│  │
│  ├─ components/
│  │  ├─ ui/                   # Button, Panel, Card, Pill, Avatar, ProgressBar, Field, Tabs
│  │  ├─ frames/               # PublicFrame, AgencyFrame, ClientFrame, AdminFrame (+ bottom tab bar)
│  │  └─ icons.tsx             # the design's inline SVG icons, one export each
│  │
│  ├─ lib/
│  │  ├─ db.ts                 # the one Prisma 7 client (Neon adapter)
│  │  ├─ auth.ts               # requireRole(), requireClient(), requireAdmin()
│  │  └─ format.ts             # money, dates, percentages
│  │
│  └─ generated/prisma/        # Prisma 7 output (git-ignored)
├─ AGENTS.md
├─ CLAUDE.md
├─ .env.example
└─ package.json
```

### Why this shape

1. **Route groups match the four frames in the designs.**
   - `(public)`, `(agency)`, `(portal)` and `(admin)` don't appear in the URL.
   - Each group has one `layout.tsx` that draws that frame and does that group's access check, once.
   - A page never repeats "is this person allowed here?", and a team member can't land in the admin area by mistake.
2. **One page file per screen, numbered like the canvas.**
   - The comments carry the canvas numbers (01–14), so it's quick to go from a design to its file.
3. **The project tabs are real pages under one shared layout.**
   - Board, List, Milestones and Activity live under `projects/[projectId]/`.
   - The header, milestone strip and tabs are drawn once in the shared `layout.tsx`.
   - Each tab has its own link, so the back button and shared links work.
4. **Task detail is a URL setting, not a separate page.**
   - `?task=123` opens the panel over the board.
   - It's simpler than Next.js's intercepting routes, and the link still opens the right task.
5. **Feature folders keep related code together.**
   - Everything about approvals sits in `features/deliverables/`. Each folder uses the same four kinds of file:
     - `queries.ts`: reads only, called from Server Components
     - `actions.ts`: writes only, as Server Actions. Each one checks the role first, validates its input with `zod`, then writes and records the activity.
     - `schemas.ts`: the `zod` input rules, used by both the forms and the actions
     - `components/`: UI used only by that feature
   - Pages stay thin: they call a query and render components.
6. **No extra layers.**
   - No services, repositories or "barrel" index files. Prisma already is the data layer, and Server Actions already are the API.
   - Fewer layers means less code, and fewer places for an AI tool to put things in the wrong spot.
7. **Shared code is split by job.**
   - `components/ui`: the design's building blocks (grey panel, white card, pill, avatar, progress bar), so the look stays consistent.
   - `components/frames`: the four app frames, including the phone bottom tab bar.
   - `lib/`: only the three things every feature needs: the database client, the role checks and formatting.
8. **Only two API routes.**
   - Clerk's webhooks need a real address, and so do Vercel Blob uploads. Everything else is a Server Action.
9. **Access rules live in one file.**
   - `lib/auth.ts` holds `requireRole("OWNER")`, `requireClient(projectId)` and `requireAdmin()`.
   - Every action and layout calls these, so if a rule changes it changes everywhere.

### House rules that keep the code clean

- **Server Components by default.** Add `"use client"` only to components that need clicks or dragging, such as the Kanban board, Approve buttons, filter tabs and forms.
- **Only `queries.ts` and `actions.ts` talk to the database.** Components never import `db` directly.
- **One component per file,** named like the file: `KanbanBoard.tsx` exports `KanbanBoard`.
- **Design colours are defined once,** in `globals.css` as Tailwind theme tokens (`panel`, `ink`, `violet`, `amber`…). No stray hex values in components.
- **Seed data mirrors the canvas** (Northfold Studio, Brightline Bakery, the same tasks and numbers), so the live demo matches the designs and the video.
