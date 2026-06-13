# BusyQ — Real-Time Crowd Heatmaps

BusyQ shows you how busy restaurants, bars, and venues are in real time. It combines simulated Google Popular Times data with user-submitted crowd reports and live queue data to generate **crowd heatmaps**.

## Features

- **Crowd Heatmap** — Leaflet-based heatmap overlay showing live busyness intensity (red = packed, green = quiet)
- **Live Queue Management** — Users can join queues; restaurant owners can notify/seat/manage entries
- **Table Reservations** — Users book tables; owners confirm or deny
- **Photo Sharing** — Users upload photos of venues to show the current vibe (like Instagram feed per venue)
- **Restaurant Dashboard** — Owners claim their Google Place listing, control queues, review reservations, toggle busyness
- **Crowd Reports** — Users report current crowd level (1–5) to contribute to the heatmap
- **PWA Ready** — Installable on mobile, works offline with cached UI

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Map | Leaflet + leaflet-heat |
| Auth | Local auth store (swap to Supabase Auth) |
| Database | In-memory file store (swap to Supabase PostgreSQL) |
| Styling | Tailwind CSS |
| Icons | Lucide React |

## Architecture

```
/src
├── app/              # Next.js App Router pages & API routes
│   ├── api/          # REST API (places, queue, reservations, photos, reports)
│   ├── auth/         # Login & signup pages
│   ├── dashboard/    # Restaurant owner dashboard
│   ├── place/[id]/   # Place detail (busyness gauge, queue, photos, reserve)
│   └── upload/       # Photo upload page
├── components/       # React components
│   ├── map/          # Leaflet MapView + heatmap
│   ├── places/       # PlaceCard, BusynessGauge, PhotoFeed
│   ├── queue/        # QueueWidget
│   ├── auth/         # AuthForm
│   ├── layout/       # Header
│   └── ui/           # Button, Card, Input, Badge
├── lib/              # Shared libraries
│   ├── auth/         # Auth store (localStorage)
│   ├── db/           # Mock database (file-based JSON)
│   └── google-places/# Mock Google Places API
├── supabase/         # Supabase migrations (for production)
└── types/            # Shared TypeScript types
```

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying to Production (Port 8081)

### Quick Deploy

```bash
# Full deploy: build + start on port 8081
./deploy.sh deploy

# Or step by step:
./deploy.sh build    # Build the app
./deploy.sh start    # Start on port 8081
./deploy.sh status   # Check if running
./deploy.sh logs     # Tail server logs
./deploy.sh restart  # Stop + start
./deploy.sh stop     # Stop server
```

### NPM Scripts

```bash
npm run deploy          # Build + start interactive
npm run deploy:build    # Build only
npm run deploy:start    # Start in background on port 8081
npm run deploy:stop     # Kill process on port 8081
npm run deploy:restart  # Stop then start
```

Set a custom port: `PORT=3000 ./deploy.sh deploy`

### Systemd Service (Linux)

```bash
sudo cp deploy/busyq.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now busyq
sudo systemctl status busyq
```

### Nginx Reverse Proxy

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/busyq
sudo ln -s /etc/nginx/sites-available/busyq /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Nginx handles gzip, security headers, static asset caching, and proxies to Next.js on 8081.

## How the Heatmap Works

Places contribute weighted intensity points to the heatmap:

```
intensity = (googlePopularity * 0.5) + (avgUserReport * 12) + (activeQueueCount * 5)
```

- **Google Popular Times** — Historical crowd data (simulated in dev, real Google Places API in production)
- **User Reports** — Real-time crowd reports scored 1–5
- **Queue Count** — Live number of people waiting

The heatmap re-renders when the user pans or zooms the map.

## Upgrading to Production

### Real Google Places API

1. Get a [Google Cloud API key](https://console.cloud.google.com)
2. Enable Places API and Maps JavaScript API
3. Replace `lib/google-places/mock.ts` with a real implementation using `@googlemaps/js-api-loader`

### Real Database (Supabase)

1. Set up a [Supabase](https://supabase.com) project
2. Run the migration at `supabase/migrations/00001_initial_schema.sql`
3. Install `@supabase/ssr` and `@supabase/supabase-js`
4. Replace `lib/db/mock.ts` with Supabase client calls
5. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Realtime

Enable Supabase Realtime on `queues` and `photos` tables. Subscribe to changes in the client to push live updates.

## Project Structure

```
busyq/
├── public/           # Static assets + PWA manifest
├── src/              # Source code (see above)
├── supabase/         # Database migrations
├── deploy/           # Deploy configs (nginx, systemd)
│   ├── nginx.conf
│   └── busyq.service
├── deploy.sh         # Deploy script (build + start/stop/restart)
├── .env.example      # Environment config template
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
└── README.md
```
