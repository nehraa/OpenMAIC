/**
 * AI provider — MiniMax M3 direct API.
 *
 * Reads MINIMAX_API_KEY from env. Uses the OpenAI-compatible chat completions
 * endpoint at https://api.minimax.io/v1 (confirmed working for MiniMax-M3).
 *
 * Two entry points:
 *  - generateSlideDeck(prompt, opts)  → { slides: [...] }
 *  - generateQuiz(prompt, opts)       → { questions: [...] }
 *
 * On any failure, throws — the caller decides whether to surface the error
 * to the user or fall back to a placeholder.
 */

const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.io/v1';
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || 'MiniMax-M3';

export interface Slide {
  slide_id: string;
  title: string;
  content: string;
  bullets: string[];
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correct_index?: number;
  correct_answer?: string | boolean;
  explanation?: string;
  points: number;
}

export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface GenerateResult<T> {
  payload: T;
  usage: LLMUsage;
}

const SLIDE_PROMPT = (prompt: string, n: number) => `You are an expert educational content designer.

Create a slide deck of EXACTLY ${n} slides on the following topic:

"""${prompt}"""

Each slide must be focused, well-paced, and pedagogically sound. Aim for depth, not filler.

Return ONLY a JSON object of this exact shape — no prose, no markdown fences, no commentary:

{
  "slides": [
    {
      "slide_id": "s1",
      "title": "<short, scannable title>",
      "content": "<1-3 sentences — the main idea of this slide>",
      "bullets": ["<key point 1>", "<key point 2>", "<key point 3>"]
    }
  ]
}

Rules:
- slide_id must be "s1" through "s${n}"
- titles ≤ 8 words
- bullets are concise noun phrases or short verb phrases
- content paragraphs ≤ 60 words each
- no duplicate slides, no placeholder text
- if the topic is technical, include a concrete example
- output MUST be valid JSON parseable by JSON.parse`;

const QUIZ_PROMPT = (prompt: string, n: number) => `You are an expert assessment designer.

Create a quiz of EXACTLY ${n} questions on the following topic:

"""${prompt}"""

Mix multiple_choice (4 options), true_false, and short_answer questions. Each question should test genuine understanding, not just recall.

Return ONLY a JSON object of this exact shape — no prose, no markdown fences, no commentary:

{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice" | "true_false" | "short_answer",
      "question": "<the question text>",
      "options": ["A", "B", "C", "D"],  // omit for short_answer
      "correct_index": 0,               // 0..3 for multiple_choice, omit for short_answer
      "correct_answer": "True" | "False" | "Free text answer",  // for true_false / short_answer
      "explanation": "<1-2 sentence rationale>",
      "points": 1
    }
  ]
}

Rules:
- id must be "q1" through "q${n}"
- every question needs a non-empty "explanation"
- points is 1 for true_false, 2 for short_answer, 1 for multiple_choice
- output MUST be valid JSON parseable by JSON.parse`;

function extractJson<T>(text: string): T {
  // MiniMax sometimes wraps JSON in <think>...</think> or returns stray prose.
  // Try strict parse first, then locate the outermost {...} block.
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('No JSON object found in model response');
    }
    return JSON.parse(trimmed.slice(start, end + 1)) as T;
  }
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatChoice {
  index: number;
  message: { role: string; content: string };
  finish_reason: string;
}

interface ChatResponse {
  id: string;
  choices: ChatChoice[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  model?: string;
}

async function callMinimax(messages: ChatMessage[]): Promise<{ content: string; usage: LLMUsage }> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    throw new Error('MINIMAX_API_KEY is not set in the environment');
  }

  const res = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`MiniMax API error ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as ChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('MiniMax returned an empty completion');
  }

  const promptTokens = data.usage?.prompt_tokens ?? 0;
  const completionTokens = data.usage?.completion_tokens ?? 0;

  // Rough cost for MiniMax-M3. Pricing is not yet published in the env cost
  // table, so we use a conservative mid-tier rate ($0.40 / 1M input, $1.20 / 1M output)
  // which lines up with the M2.7 baseline already in the cost table.
  const costUsd = promptTokens * 0.0000004 + completionTokens * 0.0000012;

  return {
    content,
    usage: { inputTokens: promptTokens, outputTokens: completionTokens, costUsd },
  };
}

export async function generateSlideDeck(
  prompt: string,
  opts: { slideCount?: number } = {}
): Promise<GenerateResult<{ slides: Slide[] }>> {
  const n = opts.slideCount ?? 5;
  const { content, usage } = await callMinimax([
    { role: 'user', content: SLIDE_PROMPT(prompt, n) },
  ]);
  const payload = extractJson<{ slides: Slide[] }>(content);

  if (!payload.slides || !Array.isArray(payload.slides)) {
    throw new Error('Model did not return a slides array');
  }

  // Enforce slide_id format and count — model sometimes drifts.
  payload.slides = payload.slides.slice(0, n).map((s, i) => ({
    slide_id: s.slide_id || `s${i + 1}`,
    title: String(s.title || '').trim() || `Slide ${i + 1}`,
    content: String(s.content || '').trim(),
    bullets: Array.isArray(s.bullets) ? s.bullets.map((b) => String(b).trim()).filter(Boolean) : [],
  }));

  return { payload, usage };
}

export async function generateQuiz(
  prompt: string,
  opts: { questionCount?: number } = {}
): Promise<GenerateResult<{ questions: QuizQuestion[] }>> {
  const n = opts.questionCount ?? 5;
  const { content, usage } = await callMinimax([
    { role: 'user', content: QUIZ_PROMPT(prompt, n) },
  ]);
  const payload = extractJson<{ questions: QuizQuestion[] }>(content);

  if (!payload.questions || !Array.isArray(payload.questions)) {
    throw new Error('Model did not return a questions array');
  }

  payload.questions = payload.questions.slice(0, n).map((q, i) => {
    const type = (q.type as QuizQuestion['type']) || 'multiple_choice';
    const out: QuizQuestion = {
      id: q.id || `q${i + 1}`,
      type,
      question: String(q.question || '').trim(),
      explanation: String(q.explanation || '').trim(),
      points: typeof q.points === 'number' ? q.points : type === 'short_answer' ? 2 : 1,
    };
    if (type === 'multiple_choice') {
      out.options = Array.isArray(q.options) ? q.options.map((o) => String(o)) : [];
      out.correct_index = typeof q.correct_index === 'number' ? q.correct_index : 0;
    } else if (type === 'true_false') {
      out.correct_answer = q.correct_answer === true || q.correct_answer === 'True' || q.correct_answer === 'true';
    } else {
      out.correct_answer = String(q.correct_answer || '').trim();
    }
    return out;
  });

  return { payload, usage };
}
