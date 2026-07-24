#!/usr/bin/env node
/**
 * Manual regression script for Abhinav's 2026-07-24 list.
 * Hits the live stack (3001=parent, 3002=teacher, 3003=core, 3004=student).
 * Prints PASS/FAIL per assertion and exits non-zero on any failure.
 *
 * Auth model:
 *   - Parent app mints a `session_id` (UUID) in the shared `auth_sessions`
 *     table; it does NOT set a cookie itself.
 *   - Each downstream app exposes `/<basePath>/api/auth/sso?token=<sid>` which
 *     exchanges that sid for a host-local `access_token` JWT cookie.
 *   - The cookie is what API guards and middleware honor. Calling downstream
 *     APIs with only `x-session-id` (what verify-otp returns) is not enough.
 */
import { Client } from 'pg';

const BASE = {
  parent: 'http://127.0.0.1:3001',
  teacher: 'http://127.0.0.1:3002',
  student: 'http://127.0.0.1:3004',
  core: 'http://127.0.0.1:3003',
};
const TEACHER_PHONE = '+919876543210';
const STUDENT_PHONE = '+919876543220';

type Cookie = { name: string; value: string };

function getCookies(resp: Response): Cookie[] {
  const raw: string[] = (resp.headers as any).getSetCookie
    ? (resp.headers as any).getSetCookie()
    : resp.headers.get('set-cookie')
    ? [resp.headers.get('set-cookie') as string]
    : [];
  return raw
    .filter(Boolean)
    .map((c) => {
      const [pair] = c.split(';');
      const [name, value] = pair.split('=');
      return { name: name.trim(), value: value.trim() };
    });
}

function cookieHeader(cookies: Cookie[]): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

async function readOtp(phone: string): Promise<string> {
  const c = new Client({ connectionString: 'postgresql://postgres@127.0.0.1:5433/postgres' });
  await c.connect();
  try {
    const r = await c.query(
      'SELECT code FROM otp_codes WHERE phone = $1 AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1',
      [phone]
    );
    if (!r.rows.length) throw new Error(`no OTP for ${phone}`);
    return r.rows[0].code as string;
  } finally {
    await c.end();
  }
}

async function clearRateLimits() {
  const c = new Client({ connectionString: 'postgresql://postgres@127.0.0.1:5433/postgres' });
  await c.connect();
  for (const t of ['auth_rate_limits', 'otp_rate_limits', 'otp_codes']) {
    try {
      await c.query(`DELETE FROM ${t}`);
    } catch {
      /* table may not exist */
    }
  }
  await c.end();
}

async function parentVerifyOtp(phone: string, dbRole: string): Promise<string> {
  const req = await fetch(`${BASE.parent}/api/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  if (!req.ok) {
    const text = await req.text();
    throw new Error(`request-otp ${req.status} ${text}`);
  }
  const otp = await readOtp(phone);
  const verify = await fetch(`${BASE.parent}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp, role: dbRole }),
  });
  if (!verify.ok) {
    const text = await verify.text();
    throw new Error(`verify-otp ${verify.status} ${text}`);
  }
  const sid = verify.headers.get('x-session-id');
  if (!sid) throw new Error('verify-otp returned no x-session-id');
  return sid;
}

async function exchangeSso(
  baseURL: string,
  basePath: string,
  sid: string
): Promise<Cookie[]> {
  const url = `${baseURL}${basePath}/api/auth/sso?token=${encodeURIComponent(sid)}`;
  const r = await fetch(url, { redirect: 'manual' });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`sso ${basePath} ${r.status} ${text}`);
  }
  return getCookies(r);
}

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(cond: unknown, name: string) {
  if (cond) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`FAIL  ${name}`);
  }
}

async function fetchJSON(url: string, init: RequestInit = {}) {
  const resp = await fetch(url, init);
  const text = await resp.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: resp.status, body: json, text, headers: resp.headers };
}

async function run() {
  await clearRateLimits();

  console.log('=== 1) parent login ===');
  // Map high-level 'student' role to the DB enum 'student_classroom'.
  const teacherSid = await parentVerifyOtp(TEACHER_PHONE, 'teacher');
  assert(!!teacherSid, 'teacher x-session-id set by parent verify-otp');
  const studentSid = await parentVerifyOtp(STUDENT_PHONE, 'student_classroom');
  assert(!!studentSid, 'student x-session-id set by parent verify-otp');

  console.log('--- exchange session id for host-local JWT cookie via /api/auth/sso ---');
  const teacherCookies = await exchangeSso(BASE.teacher, '/teacher', teacherSid);
  const teacherAccess = teacherCookies.find((c) => c.name === 'access_token');
  assert(!!teacherAccess, 'teacher access_token cookie set by /teacher/api/auth/sso');
  const studentCookies = await exchangeSso(BASE.student, '/student', studentSid);
  const studentAccess = studentCookies.find((c) => c.name === 'access_token');
  assert(!!studentAccess, 'student access_token cookie set by /student/api/auth/sso');

  const teacherCookie = teacherAccess ? cookieHeader(teacherCookies) : '';
  const studentCookie = studentAccess ? cookieHeader(studentCookies) : '';

  console.log('\n=== 2) student classes list + detail (Abhinav bug 1) ===');
  const studentClasses = await fetchJSON(`${BASE.student}/student/api/student/classes`, {
    headers: { Cookie: studentCookie },
  });
  assert(
    studentClasses.status === 200,
    `student /student/api/student/classes returns 200 (got ${studentClasses.status} body=${JSON.stringify(studentClasses.body).slice(0, 200)})`
  );
  const clsList = (studentClasses.body as any).classes as Array<{ id: string; name: string }>;
  assert(
    Array.isArray(clsList) && clsList.length > 0,
    `student classes array non-empty (length=${clsList?.length})`
  );
  if (clsList?.length) {
    const c = await fetchJSON(`${BASE.student}/student/api/student/classes/${clsList[0].id}`, {
      headers: { Cookie: studentCookie },
    });
    assert(c.status === 200, `student /student/api/student/classes/[id] returns 200 (got ${c.status})`);
  }

  console.log('\n=== 3) student assignments + access code (Abhinav bug 2) ===');
  const assigns = await fetchJSON(`${BASE.student}/student/api/student/assignments`, {
    headers: { Cookie: studentCookie },
  });
  assert(assigns.status === 200, `student /student/api/student/assignments 200 (got ${assigns.status})`);
  const assignList = (assigns.body as any).assignments as Array<{ id: string }>;
  assert(
    Array.isArray(assignList) && assignList.length > 0,
    `student assignments non-empty (length=${assignList?.length})`
  );
  if (assignList?.length) {
    const a = await fetchJSON(`${BASE.student}/student/api/student/assignments/${assignList[0].id}`, {
      headers: { Cookie: studentCookie },
    });
    assert(a.status === 200, `student /student/api/student/assignments/[id] 200 (got ${a.status})`);
  }
  const access = await fetchJSON(`${BASE.student}/student/api/student/access-code`, {
    headers: { Cookie: studentCookie },
  });
  assert(access.status === 200, `student /student/api/student/access-code 200 (got ${access.status})`);
  const code = access.body as { enabled: boolean; code: string };
  assert(
    code?.enabled === true && code?.code === 'PHYSIO',
    `access code enabled with text PHYSIO (got ${JSON.stringify(code)})`
  );

  console.log('\n=== 4) teacher manage-students detail (Abhinav bug 8) ===');
  const tClasses = await fetchJSON(`${BASE.teacher}/teacher/api/teacher/classes`, {
    headers: { Cookie: teacherCookie },
  });
  assert(tClasses.status === 200, `teacher /teacher/api/teacher/classes 200 (got ${tClasses.status} body=${JSON.stringify(tClasses.body).slice(0, 200)})`);
  const tcls = (tClasses.body as any).classes as Array<{ id: string; name: string }>;
  assert(
    Array.isArray(tcls) && tcls.length > 0,
    `teacher classes non-empty (length=${tcls?.length})`
  );
  if (tcls?.length) {
    const students = await fetchJSON(`${BASE.teacher}/teacher/api/teacher/classes/${tcls[0].id}/students`, {
      headers: { Cookie: teacherCookie },
    });
    assert(students.status === 200, `teacher /teacher/api/teacher/classes/[id]/students 200 (got ${students.status})`);
    const studs = (students.body as any).students as Array<{ id: string }>;
    assert(
      Array.isArray(studs) && studs.length > 0,
      `students roster non-empty (length=${studs?.length})`
    );
    if (studs?.length) {
      const prog = await fetchJSON(
        `${BASE.teacher}/teacher/api/teacher/progress/student/${studs[0].id}?days=30`,
        { headers: { Cookie: teacherCookie } }
      );
      assert(prog.status === 200, `teacher /teacher/api/teacher/progress/student/[id] 200 (got ${prog.status})`);
    }
  }

  console.log('\n=== 5) teacher class settings page (Abhinav bug 5) ===');
  if (tcls?.length) {
    const settings = await fetchJSON(`${BASE.teacher}/teacher/teacher/classes/${tcls[0].id}/settings`, {
      headers: { Cookie: teacherCookie },
    });
    assert(settings.status === 200, `class settings page 200 (got ${settings.status})`);
  }

  console.log('\n=== 6) teacher live sessions page (Abhinav bug 6) ===');
  const sessions = await fetchJSON(`${BASE.teacher}/teacher/teacher/sessions`, {
    headers: { Cookie: teacherCookie },
  });
  assert(sessions.status === 200, `teacher live sessions page 200 (got ${sessions.status})`);

  console.log('\n=== 7) teacher global settings page (was 404) ===');
  const settings = await fetchJSON(`${BASE.teacher}/teacher/teacher/settings`, {
    headers: { Cookie: teacherCookie },
  });
  assert(settings.status === 200, `teacher settings page 200 (got ${settings.status})`);

  console.log('\n=== Summary ===');
  console.log(`PASS: ${passed}`);
  console.log(`FAIL: ${failed}`);
  if (failures.length) {
    console.log('Failures:');
    for (const f of failures) console.log(`  - ${f}`);
  }
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error('FATAL', err);
  process.exit(2);
});
