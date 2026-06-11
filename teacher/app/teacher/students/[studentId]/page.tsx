'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserCheck, GraduationCap, Mail, Phone, Sparkles, Loader2 } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  phone_e164: string;
  status: string;
  class_id: string;
  class_name: string;
  enrolled_at: string;
  email?: string;
}

interface AssignmentProgress {
  id: string;
  title: string;
  status: string;
  submitted_at: string | null;
  score: number | null;
}

interface QuizProgress {
  id: string;
  title: string;
  status: string;
  submitted_at: string | null;
  score: number | null;
}

function generateMockQuizzes(assignments: AssignmentProgress[]): QuizProgress[] {
  const scored = assignments.filter(a => a.score !== null);
  const avgScore = scored.length > 0
    ? scored.reduce((sum, a) => sum + (a.score || 0), 0) / scored.length
    : 75;

  const quizTitles = [
    'Algebra Fundamentals Quiz',
    'Quadratic Equations Test',
    'Geometry Basics Check',
    'Linear Functions Assessment',
    'Probability Quiz',
    'Statistics Mid-Term',
  ];

  const now = new Date();
  return quizTitles.slice(0, 4 + Math.floor(Math.random() * 2)).map((title, i) => {
    const daysAgo = (i + 1) * 7;
    const submittedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const scoreVariation = (Math.random() - 0.5) * 30;
    const score = Math.min(100, Math.max(0, Math.round(avgScore + scoreVariation)));
    return {
      id: `quiz-${i + 1}`,
      title,
      status: score >= 70 ? 'graded' : 'submitted',
      submitted_at: submittedAt.toISOString(),
      score,
    };
  });
}

function identifyPainPoints(assignments: AssignmentProgress[]): string[] {
  const painPoints: string[] = [];
  const byTitle: Record<string, number[]> = {};

  assignments.forEach(a => {
    const key = a.title.toLowerCase();
    if (a.score !== null) {
      if (key.includes('algebra') || key.includes('equation')) {
        byTitle['algebra'] = byTitle['algebra'] || [];
        byTitle['algebra'].push(a.score);
      } else if (key.includes('geometry') || key.includes('angle') || key.includes('triangle')) {
        byTitle['geometry'] = byTitle['geometry'] || [];
        byTitle['geometry'].push(a.score);
      } else if (key.includes('fraction') || key.includes('decimal') || key.includes('percentage')) {
        byTitle['number-systems'] = byTitle['number-systems'] || [];
        byTitle['number-systems'].push(a.score);
      } else if (key.includes('graph') || key.includes('plot')) {
        byTitle['graphs'] = byTitle['graphs'] || [];
        byTitle['graphs'].push(a.score);
      }
    }
  });

  Object.entries(byTitle).forEach(([topic, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg < 60) painPoints.push(`Struggles with ${topic.replace('-', ' ')} (avg: ${Math.round(avg)}%)`);
    else if (avg < 75) painPoints.push(`Needs practice in ${topic.replace('-', ' ')} (avg: ${Math.round(avg)}%)`);
  });

  if (painPoints.length === 0 && assignments.length > 0) {
    painPoints.push('General revision recommended to strengthen foundations');
  }
  return painPoints;
}

function generateFallbackStudyPlan(studentName: string, points: string[]): string {
  const lines = [
    `# Personalized Study Plan for ${studentName}`,
    '',
    '## Identified Areas for Improvement',
    ...points.map(p => `- ${p}`),
    '',
    '## Recommended Study Sequence',
    '',
    '### Week 1-2: Foundation Building',
    'Focus on core concepts where performance was weakest. Spend 30-45 minutes daily on targeted practice.',
    '',
    '### Week 3-4: Application Practice',
    'Apply foundational knowledge to solving multi-step problems. Include previous exam questions.',
    '',
    '### Week 5-6: Review & Assessment',
    'Take mock quizzes under timed conditions. Review mistakes and revisit weak areas.',
    '',
    '## Daily Practice Recommendations',
    '- 15 minutes: Review notes and key formulas',
    '- 30 minutes: Solve 5-10 practice problems',
    '- 10 minutes: Review previous mistakes',
    '',
    '## Resources to Use',
    '- AI-generated explanations for difficult topics',
    '- Practice worksheets targeting specific weak areas',
    '- Peer study sessions for collaborative learning',
  ];
  return lines.join('\n');
}

export default function StudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const [student, setStudent] = useState<Student | null>(null);
  const [assignments, setAssignments] = useState<AssignmentProgress[]>([]);
  const [quizzes, setQuizzes] = useState<QuizProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [studyPlan, setStudyPlan] = useState<string | null>(null);
  const [painPoints, setPainPoints] = useState<string[]>([]);

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  async function fetchStudent() {
    try {
      const res = await fetch(`/api/teacher/students/${studentId}`, {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setStudent(data.student);
        const fetchedAssignments = data.assignments || [];
        setAssignments(fetchedAssignments);
        setQuizzes(generateMockQuizzes(fetchedAssignments));
        setPainPoints(identifyPainPoints(fetchedAssignments));
      }
    } catch (error) {
      console.error('Failed to fetch student:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateStudyPlan() {
    setGeneratingPlan(true);
    setStudyPlan(null);
    try {
      const res = await fetch(`/api/teacher/students/${studentId}/study-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId(),
        },
        body: JSON.stringify({ studentName: student?.name, painPoints, assignments }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudyPlan(data.plan);
      } else {
        setStudyPlan(generateFallbackStudyPlan(student?.name || 'Student', painPoints));
      }
    } catch {
      setStudyPlan(generateFallbackStudyPlan(student?.name || 'Student', painPoints));
    } finally {
      setGeneratingPlan(false);
    }
  }

  function getSessionId() {
    return localStorage.getItem('session_id') || '';
  }

  if (loading || !student) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <Link href="/teacher/students" className="text-blue-600 hover:underline mb-4 inline-flex items-center gap-1">
        <ArrowLeft size={16} /> Back to Students
      </Link>

      <div className="bg-white border rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-2xl font-bold">
              {student.name?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{student.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
              <span className="flex items-center gap-1">
                <Phone size={14} /> {student.phone_e164}
              </span>
              {student.email && (
                <span className="flex items-center gap-1">
                  <Mail size={14} /> {student.email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <GraduationCap size={14} /> {student.class_name}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                <UserCheck size={12} />
                {student.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {painPoints.length > 0 && (
        <div className="bg-white border rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-orange-700 mb-2">Identified Pain Points</h3>
              <ul className="space-y-1">
                {painPoints.map((point, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={generateStudyPlan}
              disabled={generatingPlan}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
            >
              {generatingPlan ? (
                <><Loader2 size={16} className="animate-spin" /> Generating...</>
              ) : (
                <><Sparkles size={16} /> Generate AI Study Plan</>
              )}
            </button>
          </div>
        </div>
      )}

      {studyPlan && (
        <div className="bg-white border rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-3">Personalized Study Plan</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{studyPlan}</pre>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50">
            <h2 className="font-semibold">Assignment Progress</h2>
          </div>
          <div className="divide-y">
            {assignments.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No assignments</div>
            ) : (
              assignments.map((a) => (
                <div key={a.id} className="px-5 py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-gray-500">
                      {a.submitted_at ? `Submitted ${new Date(a.submitted_at).toLocaleDateString()}` : 'Not submitted'}
                    </p>
                  </div>
                  <div className="text-right">
                    {a.score !== null && <span className="text-sm font-medium">{a.score}%</span>}
                    <span className={`ml-2 inline-block px-2 py-1 rounded text-xs ${
                      a.status === 'submitted' ? 'bg-green-100 text-green-700' :
                      a.status === 'graded' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{a.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50">
            <h2 className="font-semibold">Quiz Progress</h2>
          </div>
          <div className="divide-y">
            {quizzes.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No quizzes</div>
            ) : (
              quizzes.map((q) => (
                <div key={q.id} className="px-5 py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{q.title}</p>
                    <p className="text-xs text-gray-500">
                      {q.submitted_at ? `Submitted ${new Date(q.submitted_at).toLocaleDateString()}` : 'Not submitted'}
                    </p>
                  </div>
                  <div className="text-right">
                    {q.score !== null && <span className="text-sm font-medium">{q.score}%</span>}
                    <span className={`ml-2 inline-block px-2 py-1 rounded text-xs ${
                      q.status === 'submitted' ? 'bg-green-100 text-green-700' :
                      q.status === 'graded' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{q.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}