'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, Shield, BarChart3, ListTodo } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isSourceHealthActive =
    pathname === '/admin/source-health';
  const isReviewQueueActive =
    pathname === '/admin/review-queue';

  return (
    <html>
      <body className="bg-canvas">
        {/* Admin banner - warning-colored top bar */}
        <div className="flex items-center gap-3 bg-danger px-8 py-4 text-accent-ink">
          <AlertTriangle width={18} height={18} strokeWidth={2} />
          <span className="text-sm font-medium">
            Admin environment — restricted access. Do not navigate here from customer navigation.
          </span>
        </div>

        {/* Admin navigation */}
        <nav className="border-b border-rule bg-surface px-8 py-5">
          <div className="mx-auto flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-sm bg-danger px-3 py-1 text-xs font-semibold uppercase text-accent-ink">
                <Shield width={12} height={12} strokeWidth={2} />
                Admin
              </div>
            </div>

            <div className="flex gap-8">
              <Link
                href="/admin/source-health"
                className={`flex items-center gap-2 border-b-2 pb-1 text-sm font-medium transition-colors ${
                  isSourceHealthActive
                    ? 'border-accent text-ink'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <BarChart3 width={16} height={16} />
                Source Health
              </Link>

              <Link
                href="/admin/review-queue"
                className={`flex items-center gap-2 border-b-2 pb-1 text-sm font-medium transition-colors ${
                  isReviewQueueActive
                    ? 'border-accent text-ink'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <ListTodo width={16} height={16} />
                Review Queue
              </Link>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="min-h-screen bg-canvas">{children}</main>
      </body>
    </html>
  );
}
