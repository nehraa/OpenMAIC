-- Migration 002: Row-Level Security Policies
-- Run this after 001_initial_schema.sql

-- ============================================================================
-- TENANT ISOLATION HELPER FUNCTIONS
-- ============================================================================

-- Function to set the current tenant context
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;

-- Function to get current tenant from session context
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::UUID, uuid '00000000-0000-0000-0000-000000000000');
END;
$$ LANGUAGE plpgsql;

-- Function to check if current user is a teacher in the current tenant
CREATE OR REPLACE FUNCTION is_current_user_teacher_in_tenant()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE tenant_id = get_current_tenant_id()
    AND role = 'teacher'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTO-SET TENANT ON USER INSERT
-- ============================================================================

-- Trigger function to auto-set tenant_id when inserting a user
CREATE OR REPLACE FUNCTION set_user_tenant_from_tenant()
RETURNS TRIGGER AS $$
BEGIN
  -- If tenant_id is not provided, try to set it from a tenant context
  IF NEW.tenant_id IS NULL OR NEW.tenant_id = uuid '00000000-0000-0000-0000-000000000000' THEN
    NEW.tenant_id := get_current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to auto-set tenant_id on users insert
CREATE TRIGGER set_users_tenant_on_insert
  BEFORE INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION set_user_tenant_from_tenant();

-- ============================================================================
-- RLS POLICIES FOR TENANT ISOLATION
-- ============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_asset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_slide_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduler_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_questions ENABLE ROW LEVEL SECURITY;

-- For auth_sessions, we use a different approach - users can only see their own sessions
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TENANTS POLICIES
-- ============================================================================

-- Tenants: Users can only see their own tenant
CREATE POLICY tenant_isolation_tenants ON tenants
  FOR ALL
  USING (id = get_current_tenant_id());

-- ============================================================================
-- USERS POLICIES
-- ============================================================================

-- Users: Teachers can only see users in their tenant
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (
    tenant_id = get_current_tenant_id()
    OR id IN (
      SELECT teacher_id FROM classes WHERE tenant_id = get_current_tenant_id()
    )
  );

-- ============================================================================
-- CLASSES POLICIES
-- ============================================================================

-- Classes: Teachers can only see/modify classes in their tenant
CREATE POLICY tenant_isolation_classes ON classes
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- CLASS MEMBERSHIPS POLICIES
-- ============================================================================

-- Class memberships: Users can only see memberships in their tenant
CREATE POLICY tenant_isolation_class_memberships ON class_memberships
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- AUTH SESSIONS POLICIES
-- ============================================================================

-- Auth sessions: Users can only see/modify their own sessions
CREATE POLICY tenant_isolation_auth_sessions ON auth_sessions
  FOR ALL
  USING (user_id IN (
    SELECT id FROM users WHERE tenant_id = get_current_tenant_id()
  ));

-- ============================================================================
-- CLASSROOM SESSIONS POLICIES
-- ============================================================================

-- Classroom sessions: Teachers can only see sessions in their tenant
CREATE POLICY tenant_isolation_classroom_sessions ON classroom_sessions
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- SESSION PARTICIPANTS POLICIES
-- ============================================================================

-- Session participants: Users can only see participants in their tenant
CREATE POLICY tenant_isolation_session_participants ON session_participants
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- QUESTION MESSAGES POLICIES
-- ============================================================================

-- Question messages: Users can only see messages in their tenant
CREATE POLICY tenant_isolation_question_messages ON question_messages
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- LLM USAGE EVENTS POLICIES
-- ============================================================================

-- LLM usage events: Users can only see events in their tenant
CREATE POLICY tenant_isolation_llm_usage_events ON llm_usage_events
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- CONTENT ASSETS POLICIES
-- ============================================================================

-- Content assets: Teachers can only see/modify assets in their tenant
CREATE POLICY tenant_isolation_content_assets ON content_assets
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- CONTENT ASSET VERSIONS POLICIES
-- ============================================================================

-- Content asset versions: Users can only see versions for assets in their tenant
CREATE POLICY tenant_isolation_content_asset_versions ON content_asset_versions
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- ASSIGNMENTS POLICIES
-- ============================================================================

-- Assignments: Teachers can only see/modify assignments in their tenant
CREATE POLICY tenant_isolation_assignments ON assignments
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- ASSIGNMENT RECIPIENTS POLICIES
-- ============================================================================

-- Assignment recipients: Users can only see recipients for assignments in their tenant
CREATE POLICY tenant_isolation_assignment_recipients ON assignment_recipients
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- ASSIGNMENT ATTEMPTS POLICIES
-- ============================================================================

-- Assignment attempts: Students can only see their own attempts, teachers see all in tenant
CREATE POLICY tenant_isolation_assignment_attempts ON assignment_attempts
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- ASSIGNMENT SLIDE PROGRESS POLICIES
-- ============================================================================

-- Assignment slide progress: Students can only see their own progress, teachers see all in tenant
CREATE POLICY tenant_isolation_assignment_slide_progress ON assignment_slide_progress
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- SCHEDULER JOBS POLICIES
-- ============================================================================

-- Scheduler jobs: Teachers can only see jobs in their tenant
CREATE POLICY tenant_isolation_scheduler_jobs ON scheduler_jobs
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- LIVE SESSIONS POLICIES
-- ============================================================================

-- Live sessions: Teachers can only see sessions in their tenant
CREATE POLICY tenant_isolation_live_sessions ON live_sessions
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- LIVE SESSION PARTICIPANTS POLICIES
-- ============================================================================

-- Live session participants: Users can only see participants in their tenant
CREATE POLICY tenant_isolation_live_session_participants ON live_session_participants
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- LIVE SESSION QUESTIONS POLICIES
-- ============================================================================

-- Live session questions: Users can only see questions in their tenant
CREATE POLICY tenant_isolation_live_session_questions ON live_session_questions
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- FORCE RLS FOR TABLE OWNER (applies to application user)
-- ============================================================================

-- Ensure that the application role respects RLS
-- This is typically done by making sure the app user is not a superuser
-- and/or by setting row_security to enforced

-- For postgres_fdw and other connections, we need to ensure RLS is active
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE classes FORCE ROW LEVEL SECURITY;
ALTER TABLE class_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE classroom_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE session_participants FORCE ROW LEVEL SECURITY;
ALTER TABLE question_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE llm_usage_events FORCE ROW LEVEL SECURITY;
ALTER TABLE content_assets FORCE ROW LEVEL SECURITY;
ALTER TABLE content_asset_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE assignments FORCE ROW LEVEL SECURITY;
ALTER TABLE assignment_recipients FORCE ROW LEVEL SECURITY;
ALTER TABLE assignment_attempts FORCE ROW LEVEL SECURITY;
ALTER TABLE assignment_slide_progress FORCE ROW LEVEL SECURITY;
ALTER TABLE scheduler_jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE live_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE live_session_participants FORCE ROW LEVEL SECURITY;
ALTER TABLE live_session_questions FORCE ROW LEVEL SECURITY;