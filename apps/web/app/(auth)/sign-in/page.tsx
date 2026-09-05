'use client';

import { Target } from 'lucide-react';
import SignInForm from './SignInForm';

export default function SignInPage() {
  return (
    <div className="grid grid-cols-2 min-h-screen md:grid-cols-1">
      {/* Left Panel */}
      <div className="bg-surface border-r border-rule px-8 py-8 flex flex-col justify-center md:border-r-0 md:border-b">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-12">
          <Target className="w-6 h-6 stroke-accent" strokeWidth={2} />
          <span className="font-display text-xl font-bold text-accent">
            Tender Intelligence
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-4xl font-bold leading-tight mb-6 text-ink md:text-2xl">
          Find work worth bidding.
        </h1>

        {/* Subheadline */}
        <p className="text-base leading-relaxed text-ink-muted">
          See the tenders your team can actually pursue. Understand the fit, the
          risks, and what comes next — before you commit.
        </p>
      </div>

      {/* Right Panel */}
      <div className="bg-canvas px-8 py-8 flex flex-col justify-center items-center">
        <div className="w-full max-w-sm">
          {/* Form Title */}
          <h2 className="font-display text-2xl font-bold mb-8 text-center text-ink">
            Sign in
          </h2>

          {/* Form */}
          <SignInForm />

          {/* SSO Link */}
          <div className="text-center text-xs text-ink-muted pt-4 border-t border-rule mt-4">
            SSO? <a href="#" className="text-accent font-medium hover:underline">
              Use your company login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
