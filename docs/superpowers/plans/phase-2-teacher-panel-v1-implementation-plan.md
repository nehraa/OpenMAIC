# Phase 2 Implementation Plan: Teacher Panel v1

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Transform OpenMAIC from a generation-first tool into a teacher operations product with full assignment workflow, quiz building, live sessions, scheduling, and content library.

**Architecture:** Copy-on-write from core into `teacher/` and `student/` folders. New domains: Assignment, Quiz Builder, Live Session, Scheduler, Content Library. SQLite via Prisma.

**Tech Stack:** Next.js App Router, TypeScript, Prisma + SQLite, Tailwind CSS, Playwright (tests)

---

## Context

Phase 2 transforms OpenMAIC from a generation-first tool into a teacher operations product. The key workflow is:

**Generate content → Create assignment → Track progress → Run live sessions → Schedule releases → Build content library**

**Repository Rule**: Teacher and student features are built in `teacher/` and `student/` folders using copy-on-write from core. No direct edits to `core/*`.

**Phase 1 Dependency**: Phase 1 must deliver role auth, class/membership model, and read-only classroom student mode before Phase 2 coding begins. Verify these exist before starting.

---

## Reusable from Core

- `core/app/api/generate-classroom/route.ts` - generation pipeline
- `core/components/scene-renderers/quiz-view.tsx` - quiz rendering
- `core/app/api/quiz-grade/route.ts` - grading API
- `core/lib/quiz/grading.ts` - grading logic
- `core/lib/classroom/complete-summary.ts` - completion utilities

---

## New Domains

1. **Assignment Domain**: binds content to recipients with visibility rules
2. **Quiz Builder Domain**: authored MCQ/SAQ with versioning
3. **Live Session Domain**: teacher-controlled shared state with student joins
4. **Scheduler Domain**: time-based release automation
5. **Content Library Domain**: reusable asset repository with taxonomy

---

## Phase 2 Subphases

| # | Subphase | Duration | Goal |
|---|----------|---------|------|
| 1 | Assignment Domain Foundation | 5-6 days | Data model, CRUD APIs, teacher UI shell |
| 2 | Quiz Builder v1 | 6-7 days | Auto-generate + manual edit quizzes with versioning |
| 3 | Student Assignment Dashboard + Access Control | 4-5 days | Students see only assigned content |
| 4 | Progress Tracker + CSV Export | 5-6 days | Teacher visibility across class/assignment progress |
| 5 | Collaborative Classroom Session Linking | 6-7 days | Live sessions with shared teacher state |
| 6 | Lesson Scheduler + Auto-Release | 4-5 days | Time-based assignment unlock automation |
| 7 | Content Library + Reuse | 4-5 days | Reusable asset repository |
| 8 | Hardening + Release Readiness | 3-4 days | E2E regression, security tests |

**Total: 37-45 working days**

---

## Data Model

### New Tables

```sql
content_assets (
  id PRIMARY KEY,
  owner_teacher_id REFERENCES users,
  type TEXT, -- 'slide_deck' | 'quiz'
  title TEXT,
  subject_tag TEXT,
  source_kind TEXT, -- 'generated' | 'manual' | 'imported'
  source_ref TEXT,
  created_at DATETIME,
  updated_at DATETIME
)

content_asset_versions (
  id PRIMARY KEY,
  asset_id REFERENCES content_assets,
  version_number INTEGER,
  payload_json TEXT,
  status TEXT, -- 'draft' | 'published' | 'archived'
  created_at DATETIME
)

assignments (
  id PRIMARY KEY,
  class_id REFERENCES classes,
  teacher_id REFERENCES users,
  title TEXT,
  description TEXT,
  slide_asset_version_id REFERENCES content_asset_versions,
  quiz_asset_version_id REFERENCES content_asset_versions,
  release_at DATETIME,
  due_at DATETIME,
  status TEXT, -- 'draft' | 'scheduled' | 'released' | 'closed'
  created_at DATETIME,
  updated_at DATETIME
)

assignment_recipients (
  id PRIMARY KEY,
  assignment_id REFERENCES assignments,
  student_id REFERENCES users,
  visibility_status TEXT, -- 'hidden' | 'visible'
  assigned_at DATETIME
)

assignment_attempts (
  id PRIMARY KEY,
  assignment_id REFERENCES assignments,
  student_id REFERENCES users,
  started_at DATETIME,
  submitted_at DATETIME,
  score_percent REAL,
  completion_state TEXT -- 'not_started' | 'in_progress' | 'completed'
)

assignment_slide_progress (
  id PRIMARY KEY,
  assignment_id REFERENCES assignments,
  student_id REFERENCES users,
  slide_id TEXT,
  viewed_at DATETIME
)

live_sessions (
  id PRIMARY KEY,
  assignment_id REFERENCES assignments,
  teacher_id REFERENCES users,
  state_snapshot_json TEXT,
  status TEXT, -- 'live' | 'ended'
  started_at DATETIME,
  ended_at DATETIME
)

live_session_participants (
  id PRIMARY KEY,
  live_session_id REFERENCES live_sessions,
  user_id REFERENCES users,
  joined_at DATETIME,
  left_at DATETIME,
  completion_state TEXT
)

scheduler_jobs (
  id PRIMARY KEY,
  target_type TEXT, -- 'assignment_release'
  target_id TEXT,
  run_at DATETIME,
  status TEXT, -- 'pending' | 'running' | 'completed' | 'failed' | 'canceled'
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at DATETIME,
  updated_at DATETIME
)
```

### Required Indexes

```sql
CREATE INDEX idx_assignments_teacher_status ON assignments(teacher_id, status);
CREATE INDEX idx_assignments_class_status ON assignments(class_id, status);
CREATE INDEX idx_assignment_recipients_assignment ON assignment_recipients(assignment_id);
CREATE INDEX idx_assignment_recipients_student ON assignment_recipients(student_id);
CREATE INDEX idx_assignment_attempts_assignment_student ON assignment_attempts(assignment_id, student_id);
CREATE INDEX idx_scheduler_jobs_pending_run ON scheduler_jobs(status, run_at);
```

---

## File Structure

### teacher/ (new files)

```
teacher/
├── app/
│   ├── api/
│   │   └── teacher/
│   │       ├── assignments/
│   │       │   ├── route.ts
│   │       │   └── [assignmentId]/
│   │       │       ├── route.ts
│   │       │       ├── recipients/route.ts
│   │       │       ├── release/route.ts
│   │       │       └── schedule/route.ts
│   │       ├── quizzes/
│   │       │   ├── generate-from-slides/route.ts
│   │       │   ├── route.ts
│   │       │   └── [quizId]/
│   │       │       ├── route.ts
│   │       │       ├── publish/route.ts
│   │       │       └── duplicate/route.ts
│   │       ├── live-sessions/
│   │       │   ├── route.ts
│   │       │   └── [sessionId]/
│   │       │       ├── state/route.ts
│   │       │       └── end/route.ts
│   │       ├── library/
│   │       │   ├── assets/route.ts
│   │       │   └── assets/[assetId]/
│   │       │       ├── route.ts
│   │       │       └── reuse/route.ts
│   │       ├── progress/
│   │       │   ├── class/[classId]/route.ts
│   │       │   ├── assignment/[assignmentId]/route.ts
│   │       │   └── export.csv/route.ts
│   │       └── classes/[classId]/route.ts
│   ├── teacher/
│   │   ├── assignments/
│   │   │   ├── page.tsx
│   │   │   └── [assignmentId]/page.tsx
│   │   ├── quizzes/
│   │   │   ├── page.tsx
│   │   │   └── [quizId]/edit/page.tsx
│   │   ├── sessions/[sessionId]/page.tsx
│   │   ├── library/page.tsx
│   │   └── progress/page.tsx
│   └── layout.tsx
├── lib/
│   ├── db/
│   │   └── schema.prisma
│   ├── server/
│   │   ├── assignments.ts
│   │   ├── quizzes.ts
│   │   ├── scheduler.ts
│   │   ├── live-sessions.ts
│   │   └── progress.ts
│   └── components/
│       ├── quiz-editor.tsx
│       ├── progress-grid.tsx
│       └── assignment-form.tsx
└── e2e/
    ├── assignments.spec.ts
    ├── quiz-builder.spec.ts
    ├── progress-tracker.spec.ts
    ├── live-session.spec.ts
    ├── api/assignments.integration.spec.ts
    ├── security.spec.ts
    ├── performance.spec.ts
    └── a11y.spec.ts
```

### student/ (additions)

```
student/
├── app/
│   ├── api/
│   │   └── student/
│   │       ├── assignments/
│   │       │   └── route.ts
│   │       ├── assignments/[assignmentId]/
│   │       │   ├── route.ts
│   │       │   ├── start/route.ts
│   │       │   ├── submit/route.ts
│   │       │   └── slides/[slideId]/view/route.ts
│   │       └── live-sessions/[sessionId]/
│   │           ├── join/route.ts
│   │           ├── questions/route.ts
│   │           └── completion/route.ts
│   └── student/
│       ├── assignments/
│       │   ├── page.tsx
│       │   └── [assignmentId]/page.tsx
│       └── sessions/[sessionId]/page.tsx
└── lib/
    └── server/
        ├── access-control.ts
        └── attempts.ts
```

---

## Agent Prompts

### PROMPT 1: Backend Foundation + Assignment APIs

**Agent**: `engineering/backend-architect` + `engineering/fullstack-developer`
**Subphase**: 1 (runs parallel with Prompt 2)
**Depends On**: Phase 1 baseline

```
You are implementing the Assignment Domain Foundation for Aidutech's Teacher Panel v1.

## Context
- Project: /Users/abhinavnehra/git/tools/OpenMAIC
- Target folder: teacher/
- Tech stack: Next.js App Router, TypeScript, Prisma + SQLite
- Phase 1 dependency: Must verify users, classes, class_memberships tables exist before proceeding

## Your Task
1. First check if Phase 1 baseline exists by checking teacher/lib/db/schema.prisma or shared schema
2. Create teacher/lib/db/schema.prisma with these NEW tables:
   - content_assets (id, owner_teacher_id, type[slide_deck|quiz], title, subject_tag, source_kind, source_ref, created_at, updated_at)
   - content_asset_versions (id, asset_id, version_number, payload_json, status[draft|published|archived], created_at)
   - assignments (id, class_id, teacher_id, title, description, slide_asset_version_id, quiz_asset_version_id, release_at, due_at, status[draft|scheduled|released|closed], created_at, updated_at)
   - assignment_recipients (id, assignment_id, student_id, visibility_status, assigned_at)
   - assignment_attempts (id, assignment_id, student_id, started_at, submitted_at, score_percent, completion_state)
   - assignment_slide_progress (id, assignment_id, student_id, slide_id, viewed_at)
   - scheduler_jobs (id, target_type, target_id, run_at, status, retry_count, last_error, created_at, updated_at)

3. Add indexes for common query paths:
   - assignments: (teacher_id, status), (class_id, status)
   - assignment_recipients: (assignment_id), (student_id)
   - assignment_attempts: (assignment_id, student_id)

4. Create teacher/lib/server/assignments.ts with domain logic:
   - createAssignment(data) - creates draft assignment
   - updateAssignment(id, data) - updates draft/scheduled
   - addRecipients(assignmentId, studentIds) - batch add recipients
   - releaseAssignment(id) - change status to released, set visibility
   - getAssignmentWithRecipients(id)
   - getAssignmentsForTeacher(teacherId) - list with filters

5. Create API routes:
   - POST /api/teacher/assignments - create assignment
   - GET /api/teacher/assignments - list teacher's assignments
   - GET /api/teacher/assignments/:id - get detail
   - PATCH /api/teacher/assignments/:id - update assignment
   - POST /api/teacher/assignments/:id/recipients - add recipients
   - POST /api/teacher/assignments/:id/release - release to recipients

6. Add proper error handling, validation with Zod, and role guards (teacher only)

## Skills to Invoke
- Use `serena` MCP for codebase operations (find_symbol, search_for_pattern to find existing patterns)
- Use `context7` MCP to look up Next.js App Router best practices if needed

## Testing Requirements
Write tests in teacher/lib/server/assignments.test.ts:
- createAssignment creates draft
- createAssignment requires title
- addRecipients creates records for each student
- releaseAssignment changes status and visibility

## Verify
Run: cd /Users/abhinavnehra/git/tools/OpenMAIC && npx prisma validate
Run: cd teacher && npm test -- assignments.test.ts
```

---

### PROMPT 2: Frontend Assignment UI Shell

**Agent**: `engineering/frontend-developer`
**Subphase**: 1 (runs parallel with Prompt 1)
**Depends On**: Prompt 1 schema (can start with mock data)

```
You are building the Teacher Assignment UI Shell for Aidutech's Teacher Panel v1.

## Context
- Project: /Users/abhinavnehra/git/tools/OpenMAIC
- Target folder: teacher/
- Existing: Next.js App Router, TypeScript, Tailwind CSS already configured in core

## Your Task
1. Create teacher/app/teacher/assignments/page.tsx - Assignment list page
   - Shows table of assignments with columns: title, class, status, release date, recipient count
   - Status badge colors: draft(gray), scheduled(blue), released(green), closed(red)
   - "Create Assignment" button linking to creation flow
   - Empty state with illustration

2. Create teacher/app/teacher/assignments/[assignmentId]/page.tsx - Assignment detail
   - Shows assignment info, recipients list, status
   - Edit button (if draft/scheduled)
   - Release button (if ready)
   - Delete button (if draft)

3. Create teacher/lib/components/assignment-form.tsx - Assignment creation form
   - Title input (required, 3-100 chars)
   - Description textarea (optional)
   - Class selector dropdown (fetch from /api/teacher/classes)
   - Slide asset selector (from content library - future)
   - Quiz asset selector (from content library - future)
   - Due date picker (optional)
   - Recipient selection (all class or specific students)
   - Submit creates via POST /api/teacher/assignments

4. Create teacher/lib/components/status-badge.tsx - Reusable status badge

## Skills to Invoke
- Use `serena` MCP for finding existing UI patterns in core (search_for_pattern for "page.tsx")
- Use `pencil` MCP if you want to create design mockups

## Testing
Create teacher/app/teacher/assignments/assignment-form.test.tsx:
- Form renders all fields
- Validation shows errors for empty title
- Submit button disabled during loading

## Verify
Run: cd teacher && npm run build (should have no errors)
```

---

### PROMPT 3: Quiz Builder APIs + Editor

**Agent**: `engineering/fullstack-developer`
**Subphase**: 2

```
You are implementing Quiz Builder v1 for Aidutech's Teacher Panel.

## Context
- Project: /Users/abhinavnehra/git/tools/OpenMAIC
- Target folder: teacher/
- Reuse from core: core/lib/quiz/grading.ts, core/app/api/quiz-grade/route.ts

## Your Task
1. Create teacher/lib/server/quizzes.ts domain logic:
   - generateQuizFromSlides(slideAssetVersionId) - calls generation API
   - createQuiz(data) - creates draft quiz asset
   - updateQuiz(id, data) - updates draft only
   - publishQuiz(id) - changes status to published, creates immutable version
   - duplicateQuiz(id) - copies to new draft version
   - addQuestion(quizId, question) - adds MCQ or short-answer
   - updateQuestion(questionId, data) - updates if draft
   - deleteQuestion(questionId) - removes if draft

2. Quiz question types:
   - MCQ: { type: 'mcq', question, options: string[], correctIndex: number, points: number }
   - ShortAnswer: { type: 'short_answer', question, sampleAnswer: string, points: number }

3. Create API routes:
   - POST /api/teacher/quizzes/generate-from-slides - auto-generate from slides
   - POST /api/teacher/quizzes - create quiz
   - GET /api/teacher/quizzes - list teacher's quizzes
   - PATCH /api/teacher/quizzes/:id - update quiz
   - POST /api/teacher/quizzes/:id/publish - publish version
   - POST /api/teacher/quizzes/:id/duplicate - duplicate quiz
   - POST /api/teacher/quizzes/:id/questions - add question
   - PATCH /api/teacher/quizzes/:id/questions/:qId - update question
   - DELETE /api/teacher/quizzes/:id/questions/:qId - delete question

4. Create teacher/lib/components/quiz-editor.tsx:
   - Question list with drag-to-reorder
   - Add MCQ button - inline editor for question, options, correct answer, points
   - Add Short Answer button - inline editor for question, sample answer, points
   - Total points display
   - Save draft / Publish buttons
   - Published version shows "Immutable" badge

5. Create teacher/app/teacher/quizzes/page.tsx - Quiz list
6. Create teacher/app/teacher/quizzes/[quizId]/edit/page.tsx - Quiz editor page

## Skills to Invoke
- Use `serena` MCP to find existing quiz patterns
- Use `context7` MCP for React form handling best practices

## Testing
Create teacher/lib/server/quizzes.test.ts:
- generateQuizFromSlides calls correct endpoint
- publishQuiz creates published version
- updateQuiz fails on published quiz
- duplicateQuiz creates new draft

## Verify
Run: cd teacher && npx prisma validate
Run: cd teacher && npm test -- quizzes.test.ts
```

---

### PROMPT 4: Student Assignment Dashboard + Access Control

**Agent**: `engineering/fullstack-developer`
**Subphases**: 3

```
You are implementing Student Assignment Dashboard and Access Control for Aidutech.

## Context
- Project: /Users/abhinavnehra/git/tools/OpenMAIC
- Target folder: student/
- Access rule: Students see ONLY assigned content they are recipients of

## Your Task
1. Create student/lib/server/access-control.ts:
   - canViewAssignment(studentId, assignmentId) - checks recipient + released status
   - getVisibleAssignments(studentId) - only released assignments with visibility

2. Create student/lib/server/attempts.ts:
   - startAttempt(studentId, assignmentId) - creates assignment_attempt record
   - recordSlideView(attemptId, slideId) - records slide progress
   - submitAttempt(attemptId, answers) - submits for grading
   - getAttemptWithResults(attemptId) - returns attempt with graded results

3. Create API routes (student/):
   - GET /api/student/assignments - list visible assignments for student
   - GET /api/student/assignments/:id - get assignment if authorized
   - POST /api/student/assignments/:id/start - start attempt
   - POST /api/student/assignments/:id/submit - submit attempt
   - POST /api/student/assignments/:id/slides/:slideId/view - record slide view

4. Create student/app/student/assignments/page.tsx:
   - Lists assigned assignments with: title, class name, due date, status
   - Status: not_started, in_progress, completed
   - Click opens assignment detail

5. Create student/app/student/assignments/[assignmentId]/page.tsx:
   - Shows slides (using existing core renderer)
   - Shows quiz (using existing core quiz-view)
   - Submit button when ready
   - Completion confirmation

6. Middleware: Add role guard middleware that:
   - Rejects student_classroom role on teacher/* routes
   - Rejects teacher role on student/* routes

## Access Control Tests
Create student/lib/server/access-control.test.ts:
- getVisibleAssignments returns only released assignments
- getVisibleAssignments excludes draft/scheduled
- canViewAssignment returns false for non-recipients
- startAttempt creates attempt record

## Verify
Run: cd student && npm run build
```

---

### PROMPT 5: Progress Tracker + CSV Export

**Agent**: `engineering/backend-architect` + `engineering/frontend-developer`
**Subphases**: 4
**Parallel With**: Prompt 6

```
You are implementing the Progress Tracker and CSV Export for Aidutech Teacher Panel.

## Context
- Project: /Users/abhinavnehra/git/tools/OpenMAIC
- Target folder: teacher/
- This is read-only aggregation, no new tables needed

## Your Task
1. Create teacher/lib/server/progress.ts:
   - getClassProgress(classId, filters?) - aggregates progress for all students
   - getAssignmentProgress(assignmentId) - progress for specific assignment
   - ExportToCSV(classId, filters) - generates CSV with columns:
     student_name, student_phone, assignment_title, slides_viewed, quiz_completed, quiz_score_percent, total_time_minutes, last_activity_at

2. Create API routes:
   - GET /api/teacher/progress/class/:classId
     - Query params: assignmentId (optional), status (optional), dateFrom, dateTo
     - Returns: { students: [{ id, name, phone, assignments: [{ title, slidesViewed, quizCompleted, score, timeMinutes, lastActivity }] }
   - GET /api/teacher/progress/assignment/:assignmentId
     - Returns: { assignment, recipients: [{ student, status, slidesViewed, quizScore, attemptCount }] }
   - GET /api/teacher/progress/export.csv?classId=X...
     - Returns CSV file download

3. Create teacher/lib/components/progress-grid.tsx:
   - Table with columns: Student, Phone, Assignments (expandable)
   - Each assignment shows: slides viewed (✓/✗), quiz completed (✓/✗), score %, time spent
   - Sort by: name, score, completion
   - Filter dropdown: All, Completed, Not Started, Low Score (<60%)
   - Export CSV button
   - Pagination: 20 students per page

4. Create teacher/app/teacher/progress/page.tsx:
   - Class selector dropdown
   - Progress grid component
   - Export button

## Performance Requirements
- Query must use indexes efficiently (no full table scans)
- Consider denormalized summary if needed for 200+ students

## Testing
Create teacher/lib/server/progress.test.ts:
- getClassProgress returns all enrolled students
- ExportToCSV generates valid CSV with correct columns
- Filters work correctly

## Verify
Run: cd teacher && npm test -- progress.test.ts
Run CSV export manually, verify row count matches student count
```

---

### PROMPT 6: Live Session Infrastructure

**Agent**: `engineering/fullstack-developer`
**Subphases**: 5

```
You are implementing Live Collaborative Classroom Sessions for Aidutech Teacher Panel.

## Context
- Project: /Users/abhinavnehra/git/tools/OpenMAIC
- Target folder: teacher/ and student/
- Strategy: Start with polling/optimistic updates (WebSocket only if needed)

## Your Task
1. Create teacher/lib/server/live-sessions.ts:
   - createLiveSession(assignmentId, teacherId) - creates live_session record
   - updateSessionState(sessionId, state) - updates state_snapshot_json
   - endSession(sessionId) - marks as ended
   - getSessionWithParticipants(sessionId)

2. Create tables (if not in schema):
   - live_sessions (id, assignment_id, teacher_id, state_snapshot_json, status, started_at, ended_at)
   - live_session_participants (id, live_session_id, user_id, joined_at, left_at, completion_state)

3. Teacher API routes:
   - POST /api/teacher/live-sessions - create from assignment
   - PATCH /api/teacher/live-sessions/:id/state - update slide index, annotations
   - POST /api/teacher/live-sessions/:id/end - end session

4. Student API routes:
   - POST /api/student/live-sessions/:id/join - join session
   - POST /api/student/live-sessions/:id/questions - submit question
   - POST /api/student/live-sessions/:id/completion - mark completion

5. Create teacher/app/teacher/sessions/[sessionId]/page.tsx:
   - Shows current slide content (from state_snapshot)
   - Student join count: "X students joined"
   - Question list with unanswered count
   - Next/Previous slide controls
   - "End Session" button
   - Completion indicators per student

6. Create student/app/student/sessions/[sessionId]/page.tsx:
   - Read-only viewer showing current slide
   - Teacher-controlled navigation
   - "Ask Question" floating button
   - "Mark Complete" button
   - No prompt/generation controls

7. Polling setup:
   - Student polls GET /api/student/live-sessions/:id every 3 seconds
   - Teacher polls GET /api/teacher/live-sessions/:id every 2 seconds

## Skills to Invoke
- Use `serena` MCP to find existing session patterns in core

## Testing
Create teacher/lib/server/live-sessions.test.ts:
- createLiveSession creates record with 'live' status
- updateSessionState persists state
- endSession marks as 'ended'
- Student cannot join ended session

## Verify
Run: cd teacher && npm test -- live-sessions.test.ts
```

---

### PROMPT 7: Lesson Scheduler + Auto-Release

**Agent**: `engineering/backend-architect`
**Subphases**: 6

```
You are implementing the Lesson Scheduler and Auto-Release for Aidutech Teacher Panel.

## Context
- Project: /Users/abhinavnehra/git/tools/OpenMAIC
- Target folder: teacher/
- Scheduler jobs must be idempotent

## Your Task
1. Create teacher/lib/server/scheduler.ts:
   - createScheduleJob(assignmentId, releaseAt) - creates scheduler_jobs record
   - cancelScheduleJob(assignmentId) - sets status to canceled
   - updateSchedule(assignmentId, newReleaseAt) - replaces existing job
   - runPendingJobs() - called by cron/worker, processes due jobs
   - releaseAssignment(id) - called by scheduler (same as manual release)

2. Scheduler worker:
   - Runs every 60 seconds
   - Queries: SELECT * FROM scheduler_jobs WHERE status = 'pending' AND run_at <= NOW()
   - For each job:
     - Set status = 'running'
     - Execute releaseAssignment
     - Set status = 'completed'
   - On error: increment retry_count, set last_error, reschedule or mark failed

3. API routes:
   - POST /api/teacher/assignments/:id/schedule - create/update schedule
   - PATCH /api/teacher/assignments/:id/schedule - update schedule
   - DELETE /api/teacher/assignments/:id/schedule - cancel schedule
   - Returns: { scheduled: true, releaseAt: ISO8601 }

4. Add to assignment form:
   - "Release" section with radio: "Release now" / "Schedule for later"
   - Date/time picker when scheduling
   - Shows next: "Scheduled for Apr 28, 2026 at 9:00 AM"

5. Idempotency rules:
   - Multiple schedule creates for same assignment update existing, don't create new
   - Release job checks assignment status before releasing
   - Retry with exponential backoff: 1min, 5min, 15min, 1hr

## Skills to Invoke
- Use `context7` MCP to research job queue patterns if needed

## Testing
Create teacher/lib/server/scheduler.test.ts:
- createScheduleJob creates pending job
- runPendingJobs processes due jobs
- cancelScheduleJob sets status to canceled
- Duplicate schedule calls update existing, not create new
- Failed job increments retry_count

## Verify
Run: cd teacher && npm test -- scheduler.test.ts
```

---

### PROMPT 8: Content Library + Reuse

**Agent**: `engineering/fullstack-developer`
**Subphases**: 7

```
You are implementing the Content Library for Aidutech Teacher Panel.

## Context
- Project: /Users/abhinavnehra/git/tools/OpenMAIC
- Target folder: teacher/
- Reuse: Copy assets from core generation output

## Your Task
1. Create teacher/lib/server/library.ts:
   - saveGeneratedContent(teacherId, type, title, payload, subjectTag?) - saves to content_assets
   - getLibraryAssets(teacherId, filters?) - list with pagination
   - getAssetWithVersions(assetId) - asset + all versions
   - reuseAsset(assetId, targetClassId) - creates new assignment referencing asset version
   - tagAsset(assetId, subjectTag) - updates subject_tag

2. API routes:
   - GET /api/teacher/library/assets - list with ?type=quiz&subject=Math&search=...
   - POST /api/teacher/library/assets - save generated content
   - GET /api/teacher/library/assets/:id - get with versions
   - POST /api/teacher/library/assets/:id/reuse - create assignment from asset
   - PATCH /api/teacher/library/assets/:id - update title/subject tag

3. Create teacher/app/teacher/library/page.tsx:
   - Search bar
   - Filter tabs: All | Slides | Quizzes
   - Subject tag filter dropdown
   - Card grid showing: title, type badge, subject tag, created date
   - "Use" button on each card
   - Click opens detail/reuse modal

4. Reuse modal:
   - Select class
   - Set release date (optional)
   - Set due date (optional)
   - "Create Assignment" button

## Testing
Create teacher/lib/server/library.test.ts:
- saveGeneratedContent creates asset
- getLibraryAssets with filters works
- reuseAsset creates assignment pointing to current version

## Verify
Run: cd teacher && npm test -- library.test.ts
```

---

### PROMPT 9: E2E Testing Suite

**Agent**: `testing/api-tester` + `testing/accessibility-auditor`
**Subphase**: 8

```
You are creating the comprehensive E2E test suite for Phase 2.

## Context
- Project: /Users/abhinavnehra/git/tools/OpenMAIC
- Test framework: Playwright
- Target: All Phase 2 acceptance criteria

## Your Task

### 1. E2E Test Suite (teacher/e2e/)

Create teacher/e2e/assignments.spec.ts:
```typescript
test('Teacher creates assignment and releases to class', async ({ page }) => {
  await page.goto('/teacher/login');
  await page.fill('[name=phone]', TEST_TEACHER_PHONE);
  await page.fill('[name=otp]', '123456');
  await page.click('button[type=submit]');
  await page.goto('/teacher/assignments');
  await page.click('text=Create Assignment');
  await page.fill('[name=title]', 'Test Assignment');
  await page.selectOption('select[name=classId]', TEST_CLASS_ID);
  await page.click('button[type=submit]');
  await page.click('text=Release');
  await expect(page.locator('.status-badge')).toHaveText('Released');
});

test('Student sees assigned content after release', async ({ page }) => {
  await page.goto('/student/login');
  await page.fill('[name=phone]', TEST_STUDENT_PHONE);
  await page.fill('[name=otp]', '123456');
  await page.click('button[type=submit]');
  await page.goto('/student/assignments');
  await expect(page.locator('text=Test Assignment')).toBeVisible();
});

test('Student cannot access unassigned content', async ({ page }) => {
  await page.goto('/student/login');
  await page.fill('[name=phone]', TEST_STUDENT_PHONE);
  await page.fill('[name=otp]', '123456');
  await page.click('button[type=submit]');
  await page.goto('/student/assignments/99999');
  await expect(page).toHaveURL('/student/assignments');
});
```

Create teacher/e2e/quiz-builder.spec.ts:
```typescript
test('Teacher auto-generates quiz from slides', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/quizzes');
  await page.click('text=New Quiz');
  await page.selectOption('select[name=sourceSlides]', SLIDE_ASSET_ID);
  await page.click('text=Generate from Slides');
  await expect(page.locator('.question-item')).toHaveCount(5);
});

test('Teacher adds manual MCQ question', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/quizzes/QUIZ_ID/edit');
  await page.click('text=Add MCQ');
  await page.fill('[name=question]', 'What is 2+2?');
  await page.fill('[name=option0]', '3');
  await page.fill('[name=option1]', '4');
  await page.fill('[name=option2]', '5');
  await page.click('[name=correctOption][value=1]');
  await page.click('button:has-text("Save")');
  await expect(page.locator('.question-item')).toHaveCount(1);
});
```

Create teacher/e2e/progress-tracker.spec.ts:
```typescript
test('Teacher sees student progress after completion', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/progress?classId=1');
  await expect(page.locator('table tr.student-row')).toHaveCount(30);
  await expect(page.locator('text=Sarah')).toBeVisible();
});

test('Teacher exports CSV with correct data', async ({ page }) => {
  await loginAsTeacher(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('text=Export CSV')
  ]);
  const csv = await download.path();
  const content = await fs.readFile(csv, 'utf-8');
  expect(content).toContain('student_name,student_phone,assignment_title');
});
```

Create teacher/e2e/live-session.spec.ts:
```typescript
test('Teacher starts live session, students join', async ({ browser }) => {
  const teacherPage = await browser.newPage();
  const studentPage = await browser.newPage();

  await loginAsTeacher(teacherPage);
  await teacherPage.goto('/teacher/sessions');
  await teacherPage.click('text=Start Live Session');

  await loginAsStudent(studentPage);
  await studentPage.goto('/student/sessions/SESSION_CODE');
  await studentPage.click('text=Join');

  await expect(teacherPage.locator('.participant-count')).toHaveText('1 students joined');
});
```

### 2. API Integration Tests (teacher/e2e/api/)

Create teacher/e2e/api/assignments.integration.spec.ts:
```typescript
test('Full assignment lifecycle', async ({ request }) => {
  const token = await getTeacherToken();

  // Create assignment
  const assignment = await request.post('/api/teacher/assignments', {
    headers: { Authorization: `Bearer ${token}` },
    data: { title: 'Integration Test', classId: 1 }
  });
  expect(assignment.status()).toBe(201);
  const assignmentId = (await assignment.json()).id;

  // Add recipients
  await request.post(`/api/teacher/assignments/${assignmentId}/recipients`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { studentIds: [1, 2, 3] }
  });

  // Release
  await request.post(`/api/teacher/assignments/${assignmentId}/release`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  // Verify student can see
  const studentToken = await getStudentToken(1);
  const studentAssignments = await request.get('/api/student/assignments', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  expect((await studentAssignments.json()).length).toBeGreaterThan(0);
});
```

### 3. Security Tests

Create teacher/e2e/security.spec.ts:
```typescript
test('Student cannot access teacher endpoints', async ({ request }) => {
  const studentToken = await getStudentToken(1);

  const response = await request.post('/api/teacher/assignments', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  expect(response.status()).toBe(403);
});

test('Unauthenticated requests are rejected', async ({ request }) => {
  const response = await request.get('/api/teacher/assignments');
  expect(response.status()).toBe(401);
});
```

### 4. Performance Smoke Tests

Create teacher/e2e/performance.spec.ts:
```typescript
test('Assignment list loads under 500ms', async ({ page }) => {
  await loginAsTeacher(page);
  const start = Date.now();
  await page.goto('/teacher/assignments');
  await page.waitForLoadState('networkidle');
  expect(Date.now() - start).toBeLessThan(500);
});
```

### 5. Accessibility Audit

Create teacher/e2e/a11y.spec.ts:
```typescript
test('Assignment page passes WCAG 2.1 AA', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/assignments');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('Quiz editor keyboard navigation', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/quizzes/new');
  await page.keyboard.press('Tab');
  // Verify focus moves through form elements logically
});
```

## Skills to Invoke
- Use `playwright` MCP for browser automation
- Use `serena` MCP to find existing test patterns

## Verify
Run: cd teacher && npx playwright test
Run: cd teacher && npx playwright test --project=security
```

---

## Test Coverage Requirements

### Unit Tests (Required per domain)

| Domain | File | Coverage Target |
|--------|------|----------------|
| Assignments | assignments.test.ts | 80%+ |
| Quizzes | quizzes.test.ts | 80%+ |
| Access Control | access-control.test.ts | 90%+ |
| Progress | progress.test.ts | 75%+ |
| Live Sessions | live-sessions.test.ts | 80%+ |
| Scheduler | scheduler.test.ts | 85%+ |
| Library | library.test.ts | 75%+ |

### Integration Tests

- Full assignment lifecycle: generate → assign → release → complete → track
- Quiz: create → add questions → publish → duplicate
- Scheduler: schedule → auto-release → verify visibility

### E2E Tests (Playwright)

- Teacher: create class → create assignment → release → track progress → export CSV
- Student: join class → see assignment → complete → view score
- Live session: start → join → ask question → end
- Security: role enforcement, unauthorized access attempts

---

## MCP Tools Reference

### Serena MCP (Codebase Operations)

```bash
# Find existing patterns before implementing
search_for_pattern: "function createAssignment"
find_symbol: "assignments.ts"
get_symbols_overview: "teacher/lib/server/assignments.ts"
```

### Context7 MCP (Documentation)

```bash
# Look up patterns if uncertain
resolve-library-id: "Next.js"
query-docs: "App Router API routes best practices"
```

### Playwright MCP (E2E Testing)

```bash
browser_navigate: "http://localhost:3000/teacher/assignments"
browser_snapshot: # Get page structure
```

---

## Execution Order

### Wave 1 (Parallel)

| Prompt | Agent | Subphase |
|--------|-------|----------|
| 1 | `backend-architect` + `fullstack-developer` | Assignment Domain Foundation |
| 2 | `frontend-developer` | Frontend Assignment UI Shell |

### Wave 2 (After Wave 1)

| Prompt | Agent | Subphase |
|--------|-------|----------|
| 3 | `fullstack-developer` | Quiz Builder APIs + Editor |

### Wave 3 (After Wave 1)

| Prompt | Agent | Subphase |
|--------|-------|----------|
| 4 | `fullstack-developer` | Student Assignment Dashboard + Access Control |

### Wave 4 (After Wave 2 & 3)

| Prompt | Agent | Subphase |
|--------|-------|----------|
| 5 | `backend-architect` + `frontend-developer` | Progress Tracker + CSV Export |
| 6 | `fullstack-developer` | Live Session Infrastructure |

### Wave 5 (After Wave 4)

| Prompt | Agent | Subphase |
|--------|-------|----------|
| 7 | `backend-architect` | Lesson Scheduler + Auto-Release |
| 8 | `fullstack-developer` | Content Library + Reuse |

### Wave 6 (After Wave 5)

| Prompt | Agent | Subphase |
|--------|-------|----------|
| 9 | `api-tester` + `accessibility-auditor` | E2E Testing Suite + Hardening |

---

## Success Criteria

1. All 8 subphases complete with passing tests
2. E2E suite covers all acceptance criteria from PRD
3. Security tests pass: no role bypass vulnerabilities
4. Performance: assignment list <300ms, progress grid <500ms for 200 students
5. Teacher can complete full workflow without touching `core/*`
6. Phase 2 release gates passed:
   - All functional acceptance criteria pass
   - Assignment access controls validated
   - Scheduler reliability tested
   - CSV export validated
   - Live session load test passes 30 concurrent students

---

## Output

After completion, create `.planning/phases/02-teacher-panel-v1/{phase}-plan-{N}-SUMMARY.md` for each completed wave.
