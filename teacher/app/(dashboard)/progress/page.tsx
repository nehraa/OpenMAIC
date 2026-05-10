'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface StudentProgress {
  id: string
  name: string
  className: string
  completionRate: number
  avgQuizScore: number
  lastActive: string
}

interface ProgressFilters {
  classId?: string
  dateRange: 'week' | 'month' | 'all'
}

const MOCK_STUDENTS: StudentProgress[] = [
  { id: '1', name: 'Alice Johnson', className: 'Mathematics 10A', completionRate: 85, avgQuizScore: 88, lastActive: '2 hours ago' },
  { id: '2', name: 'Bob Smith', className: 'Mathematics 10A', completionRate: 72, avgQuizScore: 75, lastActive: '1 day ago' },
  { id: '3', name: 'Carol Davis', className: 'Science 10B', completionRate: 93, avgQuizScore: 92, lastActive: '3 hours ago' },
  { id: '4', name: 'David Wilson', className: 'Mathematics 10A', completionRate: 45, avgQuizScore: 62, lastActive: '5 days ago' },
  { id: '5', name: 'Emma Brown', className: 'Science 10B', completionRate: 91, avgQuizScore: 89, lastActive: '1 hour ago' },
]

export default function ProgressPage() {
  const [filters, setFilters] = useState<ProgressFilters>({ dateRange: 'month' })
  const [selectedClass, setSelectedClass] = useState<string>('')

  const stats = {
    totalStudents: MOCK_STUDENTS.length,
    avgCompletion: Math.round(MOCK_STUDENTS.reduce((s, p) => s + p.completionRate, 0) / MOCK_STUDENTS.length),
    avgQuizScore: Math.round(MOCK_STUDENTS.reduce((s, p) => s + p.avgQuizScore, 0) / MOCK_STUDENTS.length),
    avgTimeMinutes: 45,
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Student Progress</h1>
        <p className="text-muted-foreground">Track student completion and quiz performance</p>
      </div>

      <div className="flex gap-4 mb-6">
        <select
          className="h-10 border rounded-lg px-3"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">All Classes</option>
          <option value="math">Mathematics 10A</option>
          <option value="science">Science 10B</option>
        </select>
        {['week', 'month', 'all'].map((range) => (
          <Button
            key={range}
            variant={filters.dateRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, dateRange: range as 'week' | 'month' | 'all' })}
          >
            {range === 'week' ? 'Week' : range === 'month' ? 'Month' : 'All Time'}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Students</p><p className="text-2xl font-bold">{stats.totalStudents}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Avg Completion</p><p className="text-2xl font-bold">{stats.avgCompletion}%</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Quiz Avg Score</p><p className="text-2xl font-bold">{stats.avgQuizScore}/100</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Time on Task</p><p className="text-2xl font-bold">{stats.avgTimeMinutes} min</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Individual Student Progress</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Student</th>
                <th className="text-left py-3">Class</th>
                <th className="text-left py-3">Completion</th>
                <th className="text-left py-3">Quiz Avg</th>
                <th className="text-left py-3">Last Active</th>
                <th className="text-left py-3"></th>
              </tr>
            </thead>
            <tbody>
              {MOCK_STUDENTS.map((student) => (
                <tr key={student.id} className="border-b">
                  <td className="py-3">{student.name}</td>
                  <td className="py-3">{student.className}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={student.completionRate} className="h-2 w-20" />
                      <span className="text-sm">{student.completionRate}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-sm ${student.avgQuizScore >= 80 ? 'bg-green-100 text-green-700' : student.avgQuizScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {student.avgQuizScore}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground text-sm">{student.lastActive}</td>
                  <td className="py-3"><Button variant="ghost" size="sm">View Details</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
