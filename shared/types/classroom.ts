export interface Class {
  id: string;
  teacher_id: string;
  name: string;
  subject: string;
  batch: string;
  join_code: string;
  peer_visibility_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassMembership {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
  source: 'manual' | 'csv';
}

export interface ClassroomSession {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  core_classroom_id?: string;
  status: 'draft' | 'live' | 'ended';
  started_at?: string;
  ended_at?: string;
  max_duration_minutes: number;
  created_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string;
  completion_state: 'pending' | 'completed';
}

export interface QuestionMessage {
  id: string;
  session_id: string;
  student_id: string;
  question_text: string;
  answer_text?: string;
  created_at: string;
  answered_at?: string;
}
