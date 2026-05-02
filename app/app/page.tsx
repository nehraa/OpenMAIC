'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Users, User, Sparkles } from 'lucide-react';

type Role = 'teacher' | 'student' | 'individual';

interface RoleCardProps {
  role: Role;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  delay: number;
}

function RoleCard({ title, description, icon, onClick, delay }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="group relative glass-surface glass-surface-hover rounded-3xl p-8 text-center transition-all duration-300 animate-fade-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Icon container */}
      <div className="relative mb-6 mx-auto">
        <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl glass-surface border-primary/20 group-hover:border-primary/40 group-hover:scale-105 transition-all duration-300">
          <div className="text-primary/80 group-hover:text-primary transition-colors duration-300">
            {icon}
          </div>
        </div>
      </div>

      {/* Text content */}
      <div className="relative space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground/90 group-hover:text-foreground transition-colors duration-300">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-[260px] mx-auto">
          {description}
        </p>
      </div>

      {/* Bottom indicator */}
      <div className="relative mt-6 flex items-center justify-center gap-2">
        <span className="text-xs font-medium text-primary/60 group-hover:text-primary transition-colors duration-300">
          Get started
        </span>
        <svg
          className="w-4 h-4 text-primary/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRoleSelect = (role: Role) => {
    router.push(`/login/${role}`);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden gradient-mesh p-8">
      {/* Ambient floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-72 h-72 rounded-full bg-primary/4 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/3 blur-3xl" />
      </div>

      {/* Content */}
      <div className={`relative z-10 w-full max-w-4xl ${mounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
        {/* Header */}
        <div className="text-center mb-16 space-y-4 animate-fade-up">
          {/* Logo mark */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl animate-pulse-glow" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl glass-surface mx-auto">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            Choose Your Path
          </h1>
          <p className="text-lg text-muted-foreground/80 max-w-md mx-auto">
            Your AI-powered learning journey awaits. Select your role to begin.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid gap-8 md:grid-cols-3 stagger-children">
          <RoleCard
            role="teacher"
            title="Teacher"
            description="Create lessons, assign homework, and run live classroom sessions with AI assistance"
            icon={<GraduationCap size={36} />}
            onClick={() => handleRoleSelect('teacher')}
            delay={0}
          />
          <RoleCard
            role="student"
            title="Student"
            description="Join your class, view lessons, take quizzes, and learn with AI-powered tools"
            icon={<Users size={36} />}
            onClick={() => handleRoleSelect('student')}
            delay={100}
          />
          <RoleCard
            role="individual"
            title="Individual"
            description="Self-serve learning with full AI content generation and personal study tools"
            icon={<User size={36} />}
            onClick={() => handleRoleSelect('individual')}
            delay={200}
          />
        </div>

        {/* Footer */}
        <p className="mt-16 text-center text-sm text-muted-foreground/50 animate-fade-up" style={{ animationDelay: '400ms' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </main>
  );
}
