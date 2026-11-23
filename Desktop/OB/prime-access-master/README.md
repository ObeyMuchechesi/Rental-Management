# Prime Access — Immigration Consultancy Firm Website

A premium, fully responsive lead-generation platform for **Prime Access Immigration Consultancy Firm**, built with the **MERN stack** (MongoDB, Express, React, Node.js) and **Tailwind CSS**.

WhatsApp and inquiry notifications sit at the centre of the client communication workflow: every inquiry submitted on the website triggers an **instant WhatsApp alert** (plus optional email/webhook backups) to Prime Access, and the client immediately receives a confirmation with a one-tap "continue on WhatsApp" link.

---

## ✨ Features

### Public website
- **Home** — hero with WhatsApp / Call / Inquiry CTAs, services preview, the full client journey, videos, testimonials, business hours and quick-support panel.
- **About Us** — company profile, mission, values and professional approach.
- **Services** — UK visa & immigration, visit visas, student visas, business visas, Schengen assistance, university placement, eVisa account creation, refusal-letter guidance (fully editable).
- **Service detail pages** — each with service-specific pre-filled WhatsApp messages.
- **Contact** — inquiry form, phone, WhatsApp, email, business hours, Facebook and optional map.
- **Privacy Policy & Terms & Conditions** pages.
- Floating WhatsApp bubble, announcement banner, SEO meta tags, mobile-first responsive design.

### Lead generation & notifications
- Online inquiry form capturing **name, phone/WhatsApp, email, destination, service required and message**.
- On submission the client receives an **immediate confirmation** with a reference number.
- Prime Access receives an **instant WhatsApp alert** with the full inquiry details.
- **Email alert backup** (SMTP) and optional **webhook**, so no inquiry is missed.
- **Admin dashboard "Reply on WhatsApp"** one-click shortcut that opens a pre-filled chat (used when no paid WhatsApp API is configured).
- Spam protection: hidden honeypot field + per-IP rate limiting.

### Admin dashboard (secure login)
- **Inquiries** — search, filter by status (new / in progress / completed), view details, alert delivery status, reply on WhatsApp/call/email, delete.
- **Services** — add / edit / remove / publish services.
- **Site Settings** — business hours, contact details, announcements, hero text, testimonials, videos, SEO.
- **Media** — upload images & videos (up to 200 MB), publish/unpublish, delete.
- **Analytics** — page views, service views, WhatsApp/call clicks, inquiries, top pages & services over 7/30/90 days.
- Change password; JWT-secured API; bcrypt-hashed passwords.

---

## 🚀 Quick Start

Requirements: **Node.js 18+**, npm.

```bash
# 1. Server
cd server
cp .env.example .env     # review and edit
npm install
npm run seed             # creates admin account + default services
npm run dev              # API on http://localhost:5000

# 2. Client (new terminal)
cd ../client
npm install
npm run dev              # website on http://localhost:5173
```

Then open:
- Website → http://localhost:5173
- Admin → http://localhost:5173/admin/login (default credentials from `.env` / seed output, e.g. `admin@primeaccess.co.zw` / `ChangeMe123!`)

### MongoDB
- **No setup needed for development**: if `MONGO_URI` is empty the server automatically starts an in-memory MongoDB (data resets on restart).
- **Production**: set `MONGO_URI` to a real connection string (Atlas or local install). Use `npm run seed` to populate initial content.

---

## 📱 WhatsApp Notification Setup

Three layers, configured in `server/.env`:

| Layer | How | When used |
|---|---|---|
| **WhatsApp API alert** | `WHATSAPP_PROVIDER=twilio` or `meta` + credentials + `ADMIN_WHATSAPP` | Instant WhatsApp message to the admin on every inquiry |
| **Email alert** | `SMTP_HOST/USER/PASS` + `ALERT_EMAIL` | Backup so nothing is missed; also sends the client confirmation email |
| **Dashboard shortcut** | built-in | Always available — one click opens the inquiry pre-filled in WhatsApp |

Example (Twilio):
```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
ADMIN_WHATSAPP=447829841469
```

Example (Meta WhatsApp Business Cloud API):
```env
WHATSAPP_PROVIDER=meta
META_WHATSAPP_TOKEN=EAAG...
META_WHATSAPP_PHONE_ID=1234567890
ADMIN_WHATSAPP=447829841469
```

`WHATSAPP_NUMBER` controls the click-to-chat buttons shown across the public site.

---

## 🗂 Project Structure

```
prime-access/
├── server/                  # Express + Mongoose API
│   ├── src/
│   │   ├── index.js         # app entry, routes, static uploads
│   │   ├── db.js            # Mongo connection (+ in-memory dev fallback)
│   │   ├── seed.js          # admin + default services
│   │   ├── models/          # Inquiry, Service, Setting, Media, Admin, AnalyticsEvent
│   │   ├── routes/          # auth, inquiries, services, settings, media, analytics
│   │   ├── middleware/      # JWT auth, rate limiting
│   │   └── lib/notify.js    # WhatsApp/email/webhook notification engine
│   └── uploads/             # uploaded images & videos (gitignored)
└── client/                  # React + Vite + Tailwind
    └── src/
        ├── pages/           # Home, About, Services, ServiceDetail, Contact, Privacy, Terms
        ├── admin/           # Login, Dashboard, Inquiries, Services, Settings, Media, Analytics
        └── components/      # Navbar, Footer, WhatsAppFloat, InquiryForm, VideoBlock, ...
```

---

## 🔒 Security & Ownership

- HTTPS/SSL in production (configure at your host), JWT-secured admin API, bcrypt password hashing, login rate limiting, inquiry rate limiting + honeypot, secure handling of personal data.
- Full ownership: this codebase, the domain and hosting are entirely yours.
- Architecture is ready to grow into online booking, payments, CRM, client accounts, document submission and application tracking (the Inquiry model already keeps a status history for exactly this).

## 🌐 Deployment

### Option A — Vercel (recommended, already configured)

The repo is already wired for Vercel: `index.js` at the root exports the Express app
(zero-config Express serverless function) and the build copies the React app into
`public/` for CDN serving. Media uploads use **Vercel Blob** so videos and images
persist (no disk on serverless).

1. **Push the repo** to GitHub and import it at **vercel.com/new** (framework preset:
   *Other*). No manual build settings needed — `vercel.json` sets the build command.
2. **Add project env vars** (Project → Settings → Environment Variables):

   | Variable | Value |
   |---|---|
   | `MONGO_URI` | your Atlas connection string (already used locally) |
   | `JWT_SECRET` | a long random string |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | initial admin (auto-created on first request) |
   | `WHATSAPP_NUMBER` | Prime Access WhatsApp number (digits, with country code) |
   | `BLOB_READ_WRITE_TOKEN` | from Storage → Blob → your store (see step 3) |
   | `VITE_UPLOAD_MODE` | set to `blob` (inlined into the client build) |
   | `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `ALERT_EMAIL` | optional email alerts |
   | `WHATSAPP_PROVIDER` + Twilio/Meta credentials + `ADMIN_WHATSAPP` | optional live WhatsApp alerts |

3. **Create a Blob store**: Vercel dashboard → **Storage → Blob → Create** (public access
   mode) → copy the read/write token into `BLOB_READ_WRITE_TOKEN`. The admin dashboard's
   Media page then uploads files straight from the browser to Blob — up to 200 MB videos,
   with a progress bar.
4. **Deploy** — you get an `https://<project>.vercel.app` URL with SSL automatically.
5. **Custom domain**: Project → Settings → Domains → add your domain and add the DNS
   record Vercel shows you (usually a CNAME of `www` → `cname.vercel-dns.com` and an
   ALIAS/A record for the apex). SSL is provisioned automatically and renews itself.
6. Optional: `npm i -g vercel`, then `vercel dev` reproduces the exact production
   behavior locally (`vercel link` + `vercel env pull` first).

> **Note:** every new inquiry still triggers the WhatsApp/email alert chain —
> notifications are server-side and work identically on Vercel.

### Option B — Traditional server (Render, Railway, VPS)

1. Set `NODE_ENV=production`, `MONGO_URI` and a strong `JWT_SECRET`.
2. `npm run build` (builds the client and copies it to `public/`).
3. `npm run start` — the server serves the built React app automatically and keeps
   uploads on disk under `server/uploads` (mount a persistent volume there).