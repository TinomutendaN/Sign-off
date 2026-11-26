# CLAUDE.md — SIGNoFF

@AGENTS.md

## Design reference images (always check these first)

The finished screen designs are saved as images in the project at:

```
design/screens/
```

File names (one per screen, as exported from the design canvas). The "Description" column is the matching number in the written screen descriptions at the end of this file:

| File in `design/screens/` | Screen | Route | Description |
|---|---|---|---|
| `01 Landing.png` | Landing | `/` | 1 |
| `02 Pricing.png` | Pricing | `/pricing` | 2 |
| `03 Sign in.png` | Sign in | `/sign-in` | 3 |
| `04 Dashboard.png` | Dashboard | `/dashboard` | 4 |
| `05 Clients.png` | Clients | `/clients` | 5 |
| `06 Projects.png` | Projects | `/projects` | 6 |
| `07 Project page · Board.png` | Project board | `/projects/[projectId]` | 7 |
| `07 Project page · Milestones.png` | Milestones | `/projects/[projectId]/milestones` | 8 |
| `08 Task detail.png` | Task detail | `/projects/[projectId]?task=[taskId]` | 9 |
| `09 Team settings.png` | Team settings | `/settings` | 10 |
| `10 Billing.png` | Billing | `/billing` | 11 |
| `Upgrade pop-up (Free limit reached).png` | Upgrade pop-up | shown over `/projects` | 12 |
| `11 Client home.png` | Client home | `/portal` | 13 |
| `12 Client project view.png` | Client project view | `/portal/projects/[projectId]` | 14 |
| `13 Admin dashboard.png` | Admin dashboard | `/admin` | 15 |
| `14 Subscribers.png` | Subscribers | `/admin/subscribers` | 16 |

### How to use them

1. **Before building or changing any screen, open its image** from `design/screens/` and match it: layout, spacing, colours, corner sizes, shadows, icons and wording.
2. **Use the written description below as a checklist** for exact words, numbers and colours that are hard to read in an image.
3. **If the image and the description disagree, follow the image**, then mention the difference in your summary.
4. **Two exceptions win over the images:**
   - the "Screen wording to update for Clerk" section in `AGENTS.md` (the images still mention the Stripe portal)
   - phone and tablet layouts: the images show laptop width; follow the responsive rules (side panel hides on tablet, icon menu becomes a bottom tab bar on phones)
5. **Never invent screens, sections or features** that aren't in the images or in `AGENTS.md`.
6. **Pricing intentionally differs from `02 Pricing.png`.** By the owner's request, `/pricing` fits on one screen and has no lavender page border. Do not change it back to match the image.
7. **Signed-in screens have no lavender border.** By the owner's request, the agency, client portal and admin frames fill the screen edge to edge (no lavender margin, no rounded window) and the whole page scrolls. The images show a rounded window on a lavender page; do not change it back.

## Decision making
If something is unclear or could be improved, suggest a better approach. If a new library would significantly help, recommend it, explain why, and ask before adding it.
Do not install new libraries without approval.

## UI rules
For any UI task:
- Replicate the provided design exactly.
- Match layout, spacing, padding, font sizes, font hierarchy, colors, border radius, shadows, alignment, and proportions.
- Do not approximate. Do not simplify unless explicitly asked.

## Feature implementation
When building a feature:
1. Read these files first (`AGENTS.md` and `CLAUDE.md`).
2. Identify the files to change.
3. Keep changes focused.
4. Do not rewrite unrelated code.
5. Follow existing patterns.
6. Make sure the feature works end to end.
7. Fix lint and type errors before finishing.

Before every feature:
- Read this file.
- Follow it strictly.
- Build clean, simple code.
- Replicate UI exactly when designs are provided.

## Build steps (60 hours)

### How to work through these steps
- **Before every step, read `AGENTS.md` (stack, folder structure, house rules) and `CLAUDE.md` (design images, build steps, style descriptions) in full.** Do this even if they were read earlier in the session.
- Do **one step at a time**. When a step's "Done when" list is true, stop, summarise what changed, and wait for approval before the next step.
- Open the screen's image in `design/screens/` before building any screen.
- Commit after every finished step.
- If a step runs long, use the **Cut list** at the end instead of skipping tests of the demo flow.

| Step | What | Hours |
|---|---|---|
| 0 | Project setup and first deploy | 3 |
| 1 | Database tables and demo data | 4 |
| 2 | Shared building blocks and the four frames | 5 |
| 3 | Sign-in, roles and demo login | 4 |
| 4 | Landing and Pricing | 3 |
| 5 | Projects list and project board | 8 |
| 6 | Task detail panel | 3 |
| 7 | Milestones and deliverables | 5 |
| 8 | Client portal and approvals | 6 |
| 9 | Clients and Team settings | 4 |
| 10 | Billing, plan limits and upgrade pop-up | 6 |
| 11 | Dashboard | 3 |
| 12 | Admin dashboard and Subscribers | 4 |
| 13 | Phone check, demo run-through and final deploy | 2 |
| | **Total** | **60** |

---

### Step 0 — Project setup and first deploy (3h)
1. Create the app with `create-next-app` (TypeScript, Tailwind, App Router, `src/` folder).
2. Install the runtime packages from `AGENTS.md` and **pin exact versions** in `package.json` (no `^`), especially `@clerk/nextjs`.
3. In Clerk: create the application (development instance), turn on **Organizations**, and turn on **Billing**. Install Clerk's agent skills: `npx skills add clerk/skills`.
4. In Vercel: create the project, add **Neon** from the Marketplace, and create a **Blob** store. Copy all environment variables into `.env.local` and list their names (no values) in `.env.example`.
5. Set up Prisma 7: `prisma.config.ts`, output to `src/generated/prisma` (git-ignored), and the one database client:

```ts
// src/lib/db.ts
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

6. Add `src/proxy.ts` with Clerk's `clerkMiddleware()`, protecting everything except the public pages and the webhook route.
7. Put the design colours into `globals.css` as Tailwind theme tokens (from the shared style description below).
8. Deploy to Vercel with the Clerk **development** keys on the `*.vercel.app` address.

**Done when:** the live `.vercel.app` address loads, Clerk sign-in works there, and `npx prisma migrate dev` runs against Neon.

### Step 1 — Database tables and demo data (4h)
1. Write `prisma/schema.prisma`. Workspaces and users live in Clerk, so tables store Clerk IDs (`orgId`, `userId`) as plain strings:
   - `Client` (name, contact name, contact email, orgId)
   - `ClientAccess` (client user's Clerk ID, clientId, projectId)
   - `Project` (name, clientId, orgId, due date, status: active or archived, colour)
   - `Milestone` (projectId, number, name, due date, status: approved, waiting, up next)
   - `Task` (projectId, milestoneId, title, description, type: Design, Build, Content, Fix, status: To do, In progress, In review, Done, order, assignee userId, due date)
   - `Comment` (taskId, author userId, text) — team only
   - `Deliverable` (milestoneId, title, file URL, file name, size, note, status: waiting on client, changes requested, approved, sent by, sent at)
   - `Decision` (deliverableId, client userId, approved or changes requested, comment)
   - `Activity` (orgId, projectId, actor userId, text, created at)
   - `Subscription` (orgId, plan, period: monthly or annual, amount, status, started at, ended at, isDemo)
2. Write `prisma/seed.ts` so the data **matches the canvas exactly**: Northfold Studio, Brightline Bakery, both projects, all milestones, the 10 board tasks, comments, deliverables, decisions and activity. Also seed the demo subscriber history (200 paying, monthly revenue history from $1,210 up to $4,898) with `isDemo = true`.
3. Create the demo people in the Clerk dashboard (Tino M. as Owner, Leo R., Ama K., Jen S. as Team members, Thandi M. as the client, plus the admin) and put their Clerk user IDs in `.env.local` as `DEMO_*_USER_ID` and the Northfold org ID as `DEMO_ORG_ID`.

**Done when:** `npx prisma db seed` fills the database and the numbers match the designs.

### Step 2 — Shared building blocks and the four frames (5h)
1. `components/icons.tsx`: copy every icon from the designs as an inline SVG component (1.7 px stroke, `currentColor`).
2. `components/ui/`: `Panel` (grey), `Card` (white, soft shadow), `Button` (violet, outlined), `Pill` (status colours), `Avatar` (initials, overlap ring), `ProgressBar`, `Field`, `Tabs`, `Dialog`.
3. `components/frames/`: `PublicFrame`, `AgencyFrame`, `ClientFrame`, `AdminFrame`, matching the frame descriptions below. Build the responsive rules now:
   - tablet (≤1024 px): the white side panel hides, the icon menu stays
   - phone (≤640 px): the icon menu becomes a floating bottom tab bar, the page fills the screen, content stacks in one column
4. Wire each frame into its route group's `layout.tsx` with placeholder pages for every route in the folder structure.

**Done when:** every route opens inside the right frame, the selected menu item highlights, and the bottom tab bar appears at phone width.

### Step 3 — Sign-in, roles and demo login (4h)
1. `lib/auth.ts`:
   - `requireRole("OWNER" | "MEMBER")`: signed in, active organization, right role (`org:admin` = Owner, `org:member` = Team member)
   - `requireClient(projectId)`: signed in and has a `ClientAccess` row for the project
   - `requireAdmin()`: signed-in user ID is in `ADMIN_USER_IDS`
2. Route-group layouts call these; agency pages redirect a signed-in user with no organization to create one.
3. Sign-in screen (03): left side uses Clerk's `<SignUp>` and `<SignIn>` components styled with `appearance` to match the design. Sign-up creates the user's workspace (organization) with the name they entered.
4. Demo role cards: a Server Action creates a Clerk **sign-in token** for the chosen demo user, and the page signs in with that ticket, then redirects:
   - Agency owner and Team member → `/dashboard`
   - Client → `/portal`
   - SIGNoFF admin → `/admin`

**Done when:** each demo card logs in as the right person and lands on the right page, and each role is blocked from the others' areas.

### Step 4 — Landing and Pricing (3h)
1. Build Landing (01) and Pricing (02) from their images, with the monthly/annual switch working.
2. Plan buttons link to sign-up for now; step 10 connects them to checkout.

**Done when:** both pages match their images at laptop, tablet and phone widths.

### Step 5 — Projects list and project board (8h)
1. Projects list (06): filters (All, Active, Waiting on client, Archived) with counts, progress from milestones.
2. Project layout: header, three milestone boxes, tabs (Board, List, Milestones, Activity).
3. Board (07): four columns with `@dnd-kit/core` (mouse, touch and keyboard). Dropping a card calls a `moveTask` Server Action that saves status and order and records an activity line.
4. "+ Add task" and "+ New task" create tasks.
5. List tab: the same tasks in a table with filters. Activity tab: the project's activity feed.

**Done when:** cards drag between columns on laptop and phone, changes survive a page refresh, and the board matches image 07.

### Step 6 — Task detail panel (3h)
1. `?task=[taskId]` opens the panel (09) over the board; close removes it.
2. Status pills change the task status; the assignee, due date, milestone, type, description and files show as in the image.
3. Comments: list and post (team only, never shown to clients).

**Done when:** a task link opens straight to its panel and a new comment appears without reloading.

### Step 7 — Milestones and deliverables (5h)
1. Milestones tab (08): each milestone with its deliverables and statuses, and the client's change-request note.
2. `api/uploads/route.ts`: Vercel Blob upload token (owners and team members only; PDF, images and zip up to 50 MB).
3. "Add a deliverable": upload, title, milestone, note for the client, then **Send to client for approval** (status: waiting on client, activity recorded).
4. "Upload new version" on a deliverable with changes requested.

**Done when:** an uploaded file appears under its milestone as "Waiting on client".

### Step 8 — Client portal and approvals (6h)
1. Client home (13): what needs their approval, their projects with milestone statuses, latest updates.
2. Client project view (14): preview, file download, note, comment box, **Approve** and **Request changes** (a comment is required for changes). Each decision updates the deliverable and milestone, and records activity.
3. Clients only ever see their own projects and never see team comments.

**Done when:** an agency sends a deliverable, the client approves it in the portal, and the agency's board, milestones and dashboard show "Approved by client".

### Step 9 — Clients and Team settings (4h)
1. Client invites: the invite form creates a `Client`, a `Project` and a Clerk **invitation** with the client and project IDs in its metadata. When the invited person signs up, the Clerk webhook creates their `ClientAccess` row.
2. Clients (05): client cards with their projects and stats, "See their portal", and the invite form with a copyable invite link.
3. Team settings (10): workspace name, team members from the Clerk organization, client access list, invite a team member (Clerk organization invitation, role Team member or Owner), and the "What each role can do" box.
4. Only Owners can invite, change roles or edit workspace details.

**Done when:** inviting a client creates their client and project and sends a Clerk invitation, and once they sign up they see that project in the portal; inviting a team member sends a Clerk invitation and the new person appears as pending.

### Step 10 — Billing, plan limits and upgrade pop-up (6h)
1. In the Clerk dashboard, create **Organization** plans: Free, Pro ($19 a month / $190 a year), Agency ($49 a month / $490 a year), with features for the limits (projects, team members, storage).
2. Pricing (02) and Billing (11): plan buttons start Clerk's checkout for the chosen plan and period. "Manage subscription" opens Clerk's subscription details. Use the Clerk wording from `AGENTS.md`.
3. `features/billing/plans.ts`: plan limits from Clerk's `has()`. Creating a third project on Free opens the upgrade pop-up (12) instead.
4. `api/webhooks/clerk/route.ts`: verify with `verifyWebhook`, then save subscription events into `Subscription`. Client invites need no webhook: they are claimed when the invited person first lands after signing in (Step 9, `ClientInvite`).

**Done when:** a test card upgrade moves Northfold from Free to Pro, the limit lifts, and a new `Subscription` row appears.

### Step 11 — Dashboard (3h)
Build the Dashboard (04): greeting, four stat cards, active projects, waiting on clients (with "Send reminder" recording an activity), due this week and recent activity, all from real queries.

**Done when:** the numbers on the dashboard match the board, milestones and client portal.

### Step 12 — Admin dashboard and Subscribers (4h)
1. `features/admin/queries.ts`: monthly revenue (annual plans divided by 12), paying subscribers, new subscribers, cancellations and plan split, from the `Subscription` table (seeded demo history plus real test-mode sign-ups).
2. Admin dashboard (15): stat cards, 3/6/12-month switch, the revenue bar chart with hover values, subscribers by plan, newest subscribers. Show the "Demo data" pill.
3. Subscribers (16): plan and status filters with counts, table, next and previous pages, Export CSV.

**Done when:** a new test-mode subscription from step 10 shows up at the top of both admin screens and raises the revenue.

### Step 13 — Phone check, demo run-through and final deploy (2h)
1. Check every screen at 390 px (phone), 768 px (tablet) and 1440 px (laptop).
2. Run the demo story end to end on the live address: Pricing → sign up → pay Pro with a test card → invite a client → move a task → send a deliverable → client approves → admin dashboard shows the new subscriber.
3. Re-run the seed so the live demo starts clean, then deploy.

**Done when:** the whole demo story works on the live `.vercel.app` address on a laptop and a phone.

---

### Cut list (use only if behind schedule, in this order)
1. Export CSV buttons (leave them visible but inactive)
2. List tab (keep Board)
3. Archived filter on Projects
4. "Send reminder" on the Dashboard
5. The 3/6/12-month switch on the Admin dashboard (keep 12 months)

## Screen illustration style descriptions

### Shared style (paste with every screen)

```
Accurate flat UI illustration of one SIGNoFF web-app screen. Square 1:1 canvas, 1080×1080 px, transparent background. The app window is wider than it is tall: scale it to fit the canvas width, centre it vertically and leave the space above and below transparent. Do not add any page colour, scene, device frame or extra objects.

App window: white #FFFFFF, 28 px corners, 1 px border #ECEBF5, soft violet-tinted drop shadow, 10 px inner padding.

Colours (use only these): grey panels #E8E7F0; white cards #FFFFFF; soft fills #F5F5F9 and #F0EFF6; violet accent #6D5DF0 (icons #5B4BEA, small labels #4334C9 on #F0EEFF); navy text #1F1D3A; grey text #5F5E78; amber #F5A524 on #FFF4E0 (text #8A4B00); green #34C38F on #DDF5EA (text #0E6B45); red #EF5A5A on #FDE2E4 (text #9B1C2C); blue #5B8DEF on #DCEBFF (text #1D4E99).

Shapes: grey panels 18–20 px corners, white cards 12 px, pills fully rounded, progress bars 5–8 px tall and rounded. Each task card has a 30×4 px coloured tag bar at its top-left. Icons are outline only, 1.7 px stroke on a 24 px grid, round caps, no fills.

People: no human figures. People appear only as round initial avatars (TM violet #E3DEFF, AK green #D7F2E6, LR pink #FDE2E4, JS blue #DCEBFF), overlapping with a 2 px white ring.

Lighting: flat and evenly lit, with no gradients, glows or 3D. White cards have a very soft grey shadow. Violet buttons have a faint violet glow underneath.

Type: Inter-style sans serif. Use the exact words given; never use lorem ipsum.
```

### App frames (referenced by the screens below)

```
AGENCY FRAME
Left: one grey #E8E7F0 rounded frame holding two parts with no gap between them.
(1) A narrow icon menu: a violet "So" logo square at the top, then Home, Clients, Projects and Billing, each an outline icon with a small label, and Help and Settings icons at the bottom. The selected item is a white tile with a soft shadow and a violet icon.
(2) A white side panel inside the same frame, containing:
- a "Search…" row
- a workspace switcher: a peach "NS" square, "Northfold Studio", "Workspace · 4 members"
- the label "CLIENTS & PROJECTS" with two rows: a violet dot "Website redesign" and an amber dot "Spring campaign", each with "Brightline Bakery" under it
- at the bottom, a bordered plan card: "You're on Pro", "Annual plan · renews 24 Nov 2027", "2 projects · no project limit", and an outlined "Manage billing" button

CLIENT FRAME
Same structure. The icon menu has Home, Projects, Files and Help. The white side panel contains:
- "Search…"
- a peach "BB" square, "Brightline Bakery", "Client portal"
- the label "YOUR PROJECTS" with "Website redesign" (amber "1" badge) and "Spring campaign"
- at the bottom, a card: "YOUR AGENCY", a pink "LR" avatar, "Leo R.", "Project lead · Northfold Studio", and an outlined "Send a message" button

ADMIN FRAME
Same structure. The icon menu has Overview, Users, Plans and Settings. The white side panel contains:
- "Search workspaces…"
- a navy "So" square, "SIGNoFF Admin", "Owner access"
- the label "ADMIN" with Overview, Subscribers 200, Workspaces 840, Plans & prices and Payment events
- at the bottom, a card: an amber dot, "Stripe test mode", "Payments use Stripe's test cards. Past months are sample data."

PUBLIC FRAME (no side menu)
Top bar in a grey rounded strip: a violet "So" square, "SIGNoFF", centred links "How it works", "Pricing" and "Client portal", then "Sign in" and a violet "Try the demo" button.
```

### The 16 screens

```
```

#### 1. Landing (public frame)

```
Public frame with no top link selected. Left half:
- an amber pill "For freelancers and small agencies"
- the large headline "Get client sign-off without chasing emails"
- a grey paragraph
- a violet "Try the demo →" button and an outlined "See pricing" button
- small text "Free for your first client. No card needed."
Right half: a grey panel with three light-grey columns, "In progress 2", "In review 2" and "Done 2", each holding two small white task cards. Overlapping its lower-right, tilted −2° with a deep shadow, is a white card: a peach "BB" square, "Homepage design, v2", "Waiting on Brightline Bakery", a violet "Approve" button and an outlined "Request changes" button.
Below: the grey "HOW IT WORKS" panel with three white step cards numbered 1–3 in violet tiles.
```

#### 2. Pricing (public frame, "Pricing" link selected as a white tile)

```
Centred:
- a small violet label "PRICING"
- the headline "Simple plans for freelancers and small agencies"
- a grey subline
- a grey pill switch: "Monthly" and a selected white "Annual", with a green "2 months free" tag
Below, a grey panel with three white plan cards:
- "Free": $0 forever, outlined "Start free" button
- "Pro": "Most popular" pill, 2 px violet outline, deeper shadow, $15.83 a month, "Billed $190 a year", violet "Choose Pro" button
- "Agency": $40.83 a month, "Billed $490 a year", outlined "Choose Agency" button
Each card has a divider and a list of features with violet check marks.
Under the panel, a row of three small items: "Secure payment with Stripe", "Change or cancel any time", "Clients join free".
```

#### 3. Sign in (no side menu, two halves)

```
Left half, white:
- the "So SIGNoFF" logo at the top-left
- the title "Create your workspace" and the subline "Set up SIGNoFF for your studio in a minute."
- a grey two-tab switch: a selected white "Create account" and "Sign in"
- a lavender #F0EEFF note: a card icon, "Pro · annual, $190 a year. You'll pay with Stripe on the next step.", and a "Change" link
- fields: "Your name" (Tino M.), "Workspace name" (Northfold Studio), "Email", "Password"
- a violet "Create account and continue to payment" button
Right half: a grey rounded panel with:
- a white pill "No sign-up needed"
- the title "Try the demo" and a short paragraph
- a 2×2 grid of white role cards:
  - "Agency owner": TM avatar, "Tino M. · Northfold Studio". Selected, with a 2 px violet outline and a filled violet radio dot.
  - "Team member": AK avatar
  - "Client": BB avatar
  - "SIGNoFF admin": navy "So" avatar
- a full-width navy button "Enter the demo as agency owner →"
```

#### 4. Dashboard (agency frame, Home selected)

```
Header:
- small grey text "Tuesday, 24 November" above "Good morning, Tino"
- on the right: a bell with a red dot, an outlined "Invite a client" button and a violet "+ New project" button
Grey strip with four white stat cards, each with a coloured dot:
- "Active projects 2", "Both for Brightline Bakery" (violet)
- "Waiting on clients 1", "Homepage design, version 2" (amber)
- "Changes requested 1", "Logo refresh options" (red)
- "Due this week 4", "Shared by 3 team members" (blue)
Left column:
- "Active projects", with two white cards:
  - "Website redesign": milestone "2. Page designs", violet 63% bar, "10 tasks · 3 done", amber "Waiting on client" pill
  - "Spring campaign": milestone "1. Campaign plan", amber 15% bar, "6 tasks · 1 done", green "On track" pill
- "Waiting on clients", with two rows:
  - an amber clock tile, "Homepage design, version 2", and an outlined "Send reminder" button
  - a red pencil tile, "Logo refresh options", and an outlined "Upload new version" button
Right column:
- "Due this week": four rows with coloured bars and avatars (LR, LR, JS, TM)
- "Recent activity": five rows with avatars
```

#### 5. Clients (agency frame, Clients selected)

```
Header:
- a people icon tile, "Clients", and the subline "1 client · Northfold Studio"
- a search box "Search clients…" on the right
Left grey panel "All clients 1" with one white card:
- a peach "BB" square, "Brightline Bakery", green "Active" pill
- "Thandi M. · thandi@brightline.example"
- an outlined "See their portal" button
- three soft-grey tiles: "Projects 2", "Waiting on client 1 approval", "Last activity: Asked for changes, 21 Nov"
- the label "Projects" with two chips: "Website redesign" and "Spring campaign"
Right grey panel "Invite a client" with a white card:
- a short grey intro line
- fields: Company "Kopje Physio", Contact name "Rudo C.", Contact email "rudo@kopjephysio.example", First project "Booking app"
- a violet "Create project and send invite" button with a paper-plane icon
```

#### 6. Projects (agency frame, Projects selected)

```
Header:
- a Kanban icon tile, "Projects", and the subline "Northfold Studio · 2 active, 1 archived"
- a search box and a violet "+ New project" button
A tab row with counts: "All 2" (bold, violet underline), "Active 2", "Waiting on client 1", "Archived 1".
A grey panel with two white rows:
- "Website redesign / Brightline Bakery": violet tag, "2. Page designs" 63% violet bar, "Due 12 Dec 2026", avatars TM AK LR JS, amber "Waiting on client" pill
- "Spring campaign / Brightline Bakery": amber tag, "1. Campaign plan" 15% amber bar, "Due 15 Dec 2026", avatars AK LR, green "On track" pill
Small grey footnote: "Archived projects don't count towards your plan's project limit."
```

#### 7. Project board (agency frame, Projects selected)

```
Header:
- a grey icon tile, "Website redesign" with a star outline, and "Brightline Bakery · Due 12 Dec 2026"
- on the right: avatars TM AK LR JS, a bell with a red dot, an outlined "Client view" button and a violet "+ New task" button
Three grey milestone boxes in a row, each with a white progress track:
- "1. Brand & sitemap": green "Approved", full bar
- "2. Page designs": amber "Waiting on client", 70%
- "3. Build & launch": white "Up next", 20%
Tabs with small square icons: "Board" (selected, violet underline), "List", "Milestones", "Activity", and "Filter" on the right.
Four grey Kanban columns with counts:
- "To do 3": "Write copy for the Our Story page"; then the "Set up online ordering form" card, lifted, tilted 3°, deep shadow, over a darker grey slot #D9D8E4; then "Photograph seasonal menu items" with a description
- "In progress 2": "Build menu page with prices" (title underlined in light violet, with a description), "Fix image sizes on mobile"
- "In review 2": "Homepage design, version 2" (amber "Waiting on client" pill), "Logo refresh options" (red "Changes requested" pill)
- "Done 3": "Sitemap and page list" and "Colour palette and fonts" (both with green "Approved by client" pills), "Domain and hosting setup"
Each card shows a coloured tag bar, a small type label, a comment count, a due date and one avatar. Each column ends with "+ Add task".
```

#### 8. Milestones (agency frame, same header as the board)

```
Same header as the board. Tabs: "Milestones" is selected.
Left: three grey milestone panels, each with a title, a status pill, a due note and a small white progress track:
- "1. Brand & sitemap" (green "Approved"): two white file rows, "Colour palette and fonts" and "Sitemap and page list", each with a green "Approved by client" pill
- "2. Page designs" (amber "Waiting on client"):
  - "Homepage design, version 2", amber pill
  - "Logo refresh options", red "Changes requested" pill and an outlined "Upload new version" button, with a pale pink note under it: "Brightline Bakery: Can we try the wheat icon in our brown?"
- "3. Build & launch" (white "Up next"): a dashed empty box, "No deliverables yet…"
Right grey panel "Add a deliverable" with a white card:
- a dashed drop zone with a violet upload arrow and "Drop a file or browse"
- a file row "menu-page-design.pdf · 3.1 MB · Uploaded" with a green tick
- fields: Title, Milestone, and "Note for the client"
- a violet "Send to client for approval" button
```

#### 9. Task detail (agency frame with the board behind)

```
The whole project board screen (as in screen 7) sits under a navy overlay at about 32% opacity.
On the right edge, floating above it, a tall grey-framed panel with a white inside and a large soft shadow cast to the left. The panel contains:
- top: "Website redesign / In progress", a link icon tile and a close (×) tile
- a blue tag bar and the title "Build menu page with prices"
- a two-column detail list:
  - Status: four pills, with "In progress" selected in blue
  - Assignee: TM avatar, "Tino M."
  - Due date: 28 Nov 2026
  - Milestone: 3. Build & launch
  - Type: blue "Build" pill
- "Description" paragraph
- "Files": a grey row "brightline-prices.xlsx" with a Download link
- "Comments · 4 comments · team only": comment bubbles in #F5F5F9 from Jen S., Tino M., Leo R. and Tino M.
- a bordered comment box with a violet "Post" button
```

#### 10. Team settings (agency frame, Settings gear selected as a white tile)

```
Header: a gear icon tile, "Team & workspace", and "Northfold Studio · 4 of 15 team members on Pro".
Left:
- "Workspace" panel: a large peach "NS" square, fields "Workspace name: Northfold Studio" and "Client portal address: northfold.signoff.app", and an outlined "Save" button
- "Team members" panel, four rows, each with an avatar, name, email, note and role pill:
  - Tino M. (you), "Pays for the workspace", violet "Owner"
  - Leo R., "Project lead", grey "Team member"
  - Ama K., "Content", grey "Team member"
  - Jen S., "Developer", grey "Team member"
- "Client access" panel: a BB row, "Thandi M. · Brightline Bakery", "Sees Website redesign and Spring campaign only", amber "Client" pill
Right:
- "Invite a team member": email field "kuda@northfold.example", two radio cards ("Team member" selected with a violet outline, and "Owner"), and a violet "Send invite" button
- "What each role can do": three rows, Owner, Team member and Client
```

#### 11. Billing (agency frame, Billing selected; this screen shows the FREE state)

```
Side panel plan card reads "You're on the Free plan", "2 of 2 projects used", with a full violet bar and a violet "Upgrade to Pro" button.
Header: a card icon tile, "Billing", "Northfold Studio · Only the workspace owner can see this page", and an outlined "Compare plans" button.
An amber notice strip with a warning triangle: "You've used both Free projects. Upgrade to start a third project."
"Current plan" card:
- "Free" with a grey "Free forever" pill, "1 workspace, 2 projects, up to 5 team members"
- "$0 forever" on the right
- a line about Pro, then a violet "Upgrade to Pro · $190 a year" button and an outlined "Pay monthly · $19" button
"Usage" card:
- "Projects 2 of 2" with a full amber bar
- "Team members 4 of 5", 80% violet bar
- "File storage 0.4 GB of 1 GB", 40% violet bar
"Payment method": "No card on file", "Added when you upgrade".
"Invoices": "No invoices yet. They'll appear here after your first payment."
```

#### 12. Upgrade pop-up (agency frame, Projects selected; Free plan state)

```
The Projects list screen (as in screen 6), with the side panel showing "You're on the Free plan", "2 of 2 projects used", a full amber bar and a violet "Upgrade to Pro" button. A navy overlay at about 36% opacity covers it.
Centred on top, a grey-framed dialog with a white inside and a large shadow:
- a violet star icon in a #F0EEFF tile, the title "You've used both Free projects", a grey paragraph, and a close (×) tile
- two boxes side by side:
  - grey "FREE · NOW": 2 projects, Up to 5 team members, 1 GB of files
  - violet-outlined "PRO": Unlimited projects, Up to 15 team members, 25 GB of files
- a violet "Upgrade · $190 a year" button and an outlined "Pay monthly · $19" button
- the links "Archive a project instead" (violet) and "Not now" (grey)
```

#### 13. Client home (client frame, Home selected)

```
Header: small text "Brightline Bakery · Shared with you by Northfold Studio", the title "Welcome back, Thandi", and a bell with a red dot.
Grey panel "Needs your approval" with an amber "1" pill. Inside, one white card:
- a small thumbnail: a peach block over three white tiles
- "Homepage design, version 2", "Website redesign · Sent 22 Nov by Leo R.", and the quoted note
- a violet "Review and approve →" button
Left: "Your projects 2", with two white cards:
- "Website redesign": "Due 12 Dec 2026", violet 63% bar, milestones "1. Brand & sitemap" (green Approved), "2. Page designs" (amber Waiting on you), "3. Build & launch" (grey Up next)
- "Spring campaign": "Due 15 Dec 2026", amber 15% bar, "1. Campaign plan" (blue In progress), "2. Visuals" (grey Up next)
Right: "Latest updates", four rows with LR, LR, BB and BB avatars.
```

#### 14. Client project view (client frame, Projects selected; before the client decides)

```
Header:
- a grey icon tile, "Website redesign", and "Shared with you by Northfold Studio · Due 12 Dec 2026"
- on the right: "Overall progress 63%" with a violet bar, and a bell
Three grey milestone boxes: "1. Brand & sitemap" (green Approved), "2. Page designs" (amber Waiting on you), "3. Build & launch" (white Up next).
Left grey panel "Needs your approval · Milestone 2 · Page designs", holding one white card:
- left side, a design preview in #F5F5F9: a brown logo bar, three small nav bars, a peach hero block with brown text bars and a violet button shape, and three white tiles
- right side:
  - an amber tag bar, "Homepage design, version 2", "homepage-v2.pdf · 4.2 MB · Sent 22 Nov by Leo R."
  - a grey quote box with the agency's note
  - a "Download file" link
  - a comment box labelled "Comment (needed if you ask for changes)"
  - a violet "Approve" button with a check, and an outlined "Request changes" button
Below: "Earlier deliverables 3", three white rows:
- "Logo refresh options", red "Changes requested"
- "Colour palette and fonts", green "Approved"
- "Sitemap and page list", green "Approved"
Right grey panel "Activity", with six rows of avatars and text.
```

#### 15. Admin dashboard (admin frame, Overview selected)

```
Header:
- a chart icon tile, "Admin dashboard" with an amber "Demo data" pill, and "All workspaces · Updated just now"
- a grey pill switch "3 months / 6 months / 12 months" with "12 months" selected in white
- an outlined "Export CSV" button
Grey strip with four white stat cards:
- "Monthly recurring revenue $4,898", green chip "+8.2%", "vs October"
- "Paying subscribers 200", green "+18", "this month"
- "New subscribers 23", grey "Nov", "9 chose annual"
- "Cancellations 5", grey "2.7%"
Left: "Monthly recurring revenue" card:
- the readout "Nov 2026: $4,898 a month · up 8.2% on the month before"
- y-axis $0–$6k with dashed grid lines
- 12 rounded violet #6D5DF0 bars, Dec to Nov, rising steadily
Right: "Subscribers by plan · 200 paying", four violet bars:
- "Pro · monthly 96 · $1,824/mo"
- "Pro · annual 58 · $918/mo"
- "Agency · monthly 34 · $1,666/mo"
- "Agency · annual 12 · $490/mo"
- then "Free workspaces 640"
Bottom: "Newest subscribers" table with five rows, the top row "Northfold Studio" lightly highlighted.
```

#### 16. Subscribers (admin frame, Users and Subscribers selected)

```
Header:
- a people icon tile, "Subscribers" with an amber "Demo data" pill, and "200 paying · 5 cancelled this month"
- a search box "Workspace or owner…" and an outlined "Export CSV" button
Two grey pill filter groups:
- "All plans 205" (selected white), "Pro 158", "Agency 47"
- "Any status 205" (selected white), "Active 200", "Cancelled 5"
- with the grey note "Counts are for all subscribers. The table shows the newest."
A grey panel holding a white table with columns Workspace, Owner, Plan, Billing, Members, Status, Started and Monthly value. Ten rows:
- Northfold Studio (highlighted)
- Kraal Digital
- Two Cups Creative
- Mbira Works (red "Cancelled")
- Oakline Labs
- Sable & Co
- Baobab Films
- Riverbend Design
- Kestrel Studio (red "Cancelled")
- Granite Web
All other rows have green "Active" pills.
Under the table: "Showing the 10 newest of 205", a greyed "Previous" button and a white "Next" button.
```