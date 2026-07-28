# CS-PTO

**Parent Teacher Organization** volunteer & event signup sheet. Families can sign up to help with events, classroom activities, fundraisers, and hospitality. View a monthly calendar of who’s volunteering, manage confirmation status, and export the sheet as CSV.

## Features

- Volunteer signup (name, student, contact, event/role, dates, category, notes)
- Categories: event volunteer, classroom help, fundraising, hospitality, other
- Stats: helping today, upcoming, confirmed, total volunteers
- Month calendar of volunteer coverage
- Filterable signup sheet with status (confirmed / pending / cancelled)
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

```bash
vercel --prod
```

Or push to GitHub — production auto-deploys at [cs-pto.vercel.app](https://cs-pto.vercel.app).

## Scripts

| Command         | Description               |
|-----------------|---------------------------|
| `npm run dev`   | Local dev server          |
| `npm run build` | Production build          |
| `npm run start` | Start production server   |
| `npm run lint`  | ESLint                    |

## Note on data

Signups are saved per browser via `localStorage`. Use **Export CSV** to share or back up. For a shared multi-user database (everyone sees the same sheet), we can add Vercel Postgres / Neon later.
