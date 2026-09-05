'use client';

import { useState } from 'react';
import { Chrome, AlertTriangle } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);

  const handleEmailBlur = () => {
    setIsEmailTouched(true);
    if (email === '') {
      setIsEmailValid(false);
    } else {
      setIsEmailValid(EMAIL_REGEX.test(email));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (isEmailTouched) {
      if (e.target.value === '') {
        setIsEmailValid(false);
      } else {
        setIsEmailValid(EMAIL_REGEX.test(e.target.value));
      }
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === '') {
      setIsEmailTouched(true);
      setIsEmailValid(false);
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setIsEmailTouched(true);
      setIsEmailValid(false);
      return;
    }
    // No-op: visual-only form for now, as no backend exists
  };

  return (
    <form onSubmit={handleContinue}>
      {/* Google Button */}
      <button
        type="button"
        className="w-full px-4 py-3 border border-rule rounded-md font-body text-sm font-medium cursor-pointer transition-all duration-150 flex items-center justify-center gap-3 mb-4 bg-surface text-ink hover:bg-surface-raised"
      >
        <Chrome className="w-4.5 h-4.5" strokeWidth={2} />
        <span>Continue with Google</span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6 text-ink-faint text-xs">
        <div className="flex-1 h-px bg-rule"></div>
        <span>or</span>
        <div className="flex-1 h-px bg-rule"></div>
      </div>

      {/* Email Input Group */}
      <div className="mb-5">
        <label htmlFor="email" className="block text-xs font-medium mb-2 text-ink">
          Work email
        </label>
        <input
          id="email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          className={`w-full px-4 py-2.75 border rounded-md font-body text-sm text-ink transition-colors duration-150 ${
            isEmailTouched && !isEmailValid
              ? 'border-danger'
              : 'border-rule'
          } focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent focus:ring-opacity-10`}
        />
        {isEmailTouched && !isEmailValid && (
          <div className="flex items-center gap-1 text-danger text-xs mt-2" data-testid="email-error">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
            <span>Enter a valid work email</span>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <button
        type="submit"
        className="w-full px-4 py-3 border border-accent rounded-md font-body text-sm font-medium cursor-pointer transition-all duration-150 bg-accent text-accent-ink hover:bg-blue-700 mb-4"
      >
        Continue
      </button>
    </form>
  );
}
