# API Documentation

Base URL: `http://localhost:5000/api`

## Auth

### POST /auth/register
```json
{ "name": "Jane QA", "email": "jane@example.com", "password": "Passw0rd!", "role": "qa_lead" }
```
Returns user object + JWT `token`.

### POST /auth/login
```json
{ "email": "jane@example.com", "password": "Passw0rd!" }
```
Returns user object + JWT `token`. Use the token as `Authorization: Bearer <token>` on all other routes.

## Tickets (auth required)

| Method | Route | Body |
|---|---|---|
| GET | /tickets | — |
| GET | /tickets/:id | — |
| POST | /tickets | `{ title, description, type, priority, status, assignee, sprint, storyPoints, acceptanceCriteria }` |
| PUT | /tickets/:id | any subset of the fields above |
| DELETE | /tickets/:id | — |

## Test Cases (auth required)

| Method | Route | Body |
|---|---|---|
| GET | /testcases | optional query: `?status=pass` `?ticket=<id>` |
| GET | /testcases/:id | — |
| POST | /testcases | `{ ticket, module, title, precondition, priority, severity, environment, testData, steps: [], expectedResult, status }` |
| PUT | /testcases/:id | any subset of the fields above |
| DELETE | /testcases/:id | — |

`status` enum: `not_run`, `pass`, `fail`, `blocked`, `retest`

## Next endpoints to add (per roadmap)
- `POST /ai/analyze-requirement`
- `POST /ai/generate-testcases`
- `POST /ai/generate-playwright`
- `GET /reports/summary`
