# HorizonExam

Academic Exam Management System for the **Horizon School of Digital Technologies**.

A full-stack web application with three role-based portals (**Student**, **Teacher**, **Administrator**) for managing exam sessions, grades, attendance, timetable, correction requests, and reports.

---

## Architecture

```
┌─────────────────────┐       ┌─────────────────────┐
│   Front-End (React) │ ───→  │   Back-End (Express)│ ───→ ┌──────────┐
│   Vite + React 18   │  REST │   API on :5000      │       │ MySQL /  │
│   :5173             │       │   Sequelize ORM      │       │ SQLite   │
└─────────────────────┘       └─────────────────────┘       └──────────┘
```

- **Front-end:** React 18, Vite 6, React Router 7, plain CSS
- **Back-end:** Express 5, Sequelize 6, JWT auth, Google OAuth2
- **Database:** MySQL 8 (primary) or SQLite (fallback for local dev)

---

## Features

### Student Portal (`/student`)
- Dashboard with semester averages, final status, absences count
- View grades (per subject, with status: Pending / Published)
- Request double correction on published grades
- View attendance records
- View exam timetable

### Teacher Portal (`/teacher`)
- Dashboard with student/session/grade/absence counts
- Grade entry (select student + session + grade)
- Attendance management (batch set Present/Late/Absent/Excused per session)
- Delete grades and attendance records
- Submit elimination requests against students
- Submit exam reports

### Admin Portal (`/admin`)
- Dashboard with user/session/pending grade counts
- Grade validation workflow: Pending → Validate → Publish
- Approve/reject double correction requests
- Approve/reject elimination requests
- View all attendance records
- Full CRUD: Users, Exam Sessions, Classes, Subjects, Rooms

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Front-end | React 18, Vite 6, React Router 7 |
| Back-end | Express 5, Sequelize 6 |
| Database | MySQL 8 (default) / SQLite (fallback) |
| Auth | JWT (jsonwebtoken) + Google OAuth2 (google-auth-library) |
| Validation | express-validator |
| Security | helmet, bcryptjs, cors |
| Container | Docker Compose (MySQL only) |

---

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **Docker Desktop** (optional, for MySQL)
- OR a local MySQL 8 instance

---

## Quick Start

### 1. Clone and install dependencies

```bash
# Install back-end
cd back-end
npm install

# Install front-end
cd ../front-end
npm install
```

### 2. Start MySQL (choose one)

**Option A — Docker (recommended):**
```bash
# From project root
docker compose up -d
```

**Option B — Local MySQL:**
Ensure your local MySQL is running on `localhost:3306` and create the database:
```sql
CREATE DATABASE IF NOT EXISTS horizon_exam;
```

### 3. Start the back-end

```bash
cd back-end
npm start
```

The server starts on `http://localhost:5000`. On first run it:
- Connects to MySQL (or falls back to SQLite)
- Auto-creates all tables via Sequelize
- Creates a default admin account:
  - **Email:** `admin@horizon-university.tn`
  - **Password:** `admin12345`

### 4. (Optional) Seed test data

```bash
cd back-end
node sync.js
```

This drops and recreates tables, then inserts test users:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@horizon.tn` | `admin12345` |
| Teacher | `teacher@horizon.tn` | `teacher12345` |
| Student | `student@horizon.tn` | `student12345` |

Plus a Mathematics exam session, grade, attendance record, timetable entry, and notification.

### 5. Start the front-end

```bash
cd front-end
npm run dev
```

Opens at `http://localhost:5173`.

---

## Commands Reference

### Back-end

| Command | Description |
|---------|-------------|
| `npm start` | Start the API server on port 5000 |
| `node sync.js` | Drop & recreate all tables + seed test data |
| `npm test` | Run smoke test (logs in as admin, fetches dashboard) |

### Front-end

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |

### Docker

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start MySQL container in background |
| `docker compose down` | Stop MySQL container |

---

## Environment Variables

### Back-end (`back-end/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_DIALECT` | `mysql` | `mysql` or `sqlite` |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `horizon_exam` | Database name |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | *(empty)* | MySQL password |
| `PORT` | `5000` | API server port |
| `JWT_SECRET` | `supersecretkey` | JWT signing secret |
| `ADMIN_EMAIL` | `admin@horizon-university.tn` | Default admin email |
| `ADMIN_PASSWORD` | `admin12345` | Default admin password |
| `NODE_ENV` | `development` | Environment mode |

### Front-end (`front-end/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5000` | Back-end API URL |
| `VITE_GOOGLE_CLIENT_ID` | *(your client ID)* | Google OAuth2 Client ID |

---

## API Endpoints

### Health
- `GET /health` — Server health check
- `GET /health/db` — Database connection info

### Auth
- `POST /auth/login` — Login with email + password + role
- `POST /auth/google` — Login with Google credential token
- `GET /auth/me` — Get current user profile (requires token)

### Student (`/api/student`)
- `GET /dashboard-data/:id` — Full student dashboard
- `GET /correction-requests` — List correction requests
- `POST /correction-requests` — Submit a double correction request

### Teacher (`/api/teacher`)
- `GET /dashboard-data/:id` — Teacher dashboard
- `POST /grades` — Submit/update a grade
- `DELETE /grades/:id` — Delete a grade
- `POST /attendance` — Submit attendance
- `DELETE /attendance/:id` — Delete attendance record
- `POST /absences` — Quick mark student absent
- `POST /reports` — Submit exam report
- `POST /eliminations` — Submit elimination request

### Admin (`/api/admin`)
- `GET /dashboard-data/:id` — Admin dashboard
- `POST /grades/:id/validate` — Validate a grade
- `POST /grades/:id/publish` — Publish a grade
- `POST /correction-requests/:id/decision` — Approve/reject correction
- `POST /elimination-requests/:id/decision` — Approve/reject elimination
- `GET|POST|PUT|DELETE /users` — CRUD users
- `GET|POST|PUT|DELETE /sessions` — CRUD exam sessions
- `GET|POST|PUT|DELETE /classes` — CRUD class groups
- `GET|POST|PUT|DELETE /subjects` — CRUD subjects
- `GET|POST|PUT|DELETE /rooms` — CRUD rooms

---

## Login Credentials (Development)

After running `node sync.js`:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@horizon.tn` | `admin12345` |
| Teacher | `teacher@horizon.tn` | `teacher12345` |
| Student | `student@horizon.tn` | `student12345` |

**Without seeding**, the default admin is auto-created:
- **Email:** `admin@horizon-university.tn`
- **Password:** `admin12345`

Use institutional email format `*@horizon-university.tn` for login.

---

## Project Structure

```
HorizonExam-main/
├── back-end/
│   ├── config/           # Sequelize DB config
│   ├── controllers/      # Route handlers
│   ├── middlewares/       # Auth & validation middleware
│   ├── models/           # Sequelize models (12 models)
│   ├── routes/           # Express routers
│   ├── scripts/          # Smoke test
│   ├── .env              # Environment variables
│   ├── server.js         # Entry point
│   ├── sync.js           # DB seed script
│   └── package.json
├── front-end/
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── api/          # API client & auth service
│   │   ├── assets/       # Logo, images
│   │   ├── components/   # Reusable UI components
│   │   │   ├── common/   # Button, Input, Sidebar, etc.
│   │   │   └── layout/   # Layouts per role
│   │   ├── pages/        # Login, Dashboard, Teacher, Admin
│   │   ├── styles/       # CSS files
│   │   ├── App.jsx       # Route definitions
│   │   └── main.jsx      # Entry point
│   ├── .env              # Environment variables
│   ├── index.html
│   └── package.json
├── database/
│   ├── schema.sql        # Raw SQL schema
│   └── diagrams/         # ER diagram
├── docs/                 # Architecture, API, deployment docs
├── docker-compose.yml    # MySQL container
└── README.md
```
