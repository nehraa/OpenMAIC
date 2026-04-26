export type UserRole = 'teacher' | 'student_classroom' | 'student_b2c';

export interface User {
  id: string;
  role: UserRole;
  phone_e164: string;
  name: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  id: string;
  user_id: string;
  issued_at: string;
  expires_at: string;
  user_agent?: string;
  ip_hash?: string;
}
