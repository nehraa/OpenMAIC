# OpenMAIC: Agent-Dispatched Implementation Plan

**Last Updated:** 2026-05-09
**Current Status:** MVP ~40% Complete (Teacher) / ~25% Complete (Student)
**Purpose:** Execute-ready with full agent prompts, skills, MCPs, and tools

---

## EXECUTIVE SUMMARY

**OpenMAIC** is an AI-powered EdTech platform with multi-agent classroom capabilities. This document contains **fully executable subagent prompts** for completing remaining phases.

### Available Resources (from Documents/Claude)
- **Agency Agents:** 222 available
- **Skills:** 136 available
- **MCP Servers:** 26 available
- **Tools:** 184 available

### Recommended Agent Types for This Project
| Task | Primary Agent | Secondary Agent |
|------|---------------|-----------------|
| Progress Tracking | `frontend-developer` | `analytics-reporter` |
| Live Sessions | `backend-developer` | `fullstack-developer` |
| Class Join Flow | `frontend-developer` | `backend-developer` |
| Quiz Taking | `frontend-developer` | `ui-designer` |
| Quota System | `backend-developer` | `security-engineer` |

### Recommended Skills
- `superpowers:tdd` — For test-first development
- `superpowers:writing-plans` — For task breakdown
- `frontend-design` — For UI implementation
- `testing:playwright` — For E2E tests

### Recommended MCP Servers
- `context7` — Library documentation
- `serena` — Code analysis
- `github` — GitHub Actions
- `playwright` — UI testing

---

## PHASE 2: Teacher Panel v1 (40% → 100%)

### TASK 2.1: Progress Tracking Dashboard

### Agent Dispatch
```
Agent: frontend-developer
Task Type: execute
MCP Servers: serena, context7
```

### Full Agent Prompt

```markdown
# TASK: Implement Progress Tracking Dashboard for OpenMAIC Teacher

## Project Path
/Users/abhinavnehra/git/tools/OpenMAIC/teacher/

## Primary Objective
Build the progress tracking dashboard showing per-student completion and quiz scores.

## Files to Create/Modify

### 1. Progress Page Component
**Path:** `teacher/app/(dashboard)/progress/page.tsx`

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { ProgressChart } from '@/components/charts/ProgressChart'
import { StudentProgressFilters } from './StudentProgressFilters'

interface ProgressFilters {
  classId?: string
  dateRange: 'week' | 'month' | 'all'
}

export default function ProgressPage() {
  const [filters, setFilters] = useState<ProgressFilters>({
    dateRange: 'month',
  })

  const { data: progressData, isLoading } = useQuery({
    queryKey: ['teacher-progress', filters],
    queryFn: () => fetchTeacherProgress(filters),
  })

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Student Progress</h1>
        <p className="text-muted-foreground">
          Track student completion and quiz performance
        </p>
      </div>

      <StudentProgressFilters
        filters={filters}
        onChange={setFilters}
        classes={progressData?.classes || []}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Students"
          value={progressData?.stats.totalStudents}
          trend={progressData?.stats.studentTrend}
        />
        <StatCard
          title="Avg Completion"
          value={`${progressData?.stats.avgCompletion}%`}
          trend={progressData?.stats.completionTrend}
        />
        <StatCard
          title="Quiz Avg Score"
          value={progressData?.stats.avgQuizScore}
          trend={progressData?.stats.scoreTrend}
          suffix="/ 100"
        />
        <StatCard
          title="Time on Task"
          value={progressData?.stats.avgTimeMinutes}
          suffix=" min"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Completion Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart
              data={progressData?.completionTimeline}
              type="line"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart
              data={progressData?.quizDistribution}
              type="bar"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Individual Student Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={progressData?.students || []}
            columns={[
              { accessor: 'name', header: 'Student' },
              { accessor: 'className', header: 'Class' },
              {
                accessor: 'completionRate',
                header: 'Completion',
                render: (val) => <ProgressBar value={val} />,
              },
              {
                accessor: 'avgQuizScore',
                header: 'Quiz Avg',
                render: (val) => <ScoreBadge score={val} />,
              },
              {
                accessor: 'lastActive',
                header: 'Last Active',
                render: (val) => formatRelativeTime(val),
              },
              {
                accessor: 'actions',
                header: '',
                render: () => (
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                ),
              },
            ]}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
```

### 2. API Endpoint
**Path:** `teacher/api/progress/teacher.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const teacher = await requireAuth()
  const { searchParams } = new URL(request.url)
  const classId = searchParams.get('classId')
  const dateRange = searchParams.get('dateRange') || 'month'

  // Build date filter
  const startDate = getStartDate(dateRange)

  // Get students with progress
  const students = await db.query.studentProgress.findMany({
    where: {
      teacherId: teacher.id,
      ...(classId && { classId }),
      lastActive: { gte: startDate },
    },
    with: {
      class: true,
      assignments: true,
      quizAttempts: true,
    },
  })

  // Calculate aggregated stats
  const stats = calculateProgressStats(students)

  return NextResponse.json({
    students,
    stats,
    classes: await getTeacherClasses(teacher.id),
  })
}

function calculateProgressStats(students: StudentWithRelations[]) {
  const totalStudents = students.length
  const avgCompletion =
    students.reduce((sum, s) => sum + s.completionRate, 0) / totalStudents
  const avgQuizScore =
    students.reduce((sum, s) => sum + s.avgQuizScore, 0) / totalStudents
  const avgTimeMinutes =
    students.reduce((sum, s) => sum + s.totalTimeMinutes, 0) / totalStudents

  return {
    totalStudents,
    avgCompletion: Math.round(avgCompletion),
    avgQuizScore: Math.round(avgQuizScore),
    avgTimeMinutes: Math.round(avgTimeMinutes),
    studentTrend: calculateTrend(students, 'totalStudents'),
    completionTrend: calculateTrend(students, 'completionRate'),
    scoreTrend: calculateTrend(students, 'avgQuizScore'),
  }
}
```

### 3. Database Schema Update
**Path:** `postgres/schema.sql`

```sql
-- Student progress tracking
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  class_id UUID REFERENCES classes(id),
  teacher_id UUID REFERENCES users(id),
  completion_rate DECIMAL(5,2) DEFAULT 0,
  assignments_completed INTEGER DEFAULT 0,
  total_assignments INTEGER DEFAULT 0,
  avg_quiz_score DECIMAL(5,2) DEFAULT 0,
  quiz_attempts INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  last_active_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_student_progress_teacher ON student_progress(teacher_id);
CREATE INDEX idx_student_progress_class ON student_progress(class_id);
CREATE INDEX idx_student_progress_last_active ON student_progress(last_active_at);
```

## Verification
```bash
# Run API test
curl "http://localhost:3001/api/progress/teacher?dateRange=month" \
  -H "Authorization: Bearer $TEACHER_TOKEN"

# Expected response structure:
{
  "students": [...],
  "stats": {
    "totalStudents": 45,
    "avgCompletion": 72,
    "avgQuizScore": 78,
    "avgTimeMinutes": 45
  },
  "classes": [...]
}
```

## Commit Message
```
feat(teacher): add progress tracking dashboard

- Per-student completion rates
- Quiz score aggregation
- Time-on-task metrics
- Progress charts and data table
```
```

---

### TASK 2.2: Live Session Launcher

### Agent Dispatch
```
Agent: fullstack-developer
Task Type: execute
MCP Servers: serena, context7
```

### Full Agent Prompt

```markdown
# TASK: Implement Live Session Launcher for OpenMAIC Teacher

## Project Path
/Users/abhinavnehra/git/tools/OpenMAIC/

## Primary Objective
Create the UI for launching live classroom sessions with AI personas.

## Files to Create/Modify

### 1. Session Configuration Component
**Path:** `teacher/app/(dashboard)/sessions/new/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface SessionConfig {
  classId: string
  title: string
  duration: number // minutes
  maxParticipants: number
  aiTeacherEnabled: boolean
  aiClassmatesCount: number
  enableWhiteboard: boolean
  enableChat: boolean
}

export default function NewSessionPage() {
  const router = useRouter()
  const [config, setConfig] = useState<SessionConfig>({
    classId: '',
    title: '',
    duration: 45,
    maxParticipants: 30,
    aiTeacherEnabled: true,
    aiClassmatesCount: 3,
    enableWhiteboard: true,
    enableChat: true,
  })
  const [isLaunching, setIsLaunching] = useState(false)

  const handleLaunch = async () => {
    setIsLaunching(true)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const { sessionId } = await response.json()
      router.push(`/sessions/${sessionId}`)
    } catch (error) {
      console.error('Failed to launch session:', error)
      setIsLaunching(false)
    }
  }

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Launch Live Session</h1>
        <p className="text-muted-foreground">
          Configure and start a real-time classroom
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="class">Class</Label>
            <Select
              value={config.classId}
              onValueChange={(classId) => setConfig({ ...config, classId })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="class-1">Class 10A - Mathematics</SelectItem>
                <SelectItem value="class-2">Class 10B - Science</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="e.g., Quadratic Equations - Live Practice"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select
                value={String(config.duration)}
                onValueChange={(v) => setConfig({ ...config, duration: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="90">90 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participants">Max Participants</Label>
              <Select
                value={String(config.maxParticipants)}
                onValueChange={(v) => setConfig({ ...config, maxParticipants: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 students</SelectItem>
                  <SelectItem value="20">20 students</SelectItem>
                  <SelectItem value="30">30 students</SelectItem>
                  <SelectItem value="50">50 students</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">AI Configuration</h3>

            <div className="flex items-center justify-between">
              <div>
                <Label>AI Teacher</Label>
                <p className="text-sm text-muted-foreground">
                  Enable AI-powered teaching assistant
                </p>
              </div>
              <Switch
                checked={config.aiTeacherEnabled}
                onCheckedChange={(aiTeacherEnabled) => setConfig({ ...config, aiTeacherEnabled })}
              />
            </div>

            <div className="mt-4">
              <Label>AI Classmates</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Number of AI students in the session
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 5].map((count) => (
                  <Button
                    key={count}
                    variant={config.aiClassmatesCount === count ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConfig({ ...config, aiClassmatesCount: count })}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Session Features</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Interactive Whiteboard</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable real-time collaborative drawing
                  </p>
                </div>
                <Switch
                  checked={config.enableWhiteboard}
                  onCheckedChange={(enableWhiteboard) => setConfig({ ...config, enableWhiteboard })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Chat</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable session chat
                  </p>
                </div>
                <Switch
                  checked={config.enableChat}
                  onCheckedChange={(enableChat) => setConfig({ ...config, enableChat })}
                />
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleLaunch}
            disabled={!config.classId || !config.title || isLaunching}
          >
            {isLaunching ? 'Launching...' : 'Launch Session'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 2. Session API
**Path:** `teacher/api/sessions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateSessionId } from '@/lib/session'

export async function POST(request: NextRequest) {
  const teacher = await requireAuth()
  const body = await request.json()

  // Create session record
  const sessionId = generateSessionId()
  const session = await db.insert(sessions).values({
    id: sessionId,
    teacherId: teacher.id,
    classId: body.classId,
    title: body.title,
    duration: body.duration,
    maxParticipants: body.maxParticipants,
    aiTeacherEnabled: body.aiTeacherEnabled,
    aiClassmatesCount: body.aiClassmatesCount,
    enableWhiteboard: body.enableWhiteboard,
    enableChat: body.enableChat,
    status: 'waiting', // waiting -> active -> ended
    scheduledAt: new Date(),
  })

  // Initialize core classroom for this session
  await initializeSessionRoom(sessionId, {
    corePath: '/core/app/classroom',
    config: body,
  })

  return NextResponse.json({ sessionId, session })
}

export async function GET(request: NextRequest) {
  const teacher = await requireAuth()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const sessions = await db.query.sessions.findMany({
    where: {
      teacherId: teacher.id,
      ...(status && { status }),
    },
    orderBy: desc(sessions.scheduledAt),
  })

  return NextResponse.json({ sessions })
}
```

### 3. Waiting Room Component
**Path:** `teacher/components/session/WaitingRoom.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface WaitingRoomProps {
  sessionId: string
  participants: Participant[]
  maxParticipants: number
  onStart: () => void
}

export function WaitingRoom({
  sessionId,
  participants,
  maxParticipants,
  onStart,
}: WaitingRoomProps) {
  const spotsRemaining = maxParticipants - participants.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waiting Room</CardTitle>
        <p className="text-sm text-muted-foreground">
          {spotsRemaining} spots remaining
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback>
                    {participant.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{participant.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {participant.type === 'ai' ? 'AI' : 'Student'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={onStart}
            disabled={participants.length === 0}
          >
            Start Session
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

## Verification
```bash
# Test session creation
curl -X POST http://localhost:3001/api/sessions \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "class-uuid",
    "title": "Math Live Session",
    "duration": 45,
    "maxParticipants": 30,
    "aiTeacherEnabled": true,
    "aiClassmatesCount": 3
  }'

# Expected response:
{ "sessionId": "sess_xxx", "session": {...} }
```

## Commit Message
```
feat(teacher): add live session launcher UI and API

- Session configuration form
- AI teacher and classmate settings
- Waiting room with participant list
- Core classroom integration
```
```

---

### TASK 2.3: Usage Analytics Panel

### Agent Dispatch
```
Agent: analytics-reporter
Task Type: execute
MCP Servers: serena, context7
```

### Full Agent Prompt

```markdown
# TASK: Implement Usage Analytics Panel for OpenMAIC Teacher

## Project Path
/Users/abhinavnehra/git/tools/OpenMAIC/teacher/

## Primary Objective
Build usage analytics showing token consumption and cost estimation.

## Files to Create/Modify

### 1. Usage Dashboard Page
**Path:** `teacher/app/(dashboard)/usage/page.tsx`

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

export default function UsagePage() {
  const { data: usageData } = useQuery({
    queryKey: ['teacher-usage'],
    queryFn: () => fetchTeacherUsage(),
  })

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Usage Analytics</h1>
        <p className="text-muted-foreground">
          Monitor AI usage and estimated costs
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <UsageCard
          title="Total Tokens"
          value={usageData?.summary.totalTokens}
          change={usageData?.summary.tokenChange}
          icon={<TokensIcon />}
        />
        <UsageCard
          title="API Costs"
          value={formatCurrency(usageData?.summary.totalCost)}
          change={usageData?.summary.costChange}
          icon={<DollarIcon />}
        />
        <UsageCard
          title="Sessions"
          value={usageData?.summary.totalSessions}
          change={usageData?.summary.sessionChange}
          icon={<SessionsIcon />}
        />
        <UsageCard
          title="Active Students"
          value={usageData?.summary.activeStudents}
          change={usageData?.summary.studentChange}
          icon={<StudentsIcon />}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="byClass">By Class</TabsTrigger>
          <TabsTrigger value="byFeature">By Feature</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Token Usage Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usageData?.tokenTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tokens" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage by Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <PieChart width={250} height={250}>
                    <Pie
                      data={usageData?.byProvider}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {usageData?.byProvider.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </div>
                <div className="mt-4 flex justify-center gap-4">
                  {usageData?.byProvider.map((provider, index) => (
                    <div key={provider.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{provider.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="byClass">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Class</CardTitle>
            </CardHeader>
            <CardContent>
              <UsageTable data={usageData?.byClass || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="byFeature">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Feature</CardTitle>
            </CardHeader>
            <CardContent>
              <UsageTable data={usageData?.byFeature || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function UsageCard({
  title,
  value,
  change,
  icon,
}: {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <p className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {change >= 0 ? '+' : ''}{change}% from last month
              </p>
            )}
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 2. Usage API Endpoint
**Path:** `teacher/api/analytics/usage/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const teacher = await requireAuth()
  const { searchParams } = new URL(request.url)
  const dateRange = searchParams.get('range') || 'month'

  const startDate = getStartDate(dateRange)

  // Get token usage records
  const usageRecords = await db.query.tokenUsage.findMany({
    where: {
      teacherId: teacher.id,
      createdAt: { gte: startDate },
    },
    with: {
      class: true,
      session: true,
    },
  })

  // Aggregate by provider
  const byProvider = aggregateByProvider(usageRecords)

  // Aggregate by class
  const byClass = aggregateByClass(usageRecords)

  // Aggregate by feature
  const byFeature = aggregateByFeature(usageRecords)

  // Calculate summary stats
  const summary = calculateSummaryStats(usageRecords)

  return NextResponse.json({
    summary,
    byProvider,
    byClass,
    byFeature,
    tokenTimeline: usageRecords,
  })
}

function aggregateByProvider(records: TokenUsage[]) {
  const providerMap = new Map<string, number>()
  
  for (const record of records) {
    const current = providerMap.get(record.provider) || 0
    providerMap.set(record.provider, current + record.tokens)
  }

  return Array.from(providerMap.entries()).map(([name, value]) => ({
    name,
    value,
  }))
}
```

## Verification
```bash
curl "http://localhost:3001/api/analytics/usage?range=month" \
  -H "Authorization: Bearer $TEACHER_TOKEN"
```

## Commit Message
```
feat(teacher): add usage analytics dashboard

- Token usage tracking
- Cost estimation by provider
- Usage by class and feature
- Charts and data tables
```
```

---

## PHASE 3: Student Panel MVP (0% → 100%)

### TASK 3.1: Class Join Flow

### Agent Dispatch
```
Agent: fullstack-developer
Task Type: execute
MCP Servers: serena, context7
```

### Full Agent Prompt

```markdown
# TASK: Implement Class Join Flow for OpenMAIC Student

## Project Path
/Users/abhinavnehra/git/tools/OpenMAIC/student/

## Primary Objective
Build the invite code input and class assignment flow.

## Files to Create/Modify

### 1. Join Page
**Path:** `student/app/(auth)/join/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function JoinClassPage() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsJoining(true)

    try {
      const response = await fetch('/api/student/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to join class')
      }

      const { classId } = await response.json()
      router.push(`/dashboard?joined=${classId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid invite code')
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join a Class</CardTitle>
          <CardDescription>
            Enter the invite code from your teacher to join a class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={14}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={inviteCode.length < 6 || isJoining}
            >
              {isJoining ? 'Joining...' : 'Join Class'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Don't have an invite code?</p>
            <p>Ask your teacher for one.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 2. Join API Endpoint
**Path:** `student/api/classes/join/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { validateInviteCode } from '@/lib/invite-codes'

export async function POST(request: NextRequest) {
  const student = await requireAuth()
  const { inviteCode } = await request.json()

  if (!inviteCode) {
    return NextResponse.json(
      { error: 'Invite code is required' },
      { status: 400 }
    )
  }

  // Validate invite code format and lookup
  const codeData = await validateInviteCode(inviteCode)
  if (!codeData) {
    return NextResponse.json(
      { error: 'Invalid invite code' },
      { status: 400 }
    )
  }

  // Check if class exists and is active
  const classData = await db.query.classes.findFirst({
    where: eq(classes.id, codeData.classId),
  })

  if (!classData || classData.status !== 'active') {
    return NextResponse.json(
      { error: 'Class is no longer accepting students' },
      { status: 400 }
    )
  }

  // Check if already enrolled
  const existingEnrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.studentId, student.id),
      eq(enrollments.classId, classData.id)
    ),
  })

  if (existingEnrollment) {
    return NextResponse.json(
      { error: 'You are already enrolled in this class' },
      { status: 400 }
    )
  }

  // Create enrollment
  await db.insert(enrollments).values({
    studentId: student.id,
    classId: classData.id,
    invitedBy: codeData.createdBy,
    enrolledAt: new Date(),
  })

  // Mark invite code as used
  await db.update(inviteCodes)
    .set({ usedCount: codeData.usedCount + 1 })
    .where(eq(inviteCodes.code, inviteCode))

  return NextResponse.json({
    classId: classData.id,
    className: classData.name,
    teacherName: classData.teacherName,
  })
}
```

### 3. Database Schema
**Path:** `postgres/schema.sql`

```sql
-- Invite codes for class enrollment
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id),
  code VARCHAR(20) UNIQUE NOT NULL,
  max_uses INTEGER DEFAULT 50,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Student enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id),
  class_id UUID REFERENCES classes(id),
  invited_by UUID REFERENCES users(id),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active', -- active, dropped, completed
  UNIQUE(student_id, class_id)
);

-- Indexes
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
```

## Verification
```bash
# Test join flow
curl -X POST http://localhost:3002/api/student/classes/join \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inviteCode": "ABCD-EFGH-IJKL"}'

# Expected response:
{
  "classId": "uuid",
  "className": "Mathematics 10A",
  "teacherName": "Mr. Smith"
}
```

## Commit Message
```
feat(student): add class join flow with invite codes

- Invite code input UI
- Code validation and lookup
- Enrollment creation
- Welcome/onboarding state
```
```

---

### TASK 3.2: Quiz Taking Interface

### Agent Dispatch
```
Agent: frontend-developer
Task Type: execute
MCP Servers: serena, context7, playwright
```

### Full Agent Prompt

```markdown
# TASK: Implement Quiz Taking Interface for OpenMAIC Student

## Project Path
/Users/abhinavnehra/git/tools/OpenMAIC/student/

## Primary Objective
Build the complete quiz-taking experience with timer and scoring.

## Files to Create/Modify

### 1. Quiz Taking Page
**Path:** `student/app/(classroom)/quiz/[quizId]/page.tsx`

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react'

interface QuizState {
  currentQuestion: number
  answers: Record<string, string>
  timeRemaining: number // seconds
  submitted: boolean
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.quizId as string

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => fetchQuiz(quizId),
  })

  const [state, setState] = useState<QuizState>({
    currentQuestion: 0,
    answers: {},
    timeRemaining: quiz?.timeLimit * 60 || 0,
    submitted: false,
  })

  // Timer
  useEffect(() => {
    if (state.submitted || !state.timeRemaining) return

    const timer = setInterval(() => {
      setState((prev) => ({
        ...prev,
        timeRemaining: prev.timeRemaining - 1,
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [state.submitted, state.timeRemaining])

  const submitMutation = useMutation({
    mutationFn: (answers: Record<string, string>) =>
      submitQuiz(quizId, answers),
    onSuccess: (results) => {
      setState((prev) => ({ ...prev, submitted: true }))
    },
  })

  const handleAnswer = (questionId: string, answer: string) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer },
    }))
  }

  const handleNext = () => {
    setState((prev) => ({
      ...prev,
      currentQuestion: Math.min(
        prev.currentQuestion + 1,
        (quiz?.questions.length || 1) - 1
      ),
    }))
  }

  const handlePrev = () => {
    setState((prev) => ({
      ...prev,
      currentQuestion: Math.max(prev.currentQuestion - 1, 0),
    }))
  }

  const handleSubmit = () => {
    if (confirm('Are you sure you want to submit? You cannot change your answers.')) {
      submitMutation.mutate(state.answers)
    }
  }

  if (isLoading) return <QuizSkeleton />
  if (!quiz) return <QuizNotFound />

  const currentQ = quiz.questions[state.currentQuestion]
  const progress = ((state.currentQuestion + 1) / quiz.questions.length) * 100
  const answeredCount = Object.keys(state.answers).length
  const allAnswered = answeredCount === quiz.questions.length

  // Results view
  if (state.submitted) {
    return (
      <div className="container py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-4xl font-bold">
                {submitMutation.data?.score}/{quiz.questions.length}
              </p>
              <p className="text-muted-foreground">
                {Math.round((submitMutation.data!.correctCount / quiz.questions.length) * 100)}%
              </p>
            </div>

            <div className="space-y-2">
              {quiz.questions.map((q, i) => (
                <div
                  key={q.id}
                  className={`p-3 rounded-lg border ${
                    state.answers[q.id] === q.correctAnswer
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                  }`}
                >
                  <p className="text-sm font-medium">Question {i + 1}</p>
                  <p className="text-xs text-muted-foreground">
                    {state.answers[q.id] === q.correctAnswer ? 'Correct' : 'Incorrect'}
                  </p>
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={() => router.back()}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Quiz taking view
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
            <div>
              <h1 className="font-semibold">{quiz.title}</h1>
              <p className="text-sm text-muted-foreground">
                Question {state.currentQuestion + 1} of {quiz.questions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${state.timeRemaining < 60 ? 'text-red-500' : ''}`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono">
                {Math.floor(state.timeRemaining / 60)}:
                {String(state.timeRemaining % 60).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </header>

      {/* Question */}
      <div className="container py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentQ.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={state.answers[currentQ.id] || ''}
              onValueChange={(value) => handleAnswer(currentQ.id, value)}
            >
              <div className="space-y-3">
                {currentQ.options.map((option, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  >
                    <RadioGroupItem value={option} id={`option-${i}`} />
                    <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={state.currentQuestion === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {state.currentQuestion < quiz.questions.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || submitMutation.isPending}
            >
              Submit Quiz
            </Button>
          )}
        </div>

        {/* Low time warning */}
        {state.timeRemaining < 60 && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Less than a minute remaining!</AlertTitle>
            <AlertDescription>
              Submit your answers soon to avoid running out of time.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
```

### 2. Quiz Submission API
**Path:** `student/api/quiz/[quizId]/submit/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const student = await requireAuth()
  const { quizId } = params
  const { answers } = await request.json()

  // Get quiz with correct answers
  const quiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, quizId),
    with: { questions: true },
  })

  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  // Calculate score
  let correctCount = 0
  const results = quiz.questions.map((question) => {
    const userAnswer = answers[question.id]
    const isCorrect = userAnswer === question.correctAnswer
    if (isCorrect) correctCount++

    return {
      questionId: question.id,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
    }
  })

  // Save attempt
  const attempt = await db.insert(quizAttempts).values({
    studentId: student.id,
    quizId,
    answers,
    score: correctCount,
    totalQuestions: quiz.questions.length,
    completedAt: new Date(),
  })

  return NextResponse.json({
    attemptId: attempt.id,
    score: correctCount,
    totalQuestions: quiz.questions.length,
    results,
  })
}
```

## Verification
```bash
# Test quiz loading
curl "http://localhost:3002/api/quiz/quiz-uuid" \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Test quiz submission
curl -X POST "http://localhost:3002/api/quiz/quiz-uuid/submit" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "q1": "A",
      "q2": "B"
    }
  }'
```

## Commit Message
```
feat(student): add quiz taking interface with timer

- Question navigation and progress
- Timer with warning
- Answer selection and submission
- Results display with scoring
```
```

---

### TASK 3.3: Quota System Backend

### Agent Dispatch
```
Agent: backend-developer
Task Type: execute
MCP Servers: serena, context7
```

### Full Agent Prompt

```markdown
# TASK: Implement Quota System for OpenMAIC

## Project Path
/Users/abhinavnehra/git/tools/OpenMAIC/

## Primary Objective
Build the quota tracking and enforcement system for student plans.

## Files to Create/Modify

### 1. Database Schema
**Path:** `postgres/schema.sql`

```sql
-- User plans
CREATE TYPE plan_tier AS ENUM ('basic', 'image', 'video');

CREATE TABLE user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  plan_tier plan_tier DEFAULT 'basic',
  
  -- Question quotas (monthly)
  questions_used INTEGER DEFAULT 0,
  questions_limit INTEGER DEFAULT 50,
  
  -- Image generation quotas
  images_used INTEGER DEFAULT 0,
  images_limit INTEGER DEFAULT 10,
  
  -- Video generation quotas
  videos_used INTEGER DEFAULT 0,
  videos_limit INTEGER DEFAULT 2,
  
  -- Subscription
  subscription_status VARCHAR(20) DEFAULT 'trial', -- trial, active, expired
  subscription_started_at TIMESTAMP,
  subscription_ends_at TIMESTAMP,
  
  -- Reset tracking
  questions_reset_at TIMESTAMP DEFAULT DATE_TRUNC('month', NOW()),
  images_reset_at TIMESTAMP DEFAULT DATE_TRUNC('month', NOW()),
  videos_reset_at TIMESTAMP DEFAULT DATE_TRUNC('month', NOW()),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Quota tracking logs
CREATE TABLE quota_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  quota_type VARCHAR(20) NOT NULL, -- questions, images, videos
  amount INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_quotas_user ON user_quotas(user_id);
CREATE INDEX idx_quota_logs_user ON quota_usage_logs(user_id);
CREATE INDEX idx_quota_logs_created ON quota_usage_logs(created_at);
```

### 2. Quota Service
**Path:** `core/lib/services/quota.ts`

```typescript
import { db } from '@/lib/db'
import { and, eq, gte, sql } from 'drizzle-orm'

export type QuotaType = 'questions' | 'images' | 'videos'

interface QuotaCheck {
  allowed: boolean
  used: number
  limit: number
  remaining: number
}

export async function checkQuota(
  userId: string,
  quotaType: QuotaType
): Promise<QuotaCheck> {
  const quota = await db.query.userQuotas.findFirst({
    where: eq(userQuotas.userId, userId),
  })

  if (!quota) {
    // Create default quota for new users
    return createDefaultQuota(userId, quotaType)
  }

  // Check if reset is needed (monthly)
  const shouldReset = checkResetNeeded(quota, quotaType)
  if (shouldReset) {
    await resetQuota(userId, quotaType)
    return getQuotaStatus(userId, quotaType)
  }

  // Get current usage
  const used = getUsedCount(quota, quotaType)
  const limit = getLimit(quota, quotaType)

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  }
}

export async function consumeQuota(
  userId: string,
  quotaType: QuotaType,
  amount: number = 1
): Promise<{ success: boolean; remaining: number }> {
  const check = await checkQuota(userId, quotaType)
  
  if (!check.allowed) {
    throw new QuotaExceededError(quotaType, check.remaining)
  }

  // Update usage
  const field = `${quotaType}s_used` as any
  await db.update(userQuotas)
    .set({
      [field]: sql`${field} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(userQuotas.userId, userId))

  // Log the usage
  await db.insert(quotaUsageLogs).values({
    userId,
    quotaType,
    amount,
  })

  const remaining = check.remaining - amount
  return { success: true, remaining }
}

export async function getQuotaStatus(
  userId: string,
  quotaType: QuotaType
): Promise<QuotaCheck> {
  const quota = await db.query.userQuotas.findFirst({
    where: eq(userQuotas.userId, userId),
  })

  if (!quota) {
    return createDefaultQuota(userId, quotaType)
  }

  const used = getUsedCount(quota, quotaType)
  const limit = getLimit(quota, quotaType)

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  }
}

export async function resetQuota(userId: string, quotaType: QuotaType) {
  const field = `${quotaType}s_reset_at` as any
  const usedField = `${quotaType}s_used` as any

  await db.update(userQuotas)
    .set({
      [usedField]: 0,
      [field]: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userQuotas.userId, userId))
}

function checkResetNeeded(quota: UserQuota, quotaType: QuotaType): boolean {
  const resetDate = getResetDate(quota, quotaType)
  return new Date() > resetDate
}

function getLimit(quota: UserQuota, quotaType: QuotaType): number {
  const limits: Record<QuotaType, number> = {
    questions: quota.questionsLimit,
    images: quota.imagesLimit,
    videos: quota.videosLimit,
  }
  return limits[quotaType]
}

function getUsedCount(quota: UserQuota, quotaType: QuotaType): number {
  const used: Record<QuotaType, number> = {
    questions: quota.questionsUsed,
    images: quota.imagesUsed,
    videos: quota.videosUsed,
  }
  return used[quotaType]
}

function getResetDate(quota: UserQuota, quotaType: QuotaType): Date {
  const dates: Record<QuotaType, Date> = {
    questions: quota.questionsResetAt,
    images: quota.imagesResetAt,
    videos: quota.videosResetAt,
  }
  return dates[quotaType]
}

export class QuotaExceededError extends Error {
  constructor(
    public quotaType: QuotaType,
    public remaining: number
  ) {
    super(`Quota exceeded for ${quotaType}. ${remaining} remaining.`)
    this.name = 'QuotaExceededError'
  }
}
```

### 3. Quota Middleware
**Path:** `core/middleware/quota.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { checkQuota, consumeQuota, QuotaExceededError } from '@/lib/services/quota'

export async function quotaMiddleware(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Only apply to quota-protected endpoints
  if (!isQuotaProtectedRoute(request.url)) {
    return handler(request)
  }

  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const quotaType = getQuotaType(request.url)

  try {
    // Check and consume quota atomically
    const check = await checkQuota(userId, quotaType)
    if (!check.allowed) {
      return NextResponse.json(
        {
          error: 'Quota exceeded',
          type: quotaType,
          remaining: check.remaining,
          upgradeUrl: '/pricing',
        },
        { status: 429 }
      )
    }

    // Proceed with request
    const response = await handler(request)

    // Consume quota on success
    if (response.ok) {
      await consumeQuota(userId, quotaType)
    }

    return response
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        {
          error: 'Quota exceeded',
          type: error.quotaType,
          remaining: error.remaining,
          upgradeUrl: '/pricing',
        },
        { status: 429 }
      )
    }
    throw error
  }
}
```

## Verification
```bash
# Check quota status
curl "http://localhost:3001/api/quotas/status" \
  -H "Authorization: Bearer $USER_TOKEN"

# Test quota consumption
curl -X POST "http://localhost:3001/api/quiz/generate" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"topic": "Algebra"}'

# Expected: 200 if quota available, 429 if exceeded
```

## Commit Message
```
feat(core): add quota system with tracking and enforcement

- Plan tiers (basic, image, video)
- Monthly quota tracking
- Quota middleware for API protection
- Reset logic for monthly renewal
```
```

---

## VERIFICATION & VALIDATION

### Pre-Release Checklist
- [ ] All Phase 2 E2E tests passing
- [ ] All Phase 3 E2E tests passing
- [ ] Quota enforcement working
- [ ] Load tested for 100 concurrent students
- [ ] Performance metrics within SLA

### Test Commands
```bash
# Run all E2E tests
cd ~/git/tools/OpenMAIC && pnpm test:e2e

# Run Phase 2 specific tests
cd ~/git/tools/OpenMAIC && pnpm test:e2e --grep "Teacher"

# Run Phase 3 specific tests
cd ~/git/tools/OpenMAIC && pnpm test:e2e --grep "Student"

# Test quota system
cd ~/git/tools/OpenMAIC/core && pnpm test --grep "quota"
```

---

## AGENT EXECUTION ORDER

### Wave 1: Phase 2 Completion (Parallel)
| Task | Agent | Files |
|------|-------|-------|
| Progress Tracking | `frontend-developer` | `teacher/app/(dashboard)/progress/**` |
| Live Session Launcher | `fullstack-developer` | `teacher/app/(dashboard)/sessions/**` |
| Usage Analytics | `analytics-reporter` | `teacher/app/(dashboard)/usage/**` |

### Wave 2: Phase 3 Core (Sequential)
| Task | Agent | Files |
|------|-------|-------|
| Class Join Flow | `fullstack-developer` | `student/app/(auth)/join/**` |
| Quiz Taking Interface | `frontend-developer` | `student/app/(classroom)/quiz/**` |
| Quota System Backend | `backend-developer` | `core/lib/services/quota.ts` |

### Wave 3: Integration & Polish
| Task | Agent | Files |
|------|-------|-------|
| Student Dashboard | `frontend-developer` | `student/app/(dashboard)/**` |
| Plan Tier UI | `frontend-developer` | `student/app/**/billing/**` |
| Load Testing | `performance-engineer` | `e2e/**/load.spec.ts` |

---

## DEPENDENCY GRAPH

```
        ┌─────────────────────────────────────┐
        │         Phase 2 Tasks              │
        ├─────────────────────────────────────┤
        │ Progress │ Live Sessions │ Analytics │
        └─────────┴───────┬────────┴─────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │         Phase 3 Tasks             │
        ├───────────────────────────────────┤
        │ Class Join │ Quiz Taking │ Quota    │
        └───────────┴──────┬──────┴──────────┘
                           │
        ┌─────────────────┴─────────────────┐
        │      Integration Tasks            │
        ├───────────────────────────────────┤
        │ Dashboard │ Plan UI │ Load Test   │
        └───────────────────────────────────┘
```

---

*End of OpenMAIC Agent Dispatch Plan*
