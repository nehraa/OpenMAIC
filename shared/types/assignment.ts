export interface ContentAsset {
  id: string;
  owner_teacher_id: string;
  type: 'slide_deck' | 'quiz';
  title: string;
  subject_tag: string;
  source_kind: 'manual' | 'ai_generated' | 'imported';
  source_ref: string;
  created_at: string;
  updated_at: string;
}

export interface ContentAssetVersion {
  id: string;
  asset_id: string;
  version_number: number;
  payload_json: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
}

export interface Assignment {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description: string;
  slide_asset_version_id: string | null;
  quiz_asset_version_id: string | null;
  release_at: string | null;
  due_at: string | null;
  status: 'draft' | 'scheduled' | 'released' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface AssignmentRecipient {
  id: string;
  assignment_id: string;
  student_id: string;
  visibility_status: 'hidden' | 'visible' | 'completed';
  assigned_at: string;
}

export interface AssignmentAttempt {
  id: string;
  assignment_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  score_percent: number | null;
  completion_state: 'pending' | 'in_progress' | 'submitted' | 'graded';
}

export interface AssignmentSlideProgress {
  id: string;
  assignment_id: string;
  student_id: string;
  slide_id: string;
  viewed_at: string;
}

export interface SchedulerJob {
  id: string;
  target_type: 'assignment' | 'notification';
  target_id: string;
  run_at: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  retry_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}
