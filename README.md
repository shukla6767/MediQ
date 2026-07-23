# 🏥 MediQ

MediQ is a real-time hospital queue management platform. It replaces the physical "take a paper token and wait" experience with a digital queue: patients book a token online, watch their position update live, and get an SMS/WhatsApp nudge when their turn is close — while hospital staff run the floor from role-specific dashboards.

Under the hood it's a fairly complete piece of backend engineering for a student/portfolio project: JWT auth with refresh tokens, role-based access control, WebSocket-driven live queues, Redis-backed rate limiting, and a full BullMQ background-job pipeline for notifications, analytics, and cleanup — all wired to a Next.js frontend with Google Maps hospital search.

## ✨ Key Features

- **Live, real-time queues** — Socket.IO pushes `queue:patient_turn`, `queue:token_called`, `queue:token_skipped`, and `queue:token_recalled` events straight to every connected browser in a department, so screens update instantly with no polling.
- **Role-based dashboards** — separate experiences for **Patients**, **Doctors**, **Receptionists**, and **Admins**, each gated by JWT + RBAC middleware.
- **Race-condition-safe token numbers** — token numbers are generated via an atomic MongoDB counter (`$inc` with `upsert`) so two patients booking in the same millisecond can never collide.
- **Priority queueing** — `EMERGENCY` tokens are always sorted ahead of `NORMAL` ones when staff call the next patient.
- **Automatic SMS/WhatsApp reminders** — when a patient is 10 spots away from being called, a reminder job is silently queued in the background via Twilio, without blocking the API response.
- **Hospital discovery with Google Maps** — search, autocomplete, and geolocation-based "hospitals near me" backed by a `2dsphere` MongoDB index and a Google Places proxy (keeping API keys server-side).
- **Background job pipeline (BullMQ + Redis)**:
  - Nightly analytics compilation (patients served, average wait time, peak hour) — runs at 00:01 daily.
  - Hourly crowd-level prediction per department, cached in Redis for instant reads.
  - Expired-token cleanup — auto-cancels tokens still `WAITING` after 12 hours.
  - Doctor-offline handling — pausing a department and notifying every waiting patient if a doctor goes offline.
  - A notification "router" worker that fans a single alert out to SMS and WhatsApp queues.
- **Redis-backed rate limiting** — e.g. a patient can book at most 3 tokens per 15 minutes, enforced centrally so it holds even across multiple server instances.
- **Secure auth** — bcrypt-hashed passwords, short-lived access tokens + long-lived refresh tokens, Google OAuth login, and a hashed (not raw) password-reset-token flow with a 15-minute expiry.

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Backend | Express 5 (custom server, separate from Next.js) |
| Real-time | Socket.IO (JWT-authenticated WebSocket connections, room-based broadcasting) |
| Database | MongoDB via Mongoose |
| Cache / Queues | Redis (ioredis) + BullMQ for background jobs & cron-style scheduling |
| Auth | JWT (access + refresh tokens), bcrypt/bcryptjs, Google OAuth (`@react-oauth/google`) |
| Notifications | Twilio (SMS & WhatsApp), Nodemailer (password reset emails) |
| Maps | Google Maps JS API, Places Autocomplete (`@vis.gl/react-google-maps`, `@googlemaps/js-api-loader`) |
| Charts | Recharts (admin analytics) |
| Validation | Zod, react-hook-form |

## 🏗️ Architecture

MediQ runs as **two cooperating processes** on your machine during development:

1. **Next.js frontend** (`next dev`, port `3000`) — all the pages under `app/`.
2. **Express backend** (`nodemon server.js`, port `5000`) — REST API, Socket.IO server, and (in-process) BullMQ workers.

```bash
npm run dev
# runs `concurrently "npm run server" "npm run client"`
```

Both share the same MongoDB and Redis instances. The frontend talks to the API over HTTP (with cookies for auth) and opens a WebSocket connection to the same backend for live queue updates.

```
Patient books a token
        │
        ▼
Express Controller → QueueService.createToken()
        │                       │
        │            atomic $inc on QueueCounter (race-safe token #)
        │                       │
        ▼                       ▼
   Token saved in MongoDB   WebSocketPublisher.publish()
        │                       │
        ▼                       ▼
  BullMQ reminder job     Socket.IO room "department:<id>"
  (queued when 10th          │
   in line) → Redis           ▼
        │              All connected browsers in that
        ▼              department update instantly
  SMS/WhatsApp via Twilio
```

## 🗂️ Project Structure

```
MediQ/
├── app/                        # Next.js App Router pages
│   ├── admin/                  # Admin: dashboard, hospitals, departments, staff, analytics
│   ├── doctor/dashboard/       # Doctor's queue view
│   ├── reception/              # Receptionist: dashboard + live queue controls
│   ├── patient/                # Patient: book token, dashboard, my tokens
│   ├── hospital/[id]/          # Public hospital detail page
│   ├── login/ register/        # Auth pages
│   ├── forgot-password/        # Password reset request + confirm flow
│   └── profile/
├── components/                 # Navbar, Footer, DashboardShell, DataTable, StatCard, maps UI, etc.
├── controllers/                # Express controllers: admin, hospital, queue, user, maps
├── routes/                     # Express route definitions (REST API surface)
├── services/                   # QueueService (core engine), EventPublisher/WebSocketPublisher, Hospital/User/Maps services
├── models/                     # Mongoose schemas: User, Hospital, Department, Token, QueueCounter, Analytics
├── middlewares/                # verifyJWT, RBAC (isAdmin/isReceptionist/isPatient), Redis rate limiter, multer
├── socket/socket.js            # Socket.IO server bootstrap + JWT-authenticated connection handling
├── jobs/                       # BullMQ *producers* (enqueue jobs) + cron scheduler
├── workers/                    # BullMQ *consumers* (sms, whatsapp, reminder, analytics, crowd, cleanup, doctor, notification)
├── config/                     # Redis connection, BullMQ default queue options
├── db/                         # MongoDB connection setup
├── context/AuthContext.jsx     # Global React auth state
├── hooks/useQueueSocket.js     # Client-side Socket.IO hook for live queue subscriptions
├── utils/                      # ApiError, ApiResponse, asyncHandler, email service
└── server.js                   # Express app entry point — wires up HTTP + Socket.IO + workers
```

## 👥 User Roles

| Role | What they can do |
|---|---|
| **Patient** | Search/browse hospitals on a map, book a queue token for a department, track live position, cancel a booking, view token history. |
| **Doctor** | View their department's live queue. |
| **Receptionist** | Call the next patient, mark tokens complete/skipped, recall a skipped patient, view queue stats for their department. |
| **Admin** | Manage hospitals and departments (CRUD), register staff accounts, view system-wide and per-hospital analytics, monitor recent activity. |

## 🔌 API Overview

All routes are prefixed with `/api`.

| Base path | Purpose |
|---|---|
| `/api/auth` | Register, login, Google login, logout, refresh token, get current user, forgot/reset password, update profile & password |
| `/api/admin` | Hospital & department CRUD, staff registration *(admin-only)* |
| `/api/hospitals` | Public hospital listing/search + department listing; admin dashboard/system stats |
| `/api/queue` | Book/cancel a token, check status, call-next/complete/skip/recall (staff), queue stats, doctor queue |
| `/api/maps` | Server-side proxy for Google Places autocomplete |

Real-time queue events are delivered over Socket.IO on the same backend, using rooms named `department:<departmentId>` (clients `queue:subscribe` / `queue:unsubscribe` to join/leave).

## 🔐 Environment Variables

Create a `.env` file in the `MediQ/` project root:

```bash
# Server
PORT=5000
CORS_ORIGIN=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/mediqueue

# Redis (required for BullMQ background jobs & rate limiting)
REDIS_URL=redis://127.0.0.1:6379

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d

# Google OAuth (login)
GOOGLE_CLIENT_ID=your_google_client_id

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_js_api_key
GOOGLE_MAPS_SERVER_API_KEY=your_places_server_key

# Twilio (SMS & WhatsApp reminders)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# Email (password reset)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

> The app is written to degrade gracefully — Twilio and email features log a warning and skip sending rather than crashing the server if their credentials are missing, so you can run the core queueing features without setting up every third-party service.

## ▶️ Getting Started

**Prerequisites:** Node.js, a running MongoDB instance, and a running Redis instance (Redis is required — the rate limiter and all background workers depend on it).

```bash
# 1. Install dependencies
cd MediQ
npm install

# 2. Set up your .env (see above)

# 3. Make sure MongoDB and Redis are running locally

# 4. Start both the Express API and the Next.js frontend together
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000](http://localhost:5000)

To run only one side: `npm run client` (Next.js only) or `npm run server` (Express + Socket.IO + BullMQ workers only).

## 📎 Known Issues / Housekeeping

- `db/connectDb.js` appears to be an unused leftover — the app actually connects via `db/connect.js`. Safe to delete once confirmed unused.
- A few files under `routes/` (`loginButton.js`, `searchHospital.js`, `nearbyHospitals.js`, `currentCrowdLevel.js`) are empty React component stubs sitting in the Express `routes/` folder rather than `components/` or `app/` — likely early scaffolding that never got filled in or relocated.
- `routes/maps.routes.js` references `router` and `mapsController` without importing Express's `Router` or the controller — this file needs those imports added to actually work.
- `server.js` calls `app.use("/api/maps", mapsRoutes)` at the bottom of the file, after `server.listen(...)` has already been called, and `mapsRoutes` isn't imported anywhere — the maps route currently won't be mounted correctly. Move the import and `app.use` call up with the other route registrations.
- There are two `Navbar` files in `components/` (`Navbar.js` and `Navbar.jsx`) — worth confirming which one is actually in use and removing the other.
- The frontend's `AuthContext.jsx` hardcodes `http://localhost:5000` for API calls instead of reading from an environment variable, which will need updating before deploying anywhere other than localhost.

## 👤 Author

Built by [@shukla6767](https://github.com/shukla6767).
