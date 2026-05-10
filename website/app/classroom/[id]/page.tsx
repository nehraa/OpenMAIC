'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Avatar } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { classroomData, type ClassroomChatMessage } from '@/app/lib/mock-data';
import {
  Mic,
  MicOff,
  Hand,
  Send,
  PenTool,
  Users,
  MessageSquare,
  Sparkles,
  BookOpen,
  GraduationCap,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

function WhiteboardPanel() {
  const whiteboard = classroomData.whiteboardContent;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-dark-line">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-coral" />
          <span className="text-sm font-medium text-white">Whiteboard</span>
        </div>
        <Badge variant="teal">Live</Badge>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center justify-center bg-dark-surface/50">
        <div className="text-center mb-8">
          <h3 className="text-lg font-display font-semibold text-white mb-2">
            {whiteboard.title}
          </h3>
          <p className="text-sm text-slate-400">Tap to expand</p>
        </div>
        <div className="p-6 rounded-2xl bg-dark-card border-2 border-coral/30 shadow-glow-coral">
          <p className="text-2xl font-mono text-white text-center leading-relaxed">
            {whiteboard.equation}
          </p>
        </div>
        <div className="flex items-center gap-4 mt-8">
          <button className="p-3 rounded-xl bg-dark-card border border-dark-line text-slate-400 hover:text-white hover:border-white/30 transition-colors">
            <PenTool className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-xl bg-dark-card border border-dark-line text-slate-400 hover:text-white hover:border-white/30 transition-colors">
            <span className="text-lg">T</span>
          </button>
          <button className="p-3 rounded-xl bg-dark-card border border-dark-line text-slate-400 hover:text-white hover:border-white/30 transition-colors">
            <span className="text-lg">+</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ParticipantAvatar({
  name,
  avatar,
  color,
  role,
  isAI,
}: {
  name: string;
  avatar: string;
  color: 'teal' | 'violet' | 'coral' | 'info';
  role: string;
  isAI: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar initials={avatar} color={color} size="lg" showRing={isAI} />
        {isAI && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-teal flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-white">{name}</p>
        <p className="text-xs text-slate-400 capitalize">{role}</p>
      </div>
    </div>
  );
}

function ParticipantsPanel() {
  const participants = classroomData.participants;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-dark-line">
        <Users className="w-4 h-4 text-violet" />
        <span className="text-sm font-medium text-white">Classroom</span>
      </div>
      <div className="flex-1 p-4 flex flex-col">
        <div className="grid grid-cols-2 gap-6 mb-6">
          {participants.slice(0, 2).map((p) => (
            <ParticipantAvatar
              key={p.id}
              name={p.name}
              avatar={p.avatar}
              color={p.color}
              role={p.role}
              isAI={p.isAI}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          {participants.slice(2).map((p) => (
            <ParticipantAvatar
              key={p.id}
              name={p.name}
              avatar={p.avatar}
              color={p.color}
              role={p.role}
              isAI={p.isAI}
            />
          ))}
        </div>
        <div className="mt-auto pt-4 border-t border-dark-line">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Participants</span>
            <span className="text-white font-medium">4 AI + 1 Student</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({
  message,
}: {
  message: ClassroomChatMessage;
}) {
  const roleColors: Record<string, string> = {
    professor: 'text-teal',
    skeptic: 'text-violet',
    builder: 'text-coral',
    examiner: 'text-info',
    student: 'text-white',
  };

  return (
    <div className={`flex gap-3 ${message.isAI ? '' : 'bg-dark-surface/50 p-3 rounded-xl'}`}>
      <Avatar
        initials={message.speaker.substring(0, 2)}
        color={
          message.speakerRole === 'professor'
            ? 'teal'
            : message.speakerRole === 'skeptic'
            ? 'violet'
            : message.speakerRole === 'builder'
            ? 'coral'
            : message.speakerRole === 'examiner'
            ? 'info'
            : 'slate'
        }
        size="sm"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm font-semibold ${roleColors[message.speakerRole]}`}>
            {message.speaker}
          </span>
          {message.isAI && (
            <Badge variant="teal" className="text-xs">
              AI
            </Badge>
          )}
          <span className="text-xs text-slate-500">{message.timestamp}</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{message.message}</p>
      </div>
    </div>
  );
}

function ChatPanel() {
  const [message, setMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-dark-line">
        <MessageSquare className="w-4 h-4 text-info" />
        <span className="text-sm font-medium text-white">Discussion</span>
        <span className="ml-auto text-xs text-slate-400">{classroomData.chat.length} messages</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {classroomData.chat.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>
      <div className="p-4 border-t border-dark-line space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-lg transition-colors ${
              isMuted
                ? 'bg-warning/20 text-warning'
                : 'bg-dark-surface text-slate-400 hover:text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setHandRaised(!handRaised)}
            className={`p-2 rounded-lg transition-colors ${
              handRaised
                ? 'bg-coral/20 text-coral'
                : 'bg-dark-surface text-slate-400 hover:text-white'
            }`}
          >
            <Hand className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question..."
              className="w-full px-4 py-2 rounded-xl bg-dark-surface border border-dark-line text-white placeholder:text-slate-500 focus:outline-none focus:border-coral/50 transition-colors"
            />
          </div>
          <Button size="icon" disabled={!message.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function LessonProgressBar() {
  const progress = classroomData.lessonProgress;
  return (
    <div className="px-4 py-3 bg-dark-surface border-b border-dark-line">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">Lesson Progress</span>
        <span className="text-sm text-white font-medium">
          {progress.completedSections}/{progress.totalSections} sections
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal to-teal-soft rounded-full transition-all"
            style={{ width: `${(progress.completedSections / progress.totalSections) * 100}%` }}
          />
        </div>
        <span className="text-sm text-white font-medium">
          {Math.round((progress.completedSections / progress.totalSections) * 100)}%
        </span>
      </div>
    </div>
  );
}

export default function ClassroomPage() {
  return (
    <div className="min-h-screen bg-dark-base flex flex-col">
      {/* Top Header */}
      <header className="border-b border-dark-line bg-dark-surface px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/student"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </Link>
            <div className="h-6 w-px bg-dark-line" />
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-coral" />
              <span className="text-lg font-display font-bold text-white">AIDU Classroom</span>
            </div>
            <div className="h-6 w-px bg-dark-line" />
            <div>
              <h1 className="text-sm font-semibold text-white">{classroomData.topic}</h1>
              <p className="text-xs text-slate-400">
                {classroomData.subject} | {classroomData.grade} | {classroomData.duration}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>32:45</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-coral animate-pulse" />
              <span className="text-xs text-coral">Recording</span>
            </div>
            <Badge variant="coral">
              <BookOpen className="w-3 h-3 mr-1" />
              {classroomData.lessonProgress.currentSection}
            </Badge>
          </div>
        </div>
      </header>

      {/* Lesson Progress Bar */}
      <LessonProgressBar />

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left - Participants */}
        <div className="w-64 border-r border-dark-line bg-dark-card">
          <ParticipantsPanel />
        </div>

        {/* Center - Whiteboard */}
        <div className="flex-1 flex flex-col">
          <WhiteboardPanel />
        </div>

        {/* Right - Chat */}
        <div className="w-80 border-l border-dark-line bg-dark-card">
          <ChatPanel />
        </div>
      </main>

      {/* Bottom Controls */}
      <footer className="border-t border-dark-line bg-dark-surface px-4 py-3">
        <div className="flex items-center justify-center gap-4">
          <button className="p-3 rounded-xl bg-dark-card border border-dark-line text-slate-400 hover:text-white hover:border-white/30 transition-colors">
            <Mic className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-xl bg-dark-card border border-dark-line text-slate-400 hover:text-white hover:border-white/30 transition-colors">
            <Hand className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-xl bg-dark-card border border-dark-line text-slate-400 hover:text-white hover:border-white/30 transition-colors">
            <MessageSquare className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-xl bg-coral text-white hover:bg-coral-strong transition-colors">
            <PenTool className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
