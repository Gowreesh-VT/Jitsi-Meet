# MIC Meet Portal (Jitsi-Meet)

A retro-futuristic event portal for Microsoft Innovations Club. Members can browse upcoming sessions and hackathons, register with their profile details, and join live Jitsi meetings. Admins can create events, publish/unpublish, open/close meets, and promote new admins.

## Features

- Event schedule with live/upcoming/past sections and domain filters.
- Google OAuth login via NextAuth.
- Registration capture (mobile number, registration number, institution details).
- Live Jitsi meeting access with join/leave tracking.
- Admin panel for event management, publishing, and participant tracking.
- Member dashboard for registered events and live join links.

## Tech Stack

- Next.js App Router, React 19, TypeScript.
- MongoDB + Mongoose.
- NextAuth (Google provider) with MongoDB adapter in dev.
- Tailwind CSS + shadcn/ui.
- Jitsi Meet External API.

## Requirements

- Node.js 18+ (or newer).
- MongoDB (local or hosted).
- Google OAuth credentials.
- Jitsi deployment (or use the hosted domain).

## Environment Variables

Create a `.env.local` with the following values:

```bash
# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/microsoftinnovationsclub

# NextAuth - Google provider
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Jitsi (optional overrides)
NEXT_PUBLIC_JITSI_DOMAIN=meet.microsoftinnovations.club
NEXT_PUBLIC_JITSI_SERVER=https://meet.microsoftinnovations.club

# Recommended for production deployments
NEXTAUTH_URL=https://your-domain.example
NEXTAUTH_SECRET=replace-with-a-strong-secret
```

Notes:

- `MONGODB_URI` is required in production and defaults to a local MongoDB instance in development.
- `NEXT_PUBLIC_JITSI_DOMAIN` is used to load `external_api.js` and defaults to `meet.microsoftinnovations.club`.
- `NEXT_PUBLIC_JITSI_SERVER` controls the meeting join URL (e.g., https://your-jitsi-domain).

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## App Routes

- `/` Landing page with schedule and sponsors.
- `/events/[id]` Event detail and join flow.
- `/dashboard` Member dashboard (requires sign-in).
- `/admin` Admin panel (requires admin role).
- `/login` Custom sign-in screen.

## API Routes

- `GET /api/events` List published events.
- `GET /api/events?includeUnpublished=true` (admin) List all events.
- `POST /api/events` (admin) Create an event.
- `GET /api/events/:id` Fetch event details.
- `PUT /api/events/:id` (admin) Update an event.
- `DELETE /api/events/:id` (admin) Delete an event.
- `GET /api/events/:id/status` Get live status and registration flags.
- `POST /api/events/:id/meet/join` Log a join action.
- `POST /api/events/:id/meet/leave` Log a leave action.
- `POST /api/registrations` Register for an event.
- `GET /api/registrations/:eventId` View registrations (admin or current user).
- `GET /api/user/profile` Pull saved profile data from last registration.
- `POST /api/admin/promote` (admin) Promote a user to admin role.
- `GET|POST /api/auth/[...nextauth]` NextAuth handlers.

## Data Model (MongoDB)

- `User` - Google-authenticated users with `role` (`user` or `admin`).
- `Event` - Schedule items with domain, type, room name, and publish/live state.
- `Registration` - Per-user registration info and meet attendance history.

## Admin Bootstrapping

New users start with `user` role. To create the first admin:

1. Sign in once with Google so the user is created.
2. Promote the email using the admin endpoint or directly in MongoDB.

Example request:

```bash
curl -X POST http://localhost:3000/api/admin/promote \
	-H "Content-Type: application/json" \
	-d '{"email": "name@example.com"}'
```

After promotion, visit `/admin` to manage events.

## License

See [LICENSE](LICENSE).
