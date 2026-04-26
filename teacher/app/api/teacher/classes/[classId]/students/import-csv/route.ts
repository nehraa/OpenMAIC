import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

// POST /api/teacher/classes/[classId]/students/import-csv - Import students from CSV
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  const classId = pathParts[pathParts.length - 3];
  const db = getDb();

  const classData = db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(classId, ctx.user.id);
  if (!classData) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  const { csv } = await req.json();
  if (!csv || typeof csv !== 'string') {
    return NextResponse.json({ error: 'CSV content required' }, { status: 400 });
  }

  const lines = csv.trim().split('\n');
  if (lines.length < 2) {
    return NextResponse.json({ error: 'CSV must have header row and at least one data row' }, { status: 400 });
  }

  const header = lines[0].toLowerCase().split(',').map(h => h.trim());
  const phoneIdx = header.indexOf('phone');
  const nameIdx = header.indexOf('name');

  if (phoneIdx === -1) {
    return NextResponse.json({ error: 'CSV must have a "phone" column' }, { status: 400 });
  }

  const results = { success: 0, errors: [] as { row: number; phone: string; error: string }[] };

  for (let i = 1; i < lines.length && i <= 1000; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const phone = cols[phoneIdx] || '';
    const name = nameIdx >= 0 ? cols[nameIdx] || '' : '';

    if (!phone) {
      results.errors.push({ row: i + 1, phone: '', error: 'Empty phone' });
      continue;
    }

    if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
      results.errors.push({ row: i + 1, phone, error: 'Invalid E.164 format' });
      continue;
    }

    try {
      let student = db.prepare('SELECT id FROM users WHERE phone_e164 = ?').get(phone) as any;

      if (!student) {
        const result = db.prepare(`INSERT INTO users (role, phone_e164, name) VALUES ('student_classroom', ?, ?)`).run(phone, name);
        student = { id: result.lastInsertRowid };
      }

      const existing = db.prepare('SELECT id FROM class_memberships WHERE class_id = ? AND student_id = ?').get(classId, student.id);

      if (!existing) {
        db.prepare(`INSERT INTO class_memberships (class_id, student_id, source) VALUES (?, ?, 'csv')`).run(classId, student.id);
      }

      results.success++;
    } catch (err: any) {
      results.errors.push({ row: i + 1, phone, error: err.message || 'Unknown error' });
    }
  }

  return NextResponse.json(results);
});
