-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('teacher', 'student_classroom');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "ClassMembershipSource" AS ENUM ('manual', 'csv');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('draft', 'scheduled', 'released', 'closed');

-- CreateEnum
CREATE TYPE "AssignmentVisibilityStatus" AS ENUM ('hidden', 'visible', 'completed');

-- CreateEnum
CREATE TYPE "AssignmentCompletionState" AS ENUM ('pending', 'in_progress', 'submitted', 'graded');

-- CreateEnum
CREATE TYPE "ClassroomSessionStatus" AS ENUM ('DRAFT', 'LIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "SessionParticipantCompletionState" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LlmUsageActorRole" AS ENUM ('TEACHER', 'STUDENT_CLASSROOM', 'STUDENT_B2C');

-- CreateEnum
CREATE TYPE "ContentAssetType" AS ENUM ('SLIDE_DECK', 'QUIZ');

-- CreateEnum
CREATE TYPE "ContentAssetSourceKind" AS ENUM ('MANUAL', 'AI_GENERATED', 'IMPORTED');

-- CreateEnum
CREATE TYPE "ContentAssetVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SchedulerJobTargetType" AS ENUM ('ASSIGNMENT', 'NOTIFICATION');

-- CreateEnum
CREATE TYPE "SchedulerJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "LiveSessionStatus" AS ENUM ('LIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "LiveSessionParticipantCompletionState" AS ENUM ('PENDING', 'COMPLETED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone_e164" VARCHAR(20) NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT,
    "password_hash" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "user_agent" TEXT,
    "ip_hash" TEXT,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "batch" TEXT NOT NULL DEFAULT '',
    "join_code" TEXT NOT NULL,
    "peer_visibility_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_memberships" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "enrolled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "ClassMembershipSource" NOT NULL DEFAULT 'manual',

    CONSTRAINT "class_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "slide_asset_version_id" UUID,
    "quiz_asset_version_id" UUID,
    "release_at" TIMESTAMPTZ(6),
    "due_at" TIMESTAMPTZ(6),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_recipients" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "visibility_status" "AssignmentVisibilityStatus" NOT NULL DEFAULT 'hidden',
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_attempts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ(6),
    "score_percent" DOUBLE PRECISION,
    "answers_json" TEXT,
    "completion_state" "AssignmentCompletionState" NOT NULL DEFAULT 'pending',

    CONSTRAINT "assignment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_slide_progress" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "slide_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_slide_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_sessions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "core_classroom_id" TEXT,
    "status" "ClassroomSessionStatus" NOT NULL DEFAULT 'DRAFT',
    "started_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "max_duration_minutes" INTEGER NOT NULL DEFAULT 15,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classroom_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_participants" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),
    "completion_state" "SessionParticipantCompletionState" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_messages" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "question_text" TEXT NOT NULL,
    "answer_text" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered_at" TIMESTAMPTZ(6),

    CONSTRAINT "question_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_usage_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_user_id" UUID NOT NULL,
    "actor_role" "LlmUsageActorRole" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cached_tokens" INTEGER NOT NULL DEFAULT 0,
    "reasoning_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "request_id" TEXT,

    CONSTRAINT "llm_usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_assets" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "owner_teacher_id" UUID NOT NULL,
    "type" "ContentAssetType" NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "subject_tag" TEXT NOT NULL DEFAULT '',
    "source_kind" "ContentAssetSourceKind" NOT NULL DEFAULT 'MANUAL',
    "source_ref" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "content_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_asset_versions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "payload_json" TEXT NOT NULL DEFAULT '{}',
    "status" "ContentAssetVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_asset_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduler_jobs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "target_type" "SchedulerJobTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "run_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "SchedulerJobStatus" NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "scheduler_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_sessions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "state_snapshot_json" TEXT NOT NULL DEFAULT '{}',
    "status" "LiveSessionStatus" NOT NULL DEFAULT 'LIVE',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_session_participants" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "live_session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),
    "completion_state" "LiveSessionParticipantCompletionState" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "live_session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_session_questions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "question_text" TEXT NOT NULL,
    "answer_text" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered_at" TIMESTAMPTZ(6),

    CONSTRAINT "live_session_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_e164_key" ON "users"("phone_e164");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_phone" ON "users"("phone_e164");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_users_tenant" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_sessions_user" ON "auth_sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_sessions_expires" ON "auth_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "idx_sessions_tenant" ON "auth_sessions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "classes_join_code_key" ON "classes"("join_code");

-- CreateIndex
CREATE INDEX "idx_class_teacher" ON "classes"("teacher_id");

-- CreateIndex
CREATE INDEX "idx_class_join_code" ON "classes"("join_code");

-- CreateIndex
CREATE INDEX "idx_class_tenant" ON "classes"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_membership_class" ON "class_memberships"("class_id");

-- CreateIndex
CREATE INDEX "idx_membership_student" ON "class_memberships"("student_id");

-- CreateIndex
CREATE INDEX "idx_membership_tenant" ON "class_memberships"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_memberships_class_id_student_id_key" ON "class_memberships"("class_id", "student_id");

-- CreateIndex
CREATE INDEX "idx_assignments_teacher_status" ON "assignments"("teacher_id", "status");

-- CreateIndex
CREATE INDEX "idx_assignments_class_status" ON "assignments"("class_id", "status");

-- CreateIndex
CREATE INDEX "idx_assignments_tenant" ON "assignments"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_recipients_assignment" ON "assignment_recipients"("assignment_id");

-- CreateIndex
CREATE INDEX "idx_recipients_student" ON "assignment_recipients"("student_id");

-- CreateIndex
CREATE INDEX "idx_recipients_tenant" ON "assignment_recipients"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_recipients_assignment_id_student_id_key" ON "assignment_recipients"("assignment_id", "student_id");

-- CreateIndex
CREATE INDEX "idx_attempts_assignment_student" ON "assignment_attempts"("assignment_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_attempts_assignment_id_student_id_key" ON "assignment_attempts"("assignment_id", "student_id");

-- CreateIndex
CREATE INDEX "idx_slide_progress_assignment" ON "assignment_slide_progress"("assignment_id");

-- CreateIndex
CREATE INDEX "idx_slide_progress_student" ON "assignment_slide_progress"("student_id");

-- CreateIndex
CREATE INDEX "idx_slide_progress_tenant" ON "assignment_slide_progress"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_slide_progress_assignment_id_student_id_slide_id_key" ON "assignment_slide_progress"("assignment_id", "student_id", "slide_id");

-- CreateIndex
CREATE INDEX "idx_session_class" ON "classroom_sessions"("class_id");

-- CreateIndex
CREATE INDEX "idx_session_status" ON "classroom_sessions"("status");

-- CreateIndex
CREATE INDEX "idx_session_teacher" ON "classroom_sessions"("teacher_id");

-- CreateIndex
CREATE INDEX "idx_session_tenant" ON "classroom_sessions"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_participants_session" ON "session_participants"("session_id");

-- CreateIndex
CREATE INDEX "idx_participants_user" ON "session_participants"("user_id");

-- CreateIndex
CREATE INDEX "idx_participants_tenant" ON "session_participants"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_participants_session_id_user_id_key" ON "session_participants"("session_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_questions_session" ON "question_messages"("session_id");

-- CreateIndex
CREATE INDEX "idx_questions_student" ON "question_messages"("student_id");

-- CreateIndex
CREATE INDEX "idx_questions_tenant" ON "question_messages"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_usage_timestamp" ON "llm_usage_events"("timestamp");

-- CreateIndex
CREATE INDEX "idx_usage_actor" ON "llm_usage_events"("actor_user_id");

-- CreateIndex
CREATE INDEX "idx_usage_role" ON "llm_usage_events"("actor_role");

-- CreateIndex
CREATE INDEX "idx_usage_tenant" ON "llm_usage_events"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_content_assets_owner" ON "content_assets"("owner_teacher_id");

-- CreateIndex
CREATE INDEX "idx_content_assets_type" ON "content_assets"("type");

-- CreateIndex
CREATE INDEX "idx_content_assets_tenant" ON "content_assets"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_asset_versions_asset" ON "content_asset_versions"("asset_id");

-- CreateIndex
CREATE INDEX "idx_asset_versions_tenant" ON "content_asset_versions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_asset_versions_asset_id_version_number_key" ON "content_asset_versions"("asset_id", "version_number");

-- CreateIndex
CREATE INDEX "idx_scheduler_status_run_at" ON "scheduler_jobs"("status", "run_at");

-- CreateIndex
CREATE INDEX "idx_scheduler_tenant" ON "scheduler_jobs"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_live_sessions_assignment" ON "live_sessions"("assignment_id");

-- CreateIndex
CREATE INDEX "idx_live_sessions_teacher" ON "live_sessions"("teacher_id");

-- CreateIndex
CREATE INDEX "idx_live_sessions_status" ON "live_sessions"("status");

-- CreateIndex
CREATE INDEX "idx_live_sessions_tenant" ON "live_sessions"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_live_participants_session" ON "live_session_participants"("live_session_id");

-- CreateIndex
CREATE INDEX "idx_live_participants_user" ON "live_session_participants"("user_id");

-- CreateIndex
CREATE INDEX "idx_live_participants_tenant" ON "live_session_participants"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_session_participants_live_session_id_user_id_key" ON "live_session_participants"("live_session_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_live_questions_session" ON "live_session_questions"("session_id");

-- CreateIndex
CREATE INDEX "idx_live_questions_student" ON "live_session_questions"("student_id");

-- CreateIndex
CREATE INDEX "idx_live_questions_tenant" ON "live_session_questions"("tenant_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_memberships" ADD CONSTRAINT "class_memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_memberships" ADD CONSTRAINT "class_memberships_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_memberships" ADD CONSTRAINT "class_memberships_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_recipients" ADD CONSTRAINT "assignment_recipients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_recipients" ADD CONSTRAINT "assignment_recipients_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_recipients" ADD CONSTRAINT "assignment_recipients_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_attempts" ADD CONSTRAINT "assignment_attempts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_attempts" ADD CONSTRAINT "assignment_attempts_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_attempts" ADD CONSTRAINT "assignment_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_slide_progress" ADD CONSTRAINT "assignment_slide_progress_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_slide_progress" ADD CONSTRAINT "assignment_slide_progress_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_slide_progress" ADD CONSTRAINT "assignment_slide_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_sessions" ADD CONSTRAINT "classroom_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_sessions" ADD CONSTRAINT "classroom_sessions_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_sessions" ADD CONSTRAINT "classroom_sessions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "classroom_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_messages" ADD CONSTRAINT "question_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_messages" ADD CONSTRAINT "question_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "classroom_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_messages" ADD CONSTRAINT "question_messages_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_usage_events" ADD CONSTRAINT "llm_usage_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_usage_events" ADD CONSTRAINT "llm_usage_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_owner_teacher_id_fkey" FOREIGN KEY ("owner_teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_asset_versions" ADD CONSTRAINT "content_asset_versions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_asset_versions" ADD CONSTRAINT "content_asset_versions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "content_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduler_jobs" ADD CONSTRAINT "scheduler_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_participants" ADD CONSTRAINT "live_session_participants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_participants" ADD CONSTRAINT "live_session_participants_live_session_id_fkey" FOREIGN KEY ("live_session_id") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_participants" ADD CONSTRAINT "live_session_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_questions" ADD CONSTRAINT "live_session_questions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_questions" ADD CONSTRAINT "live_session_questions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_questions" ADD CONSTRAINT "live_session_questions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
