import { redirect } from 'next/navigation';

// Teacher app has no standalone login. All authentication happens on the
// parent app (openmaic.devstudios.me) and is handed off via /auth/sso.
// Anyone landing here is sent to the parent's teacher login.
export default function TeacherLoginRedirect() {
  const parentBase = process.env.NEXT_PUBLIC_PARENT_URL || 'https://openmaic.devstudios.me';
  redirect(`${parentBase}/login/teacher`);
}
