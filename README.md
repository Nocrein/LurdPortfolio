# Portfolio — Deploy Guide

## Default Admin Login
- **Email:** `admin@portfolio.dev`
- **Password:** `admin123`
> Change these immediately after first login via **Admin → Settings**

## Deploy to Railway (same as ArtSphere)

1. Push this folder to a GitHub repo
2. Go to railway.app → New Project → Deploy from GitHub
3. Select the repo — Railway auto-detects PHP via nixpacks.toml
4. Done! Your site is live.

## File Structure
```
portfolio/
├── index.html          ← Public portfolio (SPA)
├── router.php          ← Railway PHP router
├── nixpacks.toml       ← Railway build config
├── api/
│   ├── config.php      ← DB, auth, helpers
│   ├── auth.php        ← Login + change credentials
│   ├── posts.php       ← Timeline feed CRUD
│   ├── profile.php     ← Profile + skills data
│   ├── skills.php      ← Skills CRUD
│   ├── projects.php    ← Projects CRUD
│   └── messages.php    ← Contact form
├── admin/
│   ├── login.html      ← Admin login
│   └── dashboard.html  ← Admin panel
├── assets/
│   ├── css/main.css    ← Dark mode public styles
│   ├── css/admin.css   ← Dark mode admin styles
│   └── js/
│       ├── main.js     ← Public JS
│       └── admin.js    ← Admin JS
├── uploads/            ← Auto-created on first run
│   ├── posts/
│   ├── avatar/
│   └── projects/
└── database/           ← SQLite DB (auto-created)
```

## Features
- **Feed** — Facebook-style timeline posts with optional images
- **Projects** — Showcase with tech stack, live/GitHub links, featured flag
- **Info/Skills** — Skill bars grouped by category with animated fill
- **Contact** — Message form stored in DB, readable from admin inbox
- **Settings** — Change login email and password from within admin
- **Profile** — Name, tagline, bio, location, avatar, social links, resume URL
