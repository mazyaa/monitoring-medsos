## Local Development

1. Install dependencies.

```bash
npm install
```

2. Copy environment template.

```bash
cp .env.example .env
```

3. Fill env values.

4. Start app.

```bash
npm run dev
```

## Required Environment Variables

- `YOUTUBE_API_KEY`
- `APIFY_TOKEN`
- `DATABASE_URL`

## Optional Environment Variables

- `DIRECT_URL`
- `APIFY_BASE_URL` (default: `https://api.apify.com/v2`)
- `APIFY_INSTAGRAM_ACTOR_ID` (default: `apify/instagram-scraper`)
- `APIFY_TIKTOK_ACTOR_ID` (default: `clockworks/tiktok-scraper`)
- `APIFY_INSTAGRAM_FETCH_WINDOW_SIZE` (default: `50`)
- `APIFY_TIKTOK_FETCH_WINDOW_SIZE` (default: `50`)
- `APIFY_RUN_TIMEOUT_MS` (default: `55000`)
- `APIFY_RUN_POLL_INTERVAL_MS` (default: `2000`)

## Deploy to Vercel

1. Import repository to Vercel.
2. Keep framework preset as Next.js.
3. Build command uses project default `npm run build`.
4. Add environment variables in Vercel Project Settings:
	- `YOUTUBE_API_KEY`
	- `APIFY_TOKEN`
	- `DATABASE_URL`
	- `DIRECT_URL` (recommended for Prisma migration/maintenance workflows)
	- Optional APIFY variables listed above
5. Deploy.

Notes:
- API routes for YouTube, Instagram, and TikTok are configured with Node.js runtime and `maxDuration=60`.
- Build script includes `prisma generate` before `next build`, so Prisma client is generated during deployment.
