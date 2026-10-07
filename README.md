# Multi-Agent Onboarding Case Reviewer

A full-stack TypeScript banking-domain application designed to automate customer onboarding case reviews using a multi-agent orchestration architecture, SQLite relational storage, and deterministic evaluation safeguards.

> **Important**: This application uses **strictly synthetic test data**. No real customer or banking information is stored or processed.

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, TypeScript, Vanilla CSS (Modern Dark Fintech Design System)
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite relational database using `better-sqlite3` (with WAL mode enabled)
- **Multi-Agent Orchestration**: Custom TypeScript orchestration engine (scaffolded)
- **Testing**: Vitest + Supertest for automated test coverage
- **Dev Tooling**: `tsx` for high-performance TypeScript hot reload

---

## 📂 Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── agents/          # Agent definitions (Identity, Risk, Compliance)
│   │   ├── orchestrator/    # Workflow orchestrator & consensus engine
│   │   ├── routes/          # Express route handlers (/api/health, etc.)
│   │   │   ├── health.routes.ts
│   │   │   └── index.ts
│   │   ├── services/        # Business logic & onboarding services
│   │   ├── db/              # SQLite connection & schema initialization
│   │   │   └── index.ts
│   │   ├── models/          # Data access models (Applicants, Review Cases)
│   │   │   └── index.ts
│   │   ├── types/           # Core domain types & interfaces
│   │   │   └── index.ts
│   │   ├── data/            # Synthetic seed data & mock applicant profiles
│   │   │   └── index.ts
│   │   ├── app.ts           # Express application setup (CORS, JSON, routes)
│   │   └── index.ts         # Server entry point (port 5000)
│   ├── tests/
│   │   └── health.test.ts   # Vitest automated test suite for health API
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Real-time health monitor & architecture dashboard
│   │   ├── index.css        # Modern design system & styling
│   │   └── main.tsx         # React application root
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts       # Configured with /api proxy to backend (port 5000)
├── .env.example             # Root environment variables template
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm

### 1. Backend Setup & Run

Navigate to the `backend` folder and install dependencies:

```bash
cd backend
npm install
```

Start the backend development server:

```bash
npm run dev
```

The backend server runs on `http://localhost:5000`.

To run backend tests:

```bash
npm run test
```

To build backend TypeScript to JavaScript:

```bash
npm run build
```

---

### 2. Frontend Setup & Run

Open another terminal, navigate to the `frontend` folder and install dependencies:

```bash
cd frontend
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173`.  
The Vite dev server is pre-configured to proxy `/api/*` requests to the backend at `http://localhost:5000`.

---

## 🔌 API Endpoints

### Health Check

```http
GET /api/health
```

#### Response (`200 OK`):

```json
{
  "status": "ok",
  "service": "multi-agent-onboarding-reviewer"
}
```

---

## 🛡️ Synthetic Data Policy

All applicant records, risk evaluations, and KYC flags used within this repository are generated synthetically for assessment and development purposes. No real banking records or personally identifiable customer information (PII) are used.
