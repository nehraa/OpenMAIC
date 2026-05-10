import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '../../../../../middleware';
import { getDb } from '../../../../../lib/db';
import type { AuthContext } from '../../../../../middleware/auth';

// GET /api/teacher/students/[studentId]/teaching-plan - Generate personalized teaching plan based on student weaknesses
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { studentId } = await routeCtx.params;
  const db = getDb();

  // Verify student belongs to this teacher
  const studentCheck = await db.query(`
    SELECT u.id, u.name FROM users u
    JOIN class_memberships cm ON u.id = cm.student_id
    JOIN classes c ON cm.class_id = c.id
    WHERE u.id = $1 AND c.teacher_id = $2 AND u.role = 'student_classroom'
  `, [studentId, ctx.user.id]);

  if (studentCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const studentName = studentCheck.rows[0].name;

  // Get student's past quiz attempts to identify weak areas
  const attemptsResult = await db.query(`
    SELECT aa.score_percent, aa.topic_tags, aa.submitted_at, a.title as assignment_title
    FROM assignment_attempts aa
    JOIN assignments a ON aa.assignment_id = a.id
    JOIN classes c ON a.class_id = c.id
    WHERE aa.student_id = $1 AND c.teacher_id = $2 AND aa.score_percent IS NOT NULL
    ORDER BY aa.submitted_at DESC
    LIMIT 20
  `, [studentId, ctx.user.id]);

  const attempts = attemptsResult.rows as Array<{
    score_percent: number;
    topic_tags: string[] | null;
    submitted_at: string;
    assignment_title: string;
  }>;

  // Also check student profile for documented weaknesses
  const profileResult = await db.query(`
    SELECT strengths, weaknesses, recommended_topics FROM student_profiles WHERE student_id = $1
  `, [studentId]);
  const profile = profileResult.rows.length > 0 ? profileResult.rows[0] : null;

  // Aggregate weak areas from quiz attempts
  const topicPerformance: Record<string, { total: number; count: number; avgScore: number }> = {};

  for (const attempt of attempts) {
    if (attempt.topic_tags && Array.isArray(attempt.topic_tags)) {
      for (const tag of attempt.topic_tags) {
        if (!topicPerformance[tag]) {
          topicPerformance[tag] = { total: 0, count: 0, avgScore: 0 };
        }
        topicPerformance[tag].total += attempt.score_percent;
        topicPerformance[tag].count += 1;
        topicPerformance[tag].avgScore = topicPerformance[tag].total / topicPerformance[tag].count;
      }
    }
  }

  // Identify weakest topics (avg score < 70)
  const weakTopics = Object.entries(topicPerformance)
    .filter(([, data]) => data.avgScore < 70)
    .sort(([, a], [, b]) => a.avgScore - b.avgScore)
    .slice(0, 5)
    .map(([topic, data]) => ({
      topic,
      avgScore: Math.round(data.avgScore),
      attempts: data.count
    }));

  // Get overall average score
  const overallAvg = attempts.length > 0
    ? attempts.reduce((sum, a) => sum + a.score_percent, 0) / attempts.length
    : null;

  // Build teaching plan
  const teachingPlan = {
    studentId,
    studentName,
    generatedAt: new Date().toISOString(),
    overview: {
      overallAvgScore: overallAvg ? Math.round(overallAvg) : null,
      totalQuizzesTaken: attempts.length,
      performanceTrend: attempts.length >= 2
        ? (attempts[0].score_percent > attempts[attempts.length - 1].score_percent ? 'improving' : 'declining')
        : 'insufficient_data'
    },
    weakAreas: weakTopics,
    recommendations: [] as string[],
    suggestedActivities: [] as string[]
  };

  // Generate recommendations based on weak areas
  if (weakTopics.length === 0 && overallAvg !== null && overallAvg >= 70) {
    teachingPlan.recommendations.push('Student is performing well. Consider providing enrichment activities.');
    teachingPlan.suggestedActivities.push('Advanced problem-solving exercises');
    teachingPlan.suggestedActivities.push('Peer tutoring opportunities');
  } else if (weakTopics.length === 0) {
    teachingPlan.recommendations.push('Insufficient quiz data to identify specific weaknesses.');
    teachingPlan.recommendations.push('Continue assigning quizzes with topic tags for better analysis.');
  } else {
    for (const weak of weakTopics) {
      teachingPlan.recommendations.push(
        `Focus on "${weak.topic}" - student averages ${weak.avgScore}% across ${weak.attempts} quiz attempts`
      );
    }

    // Generate activities based on weakest topics
    teachingPlan.suggestedActivities.push(
      `Create targeted practice problems for: ${weakTopics.map(t => t.topic).join(', ')}`
    );
    teachingPlan.suggestedActivities.push(
      'Assign remedial learning material covering foundational concepts'
    );
    teachingPlan.suggestedActivities.push(
      'Schedule one-on-one session to address top 2 weak areas'
    );
  }

  // Add any documented weaknesses from profile
  if (profile?.weaknesses && Array.isArray(profile.weaknesses) && profile.weaknesses.length > 0) {
    teachingPlan.recommendations.push(
      `Teacher-documented weakness: ${profile.weaknesses.join(', ')}`
    );
  }

  // Add any recommended topics from profile
  if (profile?.recommended_topics && Array.isArray(profile.recommended_topics) && profile.recommended_topics.length > 0) {
    teachingPlan.suggestedActivities.push(
      `Previously recommended topics: ${profile.recommended_topics.join(', ')}`
    );
  }

  return NextResponse.json({ plan: teachingPlan });
});
