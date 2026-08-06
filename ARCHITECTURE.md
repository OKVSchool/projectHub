# velaWright — Architecture Document

---

## 1. System Diagram

```
 BROWSER
 ┌──────────────────────────────────────┐
 │  Next.js 15 App Router               │
 │  Deployed: Vercel                    │
 │                                      │
 │  /              Endeavors list        │
 │  /endeavors/new  Create endeavor     │
 │  /endeavors/:id  Endeavor detail     │
 │  /leads         Leads & Planning     │
 │  /dev           API test suite       │
 │  /login  /signup  (public)           │
 │                                      │
 │  Auth state: JWT stored in           │
 │  localStorage via AuthContext        │
 └──────────────┬───────────────────────┘
                │ HTTPS + Bearer token
                │ REST JSON
                ▼
 ┌──────────────────────────────────────┐
 │  Express 4 REST API                  │
 │  Deployed: Render (Node service)     │
 │                                      │
 │  Middleware chain (every request):   │
 │  CORS → express.json → requireAuth  │
 │  → validate → route handler          │
 │                                      │
 │  /health         (before CORS)       │
 │  /auth           signup, login       │
 │  /endeavors      full CRUD + upload  │
 │  /leads          full CRUD           │
 │  /traces         full CRUD           │
 │  /marks          full CRUD           │
 │  /admin/users    admin only          │
 └──────────────┬───────────────────────┘
                │ Mongoose ODM
                │ TLS connection string
                ▼
 ┌──────────────────────────────────────┐
 │  MongoDB Atlas                       │
 │  Free M0 cluster (cloud)             │
 │                                      │
 │  Collections:                        │
 │  users  projects  ideas              │
 │  thoughts  tasks                     │
 │  (collection names preserved for     │
 │  live data continuity)               │
 └──────────────────────────────────────┘
```

**Deployment environment variables:**

| Service  | Key vars                                      |
|----------|-----------------------------------------------|
| Render   | `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`     |
| Vercel   | `NEXT_PUBLIC_API_URL`                         |

CORS on the server is locked to the value of `CLIENT_URL`. Vercel is set as the value, so no other origin can make credentialed requests to the API.

---

## 2. Data Model

All collections include `createdAt` and `updatedAt` timestamps (Mongoose `{ timestamps: true }`). Every user-owned document carries a `userId` ObjectId reference to the User collection.

### User
```
_id          ObjectId
email        String  required, unique, lowercase, trim
password     String  required  (bcrypt hash, never plaintext)
name         String  required, trim
role         String  enum: ['user', 'admin']  default: 'user'
```

### Endeavor (collection: projects)
```
_id          ObjectId
userId       ObjectId  ref: User  required
title        String    required, trim
description  String    default: ''
status       String    enum: ['active', 'completed', 'paused', 'deployed']
framework    String
repoUrl      String
imageUrl     String    (relative path to uploaded file)
tags         [String]
lanes        [String]
date         Date
```

### Lead (collection: ideas)
```
_id                  ObjectId
userId               ObjectId  ref: User     required
title                String    required, trim
description          String    default: ''
category             String
status               String    enum: ['active', 'parked', 'promoted']
priority             String    enum: ['none', 'low', 'medium', 'high']
promotedToProjectId  ObjectId  ref: Endeavor  default: null
```

### Trace (collection: thoughts)
```
_id        ObjectId
userId     ObjectId  ref: User     required
title      String    required, trim
category   String
projectId  ObjectId  ref: Endeavor  default: null
ideaId     ObjectId  ref: Lead      default: null
```
A Trace is standalone when both `projectId` and `ideaId` are null. It becomes a nested note by setting one of those references.

### Mark (collection: tasks)
```
_id        ObjectId
userId     ObjectId  ref: User     required
title      String    required, trim
notes      String    default: ''
done       Boolean   default: false
dueBy      Date      default: null
category   String
projectId  ObjectId  ref: Endeavor  default: null
ideaId     ObjectId  ref: Lead      default: null
thoughtId  ObjectId  ref: Trace     default: null
```
Marks support the same polymorphic parent pattern as Traces, and can also be filtered by query string on `GET /marks?projectId=...`.

---

## 3. API Reference

All routes except `/health`, `/auth/signup`, and `/auth/login` require `Authorization: Bearer <token>`.

Validation errors return `400` with `{ "error": "field is required | field must be..." }`.
Auth failures return `401`. Ownership mismatches return `404` (resource not found for this user). Admin-only refusals return `403`.

### Health
| Method | Path      | Auth | Response                  |
|--------|-----------|------|---------------------------|
| GET    | /health   | none | `{ status: 'ok' }`        |

### Auth
| Method | Path          | Auth | Body                                | Response                         |
|--------|---------------|------|-------------------------------------|----------------------------------|
| POST   | /auth/signup  | none | `{ name, email, password }`         | `201 { token, user }`            |
| POST   | /auth/login   | none | `{ email, password }`               | `200 { token, user }`            |

Signup rules: name 2–50 chars, email valid format, password 8–128 chars.

### Endeavors
| Method | Path                    | Auth    | Body / Notes                                                          | Response           |
|--------|-------------------------|---------|-----------------------------------------------------------------------|--------------------|
| GET    | /endeavors              | user    | —                                                                     | `200 [Endeavor]`   |
| POST   | /endeavors              | user    | `{ title*, description, framework, repoUrl, tags, status }`           | `201 Endeavor`     |
| GET    | /endeavors/:id          | user    | —                                                                     | `200 Endeavor`     |
| PUT    | /endeavors/:id          | user    | any subset of POST body                                               | `200 Endeavor`     |
| DELETE | /endeavors/:id          | user    | —                                                                     | `200 { message }`  |
| POST   | /endeavors/:id/image    | user    | `multipart/form-data` field `image` (JPEG/PNG/WebP/GIF, max 5 MB)    | `200 Endeavor`     |

Admin users bypass the `userId` filter on GET and GET/:id (they see all endeavors).

### Leads
| Method | Path         | Auth | Body                                                  | Response        |
|--------|--------------|------|-------------------------------------------------------|-----------------|
| GET    | /leads       | user | —                                                     | `200 [Lead]`    |
| POST   | /leads       | user | `{ title*, description, category, status, priority }` | `201 Lead`      |
| GET    | /leads/:id   | user | —                                                     | `200 Lead`      |
| PUT    | /leads/:id   | user | any subset of POST body                               | `200 Lead`      |
| DELETE | /leads/:id   | user | —                                                     | `200 { message }` |

### Traces
| Method | Path           | Auth | Body                                          | Response          |
|--------|----------------|------|-----------------------------------------------|-------------------|
| GET    | /traces        | user | query: `?projectId=` or `?ideaId=`            | `200 [Trace]`     |
| POST   | /traces        | user | `{ title*, category, projectId, ideaId }`     | `201 Trace`       |
| GET    | /traces/:id    | user | —                                             | `200 Trace`       |
| PUT    | /traces/:id    | user | any subset of POST body                       | `200 Trace`       |
| DELETE | /traces/:id    | user | —                                             | `200 { message }` |

### Marks
| Method | Path        | Auth | Body                                                      | Response        |
|--------|-------------|------|-----------------------------------------------------------|-----------------|
| GET    | /marks      | user | query: `?projectId=` `?ideaId=` `?thoughtId=`             | `200 [Mark]`    |
| POST   | /marks      | user | `{ title*, notes, done, dueBy, projectId, ideaId }`       | `201 Mark`      |
| GET    | /marks/:id  | user | —                                                         | `200 Mark`      |
| PUT    | /marks/:id  | user | any subset of POST body                                   | `200 Mark`      |
| DELETE | /marks/:id  | user | —                                                         | `200 { message }` |

### Admin
| Method | Path          | Auth  | Response                                |
|--------|---------------|-------|-----------------------------------------|
| GET    | /admin/users  | admin | `200 [User]` (password field excluded)  |

---

## 4. Key Technical Decisions

### Express as a standalone server, not Next.js API Routes
Next.js API routes are convenient but they couple the backend to the frontend deployment. A standalone Express server deploys independently on Render, exposes a clean REST interface, and can serve any client — including the React Native mobile companion and the automated test suite — without the frontend involved. It also gives full control over the middleware chain ordering.

### MongoDB + Mongoose
Developer project data is schema-light and variable: some projects have images, some have tags, some have neither. A document database fits that shape without nullable columns or join tables. MongoDB Atlas provides a free M0 cluster adequate for a portfolio project. Mongoose adds a schema enforcement layer on top of the flexible storage, so validation has two defense-in-depth points: the custom `validate` middleware (returns clean 400s) and Mongoose's own validators (caught by `clientError` and also returned as 400s).

### JWT over sessions
Stateless tokens mean the server holds no session state between requests. The frontend stores the token in localStorage and attaches it as `Authorization: Bearer <token>` on every request. `requireAuth` calls `jwt.verify()` on every protected route and then confirms the user still exists in the database — so a deleted account immediately loses access even if the token hasn't expired. The 7-day expiry balances security with UX (users don't get logged out constantly).

### bcrypt cost factor 12
The pre-save hook hashes passwords with bcrypt at cost 12, the current industry-recommended default. Cost 12 takes roughly 250–400ms to hash, making brute-force attacks extremely expensive while remaining fast enough for interactive login. Passwords are never stored or logged in plaintext at any point.

### Ownership enforced at the database filter level
Every write query includes `{ userId: req.user._id }` in the filter — not in a post-fetch ownership check. `Project.findOneAndDelete({ _id: id, userId: req.user._id })` returns null if the project doesn't exist *or* if it belongs to someone else. Both cases return 404. This prevents a class of bugs where a developer forgets to add an ownership check after fetching a document, and it ensures authorization is uniform across all operations.

### Custom `validate` middleware
A single middleware function accepts a rules object and applies `required`, `minLength`, `maxLength`, `isEmail`, `isUrl`, and `enum` checks. The `requireAll: false` option lets PUT routes skip `required` checks so partial updates work without client sending unchanged fields. All validation errors are collected and joined into a single response string, so the frontend receives all problems at once rather than one at a time.

### Custom `httpError` — no stack traces to clients
All 500 handlers return `{ error: 'Something went wrong' }`. The `clientError` function translates known MongoDB errors (duplicate key → "email is already in use", ValidationError → field messages) into clean 400 responses without leaking database internals, collection names, or stack traces. This is the difference between `MongoServerError: E11000 duplicate key error collection: velawrightdb.users index: email_1` reaching the browser versus `email is already in use`.

### `app.js` / `server.js` split for testability
The Express app is fully configured in `app.js` (middleware, routes, no DB connection, no `listen`). `server.js` imports it and adds `mongoose.connect(...).then(app.listen)`. The test suite imports `app.js` directly and connects to an isolated `MongoMemoryServer` instance — no Atlas connection required, no test data polluting production. This separation is what makes `npm test` repeatable and fast.

### CORS locked to `CLIENT_URL` env var
CORS origin is `process.env.CLIENT_URL`, set to the exact Vercel deployment URL in production. There is no wildcard (`*`) and no array of allowed origins. Any request from a different origin is refused at the CORS preflight stage, before it reaches any route handler.
