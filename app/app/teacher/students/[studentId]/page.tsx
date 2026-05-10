'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { UserCheck, GraduationCap, FileText, Calendar, TrendingUp, Brain, Sparkles, X, Edit3 } from 'lucide-react';

interface StudentClass {
  id: string;
  name: string;
  subject: string;
  batch: string;
  enrolled_at: string;
}

interface AssignmentProgress {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  visibility_status: string;
  completion_state: string | null;
  score_percent: number | null;
}

interface StudentDetail {
  id: string;
  name: string;
  phone_e164: string;
  status: string;
  created_at: string;
  classes: StudentClass[];
  assignments: AssignmentProgress[];
  profile: StudentProfile | null;
}

interface StudentProfile {
  personality_notes: string | null;
  learning_style: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  recommended_topics: string[] | null;
  created_at: string;
  updated_at: string;
}

interface TeachingPlan {
  studentId: string;
  studentName: string;
  generatedAt: string;
  overview: {
    overallAvgScore: number | null;
    totalQuizzesTaken: number;
    performanceTrend: string;
  };
  weakAreas: Array<{ topic: string; avgScore: number; attempts: number }>;
  recommendations: string[];
  suggestedActivities: string[];
}

interface PageProps {
  params: Promise<{ studentId: string }>;
}

export default function StudentDetailPage({ params }: PageProps) {
  const { studentId } = use(params);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTeachingPlanModal, setShowTeachingPlanModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    personalityNotes: '',
    learningStyle: '',
    strengths: [] as string[],
    weaknesses: [] as string[]
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [teachingPlan, setTeachingPlan] = useState<TeachingPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

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
      } else {
        setError('Student not found');
      }
    } catch (err) {
      console.error('Failed to fetch student:', err);
      setError('Failed to load student');
    } finally {
      setLoading(false);
    }
  }

  function getSessionId() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('session_id') || '';
  }

  async function saveProfile() {
    setProfileSaving(true);
    try {
      const res = await fetch(`/api/teacher/students/${studentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify({
          personalityNotes: profileForm.personalityNotes || undefined,
          learningStyle: profileForm.learningStyle || undefined,
          strengths: profileForm.strengths.length > 0 ? profileForm.strengths : undefined,
          weaknesses: profileForm.weaknesses.length > 0 ? profileForm.weaknesses : undefined
        })
      });
      if (res.ok) {
        await fetchStudent();
        setShowProfileModal(false);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setProfileSaving(false);
    }
  }

  async function fetchTeachingPlan() {
    setLoadingPlan(true);
    try {
      const res = await fetch(`/api/teacher/students/${studentId}/teaching-plan`, {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setTeachingPlan(data.plan);
        setShowTeachingPlanModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch teaching plan:', err);
    } finally {
      setLoadingPlan(false);
    }
  }

  function openProfileModal() {
    if (student?.profile) {
      setProfileForm({
        personalityNotes: student.profile.personality_notes || '',
        learningStyle: student.profile.learning_style || '',
        strengths: student.profile.strengths || [],
        weaknesses: student.profile.weaknesses || []
      });
    } else {
      setProfileForm({ personalityNotes: '', learningStyle: '', strengths: [], weaknesses: [] });
    }
    setShowProfileModal(true);
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (error || !student) return <div className="p-8 text-red-600">{error || 'Student not found'}</div>;

  const visibleAssignments = student.assignments.filter(a => a.visibility_status === 'visible' || a.visibility_status === 'completed');
  const startedAssignments = student.assignments.filter(a => a.completion_state !== null && a.completion_state !== 'pending');
  const completedAssignments = student.assignments.filter(a => a.completion_state === 'submitted' || a.completion_state === 'graded');
  const gradedAssignments = student.assignments.filter(a => a.completion_state === 'graded' && a.score_percent !== null);
  const completionRate = visibleAssignments.length > 0
    ? Math.round((completedAssignments.length / visibleAssignments.length) * 100)
    : 0;
  const avgScore = gradedAssignments.length > 0
    ? Math.round(gradedAssignments.reduce((sum, a) => sum + (a.score_percent || 0), 0) / gradedAssignments.length)
    : null;

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/teacher/students" className="text-gray-500 hover:text-gray-700">← Back</Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium">{student.name.charAt(0).toUpperCase()}</span>
          </div>
          <h1 className="text-2xl font-bold">{student.name}</h1>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
          student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          <UserCheck size={12} />
          {student.status}
        </span>
      </div>

      <div className="grid gap-6">
        {/* Student Info */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Student Information</h2>
            <button
              onClick={openProfileModal}
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              <Edit3 size={14} />
              {student.profile ? 'Edit Profile' : 'Add Profile'}
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="font-medium">{student.phone_e164}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Joined</dt>
              <dd className="font-medium">{new Date(student.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
          {student.profile && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                {student.profile.learning_style && (
                  <div>
                    <dt className="text-gray-500 text-xs uppercase tracking-wider">Learning Style</dt>
                    <dd className="font-medium capitalize">{student.profile.learning_style}</dd>
                  </div>
                )}
                {student.profile.strengths && student.profile.strengths.length > 0 && (
                  <div className="col-span-2">
                    <dt className="text-gray-500 text-xs uppercase tracking-wider">Strengths</dt>
                    <dd className="flex flex-wrap gap-1 mt-1">
                      {student.profile.strengths.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">{s}</span>
                      ))}
                    </dd>
                  </div>
                )}
                {student.profile.weaknesses && student.profile.weaknesses.length > 0 && (
                  <div className="col-span-2">
                    <dt className="text-gray-500 text-xs uppercase tracking-wider">Areas for Improvement</dt>
                    <dd className="flex flex-wrap gap-1 mt-1">
                      {student.profile.weaknesses.map((w, i) => (
                        <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">{w}</span>
                      ))}
                    </dd>
                  </div>
                )}
                {student.profile.personality_notes && (
                  <div className="col-span-2">
                    <dt className="text-gray-500 text-xs uppercase tracking-wider">Notes</dt>
                    <dd className="text-sm mt-1">{student.profile.personality_notes}</dd>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Teaching Plan */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium flex items-center gap-2">
              <Brain size={20} />
              AI Teaching Plan
            </h2>
            <button
              onClick={fetchTeachingPlan}
              disabled={loadingPlan}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm flex items-center gap-2"
            >
              <Sparkles size={16} />
              {loadingPlan ? 'Generating...' : 'Generate Plan'}
            </button>
          </div>
          <p className="text-sm text-gray-500">Generate a personalized teaching plan based on this student's quiz performance and weak areas.</p>
        </div>

        {/* Classes */}
        <div className="border rounded-lg p-6">
          <h2 className="font-medium mb-4 flex items-center gap-2">
            <GraduationCap size={20} />
            Enrolled Classes ({student.classes.length})
          </h2>
          {student.classes.length === 0 ? (
            <p className="text-gray-500">No classes enrolled</p>
          ) : (
            <ul className="divide-y">
              {student.classes.map((cls) => (
                <li key={cls.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-medium">{cls.name}</span>
                    <span className="text-sm text-gray-500 ml-2">{cls.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {cls.batch}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(cls.enrolled_at).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Analytics Summary */}
        {visibleAssignments.length > 0 && (
          <div className="border rounded-lg p-6">
            <h2 className="font-medium mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Progress Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{visibleAssignments.length}</div>
                <div className="text-sm text-gray-500">Total Assignments</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{completedAssignments.length}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
                <div className="text-sm text-gray-500">Completion Rate</div>
              </div>
              {avgScore !== null ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{avgScore}%</div>
                  <div className="text-sm text-gray-500">Avg Quiz Score</div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-400">—</div>
                  <div className="text-sm text-gray-500">No Quiz Scores</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assignment Progress */}
        <div className="border rounded-lg p-6">
          <h2 className="font-medium mb-4 flex items-center gap-2">
            <FileText size={20} />
            Assignment Progress
          </h2>
          {student.assignments.length === 0 ? (
            <p className="text-gray-500">No assignments assigned yet</p>
          ) : visibleAssignments.length === 0 ? (
            <p className="text-gray-500">No assignments visible to this student yet</p>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-4 text-sm text-gray-500 mb-3">
                <span>{completedAssignments.length} of {visibleAssignments.length} completed</span>
                {startedAssignments.length > 0 && (
                  <span>{startedAssignments.length} in progress</span>
                )}
              </div>
              <ul className="divide-y">
                {student.assignments.filter(a => a.visibility_status === 'visible' || a.visibility_status === 'completed').slice(0, 10).map((assignment) => {
                  const hasStarted = assignment.completion_state !== null && assignment.completion_state !== 'pending';
                  const isCompleted = assignment.completion_state === 'submitted' || assignment.completion_state === 'graded';
                  const isGraded = assignment.completion_state === 'graded';
                  return (
                    <li key={assignment.id} className="py-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-green-100 text-green-700'
                            : hasStarted
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isCompleted ? '✓' : hasStarted ? '●' : '○'}
                        </div>
                        <span className="font-medium">{assignment.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {assignment.due_at && (
                          <span className="text-xs text-gray-500">
                            Due {new Date(assignment.due_at).toLocaleDateString()}
                          </span>
                        )}
                        {isGraded && assignment.score_percent !== null ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {assignment.score_percent}%
                          </span>
                        ) : isCompleted ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            Completed
                          </span>
                        ) : hasStarted ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            In Progress
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                            Not Started
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {student.assignments.length > 10 && (
                <p className="text-sm text-gray-500 mt-2">
                  + {student.assignments.length - 10} more assignments
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Student Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learning Style</label>
                <select
                  value={profileForm.learningStyle}
                  onChange={(e) => setProfileForm({ ...profileForm, learningStyle: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select...</option>
                  <option value="visual">Visual</option>
                  <option value="auditory">Auditory</option>
                  <option value="kinesthetic">Kinesthetic</option>
                  <option value="reading">Reading/Writing</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Strengths (comma-separated)</label>
                <input
                  type="text"
                  value={profileForm.strengths.join(', ')}
                  onChange={(e) => setProfileForm({ ...profileForm, strengths: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Algebra, Quick learner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Areas for Improvement (comma-separated)</label>
                <input
                  type="text"
                  value={profileForm.weaknesses.join(', ')}
                  onChange={(e) => setProfileForm({ ...profileForm, weaknesses: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Geometry, Word problems"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={profileForm.personalityNotes}
                  onChange={(e) => setProfileForm({ ...profileForm, personalityNotes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Any observations about this student's learning style, interests, or behavior..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={profileSaving}
                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teaching Plan Modal */}
      {showTeachingPlanModal && teachingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Brain size={24} className="text-purple-600" />
                Teaching Plan for {teachingPlan.studentName}
              </h2>
              <button onClick={() => setShowTeachingPlanModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Overview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Overview</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {teachingPlan.overview.overallAvgScore !== null ? `${teachingPlan.overview.overallAvgScore}%` : '—'}
                    </div>
                    <div className="text-xs text-gray-500">Avg Quiz Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{teachingPlan.overview.totalQuizzesTaken}</div>
                    <div className="text-xs text-gray-500">Quizzes Taken</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${teachingPlan.overview.performanceTrend === 'improving' ? 'text-green-600' : teachingPlan.overview.performanceTrend === 'declining' ? 'text-red-600' : 'text-gray-600'}`}>
                      {teachingPlan.overview.performanceTrend === 'improving' ? '↑' : teachingPlan.overview.performanceTrend === 'declining' ? '↓' : '?'}
                    </div>
                    <div className="text-xs text-gray-500">Trend</div>
                  </div>
                </div>
              </div>

              {/* Weak Areas */}
              {teachingPlan.weakAreas.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Weak Areas Identified</h3>
                  <div className="space-y-2">
                    {teachingPlan.weakAreas.map((area, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-4 py-2">
                        <span className="font-medium text-red-800">{area.topic}</span>
                        <span className="text-sm text-red-600">{area.avgScore}% avg ({area.attempts} attempts)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {teachingPlan.recommendations.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Recommendations</h3>
                  <ul className="space-y-2">
                    {teachingPlan.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Activities */}
              {teachingPlan.suggestedActivities.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Suggested Activities</h3>
                  <div className="flex flex-wrap gap-2">
                    {teachingPlan.suggestedActivities.map((activity, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end">
              <button
                onClick={() => setShowTeachingPlanModal(false)}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}