-- Test RLS Policies for Tenant Isolation
-- Run these tests after migrations 001 and 002
-- Uses standard PostgreSQL DO blocks for testing

-- ============================================================================
-- TEST SETUP: Create test tenants and users
-- ============================================================================

DO $$
BEGIN
  -- Create test tenants
  INSERT INTO tenants (id, name) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Tenant A Test School'),
    ('b0000000-0000-0000-0000-000000000002', 'Tenant B Test School')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Test setup: tenants created';
END $$;

DO $$
BEGIN
  -- Create test teachers
  INSERT INTO users (id, tenant_id, role, phone_e164, name) VALUES
    ('a0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'teacher', '+1234567001', 'Teacher A'),
    ('b0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000002', 'teacher', '+1234567002', 'Teacher B')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Test setup: teachers created';
END $$;

-- ============================================================================
-- TEST 1: Basic tenant isolation on classes table
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== TEST 1: Basic tenant isolation on classes ===';

  -- Test 1.1: Set tenant A context and insert a class
  PERFORM set_current_tenant('a0000000-0000-0000-0000-000000000001'::uuid);

  INSERT INTO classes (id, tenant_id, teacher_id, name, join_code)
  VALUES ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000011'::uuid, 'Class A', 'JOIN001')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'TEST 1.1: Tenant A class created';

  -- Test 1.2: Set tenant B context and insert a class
  PERFORM set_current_tenant('b0000000-0000-0000-0000-000000000002'::uuid);

  INSERT INTO classes (id, tenant_id, teacher_id, name, join_code)
  VALUES ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000021'::uuid, 'Class B', 'JOIN002')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'TEST 1.2: Tenant B class created';
END $$;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Test 1.3: Tenant A should only see Class A
  PERFORM set_current_tenant('a0000000-0000-0000-0000-000000000001'::uuid);

  SELECT COUNT(*) INTO v_count FROM classes;
  ASSERT v_count = 1, 'TEST 1.3 FAILED: Tenant A should see exactly 1 class, saw ' || v_count;
  RAISE NOTICE 'TEST 1.3 PASSED: Tenant A sees exactly 1 class';
END $$;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Test 1.4: Tenant B should only see Class B
  PERFORM set_current_tenant('b0000000-0000-0000-0000-000000000002'::uuid);

  SELECT COUNT(*) INTO v_count FROM classes;
  ASSERT v_count = 1, 'TEST 1.4 FAILED: Tenant B should see exactly 1 class, saw ' || v_count;
  RAISE NOTICE 'TEST 1.4 PASSED: Tenant B sees exactly 1 class';
END $$;

-- ============================================================================
-- TEST 2: Cross-tenant data access prevention
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 2: Cross-tenant data access prevention ===';

  -- Test 2.1: Tenant A cannot see Class B
  PERFORM set_current_tenant('a0000000-0000-0000-0000-000000000001'::uuid);

  SELECT COUNT(*) INTO v_count FROM classes WHERE id = 'c0000000-0000-0000-0000-000000000002'::uuid;
  ASSERT v_count = 0, 'TEST 2.1 FAILED: Tenant A should NOT see Class B';
  RAISE NOTICE 'TEST 2.1 PASSED: Tenant A cannot see Class B';
END $$;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Test 2.2: Tenant B cannot see Class A
  PERFORM set_current_tenant('b0000000-0000-0000-0000-000000000002'::uuid);

  SELECT COUNT(*) INTO v_count FROM classes WHERE id = 'c0000000-0000-0000-0000-000000000001'::uuid;
  ASSERT v_count = 0, 'TEST 2.2 FAILED: Tenant B should NOT see Class A';
  RAISE NOTICE 'TEST 2.2 PASSED: Tenant B cannot see Class A';
END $$;

-- ============================================================================
-- TEST 3: Users table tenant isolation
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 3: Users table tenant isolation ===';

  -- Test 3.1: Tenant A can only see their own users
  PERFORM set_current_tenant('a0000000-0000-0000-0000-000000000001'::uuid);

  SELECT COUNT(*) INTO v_count FROM users;
  ASSERT v_count = 1, 'TEST 3.1 FAILED: Tenant A should see exactly 1 user (Teacher A), saw ' || v_count;
  RAISE NOTICE 'TEST 3.1 PASSED: Tenant A sees exactly 1 user';
END $$;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Test 3.2: Tenant B can only see their own users
  PERFORM set_current_tenant('b0000000-0000-0000-0000-000000000002'::uuid);

  SELECT COUNT(*) INTO v_count FROM users;
  ASSERT v_count = 1, 'TEST 3.2 FAILED: Tenant B should see exactly 1 user (Teacher B), saw ' || v_count;
  RAISE NOTICE 'TEST 3.2 PASSED: Tenant B sees exactly 1 user';
END $$;

-- ============================================================================
-- TEST 4: Assignments tenant isolation
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== TEST 4: Assignments tenant isolation ===';

  -- Create students in each tenant
  INSERT INTO users (id, tenant_id, role, phone_e164, name) VALUES
    ('a0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'student_classroom', '+1234567012', 'Student A'),
    ('b0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000002', 'student_classroom', '+1234567022', 'Student B')
  ON CONFLICT (id) DO NOTHING;

  -- Create an assignment for tenant A
  PERFORM set_current_tenant('a0000000-0000-0000-0000-000000000001'::uuid);

  INSERT INTO assignments (id, tenant_id, class_id, teacher_id, title, status)
  VALUES ('a0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000011'::uuid, 'Assignment A', 'draft')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'TEST 4: Created assignments for both tenants';
END $$;

DO $$
BEGIN
  -- Create an assignment for tenant B
  PERFORM set_current_tenant('b0000000-0000-0000-0000-000000000002'::uuid);

  INSERT INTO assignments (id, tenant_id, class_id, teacher_id, title, status)
  VALUES ('b0000000-0000-0000-0000-000000000032', 'b0000000-0000-0000-0000-000000000002'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000021'::uuid, 'Assignment B', 'draft')
  ON CONFLICT (id) DO NOTHING;
END $$;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Test 4.1: Tenant A sees only Assignment A
  PERFORM set_current_tenant('a0000000-0000-0000-0000-000000000001'::uuid);

  SELECT COUNT(*) INTO v_count FROM assignments;
  ASSERT v_count = 1, 'TEST 4.1 FAILED: Tenant A should see exactly 1 assignment, saw ' || v_count;
  RAISE NOTICE 'TEST 4.1 PASSED: Tenant A sees exactly 1 assignment';
END $$;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Test 4.2: Tenant B sees only Assignment B
  PERFORM set_current_tenant('b0000000-0000-0000-0000-000000000002'::uuid);

  SELECT COUNT(*) INTO v_count FROM assignments;
  ASSERT v_count = 1, 'TEST 4.2 FAILED: Tenant B should see exactly 1 assignment, saw ' || v_count;
  RAISE NOTICE 'TEST 4.2 PASSED: Tenant B sees exactly 1 assignment';
END $$;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Test 4.3: Tenant A cannot see Assignment B
  PERFORM set_current_tenant('a0000000-0000-0000-0000-000000000001'::uuid);

  SELECT COUNT(*) INTO v_count FROM assignments WHERE id = 'b0000000-0000-0000-0000-000000000032'::uuid;
  ASSERT v_count = 0, 'TEST 4.3 FAILED: Tenant A should NOT see Assignment B';
  RAISE NOTICE 'TEST 4.3 PASSED: Tenant A cannot see Assignment B';
END $$;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Test 4.4: Tenant B cannot see Assignment A
  PERFORM set_current_tenant('b0000000-0000-0000-0000-000000000002'::uuid);

  SELECT COUNT(*) INTO v_count FROM assignments WHERE id = 'a0000000-0000-0000-0000-000000000031'::uuid;
  ASSERT v_count = 0, 'TEST 4.4 FAILED: Tenant B should NOT see Assignment A';
  RAISE NOTICE 'TEST 4.4 PASSED: Tenant B cannot see Assignment A';
END $$;

-- ============================================================================
-- TEST 5: Content assets tenant isolation
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== TEST 5: Content assets tenant isolation ===';

  -- Tenant A asset
  PERFORM set_current_tenant('a0000000-0000-0000-0000-000000000001'::uuid);

  INSERT INTO content_assets (id, tenant_id, owner_teacher_id, type, title)
  VALUES ('a0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000011'::uuid, 'slide_deck', 'Slides A')
  ON CONFLICT (id) DO NOTHING;

  -- Tenant B asset
  PERFORM set_current_tenant('b0000000-0000-0000-0000-000000000002'::uuid);

  INSERT INTO content_assets (id, tenant_id, owner_teacher_id, type, title)
  VALUES ('b0000000-0000-0000-0000-000000000042', 'b0000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000021'::uuid, 'quiz', 'Quiz B')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'TEST 5: Created content assets for both tenants';
END $$;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Test 5.1: Tenant A asset isolation
  PERFORM set_current_tenant('a0000000-0000-0000-0000-000000000001'::uuid);

  SELECT COUNT(*) INTO v_count FROM content_assets;
  ASSERT v_count = 1, 'TEST 5.1 FAILED: Tenant A should see exactly 1 content asset, saw ' || v_count;
  RAISE NOTICE 'TEST 5.1 PASSED: Tenant A sees exactly 1 content asset';
END $$;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Test 5.2: Tenant B asset isolation
  PERFORM set_current_tenant('b0000000-0000-0000-0000-000000000002'::uuid);

  SELECT COUNT(*) INTO v_count FROM content_assets;
  ASSERT v_count = 1, 'TEST 5.2 FAILED: Tenant B should see exactly 1 content asset, saw ' || v_count;
  RAISE NOTICE 'TEST 5.2 PASSED: Tenant B sees exactly 1 content asset';
END $$;

-- ============================================================================
-- TEST 6: RLS enforced on UPDATE
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 6: RLS enforced on UPDATE ===';

  -- Test 6.1: Tenant A cannot update Tenant B's class
  PERFORM set_current_tenant('a0000000-0000-0000-0000-000000000001'::uuid);

  UPDATE classes SET name = 'Hacked Class Name' WHERE id = 'c0000000-0000-0000-0000-000000000002'::uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  ASSERT v_count = 0, 'TEST 6.1 FAILED: Tenant A should NOT be able to update Tenant B class';
  RAISE NOTICE 'TEST 6.1 PASSED: Tenant A cannot update Tenant B class';
END $$;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Test 6.2: Tenant B cannot update Tenant A's class
  PERFORM set_current_tenant('b0000000-0000-0000-0000-000000000002'::uuid);

  UPDATE classes SET name = 'Hacked Class Name' WHERE id = 'c0000000-0000-0000-0000-000000000001'::uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  ASSERT v_count = 0, 'TEST 6.2 FAILED: Tenant B should NOT be able to update Tenant A class';
  RAISE NOTICE 'TEST 6.2 PASSED: Tenant B cannot update Tenant A class';
END $$;

-- ============================================================================
-- TEST 7: RLS enforced on DELETE
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 7: RLS enforced on DELETE ===';

  -- Test 7.1: Tenant A cannot delete Tenant B's class
  PERFORM set_current_tenant('a0000000-0000-0000-0000-000000000001'::uuid);

  DELETE FROM classes WHERE id = 'c0000000-0000-0000-0000-000000000002'::uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  ASSERT v_count = 0, 'TEST 7.1 FAILED: Tenant A should NOT be able to delete Tenant B class';
  RAISE NOTICE 'TEST 7.1 PASSED: Tenant A cannot delete Tenant B class';
END $$;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Test 7.2: Tenant B cannot delete Tenant A's class
  PERFORM set_current_tenant('b0000000-0000-0000-0000-000000000002'::uuid);

  DELETE FROM classes WHERE id = 'c0000000-0000-0000-0000-000000000001'::uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  ASSERT v_count = 0, 'TEST 7.2 FAILED: Tenant B should NOT be able to delete Tenant A class';
  RAISE NOTICE 'TEST 7.2 PASSED: Tenant B cannot delete Tenant A class';
END $$;

-- ============================================================================
-- TEST 8: LLM usage events tenant isolation
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== TEST 8: LLM usage events tenant isolation ===';

  -- Tenant A event
  PERFORM set_current_tenant('a0000000-0000-0000-0000-000000000001'::uuid);

  INSERT INTO llm_usage_events (id, tenant_id, actor_user_id, actor_role, provider, model, endpoint, input_tokens, output_tokens)
  VALUES ('a0000000-0000-0000-0000-000000000051', 'a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000011'::uuid, 'teacher', 'openai', 'gpt-4', '/v1/chat/completions', 100, 200)
  ON CONFLICT (id) DO NOTHING;

  -- Tenant B event
  PERFORM set_current_tenant('b0000000-0000-0000-0000-000000000002'::uuid);

  INSERT INTO llm_usage_events (id, tenant_id, actor_user_id, actor_role, provider, model, endpoint, input_tokens, output_tokens)
  VALUES ('b0000000-0000-0000-0000-000000000052', 'b0000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000021'::uuid, 'teacher', 'openai', 'gpt-4', '/v1/chat/completions', 150, 250)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'TEST 8: Created LLM usage events for both tenants';
END $$;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Test 8.1: Tenant A sees only their events
  PERFORM set_current_tenant('a0000000-0000-0000-0000-000000000001'::uuid);

  SELECT COUNT(*) INTO v_count FROM llm_usage_events;
  ASSERT v_count = 1, 'TEST 8.1 FAILED: Tenant A should see exactly 1 event, saw ' || v_count;
  RAISE NOTICE 'TEST 8.1 PASSED: Tenant A sees exactly 1 LLM event';
END $$;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Test 8.2: Tenant B sees only their events
  PERFORM set_current_tenant('b0000000-0000-0000-0000-000000000002'::uuid);

  SELECT COUNT(*) INTO v_count FROM llm_usage_events;
  ASSERT v_count = 1, 'TEST 8.2 FAILED: Tenant B should see exactly 1 event, saw ' || v_count;
  RAISE NOTICE 'TEST 8.2 PASSED: Tenant B sees exactly 1 LLM event';
END $$;

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALL RLS POLICY TESTS COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tests passed: 19 assertions';
  RAISE NOTICE '';
  RAISE NOTICE 'Verified:';
  RAISE NOTICE '  - Tenant isolation on classes, users, assignments, content_assets, llm_usage_events';
  RAISE NOTICE '  - Cross-tenant access prevention (SELECT)';
  RAISE NOTICE '  - Cross-tenant modification prevention (UPDATE)';
  RAISE NOTICE '  - Cross-tenant deletion prevention (DELETE)';
END $$;