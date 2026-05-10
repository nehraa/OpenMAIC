'use client'

import { cn } from '@/lib/utils'

interface ClassOption {
  id: string
  name: string
  subject: string
  batch: string
  student_count: number
}

interface ProgressFilters {
  classId?: string
  dateRange: 'week' | 'month' | 'all'
}

interface StudentProgressFiltersProps {
  filters: ProgressFilters
  onChange: (filters: ProgressFilters) => void
  classes: ClassOption[]
}

export function StudentProgressFilters({
  filters,
  onChange,
  classes,
}: StudentProgressFiltersProps) {
  const handleClassChange = (classId: string) => {
    onChange({
      ...filters,
      classId: classId || undefined,
    })
  }

  const handleDateRangeChange = (dateRange: 'week' | 'month' | 'all') => {
    onChange({
      ...filters,
      dateRange,
    })
  }

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Class</label>
        <select
          value={filters.classId || ''}
          onChange={(e) => handleClassChange(e.target.value)}
          className="h-10 border rounded-lg px-3 py-1.5 text-sm min-w-[200px]"
        >
          <option value="">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Date Range</label>
        <div className="flex gap-1">
          {(['week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => handleDateRangeChange(range)}
              className={cn(
                'h-10 px-4 py-1.5 text-sm rounded-lg border transition-colors',
                filters.dateRange === range
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
            >
              {range === 'week' ? 'Week' : range === 'month' ? 'Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
