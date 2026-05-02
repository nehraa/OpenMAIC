'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProgressGrid, type StudentProgress } from '@/lib/components/progress-grid';

interface Class {
  id: string;
  name: string;
}

interface ProgressResponse {
  classId: string;
  className: string;
  students: StudentProgress[];
  totalStudents: number;
}

interface Assignment {
  id: string;
  title: string;
}

export default function ProgressPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchAssignments(selectedClassId);
    } else {
      setAssignments([]);
    }
    setSelectedAssignmentId('');
  }, [selectedClassId]);

  async function fetchClasses() {
    try {
      const res = await fetch('/teacher/api/teacher/classes', {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
        if (data.classes?.length > 0) {
          setSelectedClassId(data.classes[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  }

  async function fetchAssignments(classId: string) {
    try {
      const res = await fetch('/teacher/api/teacher/assignments', {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        const classAssignments = (data.assignments || []).filter(
          (a: { class_id: string }) => a.class_id === classId
        );
        setAssignments(classAssignments);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  }

  async function fetchProgress() {
    if (!selectedClassId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('classId', selectedClassId);
      if (selectedAssignmentId) {
        params.append('assignmentId', selectedAssignmentId);
      }

      const res = await fetch(`/teacher/api/teacher/progress/class/${selectedClassId}?${params}`, {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setProgress(data.progress);
      } else {
        console.error('Failed to fetch progress');
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedClassId) {
      fetchProgress();
    }
  }, [selectedClassId, selectedAssignmentId]);

  const handleExportCSV = useCallback(() => {
    if (!selectedClassId) return;

    const params = new URLSearchParams();
    params.append('classId', selectedClassId);
    if (selectedAssignmentId) {
      params.append('assignmentId', selectedAssignmentId);
    }
    if (progress && progress.students.length > 0) {
      // Apply current filters if any
    }

    const url = `/teacher/api/teacher/progress/export.csv?${params}`;
    const sessionId = getSessionId();

    // Use fetch to get the CSV and download
    fetch(url, {
      headers: { 'x-session-id': sessionId }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `progress-${selectedClassId}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch((error) => {
        console.error('Failed to export CSV:', error);
      });
  }, [selectedClassId, selectedAssignmentId, progress]);

  function getSessionId() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('session_id') || '';
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Progress Tracker</h1>
        <p className="text-gray-600 mt-1">Track student progress across assignments</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="border rounded-lg px-3 py-2 min-w-[200px]"
          >
            <option value="">Select a class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assignment (optional)
          </label>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="border rounded-lg px-3 py-2 min-w-[200px]"
            disabled={!selectedClassId}
          >
            <option value="">All Assignments</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Grid */}
      {selectedClassId && progress && (
        <ProgressGrid
          students={progress.students}
          totalStudents={progress.totalStudents}
          onExportCSV={handleExportCSV}
          loading={loading}
        />
      )}

      {!selectedClassId && (
        <div className="text-center py-12 text-gray-500">
          <p>Select a class to view progress</p>
        </div>
      )}
    </div>
  );
}
