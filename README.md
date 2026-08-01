# Chasel

Chasel has a React/Vite frontend and a Spring Boot backend.

## Requirements

- Java 17
- Node.js 20 or newer

## Run locally after cloning

Open two terminals from the repository root.

### Backend

```bash
cd chasel
./mvnw spring-boot:run
```

The API runs at `http://localhost:8080`.

### Frontend

```bash
cd chasel-frontend
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

No frontend environment file is required for local development. By default,
the frontend calls `http://localhost:8080/api`.

For a different backend URL, copy the example configuration and edit it:

```bash
cp chasel-frontend/.env.example chasel-frontend/.env.local
```

Restart the frontend after changing `.env.local`.

## Local data

The H2 database and uploaded images are intentionally not committed:

- `chasel/data/`
- `chasel/uploads/`

They can contain accounts, password hashes, and user-uploaded files. A fresh
clone therefore starts with an empty database while keeping the same features
and application configuration.

Only run one backend instance at a time. Two instances cannot use the same
local H2 database file simultaneously.
