# Aidutech / AIDU
# Phase 1 Remaining Work PRD + Design Doc

## 1. Document Control

- Owner: Product + Engineering
- Prepared by: GitHub Copilot
- Date: 2026-04-26
- Status: Draft for implementation
- Primary reference: roadmap.md Phase 1 items 1.2, 1.3, 1.4, remaining 1.1 logging item, and 1.5 rule enforcement

## 2. Executive Summary

Phase 1 must deliver a teacher-led classroom product where:

- Teachers are the only users who can prompt/generate classroom content.
- Students are read-only participants who can join, watch, listen, submit responses, and ask questions.
- Multiple students can join the same live lesson session.
- Teachers can observe progress and peer completion status.
- Token usage and request events are persisted with actor role in SQLite for reporting.

This PRD defines the remaining Phase 1 work, aligned to the current codebase and constrained by the repository rule:

- Core must remain untouched.
- New teacher and student products must be built in separate folders by copying/adapting code as needed.

## 3. Current Codebase Baseline (What Exists Today)

### 3.1 Existing strengths that can be reused

1. Classroom generation and retrieval APIs already exist in core.
- core/app/api/generate-classroom/route.ts
- core/app/api/generate-classroom/[jobId]/route.ts
- core/app/api/classroom/route.ts

2. Classroom generation pipeline is production-grade and supports outlines, scenes, media, and TTS.
- core/lib/server/classroom-generation.ts
- core/lib/server/classroom-job-runner.ts
- core/lib/server/classroom-job-store.ts

3. Multi-agent classroom model already supports teacher/assistant/student agent roles.
- core/lib/orchestration/registry/store.ts
- core/app/api/generate/agent-profiles/route.ts

4. Existing persistence paths are available and stable.
- Browser-side IndexedDB (Dexie): core/lib/utils/database.ts
- Browser stage/session storage: core/lib/utils/stage-storage.ts
- Server JSON file persistence for classroom jobs: core/lib/server/classroom-storage.ts

5. Existing logging abstraction is available.
- core/lib/logger.ts

### 3.2 Gaps vs Phase 1 requirements

1. No phone signup/login implementation.
2. No teacher/student identity system with role-based authorization.
3. No class roster model (teacher classes, memberships, enrollments).
4. No invite/class-code join flow.
5. No teacher panel for class creation and student import.
6. No student read-only mode enforcement (prompt controls are currently general-purpose).
7. No persisted token usage ledger by actor role in SQLite.
8. No teacher-facing token dashboard for day/week totals.
9. No enforcement mechanism for "no direct edits to core" beyond convention.

## 4. Product Goals for Remaining Phase 1

1. Deliver Teacher Panel Foundation (role-aware auth, class creation, student enrollment, publish session).
2. Deliver Classroom Student App (join, view, ask question, read-only no prompt).
3. Deliver Token Counter MVP backed by SQLite with actor-role dimensions.
4. Lock repository workflow so core stays unchanged during teacher/student implementation.

## 5. Non-Goals (Phase 1)

1. Billing, referrals, and plan monetization features.
2. Advanced assignment scheduling and content library reuse workflows.
3. Full analytics suite and enterprise multi-tenant controls.
4. Parent dashboard and school admin panel.
5. Any changes inside core folder (except emergency bugfix approved separately).

## 6. Users and Permission Model

### 6.1 Roles

1. teacher
- Can prompt/generate content in classroom product.
- Can create classes and enroll students.
- Can publish classroom sessions and monitor progress.

2. student_classroom
- Cannot prompt or generate.
- Can join assigned class/session.
- Can view content, listen, answer activities, and ask questions.
- Can view peer completion status if enabled by teacher policy.

3. student_b2c
- Out of scope for Phase 1 implementation changes.
- Existing behavior remains in core product.

### 6.2 Permission matrix

- Prompt generation: teacher only
- Join session: teacher and enrolled students
- View classroom content: enrolled students and teacher
- Ask questions: enrolled students and teacher
- Publish lesson/session: teacher only
- View class progress grid: teacher only

## 7. Scope Breakdown (Roadmap Mapping)

### 7.1 Remaining 1.1 item

- Logging event records must include actor role and actor ID context for all LLM requests.

### 7.2 1.2 Classroom Student App (Read-Only)

- Phone signup/login
- Join by invite code/class code
- Join multi-student live session
- View assigned notebook/slides/media
- Ask in-session questions
- View own Q and A and class announcements
- View teacher-enabled peer completion status
- Session hard-stop at 15 minutes (Phase 1 policy)

### 7.3 1.3 Teacher Panel Foundation

- Teacher signup/login
- Create class
- Add students by phone or CSV
- View class list and student counts
- Prompt/generation controls only for teacher
- Publish generated lesson output to live session

### 7.4 1.4 Token Counter MVP

- Persist every LLM request with actor role
- Daily and weekly totals dashboard
- Tracking only, no limits
- SQLite storage

### 7.5 1.5 Rule Enforcement

- Enforce no direct edits under core for teacher/student development path

## 8. Target Architecture for Phase 1

## 8.1 Repository and app boundaries

Top-level structure (already created):

- core
- teacher
- student
- roadmap.md

Execution rule:

1. core is baseline source and remains untouched.
2. teacher and student apps are implemented with copy-on-write from core.
3. If a core module is needed, copy it into teacher or student and adapt there.

## 8.2 Runtime architecture

1. teacher app
- Primary surface for teacher auth, class management, generation, session publish, and dashboards.
- Contains API routes for auth/class/session/progress/token reporting.

2. student app
- Primary surface for student auth, join flow, read-only classroom playback, question submission.

3. shared classroom content
- Teacher app persists generated classroom payload references.
- Student app resolves assigned sessions and fetches immutable classroom data for playback.

## 8.3 Data architecture (SQLite in teacher app first)

Use SQLite as source of truth for identity, class, session, progress, and usage logs.

### Proposed schema

1. users
- id (pk)
- role (teacher | student_classroom)
- phone_e164 (unique)
- name
- status
- created_at
- updated_at

2. auth_sessions
- id (pk)
- user_id (fk users.id)
- issued_at
- expires_at
- user_agent
- ip_hash

3. classes
- id (pk)
- teacher_id (fk users.id)
- name
- subject
- batch
- join_code (unique)
- peer_visibility_enabled (bool)
- created_at
- updated_at

4. class_memberships
- id (pk)
- class_id (fk classes.id)
- student_id (fk users.id)
- enrolled_at
- source (manual | csv)

5. classroom_sessions
- id (pk)
- class_id (fk classes.id)
- teacher_id (fk users.id)
- title
- core_classroom_id (reference to generated classroom content id)
- status (draft | live | ended)
- started_at
- ended_at
- max_duration_minutes default 15

6. session_participants
- id (pk)
- session_id (fk classroom_sessions.id)
- user_id (fk users.id)
- joined_at
- left_at
- completion_state (pending | completed)

7. question_messages
- id (pk)
- session_id (fk classroom_sessions.id)
- student_id (fk users.id)
- question_text
- answer_text
- created_at
- answered_at

8. llm_usage_events
- id (pk)
- timestamp
- actor_user_id
- actor_role (teacher | student_classroom | student_b2c)
- provider
- model
- endpoint
- input_tokens
- output_tokens
- cached_tokens
- reasoning_tokens
- cost_usd
- request_id

## 8.4 API surface (Phase 1)

### Auth

- POST /api/auth/request-otp
- POST /api/auth/verify-otp
- POST /api/auth/logout
- GET /api/auth/me

### Teacher class management

- POST /api/teacher/classes
- GET /api/teacher/classes
- POST /api/teacher/classes/:classId/students
- POST /api/teacher/classes/:classId/students/import-csv
- GET /api/teacher/classes/:classId

### Teacher session management

- POST /api/teacher/classes/:classId/sessions
- POST /api/teacher/sessions/:sessionId/start
- POST /api/teacher/sessions/:sessionId/end
- GET /api/teacher/sessions/:sessionId/progress

### Student classroom

- POST /api/student/join-class
- GET /api/student/classes
- GET /api/student/sessions/:sessionId
- POST /api/student/sessions/:sessionId/questions
- POST /api/student/sessions/:sessionId/completion

### Token dashboard

- GET /api/teacher/usage/daily
- GET /api/teacher/usage/weekly

## 8.5 Read-only enforcement strategy for students

1. Student app UI does not render prompt-input controls.
2. Student endpoints reject any generation/action requests not in allowlist.
3. Middleware and route guards enforce role-based access server-side.
4. Teacher-only generation APIs validate actor role before model calls.

## 8.6 Core-protection enforcement

1. Add a CI check script to fail if Phase 1 PRs modify core/* (except allowlisted infra files if needed).
2. Add CONTRIBUTING note for copy-on-write policy.
3. Add git pre-commit hook template to warn on core changes.

## 9. Detailed Functional Requirements

### FR-1 Teacher auth and onboarding

- System supports phone login for teacher accounts.
- Teacher role is persisted and enforced by session middleware.
- Acceptance:
  1. Teacher can log in using phone OTP.
  2. Unauthorized user cannot access teacher routes.

### FR-2 Student auth and class join

- System supports phone login for classroom students.
- Student joins class via class code and membership is created.
- Acceptance:
  1. Valid class code enrolls student.
  2. Invalid class code returns clear error.

### FR-3 Teacher class management

- Teacher can create class with name, subject, and batch.
- Teacher can add students manually and via CSV upload.
- Acceptance:
  1. Class list shows correct student counts.
  2. CSV import reports row-level errors and successes.

### FR-4 Live classroom session

- Teacher can publish/start one session per class.
- Multiple students can join same session concurrently.
- Session auto-ends at 15 minutes unless ended earlier by teacher.
- Acceptance:
  1. 10+ students can join same session in test environment.
  2. Ended session denies new joins.

### FR-5 Student read-only participation

- Student can view lesson content and ask questions only.
- Student cannot prompt content generation.
- Acceptance:
  1. Prompt controls absent in student UI.
  2. Generation API calls from student token return 403.

### FR-6 Progress and peer completion

- Student completion events are tracked per session.
- Teacher progress view shows per-student state.
- Students see peer completion when policy enabled.
- Acceptance:
  1. Teacher progress page updates within 5 seconds of new completion event.
  2. Peer completion hidden when class policy disabled.

### FR-7 Token usage ledger

- Every LLM call persists an event row with actor role.
- Daily and weekly teacher dashboard aggregates usage.
- Acceptance:
  1. Usage event is written for each successful and failed model request.
  2. Dashboard totals match database aggregates.

## 10. Non-Functional Requirements

1. Security
- OTP verification with attempt throttling.
- Server-side role checks on all sensitive routes.
- No API keys or secrets returned to clients.

2. Performance
- Session join p95 < 400 ms.
- Progress update propagation < 5 seconds.
- Token dashboard query p95 < 250 ms for a 30-day window.

3. Reliability
- Classroom sessions and usage logs are persisted durably in SQLite.
- API errors return consistent structured format.

4. Observability
- Request logs include request_id, actor_role, route, status, latency.
- LLM errors include provider/model and actor_role tags.

## 11. Implementation Subphases (Solo Developer Plan)

These subphases are sized for one developer executing sequentially without parallel staffing.

### Subphase 1: Foundation and guardrails

Objective
- Bootstrap teacher and student app scaffolds and enforce core-protection workflow.

Deliverables
- Teacher app skeleton
- Student app skeleton
- Shared coding standards docs
- CI guard to block core edits for Phase 1 streams

Estimate
- 3 to 4 days

Definition of done
- Both apps run locally
- Core-protection CI check active

### Subphase 2: Identity and RBAC

Objective
- Implement phone OTP auth, sessions, and role middleware.

Deliverables
- OTP request/verify flows
- Auth session table and middleware
- Role-protected route groups

Estimate
- 5 to 6 days

Definition of done
- Teacher and student can log in
- Unauthorized route access blocked

### Subphase 3: Teacher class and roster management

Objective
- Deliver class CRUD and student enrollment (manual + CSV).

Deliverables
- Class creation UI + APIs
- Student add flow
- CSV import pipeline with validation report
- Class list and counts

Estimate
- 6 to 7 days

Definition of done
- Teacher can create/manage classes and student roster from UI

### Subphase 4: Session publish and student join/read-only viewer

Objective
- Teacher starts a classroom session from generated content; students join and consume read-only.

Deliverables
- Session lifecycle APIs
- Student class code join
- Session viewer with no prompt controls
- 15-minute timeout policy

Estimate
- 7 to 8 days

Definition of done
- Multi-student join works and student prompt attempts are rejected

### Subphase 5: Questions, completion, and progress surfaces

Objective
- Enable student question channel and completion telemetry with teacher and peer views.

Deliverables
- Student question submission flow
- Completion event API
- Teacher progress page
- Student peer completion view behind policy toggle

Estimate
- 5 to 6 days

Definition of done
- Teacher sees live completion state and student questions in session context

### Subphase 6: Token ledger and usage dashboard

Objective
- Persist LLM usage by actor role and expose daily/weekly dashboards.

Deliverables
- llm_usage_events write path integrated into model call pipeline
- Daily and weekly aggregate APIs
- Teacher usage dashboard

Estimate
- 4 to 5 days

Definition of done
- Every model call writes usage row and dashboard totals are validated

### Subphase 7: Stabilization and release readiness

Objective
- Hardening, testing, and launch criteria closure.

Deliverables
- E2E happy-path suite
- Security and rate-limit checks
- Rollback and runbook docs

Estimate
- 3 to 4 days

Definition of done
- All acceptance tests pass and release checklist is complete

## 12. Testing Strategy

1. Unit tests
- Auth validators, role guards, CSV parser, usage aggregation, completion reducers.

2. Integration tests
- Auth to class join flow.
- Teacher create class to start session.
- LLM call to usage event persistence.

3. E2E tests
- Teacher login -> class create -> roster import -> session start.
- Student login -> class join -> session consume -> ask question -> mark complete.
- Student prompt attempt blocked.

4. Data validation tests
- Daily/weekly usage aggregates match raw llm_usage_events rows.

## 13. Risks and Mitigations

1. Risk: core copy divergence over time
- Mitigation: copy-on-write inventory and periodic sync checklist.

2. Risk: OTP provider delays
- Mitigation: local dev mock OTP provider with deterministic test codes.

3. Risk: session scale or race conditions
- Mitigation: transactional writes for session_participants and idempotent join endpoints.

4. Risk: incomplete usage accounting from streamed responses
- Mitigation: enforce single usage logging contract in one shared server hook around LLM invocation.

## 14. Release Gates

1. All Phase 1 acceptance criteria pass.
2. Role bypass attempts blocked in automated security tests.
3. Token dashboard numbers validated against DB snapshots.
4. Core-protection guard enabled in CI and documented.

## 15. Out of Scope Carry-Forward to Phase 2

1. Assignment engine and scheduled release mechanics.
2. Full quiz builder and detailed grading workflows.
3. Extended content library and curriculum tagging.

## 16. Immediate Next Actions

1. Approve this PRD as implementation baseline.
2. Start Subphase 1 in teacher and student folders.
3. Create implementation issues mapped one-to-one with Subphases 1-7.
