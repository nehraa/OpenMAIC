'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib/cn';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
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

const faqItems = [
  {
    question: 'How does AIDU adapt to my learning level?',
    answer: 'AIDU\'s AI professor continuously assesses your responses through Socratic questioning and quiz performance. It adjusts explanation depth and pace dynamically, ensuring you\'re always learning at your edge of capability.',
  },
  {
    question: 'What devices support AIDU?',
    answer: 'AIDU works on any modern browser — desktop, tablet, and mobile. For voice features, we recommend a microphone. 3D simulations require WebGL support, which is available on 99% of modern devices.',
  },
  {
    question: 'How is my data protected?',
    answer: 'Your learning data is encrypted at rest and in transit. We never sell personal data. Teachers have full control over student data and can export or delete it anytime. Our infrastructure is hosted on ISO 27001 certified data centers.',
  },
  {
    question: 'Can AIDU be used for exam preparation?',
    answer: 'Absolutely. Exam Prep mode focuses on past papers, time-bounded practice, and confidence scoring. The Examiner agent identifies weak areas and generates targeted practice to strengthen them.',
  },
  {
    question: 'Do you offer school or institutional pricing?',
    answer: 'Yes. Schools and coaching centers can request a pilot program with dedicated onboarding, teacher training, and custom pricing based on student count. Contact our education team for details.',
  },
  {
    question: 'What languages does AIDU support?',
    answer: 'AIDU currently supports 28 languages including English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, and more. The AI professor can explain concepts in your preferred language and switch seamlessly.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 lg:py-32 bg-dark-surface">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-coral text-sm font-semibold uppercase tracking-wider mb-3">FAQ</p>
          <h2 className="font-display text-h2 font-bold text-white">Questions answered</h2>
        </div>

        <div className="divide-y divide-dark-line">
          {faqItems.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
