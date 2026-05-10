# Aidutech / OpenMAIC
# Phase 2 PRD - Teacher Panel v1

## 1. Document Control

- Owner: Product + Engineering
- Prepared by: GitHub Copilot
- Date: 2026-04-26
- Status: Draft for implementation
- Scope source: roadmap.md, Phase 2 sections 2.1 through 2.6
- Dependency: Phase 1 baseline (teacher and student app split, role auth, class and membership model, read-only classroom student mode)

## 2. Executive Summary

Phase 2 delivers the first complete teacher workflow loop:

1. Generate or import lesson content.
2. Convert lesson to assignable slides and quizzes.
3. Assign work to class or individual students.
4. Run live collaborative classroom sessions.
5. Track student completion and outcomes in teacher dashboards.
6. Schedule release and manage reusable content library.

This phase transforms the platform from a generation-first tool to a teacher operations product.

## 3. Phase 2 Scope (Roadmap Mapping)

## 3.1 In Scope

1. Assignment Engine (2.1)
- Teacher uploads PDF and triggers generation pipeline.
- Teacher selects slides and quizzes and assigns to class or individual students.
- Assignment appears in student dashboard.
- Student access is restricted to assigned content only.

2. Quiz Builder (2.2)
- Auto-generate quiz from assigned slides.
- Teacher can manually author MCQ and short-answer questions.
- Teacher can define answer keys and marks.
- Quiz artifacts are saved into content library.

3. Progress Tracker - Teacher View (2.3)
- Per-student view and completion state.
- Quiz completion and score percent.
- Session time spent.
- Class overview grid.
- CSV export.

4. Collaborative Classroom Session (2.4)
- Teacher starts live class from assigned content.
- Many students join one shared session.
- Shared teacher-controlled lesson state.
- Student question channel remains enabled.
- Students remain non-prompting in classroom mode.
- Teacher can monitor in-session and post-session completion.

5. Lesson Scheduler (2.5)
- Release date and time.
- Auto-unlock on schedule.
- Edit schedule before release.
- Delete draft assignment before release.

6. Content Library (2.6)
- Store teacher-generated slides and quizzes.
- Reuse assets across classes.
- Tag assets by subject.

## 3.2 Out of Scope

1. Plan tiers, quotas, and billing mechanics.
2. Referral and school admin economics.
3. Parent portal features.
4. Advanced weakness analytics from later phases.
5. B2C student workflow expansion.

## 4. Current Baseline and Reuse Opportunities

## 4.1 Existing reusable capabilities from core

1. Classroom generation job flow and retrieval.
- core/app/api/generate-classroom/route.ts
- core/app/api/generate-classroom/[jobId]/route.ts
- core/lib/server/classroom-generation.ts
- core/lib/server/classroom-job-store.ts

2. Classroom fetch and stage hydration.
- core/app/api/classroom/route.ts
- core/app/classroom/[id]/page.tsx

3. Quiz rendering and grading capabilities.
- core/components/scene-renderers/quiz-view.tsx
- core/app/api/quiz-grade/route.ts
- core/lib/quiz/grading.ts
- core/lib/quiz/persistence.ts

4. Export and import foundations useful for content library packaging.
- core/lib/export/classroom-zip-types.ts
- core/lib/export/classroom-zip-utils.ts
- core/lib/import/use-import-classroom.ts

5. Existing completion summary utility.
- core/lib/classroom/complete-summary.ts

## 4.2 Confirmed gaps to close in Phase 2

1. No assignment domain model in current code.
2. No per-class assignment visibility and access policy enforcement.
3. No teacher-facing quiz authoring CRUD API for assignment artifacts.
4. No teacher progress dashboard with class grid and CSV export.
5. No scheduler and release-unlock execution engine for assignments.
6. No content library taxonomy and reusability layer bound to teacher ownership.

## 5. Product Objectives and Success Criteria

## 5.1 Objectives

1. Provide an end-to-end teacher workflow from generation to evaluation.
2. Reduce teacher setup effort with reusable content and quiz auto-generation.
3. Improve classroom control and visibility during live sessions.
4. Establish assignment and progress data model needed for later analytics phases.

## 5.2 Success metrics

1. Assignment creation median time under 5 minutes for generated content path.
2. 90 percent of teacher-created assignments visible in student dashboard within 2 seconds.
3. Live session join success above 99 percent in test environment.
4. Progress records available in teacher grid within 5 seconds after student action.
5. CSV export generation under 3 seconds for classes up to 200 students.

## 6. Users and Permissions

## 6.1 Roles

1. teacher
- Create and schedule assignments.
- Create and edit quizzes.
- Start and control live sessions.
- View and export progress.
- Manage content library entries they own.

2. student_classroom
- View only assigned content.
- Join assigned live sessions.
- Answer quizzes and submit short answers.
- Ask questions.
- Cannot generate or prompt classroom content.

## 6.2 Access policy

1. Content is visible to students only via assignment recipient mapping.
2. Class-level assignment can be overridden by individual lock states.
3. Draft assignments are never visible to students.
4. Scheduled assignments become visible only after release timestamp.

## 7. Functional Requirements

## 7.1 FR-2.1 Assignment Engine

1. Teacher can create assignment from generated classroom content.
2. Teacher can select slides subset and quiz version to assign.
3. Teacher can target class-wide or selected students.
4. Student dashboard lists active assignments with status and due date.
5. Student cannot access unassigned materials by direct URL.

Acceptance criteria:

1. Assigning to class creates recipient records for all active class members.
2. Assigning to individual students limits visibility to those students.
3. Unauthorized student access returns forbidden or not found.

## 7.2 FR-2.2 Quiz Builder

1. Teacher can auto-generate a quiz from selected slides.
2. Teacher can add or edit MCQ and short-answer questions.
3. Teacher can set answer keys and points.
4. Quiz versions are saved and linked to assignments.

Acceptance criteria:

1. Quiz draft autosaves without data loss.
2. Published quiz version is immutable for active assignments.
3. Teacher can duplicate existing quiz into a new editable version.

## 7.3 FR-2.3 Progress Tracker

1. Teacher can view per-student progress and score metrics.
2. Teacher can filter by class, assignment, status, and date range.
3. Teacher can export current filtered table to CSV.

Acceptance criteria:

1. Grid columns include slides viewed, quiz completion, quiz score percent, and time spent.
2. CSV output matches filtered view rows and column definitions.

## 7.4 FR-2.4 Collaborative Classroom Session

1. Teacher can start live session from assignment content.
2. Session state is teacher-controlled and shared for all students.
3. Students can ask questions during live session.
4. Teacher can monitor join and completion indicators in real time.

Acceptance criteria:

1. At least 30 concurrent student joins are supported in staging.
2. Students do not get prompting controls in live classroom UI.
3. Session completion status persists after session ends.

## 7.5 FR-2.5 Lesson Scheduler

1. Teacher can schedule assignment release at date and time.
2. Assignment auto-unlocks at schedule time.
3. Teacher can edit schedule before release.
4. Teacher can delete draft before release.

Acceptance criteria:

1. Scheduler executes unlock within 60 seconds of target time.
2. Updating a future schedule replaces prior run trigger safely.

## 7.6 FR-2.6 Content Library

1. Teacher-generated slides and quizzes are saved as reusable assets.
2. Teacher can search and filter by subject tag and content type.
3. Teacher can reuse an asset into new assignments.

Acceptance criteria:

1. Reused content keeps provenance to source asset and version.
2. Asset ownership and access are isolated to teacher or school scope policy.

## 8. Data Model Design

This model assumes Phase 1 entities exist: users, classes, class_memberships, classroom_sessions.

## 8.1 New entities

1. content_assets
- id (pk)
- owner_teacher_id (fk users.id)
- type (slide_deck | quiz)
- title
- subject_tag
- source_kind (generated | manual | imported)
- source_ref
- created_at
- updated_at

2. content_asset_versions
- id (pk)
- asset_id (fk content_assets.id)
- version_number
- payload_json
- status (draft | published | archived)
- created_at

3. assignments
- id (pk)
- class_id (fk classes.id)
- teacher_id (fk users.id)
- title
- description
- slide_asset_version_id (nullable)
- quiz_asset_version_id (nullable)
- release_at (nullable)
- due_at (nullable)
- status (draft | scheduled | released | closed)
- created_at
- updated_at

4. assignment_recipients
- id (pk)
- assignment_id (fk assignments.id)
- student_id (fk users.id)
- visibility_status (hidden | visible)
- assigned_at

5. assignment_attempts
- id (pk)
- assignment_id (fk assignments.id)
- student_id (fk users.id)
- started_at
- submitted_at
- score_percent
- completion_state (not_started | in_progress | completed)

6. assignment_slide_progress
- id (pk)
- assignment_id
- student_id
- slide_id
- viewed_at

7. live_sessions
- id (pk)
- assignment_id (fk assignments.id)
- teacher_id
- state_snapshot_json
- status (live | ended)
- started_at
- ended_at

8. live_session_participants
- id (pk)
- live_session_id
- user_id
- joined_at
- left_at
- completion_state

9. scheduler_jobs
- id (pk)
- target_type (assignment_release)
- target_id
- run_at
- status (pending | running | completed | failed | canceled)
- retry_count
- last_error
- created_at
- updated_at

## 8.2 Data integrity rules

1. Released assignment must have at least one recipient.
2. Published quiz versions are immutable.
3. Assignment status transition guard:
- draft -> scheduled
- draft -> released
- scheduled -> released
- released -> closed
4. Only owner teacher can mutate assignment and assets.

## 9. API Design

## 9.1 Assignment APIs

- POST /api/teacher/assignments
- PATCH /api/teacher/assignments/:assignmentId
- GET /api/teacher/assignments
- GET /api/teacher/assignments/:assignmentId
- POST /api/teacher/assignments/:assignmentId/recipients
- POST /api/teacher/assignments/:assignmentId/release

## 9.2 Quiz Builder APIs

- POST /api/teacher/quizzes/generate-from-slides
- POST /api/teacher/quizzes
- PATCH /api/teacher/quizzes/:quizId
- POST /api/teacher/quizzes/:quizId/publish
- POST /api/teacher/quizzes/:quizId/duplicate

## 9.3 Progress APIs

- GET /api/teacher/progress/class/:classId
- GET /api/teacher/progress/assignment/:assignmentId
- GET /api/teacher/progress/export.csv

## 9.4 Live session APIs

- POST /api/teacher/live-sessions
- PATCH /api/teacher/live-sessions/:sessionId/state
- POST /api/teacher/live-sessions/:sessionId/end
- POST /api/student/live-sessions/:sessionId/join
- POST /api/student/live-sessions/:sessionId/questions
- POST /api/student/live-sessions/:sessionId/completion

## 9.5 Scheduler APIs

- POST /api/teacher/assignments/:assignmentId/schedule
- PATCH /api/teacher/assignments/:assignmentId/schedule
- DELETE /api/teacher/assignments/:assignmentId/schedule

## 9.6 Content library APIs

- GET /api/teacher/library/assets
- POST /api/teacher/library/assets
- GET /api/teacher/library/assets/:assetId
- POST /api/teacher/library/assets/:assetId/reuse

## 10. UX and Product Flow

## 10.1 Teacher flow

1. Teacher opens assignment workspace.
2. Generates or selects content asset.
3. Builds or selects quiz version.
4. Selects recipients.
5. Releases immediately or schedules release.
6. Monitors progress grid and exports CSV when needed.
7. Optionally starts live session from released assignment.

## 10.2 Student flow

1. Student opens dashboard and sees released assignments only.
2. Student opens assignment and consumes slides and quiz.
3. Student joins live session when teacher starts it.
4. Student asks questions and submits responses.
5. Student completion updates teacher tracker.

## 11. Technical Design Notes

## 11.1 Repository strategy and no-core-touch rule

1. Implement teacher and student features in teacher and student folders only.
2. Any required modules from core are copied into teacher or student with clear provenance comments.
3. Do not modify core directly for Phase 2 deliveries.

## 11.2 Integration with existing generation pipeline

1. Use copied generation adapters based on core server generation routes.
2. Persist generated output as content_assets and content_asset_versions.
3. Keep assignment links by immutable version IDs to avoid silent content drift.

## 11.3 Live state synchronization

1. Start with polling and optimistic updates for solo-delivery speed.
2. Introduce optional websocket channel only if polling latency fails acceptance criteria.
3. Persist teacher slide index and key state changes in live_sessions.state_snapshot_json.

## 11.4 CSV export format

Columns:

- student_name
- student_phone
- assignment_title
- slides_viewed
- quiz_completed
- quiz_score_percent
- total_time_minutes
- last_activity_at

## 12. Non-Functional Requirements

1. Security
- Role authorization on all teacher and student routes.
- Assignment access checks on every assignment read path.
- CSV export includes only teacher-authorized class rows.

2. Performance
- Assignment list query p95 under 300 ms.
- Progress grid load p95 under 500 ms for 200 students.
- Live session state update fanout under 3 seconds with polling.

3. Reliability
- Scheduler jobs are idempotent.
- Release job retries with bounded backoff.
- No duplicate recipient creation on repeated assignment save.

4. Observability
- Structured logs for assignment lifecycle events.
- Scheduler run logs with target and result status.
- Live session join and completion counters.

## 13. Implementation Plan (Solo Developer Subphases)

Subphases are intentionally large enough for one developer to own end-to-end.

### Subphase 1 - Assignment domain foundation

Objective
- Build assignment data model, CRUD APIs, and basic teacher UI shell.

Deliverables
- Assignment tables and migrations
- Assignment create and edit API
- Recipient mapping API
- Teacher assignment list page

Estimate
- 5 to 6 days

Definition of done
- Teacher can create draft assignment and bind recipients.

### Subphase 2 - Quiz builder v1

Objective
- Add auto-generation and manual edit for quizzes with versioning.

Deliverables
- Quiz domain tables and version model
- Generate-from-slides endpoint
- Quiz editor UI for MCQ and short-answer
- Publish and duplicate actions

Estimate
- 6 to 7 days

Definition of done
- Teacher can produce a published quiz version and attach it to assignment.

### Subphase 3 - Student assignment dashboard and access control

Objective
- Surface released assignments to students and enforce assignment-only access.

Deliverables
- Student assignment dashboard
- Assignment detail page
- Access guard middleware and route checks
- Assignment attempts tracking

Estimate
- 4 to 5 days

Definition of done
- Student sees only authorized assignments and can complete them.

### Subphase 4 - Progress tracker and CSV export

Objective
- Build teacher visibility layer across assignment and class progress.

Deliverables
- Progress aggregation queries
- Teacher progress grid with filters
- CSV export endpoint
- Basic pagination

Estimate
- 5 to 6 days

Definition of done
- Teacher can monitor class progress and export valid CSV report.

### Subphase 5 - Collaborative classroom session linking

Objective
- Run live sessions from assignments with shared teacher state and student joins.

Deliverables
- Live session create and join endpoints
- Shared state persistence and polling updates
- Teacher live monitor panel
- Student question and completion events in-session

Estimate
- 6 to 7 days

Definition of done
- Teacher can run a live assignment-backed session with many students.

### Subphase 6 - Lesson scheduler and auto-release

Objective
- Deliver schedule and auto-unlock lifecycle for assignments.

Deliverables
- Scheduler jobs table and worker
- Create, update, cancel schedule APIs
- Assignment release worker and retries
- Schedule controls in teacher UI

Estimate
- 4 to 5 days

Definition of done
- Scheduled assignments auto-release and appear in student dashboards.

### Subphase 7 - Content library and reuse

Objective
- Enable reusable asset repository for teacher-generated slides and quizzes.

Deliverables
- Asset and asset-version tables
- Library listing and filtering UI
- Reuse action into new assignments
- Subject tags and basic search

Estimate
- 4 to 5 days

Definition of done
- Teacher can reuse prior assets to create new assignments quickly.

### Subphase 8 - Hardening and release readiness

Objective
- Stabilize, validate, and prepare release package.

Deliverables
- E2E regression suite for assignment lifecycle
- Permission and security tests
- Performance smoke benchmarks
- Runbook and rollout checklist

Estimate
- 3 to 4 days

Definition of done
- Phase 2 acceptance criteria met and release gates passed.

## 14. Testing Strategy

1. Unit tests
- Assignment status transitions
- Quiz version publish immutability
- Progress aggregation and CSV row serialization
- Scheduler release idempotency

2. Integration tests
- Generate content -> create assignment -> release -> student visibility
- Quiz submit -> grade -> progress row update
- Schedule create -> auto-release execution

3. E2E tests
- Teacher creates assignment and assigns to class.
- Student sees assignment post-release and completes quiz.
- Teacher sees score and exports CSV.
- Teacher starts live session and tracks joins.

4. Security tests
- Student attempts teacher endpoints and receives forbidden.
- Student direct access to unassigned assignment fails.

## 15. Risks and Mitigations

1. Risk: scope overlap with unfinished Phase 1 dependencies.
- Mitigation: gate Phase 2 coding behind Phase 1 role and class baseline checklist.

2. Risk: scheduler drift or missed releases.
- Mitigation: idempotent worker, retry strategy, and pending job reconciliation on startup.

3. Risk: progress query cost at class scale.
- Mitigation: indexed query paths and denormalized summary table if needed.

4. Risk: live session consistency under concurrent joins.
- Mitigation: optimistic locking on live session snapshot updates.

5. Risk: asset version confusion for teachers.
- Mitigation: explicit published version labels and immutable version badges.

## 16. Release Gates

1. All Phase 2 functional acceptance criteria pass.
2. Assignment access controls validated in automated tests.
3. Scheduler reliability tested across restart scenarios.
4. CSV export validated against progress grid records.
5. Live session load test passes target concurrency.

## 17. Milestone Timeline (Single Developer)

Estimated total duration: 37 to 45 working days.

1. Subphases 1 to 3 complete core assignment and quiz delivery path.
2. Subphases 4 to 6 complete teacher operations and scheduling.
3. Subphases 7 and 8 complete reuse and production hardening.

## 18. Immediate Next Actions

1. Approve this PRD for implementation.
2. Create issue epics per subphase with explicit acceptance criteria.
3. Start Subphase 1 and lock interfaces for assignments and quiz versions.
4. Reserve a stabilization window before entering Phase 3 scope.
