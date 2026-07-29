# Dorsey Attendance Center — PTO Sign Up Sheet

Volunteer signup form for the **Dorsey Attendance Center Parent Teacher Organization**.

## Sign up fields

- Name  
- Phone Number  
- Children (up to 4): separate **Name** and **Grade** per child  
- Events to Help In (multi-select):
  - Bulldog Bites - During School Day  
  - Fall Festival - After School  
  - Bulldog Boutique - During School Day  
  - Additional Events - During & After School Hours  

## Auto-email on submit

Each completed signup is emailed to:

- carlsheppard1392@gmail.com  
- hspenser@itawambacountyschools.com  
- mhmitchell@itawambacountyschools.com  
- kameroneskew@yahoo.com  

Email is sent via [Resend](https://resend.com). Set these environment variables (local `.env.local` and Vercel Project Settings):

```bash
RESEND_API_KEY=re_xxxxxxxx
# Optional, after domain verification:
# RESEND_FROM=Dorsey PTO <pto@yourdomain.com>
```

> **Note:** On Resend’s free tier without a verified domain, mail can only go to the Resend account owner. Verify a domain (or use a school domain) so all four board addresses receive the form.

## Stack

- Next.js · TypeScript · Tailwind CSS · Resend · Vercel  

## Local development

```bash
cd CS-PTO
cp .env.example .env.local   # add RESEND_API_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

```bash
vercel --prod
```

Add `RESEND_API_KEY` (and optional `RESEND_FROM`) in the Vercel project environment variables, then redeploy.

Live: [https://cs-pto.vercel.app](https://cs-pto.vercel.app)
