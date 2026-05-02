'use client';

import { useState, useMemo, Fragment } from 'react';

export interface StudentProgress {
  studentId: string;
  studentName: string;
  studentPhone: string;
  assignments: AssignmentProgress[];
  aiInsights?: string[];
}

export interface AssignmentProgress {
  assignmentId: string;
  assignmentTitle: string;
  slidesViewed: number;
  totalSlides: number;
  slidesCompleted: boolean;
  quizCompleted: boolean;
  quizScorePercent: number | null;
  totalTimeMinutes: number;
  lastActivityAt: string | null;
}

interface ProgressGridProps {
  students: StudentProgress[];
  totalStudents: number;
  onExportCSV: () => void;
  loading?: boolean;
}

type SortField = 'name' | 'score' | 'completion';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'completed' | 'not_started' | 'low_score';

const STUDENTS_PER_PAGE = 20;

export function ProgressGrid({ students, totalStudents, onExportCSV, loading }: ProgressGridProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate overall student scores for sorting
  const studentScores = useMemo(() => {
    const scores = new Map<string, { avgScore: number; completedCount: number; totalCount: number }>();
    if (!students || !Array.isArray(students)) return scores;
    
    students.forEach((student) => {
      const assignmentScores = (student.assignments || [])
        .filter((a) => a.quizScorePercent !== null)
        .map((a) => a.quizScorePercent as number);
      const avgScore = assignmentScores.length > 0
        ? assignmentScores.reduce((sum, s) => sum + s, 0) / assignmentScores.length
        : 0;
      const completedCount = (student.assignments || []).filter(
        (a) => a.slidesCompleted && a.quizCompleted
      ).length;
      scores.set(student.studentId, {
        avgScore,
        completedCount,
        totalCount: (student.assignments || []).length
      });
    });
    return scores;
  }, [students]);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];
    let result = [...students];

    // Apply filter
    if (filterStatus !== 'all') {
      result = result.filter((student) => {
        const data = studentScores.get(student.studentId);
        if (!data || data.totalCount === 0) {
          return filterStatus === 'not_started';
        }

        switch (filterStatus) {
          case 'completed':
            return data.completedCount === data.totalCount;
          case 'not_started':
            return data.completedCount === 0 && student.assignments.every((a) => a.slidesViewed === 0);
          case 'low_score':
            return data.avgScore > 0 && data.avgScore < 60;
          default:
            return true;
        }
      });
    }

    // Apply sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.studentName.localeCompare(b.studentName);
          break;
        case 'score':
          const scoreA = studentScores.get(a.studentId)?.avgScore ?? -1;
          const scoreB = studentScores.get(b.studentId)?.avgScore ?? -1;
          comparison = scoreA - scoreB;
          break;
        case 'completion':
          const compA = studentScores.get(a.studentId)?.completedCount ?? 0;
          const compB = studentScores.get(b.studentId)?.completedCount ?? 0;
          comparison = compA - compB;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [students, filterStatus, sortField, sortOrder, studentScores]);

  // Paginate
  const totalPages = Math.ceil(filteredAndSortedStudents.length / STUDENTS_PER_PAGE);
  const paginatedStudents = filteredAndSortedStudents.slice(
    (currentPage - 1) * STUDENTS_PER_PAGE,
    currentPage * STUDENTS_PER_PAGE
  );

  // Reset to page 1 when filter changes
  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const toggleExpanded = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading progress data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filterStatus}
            onChange={(e) => handleFilterChange(e.target.value as FilterStatus)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="not_started">Not Started</option>
            <option value="low_score">Low Score (&lt;60%)</option>
          </select>

          <span className="text-sm text-gray-500">
            Showing {paginatedStudents.length} of {filteredAndSortedStudents.length} students
          </span>
        </div>

        <button
          onClick={onExportCSV}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 text-sm font-medium"
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-8"></th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                Student{getSortIndicator('name')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Phone</th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('completion')}
              >
                Assignments{getSortIndicator('completion')}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('score')}
              >
                Avg Score{getSortIndicator('score')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No students found
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student) => {
                const data = studentScores.get(student.studentId);
                const isExpanded = expandedStudents.has(student.studentId);

                return (
                  <Fragment key={student.studentId}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleExpanded(student.studentId)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium">{student.studentName}</td>
                      <td className="px-4 py-3 text-gray-600">{student.studentPhone}</td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600">
                          {data?.completedCount ?? 0}/{data?.totalCount ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {data?.avgScore != null && data.avgScore >= 0 ? (
                          <span
                            className={`font-medium ${
                              data.avgScore < 60 ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {Math.round(data.avgScore)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${student.studentId}-details`} className="bg-gray-50">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="pl-4 border-l-2 border-gray-200 space-y-4">
                            {/* AI Insights */}
                            {student.aiInsights && student.aiInsights.length > 0 && (
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
                                  AI Learning Insights
                                </h4>
                                <ul className="list-disc list-inside text-sm text-blue-900 space-y-1">
                                  {student.aiInsights.map((insight, idx) => (
                                    <li key={idx}>{insight}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {student.assignments.length === 0 ? (
                              <p className="text-gray-500 text-sm">No assignments</p>
                            ) : (
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-gray-500">
                                    <th className="pb-2 font-medium">Assignment</th>
                                    <th className="pb-2 font-medium">Slides</th>
                                    <th className="pb-2 font-medium">Quiz</th>
                                    <th className="pb-2 font-medium">Score</th>
                                    <th className="pb-2 font-medium">Time</th>
                                    <th className="pb-2 font-medium">Last Activity</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {student.assignments.map((assignment) => (
                                    <tr key={assignment.assignmentId} className="border-t">
                                      <td className="py-2 font-medium">{assignment.assignmentTitle}</td>
                                      <td className="py-2">
                                        {assignment.slidesCompleted ? (
                                          <span className="text-green-600">✓</span>
                                        ) : (
                                          <span className="text-gray-400">
                                            {assignment.slidesViewed}/{assignment.totalSlides}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2">
                                        {assignment.quizCompleted ? (
                                          <span className="text-green-600">✓</span>
                                        ) : (
                                          <span className="text-gray-400">✗</span>
                                        )}
                                      </td>
                                      <td className="py-2">
                                        {assignment.quizScorePercent !== null ? (
                                          <span
                                            className={
                                              assignment.quizScorePercent < 60
                                                ? 'text-red-600'
                                                : 'text-green-600'
                                            }
                                          >
                                            {assignment.quizScorePercent}%
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">—</span>
                                        )}
                                      </td>
                                      <td className="py-2 text-gray-600">
                                        {assignment.totalTimeMinutes > 0
                                          ? `${assignment.totalTimeMinutes}m`
                                          : '—'}
                                      </td>
                                      <td className="py-2 text-gray-600 text-xs">
                                        {assignment.lastActivityAt
                                          ? new Date(assignment.lastActivityAt).toLocaleString()
                                          : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
