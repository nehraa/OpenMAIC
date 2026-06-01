import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { saveGeneratedContent } from '@/lib/server/library';
import { recordUsage, estimateCost } from '@/lib/server/usage';
import type { AuthContext } from '@/middleware/auth';
import { z } from 'zod';

const GenerateSchema = z.object({
  type: z.enum(['slide_deck', 'quiz']),
  prompt: z.string().min(1, 'Prompt is required'),
  classId: z.string().optional(),
});

const PROVIDER = 'mock';
const MODEL = 'mock-gpt-4o-mini';

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// POST /api/teacher/library/generate - Mock AI generation
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const body = await req.json();

  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { type, prompt, classId } = parsed.data;

  // Mock generation delay for realism in demo
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Build mock prompt (system + user) for token estimation
  const systemPrompt = `You are an educational content generator. Create a ${type === 'slide_deck' ? 'slide deck' : 'quiz'} based on the given topic.`;
  const inputTokens = estimateTokens(systemPrompt) + estimateTokens(prompt);

  // Mock title and payload based on prompt
  let title = prompt;
  if (title.length > 50) title = title.substring(0, 47) + '...';

  let payload: any;
  if (type === 'slide_deck') {
    payload = {
      slides: [
        {
          id: 's1',
          title: 'Overview',
          content: `This presentation provides a comprehensive introduction to ${prompt}.`,
          bullets: ['Understanding core principles', 'Key historical context', 'Modern applications']
        },
        {
          id: 's2',
          title: 'Key Concepts',
          content: 'Important elements to remember.',
          bullets: ['Essential terminology', 'Fundamental theories', 'Practical examples']
        },
        {
          id: 's3',
          title: 'Detailed Analysis',
          content: 'A closer look at specific components.',
          bullets: ['In-depth exploration', 'Comparative studies', 'Data-driven insights']
        },
        {
          id: 's4',
          title: 'Practical Application',
          content: 'How this applies in the real world.',
          bullets: ['Industry standards', 'Problem-solving strategies', 'Case study overview']
        },
        {
          id: 's5',
          title: 'Summary & Conclusion',
          content: 'Final thoughts and key takeaways.',
          bullets: ['Major highlights', 'Future trends', 'Recommended reading']
        }
      ]
    };
  } else {
    payload = {
      questions: [
        {
          id: 'q1',
          text: `What is the primary focus of ${prompt}?`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correct: 0
        },
        {
          id: 'q2',
          text: `Which of the following is most closely related to ${prompt}?`,
          options: ['Concept X', 'Concept Y', 'Concept Z', 'Concept W'],
          correct: 1
        },
        {
          id: 'q3',
          text: `True or False: ${prompt} is a significant area of study.`,
          options: ['True', 'False'],
          correct: 0
        },
        {
          id: 'q4',
          text: `Which element is essential for ${prompt}?`,
          options: ['Element 1', 'Element 2', 'Element 3', 'Element 4'],
          correct: 2
        },
        {
          id: 'q5',
          text: `Identify a common misconception about ${prompt}.`,
          options: ['Misconception A', 'Misconception B', 'Misconception C', 'Misconception D'],
          correct: 3
        }
      ]
    };
  }

  const outputText = JSON.stringify(payload);
  const outputTokens = estimateTokens(outputText);

  const asset = await saveGeneratedContent({
    tenantId: ctx.tenantId,
    teacherId: ctx.user.id,
    type,
    title,
    payload,
    sourceKind: 'ai_generated',
    subjectTag: 'AI Generated'
  });

  // Record usage for analytics
  const feature = type === 'slide_deck' ? 'slide_generation' : 'quiz_generation';
  await recordUsage({
    tenantId: ctx.tenantId,
    actorUserId: ctx.user.id,
    actorRole: ctx.user.role,
    provider: PROVIDER,
    model: MODEL,
    endpoint: `/api/teacher/library/generate`,
    inputTokens,
    outputTokens,
    costUsd: estimateCost(MODEL + '-mock', inputTokens, outputTokens),
    classId: classId,
    feature,
  });

  return NextResponse.json({ asset }, { status: 201 });
});
