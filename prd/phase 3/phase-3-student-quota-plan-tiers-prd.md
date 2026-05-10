# Aidutech / OpenMAIC
# Phase 3 PRD - Student Quota and Plan Tiers

## 1. Document Control

- Owner: Product + Engineering
- Prepared by: GitHub Copilot
- Date: 2026-04-26
- Status: Draft for implementation
- Scope source: roadmap.md, Phase 3 sections 3.1, 3.2, 3.3, 3.4, 3.5
- Dependencies: Phase 1 identity and role baseline, Phase 2 assignment and progress baseline

## 2. Executive Summary

Phase 3 introduces monetization-ready controls and student self-service governance without implementing payment rails yet.

Primary outcomes:

1. Plan-tier model for student access.
2. Question quota enforcement by plan.
3. B2C and classroom mode separation with route-level guardrails.
4. Zero-token repeat consumption through content caching.
5. Student usage dashboard for transparency and engagement.

This phase prepares the platform for Phase 4 payments while reducing token burn and improving UX visibility.

## 3. Scope Mapping to Roadmap

## 3.1 In Scope

1. Plan Tier System (3.1)
- Three plans: Basic 1000 INR, Image 2000 INR, Video 3000 INR.
- Plan comparison visible at signup.
- Student selects plan during signup.
- Plan persisted in student record.

2. Question Quota Per Plan (3.2)
- Basic: 20 questions per month.
- Image: 100 questions per month.
- Video: unlimited questions.
- Remaining counter visible in student question UI.
- Upgrade prompt shown at quota zero.
- Monthly reset on first day of month.

3. B2C Student Workspace (3.5)
- Preserve current OpenMAIC self-serve prompting for B2C students.
- Enforce mode separation between classroom student and B2C student.
- Separate routing and authorization guardrails by mode.

4. Slide and Quiz View Caching (3.3)
- First view computes and logs token usage.
- Subsequent eligible views serve from cache.
- Revisit behavior uses cache when valid.
- Quiz attempt caching follows first-attempt logging plus repeat reuse policy.

5. Student Usage Dashboard (3.4)
- Questions used and remaining.
- Quiz score history.
- Homework pending and completed.
- Session history with dates.

## 3.2 Out of Scope

1. Payment collection, webhooks, and invoicing flows.
2. Referral commissions and institute payouts.
3. Teacher billing and school license flows.
4. Parent and school admin analytics views.

## 4. Current Baseline and Gap Analysis

## 4.1 Existing reusable capabilities

1. Existing generation and classroom pipelines are available for B2C reuse.
- core/app/api/chat/route.ts
- core/app/api/generate-classroom/route.ts
- core/lib/server/classroom-generation.ts

2. Existing quiz grading and persistence primitives can feed dashboard metrics.
- core/components/scene-renderers/quiz-view.tsx
- core/lib/quiz/grading.ts
- core/lib/quiz/persistence.ts

3. Existing token usage UI widgets exist, but they are request-level and not account-level.
- core/components/ai-elements/context.tsx

4. Existing local cache mechanisms exist for draft and media concerns, not plan quota concerns.
- core/lib/hooks/use-draft-cache.ts
- core/app/api/classroom-media/[classroomId]/[...path]/route.ts

## 4.2 Confirmed gaps for Phase 3

1. No student plan entity and no plan assignment flow.
2. No account-level monthly quota ledger.
3. No quota middleware around question endpoints.
4. No B2C versus classroom mode split with explicit route constraints.
5. No shared content cache model tied to token savings accounting.
6. No student-facing usage dashboard backed by persisted metrics.

## 5. Product Objectives

1. Make usage limits clear and enforceable before payment rollout.
2. Protect platform token economics with deterministic quota controls.
3. Keep classroom student mode strictly read-only while preserving B2C power-user capability.
4. Cut repeated token spend for identical content views through cache strategy.
5. Improve student trust with transparent usage and learning history.

## 6. Success Metrics

1. 100 percent of question requests pass quota check before model invocation.
2. Cache hit ratio above 60 percent for repeated slide and quiz consumptions after two weeks.
3. Student dashboard data freshness under 10 seconds for usage counters.
4. Quota reset job success rate above 99.9 percent monthly.
5. Zero unauthorized prompting events from classroom student mode.

## 7. Users and Access Model

## 7.1 Roles in Phase 3

1. student_classroom
- Read-only classroom participation.
- Can ask questions only within allowed classroom policy.
- No self-serve generation controls.

2. student_b2c
- Full self-serve prompting and generation.
- Subject to selected plan quota policy.

3. teacher
- Unchanged in this phase, but can observe assignment and progress from previous phase work.

## 7.2 Permission boundaries

1. B2C generation endpoints reject student_classroom actors.
2. Classroom consumption endpoints reject cross-class non-members.
3. Quota enforcement applies to student_b2c prompts and question flows according to policy flags.

## 8. Functional Requirements

## 8.1 FR-3.1 Plan Tier System

1. Signup flow shows plan comparison and stores selected plan.
2. Plan metadata includes monthly question allowance and feature flags.
3. Student can view active plan in account area.

Acceptance criteria:

1. New student cannot proceed without plan selection.
2. Student record includes plan identifier and activation date.
3. Plan can be changed through admin tooling for operational support.

## 8.2 FR-3.2 Question Quota Engine

1. Every question request checks monthly remaining quota.
2. Allowed request decrements quota atomically.
3. Exhausted quota returns upgrade required response payload.
4. Quota resets automatically on first day of month.

Acceptance criteria:

1. Basic plan hard-stops at 20 monthly questions.
2. Image plan hard-stops at 100 monthly questions.
3. Video plan never blocks for quota exhaustion.
4. Counter in student UI matches backend ledger values.

## 8.3 FR-3.5 B2C Workspace Separation

1. Routing differentiates classroom student and B2C student journeys.
2. Classroom student receives read-only viewer plus question controls only.
3. B2C student receives full generation and prompting toolchain.

Acceptance criteria:

1. Classroom student cannot access B2C generation route group.
2. B2C student cannot accidentally inherit classroom-only restrictions.
3. Role and mode checks exist on both client and server boundaries.

## 8.4 FR-3.3 Content Caching for Zero Token Repeat Cost

1. First content generation stores response in shared cache.
2. Subsequent equivalent requests return cached output without model call.
3. Student-specific attempt history is tracked separately from shared output cache.
4. Cache invalidation policy handles content version changes.

Acceptance criteria:

1. Same content hash repeat request returns cache hit with no model invocation.
2. Cache hit and miss events are logged for analytics.
3. Quiz repeat attempt behavior follows policy and keeps per-student history coherent.

## 8.5 FR-3.4 Student Usage Dashboard

1. Student can view questions used and remaining in current month.
2. Student can view quiz score history and trends.
3. Student can view pending and completed homework count.
4. Student can view session history with timestamps.

Acceptance criteria:

1. Dashboard loads under 500 ms for recent 90-day window.
2. Values align with source tables and quota ledger.

## 9. Data Model Design

## 9.1 New entities

1. plans
- id (pk)
- code (basic | image | video)
- name
- monthly_question_limit (nullable for unlimited)
- price_inr
- feature_flags_json
- created_at
- updated_at

2. student_plan_subscriptions
- id (pk)
- student_id (fk users.id)
- plan_id (fk plans.id)
- status (active | canceled | superseded)
- starts_at
- ends_at (nullable)
- created_at

3. quota_periods
- id (pk)
- student_id (fk users.id)
- period_key (YYYY-MM)
- monthly_limit
- used_count
- remaining_count
- reset_at
- created_at
- updated_at

4. question_events
- id (pk)
- student_id
- actor_role
- mode (classroom | b2c)
- endpoint
- request_hash
- outcome (allowed | blocked | cached)
- quota_delta
- created_at

5. content_cache_entries
- id (pk)
- content_hash
- content_type (slide | quiz | answer)
- payload_json
- source_model
- token_cost_input
- token_cost_output
- created_at
- expires_at
- invalidated_at (nullable)

6. content_cache_hits
- id (pk)
- cache_entry_id
- student_id
- request_context
- created_at

7. student_content_history
- id (pk)
- student_id
- content_hash
- content_type
- first_seen_at
- last_seen_at
- seen_count

8. student_usage_daily
- id (pk)
- student_id
- date_key
- questions_used
- cache_hits
- sessions_count
- quiz_attempts_count

## 9.2 Integrity and concurrency rules

1. Quota decrement must be atomic and idempotent per request hash.
2. Quota period unique key on student_id plus period_key.
3. Cache entry uniqueness on content_hash plus content_type plus version marker.
4. History upsert merges first_seen_at and increments seen_count.

## 10. Caching Strategy Design

## 10.1 Key model

1. Shared output cache key
- content_hash plus content_type plus template_version

2. Per-student history key
- student_id plus content_hash plus content_type

This dual-key model satisfies both goals:

1. Shared cache for zero-token repeat delivery.
2. Per-student timeline and attempt history.

## 10.2 Cache policy

1. Populate on first successful generation.
2. Read-through cache before model call.
3. Time-to-live defaults by type:
- slides: 30 days
- quiz: 30 days
- answer: 7 days
4. Explicit invalidation on source content version changes.

## 10.3 Logging and accounting

1. Cache miss with model call logs full token usage event.
2. Cache hit logs cached event with zero token spend.
3. Dashboard and finance reports can derive savings from misses versus hits.

## 11. API Design

## 11.1 Plan and subscription APIs

- GET /api/student/plans
- POST /api/student/plan/select
- GET /api/student/plan/current

## 11.2 Quota APIs

- GET /api/student/quota/status
- POST /api/student/quota/check-and-reserve
- POST /api/internal/quota/reset-monthly

## 11.3 B2C and classroom mode APIs

- GET /api/student/mode
- POST /api/student/mode/switch (if policy allows)
- B2C generation routes under dedicated namespace
- Classroom read-only routes under dedicated namespace

## 11.4 Cache APIs

- POST /api/internal/cache/resolve
- POST /api/internal/cache/store
- POST /api/internal/cache/invalidate

## 11.5 Student dashboard APIs

- GET /api/student/dashboard/usage
- GET /api/student/dashboard/quiz-history
- GET /api/student/dashboard/homework-summary
- GET /api/student/dashboard/session-history

## 12. UX Requirements

## 12.1 Plan comparison and selection

1. Plan cards show price, quota, and key feature differences.
2. Selection confirmation appears before account activation.
3. Current plan badge is shown in account header.

## 12.2 Quota feedback in question UI

1. Remaining question counter is always visible.
2. Counter updates instantly after each allowed question.
3. Zero state shows upgrade CTA and reason text.

## 12.3 Dashboard views

1. Summary tiles for used, remaining, pending homework, completed homework.
2. Quiz score chart with date axis.
3. Session history list with date and duration.

## 13. Non-Functional Requirements

1. Security
- Role and mode checks enforced server-side for all protected routes.
- Quota APIs protected against replay and double decrement.

2. Performance
- Quota check and reserve endpoint p95 under 120 ms.
- Dashboard aggregate endpoint p95 under 500 ms.

3. Reliability
- Monthly reset job supports retries and idempotent execution.
- Cache store failures do not block primary response path.

4. Observability
- Quota block, cache hit, cache miss, and plan-change events logged with request IDs.

## 14. Solo Developer Implementation Subphases

### Subphase 1 - Plan catalog and subscription foundation

Objective
- Build plan entities, APIs, and signup selection flow.

Deliverables
- plans and student_plan_subscriptions tables
- plan list and select endpoints
- signup plan selection UI

Estimate
- 3 to 4 days

Definition of done
- Student account includes active plan at signup completion.

### Subphase 2 - Quota ledger and enforcement middleware

Objective
- Implement monthly quota periods and atomic check and decrement.

Deliverables
- quota_periods and question_events tables
- quota middleware around question endpoints
- upgrade-required response model

Estimate
- 5 to 6 days

Definition of done
- Quota limits enforce correctly for Basic and Image plans.

### Subphase 3 - B2C and classroom route separation

Objective
- Enforce strict mode-specific routing and authorization.

Deliverables
- route namespaces and guard middleware
- classroom student prompt prevention checks
- B2C self-serve access validation

Estimate
- 4 to 5 days

Definition of done
- Classroom student cannot access B2C prompt endpoints.

### Subphase 4 - Shared cache and student history layer

Objective
- Add zero-token repeat content delivery and usage logging.

Deliverables
- content_cache_entries and content_cache_hits tables
- read-through cache integration on relevant endpoints
- student_content_history upsert logic

Estimate
- 5 to 6 days

Definition of done
- Repeat equivalent requests return cache hits with zero model calls.

### Subphase 5 - Student usage dashboard

Objective
- Deliver student-facing usage and learning history pages.

Deliverables
- dashboard APIs for usage, quiz history, homework, sessions
- student dashboard UI widgets and charts
- near-real-time counter refresh

Estimate
- 4 to 5 days

Definition of done
- Dashboard reflects quota and activity with validated data parity.

### Subphase 6 - Monthly reset scheduler and hardening

Objective
- Implement reset automation and production-grade reliability checks.

Deliverables
- monthly reset job and reconciliation script
- retry and alerting hooks
- runbook documentation and smoke tests

Estimate
- 3 to 4 days

Definition of done
- Reset job runs idempotently and updates all eligible students.

### Subphase 7 - Integration and release readiness

Objective
- Final quality pass before entering payment phase.

Deliverables
- full regression suite for plans, quotas, cache, dashboard
- permission boundary tests
- performance checks for key endpoints

Estimate
- 3 to 4 days

Definition of done
- Phase 3 acceptance criteria complete and release gates passed.

## 15. Testing Strategy

1. Unit tests
- Quota check and decrement logic.
- Cache key generation and invalidation logic.
- Plan selection validation and state transitions.

2. Integration tests
- Signup plan selection to quota period initialization.
- Question request path with allow, block, and cache outcomes.
- Monthly reset workflow with retry simulation.

3. End-to-end tests
- Basic plan user consumes 20 questions and is blocked on 21st.
- Image plan user consumes 100 questions and sees block behavior on 101st.
- Video plan user remains unrestricted.
- Classroom student blocked from B2C prompt routes.

4. Data consistency tests
- Dashboard used and remaining counters match quota_periods and question_events.
- Cache hit counts match cache hit table events.

## 16. Risks and Mitigations

1. Risk: quota race conditions under rapid concurrent requests.
- Mitigation: transactional decrement with request hash idempotency.

2. Risk: stale cache serving outdated content.
- Mitigation: versioned cache keys and explicit invalidation on content publish.

3. Risk: mode misclassification between classroom and B2C students.
- Mitigation: explicit actor mode field and mandatory server validation on every request.

4. Risk: dashboard trust erosion if counters drift.
- Mitigation: single source of truth in quota tables plus daily reconciliation checks.

## 17. Release Gates

1. Plan selection and quota enforcement pass all acceptance tests.
2. Classroom and B2C mode separation passes security tests.
3. Cache layer achieves target hit ratio in staging replay tests.
4. Monthly reset dry-run and production runbook validated.
5. Student dashboard data parity checks pass.

## 18. Milestone Timeline (Single Developer)

Estimated duration: 27 to 34 working days.

1. Subphases 1 to 3 establish governance and access controls.
2. Subphases 4 and 5 deliver economics and visibility layers.
3. Subphases 6 and 7 deliver automation and release hardening.

## 19. Immediate Next Actions

1. Approve Phase 3 PRD as engineering baseline.
2. Create implementation epics mapped to Subphases 1 through 7.
3. Define migration order for new quota and cache tables.
4. Start Subphase 1 with plan catalog and signup selection UX.
