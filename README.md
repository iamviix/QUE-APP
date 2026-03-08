# Que App — Vercel Deploy Guide

## What's in this folder

```
que-app/
├── pages/
│   ├── index.jsx      ← Link-in-bio + client tracker (your Instagram bio URL)
│   ├── admin.jsx      ← Full admin app (projects, clients, delivery links)
│   ├── _app.js        ← Next.js wrapper
│   └── _document.js   ← Head/meta tags
├── storage.js         ← Shared localStorage utility
├── next.config.js     ← Next.js config
├── package.json       ← Dependencies
└── README.md          ← This file
```

## URLs once deployed

| URL | What it is |
|-----|-----------|
| `track.videoandphotonearme.com` | Client-facing link-in-bio + tracker |
| `track.videoandphotonearme.com/admin` | Your admin panel |

## Deploy to Vercel (5 minutes)

1. Go to **vercel.com** → sign up free with GitHub or email
2. Click **Add New Project** → **Upload** (drag this entire `que-app` folder)
3. Leave all settings as default → click **Deploy**
4. Vercel gives you a URL like `que-app-abc123.vercel.app`

## Connect your IONOS subdomain

### Step 1 — Add domain in Vercel
- Go to your project → **Settings** → **Domains**
- Add `track.videoandphotonearme.com`
- Vercel shows you a CNAME value to copy

### Step 2 — Add DNS record in IONOS
- Log into ionos.com → **Domains & SSL** → **videoandphotonearme.com**
- Click **Subdomains** → **Create Subdomain** → type `track`
- Then in DNS settings add:
  ```
  Type:  CNAME
  Host:  track
  Value: cname.vercel-dns.com
  TTL:   3600
  ```

### Step 3 — Update Instagram bio
- Change your bio link to: `https://track.videoandphotonearme.com`

DNS takes 30 min–24 hours to propagate. Usually kicks in within the hour.

## Admin access

Go to `track.alphabetfilms.com/admin`  
PIN: **1234** (change this in `pages/admin.jsx` line 4 — `const ADMIN_PIN = "1234"`)

## How data works

Everything saves to the visitor's browser `localStorage`.  
Admin data and client data share the same storage when accessed from the same domain — so changes you make in `/admin` appear instantly when clients check `/`.

---
Built with Next.js · Deployed on Vercel · @alphabetfilms
