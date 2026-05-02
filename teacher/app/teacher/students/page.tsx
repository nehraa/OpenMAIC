'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Plus, X, UserCheck, GraduationCap } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  phone_e164: string;
  status: string;
  class_id: string;
  class_name: string;
  enrolled_at: string;
}

interface Class {
  id: string;
  name: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '', classId: '' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addedStudentCode, setAddedStudentCode] = useState<string | null>(null);
  const [groupByClass, setGroupByClass] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  async function fetchStudents() {
    try {
      const res = await fetch('/teacher/api/teacher/students', {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchClasses() {
    try {
      const res = await fetch('/teacher/api/teacher/classes', {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  }

  function getSessionId() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('session_id') || '';
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);

    try {
      const res = await fetch('/teacher/api/teacher/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify(addForm)
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error || 'Failed to add student');
        return;
      }

      // Refresh students list
      await fetchStudents();
      setShowAdd(false);
      setAddForm({ name: '', phone: '', classId: '' });
      setAddedStudentCode(data.student.join_code);
    } catch (error) {
      setAddError('Failed to add student');
    } finally {
      setAddLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  // Group students by class if enabled
  const studentsByClass = groupByClass
    ? classes.reduce((acc, cls) => {
        acc[cls.id] = {
          class: cls,
          students: students.filter(s => s.class_id === cls.id)
        };
        return acc;
      }, {} as Record<string, { class: Class; students: Student[] }>)
    : null;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-sm text-gray-500 mt-1">{students.length} student{students.length !== 1 ? 's' : ''} across {classes.length} class{classes.length !== 1 ? 'es' : ''}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setGroupByClass(!groupByClass)}
            className={`px-4 py-2 rounded-lg border ${groupByClass ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}
          >
            {groupByClass ? 'Show all' : 'Group by class'}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus size={18} />
            Add Student
          </button>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Student</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            {addedStudentCode ? (
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 font-medium mb-2">Student Added Successfully!</p>
                  <p className="text-sm text-green-600 mb-3">Share this join code with the student:</p>
                  <div className="bg-white border border-green-300 rounded-lg px-4 py-3 font-mono text-xl font-bold tracking-wider">
                    {addedStudentCode}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(addedStudentCode);
                  }}
                  className="text-primary hover:underline text-sm"
                >
                  Copy code
                </button>
                <button
                  onClick={() => {
                    setAddedStudentCode(null);
                    setShowAdd(false);
                  }}
                  className="block w-full mt-4 bg-primary text-white py-2 rounded-lg hover:bg-primary/90"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddStudent}>
                {addError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {addError}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={addForm.phone}
                      onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                    <select
                      value={addForm.classId}
                      onChange={e => setAddForm({ ...addForm, classId: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      required
                    >
                      <option value="">Select a class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {addLoading ? 'Adding...' : 'Add Student'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Students List */}
      {students.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="mb-4">No students yet</p>
          <button onClick={() => setShowAdd(true)} className="text-primary hover:underline">
            Add your first student
          </button>
        </div>
      ) : groupByClass ? (
        <div className="space-y-6">
          {Object.values(studentsByClass || {}).map(({ class: cls, students: clsStudents }) => (
            <div key={cls.id} className="bg-white border rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <GraduationCap size={18} className="text-gray-500" />
                  <span className="font-semibold">{cls.name}</span>
                </div>
                <span className="text-sm text-gray-500">{clsStudents.length} student{clsStudents.length !== 1 ? 's' : ''}</span>
              </div>
              {clsStudents.length === 0 ? (
                <div className="p-4 text-center text-gray-400">No students in this class</div>
              ) : (
                <table className="w-full">
                  <tbody className="divide-y">
                    {clsStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary text-sm font-medium">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <Link href={`/teacher/students/${student.id}`} className="font-medium hover:text-primary">
                                {student.name}
                              </Link>
                              <p className="text-xs text-gray-500">{student.phone_e164}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <UserCheck size={12} />
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">Student</th>
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">Class</th>
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-sm font-medium">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <Link href={`/teacher/students/${student.id}`} className="font-medium hover:text-primary">
                          {student.name}
                        </Link>
                        <p className="text-xs text-gray-500">{student.phone_e164}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{student.class_name}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <UserCheck size={12} />
                      {student.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-sm">
                    {new Date(student.enrolled_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
