# RestoreIt MVP

RestoreIt is a production-leaning MVP for an AI photo restoration app. Users can register, upload old photos, create restoration jobs, monitor progress, compare original vs. processed output, and download the completed image.

The current processing flow uses a mock provider built on top of `sharp` so the product works end to end without blocking on real AI inference. The backend is structured so a future AI provider can replace the mock cleanly.

## Stack

- Frontend: TanStack Start (SSR) + React + TypeScript
- Data fetching: TanStack Query
- Styling: Tailwind CSS v4
- Backend: NestJS + TypeScript
- Database: PostgreSQL + Prisma ORM
- Auth: Email/password + JWT bearer token
- Storage: Cloudflare R2 object storage

## Project Structure

```text
.
├── apps
│   ├── api
│   │   ├── prisma
│   │   │   ├── migrations/0001_init/migration.sql
│   │   │   └── schema.prisma
│   │   └── src
│   │       ├── auth
│   │       ├── common
│   │       ├── health
│   │       ├── jobs
│   │       ├── photos
│   │       ├── prisma
│   │       ├── processing
│   │       ├── storage
│   │       ├── users
│   │       ├── app.module.ts
│   │       └── main.ts
│   └── web
│       ├── src
│       │   ├── components
│       │   ├── hooks
│       │   ├── lib
│       │   ├── routes
│       │   ├── router.tsx
│       │   └── styles.css
│       └── vite.config.ts
├── package.json
├── tsconfig.base.json
└── README.md
```

## Backend Architecture

Modules:

- `auth`: register, login, current user, JWT verification
- `users`: user persistence helpers
- `photos`: file upload and photo metadata persistence
- `jobs`: job creation, list/detail/status, download
- `processing`: provider abstraction plus mock pipeline
- `health`: healthcheck route
- `prisma`: global Prisma service
- `storage`: Cloudflare R2-backed storage abstraction

Core processing abstraction:

- `ProcessingProvider`
- `MockProcessingProvider`
- `FutureAiProcessingProvider`

Job lifecycle:

- `pending`
- `processing`
- `completed`
- `failed`

## Frontend Architecture

Routes:

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/jobs/new`
- `/jobs/:jobId`
- `/settings`

Key UI building blocks:

- auth form
- protected route wrapper
- app shell
- upload form
- dashboard job cards
- job status badge
- before/after comparison

## API Surface

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/photos/upload`
- `POST /api/jobs`
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `GET /api/jobs/:id/status`
- `GET /api/jobs/:id/download`
- `GET /api/health`

Swagger is exposed at `http://localhost:4000/api/docs`.
The web app runs on `http://127.0.0.1:3000` in dev.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Update `apps/api/.env` with a running PostgreSQL database and Cloudflare R2 credentials:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/restoreit
JWT_SECRET=change-me
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=restoreit
R2_PUBLIC_URL=https://pub-your-bucket-id.r2.dev
```

If you want a local database quickly, start the included Docker Postgres service:

```bash
npm run db:start
```

### 3. Run Prisma

```bash
npm run db:generate
npm run db:migrate
```

### 4. Start the apps

Run both apps together:

```bash
npm run dev
```

Or start them separately.

API:

```bash
npm run dev:api
```

Web:

```bash
npm run dev:web
```

## Scripts

Root scripts:

- `npm run dev:api`
- `npm run dev:web`
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:start`
- `npm run db:stop`

## Notes

- The frontend uploads the file first, then creates a job using the returned `photoId`.
- Dashboard and job detail polling refresh every 2 seconds while a job is pending or processing.
- Uploaded originals and processed images are stored in Cloudflare R2.
- Replace `MockProcessingProvider` with a real AI-backed provider later without changing the job or REST layers.
- TanStack Start generates `routeTree.gen.ts` on first dev/build run.
