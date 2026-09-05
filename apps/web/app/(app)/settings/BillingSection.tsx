'use client';

import { ExternalLink } from 'lucide-react';

export function BillingSection() {
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-surface border border-rule rounded-md p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-display text-base font-bold text-ink mb-1">
              Current plan
            </h3>
            <p className="text-sm text-ink-muted">Growth plan</p>
          </div>
          <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm font-medium text-ink hover:bg-canvas transition-all">
            Change plan
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Price
            </span>
            <span className="text-lg font-bold text-ink">$299/mo</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Billing cycle
            </span>
            <span className="text-sm text-ink">Monthly</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Next billing date
            </span>
            <span className="text-sm text-ink">October 5, 2026</span>
          </div>
        </div>
      </div>

      {/* Included Usage */}
      <div className="bg-surface border border-rule rounded-md p-6">
        <h3 className="font-display text-base font-bold text-ink mb-4">
          Included usage
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">AI analyses</p>
              <p className="text-xs text-ink-muted">Deep analysis of tender requirements and risk assessment</p>
            </div>
            <span className="text-sm font-bold text-accent">Unlimited</span>
          </div>
          <div className="border-t border-rule pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Team members</p>
              <p className="text-xs text-ink-muted">Users with access to your workspace</p>
            </div>
            <span className="text-sm font-bold text-accent">Up to 10</span>
          </div>
          <div className="border-t border-rule pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Saved searches</p>
              <p className="text-xs text-ink-muted">Custom tender watchlists and rules</p>
            </div>
            <span className="text-sm font-bold text-accent">Unlimited</span>
          </div>
          <div className="border-t border-rule pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Source coverage</p>
              <p className="text-xs text-ink-muted">Tender databases you can monitor</p>
            </div>
            <span className="text-sm font-bold text-accent">All regions</span>
          </div>
        </div>
      </div>

      {/* Current Usage */}
      <div className="bg-surface border border-rule rounded-md p-6">
        <h3 className="font-display text-base font-bold text-ink mb-4">
          Current usage
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-ink">
                AI analyses this month
              </span>
              <span className="text-sm font-bold text-ink">
                42 / 100 analyses
              </span>
            </div>
            <div className="w-full bg-canvas border border-rule rounded-sm h-2 overflow-hidden">
              <div
                className="bg-accent h-full"
                style={{ width: '42%' }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-ink">
                Team members in use
              </span>
              <span className="text-sm font-bold text-ink">5 / 10 members</span>
            </div>
            <div className="w-full bg-canvas border border-rule rounded-sm h-2 overflow-hidden">
              <div className="bg-success h-full" style={{ width: '50%' }} />
            </div>
          </div>
        </div>
        <p className="text-xs text-ink-faint mt-4">
          Usage is calculated on a calendar month basis and resets on the 1st of each month.
        </p>
      </div>

      {/* Manage Billing */}
      <div className="bg-surface border border-rule rounded-md p-6">
        <h3 className="font-display text-base font-bold text-ink mb-4">
          Manage billing
        </h3>
        <p className="text-sm text-ink-muted mb-4">
          View invoices, update payment method, or manage your subscription
          settings in our billing portal.
        </p>
        <button className="px-4 py-2 bg-accent text-accent-ink rounded-md text-sm font-medium hover:bg-blue-700 transition-all flex items-center gap-2">
          Manage billing <ExternalLink size={16} />
        </button>
      </div>
    </div>
  );
}
