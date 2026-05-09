'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { GraduationCap, Users, Copy, FileText, ArrowLeft } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  subject: string;
  batch: string;
  join_code: string;
  student_count: number;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  phone_e164: string;
  enrolled_at: string;
  source: string;
}

interface Assignment {
  id: string;
  title: string;
  status: 'draft' | 'scheduled' | 'released' | 'closed';
  due_at: string | null;
  created_at: string;
  recipient_count: number;
}

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default function ClassDetailPage({ params }: PageProps) {
  const { classId } = use(params);
  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'assignments'>('students');

  useEffect(() => {
    fetchClassData();
    fetchStudents();
    fetchAssignments();
  }, [classId]);

  function getSessionId() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('session_id') || '';
  }

  async function fetchClassData() {
    try {
      const res = await fetch(`/api/teacher/classes/${classId}`, {
        headers: { 'x-session-id': getSessionId() }
      });
      if (!res.ok) {
        if (res.status === 404) {
          setError('Class not found');
        } else {
          setError('Failed to load class');
        }
        return;
      }
      const data = await res.json();
      setClassData(data.class);
    } catch (err) {
      setError('Failed to load class');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudents() {
    try {
      const res = await fetch(`/api/teacher/classes/${classId}/students`, {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  }

  async function fetchAssignments() {
    try {
      const res = await fetch(`/api/teacher/assignments?classId=${classId}`, {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    }
  }

  async function copyJoinCode(code: string) {
    await navigator.clipboard.writeText(code);
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error || !classData) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{error || 'Class not found'}</p>
          <Link href="/teacher/classes" className="text-primary hover:underline">
            Back to Classes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link
        href="/teacher/classes"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={18} />
        Back to Classes
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">{classData.name}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {classData.subject && <span>Subject: {classData.subject}</span>}
            {classData.batch && <span>Batch: {classData.batch}</span>}
          </div>
        </div>
        <button
          onClick={() => copyJoinCode(classData.join_code)}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          title="Copy join code"
        >
          <Copy size={16} />
          <span className="font-mono text-sm">{classData.join_code}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap size={20} className="text-primary" />
            </div>
            <span className="text-sm text-gray-500">Total Students</span>
          </div>
          <p className="text-2xl font-bold">{classData.student_count}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText size={20} className="text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Assignments</span>
          </div>
          <p className="text-2xl font-bold">{assignments.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Join Code</span>
          </div>
          <p className="text-lg font-bold font-mono">{classData.join_code}</p>
        </div>
      </div>

      <div className="border-b mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'assignments'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Assignments ({assignments.length})
          </button>
        </nav>
      </div>

      {activeTab === 'students' && (
        <div className="bg-white border rounded-xl overflow-hidden">
          {students.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No students enrolled yet</p>
              <p className="text-sm">Share the join code with students to enroll them</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{student.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-gray-600">{student.phone_e164}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(student.enrolled_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{student.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="bg-white border rounded-xl overflow-hidden">
          {assignments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No assignments yet</p>
              <Link href="/teacher/assignments" className="text-primary hover:underline text-sm">
                Create an assignment
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/teacher/assignments/${assignment.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {assignment.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        assignment.status === 'released' ? 'bg-green-100 text-green-700' :
                        assignment.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                        assignment.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {assignment.due_at ? new Date(assignment.due_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{assignment.recipient_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}