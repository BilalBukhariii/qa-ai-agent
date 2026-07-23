# QA AI Agent Dashboard (MVP Scaffold)

Enterprise QA automation platform — MVP starting point. Node.js/Express/MongoDB backend, React/Tailwind frontend, Playwright automation.

Built incrementally per the phased roadmap: Auth → Dashboard → Tickets → Manual Test Cases → AI Test Case Generator → Playwright Codegen → Reports → Jira Integration.

## Structure

```
qa-ai-agent/
├── backend/          # Express API + MongoDB models
├── frontend/          # React + Tailwind dashboard (Vite)
├── automation/
│   └── playwright/    # Playwright test framework (POM)
├── database/
│   └── mongodb/       # Seed scripts
└── docs/               # API docs
```

## Quick Start

### 1. Backend
```bash
cd backend
npm install
cp ../.env.example .env   # fill in MONGO_URI, JWT_SECRET
npm run dev                # starts on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev                # starts on http://localhost:5173
```

### 3. Playwright automation
```bash
cd automation/playwright
npm install
npx playwright install     # downloads browsers
npx playwright test        # runs the sample spec
npx playwright show-report # view HTML report
```

## MVP scope (Phase 1)
- [x] Repo + folder architecture
- [x] Auth (JWT login/register)
- [x] Test Case CRUD (backend + DB model)
- [x] Ticket CRUD (backend + DB model)
- [x] Playwright framework with Page Object Model + one working sample test
- [ ] Dashboard UI (charts/cards) — next
- [ ] AI Requirement Analyzer — next
- [ ] AI Test Case Generator — next
- [ ] Playwright code generator from manual test case — next
- [ ] Reports (PDF/Excel/CSV export) — next
- [ ] Jira integration — later

## Recommended workflow with Antigravity
Open this repo in Antigravity and work one checklist item at a time — feed it a single phase from the roadmap plus the relevant folder (e.g. "implement the Dashboard UI in frontend/src/pages/Dashboard.jsx using the /api/testcases and /api/tickets endpoints already in backend/routes") rather than the full spec. Commit after each working phase so you always have a working `main`.

## API Endpoints (current)
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Create user |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/tickets | List tickets |
| POST | /api/tickets | Create ticket |
| GET | /api/testcases | List test cases |
| POST | /api/testcases | Create test case |
| PUT | /api/testcases/:id | Update test case |
| DELETE | /api/testcases/:id | Delete test case |

See `docs/API.md` for full request/response shapes.
