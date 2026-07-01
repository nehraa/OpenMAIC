import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';

// GET /api/student/questions - List all questions for the student
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
    if (roleCheck) return roleCheck;

    const userId = authResult.user.id;

    const result = await withTenant(authResult.tenantId, async (client) => {
      return client.query(
        `SELECT q.id, q.title, q.content, q.status, q.created_at, q.answered_at,
                c.name as class_name
         FROM questions q
         JOIN classes c ON c.id = q.class_id
         JOIN class_memberships cm ON cm.class_id = c.id AND cm.student_id = $1
         ORDER BY q.created_at DESC`,
        [userId]
      );
    });

    return NextResponse.json({ questions: result.rows });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/student/questions - Create a new question
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
    if (roleCheck) return roleCheck;

    const userId = authResult.user.id;
    const body = await request.json();
    const { title, content, class_id } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const created = await withTenant(authResult.tenantId, async (client) => {
      let targetClassId: string | undefined = class_id;
      if (!targetClassId) {
        const classResult = await client.query<{ class_id: string }>(
          'SELECT class_id FROM class_memberships WHERE student_id = $1 LIMIT 1',
          [userId]
        );
        const classRow = classResult.rows[0];
        if (!classRow) {
          return { error: 'no_class' as const };
        }
        targetClassId = classRow.class_id;
      }

      const questionId = crypto.randomUUID();
      await client.query(
        `INSERT INTO questions (id, class_id, student_id, title, content, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')`,
        [questionId, targetClassId, userId, title, content]
      );
      return { questionId };
    });

    if ('error' in created && created.error === 'no_class') {
      return NextResponse.json({ error: 'No class found. Please join a class first.' }, { status: 400 });
    }
    return NextResponse.json({ id: created.questionId, status: 'pending' }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}