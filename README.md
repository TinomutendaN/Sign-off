# SIGNoFF

**Client project and approval SaaS for freelancers and small agencies.**

SIGNoFF helps freelancers and small agencies run client projects and get work approved without email chains. Agencies organise work into projects, milestones and Kanban tasks, then send deliverables to clients, who approve them or request changes in their own portal. Workspaces pay on Free, Pro or Agency plans, monthly or yearly, and an admin dashboard tracks subscribers and monthly revenue.

- **Live app:** [YOUR VERCEL URL]
- **Video walkthrough:** [YOUR VIDEO LINK]

---

## Contents

- [Screens](#screens)
- [Features](#features)
- [Try it](#try-it)
- [Tech stack](#tech-stack)
- [How it's built](#how-its-built)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Clerk setup](#clerk-setup)
- [Deploying to Vercel](#deploying-to-vercel)
- [Project structure](#project-structure)
- [Working with AI coding agents](#working-with-ai-coding-agents)

---

## Screens

The finished designs live in [`design/screens/`](design/screens/).

| # | Screen | Who sees it |
|---|---|---|
| 01 | Landing | Everyone |
| 02 | Pricing | Everyone |
| 03 | Sign in and role picker | Everyone |
| 04 | Dashboard | Agency |
| 05 | Clients | Agency |
| 06 | Projects | Agency |
| 07 | Project board (Kanban) | Agency |
| 08 | Milestones and deliverables | Agency |
| 09 | Task detail | Agency |
| 10 | Team settings | Agency (Owner) |
| 11 | Billing | Agency (Owner) |
| 12 | Upgrade pop-up | Agency on the Free plan |
| 13 | Client home | Client |
| 14 | Client project view | Client |
| 15 | Admin dashboard | SIGNoFF admin |
| 16 | Subscribers | SIGNoFF admin |

Every screen works on laptop, tablet and phone. On tablets the side panel hides; on phones the menu becomes a bottom tab bar.

---

## Features

### For agencies (Owner and Team member)
- **Workspaces and team:** one workspace per agency, with Owner and Team member roles and email invites.
- **Clients:** add clients, invite them to their own portal, and see what's waiting on each one.
- **Projects and milestones:** split each project into milestones with progress and due dates.
- **Kanban board:** To do, In progress, In review and Done columns, with drag and drop on mouse, touch and keyboard. A list view and an activity feed sit alongside it.
- **Task detail:** status, assignee, due date, description, files and team-only comments.
- **Deliverables:** upload a file to a milestone and send it to the client for approval in one click.
- **Dashboard:** active projects, work waiting on clients, change requests, tasks due this week and recent activity.

### For clients
- **Client portal:** clients see only their own projects, never team comments.
- **Approvals:** review a deliverable, then **Approve** or **Request changes** with a comment. Every decision is saved on the project.
- **Progress at a glance:** milestone statuses and the latest updates from the agency.
- Clients never pay.

### Subscriptions
- **Plans:** Free, Pro and Agency, billed monthly or annually.

  | Plan | Monthly | Annual |
  |---|---|---|
  | Free | $0 | $0 |
  | Pro | $19 | $190 |
  | Agency | $49 | $490 |

- **Plan limits:** Free allows 1 workspace and 2 projects. Starting a third project opens the upgrade pop-up.
- **Self-service billing:** upgrade, switch between monthly and annual, update the card or cancel from the Billing page.

### For the SIGNoFF admin
- **Admin dashboard:** monthly recurring revenue, paying subscribers, new subscribers, cancellations, a revenue chart and subscribers by plan.
- **Subscribers list:** every paying workspace, filtered by plan and status, with CSV export.

---

## Try it

Open the app and pick a role on the sign-in page to explore a ready-made workspace without signing up. Each role shows SIGNoFF the way that person sees it:

| Role | Signs in as | Lands on |
|---|---|---|
| Agency owner | Tino M. · Northfold Studio | Dashboard |
| Team member | Ama K. · Northfold Studio | Dashboard |
| Client | Thandi M. · Brightline Bakery | Client portal |
| SIGNoFF admin | Platform owner | Admin dashboard |

### A typical flow
1. An agency picks **Pro** on the Pricing page.
2. They create an account and pay for Pro.
3. They invite a client and work on the Kanban board.
4. They send a homepage design for approval.
5. The client approves it in their portal.
6. The admin dashboard shows the new subscriber and the revenue going up.

---

## Tech stack

| Area | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Server Components and Server Actions remove the need for a separate API |
| Hosting | **Vercel** | Deploys on every push |
| Accounts, workspaces, roles, invites, subscriptions | **Clerk** (`@clerk/nextjs`) | One package for sign-in, Organizations and Clerk Billing |
| Database | **Neon Postgres** (Vercel Marketplace) | Free to start, one environment variable |
| Database layer | **Prisma 7** with `@prisma/adapter-neon` | Typed schema, best-in-class docs |
| Styling | **Tailwind CSS** | The designs translate to it almost one-to-one |
| Drag and drop | **`@dnd-kit/core`** | Works with mouse, touch and keyboard |
| File uploads | **Vercel Blob** (`@vercel/blob`) | Uploads straight from the browser |
| Form checks | **`zod`** | Validates every Server Action input |

The app uses **10 runtime packages** in total. The full reasoning, including the alternatives considered, is in [`AGENTS.md`](AGENTS.md).

---

## How it's built

- **Workspaces are Clerk Organizations.** Owner is Clerk's `org:admin` role and Team member is `org:member`.
- **Clients are ordinary Clerk users.** A `ClientAccess` table links each client to the projects they may see.
- **Subscriptions live in Clerk Billing.** Clerk webhooks copy subscription events into a `Subscription` table, which feeds the admin screens. An annual plan counts as its yearly price divided by 12.
- **Access rules live in one file.** `src/lib/auth.ts` holds `requireRole()`, `requireClient()` and `requireAdmin()`, and every page and action uses them.
- **There are only two API routes:** Clerk webhooks and Vercel Blob uploads. Everything else is a Server Action.

---

## Getting started

### Prerequisites
- Node.js 20 or newer
- A [Clerk](https://clerk.com) account
- A [Vercel](https://vercel.com) account with a Neon database and a Blob store
- Git

### 1. Clone and install

```bash
git clone [YOUR REPO URL]
cd signoff
npm install
```

### 2. Add environment variables
Copy the example file and fill in the values (see [Environment variables](#environment-variables)):

```bash
cp .env.example .env.local
```

### 3. Set up the database

```bash
npx prisma migrate dev
npx prisma db seed
```

The seed creates a starter workspace (Northfold Studio), its client (Brightline Bakery), both projects, their milestones, tasks, deliverables and activity, plus subscriber history for the admin screens.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Test webhooks locally (optional)
Clerk webhooks need a public address. Use a tunnelling tool such as ngrok to expose `http://localhost:3000/api/webhooks/clerk`, then add that address as a webhook endpoint in the Clerk dashboard.

---

## Environment variables

| Name | What it is |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (development instance) |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Signing secret for the Clerk webhook endpoint |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token |
| `ADMIN_USER_IDS` | Comma-separated Clerk user IDs allowed into `/admin` |
| `DEMO_ORG_ID` | Clerk organization ID for Northfold Studio |
| `DEMO_*_USER_ID` | Clerk user IDs for the seeded people (owner, team members, client, admin) |

Never commit `.env.local`.

---

## Clerk setup

1. **Create an application** in the Clerk dashboard. Use the **development** instance while building; move to production once you have your own domain.
2. **Turn on Organizations.** Each agency workspace is an organization.
3. **Turn on Billing** and create **Organization** plans:
   - Free
   - Pro: $19 a month or $190 a year
   - Agency: $49 a month or $490 a year

   Add features for the plan limits (projects, team members, storage).
4. **Add a webhook endpoint** pointing to `/api/webhooks/clerk`, subscribed to the billing and invitation events. Copy its signing secret into `CLERK_WEBHOOK_SIGNING_SECRET`.
5. **Create the starter people:** Tino M., Leo R., Ama K., Jen S., Thandi M. and the admin. Add Tino, Leo, Ama and Jen to the Northfold Studio organization with the right roles, then copy all the IDs into `.env.local`.

On the development instance, Clerk Billing uses its **development payment gateway**, so you can pay with a Stripe test card such as `4242 4242 4242 4242` and don't need your own Stripe account. For live payments, connect your own Stripe account to Clerk's production instance.

---

## Deploying to Vercel

1. Push the repository to GitHub and import it into Vercel.
2. Add every environment variable from `.env.local` to the Vercel project.
3. Deploy. The app runs on the `*.vercel.app` address with Clerk's development keys (production keys need your own domain).
4. Update the Clerk webhook endpoint to the live address.
5. Run the seed against the live database to load the starter workspace.

---

## Project structure

```
signoff/
├─ design/screens/       # the 16 screen designs (01–16)
├─ prisma/               # schema.prisma and seed.ts
├─ src/
│  ├─ proxy.ts           # Clerk route protection
│  ├─ app/
│  │  ├─ (public)/       # Landing, Pricing, Sign in
│  │  ├─ (agency)/       # Dashboard, Clients, Projects, Board, Settings, Billing
│  │  ├─ (portal)/       # Client home, Client project view
│  │  ├─ (admin)/        # Admin dashboard, Subscribers
│  │  └─ api/            # Clerk webhooks, Blob uploads
│  ├─ features/          # one folder per feature: queries, actions, schemas, components
│  ├─ components/        # ui building blocks, the four app frames, icons
│  └─ lib/               # database client, role checks, formatting
├─ AGENTS.md             # stack, folder structure, house rules
└─ CLAUDE.md             # design references, build steps, UI rules
```

The full tree and the reasons behind it are in [`AGENTS.md`](AGENTS.md).

---

## Working with AI coding agents

This project is set up for AI-assisted development:

- [`AGENTS.md`](AGENTS.md) explains the tech stack, every package and the alternatives considered, the folder structure and the house rules.
- [`CLAUDE.md`](CLAUDE.md) loads `AGENTS.md` automatically. It holds:
  - the design reference images and how to use them
  - the decision-making, UI and feature rules
  - the 60-hour build plan, step by step
  - a written description of every screen

Agents read both files before every step, replicate the designs exactly, and ask before adding any new library.
