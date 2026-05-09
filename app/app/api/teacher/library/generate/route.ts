import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '../../../../middleware';
import { saveGeneratedContent } from '../../../../lib/server/library';
import type { AuthContext } from '../../../../middleware/auth';
import { z } from 'zod';

export const maxDuration = 900; // 15 minutes - generation can take up to 10 min

const GenerateSchema = z.object({
  type: z.enum(['slide_deck', 'quiz']),
  prompt: z.string().min(1, 'Prompt is required'),
});

// Call OpenMAIC classroom generation API
async function generateOpenMAICClassroom(requirement: string, baseUrl: string): Promise<{ classroomId: string; url: string }> {
  const res = await fetch(`${baseUrl}/api/generate-classroom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirement }),
  });

  if (!res.ok) {
    throw new Error(`OpenMAIC generation failed: ${res.statusText}`);
  }

  const { jobId, pollUrl } = await res.json();

  // Poll for completion (up to 15 minutes)
  const maxAttempts = 180;
  console.log(`[OpenMAIC] Starting to poll ${pollUrl}, max attempts: ${maxAttempts}`);
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const pollRes = await fetch(pollUrl);
    if (!pollRes.ok) {
      console.log(`[OpenMAIC] Poll fetch failed: ${pollRes.statusText}`);
      throw new Error(`Polling failed: ${pollRes.statusText}`);
    }

    const job = await pollRes.json();
    console.log(`[OpenMAIC] Poll attempt ${i+1}: status=${job.status}, done=${job.done}, step=${job.step}`);
    if (job.done) {
      if (job.status === 'failed') {
        console.log(`[OpenMAIC] Job failed: ${job.error}`);
        throw new Error(job.error || 'Generation failed');
      }
      console.log(`[OpenMAIC] Job succeeded: ${JSON.stringify(job.result)}`);
      return { classroomId: job.result.classroomId, url: job.result.url };
    }
  }
  console.log(`[OpenMAIC] Polling timed out after ${maxAttempts} attempts`);

  throw new Error('Generation timed out');
}

// POST /api/teacher/library/generate - AI generation via OpenMAIC
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const body = await req.json();

  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { type, prompt } = parsed.data;

  // Determine OpenMAIC base URL (configurable via env)
  const openmaicUrl = process.env.OPENMAIC_BASE_URL || 'http://localhost:3002';
  const baseUrl = process.env.OPENMAIC_PUBLIC_URL || openmaicUrl;

  let classroomId = '';
  let classroomUrl = '';

  // Call OpenMAIC for slide_deck generation
  if (type === 'slide_deck') {
    try {
      // Try OpenMAIC generation with a 60-second timeout for demo responsiveness
      // If it takes longer, fall back to mock content (OpenMAIC continues in background)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('OpenMAIC generation taking too long - using demo content')), 60000);
      });
      const result = await Promise.race([
        generateOpenMAICClassroom(prompt, openmaicUrl),
        timeoutPromise
      ]) as { classroomId: string; url: string };
      classroomId = result.classroomId;
      classroomUrl = result.url;
    } catch (err) {
      console.error('OpenMAIC classroom generation failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      // If it's an API key issue, usage limit exceeded, or timeout, return mock content for demo
      const isFallbackError = errMsg.includes('API key required') ||
        errMsg.includes('OPENAI_API_KEY') ||
        errMsg.includes('Invalid API key') ||
        errMsg.includes('usage limit exceeded') ||
        errMsg.includes('token plan') ||
        errMsg.includes('taking too long');
      if (isFallbackError) {
        console.log('OpenAI API key not configured - using mock slide content for demo');
        const mockSlides = [
          { id: 's1', title: `Introduction to ${prompt}`, content: `This is an introductory slide about ${prompt}. Key concepts will be covered in this lesson.`, bullets: ['Understanding the basics', 'Key terminology', 'Real-world applications'] },
          { id: 's2', title: `Core Concepts of ${prompt}`, content: `Let's explore the fundamental concepts of ${prompt}. This slide covers the essential principles.`, bullets: ['Principle 1: Foundation', 'Principle 2: Implementation', 'Principle 3: Practice'] },
          { id: 's3', title: `Understanding ${prompt}`, content: `A deeper look into ${prompt} and how it relates to the broader subject matter.`, bullets: ['Historical context', 'Current relevance', 'Future implications'] },
          { id: 's4', title: `Examples of ${prompt}`, content: `Practical examples and case studies related to ${prompt}.`, bullets: ['Example 1: Real-world scenario', 'Example 2: Application in industry', 'Example 3: Common use cases'] },
          { id: 's5', title: `Summary: ${prompt}`, content: `Let's recap what we learned about ${prompt}.`, bullets: ['Key takeaways', 'Further reading', 'Practice exercises'] }
        ];
        const mockPayload = {
          slides: mockSlides,
          mockGenerated: true,
          originalPrompt: prompt,
          generatedAt: new Date().toISOString(),
        };
        const asset = await saveGeneratedContent({
          tenantId: ctx.tenantId,
          teacherId: ctx.user.id,
          type,
          title: prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt,
          payload: mockPayload,
          sourceKind: 'ai_generated',
          subjectTag: 'AI Generated',
          sourceRef: 'mock-classroom-id',
        });
        const { getDb } = await import('../../../../lib/db');
        const db = getDb();
        const versionResult = await db.query(`
          SELECT id FROM content_asset_versions
          WHERE asset_id = $1
          ORDER BY version_number DESC
          LIMIT 1
        `, [asset.id]);
        return NextResponse.json({
          asset: { ...asset, latest_version_id: versionResult.rows[0]?.id || null },
          mockContent: true
        }, { status: 201 });
      }
      return NextResponse.json({
        error: 'Failed to generate learning material. Please ensure OpenMAIC service is running.',
        details: errMsg
      }, { status: 503 });
    }
  }

  // Build payload (mock quiz data for quizzes, real slides stored in OpenMAIC)
  let payload: any;
  if (type === 'slide_deck') {
    // For slides, payload stores reference to OpenMAIC classroom
    // The actual content is in OpenMAIC
    payload = {
      openmaicClassroomId: classroomId,
      openmaicUrl: classroomUrl,
      prompt,
      generatedAt: new Date().toISOString(),
    };
  } else {
    // Mock quiz data
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

  const asset = await saveGeneratedContent({
    tenantId: ctx.tenantId,
    teacherId: ctx.user.id,
    type,
    title: prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt,
    payload,
    sourceKind: 'ai_generated',
    subjectTag: 'AI Generated',
    sourceRef: classroomId, // Store OpenMAIC classroom ID as reference
  });

  // Get the latest version ID for this asset
  const { getDb } = await import('../../../../lib/db');
  const db = getDb();
  const versionResult = await db.query(`
    SELECT id FROM content_asset_versions
    WHERE asset_id = $1
    ORDER BY version_number DESC
    LIMIT 1
  `, [asset.id]);

  return NextResponse.json({
    asset: {
      ...asset,
      latest_version_id: versionResult.rows[0]?.id || null
    }
  }, { status: 201 });
});
