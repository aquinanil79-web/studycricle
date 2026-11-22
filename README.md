# CampusHub

**Your campus, connected.** CampusHub is a full-stack student portal for a college: students join clubs, register for events, read announcements, share study resources and discuss them. Admins manage students, clubs, events, announcements and uploaded resources.

It is a college project built on the current (2026) web stack: **Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 and Supabase** (Postgres, Auth, Storage). There is no separate backend server: the Next.js app is the backend, and the database protects itself with Row Level Security.

---

## Contents

1. [Project overview](#1-project-overview)
2. [Features](#2-features)
3. [Tech stack](#3-tech-stack)
4. [Exact package versions](#4-exact-package-versions)
5. [Architecture](#5-architecture)
6. [Folder structure](#6-folder-structure)
7. [Supabase setup](#7-supabase-setup)
8. [Environment variables](#8-environment-variables)
9. [Database setup](#9-database-setup)
10. [Row Level Security policies](#10-row-level-security-rls-policies)
11. [Authentication setup](#11-authentication-setup)
12. [Storage setup](#12-storage-setup)
13. [Running locally](#13-running-locally)
14. [Seeding demo data](#14-seeding-demo-data)
15. [How to create an admin](#15-how-to-create-an-admin)
16. [Deployment](#16-deployment)
17. [College presentation: 5-minute demo flow](#17-college-presentation-5-minute-demo-flow)
18. [Common troubleshooting](#18-common-troubleshooting)
19. [Testing the main flows](#19-testing-the-main-flows)
20. [What changed compared with older tutorials](#20-what-changed-compared-with-older-tutorials)
21. [Viva questions and answers](#21-viva-questions-and-answers)

---

## 1. Project overview

| | |
|---|---|
| **Users** | Two roles: `student` (default for every new account) and `admin` |
| **Public pages** | `/` landing page, `/login`, `/register` |
| **Student pages** | `/dashboard`, `/profile`, `/clubs`, `/clubs/[id]`, `/events`, `/events/[id]`, `/resources`, `/announcements` |
| **Admin pages** | `/admin`, `/admin/students`, `/admin/clubs`, `/admin/events`, `/admin/announcements`, `/admin/resources` |
| **Backend** | Next.js Server Components (reading), Server Actions (writing), two Route Handlers (file download, email confirmation) |
| **Database** | Supabase Postgres, 8 tables, every table protected by Row Level Security |

## 2. Features

**Students**
- Register with email and password; a profile row is created automatically by a database trigger.
- Dashboard with statistics (clubs joined, upcoming events, registrations, available resources), upcoming events, their registrations and clubs, recent announcements and resources.
- Profile with photo upload (Supabase Storage), student ID, department, year and bio.
- Clubs: search, filter by category, view details and members, join and leave, discuss in comments.
- Events: search, upcoming/past filter, details with a live capacity meter, register and cancel. Duplicate registrations and over-booking are prevented **by the database**, not just the UI.
- Announcements by category (General, Academic, Examination, Placement, Event) with a "new" indicator in the header.
- Resources: upload study material (PDF, Office files, text, images up to 10 MB), view it in the browser or download it through short-lived signed URLs; edit or delete your own uploads.
- Comments on clubs and events; delete your own comments.

**Admins** (everything students can do, plus)
- Overview with platform statistics, newest students, most popular clubs and event fill rates.
- Students: search/filter, promote to admin or remove admin rights, remove a student account.
- Clubs, events and announcements: create, edit and delete (with image upload for clubs and events).
- Resources: moderate all uploads (view, download, edit details, delete).

**Everywhere**: responsive layout (sidebar on desktop, drawer on mobile), loading skeletons, empty states, error pages, toast notifications, confirmation dialogs for destructive actions, keyboard and screen-reader friendly forms and dialogs.

## 3. Tech stack

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) | Pages, server rendering, Server Actions and Route Handlers in one app |
| UI library | **React 19** | Server Components, `useActionState`, `useFormStatus` |
| Language | **TypeScript** (strict) | Types for every table (`lib/database.types.ts`) |
| Styling | **Tailwind CSS 4** | Design tokens defined in CSS (`app/globals.css`), no config file |
| Database | **Supabase Postgres** | Relational data, constraints, triggers, Row Level Security |
| Auth | **Supabase Auth** via **@supabase/ssr** | Email/password, session stored in cookies |
| Files | **Supabase Storage** | Avatars and cover images (public), study resources (private) |
| Validation | **Zod 4** | Same rules for every form, checked on the server |
| Icons / toasts | **lucide-react 1**, **sonner 2** | Icons and notifications |

## 4. Exact package versions

Checked against npm and the official documentation on 27 September 2026. Versions are pinned exactly in `package.json`.

| Package | Version | Notes |
|---|---|---|
| `next` | 16.3.6 | latest stable |
| `react`, `react-dom` | 19.3.0 | latest stable |
| `@supabase/supabase-js` | 2.117.2 | latest stable (v3 is only a pre-release) |
| `@supabase/ssr` | 0.12.7 | official Next.js integration (replaces the deprecated auth-helpers) |
| `tailwindcss`, `@tailwindcss/postcss` | 4.3.3 | latest stable |
| `lucide-react` | 1.48.0 | latest stable |
| `sonner` | 2.0.8 | latest stable |
| `zod` | 4.6.5 | latest stable |
| `@typescript/native` (`tsc`) | 7.0.2 | **TypeScript 7**, the new native compiler; provides the `tsc` command used by `npm run typecheck` |
| `typescript` | `npm:@typescript/typescript6@6.0.2` | TypeScript 6 API for tools that need it (see below) |
| `eslint` | 9.39.5 | see below |
| `eslint-config-next` | 16.3.6 | matches Next.js |
| `@types/react`, `@types/react-dom` | 19.3.0 | |
| `@types/node` | 26.6.3 | |
| **Node.js** | **22 or newer** | required by supabase-js 2.117 (Next.js itself needs 20.9+) |

Two deliberate choices:

- **TypeScript 7 + TypeScript 6 side by side.** TypeScript 7.0 (the Go-based compiler) is the latest release and type-checks this project, but it does not ship a JavaScript API yet, so ESLint's TypeScript plugin and editor plugins cannot load it. Following the official TypeScript 7 release notes, `package.json` installs TS 7 under the alias `@typescript/native` (it provides the `tsc` command, so `npm run typecheck` uses TypeScript 7) and TypeScript 6 under the name `typescript` for those tools (`next build` also type-checks with this package). You do not need to do anything; `npm install` sets it up.
- **ESLint 9, not 10.** `eslint-config-next` 16.3.6 bundles plugins (react, import, jsx-a11y) that do not support ESLint 10 yet; with ESLint 10 `npm run lint` crashes. ESLint 9 is also what `create-next-app` 16.3.6 installs.

## 5. Architecture

```
                      Browser
   Server-rendered HTML │  ▲   small Client Components: forms, dialogs, buttons, toasts,
   and Server Actions   │  │   direct file uploads to Supabase Storage
                        ▼  │
 ┌───────────────────────────────────────────────────────────────────────┐
 │ proxy.ts  (runs before every request)                                  │
 │  - refreshes the Supabase session cookie                                │
 │  - sends visitors who are not logged in to /login                       │
 ├───────────────────────────────────────────────────────────────────────┤
 │ Next.js App Router                                                      │
 │  Server Components (app/**/page.tsx)   read data          ─┐            │
 │  Server Actions   (lib/actions/*.ts)   validate + write    ├─ as the    │
 │  Route Handlers   (route.ts)           signed file URLs    │  logged-in │
 │  lib/auth.ts      requireUser() / requireAdmin()          ─┘  user      │
 └───────────────────────────────┬───────────────────────────────────────┘
                                 │ @supabase/ssr (session from cookies)
 ┌───────────────────────────────▼───────────────────────────────────────┐
 │ Supabase                                                                │
 │  Auth      email + password, JWT session                                │
 │  Postgres  8 tables, constraints, triggers, GRANTs + Row Level Security │
 │  Storage   avatars (public), images (public), resources (private)       │
 └────────────────────────────────────────────────────────────────────────┘
```

**How a page loads (reading).** A page such as `/clubs` is a Server Component. It calls `requireUser()` and then queries Supabase with the server client. The client carries the user's session cookie, so Postgres runs the query **as that user** and Row Level Security filters the rows. The finished HTML is sent to the browser. No API layer is needed and no database keys reach the browser except the publishable key.

**How a change happens (writing).** Buttons and forms call **Server Actions** in `lib/actions/`. Every action follows the same four steps:

1. check who is calling (`requireUser()` or `requireAdmin()`), because a Server Action is a public POST endpoint;
2. validate the input with a Zod schema from `lib/validation.ts`;
3. write to Supabase (RLS checks the permission a second time);
4. call `revalidatePath()` so the affected pages re-render with fresh data, and return `{ ok, message, errors }` which the UI shows as a toast and field errors.

**Files.** The browser uploads a file directly to Supabase Storage (so the 1 MB Server Action body limit does not apply), then submits only the file path/URL with the form. Private resources are opened through `/resources/[id]/file`, a Route Handler that checks the user and redirects to a signed URL valid for 60 seconds.

**Server vs client.** Pages, layouts and data loading are Server Components. Only interactive leaves are Client Components (`"use client"`): forms, modals, the mobile menu, file pickers and action buttons.

**Security in layers**

| Layer | Where | What it stops |
|---|---|---|
| Proxy redirect | `proxy.ts`, `lib/supabase/proxy.ts` | Visitors who are not logged in reaching portal pages |
| Data Access Layer | `lib/auth.ts` (`requireUser`, `requireAdmin`) called in every page and action | Students calling admin pages or actions directly |
| Validation | `lib/validation.ts` (Zod) | Invalid or malicious form input |
| GRANTs | `supabase/schema.sql` section 4 | Whole operations (e.g. students can never update `profiles.role`) |
| Row Level Security | `supabase/schema.sql` section 5 | Reading/changing rows the user does not own, even with a hand-made API request |
| Constraints and triggers | `supabase/schema.sql` sections 1 and 3 | Duplicate memberships/registrations, over-booked events, invalid data |
| Storage policies | `supabase/schema.sql` section 6 | Uploading into someone else's folder, reading private files without a signed URL |

## 6. Folder structure

```
campushub/
├── app/                              Next.js App Router (every folder is a URL segment)
│   ├── layout.tsx                    root layout: fonts, global CSS, toast container
│   ├── globals.css                   Tailwind v4 import + design tokens (@theme)
│   ├── page.tsx                      landing page  /
│   ├── not-found.tsx                 404 for unknown URLs
│   ├── global-error.tsx              last-resort error screen
│   ├── (auth)/                       route group (not part of the URL)
│   │   ├── layout.tsx                split-screen layout for the auth pages
│   │   ├── login/page.tsx            /login
│   │   └── register/page.tsx         /register
│   ├── (portal)/                     route group for signed-in pages
│   │   ├── layout.tsx                sidebar, mobile drawer, header; requireUser()
│   │   ├── loading.tsx / error.tsx / not-found.tsx
│   │   ├── dashboard/                /dashboard (+ its own loading skeleton)
│   │   ├── profile/                  /profile
│   │   ├── clubs/                    /clubs and /clubs/[id]
│   │   ├── events/                   /events and /events/[id]
│   │   ├── announcements/            /announcements
│   │   ├── resources/                /resources and resources/[id]/file/route.ts (signed download URL)
│   │   └── admin/                    /admin, /admin/students, /admin/clubs, /admin/events,
│   │                                 /admin/announcements, /admin/resources
│   └── auth/confirm/route.ts         email-confirmation link handler (only if Confirm email is on)
├── components/
│   ├── ui/                           reusable building blocks: Button, Card, Badge, Modal/FormModal,
│   │                                 ActionForm + fields, ActionButton/ConfirmButton, SearchFilter,
│   │                                 ImageUpload/ResourceFileUpload, Avatar, StatCard, EmptyState...
│   ├── portal/nav.tsx                sidebar and mobile drawer navigation
│   ├── admin/                        form fields shared by the admin create/edit modals
│   ├── auth/, landing/, resources/   pieces used by one area of the app
│   └── club-card.tsx, event-card.tsx, comments.tsx, comment-form.tsx, profile-form.tsx, ...
├── lib/
│   ├── supabase/
│   │   ├── server.ts                 Supabase client for server code (session from cookies)
│   │   ├── client.ts                 Supabase client for the browser (file uploads)
│   │   ├── proxy.ts                  session refresh + redirects, called by proxy.ts
│   │   ├── admin.ts                  secret-key client (admin actions only, server-only)
│   │   └── env.ts                    reads and checks the public env vars
│   ├── actions/                      Server Actions: auth, profile, clubs, events,
│   │                                 announcements, resources, comments, students
│   ├── auth.ts                       Data Access Layer: getCurrentUser, requireUser, requireAdmin
│   ├── validation.ts                 Zod schemas for every form
│   ├── database.types.ts             TypeScript types of the database tables
│   ├── types.ts, constants.ts, utils.ts
├── supabase/schema.sql               tables, indexes, triggers, grants, RLS, storage buckets
├── scripts/
│   ├── seed.mjs                      demo data (npm run seed)
│   └── check-security.mjs            automated RLS test (npm run check:security)
├── proxy.ts                          Next.js 16 proxy (formerly middleware.ts)
├── next.config.ts                    allowed image hosts
├── .env.example                      template for .env.local
└── package.json
```

## 7. Supabase setup

1. Sign in at [supabase.com](https://supabase.com) and click **New project**. Pick a name (e.g. `campushub`), a strong database password, and the region closest to you (for India: **Mumbai**). Wait until the project is ready.
2. Open **Project > Connect** (or **Settings > API Keys**) and copy:
   - the **Project URL** (`https://xxxx.supabase.co`),
   - the **Publishable key** (`sb_publishable_...`),
   - the **Secret key** (`sb_secret_...`, click *Reveal*).
3. Put them in `.env.local` (next section).
4. Create the database: see [Database setup](#9-database-setup).
5. Configure email sign-in: see [Authentication setup](#11-authentication-setup).

> Older tutorials use the `anon` and `service_role` keys (long strings starting with `eyJ`). Those are the legacy keys that Supabase is retiring by the end of 2026. CampusHub uses the new publishable and secret keys.

## 8. Environment variables

Copy the example file and fill it in:

```bash
cp .env.example .env.local
```

| Variable | Where it is used | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | everywhere | no |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser and server Supabase clients | no (safe to expose, RLS still applies) |
| `SUPABASE_SECRET_KEY` | server only: admin "remove student" / "change role" actions and the seed script | **yes**, never prefix with `NEXT_PUBLIC_`, never commit |
| `SEED_PASSWORD` | only `npm run seed` and `npm run check:security` | yes (choose your own demo password) |

`.env.local` is ignored by git. Restart `npm run dev` after changing it.

## 9. Database setup

1. In the Supabase dashboard open **SQL Editor > New query**.
2. Paste the whole content of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. It is safe to run again later.

The script creates:

| Table | Purpose | Key constraints |
|---|---|---|
| `profiles` | one row per user (name, student ID, department, year, bio, avatar, **role**) | `id` = `auth.users.id`, unique `student_id`, role is `student` or `admin` |
| `clubs` | clubs and societies | unique `name` |
| `club_members` | who joined which club | unique (`club_id`, `user_id`) |
| `events` | events with date, time, location, organizer, capacity, image | `capacity > 0` |
| `event_registrations` | who registered for which event | unique (`event_id`, `user_id`), capacity trigger |
| `announcements` | admin announcements | category is one of the 5 categories |
| `resources` | metadata of uploaded files (file lives in Storage) | unique `file_path` |
| `comments` | comments on a club **or** an event | exactly one of `club_id` / `event_id` |

All primary keys are UUIDs, all relations are foreign keys with `on delete cascade` (or `set null` for "created by"), every table has timestamps, and indexes cover foreign keys, policy columns and common sorts.

It also creates:
- `handle_new_user()` trigger: inserts the `profiles` row when someone signs up, copying name, student ID, department and year from the sign-up form. The role is **always** `student`; it is never taken from user input.
- `check_event_capacity()` trigger: refuses a registration when the event is full (it locks the event row, so two students cannot take the last seat at the same time).
- `set_updated_at()` triggers.
- `private.is_admin()`: used by the policies. It lives in a schema that is not exposed through the API.

## 10. Row Level Security (RLS) policies

RLS is enabled on every table. With RLS on, a table returns nothing until a policy allows it. `(select auth.uid())` is the id of the logged-in user. Anonymous visitors (`anon`) can only read clubs and events (for the landing page).

| Table | Read | Create | Update | Delete |
|---|---|---|---|---|
| `profiles` | logged-in users | trigger only | own row, and only name/student ID/department/year/bio/avatar (column GRANT) | admin action (secret key) |
| `clubs` | everyone | admin | admin | admin |
| `club_members` | logged-in users | yourself only | - | yourself, or admin |
| `events` | everyone | admin | admin | admin |
| `event_registrations` | logged-in users | yourself only (+ capacity trigger) | - | yourself, or admin |
| `announcements` | logged-in users | admin (as author) | admin | admin |
| `resources` | logged-in users | yourself (as uploader) | uploader or admin | uploader or admin |
| `comments` | logged-in users | yourself (as author) | - | author or admin |

Why a student cannot make themselves admin: the `authenticated` role is only GRANTed `UPDATE` on six profile columns. `role` is not one of them, so `update profiles set role = 'admin'` fails with "permission denied" no matter what the policy says. Admins change roles through a Server Action that first calls `requireAdmin()` and then uses the secret key.

Run `npm run check:security` to prove these rules against your own project (see [Testing](#19-testing-the-main-flows)).

## 11. Authentication setup

CampusHub uses **email and password** only.

**For a demo (recommended):** Dashboard > **Authentication > Sign In / Providers > Email** and turn **Confirm email** off. Sign-up then logs the student in immediately. (Supabase's built-in email sender only allows a few emails per hour, which is not enough for a class demo.)

**If you keep Confirm email on:**
1. **Authentication > URL Configuration**: set **Site URL** to `http://localhost:3000` (later your deployed URL).
2. **Authentication > Email Templates > Confirm signup**: change the link to
   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
   ```
   The route `app/auth/confirm/route.ts` verifies the token and signs the student in.
3. For real use, configure custom SMTP (Authentication > Emails) to lift the email limit.

**How the session works**
- `lib/supabase/server.ts` creates a Supabase client that reads the session from cookies (Server Components, Server Actions, Route Handlers).
- `lib/supabase/client.ts` creates the browser client (used for file uploads).
- `proxy.ts` (Next.js 16's new name for `middleware.ts`) calls `lib/supabase/proxy.ts` on every request. It calls `supabase.auth.getClaims()`, which verifies the session token and refreshes it when it is about to expire, then writes the new cookie. Server Components cannot write cookies, which is why this refresh has to happen in the proxy.
- `lib/auth.ts` is the **Data Access Layer**: `getCurrentUser()` verifies the token with `getClaims()` and loads the `profiles` row (the role comes from the database, never from the token's user-editable metadata). `requireUser()` and `requireAdmin()` redirect when the check fails.
- Login, registration and logout are Server Actions in `lib/actions/auth.ts`.

## 12. Storage setup

`schema.sql` creates the three buckets and their policies; nothing needs to be clicked. You can see them under **Storage**.

| Bucket | Public? | Size limit | Who can upload | Used for |
|---|---|---|---|---|
| `avatars` | yes | 2 MB, PNG/JPG/WebP | each user, into a folder named after their user id | profile pictures |
| `images` | yes | 5 MB, PNG/JPG/WebP | admins | club and event cover images |
| `resources` | **no** | 10 MB, PDF/Office/text/images | each user, into their own folder | study resources |

Public buckets serve files by URL. The private `resources` bucket is only reachable through `/resources/[id]/file`, which checks that you are logged in and redirects to a signed URL that expires after 60 seconds. File names are replaced by random UUIDs on upload (the original name is kept in the database and used for downloads).

## 13. Running locally

Requirements: **Node.js 22+** and npm.

```bash
npm install
cp .env.example .env.local      # then fill in the values (section 8)
npm run dev
```

Open http://localhost:3000.

| Command | What it does |
|---|---|
| `npm run dev` | development server (Turbopack) |
| `npm run build` | production build (also type-checks, with the TypeScript 6 `typescript` package) |
| `npm start` | runs the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | generates route types and runs `tsc --noEmit` |
| `npm run seed` | fills the database with demo data |
| `npm run check:security` | automated Row Level Security test |

<details>
<summary>Optional: run Supabase itself on your computer (Docker)</summary>

If Docker Desktop is installed you can use a local Supabase instead of a hosted project:

```bash
npx supabase init
npx supabase start
```

`supabase start` prints a local API URL (`http://127.0.0.1:54321`), a publishable key, a secret key and a database URL. Put the first three in `.env.local`, then apply the schema with `psql "<DB URL>" -f supabase/schema.sql`. Local projects have Confirm email turned off by default. Stop everything with `npx supabase stop`.
</details>

## 14. Seeding demo data

The seed script creates realistic data for an Indian college: 1 admin (Dr. Meera Iyer), 15 students from 8 departments, 5 clubs, 10 events (8 upcoming, 2 past, one of them full), 8 announcements across all categories, 10 study resources (real PDF and text files in Storage), club memberships, event registrations and comments. Event dates are relative to the day you run the seed, so the demo always has upcoming events.

1. Set `SEED_PASSWORD` in `.env.local` (any password of at least 8 characters; every demo account gets it).
2. Make sure `SUPABASE_SECRET_KEY` is set and `schema.sql` has been run.
3. Run:
   ```bash
   npm run seed
   ```

The script prints the demo accounts. It can be run again at any time: existing demo users are reused and the demo **content** (clubs, events, announcements, resources, comments, memberships, registrations) is **replaced**. Do not run it against a database with real content.

## 15. How to create an admin

Choose one:

- **Seed script:** `npm run seed` creates the admin account `admin@campushub.test` (password = your `SEED_PASSWORD`).
- **Promote your own account:** register normally in the app, then run this in **SQL Editor** (the SQL editor runs as the database owner, so it may change the role column):
  ```sql
  update public.profiles set role = 'admin' where email = 'you@example.com';
  ```
  Reload the page; the Admin section appears in the sidebar.
- **From the app:** an existing admin can open **Admin > Students** and click **Make admin**.

No credentials are hard-coded anywhere in the application.

## 16. Deployment

CampusHub deploys to any Node.js host; the simplest is **Vercel**.

1. Push the project to a GitHub repository (`.env.local` is ignored and stays on your computer).
2. On [vercel.com](https://vercel.com) click **Add New > Project** and import the repository. The framework is detected as Next.js.
3. Add the environment variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` (mark the secret key as sensitive). They must be present at **build** time because `next.config.ts` reads the Supabase URL to allow its images.
4. Make sure the Node.js version in **Project Settings** is 22 or newer, then deploy.
5. In Supabase, **Authentication > URL Configuration**: set **Site URL** to your Vercel URL (e.g. `https://campushub.vercel.app`) and add it to **Redirect URLs**.

Any other host works the same way: `npm install`, `npm run build`, `npm start` with the three environment variables set.

## 17. College presentation: 5-minute demo flow

Before the presentation: run `npm run seed`, open two browser windows (a normal one for the student, a private one for the admin), and log in as `admin@campushub.test` in the private one.

| Time | Show | Say |
|---|---|---|
| 0:00 | Landing page `/`, scroll through hero, features, live events and clubs | "Everything here is read live from Postgres. Visitors who are not logged in can only see clubs and events; RLS decides that." |
| 0:40 | **Register** a new student | "Sign-up is a Server Action. A database trigger creates the profile row; the role is always student." |
| 1:10 | **Dashboard**: statistics and sections | "This page is a Server Component. It runs several queries in parallel on the server and sends finished HTML." |
| 1:40 | **Clubs**: search and filter, open a club, **Join**, post a comment | "Search is in the URL, so it survives refresh. The unique constraint makes joining twice impossible." |
| 2:30 | **Events**: open the nearly full event, **Register**, watch seats left drop; open the full event | "A trigger locks the event row and refuses the last-seat race, so capacity is enforced by the database." |
| 3:10 | **Resources**: upload a PDF, open it, download it | "The browser uploads straight to Storage into my own folder; the file is private and opened through a 60-second signed URL." |
| 3:40 | Switch to the admin window: **Admin overview**, publish an **announcement**, create an **event** | "Admin pages check the role on the server, and the database checks it again." |
| 4:20 | Student window: refresh, see the announcement and the bell dot; try opening `/admin` | "A student is redirected. Even a hand-written API request would be blocked by RLS." |
| 4:40 | Terminal: `npm run check:security` | "An automated test that attacks the database as a student and proves every rule holds." |

## 18. Common troubleshooting

| Problem | Fix |
|---|---|
| Error "Supabase is not configured" | `.env.local` is missing or incomplete. Copy `.env.example`, fill it in, restart `npm run dev`. |
| `permission denied for table ...` (code 42501) | `schema.sql` was not run completely. New Supabase projects do not expose tables automatically; the GRANT statements in section 4 are required. Run the whole file again. |
| After logging in you are sent back to `/login` | Check that `proxy.ts` is in the project root and the Supabase URL/keys belong to the same project. Clear cookies for localhost and try again. |
| Sign-up says "check your email" and no email arrives | Confirm email is on and the built-in sender allows only a few emails per hour. Turn Confirm email off for the demo ([section 11](#11-authentication-setup)). |
| "Email rate limit exceeded" | Same as above. |
| "This student ID may already be registered" | `student_id` is unique. Use another ID. |
| Admin links missing / `/admin` redirects to the dashboard | Your profile role is `student`. See [How to create an admin](#15-how-to-create-an-admin). |
| Images do not load or `/_next/image` returns 400 | The image host is taken from `NEXT_PUBLIC_SUPABASE_URL` when the server starts. Restart the dev server after changing it. Only images uploaded with the image picker (or the seed's Unsplash images) are allowed. |
| Upload fails with "new row violates row-level security policy" | The storage policies were not created (run `schema.sql`), or the file is larger than the bucket limit / not an allowed type. |
| "Remove student" fails | `SUPABASE_SECRET_KEY` is missing or wrong in `.env.local`. |
| `npm run seed` stops with "SEED_PASSWORD" | Add `SEED_PASSWORD=` with at least 8 characters to `.env.local`. |
| `npm install` or the app fails on an old Node.js | Install Node.js 22 or newer (`node -v`). |
| ESLint crashes with "typescript-eslint does not support TS 7" | Something replaced the `typescript` alias. Restore `package.json` from the repository and run `npm install`. |
| Changes in the database do not show up | Pages always load fresh data; reload the page. If you edited data in the Supabase dashboard while a page was open, navigate again. |

## 19. Testing the main flows

**Automated security test**

```bash
npm run check:security
```

It signs in as a seeded student, as the admin and as an anonymous visitor and tries things that must fail (a student creating a club, changing their own role, editing someone else's profile, joining a club on behalf of someone else, over-booking a full event, uploading into another user's folder, anonymous access to private data...) and things that must work. Every line should say `PASS`.

**Manual checklist**

1. Register a new student; you land on the dashboard and the profile shows your department and year.
2. Edit your profile and upload a photo; the sidebar and header update.
3. Join a club, then leave it; the member count changes and a toast appears.
4. Register for an event; "seats left" decreases. Register again from a second tab: you get "already registered". Cancel the registration.
5. Open the full event (Startup Pitch Clinic): the button reads "Event full" and is disabled. To see the database refuse the last seat, open the almost-full IoT workshop as two students in two windows, register in one, then click Register in the other: "Sorry, this event is full".
6. Upload a resource; view and download it; edit its title; delete it.
7. Comment on a club and an event; delete your comment. You cannot delete other people's comments.
8. As a student, open `/admin`: you are redirected to the dashboard.
9. As admin: create, edit and delete a club, an event and an announcement; promote and demote a user; delete a resource uploaded by a student.
10. Log out; opening `/dashboard` sends you to `/login`.

**Code checks**

```bash
npm run typecheck
npm run lint
npm run build
```

## 20. What changed compared with older tutorials

If you compare this code with tutorials from 2023-2024, these are the differences, and why:

| Older approach | Current approach used here |
|---|---|
| `middleware.ts` with `export function middleware` | **`proxy.ts`** with `export function proxy` (renamed in Next.js 16, runs on Node.js) |
| `@supabase/auth-helpers-nextjs` | **`@supabase/ssr`** (auth-helpers are deprecated) |
| cookie methods `get` / `set` / `remove` | **`getAll` / `setAll`**, and `setAll` also receives cache headers that the proxy copies onto the response |
| `supabase.auth.getSession()` or `getUser()` to protect pages | **`supabase.auth.getClaims()`**: verifies the JWT signature (locally with the project's public keys); `getSession()` must never be trusted on the server |
| `anon` / `service_role` keys, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **publishable / secret keys**, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` |
| New tables automatically available through the API | **Explicit `GRANT`s** are required (Supabase change, May 2026), then RLS policies |
| `auth.uid()` directly in policies | `(select auth.uid())` and `to authenticated` (faster, recommended by Supabase) |
| `tailwind.config.js`, `@tailwind base/components/utilities` | **`@import "tailwindcss"`** and `@theme` tokens in CSS; renamed utilities (`shadow-xs`, `bg-linear-to-r`, `shrink-0`, `outline-hidden`) |
| `next lint` | **`eslint`** CLI with a flat config (`next lint` was removed) |
| `params.id` read synchronously | **`await params`** / `await searchParams`, typed with the global `PageProps<"/route">` helper |
| `useFormState` from `react-dom` | **`useActionState`** from `react` (React 19) |
| `error.tsx` with `reset()` | **`retry()`** (Next.js 16.3) |
| `<Image priority>` | **`<Image preload>`** |
| Zod 3 (`z.string().email()`, `.flatten()`) | **Zod 4** (`z.email()`, `z.flattenError()`, `error` option) |
| lucide 0.x names (`Trash2`, `Loader2`) and brand icons | **lucide 1.x** canonical names (`Trash`, `LoaderCircle`); brand icons were removed |
| Uploading files through an API route | **Direct browser upload to Storage** protected by storage policies; the Server Action only saves the path |

## 21. Viva questions and answers

**1. What is CampusHub and who uses it?**
A student portal for one college. Students join clubs, register for events, read announcements, share study resources and comment. Admins manage students and all content. There are two roles, `student` and `admin`.

**2. Why Next.js and not a separate backend like Express?**
Next.js App Router can run code on the server itself: Server Components read data, Server Actions handle form submissions and Route Handlers serve special URLs. One project, one language, one deployment, and no extra API layer to secure.

**3. What is a Server Component? What is a Client Component?**
A Server Component runs only on the server: it can query the database directly and sends finished HTML, with no JavaScript for that component in the browser. A Client Component (`"use client"`) also runs in the browser, so it can use state and event handlers. CampusHub uses Server Components for all pages and Client Components only for interactive parts such as forms, dialogs and the mobile menu.

**4. What is a Server Action and how is it secured?**
An async function marked `"use server"` that the browser can call like a form submission (it becomes a POST request). Because anyone could send that POST request by hand, every action first calls `requireUser()` or `requireAdmin()`, validates input with Zod and then writes to Supabase, where Row Level Security checks the permission again.

**5. How does login work?**
The login form calls the `login` Server Action, which calls `supabase.auth.signInWithPassword`. Supabase returns a session (a signed JWT plus a refresh token) that `@supabase/ssr` stores in cookies. On later requests the server reads the cookie, and `proxy.ts` refreshes the token before it expires.

**6. What is `proxy.ts`?**
Code that runs before every request. In Next.js 16 it replaced `middleware.ts`. CampusHub uses it to refresh the Supabase session cookie and to redirect visitors who are not logged in to `/login`. It is only a first, fast check; the real checks happen in `lib/auth.ts` and the database.

**7. Why `getClaims()` instead of `getSession()`?**
`getSession()` just reads the cookie, which a user could forge. `getClaims()` verifies the token's cryptographic signature (using the project's public keys), so the user id can be trusted on the server.

**8. What is Row Level Security?**
A Postgres feature that attaches rules (policies) to a table. Every query is filtered by those rules for the user who runs it. For example, the `comments` delete policy is `author_id = auth.uid() or is_admin()`, so a student can delete only their own comments even if they call the API directly.

**9. What is the difference between a GRANT and an RLS policy?**
A GRANT decides whether a role may perform an operation on a table (or column) at all. A policy decides which rows. Both must allow an operation. CampusHub grants `UPDATE` on only six profile columns, so the `role` column can never be changed by a student, whatever the policy says.

**10. How do you stop a student from becoming admin?**
Three ways: the sign-up trigger always inserts `role = 'student'` (it ignores user input), the `role` column is not updatable by the `authenticated` role (column GRANT), and role changes only happen in an admin-only Server Action that uses the secret key after `requireAdmin()`.

**11. How are duplicate registrations and over-booking prevented?**
A unique constraint on `(event_id, user_id)` makes a second registration impossible. A `before insert` trigger counts registrations and raises `EVENT_FULL` when capacity is reached; it locks the event row first, so two students cannot take the last seat at the same moment.

**12. Why is `is_admin()` a `security definer` function in a `private` schema?**
Policies on other tables need to read `profiles.role`. Reading `profiles` from inside a `profiles` policy would recurse forever. A `security definer` function runs with its owner's rights, which avoids the recursion, and putting it in a schema that is not exposed through the API means nobody can call it directly.

**13. Explain the database design.**
Eight tables: `profiles`, `clubs`, `events`, `announcements`, `resources`, `comments` and two join tables, `club_members` and `event_registrations`, which model the many-to-many relations "students join clubs" and "students register for events". UUID primary keys, foreign keys with `on delete cascade`, unique constraints and indexes on foreign keys and sort columns.

**14. How does file upload work?**
The browser uploads the file directly to Supabase Storage into a folder named after the user's id; a storage policy only allows uploads into your own folder. Then the form sends the file path to the `createResource` Server Action, which saves the metadata row. Study resources are in a private bucket, so viewing or downloading goes through `/resources/[id]/file`, which checks the login and redirects to a signed URL that expires after 60 seconds.

**15. Why upload from the browser instead of through the server?**
Server Actions accept 1 MB by default and hosting platforms limit request size. Direct upload avoids those limits and saves bandwidth, and it is still secure because Storage has its own policies.

**16. How does the page update after a change?**
After writing, the Server Action calls `revalidatePath()` for the affected pages. Next.js re-renders the current page on the server and sends the new result in the same response, so the member count or seats-left number updates without a manual refresh. The action also returns a message that the page shows as a toast.

**17. How are forms validated?**
Twice: the browser uses HTML attributes (`required`, `type="email"`, `maxLength`) for instant feedback, and the server validates everything again with Zod schemas in `lib/validation.ts`. Field errors are returned from the action and shown under each field.

**18. What are the environment variables and which are secret?**
The Supabase URL and publishable key are public (the publishable key is safe because RLS protects the data). The secret key bypasses RLS, so it is only used in server code (admin actions, seed script) and never has the `NEXT_PUBLIC_` prefix.

**19. What happens if JavaScript is disabled?**
Pages are server-rendered, so all content still appears and links work. Interactive pieces such as dialogs need JavaScript.

**20. What would you add next?**
Real-time updates for comments with Supabase Realtime, email reminders before events, a QR code check-in for event attendance, pagination for very large lists, and automated end-to-end tests with Playwright.
