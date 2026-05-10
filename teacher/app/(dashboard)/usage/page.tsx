'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

interface UsageSummary {
  totalTokens: number;
  totalCost: number;
  totalSessions: number;
  activeStudents: number;
  tokenChange: number;
  costChange: number;
  sessionChange: number;
  studentChange: number;
}

interface ProviderData {
  name: string;
  value: number;
}

interface ClassData {
  classId: string;
  name: string;
  tokens: number;
  cost: number;
}

interface FeatureData {
  feature: string;
  tokens: number;
  cost: number;
}

interface TimelineData {
  date: string;
  tokens: number;
}

interface UsageData {
  summary: UsageSummary;
  byProvider: ProviderData[];
  byClass: ClassData[];
  byFeature: FeatureData[];
  tokenTimeline: TimelineData[];
}

async function fetchTeacherUsage(): Promise<UsageData> {
  const response = await fetch('/api/analytics/usage?range=month');
  if (!response.ok) {
    throw new Error('Failed to fetch usage data');
  }
  return response.json();
}

function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return '$0.00';
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null) return '0';
  return value.toLocaleString();
}

function TokensIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

function SessionsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function StudentsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

export default function UsagePage() {
  const { data: usageData, isLoading } = useQuery({
    queryKey: ['teacher-usage'],
    queryFn: fetchTeacherUsage,
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading usage analytics...</p>
        </div>
      </div>
    );
  }

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
          value={formatNumber(usageData?.summary.totalTokens)}
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
          value={formatNumber(usageData?.summary.totalSessions)}
          change={usageData?.summary.sessionChange}
          icon={<SessionsIcon />}
        />
        <UsageCard
          title="Active Students"
          value={formatNumber(usageData?.summary.activeStudents)}
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
                  <BarChart data={usageData?.tokenTimeline || []}>
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
                      data={usageData?.byProvider || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(usageData?.byProvider || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </div>
                <div className="mt-4 flex justify-center gap-4">
                  {(usageData?.byProvider || []).map((provider, index) => (
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
  );
}

function UsageCard({
  title,
  value,
  change,
  icon,
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && change !== 0 && (
              <p className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {change >= 0 ? '+' : ''}{change}% from last month
              </p>
            )}
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function UsageTable({ data }: { data: Array<{ name?: string; classId?: string; feature?: string; tokens: number; cost: number }> }) {
  if (data.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No usage data available</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Tokens</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Cost</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const name = row.name || row.classId || row.feature || `Item ${index + 1}`;
            return (
              <tr key={index} className="border-b">
                <td className="py-3 px-4">{name}</td>
                <td className="py-3 px-4 text-right font-mono">{row.tokens.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono">${row.cost.toFixed(4)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}