-- Demo seed script for AIDU
-- Run: psql -d aidutech -f scripts/seed-demo.sql

-- Hashes: Demo2024! and Student2024! (bcrypt cost 12)
DO $$
DECLARE
  demo_teacher_id UUID := 'b0000001-0000-0000-0000-000000000001';
  demo_tenant_id  UUID := 'b0000001-0000-0000-0000-000000000002';
  class_math_id   UUID := 'c0000002-0000-0000-0000-000000000001';
  class_sci_id    UUID := 'c0000002-0000-0000-0000-000000000002';
  class_eng_id    UUID := 'c0000002-0000-0000-0000-000000000003';

  -- asset IDs
  asset_slides1   UUID := 'd0000001-0000-0000-0000-000000000001';
  asset_slides2   UUID := 'd0000001-0000-0000-0000-000000000002';
  asset_slides3   UUID := 'd0000001-0000-0000-0000-000000000003';
  asset_quiz1     UUID := 'd0000001-0000-0000-0000-000000000004';
  asset_quiz2     UUID := 'd0000001-0000-0000-0000-000000000005';

  -- asset version IDs
  av1 UUID := 'd0000002-0000-0000-0000-000000000001';
  av2 UUID := 'd0000002-0000-0000-0000-000000000002';
  av3 UUID := 'd0000002-0000-0000-0000-000000000003';
  av4 UUID := 'd0000002-0000-0000-0000-000000000004';
  av5 UUID := 'd0000002-0000-0000-0000-000000000005';

  -- assignment IDs
  asn1 UUID := 'e0000001-0000-0000-0000-000000000001';
  asn2 UUID := 'e0000001-0000-0000-0000-000000000002';
  asn3 UUID := 'e0000001-0000-0000-0000-000000000003';
  asn4 UUID := 'e0000001-0000-0000-0000-000000000004';
  asn5 UUID := 'e0000001-0000-0000-0000-000000000005';
  asn6 UUID := 'e0000001-0000-0000-0000-000000000006';

  s1 UUID := 'a0000001-0000-0000-0000-000000000001';
  s2 UUID := 'a0000001-0000-0000-0000-000000000002';
  s3 UUID := 'a0000001-0000-0000-0000-000000000003';
  s4 UUID := 'a0000001-0000-0000-0000-000000000004';
  s5 UUID := 'a0000001-0000-0000-0000-000000000005';
  s6 UUID := 'a0000001-0000-0000-0000-000000000006';
  s7 UUID := 'a0000001-0000-0000-0000-000000000007';
  s8 UUID := 'a0000001-0000-0000-0000-000000000008';
  s9 UUID := 'a0000001-0000-0000-0000-000000000009';
  s10 UUID := 'a0000001-0000-0000-0000-000000000010';

BEGIN

-- ============================================================
-- 1. DEMO TENANT
-- ============================================================
INSERT INTO tenants (id, name) VALUES
  (demo_tenant_id, 'AIDU Demo School')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ============================================================
-- 2. DEMO TEACHER
-- ============================================================
INSERT INTO users (id, tenant_id, role, phone_e164, name, email, password_hash, status)
VALUES (
  demo_teacher_id,
  demo_tenant_id,
  'teacher',
  '+91demo0000001',
  'Ms. Priya Menon',
  'demo@aidu.tech',
  '$2b$12$FmqLCKx6wV8B6S7b33nMyO6nGzGNmNbyy2/3/bNIOciGS5ReSphAy',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  status = EXCLUDED.status;

-- ============================================================
-- 3. UPDATE DEMO STUDENTS (already exist, update email+password)
-- ============================================================
UPDATE users SET
  tenant_id    = demo_tenant_id,
  password_hash = '$2b$12$4yJ7PHVedibj.NFXykWXu.CF6nxrvIBVjJIQPyWRRWhGYUjq426sa',
  status       = 'active'
WHERE id IN (s1,s2,s3,s4,s5,s6,s7,s8,s9,s10);

-- Ensure emails are set
UPDATE users SET email = 'arjun.mehta@aidu.tech'   WHERE id = s1;
UPDATE users SET email = 'priya.patel@aidu.tech'    WHERE id = s2;
UPDATE users SET email = 'rahul.verma@aidu.tech'    WHERE id = s3;
UPDATE users SET email = 'ananya.singh@aidu.tech'   WHERE id = s4;
UPDATE users SET email = 'vikram.rao@aidu.tech'     WHERE id = s5;
UPDATE users SET email = 'kavya.nair@aidu.tech'     WHERE id = s6;
UPDATE users SET email = 'aditya.kumar@aidu.tech'   WHERE id = s7;
UPDATE users SET email = 'sneha.gupta@aidu.tech'    WHERE id = s8;
UPDATE users SET email = 'rohit.shah@aidu.tech'     WHERE id = s9;
UPDATE users SET email = 'diya.sharma@aidu.tech'    WHERE id = s10;

-- ============================================================
-- 4. DEMO CLASSES
-- ============================================================
INSERT INTO classes (id, tenant_id, teacher_id, name, subject, batch, join_code)
VALUES
  (class_math_id, demo_tenant_id, demo_teacher_id, 'Class 10 Mathematics', 'Mathematics', '2024-25', 'MATH10A'),
  (class_sci_id,  demo_tenant_id, demo_teacher_id, 'Class 10 Science',     'Science',     '2024-25', 'SCI10A'),
  (class_eng_id,  demo_tenant_id, demo_teacher_id, 'Class 10 English',     'English',     '2024-25', 'ENG10A')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, subject = EXCLUDED.subject;

-- Fix join_code uniqueness
DO $inner$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM classes WHERE join_code = 'MATH10A') THEN
    UPDATE classes SET join_code = 'MATH10A' WHERE id = class_math_id;
  END IF;
END $inner$;

-- ============================================================
-- 5. ENROLL ALL 10 STUDENTS IN ALL 3 CLASSES
-- ============================================================
INSERT INTO class_memberships (tenant_id, class_id, student_id, source)
SELECT demo_tenant_id, c.id, s.id, 'manual'
FROM (VALUES (class_math_id),(class_sci_id),(class_eng_id)) AS c(id)
CROSS JOIN (VALUES (s1),(s2),(s3),(s4),(s5),(s6),(s7),(s8),(s9),(s10)) AS s(id)
ON CONFLICT (class_id, student_id) DO NOTHING;

-- ============================================================
-- 6. CONTENT ASSETS (Slide Decks + Quizzes)
-- ============================================================
INSERT INTO content_assets (id, tenant_id, owner_teacher_id, type, title, subject_tag, source_kind)
VALUES
  (asset_slides1, demo_tenant_id, demo_teacher_id, 'slide_deck', 'Introduction to Algebra', 'Mathematics', 'ai_generated'),
  (asset_slides2, demo_tenant_id, demo_teacher_id, 'slide_deck', 'Newton''s Laws of Motion', 'Science', 'ai_generated'),
  (asset_slides3, demo_tenant_id, demo_teacher_id, 'slide_deck', 'Shakespeare''s Hamlet — Act 1', 'English', 'ai_generated'),
  (asset_quiz1,   demo_tenant_id, demo_teacher_id, 'quiz',       'Algebra Quiz — Chapter 2', 'Mathematics', 'ai_generated'),
  (asset_quiz2,   demo_tenant_id, demo_teacher_id, 'quiz',       'Newton''s Laws Quiz', 'Science', 'ai_generated')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. CONTENT ASSET VERSIONS (with slide/quiz payload JSON)
-- ============================================================
INSERT INTO content_asset_versions (id, tenant_id, asset_id, version_number, payload_json, status)
VALUES
(av1, demo_tenant_id, asset_slides1, 1,
 '{"slides":[{"id":"s1","title":"What is Algebra?","content":"Algebra is the branch of mathematics dealing with symbols and the rules for manipulating those symbols. It is a unifying thread of almost all of mathematics.","bullets":["Uses variables to represent unknowns","Foundation of all higher mathematics","Originated in ancient Babylon"]},{"id":"s2","title":"Variables and Expressions","content":"A variable is a symbol (like x or y) that represents an unknown value. An expression is a combination of variables and numbers.","bullets":["x + 5 is an expression","Variables can take any value","Simplify by combining like terms"]},{"id":"s3","title":"Solving Linear Equations","content":"A linear equation is an equation where the highest power of the variable is 1. We solve by isolating the variable.","bullets":["Example: 2x + 3 = 11","Step 1: Subtract 3 from both sides","Step 2: Divide both sides by 2 → x = 4"]},{"id":"s4","title":"Practice Problems","content":"Try solving these on your own before checking answers.","bullets":["3x - 7 = 14","2(x + 4) = 18","x/3 + 2 = 5"]},{"id":"s5","title":"Summary","content":"Today we covered the basics of algebra — variables, expressions, and solving linear equations.","bullets":["Algebra uses symbols to represent unknowns","Linear equations have one solution","Practice is key to mastery"]}]}',
 'published'),
(av2, demo_tenant_id, asset_slides2, 1,
 '{"slides":[{"id":"s1","title":"Newton''s First Law","content":"An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force. This is the Law of Inertia.","bullets":["No net force = no change in motion","Inertia is resistance to change","Seatbelts protect us due to inertia"]},{"id":"s2","title":"Newton''s Second Law","content":"Force equals mass times acceleration: F = ma. The acceleration of an object depends on its mass and the net force acting upon it.","bullets":["F = ma is the key formula","More mass requires more force","Double the force = double the acceleration"]},{"id":"s3","title":"Newton''s Third Law","content":"For every action there is an equal and opposite reaction. Forces always occur in pairs.","bullets":["Rocket propulsion works by this law","Swimming pushes water back, water pushes you forward","Earth''s gravity pulls us, we pull Earth too"]}]}',
 'published'),
(av3, demo_tenant_id, asset_slides3, 1,
 '{"slides":[{"id":"s1","title":"Introduction to Hamlet","content":"Hamlet is a tragedy by William Shakespeare, believed to have been written around 1600. It is one of the most performed plays in the world.","bullets":["Set in the Kingdom of Denmark","Explores themes of revenge, mortality, corruption","Prince Hamlet is the protagonist"]},{"id":"s2","title":"Act 1 — The Ghost Appears","content":"The play opens with guards seeing the ghost of King Hamlet. Prince Hamlet is told his father was murdered by his uncle Claudius, now king.","bullets":["The ghost reveals the truth","Hamlet swears revenge","Famous line: ''Something is rotten in the state of Denmark''"]},{"id":"s3","title":"Key Characters","content":"Understanding the main characters helps us follow the complex plot of Hamlet.","bullets":["Hamlet — Prince, protagonist","Claudius — Uncle, villain","Ophelia — Hamlet''s love interest","Polonius — King''s chief counsellor"]}]}',
 'published'),
(av4, demo_tenant_id, asset_quiz1, 1,
 '{"questions":[{"id":"q1","text":"What is the value of x in: 2x + 4 = 12?","options":["x = 2","x = 4","x = 6","x = 8"],"correct":1},{"id":"q2","text":"Which of these is a variable?","options":["5","x","3 + 4","10"],"correct":1},{"id":"q3","text":"Simplify: 3x + 2x","options":["5","5x","6x","x5"],"correct":1},{"id":"q4","text":"What is algebra primarily used for?","options":["Measuring lengths","Representing unknowns with symbols","Drawing shapes","Counting objects"],"correct":1},{"id":"q5","text":"Solve: x/4 = 5","options":["x = 1","x = 9","x = 20","x = 25"],"correct":2}]}',
 'published'),
(av5, demo_tenant_id, asset_quiz2, 1,
 '{"questions":[{"id":"q1","text":"Newton''s First Law is also known as the Law of?","options":["Gravity","Inertia","Motion","Force"],"correct":1},{"id":"q2","text":"F = ma represents which law?","options":["First Law","Second Law","Third Law","Law of Gravity"],"correct":1},{"id":"q3","text":"Which example demonstrates Newton''s Third Law?","options":["A ball rolling on a flat surface","A rocket launching","A book sitting on a table","A car stopping at a signal"],"correct":1},{"id":"q4","text":"If Force = 10N and Mass = 2kg, what is acceleration?","options":["2 m/s²","5 m/s²","8 m/s²","20 m/s²"],"correct":1},{"id":"q5","text":"Which law explains why we wear seatbelts?","options":["First Law","Second Law","Third Law","None of these"],"correct":0}]}',
 'published')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. ASSIGNMENTS
-- ============================================================
INSERT INTO assignments (id, tenant_id, class_id, teacher_id, title, description, slide_asset_version_id, quiz_asset_version_id, release_at, due_at, status)
VALUES
  (asn1, demo_tenant_id, class_math_id, demo_teacher_id,
   'Algebra Basics', 'Introduction to variables, expressions and linear equations.',
   av1, av4,
   NOW() - INTERVAL '14 days', NOW() - INTERVAL '7 days', 'closed'),
  (asn2, demo_tenant_id, class_math_id, demo_teacher_id,
   'Quadratic Equations', 'Solving quadratic equations using factorisation and the quadratic formula.',
   av1, NULL,
   NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days', 'released'),
  (asn3, demo_tenant_id, class_sci_id, demo_teacher_id,
   'Newton''s Laws of Motion', 'Understanding the three laws of motion with real-life examples.',
   av2, av5,
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', 'closed'),
  (asn4, demo_tenant_id, class_sci_id, demo_teacher_id,
   'Thermodynamics Intro', 'Heat, temperature, and the laws of thermodynamics.',
   av2, NULL,
   NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days', 'released'),
  (asn5, demo_tenant_id, class_eng_id, demo_teacher_id,
   'Shakespeare''s Hamlet — Act 1', 'Reading comprehension and analysis of Act 1 of Hamlet.',
   av3, NULL,
   NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day', 'closed'),
  (asn6, demo_tenant_id, class_eng_id, demo_teacher_id,
   'Essay Writing: Persuasion Techniques', 'Learn and practice key persuasion techniques used in essay writing.',
   NULL, NULL,
   NOW() + INTERVAL '1 day', NOW() + INTERVAL '8 days', 'scheduled')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. ASSIGNMENT RECIPIENTS (all students get all assignments)
-- ============================================================
-- Math assignments → all students in math class (asn1=closed, asn2=released)
INSERT INTO assignment_recipients (tenant_id, assignment_id, student_id, visibility_status)
SELECT demo_tenant_id, asn1, s.id, 'completed'
FROM (VALUES (s1),(s2),(s3),(s4),(s5),(s6),(s7),(s8),(s9),(s10)) AS s(id)
ON CONFLICT (assignment_id, student_id) DO NOTHING;

INSERT INTO assignment_recipients (tenant_id, assignment_id, student_id, visibility_status)
SELECT demo_tenant_id, asn2, s.id, 'visible'
FROM (VALUES (s1),(s2),(s3),(s4),(s5),(s6),(s7),(s8),(s9),(s10)) AS s(id)
ON CONFLICT (assignment_id, student_id) DO NOTHING;

-- Science assignments (asn3=closed, asn4=released)
INSERT INTO assignment_recipients (tenant_id, assignment_id, student_id, visibility_status)
SELECT demo_tenant_id, asn3, s.id, 'completed'
FROM (VALUES (s1),(s2),(s3),(s4),(s5),(s6),(s7),(s8),(s9),(s10)) AS s(id)
ON CONFLICT (assignment_id, student_id) DO NOTHING;

INSERT INTO assignment_recipients (tenant_id, assignment_id, student_id, visibility_status)
SELECT demo_tenant_id, asn4, s.id, 'visible'
FROM (VALUES (s1),(s2),(s3),(s4),(s5),(s6),(s7),(s8),(s9),(s10)) AS s(id)
ON CONFLICT (assignment_id, student_id) DO NOTHING;

-- English assignments (asn5=closed, asn6=scheduled)
INSERT INTO assignment_recipients (tenant_id, assignment_id, student_id, visibility_status)
SELECT demo_tenant_id, asn5, s.id, 'completed'
FROM (VALUES (s1),(s2),(s3),(s4),(s5),(s6),(s7),(s8),(s9),(s10)) AS s(id)
ON CONFLICT (assignment_id, student_id) DO NOTHING;

INSERT INTO assignment_recipients (tenant_id, assignment_id, student_id, visibility_status)
SELECT demo_tenant_id, asn6, s.id, 'hidden'
FROM (VALUES (s1),(s2),(s3),(s4),(s5),(s6),(s7),(s8),(s9),(s10)) AS s(id)
ON CONFLICT (assignment_id, student_id) DO NOTHING;

-- ============================================================
-- 10. ASSIGNMENT ATTEMPTS (closed assignments with realistic scores)
-- ============================================================
INSERT INTO assignment_attempts (tenant_id, assignment_id, student_id, started_at, submitted_at, score_percent, answers_json, completion_state)
VALUES
-- Algebra Basics (asn1) - closed, all submitted
(demo_tenant_id,asn1,s1,  NOW()-INTERVAL '13 days', NOW()-INTERVAL '8 days',  92, '{"q1":1,"q2":1,"q3":1,"q4":1,"q5":2}', 'graded'),
(demo_tenant_id,asn1,s2,  NOW()-INTERVAL '13 days', NOW()-INTERVAL '8 days',  85, '{"q1":1,"q2":1,"q3":1,"q4":1,"q5":0}', 'graded'),
(demo_tenant_id,asn1,s3,  NOW()-INTERVAL '12 days', NOW()-INTERVAL '8 days',  78, '{"q1":1,"q2":1,"q3":0,"q4":1,"q5":2}', 'graded'),
(demo_tenant_id,asn1,s4,  NOW()-INTERVAL '12 days', NOW()-INTERVAL '8 days',  95, '{"q1":1,"q2":1,"q3":1,"q4":1,"q5":2}', 'graded'),
(demo_tenant_id,asn1,s5,  NOW()-INTERVAL '11 days', NOW()-INTERVAL '8 days',  70, '{"q1":0,"q2":1,"q3":1,"q4":1,"q5":0}', 'graded'),
(demo_tenant_id,asn1,s6,  NOW()-INTERVAL '13 days', NOW()-INTERVAL '8 days',  88, '{"q1":1,"q2":1,"q3":1,"q4":0,"q5":2}', 'graded'),
(demo_tenant_id,asn1,s7,  NOW()-INTERVAL '12 days', NOW()-INTERVAL '9 days',  62, '{"q1":0,"q2":1,"q3":0,"q4":1,"q5":2}', 'graded'),
(demo_tenant_id,asn1,s8,  NOW()-INTERVAL '11 days', NOW()-INTERVAL '8 days',  90, '{"q1":1,"q2":1,"q3":1,"q4":1,"q5":2}', 'graded'),
(demo_tenant_id,asn1,s9,  NOW()-INTERVAL '10 days', NOW()-INTERVAL '8 days',  55, '{"q1":0,"q2":0,"q3":1,"q4":1,"q5":0}', 'graded'),
(demo_tenant_id,asn1,s10, NOW()-INTERVAL '12 days', NOW()-INTERVAL '8 days',  83, '{"q1":1,"q2":1,"q3":1,"q4":0,"q5":2}', 'graded'),

-- Newton's Laws (asn3) - closed
(demo_tenant_id,asn3,s1,  NOW()-INTERVAL '9 days', NOW()-INTERVAL '4 days',  88, '{"q1":1,"q2":1,"q3":1,"q4":1,"q5":0}', 'graded'),
(demo_tenant_id,asn3,s2,  NOW()-INTERVAL '9 days', NOW()-INTERVAL '4 days',  80, '{"q1":1,"q2":1,"q3":0,"q4":1,"q5":0}', 'graded'),
(demo_tenant_id,asn3,s3,  NOW()-INTERVAL '8 days', NOW()-INTERVAL '4 days',  72, '{"q1":1,"q2":0,"q3":1,"q4":1,"q5":0}', 'graded'),
(demo_tenant_id,asn3,s4,  NOW()-INTERVAL '9 days', NOW()-INTERVAL '3 days',  91, '{"q1":1,"q2":1,"q3":1,"q4":1,"q5":0}', 'graded'),
(demo_tenant_id,asn3,s5,  NOW()-INTERVAL '7 days', NOW()-INTERVAL '4 days',  65, '{"q1":0,"q2":1,"q3":1,"q4":0,"q5":0}', 'graded'),
(demo_tenant_id,asn3,s6,  NOW()-INTERVAL '9 days', NOW()-INTERVAL '4 days',  84, '{"q1":1,"q2":1,"q3":1,"q4":1,"q5":0}', 'graded'),
(demo_tenant_id,asn3,s7,  NOW()-INTERVAL '8 days', NOW()-INTERVAL '4 days',  58, '{"q1":0,"q2":0,"q3":1,"q4":1,"q5":0}', 'graded'),
(demo_tenant_id,asn3,s8,  NOW()-INTERVAL '9 days', NOW()-INTERVAL '3 days',  93, '{"q1":1,"q2":1,"q3":1,"q4":1,"q5":0}', 'graded'),
(demo_tenant_id,asn3,s9,  NOW()-INTERVAL '6 days', NOW()-INTERVAL '4 days',  48, '{"q1":0,"q2":0,"q3":0,"q4":1,"q5":0}', 'graded'),
(demo_tenant_id,asn3,s10, NOW()-INTERVAL '8 days', NOW()-INTERVAL '4 days',  77, '{"q1":1,"q2":1,"q3":0,"q4":1,"q5":0}', 'graded'),

-- Hamlet Act 1 (asn5) - closed
(demo_tenant_id,asn5,s1,  NOW()-INTERVAL '6 days', NOW()-INTERVAL '2 days',  87, NULL, 'submitted'),
(demo_tenant_id,asn5,s2,  NOW()-INTERVAL '6 days', NOW()-INTERVAL '2 days',  79, NULL, 'submitted'),
(demo_tenant_id,asn5,s3,  NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days',  68, NULL, 'submitted'),
(demo_tenant_id,asn5,s4,  NOW()-INTERVAL '6 days', NOW()-INTERVAL '1 day',   94, NULL, 'submitted'),
(demo_tenant_id,asn5,s5,  NOW()-INTERVAL '4 days', NOW()-INTERVAL '2 days',  61, NULL, 'submitted'),
(demo_tenant_id,asn5,s6,  NOW()-INTERVAL '6 days', NOW()-INTERVAL '2 days',  83, NULL, 'submitted'),
(demo_tenant_id,asn5,s7,  NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days',  55, NULL, 'submitted'),
(demo_tenant_id,asn5,s8,  NOW()-INTERVAL '6 days', NOW()-INTERVAL '1 day',   90, NULL, 'submitted'),
(demo_tenant_id,asn5,s9,  NOW()-INTERVAL '3 days', NOW()-INTERVAL '2 days',  44, NULL, 'submitted'),
(demo_tenant_id,asn5,s10, NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days',  76, NULL, 'submitted')

ON CONFLICT (assignment_id, student_id) DO UPDATE SET
  submitted_at = EXCLUDED.submitted_at,
  score_percent = EXCLUDED.score_percent,
  completion_state = EXCLUDED.completion_state;

-- In-progress for active assignments
INSERT INTO assignment_attempts (tenant_id, assignment_id, student_id, started_at, completion_state)
SELECT demo_tenant_id, a.id, s.id, NOW()-INTERVAL '1 day', 'in_progress'
FROM (VALUES (asn2),(asn4)) AS a(id)
CROSS JOIN (VALUES (s1),(s2),(s3),(s4),(s5)) AS s(id)
ON CONFLICT (assignment_id, student_id) DO NOTHING;

-- ============================================================
-- 11. SLIDE PROGRESS (for closed assignments)
-- ============================================================
-- asn1 (5 slides) - most students viewed all
INSERT INTO assignment_slide_progress (tenant_id, assignment_id, student_id, slide_id, viewed_at)
SELECT demo_tenant_id, asn1, s.id, sl.slide_id, NOW() - INTERVAL '10 days'
FROM (VALUES (s1),(s2),(s4),(s6),(s8),(s10)) AS s(id)
CROSS JOIN (VALUES ('s1'),('s2'),('s3'),('s4'),('s5')) AS sl(slide_id)
ON CONFLICT (assignment_id, student_id, slide_id) DO NOTHING;

-- Partial slides for struggling students
INSERT INTO assignment_slide_progress (tenant_id, assignment_id, student_id, slide_id, viewed_at)
SELECT demo_tenant_id, asn1, s.id, sl.slide_id, NOW() - INTERVAL '10 days'
FROM (VALUES (s3),(s5),(s7)) AS s(id)
CROSS JOIN (VALUES ('s1'),('s2'),('s3')) AS sl(slide_id)
ON CONFLICT (assignment_id, student_id, slide_id) DO NOTHING;

-- s9 barely started
INSERT INTO assignment_slide_progress (tenant_id, assignment_id, student_id, slide_id, viewed_at)
VALUES (demo_tenant_id, asn1, s9, 's1', NOW() - INTERVAL '11 days')
ON CONFLICT DO NOTHING;

-- asn3 (3 slides)
INSERT INTO assignment_slide_progress (tenant_id, assignment_id, student_id, slide_id, viewed_at)
SELECT demo_tenant_id, asn3, s.id, sl.slide_id, NOW() - INTERVAL '6 days'
FROM (VALUES (s1),(s2),(s4),(s6),(s8)) AS s(id)
CROSS JOIN (VALUES ('s1'),('s2'),('s3')) AS sl(slide_id)
ON CONFLICT DO NOTHING;

INSERT INTO assignment_slide_progress (tenant_id, assignment_id, student_id, slide_id, viewed_at)
SELECT demo_tenant_id, asn3, s.id, sl.slide_id, NOW() - INTERVAL '6 days'
FROM (VALUES (s3),(s5),(s7),(s10)) AS s(id)
CROSS JOIN (VALUES ('s1'),('s2')) AS sl(slide_id)
ON CONFLICT DO NOTHING;

END $$;
