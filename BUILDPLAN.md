1. PATH
Path A — rebuilt the Course Project Hub (Week 5 Next.js capstone) with a real Express + MongoDB backend, auth, and user-scoped data instead of client-side state.

2. DATA MODEL

User — email, password (hashed), name, role (user/admin)
Project — title, description, date, status, lanes, framework, repoUrl, tags, imageUrl, userId (ref → User)
Idea — title, description, category, status, priority, promotedToProjectId, userId (ref → User)
Thought — title, category, ideaId (ref → Idea), projectId (ref → Project), userId (ref → User)
Task — title, notes, dueBy, done, category, userId (ref → User), projectId, ideaId, thoughtId
3. ROUTES & SCREENS
Server: POST /auth/signup, POST /auth/login, full CRUD on /projects, /ideas, /thoughts, /tasks, POST /projects/:id/image, GET /health
Screens: Project List (/), Project Detail (/projects/[id]), Project Ideas (/ideas), Login (/login), Signup (/signup)

4. UNTAUGHT FEATURE
Role-based admin access — an admin tier that can view and manage all users' data.
Gap to close: requireRole('admin') middleware that checks req.user.role and routes that bypass ownership scoping for admins.