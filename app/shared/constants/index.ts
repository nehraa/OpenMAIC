export const SESSION_MAX_DURATION_MINUTES = 15;
export const JOIN_CODE_LENGTH = 8;
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;
export const MAX_LOGIN_ATTEMPTS = 5;
export const SESSION_EXPIRY_DAYS = 7;
export const QUESTION_RATE_LIMIT_MINUTES = 1;

// Token costs (per 1M tokens) - configurable
export const TOKEN_COSTS = {
  'gpt-4': { input: 30, output: 60 },
  'gpt-3.5-turbo': { input: 1, output: 2 },
  'claude-3-opus': { input: 15, output: 75 },
  'claude-3-sonnet': { input: 3, output: 15 },
  'ollama/llama3': { input: 0, output: 0 }, // Local, free
} as const;
