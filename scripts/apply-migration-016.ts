import { Client } from 'pg';
import { readFileSync } from 'fs';

(async () => {
  const c = new Client({ connectionString: 'postgresql://postgres@127.0.0.1:5433/postgres' });
  await c.connect();
  const sql = readFileSync('postgres/migrations/016_class_membership_status_and_attempt_per_question.sql', 'utf8');
  await c.query(sql);
  console.log('applied 016');
  const cols = await c.query(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name IN ('class_memberships', 'assignment_attempts')
      AND column_name IN ('status', 'per_question_json')
    ORDER BY table_name, column_name
  `);
  console.log('columns:', cols.rows);
  await c.end();
})();
