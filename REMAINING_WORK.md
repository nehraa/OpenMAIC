# OpenMAIC: Remaining Work

**Last Updated:** 2026-05-09
**Current Status:** MVP ~40% Complete (Teacher) / ~25% Complete (Student)
**Roadmap:** 10-phase plan spanning 12+ months
**Recommendation:** Longer path to release — focus on VibeHire first

---

## Executive Summary

OpenMAIC (Open Multi-Agent Interactive Classroom) is an AI-powered EdTech platform that transforms topics/documents into interactive classroom experiences with multi-agent AI teachers and classmates. The project is structured as a monorepo with teacher and student product surfaces adapting from the immutable core.

The current codebase has significant remaining work before any product surface reaches MVP. The teacher panel is ~60% incomplete, and the student panel is ~75% incomplete.

---

## ✅ Completed

### Core (Immutable Baseline)
- [x] Multi-Agent Classroom (AI teacher + classmates with TTS)
- [x] Slide Generation (PDF upload → AI-generated slides)
- [x] Quiz Generation (Auto-generate MCQs from content)
- [x] Whiteboard Integration (Real-time drawing + formula writing)
- [x] Interactive Simulations (3D visualization, games, mind maps)
- [x] Deep Interactive Mode (PBL activities, hands-on learning)
- [x] PPTX/HTML Export (Download editable slides)
- [x] OpenClaw Integration (Feishu, Slack, Telegram, 20+ platforms)
- [x] Multi-Language Support (Automatic language inference)
- [x] ACCESS_CODE Authentication (Site-wide access control)
- [x] Multiple LLM Providers (15+ provider configurations)
- [x] Whiteboard Layout Evaluation (AI-powered evaluation scripts)

### Teacher Panel (Phase 1-2)

#### Phase 1: Complete ✅
- [x] Teacher Signup/Login (Phone-based auth with JWT)
- [x] Class Management (Create, view, manage classes)
- [x] Student Management (Add students by phone/CSV)

#### Phase 2: Partial ⚠️
- [x] Assignment Creation (Assign slides/quizzes to students)
- [x] Quiz Builder (Auto + manual question creation)
- [x] Class Detail View (Student list, completion status)
- [x] Content Library (Save/reuse slides and quizzes)
- [ ] Progress Tracking (Per-student completion + quiz scores) — **IN PROGRESS**
- [ ] Live Classroom Sessions (Multi-student shared sessions) — **IN PROGRESS**
- [ ] Usage Analytics (Token tracking, session history) — **IN PROGRESS**

### Student Panel (Phase 1-3)

#### Phase 1: Partial ⚠️
- [x] Student Signup/Login (Phone-based auth)
- [ ] Class Join (Invite Code) — **NOT BUILT**
- [ ] Assignment Dashboard (View assigned content) — **IN PROGRESS**

#### Phase 2: Not Started 🚫
- [ ] Quiz Taking — **NOT BUILT**
- [ ] Progress View (Personal progress tracking) — **NOT BUILT**

#### Phase 3: Not Started 🚫
- [ ] Plan Tiers (Basic/Image/Video) — **NOT BUILT**
- [ ] Question Quota Tracking (Usage tracking) — **NOT BUILT**
- [ ] B2C Workspace (Self-serve AI generation) — **NOT BUILT**

### Website (Marketing)
- [x] Landing Page (Hero, features, pricing)
- [x] Pricing Page (Plan comparison)
- [x] Screenshots (Automated capture)
- [x] Demo Video (Available in repo)

### Infrastructure
- [x] PostgreSQL with RLS policies
- [x] Docker deployment (Dockerfile, docker-compose.yml)
- [x] E2E Testing (Playwright configs)
- [x] Unit Testing (Vitest in core/)
- [x] CI/CD (GitHub Actions)
- [x] Comprehensive PRD (Phase 1, 2, 3)

---

## 🔲 Remaining Work by Phase

### Phase 2: Teacher Panel v1 (40% Complete)

#### High Priority
| Feature | Status | Effort | Files to Modify |
|---------|--------|--------|-----------------|
| Progress Tracking Dashboard | In Progress | 3-4 days | `teacher/app/(dashboard)/progress/` |
| Live Session Launcher | In Progress | 5-7 days | `core/app/classroom/` |
| Usage Analytics Panel | In Progress | 2-3 days | `teacher/app/(dashboard)/usage/` |
| Class Detail Improvements | In Progress | 2 days | `teacher/app/(dashboard)/classes/[id]/` |

#### Required to Complete Phase 2
| Feature | Status | Effort | Blocked By |
|---------|--------|--------|------------|
| **Per-Student Progress View** | Not Started | 3-4 days | Progress data model |
| **Quiz Score Aggregation** | Not Started | 2-3 days | Quiz taking (Phase 2) |
| **Live Session UI Controls** | Not Started | 4-5 days | Core classroom integration |
| **Token Usage Dashboard** | Not Started | 2 days | Backend metering |
| **CSV Bulk Student Import** | Partial | 1 day | Phone validation |

**Phase 2 Complete Estimate:** 15-20 days of work

---

### Phase 3: Student Quota + Plan Tiers (0% Started)

#### Required Features
| Feature | Status | Effort | Dependencies |
|---------|--------|--------|--------------|
| **Student Class Join Flow** | Not Built | 4-5 days | Invite code model |
| **Student Assignment View** | In Progress | 2-3 days | Assignment service |
| **Quiz Taking Interface** | Not Built | 5-7 days | Quiz builder (Phase 2) |
| **Student Progress Dashboard** | Not Built | 3-4 days | Progress tracking |
| **Plan Tier Selection UI** | Not Built | 2-3 days | Pricing page exists |
| **Quota System Backend** | Not Built | 5-7 days | User model, billing |
| **Usage Tracking Middleware** | Not Built | 3-4 days | Token metering |

**Phase 3 Complete Estimate:** 24-35 days of work

---

### Phase 4-10: Future (Not Started)

| Phase | Description | Status | Est. Duration |
|-------|-------------|--------|---------------|
| Phase 4 | Payment Integration | Not Started | 2-3 weeks |
| Phase 5 | AI Teaching Coach | Not Started | 3-4 weeks |
| Phase 6 | School Management | Not Started | 4-6 weeks |
| Phase 7 | Advanced Analytics | Not Started | 2-3 weeks |
| Phase 8 | Mobile App | Not Started | 6-8 weeks |
| Phase 9 | Whiteboard Plugins | Not Started | 3-4 weeks |
| Phase 10 | Platform Marketplace | Not Started | 8+ weeks |

---

## 📋 Detailed Feature Gaps

### Teacher Panel: Missing Features

#### 1. Progress Tracking Dashboard
**Path:** `teacher/app/(dashboard)/progress/`
**Status:** UI skeleton may exist, backend incomplete
**Effort:** 3-4 days
**Required:**
- Per-student completion rates
- Quiz score aggregation and trends
- Time-on-task metrics
- Export to CSV

```typescript
// Data model needed
interface StudentProgress {
  studentId: string
  classId: string
  assignmentsCompleted: number
  totalAssignments: number
  quizScores: QuizScore[]
  lastActive: Date
  timeSpentMinutes: number
}
```

#### 2. Live Classroom Session Launcher
**Path:** `teacher/app/(dashboard)/sessions/new`
**Status:** Core classroom exists, launching UI missing
**Effort:** 5-7 days
**Required:**
- Session configuration (duration, participants, AI personas)
- Waiting room UI
- Real-time participant list
- Session recording controls

#### 3. Usage Analytics Panel
**Path:** `teacher/app/(dashboard)/usage/`
**Status:** Basic tracking may exist
**Effort:** 2-3 days
**Required:**
- Token usage by feature
- Cost estimation per class
- AI response quality metrics
- Monthly usage trends

---

### Student Panel: Missing Features

#### 1. Class Join Flow
**Path:** `student/app/(auth)/join` and `student/app/(dashboard)/`
**Status:** NOT BUILT — critical blocker
**Effort:** 4-5 days
**Required:**
- Invite code input UI
- Code validation with backend
- Class assignment on join
- Welcome/onboarding flow

```typescript
// API needed
POST /api/student/classes/join
Body: { inviteCode: string }
Response: { classId, className, teacherName, assignments[] }
```

#### 2. Quiz Taking Interface
**Path:** `student/app/(classroom)/quiz/[id]/`
**Status:** NOT BUILT — major feature
**Effort:** 5-7 days
**Required:**
- Question display with formatting
- Answer selection (MCQ, true/false)
- Timer support
- Submit with confirmation
- Results display with explanations

#### 3. Student Progress Dashboard
**Path:** `student/app/(dashboard)/progress/`
**Status:** NOT BUILT
**Effort:** 3-4 days
**Required:**
- Overall completion percentage
- Upcoming assignments widget
- Past quiz scores
- Achievement badges

#### 4. Quota System Backend
**Path:** `server/` and `postgres/schema.sql`
**Status:** NOT BUILT — Phase 3 blocker
**Effort:** 5-7 days
**Required:**
- User plan tier model
- Quota limits per tier
- Token consumption tracking
- Quota warning notifications
- Rate limiting middleware

```sql
-- Schema needed
CREATE TABLE user_quotas (
  user_id UUID PRIMARY KEY,
  plan_tier TEXT NOT NULL DEFAULT 'basic',
  questions_used_this_month INT DEFAULT 0,
  questions_limit INT DEFAULT 50,
  images_used_this_month INT DEFAULT 0,
  images_limit INT DEFAULT 10,
  reset_at TIMESTAMP DEFAULT DATE_TRUNC('month', NOW())
);
```

---

## 📁 File Dependencies

### Critical Paths

#### Teacher Panel
```
teacher/app/
  (dashboard)/dashboard/page.tsx
  (dashboard)/assignments/page.tsx
  (dashboard)/classes/page.tsx
  (dashboard)/classes/[id]/page.tsx
  (dashboard)/quizzes/page.tsx
  (dashboard)/library/page.tsx
  (dashboard)/progress/page.tsx      ← NEEDS WORK
  (dashboard)/usage/page.tsx         ← NEEDS WORK
  api/assignments/
  api/classes/
  middleware.ts
```

#### Student Panel
```
student/app/
  (auth)/login/page.tsx
  (auth)/signup/page.tsx
  (dashboard)/dashboard/page.tsx
  (dashboard)/assignments/page.tsx    ← PARTIAL
  (dashboard)/progress/page.tsx       ← NEEDS WORK
  (classroom)/quiz/[id]/page.tsx     ← NEEDS WORK
  (classroom)/classroom/page.tsx
  api/
  middleware/
```

#### Database
```
postgres/
  schema.sql                         ← NEEDS: quotas table
  migrations/
  test_rls_policies.sql
```

#### Core (Immutable)
```
core/
  app/classroom/
  lib/ai/
  lib/orchestration/
  components/chat/
  components/whiteboard/
```

---

## 🧪 Testing Gaps

### Teacher Panel
| Feature | Test Status | Priority |
|---------|-------------|----------|
| Assignment creation | ⚠️ Partial E2E | High |
| Class management | ⚠️ Partial E2E | High |
| Progress tracking | ❌ Missing | High |
| Quiz builder | ⚠️ Partial | High |
| Usage analytics | ❌ Missing | Medium |

### Student Panel
| Feature | Test Status | Priority |
|---------|-------------|----------|
| Login/Auth | ⚠️ Partial | High |
| Class join | ❌ Missing | Critical |
| Quiz taking | ❌ Missing | Critical |
| Progress dashboard | ❌ Missing | High |

### Integration Tests
| Flow | Test Status | Priority |
|------|-------------|----------|
| Teacher → Create Assignment → Student sees it | ❌ Missing | Critical |
| Student → Join Class → See Assignments | ❌ Missing | Critical |
| Student → Take Quiz → Score recorded | ❌ Missing | Critical |
| Quota enforcement | ❌ Missing | High |

---

## 🚀 Phase Completion Estimates

### To Complete Phase 2 (Teacher MVP)

| Task | Effort | Parallelizable |
|------|--------|----------------|
| Progress tracking dashboard | 3-4 days | No |
| Per-student progress view | 3-4 days | Yes |
| Live session launcher | 5-7 days | No |
| Usage analytics panel | 2-3 days | Yes |
| Quiz score aggregation | 2-3 days | Yes |
| E2E tests for all flows | 3-4 days | Yes |
| **Phase 2 Total** | **18-25 days** | |

### To Complete Phase 3 (Student MVP)

| Task | Effort | Parallelizable |
|------|--------|----------------|
| Class join flow | 4-5 days | No |
| Student assignment view | 2-3 days | Yes |
| Quiz taking interface | 5-7 days | No |
| Student progress dashboard | 3-4 days | Yes |
| Quota system backend | 5-7 days | No |
| Plan tier UI integration | 2-3 days | Yes |
| E2E tests for all flows | 4-5 days | Yes |
| **Phase 3 Total** | **25-34 days** | |

### To Full Student Launch

| Milestone | Effort | Dependencies |
|-----------|--------|--------------|
| Phase 2 Complete (Teacher MVP) | ~20 days | Current |
| Phase 3 Complete (Student MVP) | ~30 days | Phase 2 |
| QA & Bug Fixes | ~10 days | Both phases |
| **Total to Launch** | **~60 days** | |

---

## 🎯 Release Criteria by Phase

### Phase 2 Release Criteria
- [ ] Teacher can create and assign quizzes
- [ ] Teacher can view per-student progress
- [ ] Teacher can track usage/analytics
- [ ] Teacher can launch live sessions
- [ ] All E2E flows passing
- [ ] Unit test coverage >60%

### Phase 3 Release Criteria
- [ ] Student can join via invite code
- [ ] Student can view and complete assignments
- [ ] Student can take quizzes and see scores
- [ ] Quota system enforces limits
- [ ] All E2E flows passing
- [ ] Load tested for 100 concurrent students

### Full Product Release Criteria
- [ ] Both teacher and student panels MVP complete
- [ ] Payment integration working
- [ ] Mobile-responsive (Phase 8)
- [ ] Documentation complete
- [ ] Onboarding flow tested
- [ ] Support system in place

---

## 📊 Comparison: VibeHire vs OpenMAIC

| Dimension | VibeHire | OpenMAIC |
|-----------|----------|----------|
| **MVP Status** | 91% Complete | ~40% Teacher, ~25% Student |
| **Time to MVP** | 2-3 weeks | 8-10 weeks |
| **Complexity** | Lower (2 services) | Higher (3 services + core) |
| **Testing Gaps** | 2-3 days work | 15+ days work |
| **Deployment** | Ready | Docker ready, deploy pending |
| **Earn Potential** | Shopify merchants (immediate) | Schools (longer sales cycle) |

---

*End of OpenMAIC Remaining Work Document*

**Note:** If choosing to continue OpenMAIC development, prioritize Phase 2 completion (Teacher MVP) before moving to Phase 3. The teacher panel has the clearest path to a shippable product.
