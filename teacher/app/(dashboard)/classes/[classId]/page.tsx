'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  phone_e164: string;
  enrolled_at: string;
  source: string;
}

interface ClassData {
  id: string;
  name: string;
  subject: string;
  batch: string;
  join_code: string;
  student_count: number;
}

export default function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ phone: '', name: '' });
  const [csvContent, setCsvContent] = useState('');

  useEffect(() => {
    fetchClassData();
    fetchStudents();
  }, [classId]);

  async function fetchClassData() {
    try {
      const res = await fetch(`/api/teacher/classes/${classId}`, {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setClassData(data.class);
      }
    } catch (error) {
      console.error('Failed to fetch class:', error);
    }
  }

  async function fetchStudents() {
    try {
      const res = await fetch(`/api/teacher/classes/${classId}/students`, {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await fetch(`/api/teacher/classes/${classId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify(newStudent)
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewStudent({ phone: '', name: '' });
        fetchStudents();
        fetchClassData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add student');
      }
    } catch (error) {
      console.error('Failed to add student:', error);
    }
  }

  async function handleImportCSV(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await fetch(`/api/teacher/classes/${classId}/students/import-csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify({ csv: csvContent })
      });

      if (res.ok) {
        const results = await res.json();
        setShowImportModal(false);
        setCsvContent('');
        alert(`Imported ${results.success} students. ${results.errors?.length || 0} errors.`);
        fetchStudents();
        fetchClassData();
      }
    } catch (error) {
      console.error('Failed to import CSV:', error);
    }
  }

  async function handleRemoveStudent(studentId: string) {
    if (!confirm('Remove this student from the class?')) return;

    try {
      const res = await fetch(`/api/teacher/classes/${classId}/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'x-session-id': getSessionId() }
      });

      if (res.ok) {
        fetchStudents();
        fetchClassData();
      }
    } catch (error) {
      console.error('Failed to remove student:', error);
    }
  }

  function getSessionId() {
    return localStorage.getItem('session_id') || '';
  }

  if (loading || !classData) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <Link href="/classes" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Classes
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{classData.name}</h1>
          <p className="text-gray-600">{classData.subject} • {classData.batch}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Join Code</div>
          <div className="font-mono text-xl font-bold">{classData.join_code}</div>
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Student
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Import CSV
        </button>
      </div>

      <div className="bg-white border rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Enrolled</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Source</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No students enrolled yet
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-3">{student.name || 'Unnamed'}</td>
                  <td className="px-4 py-3 font-mono text-sm">{student.phone_e164}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(student.enrolled_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      student.source === 'csv' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                    }`}>
                      {student.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRemoveStudent(student.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Student</h2>
            <form onSubmit={handleAddStudent}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Phone (E.164 format) *</label>
                <input
                  type="tel"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="+919876543210"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Import Students from CSV</h2>
            <form onSubmit={handleImportCSV}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">CSV Content</label>
                <textarea
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                  rows={10}
                  placeholder="phone,name&#10;+919876543210,John Doe&#10;+919876543211,Jane Smith"
                  required
                />
              </div>
              <div className="text-sm text-gray-500 mb-4">
                CSV must have "phone" column. "name" is optional.
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}