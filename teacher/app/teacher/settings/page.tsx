'use client';

import Link from 'next/link';
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';

export default function TeacherSettingsPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/teacher/classes" className="text-primary hover:underline flex items-center gap-1 text-sm mb-6">
        <ArrowLeft size={14} /> Back to Classes
      </Link>

      <header className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <SettingsIcon size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Account, profile, and workspace preferences</p>
        </div>
      </header>

      <div className="bg-white border rounded-xl p-6 text-center">
        <h2 className="font-semibold mb-2">Coming soon</h2>
        <p className="text-sm text-muted-foreground">
          We are still wiring up the teacher account settings. Profile, notifications,
          and integrations will land here shortly.
        </p>
      </div>
    </div>
  );
}
