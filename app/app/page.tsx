'use client';

import { useRouter } from 'next/navigation';
import { GraduationCap, Users, User } from 'lucide-react';

type Role = 'teacher' | 'student' | 'individual';

interface RoleCardProps {
  role: Role;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function RoleCard({ title, description, icon, onClick }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
        {icon}
      </div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="max-w-[240px] text-center text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  );
}

export default function LandingPage() {
  const router = useRouter();

  const handleRoleSelect = (role: Role) => {
    router.push(`/login/${role}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-8">
      <div className="mb-12 flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Welcome to Aidutech
        </h1>
        <p className="text-lg text-muted-foreground">
          Select your role to get started
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
        <RoleCard
          role="teacher"
          title="Teacher"
          description="Create lessons, assign homework, monitor student progress, and run live classroom sessions"
          icon={<GraduationCap size={32} />}
          onClick={() => handleRoleSelect('teacher')}
        />
        <RoleCard
          role="student"
          title="Student"
          description="Join your class, view assigned lessons, take quizzes, and ask questions during live sessions"
          icon={<Users size={32} />}
          onClick={() => handleRoleSelect('student')}
        />
        <RoleCard
          role="individual"
          title="Individual"
          description="Self-serve learning with full AI-powered content generation and personal study tools"
          icon={<User size={32} />}
          onClick={() => handleRoleSelect('individual')}
        />
      </div>

      <p className="mt-12 text-xs text-muted-foreground">
        By continuing, you agree to Aidutech Terms of Service and Privacy Policy
      </p>
    </main>
  );
}
