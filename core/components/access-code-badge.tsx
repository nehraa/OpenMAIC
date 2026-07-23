'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Copy, Check } from 'lucide-react';
import { useI18n } from '@/lib/hooks/use-i18n';
import { cn } from '@/lib/utils';

interface AccessCodeStatus {
  enabled: boolean;
  authenticated: boolean;
  code?: string | null;
}

export function AccessCodeBadge() {
  const { t } = useI18n();
  const [status, setStatus] = useState<AccessCodeStatus | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/classroom/api/access-code/status')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setStatus(data);
      })
      .catch(() => {});
  }, []);

  if (!status || !status.code) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(status.code!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — user can still read it off the badge
    }
  };

  return (
    <div
      className={cn(
        'absolute top-3 right-3 z-30 flex items-center gap-1.5 rounded-full',
        'bg-black/55 backdrop-blur-md pl-3 pr-2 py-1.5 text-white text-xs font-medium',
        'shadow-lg ring-1 ring-white/10'
      )}
      title={t('accessCode.shareHint') || 'Share this access code with students'}
      data-testid="access-code-badge"
    >
      <KeyRound className="h-3.5 w-3.5 opacity-90" />
      <span className="opacity-80">{t('accessCode.codeLabel') || 'Code'}:</span>
      <code className="font-mono tracking-widest">{status.code}</code>
      <button
        onClick={handleCopy}
        aria-label="Copy access code"
        className={cn(
          'ml-1 flex h-6 w-6 items-center justify-center rounded-full',
          'transition-colors hover:bg-white/15'
        )}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-300" />
        ) : (
          <Copy className="h-3.5 w-3.5 opacity-90" />
        )}
      </button>
    </div>
  );
}
