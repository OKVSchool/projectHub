# projectHub — Architecture Document

---

## 1. System Diagram

```
 BROWSER
 ┌──────────────────────────────────────┐
 │  Next.js 15 App Router               │
 │  Deployed: Vercel                    │
 │                                      │
 │  /              Projects list        │
 │  /projects/new  Create project       │
 │  /projects/:id  Project detail       │
 │  /ideas         Ideas & Planning     │
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
 │  /projects       full CRUD + upload  │
 │  /ideas          full CRUD           │
 │  /thoughts       full CRUD           │
 │  /tasks          full CRUD           │
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

### Project
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

### Idea
```
_id                  ObjectId
userId               ObjectId  ref: User  required
title                String    required, trim
description          String    default: ''
category             String
status               String    enum: ['active', 'parked', 'promoted']
priority             String    enum: ['none', 'low', 'medium', 'high']
promotedToProjectId  ObjectId  ref: Project  default: null
```

### Thought
```
_id        ObjectId
userId     ObjectId  ref: User     required
title      String    required, trim
category   String
projectId  ObjectId  ref: Project  default: null
ideaId     ObjectId  ref: Idea     default: null
```
A Thought is standalone when both `projectId` and `ideaId` are null. It becomes a nested note by setting one of those references.

### Task
```
_id        ObjectId
userId     ObjectId  ref: User     required
title      String    required, trim
notes      String    default: ''
done       Boolean   default: false
dueBy      Date      default: null
category   String
projectId  ObjectId  ref: Project  default: null
ideaId     ObjectId  ref: Idea     default: null
thoughtId  ObjectId  ref: Thought  default: null
```
Tasks support the same polymorphic parent pattern as Thoughts, and can also be filtered by query string on `GET /tasks?projectId=...`.

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

### Projects
| Method | Path                  | Auth    | Body / Notes                                      | Response         |
|--------|-----------------------|---------|---------------------------------------------------|------------------|
| GET    | /projects             | user    | —                                                 | `200 [Project]`  |
| POST   | /projects             | user    | `{ title* , description, framework, repoUrl, tags, status }` | `201 Project`    |
| GET    | /projects/:id         | user    | —                                                 | `200 Project`    |
| PUT    | /projects/:id         | user    | any subset of POST body                           | `200 Project`    |
| DELETE | /projects/:id         | user    | —                                                 | `200 { message }` |
| POST   | /projects/:id/image   | user    | `multipart/form-data` field `image` (JPEG/PNG/WebP/GIF, max 5 MB) | `200 Project` |

Admin users bypass the `userId` filter on GET and GET/:id (they see all projects).

### Ideas
| Method | Path        | Auth | Body                                               | Response        |
|--------|-------------|------|----------------------------------------------------|-----------------|
| GET    | /ideas      | user | —                                                  | `200 [Idea]`    |
| POST   | /ideas      | user | `{ title*, description, category, status, priority }` | `201 Idea`   |
| GET    | /ideas/:id  | user | —                                                  | `200 Idea`      |
| PUT    | /ideas/:id  | user | any subset of POST body                            | `200 Idea`      |
| DELETE | /ideas/:id  | user | —                                                  | `200 { message }` |

### Thoughts
| Method | Path           | Auth | Body                                    | Response           |
|--------|----------------|------|-----------------------------------------|--------------------|
| GET    | /thoughts      | user | query: `?projectId=` or `?ideaId=`      | `200 [Thought]`    |
| POST   | /thoughts      | user | `{ title*, category, projectId, ideaId }` | `201 Thought`    |
| GET    | /thoughts/:id  | user | —                                       | `200 Thought`      |
| PUT    | /thoughts/:id  | user | any subset of POST body                 | `200 Thought`      |
| DELETE | /thoughts/:id  | user | —                                       | `200 { message }`  |

### Tasks
| Method | Path        | Auth | Body                                              | Response        |
|--------|-------------|------|---------------------------------------------------|-----------------|
| GET    | /tasks      | user | query: `?projectId=` `?ideaId=` `?thoughtId=`     | `200 [Task]`    |
| POST   | /tasks      | user | `{ title*, notes, done, dueBy, projectId, ideaId }` | `201 Task`    |
| GET    | /tasks/:id  | user | —                                                 | `200 Task`      |
| PUT    | /tasks/:id  | user | any subset of POST body                           | `200 Task`      |
| DELETE | /tasks/:id  | user | —                                                 | `200 { message }` |

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
All 500 handlers return `{ error: 'Something went wrong' }`. The `clientError` function translates known MongoDB errors (duplicate key → "email is already in use", ValidationError → field messages) into clean 400 responses without leaking database internals, collection names, or stack traces. This is the difference between `MongoServerError: E11000 duplicate key error collection: projecthub.users index: email_1` reaching the browser versus `email is already in use`.

### `app.js` / `server.js` split for testability
The Express app is fully configured in `app.js` (middleware, routes, no DB connection, no `listen`). `server.js` imports it and adds `mongoose.connect(...).then(app.listen)`. The test suite imports `app.js` directly and connects to an isolated `MongoMemoryServer` instance — no Atlas connection required, no test data polluting production. This separation is what makes `npm test` repeatable and fast.

### CORS locked to `CLIENT_URL` env var
CORS origin is `process.env.CLIENT_URL`, set to the exact Vercel deployment URL in production. There is no wildcard (`*`) and no array of allowed origins. Any request from a different origin is refused at the CORS preflight stage, before it reaches any route handler.
