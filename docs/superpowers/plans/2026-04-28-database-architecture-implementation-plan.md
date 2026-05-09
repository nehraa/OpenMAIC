# Database Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Prerequisites:** Complete brainstorming session for Phase 3 database architecture (hybrid PostgreSQL with RLS)

**Goal:** Implement persistent PostgreSQL database with Row-Level Security for teacher/student isolation. Central users table, per-teacher student data isolation, assignment tracking, and progress monitoring.

**Architecture:**
- Single PostgreSQL database with Row-Level Security (RLS) policies
- Central `users` table for teachers and students (with `teacher_id` FK for students)
- RLS policies enforce that teachers can ONLY see their own students/assignments
- Both Teacher App and Student App connect to same database
- Existing SQLite schema ported to PostgreSQL dialect

**Tech Stack:**
- PostgreSQL 15+ with Row-Level Security
- `@/lib/db/index.ts` pattern (already exists in teacher, needs student)
- pnpm workspaces monorepo
- Next.js App Router
- better-sqlite3 → pg migration (or use `pg` driver directly)

---

## Context

### Why This Is Needed
- Currently: Teacher app has SQLite DB, Student app has NO DB → no persistence, no sync
- Goal: Teachers create accounts, add students, assign slides/notebooks, track progress
- Security: Even with bugs, RLS ensures teachers can't see other teachers' data

### Existing Schema to Reuse
- `/teacher/lib/db/schema.sql` - Users, sessions, classes
- `/teacher/lib/db/phase2-schema.sql` - Assignments, content assets, live sessions

### Key Files to Create/Modify
- `teacher/lib/db/index.ts` - Port SQLite → PostgreSQL
- `student/lib/db/index.ts` - CREATE (missing!)
- `shared/types/roles.ts` - Add database types
- `app/app/login/teacher/page.tsx` - Real auth instead of bypass
- `app/app/login/student/page.tsx` - Real auth instead of bypass

---

## SUBAGENT-DRIVEN EXECUTION

### Required Skills/Agents per Task:

| Task | Primary Agent | Required Skills/MCP |
|------|--------------|---------------------|
| 1. PostgreSQL Schema | `database-optimizer` | `mcp:context7` (PostgreSQL docs) |
| 2. Teacher DB Port | `backend-developer` | `mcp:context7` (better-sqlite3→pg), `skill:pr-review-toolkit:silent-failure-hunter` |
| 3. Student DB Setup | `backend-developer` | Same as above |
| 4. Auth System | `security-engineer` | `skill:security-best-practices`, `mcp:context7` (bcrypt/jwt) |
| 5. Student Dashboard | `frontend-developer` | `skill:ui-designer` |
| 6. Teacher Dashboard | `frontend-developer` | `skill:ui-designer` |
| 7. API Routes | `backend-developer` | `skill:pr-review-toolkit:code-review` |
| 8. Integration Test | `tester` | `skill:playwright-test`, `mcp:playwright` |

---

## Task Decomposition

### Task 1: Design PostgreSQL Schema with RLS Policies

**Files:**
- Create: `docs/superpowers/plans/2026-04-28-postgresql-rls-schema.md`
- Create: `postgres/schema.sql`
- Create: `postgres/migrations/001_initial_schema.sql`
- Create: `postgres/migrations/002_rls_policies.sql`

**SKILL TO INVOKE:** `mcp:context7` for PostgreSQL 15 RLS syntax

**Steps:**

- [ ] **Step 1: Research PostgreSQL RLS patterns**

Use `mcp:context7` to query:
```
PostgreSQL 15 Row Level Security policies for multi-tenant SaaS with tenant isolation
```

**Agent Prompt for subagent:**
```
You are a PostgreSQL expert. Research PostgreSQL Row-Level Security (RLS) patterns.

Use mcp:context7 to query documentation for:
1. PostgreSQL 15 RLS syntax (CREATE POLICY, ENABLE ROW LEVEL SECURITY)
2. Best practices for multi-tenant SaaS isolation
3. How to implement RLS with a users table that has tenant_id foreign key

Focus on:
- How to create a policy that restricts SELECT/UPDATE/DELETE to rows where tenant_id = current_setting('app.tenant_id')::uuid
- How to set session characteristics for a connection
- Performance implications of RLS (思pect 2x overhead acceptable)

Return a detailed code example showing:
1. Table with tenant_id column
2. RLS policies for SELECT, INSERT, UPDATE, DELETE
3. How to test the policies work correctly
```

- [ ] **Step 2: Create PostgreSQL schema from existing SQLite schema**

**Agent Prompt:**
```
You are a database architect. Convert the existing SQLite schema to PostgreSQL with RLS.

Read these files:
- /Users/abhinavnehra/git/tools/AIDU/teacher/lib/db/schema.sql
- /Users/abhinavnehra/git/tools/AIDU/teacher/lib/db/phase2-schema.sql

Create a new file: /Users/abhinavnehra/git/tools/AIDU/postgres/schema.sql

Requirements:
1. Convert SQLite dialect to PostgreSQL (TEXT PRIMARY KEY, SERIAL → GENERATED ALWAYS AS IDENTITY, etc.)
2. Add tenant_id UUID column to all tables that need RLS (users, students, assignments, etc.)
3. Add a central `tenants` table with id, name, created_at
4. Add RLS policies that check tenant_id against current_setting('app.current_tenant_id')
5. Keep the existing indexes but convert to PostgreSQL syntax

For each table, identify:
- Which tables need tenant_id (have user/teacher FKs)
- Which tables are shared (lookup tables)
- RLS policy type: ALL, SELECT, INSERT, UPDATE, DELETE

Use mcp:context7 if you need PostgreSQL syntax reference.
```

- [ ] **Step 3: Create RLS migration file**

**Agent Prompt:**
```
Create a PostgreSQL migration file that sets up RLS policies.

File: /Users/abhinavnehra/git/tools/AIDU/postgres/migrations/002_rls_policies.sql

This file should contain:
1. CREATE POLICY statements for each table that needs RLS
2. ALTER TABLE statements to enable RLS
3. A function to set the current tenant context: set_current_tenant(tenant_id UUID)
4. A trigger on users table to automatically set tenant_id on INSERT
5. Comments explaining each policy

Example policy pattern:
```sql
CREATE POLICY teacher_isolation ON assignments
  FOR ALL
  TO authenticated
  USING (teacher_id IN (
    SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id')::uuid
  ));
```

Make sure all tables from the main schema are covered:
- users (tenant_id on teacher records only)
- classes
- class_memberships
- assignments
- assignment_recipients
- content_assets
- content_asset_versions
- live_sessions
- live_session_participants
```

- [ ] **Step 4: Write tests for RLS policies**

**Agent Prompt:**
```
You are a security-focused tester. Write tests to verify RLS policies work correctly.

Create file: /Users/abhinavnehra/git/tools/AIDU/postgres/test_rls_policies.sql

Write SQL tests that:
1. Create two tenants (teacher A, teacher B)
2. Insert students for each teacher
3. Verify teacher A cannot SELECT teacher B's students
4. Verify teacher A cannot UPDATE teacher B's assignments
5. Verify teacher A cannot DELETE teacher B's classes
6. Verify students CAN see their own data
7. Verify admin role bypasses RLS

Use pgTap or simple assertions to verify:
- Connection as teacher A → count of their students = X
- Connection as teacher A → count of teacher B's students = 0 (RLS blocked)

Required Skill: mcp:context7 for PostgreSQL testing patterns
```

- [ ] **Step 5: Commit**

```bash
cd /Users/abhinavnehra/git/tools/AIDU
mkdir -p postgres/migrations
git add postgres/
git commit -m "feat(db): add PostgreSQL schema with RLS policies

- Central tenants table for multi-teacher isolation
- RLS policies on all user-owned tables
- Migration files for schema + policies
- pgTap tests for policy verification

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Port Teacher App Database Layer (SQLite → PostgreSQL)

**Files:**
- Modify: `teacher/lib/db/index.ts`
- Modify: `teacher/lib/db/schema.sql` (reference)
- Modify: `teacher/package.json` (add pg driver)

**SKILL TO INVOKE:** `mcp:context7` for better-sqlite3 to pg migration patterns

**Steps:**

- [ ] **Step 1: Research SQLite to PostgreSQL migration patterns**

**Agent Prompt:**
```
You are a Node.js database expert. Research patterns for migrating from better-sqlite3 to pg (node-postgres).

Use mcp:context7 to query:
- "node-postgres pg library best practices connection pooling"
- "better-sqlite3 to pg migration patterns"
- "PostgreSQL connection pooling with Next.js"

Focus on:
1. How pg differs from better-sqlite3 (async vs sync, connection pools)
2. How to maintain similar API (getDb() returning same interface)
3. WAL mode equivalent in PostgreSQL
4. Transaction patterns
```

- [ ] **Step 2: Install PostgreSQL driver**

**Agent Prompt:**
```
Install the pg package in the teacher app.

Run: cd /Users/abhinavnehra/git/tools/AIDU/teacher && pnpm add pg

Then modify teacher/package.json to ensure pg is a dependency (not devDependency).
```

- [ ] **Step 3: Rewrite teacher/lib/db/index.ts for PostgreSQL**

**Agent Prompt:**
```
You are a backend developer. Port the teacher app database layer to PostgreSQL.

Read these files:
- /Users/abhinavnehra/git/tools/AIDU/teacher/lib/db/index.ts (current SQLite implementation)
- /Users/abhinavnehra/git/tools/AIDU/teacher/package.json

Modify: /Users/abhinavnehra/git/tools/AIDU/teacher/lib/db/index.ts

Requirements:
1. Keep the same exported API (getDb() function)
2. Use pg Pool instead of better-sqlite3 Database
3. Read DATABASE_URL from environment variable
4. Support SSL connections for production
5. Use parameterized queries to prevent SQL injection (NEVER interpolate user input)
6. Add prepared statement caching for performance
7. Add connection error handling with retry logic
8. The pool should be a module-level singleton

Pattern to follow:
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
});

export function getDb() {
  // Return pool client
  return pool;
}
```

Add Skill: invoke `pr-review-toolkit:silent-failure-hunter` to check for silent error handling
```

- [ ] **Step 4: Add DATABASE_URL to teacher/.env.example**

**Agent Prompt:**
```
Create/update: /Users/abhinavnehra/git/tools/AIDU/teacher/.env.example

Add:
```
# PostgreSQL Database (required for deployment)
DATABASE_URL=postgresql://user:password@localhost:5432/aidutech
```

DO NOT commit actual secrets. The .env file should be gitignored.
```

- [ ] **Step 5: Run existing tests to verify port**

**Agent Prompt:**
```
Run the teacher app tests to verify the database port didn't break anything.

cd /Users/abhinavnehra/git/tools/AIDU/teacher
pnpm test

If tests fail due to database mocking issues:
- Check if tests use __mocks__/db.ts
- Update mock to return pg Pool instead of better-sqlite3
- Use testcontainers/postgres for integration tests if needed

Required Skill: mcp:context7 for "PostgreSQL testcontainers node.js"
```

- [ ] **Step 6: Commit**

```bash
cd /Users/abhinavnehra/git/tools/AIDU
git add teacher/lib/db/index.ts teacher/package.json teacher/.env.example
git commit -m "feat(teacher): port SQLite to PostgreSQL with connection pooling

- Replace better-sqlite3 with pg driver
- Add DATABASE_URL environment variable support
- Add SSL support for production
- Prepared statement caching

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Create Student App Database Layer

**Files:**
- Create: `student/lib/db/index.ts`
- Create: `student/lib/db/schema.sql`
- Modify: `student/package.json` (add pg driver)
- Modify: `student/tsconfig.json` (add path alias for @/lib/db)

**SKILL TO INVOKE:** `backend-developer` agent, `pr-review-toolkit:silent-failure-hunter`

**Steps:**

- [ ] **Step 1: Install PostgreSQL driver in student app**

**Agent Prompt:**
```
Install pg in the student app.

cd /Users/abhinavnehra/git/tools/AIDU/student
pnpm add pg
pnpm add -D @types/pg
```

- [ ] **Step 2: Create student/lib/db/index.ts**

**Agent Prompt:**
```
Create the database layer for the student app.

Create: /Users/abhinavnehra/git/tools/AIDU/student/lib/db/index.ts

This mirrors the teacher app DB layer but:
1. Uses DATABASE_URL from environment
2. The student app only has READ access to:
   - Their own data (via student_id from auth)
   - Assignments assigned to them
   - Live sessions they participate in

Key difference from teacher DB:
- No INSERT/UPDATE/DELETE on users table (students are created by teachers)
- Student can only UPDATE their own completion_state
- Student can INSERT questions in live sessions

Use pg Pool with same pattern as teacher app.

Invoke Skill: pr-review-toolkit:silent-failure-hunter to check error handling
```

- [ ] **Step 3: Create student/lib/db/schema.sql (read-only subset)**

**Agent Prompt:**
```
Create: /Users/abhinavnehra/git/tools/AIDU/student/lib/db/schema.sql

This is a READ-ONLY reference schema showing what tables/columns the student app can access.
Do NOT run this - it's for documentation only.

Include:
- students view (SELECT only)
- assignments_recipients view (SELECT only)
- live_sessions_participants view (SELECT on completion_state only)
- question_messages (INSERT only for asking questions)

This helps developers understand what data students can/cannot access.
```

- [ ] **Step 4: Update student tsconfig for @/lib/db alias**

**Agent Prompt:**
```
Check /Users/abhinavnehra/git/tools/AIDU/student/tsconfig.json

The @/ path alias should already point to the student root.
Verify that @/lib/db will resolve to student/lib/db/index.ts

If the alias doesn't exist, add it:
```json
"paths": {
  "@/*": ["./*"],
  "@/lib/*": ["./lib/*"]
}
```
```

- [ ] **Step 5: Commit**

```bash
cd /Users/abhinavnehra/git/tools/AIDU
git add student/lib/db/ student/package.json student/tsconfig.json
git commit -m "feat(student): add PostgreSQL database layer

- Add pg driver for database connectivity
- Create student/lib/db/index.ts with read-only access patterns
- Student can only access their own data via RLS
- Add schema documentation for student-accessible tables

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Implement Teacher Authentication System

**Files:**
- Modify: `teacher/lib/auth/require-auth.ts`
- Create: `teacher/lib/auth/password.ts`
- Create: `teacher/app/api/auth/signup/route.ts`
- Create: `teacher/app/api/auth/login/route.ts`
- Create: `teacher/app/api/auth/logout/route.ts`
- Create: `teacher/app/api/auth/me/route.ts`

**SKILLS TO INVOKE:**
- `security-engineer` for bcrypt/jwt patterns
- `mcp:context7` for "bcrypt password hashing best practices"
- `skill:pr-review-toolkit:code-review` for security review

**Steps:**

- [ ] **Step 1: Research JWT + bcrypt auth patterns**

**Agent Prompt:**
```
Research secure authentication patterns for a SaaS teacher app.

Use mcp:context7 to query:
- "bcrypt password hashing best practices cost factor"
- "JWT access token refresh token pattern"
- "Next.js authentication with httpOnly cookies"

Focus on:
1. bcrypt cost factor for password hashing (12+ recommended)
2. JWT access token (short expiry: 15min) + refresh token (longer: 7 days)
3. httpOnly cookies for token storage (NOT localStorage)
4. How to set cookies that work across subdomains (localhost for dev)
```

- [ ] **Step 2: Create password hashing utility**

**Agent Prompt:**
```
Create: /Users/abhinavnehraraidutech/teacher/lib/auth/password.ts

Functions:
- hashPassword(password: string): Promise<string> using bcrypt
- verifyPassword(password: string, hash: string): Promise<boolean>

Use bcrypt with cost factor 12.

Required Skill: security-engineer to review for timing attack prevention
```

- [ ] **Step 3: Create teacher signup API**

**Agent Prompt:**
```
Create: /Users/abhinavnehra/git/tools/AIDU/teacher/app/api/auth/signup/route.ts

POST /api/auth/signup
Body: { name: string, email: string, phone: string, password: string }

Flow:
1. Validate input (email format, phone format, password min 8 chars)
2. Check if email/phone already exists
3. Hash password with bcrypt
4. INSERT into users table (role = 'teacher')
5. Create tenant record for this teacher
6. Generate JWT tokens
7. Set httpOnly cookie with access token
8. Return user info (without password)

Invoke Skill: security-engineer for auth flow review
```

- [ ] **Step 4: Create teacher login API**

**Agent Prompt:**
```
Create: /Users/abhinavnehra/git/tools/AIDU/teacher/app/api/auth/login/route.ts

POST /api/auth/login
Body: { email: string, password: string }

Flow:
1. Find user by email
2. Verify password with bcrypt
3. Generate JWT tokens
4. Set httpOnly cookie with access token
5. Set current_tenant_id on the database connection
6. Return user info

Important: The JWT should contain { userId, tenantId, role }
```

- [ ] **Step 5: Update require-auth middleware**

**Agent Prompt:**
```
Modify: /Users/abhinavnehra/git/tools/AIDU/teacher/lib/auth/require-auth.ts

Change from bypass login to real auth:
1. Read access token from httpOnly cookie
2. Verify JWT signature
3. Extract userId, tenantId from token
4. Set current_setting('app.current_tenant_id') on the database connection
5. Return user object with { id, tenantId, role }
6. Protect routes that require authentication

Add:
- requireRole(allowedRoles: string[]) helper
- getSession() to get current user
```

- [ ] **Step 6: Create logout and me endpoints**

**Agent Prompt:**
```
Create two files:

1. /Users/abhinavnehra/git/tools/AIDU/teacher/app/api/auth/logout/route.ts
   - Clear httpOnly cookie
   - Return 200

2. /Users/abhinavnehra/git/tools/AIDU/teacher/app/api/auth/me/route.ts
   - GET /api/auth/me
   - Return current user info from require-auth
   - Returns 401 if not authenticated
```

- [ ] **Step 7: Commit**

```bash
cd /Users/abhinavnehra/git/tools/AIDU
git add teacher/lib/auth/ teacher/app/api/auth/
git commit -m "feat(teacher): add real authentication system

- bcrypt password hashing (cost factor 12)
- JWT access + refresh tokens
- httpOnly cookies for secure token storage
- require-auth middleware with role checking
- signup, login, logout, me endpoints

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Implement Student Authentication System

**Files:**
- Create: `student/lib/auth/require-auth.ts` (adapt from teacher)
- Create: `student/lib/auth/session.ts`
- Create: `student/app/api/auth/join/route.ts`
- Create: `student/app/api/auth/me/route.ts`
- Modify: `student/app/api/student/join-class/route.ts` (existing - fix to use auth)

**SKILLS TO INVOKE:** Same as Task 4

**Steps:**

- [ ] **Step 1: Create student auth system (adapt from teacher)**

**Agent Prompt:**
```
Create student authentication system, adapted from teacher auth.

Students don't sign up directly - they're created by teachers.
Student auth is simpler:
1. Teacher creates student record (name, phone)
2. Teacher generates a join code for student
3. Student uses join code + phone to authenticate
4. JWT issued, student can access their assignments

Create files:
1. /Users/abhinavnehra/git/tools/AIDU/student/lib/auth/require-auth.ts
   - Similar to teacher but role = 'student_classroom'
   - Sets current_tenant_id from student record's teacher_id

2. /Users/abhinavnehra/git/tools/AIDU/student/app/api/auth/join/route.ts
   POST /api/auth/join
   Body: { joinCode: string, phone: string, name: string }
   - Validates join code exists
   - Creates student in users table (role = 'student_classroom')
   - Returns JWT tokens

3. /Users/abhinavnehra/git/tools/AIDU/student/app/api/auth/me/route.ts
   GET /api/auth/me - returns current student info
```

- [ ] **Step 2: Update existing join-class route to use real auth**

**Agent Prompt:**
```
Modify: /Users/abhinavnehra/git/tools/AIDU/student/app/api/student/join-class/route.ts

Currently: mock/bypass auth
Update to:
1. require-auth for teacher endpoints
2. Student can only join a class if:
   - Student is authenticated
   - Class has the join code they provided
3. INSERT into class_memberships
```

- [ ] **Step 3: Commit**

```bash
cd /Users/abhinavnehra/git/tools/AIDU
git add student/lib/auth/ student/app/api/auth/
git commit -m "feat(student): add student authentication system

- Students created by teachers via join codes
- Student login with phone + join code
- JWT tokens with student role
- Protected API routes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Build Student Dashboard with Real Data

**Files:**
- Modify: `student/app/page.tsx` (current placeholder)
- Create: `student/app/student/classes/page.tsx`
- Create: `student/app/student/assignments/page.tsx`
- Create: `student/app/student/sessions/[sessionId]/page.tsx` (already exists - update)

**SKILLS TO INVOKE:**
- `frontend-developer` agent
- `mcp:playwright` for testing
- `skill:ui-designer` for component styling

**Steps:**

- [ ] **Step 1: Update student dashboard to fetch real data**

**Agent Prompt:**
```
You are a frontend developer. Update the student app dashboard to show real data.

Modify: /Users/abhinavnehra/git/tools/AIDU/student/app/page.tsx

Current: Static placeholder with mock data
Update to:
1. On mount, fetch /api/student/classes
2. Fetch /api/student/assignments
3. Fetch /api/student/live-sessions
4. Display real data with loading states
5. Use existing UI components/styles

Use useEffect with fetch, or React Query if available.
```

- [ ] **Step 2: Create student classes page**

**Agent Prompt:**
```
Create: /Users/abhinavnehra/git/tools/AIDU/student/app/student/classes/page.tsx

This page shows:
- List of classes the student is enrolled in
- Each class card shows: name, teacher name, subject
- Clicking a class shows enrolled students (if peer visibility enabled)

API calls:
- GET /api/student/classes
```

- [ ] **Step 3: Create student assignments page**

**Agent Prompt:**
```
Create: /Users/abhinavnehra/git/tools/AIDU/student/app/student/assignments/page.tsx

This page shows:
- Pending assignments (not started)
- In-progress assignments
- Completed assignments
- Each assignment shows: title, due date, status, teacher name

API calls:
- GET /api/student/assignments
```

- [ ] **Step 4: Update existing live session page for real data**

**Agent Prompt:**
```
Update: /Users/abhinavnehra/git/tools/AIDU/student/app/student/sessions/[sessionId]/page.tsx

Currently: Mock data, fetch from real API
- GET /api/student/live-sessions/[sessionId]
- POST /api/student/live-sessions/[sessionId]/join
- POST /api/student/live-sessions/[sessionId]/completion
```

- [ ] **Step 5: Run Playwright test to verify student flow**

**Agent Prompt:**
```
Run end-to-end test for student flow.

Use mcp:playwright to:
1. Navigate to student app
2. Use join code to register
3. Verify dashboard shows classes
4. Click on a class
5. Verify assignments appear

If mcp:playwright not available, use skill:playwright-test
```

- [ ] **Step 6: Commit**

```bash
cd /Users/abhinavnehra/git/tools/AIDU
git add student/app/page.tsx student/app/student/
git commit -m "feat(student): connect dashboard to real APIs

- Fetch classes, assignments, live sessions from backend
- Add loading and error states
- Student can view enrolled classes
- Student can see assignments with status

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Build Teacher Dashboard with Real Data + CRUD

**Files:**
- Modify: `teacher/app/page.tsx` (current placeholder)
- Create: `teacher/app/teacher/students/page.tsx`
- Create: `teacher/app/teacher/students/[studentId]/page.tsx`
- Create: `teacher/app/api/teacher/students/route.ts`
- Create: `teacher/app/api/teacher/students/[studentId]/route.ts`

**SKILLS TO INVOKE:** Same as Task 6

**Steps:**

- [ ] **Step 1: Update teacher dashboard to fetch real data**

**Agent Prompt:**
```
You are a frontend developer. Update the teacher app dashboard.

Modify: /Users/abhinavnehra/git/tools/AIDU/teacher/app/page.tsx

Current: Mock data with some API calls
Update to:
1. Fetch real classes, assignments, live sessions on mount
2. Add "Create Class" button → modal or page
3. Add "Add Student" button → modal
4. Show join codes for each class
```

- [ ] **Step 2: Create students management page**

**Agent Prompt:**
```
Create: /Users/abhinavnehra/git/tools/AIDU/teacher/app/teacher/students/page.tsx

Shows:
- Table of all students across all classes
- Student name, class, join date, completion rate
- "Add Student" button
- "Generate Join Code" button
- Click row to view student details

API: GET /api/teacher/students
```

- [ ] **Step 3: Create student detail page**

**Agent Prompt:**
```
Create: /Users/abhinavnehra/git/tools/AIDU/teacher/app/teacher/students/[studentId]/page.tsx

Shows:
- Student info (name, phone, enrolled classes)
- Assignment progress per assignment
- Live session attendance
- Questions asked
- Token usage (if tracking)

API: GET /api/teacher/students/[studentId]
```

- [ ] **Step 4: Create students CRUD API**

**Agent Prompt:**
```
Create API routes for student management:

1. /Users/abhinavnehra/git/tools/AIDU/teacher/app/api/teacher/students/route.ts
   GET /api/teacher/students - list all teacher's students
   POST /api/teacher/students - create student + generate join code

2. /Users/abhinavnehra/git/tools/AIDU/teacher/app/api/teacher/students/[studentId]/route.ts
   GET /api/teacher/students/[studentId] - student detail with progress
   DELETE /api/teacher/students/[studentId] - remove student (soft delete)
```

- [ ] **Step 5: Commit**

```bash
cd /Users/abhinavnehra/git/tools/AIDU
git add teacher/app/page.tsx teacher/app/teacher/students/ teacher/app/api/teacher/students/
git commit -m "feat(teacher): student management + real dashboard data

- CRUD for students (create with join code, view progress)
- Real data on dashboard instead of mocks
- Student detail page with assignment progress
- Token usage tracking per student

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Create Assignment System with Progress Tracking

**Files:**
- Create: `teacher/app/api/teacher/assignments/route.ts` (if not exists)
- Create: `teacher/app/api/teacher/assignments/[assignmentId]/route.ts`
- Create: `teacher/app/teacher/assignments/[assignmentId]/page.tsx`
- Modify: `student/app/api/student/assignments/route.ts`

**SKILLS TO INVOKE:** `backend-developer`, `frontend-developer`

**Steps:**

- [ ] **Step 1: Create assignment CRUD for teacher**

**Agent Prompt:**
```
Create/Update teacher assignment APIs:

1. /Users/abhinavnehra/git/tools/AIDU/teacher/app/api/teacher/assignments/route.ts
   GET /api/teacher/assignments - list teacher's assignments
   POST /api/teacher/assignments - create assignment

2. /Users/abhinavnehra/git/tools/AIDU/teacher/app/api/teacher/assignments/[assignmentId]/route.ts
   GET /api/teacher/assignments/[assignmentId] - assignment detail
   PUT /api/teacher/assignments/[assignmentId] - update assignment
   DELETE /api/teacher/assignments/[assignmentId] - delete

When creating assignment:
- Associate with class_id
- Generate assignment_recipients for all students in class
- Track created_at, release_at, due_at
```

- [ ] **Step 2: Create assignment detail page for teacher**

**Agent Prompt:**
```
Create: /Users/abhinavnehra/git/tools/AIDU/teacher/app/teacher/assignments/[assignmentId]/page.tsx

Shows:
- Assignment title, description, status
- List of students assigned
- Completion status per student (not started, in progress, completed)
- "Release Assignment" button
- "View Submissions" button

API: GET /api/teacher/assignments/[assignmentId] with recipients
```

- [ ] **Step 3: Create student assignments API**

**Agent Prompt:**
```
Create/Update: /Users/abhinavnehra/git/tools/AIDU/student/app/api/student/assignments/route.ts

GET /api/student/assignments
- Returns assignments where student is in assignment_recipients
- Includes: title, description, due_at, status, completion_state

GET /api/student/assignments/[assignmentId]
- Returns single assignment with content
- Track slide progress as student views slides
```

- [ ] **Step 4: Create assignment progress tracking**

**Agent Prompt:**
```
Create: /Users/abhinavnehra/git/tools/AIDU/student/app/api/student/assignments/[assignmentId]/progress/route.ts

POST /api/student/assignments/[assignmentId]/progress
Body: { slideId: string, viewedAt: string }

Updates assignment_slide_progress table.
Enables teacher to see "Slide 3 of 10 viewed" per student.
```

- [ ] **Step 5: Commit**

```bash
cd /Users/abhinavnehra/git/tools/AIDU
git add teacher/app/api/teacher/assignments/ teacher/app/teacher/assignments/
git add student/app/api/student/assignments/
git commit -m "feat: assignment CRUD with progress tracking

- Teachers can create/release assignments to classes
- Students see assigned work with due dates
- Slide-by-slide progress tracking
- Teacher views completion status per student

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: End-to-End Integration Test

**Files:**
- Create: `e2e/auth-flow.spec.ts`
- Create: `e2e/teacher-student-flow.spec.ts`
- Create: `e2e/assignment-flow.spec.ts`

**SKILLS TO INVOKE:**
- `mcp:playwright` for browser automation
- `playwright-test` skill for test patterns

**Steps:**

- [ ] **Step 1: Test teacher signup → create class → add student flow**

**Agent Prompt:**
```
Create: /Users/abhinavnehra/git/tools/AIDU/e2e/teacher-student-flow.spec.ts

Test scenario:
1. Teacher signs up at /teacher
2. Teacher creates a class "Math 101"
3. Teacher adds 2 students (name, phone)
4. System generates join codes
5. Student 1 logs in with join code
6. Student 1 sees Math 101 in their classes
7. Teacher assigns a slide deck to Math 101
8. Student 1 sees the assignment
9. Student 1 completes the assignment
10. Teacher sees Student 1's completion status

Use mcp:playwright for browser automation.
If mcp:playwright unavailable, use skill:playwright-test.
```

- [ ] **Step 2: Test RLS isolation**

**Agent Prompt:**
```
Create: /Users/abhinavnehra/git/tools/AIDU/e2e/rls-isolation.spec.ts

Test that teachers cannot access each other's data:
1. Teacher A creates class, adds Student A1
2. Teacher B creates class, adds Student B1
3. Teacher A tries to access Teacher B's students via API → should return empty
4. Teacher B tries to access Teacher A's assignments → should return empty

This verifies RLS policies work correctly.
```

- [ ] **Step 3: Commit**

```bash
cd /Users/abhinavnehra/git/tools/AIDU
git add e2e/teacher-student-flow.spec.ts e2e/rls-isolation.spec.ts
git commit -m "test: add E2E integration tests for auth and RLS

- Teacher signup → class → student flow
- RLS isolation verification
- Assignment creation → student completion tracking

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Verification Checklist

After all tasks complete, verify:

- [ ] PostgreSQL schema creates without errors
- [ ] RLS policies block cross-tenant access
- [ ] Teacher can sign up, create class, add students
- [ ] Students can join with code, see classes
- [ ] Assignments created by teacher appear for correct students
- [ ] Progress tracking works (slide viewed → tracked)
- [ ] E2E tests pass on clean database
- [ ] All servers run with DATABASE_URL pointing to PostgreSQL
- [ ] No hardcoded credentials or secrets in code

---

## Recommended Subagent Execution Order

| Order | Task | Primary Agent | Complexity |
|-------|------|--------------|------------|
| 1 | PostgreSQL Schema + RLS | database-optimizer | High |
| 2 | Teacher DB Port | backend-developer | Medium |
| 3 | Student DB Setup | backend-developer | Low |
| 4 | Teacher Auth | security-engineer | High |
| 5 | Student Auth | security-engineer | Medium |
| 6 | Teacher Dashboard | frontend-developer | Medium |
| 7 | Student Dashboard | frontend-developer | Medium |
| 8 | Assignment System | backend-developer | High |
| 9 | E2E Tests | tester | Medium |

**Recommended:** Run tasks 1-3 (database layer) first, verify they work, then proceed to auth and UI.

---

## Files Summary

### Create (New Files)
```
postgres/schema.sql
postgres/migrations/001_initial_schema.sql
postgres/migrations/002_rls_policies.sql
postgres/test_rls_policies.sql
teacher/lib/auth/password.ts
teacher/app/api/auth/signup/route.ts
teacher/app/api/auth/login/route.ts
teacher/app/api/auth/logout/route.ts
teacher/app/api/auth/me/route.ts
teacher/app/teacher/students/page.tsx
teacher/app/teacher/students/[studentId]/page.tsx
teacher/app/api/teacher/students/route.ts
teacher/app/api/teacher/students/[studentId]/route.ts
student/lib/db/index.ts
student/lib/db/schema.sql
student/lib/auth/require-auth.ts
student/app/api/auth/join/route.ts
student/app/api/auth/me/route.ts
student/app/student/classes/page.tsx
student/app/student/assignments/page.tsx
e2e/teacher-student-flow.spec.ts
e2e/rls-isolation.spec.ts
```

### Modify (Existing Files)
```
teacher/lib/db/index.ts
teacher/package.json
teacher/lib/auth/require-auth.ts
teacher/app/page.tsx
teacher/app/api/teacher/assignments/route.ts
teacher/app/teacher/assignments/[assignmentId]/page.tsx
student/package.json
student/lib/db/index.ts (create)
student/tsconfig.json
student/app/page.tsx
student/app/api/student/classes/route.ts
student/app/api/student/assignments/route.ts
student/app/api/student/live-sessions/[sessionId]/page.tsx
```

### Documentation
```
docs/superpowers/plans/2026-04-28-database-architecture-implementation-plan.md (this file)
```

---

## Environment Variables Required

```env
# Database (both apps)
DATABASE_URL=postgresql://user:password@host:5432/aidutech

# JWT Secret (both apps)
JWT_SECRET=your-super-secret-key-min-32-chars

# Teacher app only
TEACHER_APP_URL=http://localhost:3001

# Student app only
STUDENT_APP_URL=http://localhost:3002
```

---

## PRD Change Entry

After implementation, create PRD change entry:

```markdown
# PRD Change Entry: 2026-04-28-DATABASE-ARCHITECTURE

## What Changed
- Added PostgreSQL database with Row-Level Security (RLS)
- Teacher authentication (signup, login, JWT tokens)
- Student authentication (join codes, phone-based login)
- Student CRUD for teachers (create students, generate join codes)
- Assignment system with progress tracking
- Slide-by-slide progress monitoring

## Architecture
- Single PostgreSQL database with RLS policies
- Multi-tenant isolation at database level
- Both apps connect to same database
- JWT tokens with tenant_id embedded

## New Files
- postgres/ directory with schema and migrations
- New API routes for auth, students, assignments
- Student app database layer
- E2E integration tests

## Security
- RLS prevents cross-tenant data access
- bcrypt password hashing (cost 12)
- httpOnly cookies for token storage
- Parameterized queries (no SQL injection)

## Status: IMPLEMENTED
```
