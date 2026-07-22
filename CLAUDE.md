# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is two independently-built projects living side by side, not a monorepo with shared tooling:

- `chasel/` — Spring Boot backend (Java 17, Maven)
- `chasel-frontend/` — React + TypeScript frontend (Vite)

They communicate only over HTTP; there is no shared build, no shared types, and no workspace config linking them.

## Commands

### Backend (`chasel/`)

```
./mvnw spring-boot:run                        # run the API (http://localhost:8080)
./mvnw test                                    # run all tests
./mvnw test -Dtest=ChaselApplicationTests      # run a single test class
./mvnw clean package                           # build a jar
```

The H2 console is enabled at `/h2-console` (jdbc url `jdbc:h2:mem:taskdb`) — the database is in-memory and resets on every restart.

### Frontend (`chasel-frontend/`)

```
npm install
npm run dev        # Vite dev server, http://localhost:5173
npm run build       # tsc -b && vite build
npm run lint
```

The frontend has no test runner configured.

The API base URL is read from `VITE_API_URL` (see `src/api/axios.ts`); there is no committed `.env` file, so it must be set locally (e.g. `chasel-frontend/.env.local` with `VITE_API_URL=http://localhost:8080/api`) or requests will go out with an undefined base URL.

## Backend architecture

Standard Spring Boot layering under `com.app.chasel`: `controller` → `service` → `repository` → `model`, plus `security` and `config`.

- **Auth is stateless JWT, not sessions.** `SecurityConfig` sets `SessionCreationPolicy.STATELESS`, disables CSRF, permits `/api/auth/**` unauthenticated, and requires authentication for everything else. `JwtAuthFilter` (in `security/`) runs before `UsernamePasswordAuthenticationFilter`, reads the `Bearer` token, and if valid sets a `SecurityContext` whose principal is the user's **email** (there are no roles/authorities — `Collections.emptyList()`).
- **`JwtUtil`** signs/verifies tokens with an HS256 key generated at process startup (`Keys.secretKeyFor(...)`) — the signing key is not persisted or read from config, so tokens do not survive an application restart, and every instance in a multi-instance deployment would need its own key reconciled.
- **`AuthService`** owns registration/login logic (email uniqueness check, BCrypt password hashing/verification, token issuance) and is the only thing that touches `UserRepository`. `AuthController` is a thin wrapper.
- **`TaskController` talks directly to `TaskRepository`** — there is no service layer for tasks (`TaskService` is an empty stub class). Task endpoints are not scoped by user; any authenticated user can read/modify all tasks.
- CORS (`CorsConfig`) is hardcoded to allow only `http://localhost:5173` — update this if the frontend origin changes.

## Frontend architecture

- **`AuthContext`** (`src/context/AuthContext.tsx`) is the single source of truth for auth state. It hydrates the token from `localStorage` on mount and exposes `login`/`logout`/`isAuthenticated`. There is no token refresh or expiry check on the client — an expired JWT is only discovered when a request fails.
- **`api/axios.ts`** is a shared axios instance with a request interceptor that attaches `Authorization: Bearer <token>` from `localStorage` to every outgoing request. All API calls should go through this instance rather than raw `axios`/`fetch`.
- **`ProtectedRoute`** wraps routes that require auth and redirects to `/login` via `useAuth().isAuthenticated`; routing is defined centrally in `App.tsx` (react-router-dom v7).


## Git rules
- Never push directly to main/master
- Always work within a feature branch
- Ask before creating new branches — confirm the name with me first
- Run tests before committing
- Always confirm before pushing
- Use conventional commits: type(scope): description