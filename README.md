# CS-PTO

Customer Success **PTO signup sheet**. Team members can log vacation, sick, and personal time off, view a monthly calendar of who’s out, and export the sheet as CSV.

## Features

- Sign up for PTO (name, email, dates, type, notes)
- Stats: on leave today, upcoming, total days
- Month calendar with coverage at a glance
- Filterable sheet with status (scheduled / pending / cancelled)
- Export to CSV
- Data stored in the browser (`localStorage`) — no backend required

## Stack

- [Next.js](https://nextjs.org) (App Router)
- TypeScript
- Tailwind CSS
- Deployed on [Vercel](https://vercel.com)

## Local development

```bash
cd CS-PTO
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

### Option A — CLI

```bash
npm i -g vercel   # if needed
vercel            # preview
vercel --prod     # production
```

### Option B — GitHub

1. Push this repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Framework preset: **Next.js** (auto-detected)
4. Deploy

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `npm run dev` | Local dev server         |
| `npm run build` | Production build       |
| `npm run start` | Start production server|
| `npm run lint`  | ESLint                 |

## Project layout

```
app/           # Next.js App Router pages
components/    # UI (form, list, calendar, stats)
lib/           # Types, storage, calendar helpers
```

## Note on data

Entries are saved per browser via `localStorage`. Use **Export CSV** to share or back up. For a shared multi-user database, we can add Vercel Postgres / Neon later.
