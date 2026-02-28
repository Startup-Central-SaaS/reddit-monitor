# WorkCentral Reddit Monitor

A free, self-hosted Reddit keyword monitoring tool — your own Pulse replacement. Scans target subreddits for posts matching your keywords, emails you matches, and provides a dashboard to review, draft responses, and track what you've replied to.

**Total cost: $0/month**

## Architecture

- **Vercel** (free Hobby tier) — Hosts the Next.js app + API routes
- **Supabase** (free tier) — PostgreSQL database for storing matches
- **Resend** (free tier) — Sends email alerts (100/day)
- **cron-job.org** (free) — Pings your scan endpoint every 15 minutes
- **Reddit public JSON** — No API key needed. Uses Reddit's public `.json` endpoints.

## Setup Guide

### 1. Supabase Project

1. Go to https://supabase.com and create a free project
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Go to **Settings → API** and note your **Project URL** and **anon/public key**

### 2. Resend Account

1. Go to https://resend.com and create a free account
2. Get your **API key** from the dashboard
3. Free tier: you can send to your own email immediately (no domain verification needed)

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values.

### 4. Deploy to Vercel

1. Push this project to a GitHub repo
2. Go to https://vercel.com, import the repo
3. Add all environment variables from `.env.local` in the Vercel project settings
4. Deploy

### 5. Set Up cron-job.org

1. Go to https://cron-job.org and create a free account
2. Create a new cron job:
   - **URL:** `https://your-vercel-app.vercel.app/api/scan-reddit`
   - **Schedule:** Every 15 minutes
   - **HTTP Method:** GET
   - **Headers:** Add `Authorization: Bearer YOUR_CRON_SECRET` (use the same value as CRON_SECRET in your .env)
3. Enable the job

### 6. Local Development

```bash
npm install
npm run dev
```

Visit http://localhost:3000 for the dashboard.

Test the scanner: http://localhost:3000/api/scan-reddit (add your auth header)

## Configuration

Edit `src/lib/keywords.js` to customize:
- Target subreddits
- Keywords and their categories
- WorkCentral-specific feature mapping

## Dashboard Features

- View all Reddit matches with title, snippet, subreddit, matched keywords
- Filter by status: New, Drafted, Sent, Archived
- Filter by subreddit
- Draft responses directly in the dashboard
- Open posts directly in Reddit
- Mark posts as responded to
- Delete irrelevant matches
- Email alerts for new matches with direct links
