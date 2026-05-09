'use client';

import { cn } from '@/app/lib/cn';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItemProps {
  question: string;
  answer: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AccordionItem({
  question,
  answer,
  isOpen = false,
  onToggle,
}: AccordionItemProps) {
  return (
    <div className="border-b border-dark-line last:border-0">
      <button
        className="w-full py-5 flex items-center justify-between text-left hover:text-coral transition-colors"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="font-medium text-lg pr-4">{question}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-96 pb-5' : 'max-h-0'
        )}
      >
        <p className="text-slate-400 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

interface AccordionProps {
  items: ReadonlyArray<{ question: string; answer: string }>;
  className?: string;
}

export function Accordion({ items, className }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={cn('divide-y divide-dark-line', className)}>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          question={item.question}
          answer={item.answer}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
        />
      ))}
    </div>
  );
}
