export interface LLMUsageEvent {
  id: string;
  timestamp: string;
  actor_user_id: string;
  actor_role: 'teacher' | 'student_classroom' | 'student_b2c';
  provider: string;
  model: string;
  endpoint: string;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  reasoning_tokens: number;
  cost_usd: number;
  request_id?: string;
}
