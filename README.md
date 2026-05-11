# Marquei

Scheduling system for salons and clinics with three access profiles: **Manager**, **Professional**, and **Client**.

---

## Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Angular 21 + SSR | Opinionated framework with native dependency injection, robust routing, and SSR support with no extra configuration — suitable for a product that may need SEO in the future |
| Estilos | Tailwind CSS v4 | Utility-first with no custom CSS; v4 has better build performance and theme syntax via native CSS |
| Reatividade | RxJS + Angular Signals | Signals for simple global state (auth), RxJS for data streams and reactive filters in lists |
| HTTP | Angular HttpClient + Interceptor | Transparent automatic token refresh for the rest of the application |
| Backend | NestJS + Supabase + Prisma | Separate repository |

---

## Running locally

### Prerequisites

- Node.js 20+
- npm 11+
- Marquei backend running at https://marquei-backend.onrender.com/ or locally

### 1. Clone and install dependencies

```bash
git clone <url-do-repositorio>
cd marquei
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with the API URL:

```
API_URL=http://localhost:3000 or https://marquei-backend.onrender.com
```

### 3. Start the development server

```bash
npm start
```

The app will be available at `http://localhost:4200`.

### 4. (Optional) Build with SSR

```bash
npm run build
node dist/marquei/server/server.mjs
```

The `API_URL` variable is read at runtime by the SSR server — no rebuild needed to switch endpoints.

---

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `API_URL` | NestJS API base URL | `https://marquei-backend.onrender.com or http://localhost:3000` |

---

## Test credentials

Create users via `/register` or through the backend seed. One per profile:

| Profile | E-mail | password |
|---|---|---|
| Manager | `maria@test.com` | `test123` |
| Professional | `artur@email.com` | `test123` |
| Client | `bob@email.com` | `test123` |

> Login automatically redirects to the correct area based on the user's profile.

---

## Architecture decisions

**Routing and profile isolation.** Each profile (MANAGER, PROFESSIONAL, CLIENT) loads its own lazy-loaded module, protected by two guards in sequence: `authGuard` checks the active session and  `roleGuard` vvalidates the role before rendering any route. This prevents components from one profile from being loaded into another profile's bundle and makes it straightforward to add new profiles in the future.

**Stateless authentication with transparent refresh.** The `accessToken` vlives only in memory (Angular Signal), never in `localStorage`. The `refreshToken` is an HttpOnly cookie managed by the backend. The HTTP interceptor catches 401 responses, requests a new token at `/auth/refresh` and retries the original request, all invisible to services and components. On app initialization, `initSession()` attempts to restore the session via refresh before rendering any protected route.

---

## What was left out

- **Unit tests** — no unit tests were written;
- **Mobile responsiveness** — the sidebar is hidden on smaller screens (`hidden lg:flex`) but there is no alternative navigation for mobile.
- **Pagination in lists** — clients, professionals, and appointments all load every record at once.
- **Real-time notifications** — appointment status is updated via manual polling; WebSockets or SSE would provide a better UX.

**Given more time:**
I would extract the inline sidebar from `dashboard.component.html` into the same reusable component already used by the other modules, eliminating the code duplication that caused the Import link bug; add integration tests for the critical routes (login, scheduling, import); and implement server-side pagination for the listings.
