1. PATH
Path A — rebuilt the Course Project Hub (Week 5 Next.js capstone) with a real Express + MongoDB backend, JWT auth, user-scoped data, server-side validation, and a React Native mobile companion app deployed across three platforms (Render, Vercel, Expo Go).

2. DATA MODEL

User — email, password (bcrypt-hashed), name, role (user/admin)
Project — title, description, date, status (active/completed/paused/deployed), framework, repoUrl, tags, imageUrl, userId (ref → User)
Idea — title, description, category, status (active/parked/promoted), priority (none/low/medium/high), promotedToProjectId, userId (ref → User)
Thought — title, category, ideaId (ref → Idea), projectId (ref → Project), userId (ref → User)
Task — title, notes, dueBy, done, category, userId (ref → User), projectId, ideaId, thoughtId

3. ROUTES & SCREENS

Server (Render — Express + MongoDB Atlas):
POST /auth/signup, POST /auth/login, GET /health
Full CRUD: /projects, /ideas, /thoughts, /tasks
POST /projects/:id/image — multer upload, 5 MB size cap, image types only (JPEG, PNG, WebP, GIF)
All POST and PUT routes run validate middleware before any database write.

Web (Vercel — Next.js 15 App Router):
/ — Project List
/projects/new — New Project form
/projects/[id] — Project Detail (status, tasks, image upload)
/ideas — Ideas & Planning (tabs: Projects, Ideas, Thoughts)
/login, /signup
/dev — Live test suite (CRUD lifecycle, auth attacks, validation edge cases, upload tests, security probes)

Mobile (Expo Go — React Native / Expo SDK 54):
Auth and project list; connects to Render server in production, local IP in dev.

4. UNTAUGHT FEATURES

Role-based admin access — requireRole('admin') middleware bypasses ownership scoping so admins can view and manage all users' data across every route.

Server-side validation middleware (validate.js) — checks required fields, min/max length, email format, URL format, and enum membership on every POST and PUT before any DB write.

Error response sanitization (httpError.js) — 500s return a generic message, 400s map duplicate-key (11000) and Mongoose ValidationError to clean user-facing messages, nothing internal leaks.

File upload hardening — multer fileFilter rejects non-image types at the MIME level before the file touches disk, in addition to the 5 MB size limit.

Security-layer audit — CORS locked to exact Vercel origin, JWT verified and user existence confirmed on every protected request, all queries scoped to req.user._id at the DB filter level.

React Native mobile app — second client sharing the same Render/Atlas backend, built with Expo Router v4 file-based routing.
