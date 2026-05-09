'use client';

import { cn } from '@/app/lib/cn';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Zap } from 'lucide-react';

const navLinks = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How it Works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#for-schools', label: 'For Schools' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      data-testid="navbar"
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-dark-base/80 backdrop-blur-xl border-b border-dark-line'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-coral flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">AIDU</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login/teacher"
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/login/teacher"
              className="px-5 py-2.5 text-sm font-medium bg-coral text-white rounded-[10px] hover:bg-coral-strong hover:-translate-y-0.5 hover:shadow-glow-coral transition-all duration-200"
            >
              Start Learning
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-dark-surface border-t border-dark-line">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-slate-300 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-dark-line space-y-3">
              <Link
                href="/login/teacher"
                className="block py-2 text-slate-300 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/login/teacher"
                className="block py-2.5 text-center font-medium bg-coral text-white rounded-[10px]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Start Learning
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
