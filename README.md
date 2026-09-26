# FleekFlow

A supplier finishes a wholesale lot in conversation. The same confirmed record is what the buyer reads, and what a reviewer uses if the delivery does not match.

## Run locally

Node.js 20.9 or newer.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Fill `.env.local` from `.env.example`:

| Name | Where it is used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sessions, lots, and messages |
| `SUPABASE_SECRET_KEY` | Server-only Supabase access |
| `XAI_API_KEY` | Grok replies. If it is missing, the rule engine answers instead |

## Deploy

The app is a Next.js project. Vercel builds it with `npm run build` and deploys every push to `main`.

Set the three variables above for Production and Preview before the first deploy. Do not commit `.env.local`.

Production session cookies are `Secure` and `HttpOnly`. The supplier route allows up to 60 seconds so a Grok reply can finish.
