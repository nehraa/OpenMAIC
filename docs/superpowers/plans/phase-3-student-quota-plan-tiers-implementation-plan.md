# Phase 3 Implementation Plan — Student Quota + Plan Tiers

## Overview

**Phase**: 3 of Aidutech Roadmap
**Duration**: 27-34 working days (7 subphases)
**Goal**: Monetization-ready controls — plan tiers, quota enforcement, B2C/classroom separation, content caching, student dashboard
**Dependencies**: Phase 1 (identity/role baseline), Phase 2 (assignment/progress baseline)

---

## Updated Scope — Landing Page + Role Selection

**Clarified by user (2026-04-27):**
The system needs a unified entry point BEFORE implementing quotas:

| Step | Path |
|------|------|
| Landing page | 3 buttons: **Teacher** / **Student** / **Individual** |
| → Teacher | Login page (bypass) → Teacher panel |
| → Student | Login page (bypass) → Student classroom mode |
| → Individual | Login page (bypass) → OpenMAIC core (B2C self-serve) |

**"Individual"** = B2C student (self-serve, pays, has quota)
**"Student"** = Classroom student (invited by teacher, read-only assigned content)
**"Teacher"** = Teacher panel (Phase 2 already built)

This is a **pre-requisite** that must be built first — before Subphase 1 of Phase 3 proper. Without this, there's no way to enter the system to test quotas.

### New Pre-Subphase 0: Unified Landing + Role Selection Flow
**Duration**: 2-3 days (parallelizable with Subphase 1)

#### 0.1 Landing Page with Role Selection
**Agent**: `frontend-developer`
```
INVOKE /agency frontend-developer
TASK: Create landing page with 3 role selection buttons
CONTEXT:
- Location: root page.tsx at project root (or shared entry)
- OR: create new app at /app/page.tsx that shows 3 cards:
  - Teacher card: icon + "Teacher Panel" + description
  - Student card: icon + "Student (Classroom)" + description
  - Individual card: icon + "Individual (Self-Serve)" + description
- Clicking any card navigates to respective login page
- Use existing UI patterns from teacher/student apps
- Design: clean, professional, clear distinction between paths
SKILLS: frontend-design
MCP: pencil (create mockup first)
```

#### 0.2 Role-Based Login Pages
**Agent**: `frontend-developer`
```
INVOKE /agency frontend-developer
TASK: Create 3 login pages (Teacher, Student, Individual)
CONTEXT:
- /login/teacher/page.tsx → Login form → redirect to /teacher/*
- /login/student/page.tsx → Login form → redirect to /student/*
- /login/individual/page.tsx → Login form → redirect to /core/* (OpenMAIC)
- For now: BYPASS LOGIN — any input just creates/sets session and redirects
- Session: store role (teacher|student|individual) in cookie or localStorage
- Auth: no password yet, no Redis yet — just role-based routing
SKILLS: frontend-developer
```

#### 0.3 Route Guards for Role Enforcement
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Add middleware to enforce role-based access
CONTEXT:
- /teacher/* routes: only accessible if session.role === 'teacher'
- /student/* routes: only accessible if session.role === 'student'
- /core/* routes: only accessible if session.role === 'individual'
- On unauthorized access: redirect to landing page
- This prevents direct URL access bypassing role selection
SKILLS: security-engineer
```

#### 0.4 Individual = B2C Mode Mapping
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Map "Individual" role to student_b2c mode in database
CONTEXT:
- When Individual logs in for first time: create user with mode='b2c'
- Store role mapping: Individual → student_b2c
- This connects to Phase 3 quota system (B2C students have quotas)
SKILLS: backend-architect
```

#### 0.5 Student = Classroom Mode Mapping
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Map "Student" role to student_classroom mode
CONTEXT:
- When Student logs in: mode='classroom'
- Classroom students go through Phase 1/2 assignment flow
- Read-only: cannot access B2C generation endpoints
SKILLS: backend-architect
```

#### 0.6 Landing Page Tests
**Agent**: `tester`
```
INVOKE /agency playwright
TASKS:
1. E2E: landing page shows 3 role options
2. E2E: clicking Teacher → goes to /login/teacher → enters → sees teacher panel
3. E2E: clicking Student → goes to /login/student → enters → sees student dashboard
4. E2E: clicking Individual → goes to /login/individual → enters → sees OpenMAIC core
5. E2E: direct URL to /teacher without teacher session → redirects to landing
LOCATION: e2e/landing-role-selection.spec.ts
```

---

## Phase 3 Scope Summary (Updated)

| Subphase | Name | Days | Focus |
|----------|------|------|-------|
| 0 | Landing + Role Selection | 2-3 | entry point, login pages, route guards |
| 1 | Plan Catalog + Subscription | 3-4 | plans table, signup selection, plan APIs |
| 2 | Quota Ledger + Enforcement | 5-6 | quota_periods, question_events, middleware |
| 3 | B2C/Classroom Separation | 4-5 | route namespaces, guard middleware |
| 4 | Content Cache Layer | 5-6 | content_cache_entries, read-through cache |
| 5 | Student Usage Dashboard | 4-5 | dashboard APIs, UI widgets |
| 6 | Monthly Reset Scheduler | 3-4 | reset job, retry logic, runbook |
| 7 | Integration + Hardening | 3-4 | regression suite, permission tests |

**Total Duration**: 29-37 working days (added 2-3 days for Subphase 0)

---

## User Role Mapping (From Subphase 0)

```
User.role (landing page selection)
├── "teacher"  → Teacher panel, no quotas
├── "student"   → Classroom student, mode='classroom', read-only
└── "individual" → B2C student, mode='b2c', plan+quota applies
```

**Quota applies ONLY to "individual" (B2C).**
**Classroom "student" cannot prompt/generate — only view assigned content.**

---

## Data Model (New Entities)

```
users
├── ...existing fields...
├── role (teacher|student|individual)  -- added by Subphase 0
├── mode (classroom|b2c)                -- only for role=student
└── ...existing fields...

plans
├── id (pk)
├── code (basic|image|video)
├── name
├── monthly_question_limit (null=unlimited)
├── price_inr
├── feature_flags_json
└── timestamps

student_plan_subscriptions
├── id (pk)
├── student_id (fk users)
├── plan_id (fk plans)
├── status (active|canceled|superseded)
├── starts_at
├── ends_at
└── timestamps

quota_periods
├── id (pk)
├── student_id (fk users)
├── period_key (YYYY-MM)
├── monthly_limit
├── used_count
├── remaining_count
├── reset_at
└── timestamps

question_events
├── id (pk)
├── student_id
├── actor_role
├── mode (classroom|b2c)
├── endpoint
├── request_hash
├── outcome (allowed|blocked|cached)
├── quota_delta
└── created_at

content_cache_entries
├── id (pk)
├── content_hash
├── content_type (slide|quiz|answer)
├── payload_json
├── source_model
├── token_cost_input
├── token_cost_output
├── expires_at
└── invalidated_at

content_cache_hits
├── id (pk)
├── cache_entry_id (fk)
├── student_id
├── request_context
└── created_at

student_content_history
├── id (pk)
├── student_id
├── content_hash
├── content_type
├── first_seen_at
├── last_seen_at
└── seen_count

student_usage_daily
├── id (pk)
├── student_id
├── date_key
├── questions_used
├── cache_hits
├── sessions_count
└── quiz_attempts_count
```

---

## API Surface

### Plan APIs
- `GET /api/student/plans` — list available plans
- `POST /api/student/plan/select` — select a plan
- `GET /api/student/plan/current` — get current plan

### Quota APIs
- `GET /api/student/quota/status` — check remaining quota
- `POST /api/student/quota/check-and-reserve` — atomic check+decrement
- `POST /api/internal/quota/reset-monthly` — monthly reset (cron)

### B2C/Classroom Mode APIs
- `GET /api/student/mode` — get current mode
- `POST /api/student/mode/switch` — switch mode (if allowed)

### Cache APIs
- `POST /api/internal/cache/resolve` — resolve cache key
- `POST /api/internal/cache/store` — store generated content
- `POST /api/internal/cache/invalidate` — invalidate cache

### Dashboard APIs
- `GET /api/student/dashboard/usage` — quota usage summary
- `GET /api/student/dashboard/quiz-history` — quiz scores
- `GET /api/student/dashboard/homework-summary` — pending/completed
- `GET /api/student/dashboard/session-history` — session list

---

## Subphase 1: Plan Catalog + Subscription Foundation
**Duration**: 3-4 days

### Tasks

#### 1.1 Database Schema — Plans
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Create SQL migration for Phase 3 core tables
CONTEXT:
- Location: teacher/lib/db/phase3-schema.sql (shared via /shared)
- Tables: plans, student_plan_subscriptions
- Use existing Phase 2 schema as pattern (teacher/lib/db/phase2-schema.sql)
- Plans: Basic (₹1,000, 20 questions), Image (₹2,000, 100 questions), Video (₹3,000, unlimited)
- Feature flags as JSON column
- Add created_at, updated_at to all tables
SKILLS: tdd (write tests first)
MCP: claude-peers (for shared schema coordination with student workspace)
```

#### 1.2 Seed Data — Plan Records
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Seed plans table with 3 plan records
CONTEXT:
- Use db.ts pattern from teacher/lib/db.ts
- Insert 3 plans: basic, image, video with correct limits and prices
- Price in INR: 1000, 2000, 3000
```

#### 1.3 Plan List API
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Implement GET /api/student/plans endpoint
CONTEXT:
- Route: student/app/api/student/plans/route.ts
- Return all active plans with feature flags (not price in response — just quota info)
- Use existing API route pattern from student/app/api/
SKILLS: api-design
MCP: none needed
```

#### 1.4 Plan Selection API
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Implement POST /api/student/plan/select and GET /api/student/plan/current
CONTEXT:
- Routes: student/app/api/student/plan/select/route.ts, student/app/api/student/plan/current/route.ts
- POST: creates student_plan_subscriptions record, sets status=active
- GET: returns current active plan for authenticated student
- Validate plan_id exists before inserting subscription
- Auth: require student auth (use existing student middleware pattern)
MCP: none needed
```

#### 1.5 Signup Plan Selection UI
**Agent**: `frontend-developer`
```
INVOKE /agency frontend-developer
TASK: Add plan selection UI to student signup flow
CONTEXT:
- Location: student/app/(auth)/signup/page.tsx (or wherever signup lives)
- Show 3 plan cards with name, quota, and price
- Student must select a plan before account creation completes
- On selection, call POST /api/student/plan/select
- Use existing UI component patterns from student app
SKILLS: frontend-design
MCP: pencil (verify design mockup if needed)
```

#### 1.6 Tests — Subphase 1
**Agent**: `tester`
```
INVOKE /agency test-agent (or manual)
TASKS:
1. Unit test: plan selection creates subscription record
2. Unit test: GET /api/student/plans returns all 3 plans
3. Integration test: signup + plan selection flow
4. E2E test: student signs up, selects plan, verifies plan appears in account
LOCATION: teacher/lib/server/plans.test.ts
TOOLS: vitest, playwright
```

---

## Subphase 2: Quota Ledger + Enforcement Middleware
**Duration**: 5-6 days

### Tasks

#### 2.1 Database Schema — Quota Tables
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Create SQL migration for quota_periods and question_events tables
CONTEXT:
- Tables: quota_periods, question_events, student_usage_daily
- quota_periods: unique constraint on (student_id, period_key)
- question_events: stores every question request with outcome
- Atomic increment on used_count with transaction
- student_usage_daily: aggregated daily stats
SKILLS: tdd
```

#### 2.2 Quota Status API
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Implement GET /api/student/quota/status
CONTEXT:
- Returns: { used_count, remaining_count, monthly_limit, resets_at }
- Calculate remaining from current period (or create new if none exists)
- Use current plan's monthly_question_limit
- Video plan: return unlimited (-1 or null for remaining)
```

#### 2.3 Check-and-Reserve API (Atomic Quota Decrement)
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Implement POST /api/student/quota/check-and-reserve
CONTEXT:
- This is the core quota enforcement endpoint
- MUST be atomic: BEGIN transaction → check remaining → increment used_count → COMMIT
- Request hash for idempotency (prevent double-decrement on retry)
- Return: { allowed: true, remaining } OR { allowed: false, reason: "quota_exceeded", upgrade_url }
- Video plan: always allowed, no decrement needed
- If quota_period doesn't exist for current month, create it first
SKILLS: backend-architect (focus on transaction safety)
```

#### 2.4 Quota Enforcement Middleware
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Create quota middleware that wraps all question-generation endpoints
CONTEXT:
- Location: student/lib/middleware/quota-enforcement.ts
- Wrap endpoints: /api/chat, /api/generate-*, any endpoint that calls LLM
- Middleware calls check-and-reserve before passing request through
- On block: return 402 Payment Required with upgrade CTA
- Skip for: classroom mode (read-only), teacher role, admin
SKILLS: backend-architect
```

#### 2.5 Question Counter UI
**Agent**: `frontend-developer`
```
INVOKE /agency frontend-developer
TASK: Add quota counter display to student question UI
CONTEXT:
- Location: student/app/student/(b2c)/layout.tsx or question page
- Show: "12 questions left" or "Unlimited" for video plan
- Counter must update immediately after each question (optimistic + confirm)
- At 0: show upgrade banner with CTA
- Use existing token counter pattern from core/components/ai-elements/context.tsx
SKILLS: frontend-design
```

#### 2.6 Monthly Reset Cron Job
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Implement POST /api/internal/quota/reset-monthly
CONTEXT:
- Endpoint called by cron scheduler on 1st of each month
- Idempotent: only reset if reset_at has passed
- For each student with active subscription:
  - Create new quota_period for new month
  - Mark old period as ended
- Log reset events in question_events for audit
- Return: { reset_count, errors[] }
SKILLS: backend-architect
```

#### 2.7 Tests — Subphase 2
**Agent**: `tester`
```
INVOKE /agency test-agent
TASKS:
1. Unit test: quota decrement is atomic under concurrent requests
2. Unit test: Video plan never blocks (unlimited)
3. Unit test: Basic plan blocks at 21st question
4. Unit test: Image plan blocks at 101st question
5. Unit test: Idempotency — same request_hash cannot double-decrement
6. Integration test: question request flow with allow/block outcomes
7. Integration test: monthly reset creates new period, old period closed
LOCATION: teacher/lib/server/quota.test.ts
TOOLS: vitest, better-sqlite3 (mock for concurrency tests)
```

---

## Subphase 3: B2C / Classroom Route Separation
**Duration**: 4-5 days

### Tasks

#### 3.1 Student Mode Field
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Add mode field to student authentication/session
CONTEXT:
- student.users.mode: 'classroom' | 'b2c'
- Default new students to 'b2c' (self-serve)
- Existing classroom students from Phase 1: keep as 'classroom'
- Mode stored in session/JWT, validated on every request
SKILLS: backend-architect
```

#### 3.2 Route Namespace Separation
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Create separate route groups for B2C and classroom student endpoints
CONTEXT:
- B2C routes: student/app/api/b2c/ (full generation capability)
- Classroom routes: student/app/api/classroom/ (read-only + ask questions)
- Existing student API routes need review: move generation endpoints to /b2c/
- Classroom endpoints: /api/classroom/sessions/, /api/classroom/assignments/
SKILLS: backend-architect, api-design
```

#### 3.3 Mode Guard Middleware
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Create middleware that enforces mode-based route access
CONTEXT:
- Location: student/lib/middleware/mode-guard.ts
- /b2c/* routes: reject if student.mode !== 'b2c'
- /classroom/* routes: reject if student.mode !== 'classroom'
- Return 403 Forbidden with clear message
- Log unauthorized access attempts
SKILLS: security-engineer
```

#### 3.4 Classroom Student Prompt Prevention
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Add prompt prevention to chat/generate endpoints for classroom students
CONTEXT:
- Even within /b2c/ routes, check student.mode
- Classroom student attempting B2C generation: return 403 with "upgrade to B2C" message
- This is defense-in-depth — route guards should catch this first
SKILLS: security-engineer
```

#### 3.5 Mode Switch API
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Implement POST /api/student/mode/switch
CONTEXT:
- Allow student to switch from classroom to B2C (if they have a plan with quota > 0)
- B2C to classroom: always allowed
- Log mode switches
- Validate: must have active plan subscription to switch to B2C
SKILLS: backend-architect
```

#### 3.6 UI Updates for Mode Separation
**Agent**: `frontend-developer`
```
INVOKE /agency frontend-developer
TASK: Update student app UI to reflect mode-specific capabilities
CONTEXT:
- Classroom student: show read-only badge, no generation buttons
- B2C student: show plan badge, full generation UI
- Mode switcher in account settings if eligible
- Use existing UI patterns from student app
SKILLS: frontend-design
MCP: pencil (for mode badge designs)
```

#### 3.7 Tests — Subphase 3
**Agent**: `tester`
```
INVOKE /agency test-agent
TASKS:
1. Unit test: B2C routes reject classroom student
2. Unit test: Classroom routes reject B2C student
3. Unit test: Classroom student attempting /b2c/chat gets 403
4. Integration test: mode switch from classroom to B2C succeeds
5. E2E test: classroom student logs in, cannot see B2C generation buttons
6. E2E test: B2C student has full generation UI
LOCATION: teacher/student/lib/server/access-control.test.ts (extend)
TOOLS: vitest, playwright
```

---

## Subphase 4: Content Cache Layer
**Duration**: 5-6 days

### Tasks

#### 4.1 Database Schema — Cache Tables
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Create SQL migration for content_cache_entries, content_cache_hits, student_content_history
CONTEXT:
- Tables: content_cache_entries, content_cache_hits, student_content_history
- content_cache_entries: unique on (content_hash, content_type, template_version)
- TTL: slides=30d, quiz=30d, answer=7d
- content_cache_hits: log each cache read
- student_content_history: upsert on content view (first_seen_at, increment seen_count)
SKILLS: tdd
```

#### 4.2 Cache Key Generation
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Implement content_hash generation utility
CONTEXT:
- Location: shared/lib/cache.ts (shared between teacher/student)
- Input: source content (PDF hash, prompt, parameters)
- Output: deterministic hash (SHA-256 of canonical JSON)
- Include template_version in hash for invalidation on template changes
SKILLS: backend-architect
```

#### 4.3 Read-Through Cache Integration
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Add cache layer to generation endpoints
CONTEXT:
- On generation request: first check cache
- Cache HIT: return cached payload, log cache_hit, no LLM call
- Cache MISS: call LLM, store result in cache, log question_event with token cost
- Generation endpoints to wrap: /api/b2c/chat, /api/generate-slides, /api/generate-quiz
- Store: content_hash, content_type, payload_json, token_cost_input/output, expires_at
SKILLS: backend-architect
```

#### 4.4 Student History Tracking
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Implement student_content_history upsert logic
CONTEXT:
- On every content view: upsert student_content_history
- first_seen_at: set on first insert only
- last_seen_at: update on every access
- seen_count: increment
- This feeds the "previously viewed" feature
SKILLS: backend-architect
```

#### 4.5 Cache Invalidation API
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Implement POST /api/internal/cache/invalidate
CONTEXT:
- When source content changes, invalidate related cache entries
- Input: content_hash[] or content_type + older_than_date
- Set invalidated_at timestamp (soft delete — keep for audit)
- Do NOT delete — maintain for cache hit analysis
SKILLS: backend-architect
```

#### 4.6 Cache Analytics Dashboard (Internal)
**Agent**: `frontend-developer`
```
INVOKE /agency frontend-developer
TASK: Add internal dashboard for cache hit/miss metrics
CONTEXT:
- Location: teacher/app/teacher/dashboard/cache/page.tsx
- Show: cache hit ratio, token savings estimate, popular content
- Use existing teacher dashboard patterns
SKILLS: frontend-design
```

#### 4.7 Tests — Subphase 4
**Agent**: `tester`
```
INVOKE /agency test-agent
TASKS:
1. Unit test: same content_hash returns cache hit
2. Unit test: different content_hash returns cache miss and stores
3. Unit test: cache miss triggers LLM call
4. Integration test: first view stores cache, second view returns cached
5. Integration test: student_history upsert increments seen_count
6. Test: cache invalidation marks entry as invalidated
7. E2E test: repeat slide view consumes 0 tokens on second view
LOCATION: teacher/lib/server/cache.test.ts
TOOLS: vitest
```

---

## Subphase 5: Student Usage Dashboard
**Duration**: 4-5 days

### Tasks

#### 5.1 Dashboard Usage API
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Implement GET /api/student/dashboard/usage
CONTEXT:
- Returns: { questions_used, questions_remaining, plan_name, monthly_limit, days_until_reset }
- Source: quota_periods + question_events
- Data freshness: < 500ms p95
SKILLS: backend-architect
```

#### 5.2 Quiz History API
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Implement GET /api/student/dashboard/quiz-history
CONTEXT:
- Returns: [{ quiz_id, quiz_title, score_percent, completed_at, attempt_count }]
- Source: existing quiz attempts table (reuse Phase 2 structure)
- Limit to last 90 days by default
- Sort by completed_at DESC
SKILLS: backend-architect
```

#### 5.3 Homework Summary API
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Implement GET /api/student/dashboard/homework-summary
CONTEXT:
- Returns: { pending: count, completed: count, overdue: count }
- Source: assignments table joined with student_assignments
- Use existing Phase 2 assignment schema
SKILLS: backend-architect
```

#### 5.4 Session History API
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Implement GET /api/student/dashboard/session-history
CONTEXT:
- Returns: [{ session_id, title, joined_at, left_at, duration_minutes }]
- Source: live_sessions + session_participants
- Use existing Phase 2 session schema
- Duration calculated from joined_at to left_at
SKILLS: backend-architect
```

#### 5.5 Dashboard UI Page
**Agent**: `frontend-developer`
```
INVOKE /agency frontend-developer
TASK: Build student dashboard page
CONTEXT:
- Location: student/app/student/dashboard/page.tsx
- Layout: 4 summary tiles (used, remaining, pending, completed)
- Below: quiz score chart (use existing chart pattern), session history list
- Pull data from all 4 dashboard APIs
- Real-time counter refresh after question asked
- Use existing student app UI system (globals.css, component patterns)
SKILLS: frontend-design
MCP: pencil (for dashboard layout mockup)
```

#### 5.6 Plan Badge in Header
**Agent**: `frontend-developer`
```
INVOKE /agency frontend-developer
TASK: Add plan badge to student app header
CONTEXT:
- Location: student/app/(shared)/header.tsx or layout
- Show: current plan name + icon (Basic/Image/Video)
- Click opens plan management / upgrade page
SKILLS: frontend-design
```

#### 5.7 Tests — Subphase 5
**Agent**: `tester`
```
INVOKE /agency test-agent
TASKS:
1. Unit test: usage API returns correct quota values
2. Unit test: quiz history returns sorted results
3. Unit test: homework summary counts are accurate
4. Integration test: dashboard page loads with all 4 API calls
5. E2E test: student views dashboard, sees accurate pending/completed counts
6. E2E test: quota counter updates after asking a question
LOCATION: student/app/api/student/dashboard/*.test.ts (create)
TOOLS: vitest, playwright
```

---

## Subphase 6: Monthly Reset Scheduler + Hardening
**Duration**: 3-4 days

### Tasks

#### 6.1 Reset Job Enhancement
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Enhance monthly reset with retry logic and alerting
CONTEXT:
- Add: max_retries=3, backoff
- Add: alerting webhook on failure (Slack/email)
- Add: dry_run mode for testing
- Log: each student reset attempt with success/failure
- Idempotent: safe to re-run
SKILLS: backend-architect
```

#### 6.2 Reconciliation Script
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Create reconciliation script to detect quota drift
CONTEXT:
- Script: scripts/reconcile-quota.ts
- Compare: sum(question_events.quota_delta) vs quota_periods.used_count
- Report: discrepancies > 1% threshold
- Fix: auto-correct if drift < 5%, flag for manual review if > 5%
- Run: daily as cron job
SKILLS: backend-architect, devops-automator
```

#### 6.3 Runbook Documentation
**Agent**: `technical-writer` (or manual)
```
INVOKE /agency technical-writer
TASK: Create runbook for Phase 3 operations
CONTEXT:
- Location: docs/phase3-runbook.md
- Contents:
  - How to run monthly reset manually
  - How to check quota drift report
  - How to investigate stuck quota states
  - Cache invalidation procedure
  - Emergency: disable quota enforcement (feature flag)
SKILLS: documentation-engineer
```

#### 6.4 Smoke Tests
**Agent**: `tester`
```
INVOKE /agency test-agent
TASK: Create smoke tests for Phase 3 critical paths
CONTEXT:
- Location: e2e/phase3-smoke.spec.ts
- Tests:
  1. New student can select plan during signup
  2. Basic student is blocked on 21st question
  3. Cache hit serves content without LLM call
  4. Dashboard shows correct usage data
  5. Classroom student cannot access B2C routes
SKILLS: playwright
TOOLS: playwright
```

#### 6.5 Feature Flag for Emergency Disable
**Agent**: `backend-architect`
```
INVOKE /agency backend-architect
TASK: Add QUOTA_ENFORCEMENT_ENABLED feature flag
CONTEXT:
- Location: config/flags.ts or environment variable
- When disabled: all quota checks pass, no decrement
- For emergency use only — log when disabled
- Admin endpoint to toggle: POST /api/internal/flags/quota-enforcement
SKILLS: backend-architect
```

---

## Subphase 7: Integration + Release Readiness
**Duration**: 3-4 days

### Tasks

#### 7.1 Full Regression Suite
**Agent**: `tester`
```
INVOKE /agency test-agent
TASK: Run full regression for Phase 3 scope
CONTEXT:
- All tests from subphases 1-6 must pass
- Add integration tests for cross-boundary flows:
  - Signup → plan select → first question → dashboard shows usage
  - Classroom mode cannot accidentally access B2C
  - Cache invalidation followed by regeneration
- Coverage target: > 80% line coverage on new code
LOCATION: teacher/lib/server/phase3-integration.test.ts
```

#### 7.2 Permission Boundary Tests
**Agent**: `security-engineer`
```
INVOKE /agency security-engineer
TASK: Security audit of Phase 3 permission model
CONTEXT:
- Verify: classroom student cannot prompt under any circumstance
- Verify: quota cannot be bypassed via direct API calls
- Verify: cache cannot be poisoned by cross-student access
- Verify: plan selection cannot be changed without auth
- Report: any gaps found
SKILLS: security-engineer
```

#### 7.3 Performance Benchmarking
**Agent**: `performance-benchmarker`
```
INVOKE /agency performance-benchmarker
TASK: Benchmark Phase 3 critical endpoints
CONTEXT:
- Endpoints to benchmark:
  - GET /api/student/quota/status (target: < 50ms p95)
  - POST /api/student/quota/check-and-reserve (target: < 120ms p95)
  - GET /api/student/dashboard/usage (target: < 500ms p95)
  - POST /api/internal/cache/resolve (target: < 30ms p95)
- Load test: 100 concurrent students
- Report: p50, p95, p99 latencies
SKILLS: performance-benchmarker
```

#### 7.4 Phase 3 Release Checklist
**Agent**: `project-shepherd`
```
INVOKE /agency project-shepherd
TASK: Complete release checklist
CONTEXT:
CHECKLIST:
[ ] All 7 subphases complete
[ ] All tests passing
[ ] Permission security audit passed
[ ] Performance benchmarks within SLA
[ ] Cache hit ratio target (60%+) achievable
[ ] Monthly reset job tested in staging
[ ] Runbook reviewed by ops
[ ] Rollback plan documented
[ ] Feature flags configured for production
```

#### 7.5 Handoff to Phase 4
**Agent**: `project-shepherd`
```
INVOKE /agency project-shepherd
TASK: Prepare Phase 3 → Phase 4 handoff package
CONTEXT:
For Phase 4 (Payment + Referral):
- Data model ready: plans, subscriptions, quota_periods in place
- Student dashboard in place
- Cache layer ready for zero-token repeat delivery
- Remaining work: Razorpay integration, webhook handlers, referral tracking
```

---

## Agent Assignment Summary

| Task | Primary Agent | Backup | QA |
|------|--------------|--------|-----|
| DB Schema (Plans, Quota, Cache) | backend-architect | — | api-tester |
| Plan APIs | backend-architect | senior-developer | api-tester |
| Quota Middleware + Enforcement | backend-architect | security-engineer | api-tester |
| Route Separation + Guards | backend-architect | security-engineer | playwright |
| Cache Layer | backend-architect | — | api-tester |
| Dashboard APIs | backend-architect | — | api-tester |
| Frontend UI (Plan Selection) | frontend-developer | ui-designer | playwright |
| Frontend UI (Dashboard) | frontend-developer | ui-designer | playwright |
| Frontend UI (Quota Counter) | frontend-developer | — | playwright |
| Reset Job + Runbook | backend-architect | devops-automator | api-tester |
| Security Audit | security-engineer | — | — |
| Performance Benchmark | performance-benchmarker | — | — |
| Regression Suite | test-agent | — | evidence-collector |

---

## Skills to Invoke Per Task

| Skill | When Used |
|-------|-----------|
| `/agency backend-architect` | All backend API, DB schema, middleware tasks |
| `/agency frontend-developer` | All UI/component tasks |
| `/agency security-engineer` | Permission model, auth guard, security tests |
| `/agency test-agent` | Unit tests, integration tests |
| `/agency playwright` | E2E tests |
| `/agency performance-benchmarker` | Load testing, SLA validation |
| `/agency project-shepherd` | Release checklist, handoff |
| `frontend-design` skill | UI layouts, component specs |
| `tdd` skill | Write tests before code |
| `api-design` skill | API endpoint design review |

---

## MCP Servers

| MCP | Used For |
|-----|---------|
| `claude-peers` | Coordination with student workspace agents |
| `pencil` | Dashboard and plan selection UI mockups |
| `context7` | PRD context lookup during implementation |
| `github` | Committing code, creating PR after each subphase |

---

## Tools

| Tool | Purpose |
|------|---------|
| `vitest` | Unit and integration tests |
| `playwright` | E2E tests |
| `sqlite3` | Local dev database |
| `next dev` | Local dev server |
| `git` | Version control, branch per subphase |

---

## Testing Strategy

### Unit Tests
- Quota check/decrement logic
- Cache key generation
- Plan selection validation
- Mode guard logic

### Integration Tests
- Signup → plan selection → quota initialization
- Question path: allow/block/cache outcomes
- Monthly reset with retry
- Mode switch flows

### E2E Tests (Playwright)
```
1. Student signs up, selects Basic plan, asks 20 questions, blocked on 21st
2. Student signs up, selects Image plan, asks 100 questions, blocked on 101st
3. Student signs up, selects Video plan, asks unlimited questions
4. Classroom student cannot access B2C generation routes
5. B2C student sees quota counter, updates after each question
6. Repeat slide view: first view = cache miss, second view = cache hit
7. Dashboard shows correct usage, pending homework, quiz history
```

### Performance Tests
- Quota check p95 < 120ms
- Dashboard load p95 < 500ms
- Cache resolve p95 < 30ms

---

## Branch Strategy

```
main (clean)
└── phase-3-subphase-1 (3-4 days, PR to main)
    └── phase-3-subphase-2 (5-6 days, PR to main)
        └── phase-3-subphase-3 (4-5 days, PR to main)
            └── phase-3-subphase-4 (5-6 days, PR to main)
                └── phase-3-subphase-5 (4-5 days, PR to main)
                    └── phase-3-subphase-6 (3-4 days, PR to main)
                        └── phase-3-subphase-7 (3-4 days, PR to main)
```

Each subphase: branch → implement → test → PR → merge → next subphase

---

## Implementation Order

1. **Subphase 1** first (all others depend on plan/subscription existing)
2. **Subphase 2** next (quota is core to monetization)
3. **Subphase 3** before any B2C generation (guardrails before capability)
4. **Subphase 4** alongside Subphase 3 (cache is transparent to mode)
5. **Subphase 5** after Subphase 1+2 complete (dashboard needs quota data)
6. **Subphase 6** runs in background — can start after Subphase 2
7. **Subphase 7** final gate — everything must pass

---

## Risks

| Risk | Mitigation |
|------|------------|
| Quota race conditions under concurrent requests | Atomic transactions + request_hash idempotency |
| Stale cache serving outdated content | Versioned cache keys + explicit invalidation |
| Mode misclassification | Explicit actor.mode field + mandatory server validation |
| Dashboard counter drift | Single source of truth + daily reconciliation |

---

## Success Metrics

1. 100% of question requests pass quota check before LLM call
2. Cache hit ratio > 60% for repeated content after 2 weeks
3. Dashboard data freshness < 500ms
4. Monthly reset job success rate > 99.9%
5. Zero unauthorized prompting events from classroom mode

---

## Detailed Agent Prompts

### PROMPT 1: Subphase 0.1 — Landing Page with Role Selection

```
You are a frontend developer. Implement the landing page for Aidutech.

PROJECT: Aidutech — a EdTech platform with 3 user paths:
- Teacher: creates lessons, assigns to students
- Student (Classroom): joins via invite code, views assigned content
- Individual: self-serve B2C, pays for plan, gets quota

YOUR TASK: Create the main landing page at /app/page.tsx

REQUIREMENTS:
1. Full-screen landing page with 3 large cards/buttons:
   - "I'm a Teacher" → navigates to /login/teacher
   - "I'm a Student" → navigates to /login/student  
   - "I'm Individual" → navigates to /login/individual
2. Each card: icon + title + one-line description
3. Professional, clean design — use existing UI patterns from teacher/student apps
4. Use Tailwind CSS (already configured in project)
5. Mobile responsive

EXISTING PATTERNS TO FOLLOW:
- Look at teacher/app/globals.css for color scheme
- Use existing Button component from @/components/ui/button
- Use lucide-react for icons (already installed)

FILES TO CREATE:
- app/page.tsx (landing page component)

SKILLS TO USE: /agency frontend-developer
MCP: pencil (optional — use for layout mockup first)
TOOLS: next dev (test locally), TypeScript, Tailwind

Do NOT:
- Add authentication logic (that's in 0.2)
- Add backend routes
- Modify existing teacher/student/core apps
```

---

### PROMPT 2: Subphase 0.2 — Role-Based Login Pages

```
You are a frontend developer. Implement login pages for Aidutech's 3 user paths.

PROJECT: Aidutech — 3 paths: Teacher, Student (Classroom), Individual (B2C)

YOUR TASK: Create 3 login pages with BYPASS LOGIN (no password, no Redis)

REQUIREMENTS:
1. Create 3 files:
   - app/login/teacher/page.tsx
   - app/login/student/page.tsx
   - app/login/individual/page.tsx

2. Each page:
   - Simple form: name/phone input + "Continue" button
   - On submit: store role in localStorage/sessionStorage + redirect:
     - Teacher → /teacher/dashboard
     - Student → /student/dashboard
     - Individual → /core (the OpenMAIC app)
   - No real authentication — just role selection + simple identifier

3. Design: consistent across 3 pages, clean, professional
   - Use same layout structure for all 3
   - Show which role on the page ("Continue as Teacher")
   - Back link to landing page

EXISTING PATTERNS:
- Use Button from @/components/ui/button
- Use lucide-react icons
- Tailwind CSS already configured

SKILLS: /agency frontend-developer
TOOLS: next dev, TypeScript, Tailwind
```

---

### PROMPT 3: Subphase 0.3 — Route Guards for Role Enforcement

```
You are a backend architect. Add route guards to enforce role-based access.

PROJECT: Aidutech — roles: teacher, student, individual

YOUR TASK: Create middleware that prevents users from accessing paths outside their role.

REQUIREMENTS:
1. Create middleware files:
   - lib/middleware/teacher-routes.ts
   - lib/middleware/student-routes.ts
   - lib/middleware/individual-routes.ts

2. Each middleware:
   - Check session/localStorage for role
   - /teacher/* routes: only allow role === 'teacher'
   - /student/* routes: only allow role === 'student'
   - /core/* routes: only allow role === 'individual'
   - On unauthorized: redirect to / (landing page)

3. Apply to next.config.ts or in each app's middleware.ts

4. Log unauthorized access attempts

SKILLS: /agency backend-architect, /agency security-engineer
TOOLS: TypeScript, Next.js middleware
```

---

### PROMPT 4: Subphase 1.1 — Database Schema: Plans + Subscriptions

```
You are a backend architect. Create SQL migrations for Phase 3 plan tables.

PROJECT: Aidutech — student quota and plan tiers system

YOUR TASK: Create database schema for plans and subscriptions

REQUIREMENTS:
1. Create file: shared/lib/db/phase3-schema.sql

2. Tables to create:

CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- 'basic', 'image', 'video'
  name TEXT NOT NULL,
  monthly_question_limit INTEGER, -- NULL = unlimited
  price_inr INTEGER NOT NULL,
  feature_flags TEXT DEFAULT '{}', -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE student_plan_subscriptions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'superseded'
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_subscriptions_student ON student_plan_subscriptions(student_id);
CREATE INDEX idx_subscriptions_plan ON student_plan_subscriptions(plan_id);

3. Seed data — INSERT INTO plans VALUES:
   - ('basic', 'Basic', 1000, 20, '{}')
   - ('image', 'Image', 2000, 100, '{}')
   - ('video', 'Video', 3000, NULL, '{}') -- NULL = unlimited

4. Follow existing schema pattern from teacher/lib/db/phase2-schema.sql

5. After SQL, create TypeScript types in shared/types/plan.ts:
   - Plan, PlanSubscription interfaces

SKILLS: /agency backend-architect
TOOLS: sqlite3 CLI, TypeScript
LOCATION: shared/lib/db/
```

---

### PROMPT 5: Subphase 2.2 — Quota Status API

```
You are a backend architect. Implement quota status endpoint.

PROJECT: Aidutech — quota system for Individual (B2C) students

YOUR TASK: Create GET /api/student/quota/status

ROUTE: student/app/api/student/quota/status/route.ts

BEHAVIOR:
1. Get student_id from session
2. Get student's active plan (join student_plan_subscriptions + plans)
3. Get current period_key = 'YYYY-MM'
4. Find or create quota_periods record for this student + period
5. Return:
   {
     used_count: number,
     remaining_count: number | null, -- null if unlimited
     monthly_limit: number | null,
     resets_at: string (first day next month),
     plan_name: string
   }

IF no quota_period exists: create with monthly_limit from plan

ERROR CASES:
- No active subscription: return 400 { error: "no_active_plan" }

SKILLS: /agency backend-architect
PATTERNS: Follow existing API route pattern in student/app/api/
```

---

### PROMPT 6: Subphase 2.3 — Check-and-Reserve API (Atomic Quota)

```
You are a backend architect. Implement atomic quota check-and-reserve.

PROJECT: Aidutech — prevent quota exhaustion race conditions

YOUR TASK: Create POST /api/student/quota/check-and-reserve

ROUTE: student/app/api/student/quota/check-and-reserve/route.ts

THIS IS CRITICAL — must be atomic and idempotent.

REQUEST BODY:
{
  request_hash: string, -- unique hash for idempotency
  endpoint: string       -- which endpoint is calling
}

BEHAVIOR:
1. Get student_id + plan from session
2. Video plan (unlimited): return { allowed: true, remaining: null }
3. BEGIN TRANSACTION
4. Find quota_periods[student_id, current_month] with LOCK
5. Check remaining_count > 0
6. If no remaining: ROLLBACK, return { allowed: false, reason: "quota_exceeded" }
7. If request_hash already used in question_events: ROLLBACK (idempotent), return cached result
8. Increment used_count, decrement remaining_count
9. Insert question_events record with outcome='allowed', quota_delta=1
10. COMMIT
11. Return { allowed: true, remaining: new_remaining_count }

ERROR RESPONSE (quota exceeded):
{
  allowed: false,
  reason: "quota_exceeded",
  upgrade_url: "/upgrade"
}

SKILLS: /agency backend-architect
IMPORTANT: Use better-sqlite3 transactions. No race conditions.
LOCATION: student/app/api/student/quota/check-and-reserve/route.ts
```

---

### PROMPT 7: Subphase 3.3 — Mode Guard Middleware

```
You are a security engineer. Create middleware to enforce B2C vs Classroom separation.

PROJECT: Aidutech — Individual (B2C) vs Student (Classroom) must be separated

YOUR TASK: Create mode-guard middleware

FILE: student/lib/middleware/mode-guard.ts

BEHAVIOR:
1. For routes under /api/b2c/*:
   - If session.mode !== 'b2c': return 403 { error: "b2c_only" }
2. For routes under /api/classroom/*:
   - If session.mode !== 'classroom': return 403 { error: "classroom_only" }

RESPONSE on 403:
{
  error: "access_denied",
  message: "Upgrade to B2C to access this feature" // for classroom trying B2C
  message: "This feature is for classroom students only" // for B2C trying classroom
}

LOG: Log all 403 attempts with timestamp, student_id, attempted_path

SKILLS: /agency security-engineer
```

---

### PROMPT 8: Subphase 4.3 — Read-Through Cache Integration

```
You are a backend architect. Add cache layer to generation endpoints.

PROJECT: Aidutech — cache generated content to save LLM tokens

YOUR TASK: Wrap generation endpoints with read-through cache

CONTEXT:
- Generation endpoints: /api/b2c/chat, /api/generate-slides, /api/generate-quiz
- Cache key: SHA-256 of (content_hash + content_type + template_version)
- Cache entry: { payload, token_cost_input, token_cost_output, expires_at }

IMPLEMENT:

async function withCache<T>(
  cacheKey: string,
  contentType: 'slide' | 'quiz' | 'answer',
  generateFn: () => Promise<T>
): Promise<{ result: T; cached: boolean }> {
  // 1. Check cache
  const cached = await getFromCache(cacheKey, contentType);
  if (cached) {
    await logCacheHit(cacheKey);
    return { result: cached.payload, cached: true };
  }
  
  // 2. Cache miss — call LLM
  const result = await generateFn();
  
  // 3. Store in cache with TTL
  await storeInCache(cacheKey, contentType, result);
  
  // 4. Log question event with token cost
  await logQuestionEvent({ outcome: 'allowed', quota_delta: 1 });
  
  return { result, cached: false };
}

REQUIREMENTS:
- TTL: slides=30d, quiz=30d, answer=7d
- On cache hit: log outcome='cached', quota_delta=0
- On cache miss: log outcome='allowed', quota_delta=1

SKILLS: /agency backend-architect
FILES: shared/lib/cache.ts (create)
```

---

### PROMPT 9: Subphase 5.5 — Student Dashboard UI

```
You are a frontend developer. Build the student dashboard page.

PROJECT: Aidutech — Individual (B2C) student dashboard with usage stats

YOUR TASK: Create student dashboard page

FILE: student/app/student/dashboard/page.tsx

LAYOUT:
1. Header: "My Dashboard" + Plan badge (Basic/Image/Video)

2. 4 Summary Cards (row):
   - Questions Used: X / 20
   - Questions Remaining: Y
   - Pending Homework: Z
   - Completed: W

3. Quota Progress Bar:
   - Visual bar showing used/limit
   - Color: green (<50%), yellow (50-80%), red (>80%)

4. Below cards:
   - Quiz History: table with dates + scores
   - Session History: list with dates + duration

5. Real-time:
   - After asking a question, counter updates immediately
   - Use SWR or React Query for data fetching

APIS TO CALL:
- GET /api/student/quota/status
- GET /api/student/dashboard/quiz-history
- GET /api/student/dashboard/homework-summary
- GET /api/student/dashboard/session-history

STYLE: Match existing student app design (globals.css)
MOBILE: Stack cards vertically on mobile

SKILLS: /agency frontend-developer, /agency frontend-design
MCP: pencil (create dashboard mockup first)
```

---

### PROMPT 10: E2E — Quota Exhaustion Test

```typescript
// e2e/quota-exhaustion.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Quota Enforcement', () => {
  test('Basic plan: 20 questions allowed, 21st blocked', async ({ page }) => {
    // 1. Login as Individual with Basic plan
    await page.goto('/login/individual');
    await page.fill('[name="identifier"]', 'basic-test-user');
    await page.click('button[type="submit"]');
    
    // 2. Select Basic plan if not already selected
    await page.goto('/student/dashboard');
    
    // 3. Ask 20 questions
    for (let i = 0; i < 20; i++) {
      await page.goto('/core'); // OpenMAIC chat
      await page.fill('textarea', `Test question ${i + 1}`);
      await page.click('button[type="submit"]');
      await page.waitForResponse('**/quota/check-and-reserve');
    }
    
    // 4. 21st question should be blocked
    await page.goto('/core');
    await page.fill('textarea', 'Question 21');
    await page.click('button[type="submit"]');
    
    // 5. Should see upgrade prompt
    await expect(page.locator('text=Upgrade to continue')).toBeVisible();
    await expect(page.locator('text=20 questions left')).toBeVisible();
  });
});
```

---

### PROMPT 11: E2E — Classroom Cannot Access B2C

```typescript
// e2e/classroom-b2c-separation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('B2C/Classroom Separation', () => {
  test('Classroom student cannot access B2C generation', async ({ page }) => {
    // 1. Login as Student (classroom mode)
    await page.goto('/login/student');
    await page.fill('[name="identifier"]', 'classroom-student');
    await page.click('button[type="submit"]');
    
    // 2. Try to access OpenMAIC (B2C app)
    await page.goto('/core');
    
    // 3. Should be redirected to landing or see access denied
    await expect(page.url()).not.toContain('/core');
  });
  
  test('Individual (B2C) cannot access classroom assignments directly', async ({ page }) => {
    // 1. Login as Individual
    await page.goto('/login/individual');
    await page.fill('[name="identifier"]', 'b2c-user');
    await page.click('button[type="submit"]');
    
    // 2. Try to access /student/assignments
    await page.goto('/student/assignments');
    
    // 3. Should be redirected or see access denied
    await expect(page.url()).not.toContain('/student/assignments');
  });
});
```

---

### PROMPT 12: E2E — Cache Hit Saves Tokens

```typescript
// e2e/cache-token-savings.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Content Cache', () => {
  test('Repeat slide view returns cached content with 0 token cost', async ({ page }) => {
    // 1. Setup: Individual logs in, has content assigned
    await page.goto('/login/individual');
    await page.fill('[name="identifier"]', 'cache-test-user');
    await page.click('button[type="submit"]');
    
    // 2. First view — assigns slides, triggers generation
    await page.goto('/student/assignments/1');
    await page.click('text=View Slides');
    await page.waitForResponse('**/generate-slides');
    
    // 3. Check token usage logged
    const firstResponse = await page.evaluate(() => 
      fetch('/api/student/quota/status').then(r => r.json())
    );
    expect(firstResponse.used_count).toBeGreaterThan(0);
    
    // 4. Second student views SAME content — should be cached
    // (In real test: second browser with different student)
    // Here we test: revisiting same content = cache hit
    
    // 5. Revisit content
    await page.reload();
    await page.click('text=View Slides');
    
    // 6. Token count should NOT increase
    const secondResponse = await page.evaluate(() =>
      fetch('/api/student/quota/status').then(r => r.json())
    );
    expect(secondResponse.used_count).toBe(firstResponse.used_count);
  });
});
```

---

*Agent prompts created: 2026-04-27*
*These prompts are self-contained and can be executed by respective agents independently*
