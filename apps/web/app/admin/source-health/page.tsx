'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';

interface Source {
  id: string;
  name: string;
  status: 'active' | 'failed';
  policyStatus: 'active' | 'inactive';
  lastFetch: string;
  freshnessMinutes: number;
  recordsPerRun: number;
  errorRate: string;
  isBreach: boolean;
  enabled: boolean;
}

const mockSources: Source[] = [
  {
    id: 'eu-ted',
    name: 'EU TED',
    status: 'active',
    policyStatus: 'active',
    lastFetch: '12 min ago',
    freshnessMinutes: 12,
    recordsPerRun: 2847,
    errorRate: '0.02%',
    isBreach: false,
    enabled: true,
  },
  {
    id: 'sg-procurement',
    name: 'National e-Procurement Portal (SG)',
    status: 'active',
    policyStatus: 'active',
    lastFetch: '8 min ago',
    freshnessMinutes: 8,
    recordsPerRun: 153,
    errorRate: '0.00%',
    isBreach: false,
    enabled: true,
  },
  {
    id: 'th-procurement',
    name: 'Government Procurement (TH)',
    status: 'active',
    policyStatus: 'active',
    lastFetch: '15 min ago',
    freshnessMinutes: 15,
    recordsPerRun: 421,
    errorRate: '0.15%',
    isBreach: false,
    enabled: true,
  },
  {
    id: 'au-contracts',
    name: 'Australian Contracts Finder',
    status: 'failed',
    policyStatus: 'active',
    lastFetch: '2 hours ago',
    freshnessMinutes: 120,
    recordsPerRun: 89,
    errorRate: '12.5%',
    isBreach: true,
    enabled: true,
  },
  {
    id: 'wb-procurement',
    name: 'World Bank Procurement',
    status: 'active',
    policyStatus: 'active',
    lastFetch: '22 min ago',
    freshnessMinutes: 22,
    recordsPerRun: 356,
    errorRate: '0.08%',
    isBreach: false,
    enabled: true,
  },
];

interface DisableFormState {
  sourceId: string | null;
  sourceName: string;
  reason: string;
  newStatus: 'enable' | 'disable';
}

export default function SourceHealthPage() {
  const [sources, setSources] = useState<Source[]>(mockSources);
  const [formState, setFormState] = useState<DisableFormState>({
    sourceId: null,
    sourceName: '',
    reason: '',
    newStatus: 'disable',
  });
  const [showForm, setShowForm] = useState(false);

  const handleOpenDisableForm = (source: Source) => {
    setFormState({
      sourceId: source.id,
      sourceName: source.name,
      reason: '',
      newStatus: source.enabled ? 'disable' : 'enable',
    });
    setShowForm(true);
  };

  const handleSubmitForm = () => {
    if (!formState.sourceId || !formState.reason.trim()) return;

    setSources((prev) =>
      prev.map((s) =>
        s.id === formState.sourceId
          ? { ...s, enabled: formState.newStatus === 'enable' }
          : s
      )
    );

    setShowForm(false);
    setFormState({
      sourceId: null,
      sourceName: '',
      reason: '',
      newStatus: 'disable',
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormState({
      sourceId: null,
      sourceName: '',
      reason: '',
      newStatus: 'disable',
    });
  };

  const activeSourcesCount = sources.filter(
    (s) => s.status === 'active' && s.enabled
  ).length;
  const breachedSources = sources.filter((s) => s.isBreach).length;

  return (
    <div className="mx-auto max-w-7xl px-8 py-8">
      {/* Page header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-bold">Source Health</h1>
        <button className="flex items-center gap-2 rounded-md border border-rule bg-surface-raised px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-accent hover:bg-surface">
          <RefreshCw width={16} height={16} />
          Refresh
        </button>
      </div>

      {/* Sources table */}
      <div className="mb-8 overflow-hidden rounded-md border border-rule bg-surface">
        {/* Table header */}
        <div className="grid grid-cols-6 gap-6 border-b border-rule bg-canvas px-6 py-5 text-xs font-semibold uppercase text-ink-muted">
          <div>Source</div>
          <div>Policy</div>
          <div>Last Fetch</div>
          <div>Records/Run</div>
          <div>Error Rate</div>
          <div></div>
        </div>

        {/* Table rows */}
        {sources.map((source) => (
          <div
            key={source.id}
            className="grid grid-cols-6 gap-6 border-b border-rule px-6 py-5 last:border-b-0"
          >
            {/* Source name */}
            <div>
              <div
                className={`font-semibold ${
                  source.enabled ? 'text-ink' : 'text-ink-muted'
                }`}
              >
                {source.name}
                {!source.enabled && (
                  <span className="ml-2 text-xs text-ink-muted">(disabled)</span>
                )}
              </div>
            </div>

            {/* Policy status */}
            <div>
              <div className="inline-flex items-center gap-1 rounded-sm bg-success bg-opacity-10 px-3 py-2 text-sm font-medium text-success">
                <CheckCircle width={14} height={14} />
                Active
              </div>
            </div>

            {/* Last Fetch */}
            <div
              className={`text-sm ${
                source.isBreach
                  ? 'font-medium text-warning'
                  : 'text-ink-muted'
              }`}
            >
              {source.lastFetch}
              {source.isBreach && ' (breach)'}
              {!source.isBreach && ' ✓'}
            </div>

            {/* Records/Run */}
            <div className="font-mono text-sm text-ink-muted">
              {source.recordsPerRun.toLocaleString()} items
            </div>

            {/* Error Rate */}
            <div className="font-mono text-sm text-ink-muted">
              {source.errorRate}
            </div>

            {/* Actions */}
            <div className="flex justify-end">
              <button
                onClick={() => handleOpenDisableForm(source)}
                className={`flex h-8 w-8 items-center justify-center rounded-sm border transition-colors ${
                  source.status === 'failed'
                    ? 'border-danger bg-surface text-danger hover:bg-surface-raised'
                    : 'border-rule bg-surface hover:border-accent hover:bg-surface-raised'
                }`}
                title="Enable/disable source"
                aria-label="More options"
              >
                <MoreVertical width={16} height={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-2 gap-8">
        {/* Dashboard */}
        <div className="rounded-md border border-rule bg-surface p-6">
          <h3 className="mb-3 font-display text-sm font-semibold">Dashboard</h3>
          <div className="space-y-4 text-sm">
            <div>
              <div className="mb-1 text-ink-muted">Active sources</div>
              <div className="text-2xl font-bold text-success">
                {activeSourcesCount} / {sources.filter((s) => s.enabled).length}
              </div>
            </div>
            <div>
              <div className="mb-1 text-ink-muted">Avg. freshness</div>
              <div className="text-2xl font-bold text-ink">
                {Math.round(
                  sources.filter((s) => s.enabled).reduce((sum, s) => sum + s.freshnessMinutes, 0) /
                    sources.filter((s) => s.enabled).length
                )}{' '}
                min
              </div>
            </div>
            <div>
              <div className="mb-1 text-ink-muted">SLA status</div>
              <div className="text-sm font-semibold text-warning">
                {breachedSources === 0
                  ? 'All sources healthy'
                  : `${breachedSources} source${breachedSources > 1 ? 's' : ''} in breach`}
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-md border border-rule bg-surface p-6">
          <h3 className="mb-3 font-display text-sm font-semibold">
            Quick actions
          </h3>
          <div className="flex flex-col gap-2">
            <button className="flex items-center justify-start gap-2 rounded-md border border-rule bg-surface-raised px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-accent hover:bg-surface">
              <RefreshCw width={16} height={16} />
              Run all sources now
            </button>
            <button className="flex items-center justify-start gap-2 rounded-md border border-rule bg-surface-raised px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-accent hover:bg-surface">
              <AlertTriangle width={16} height={16} />
              View system logs
            </button>
            <button className="flex items-center justify-start gap-2 rounded-md border border-rule bg-surface-raised px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-accent hover:bg-surface">
              <AlertCircle width={16} height={16} />
              Source config
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-md border border-rule bg-surface p-6 shadow-lg">
            <h2 className="mb-4 font-display text-lg font-bold">
              {formState.newStatus === 'disable' ? 'Disable' : 'Enable'} Source
            </h2>

            <p className="mb-4 text-sm text-ink-muted">
              Source:{' '}
              <span className="font-mono font-semibold text-ink">
                {formState.sourceName}
              </span>
            </p>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-ink">
                Reason for {formState.newStatus === 'disable' ? 'disabling' : 'enabling'}
              </label>
              <textarea
                value={formState.reason}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="e.g., Temporary maintenance, policy update, vendor request..."
                className="w-full rounded-md border border-rule bg-canvas px-3 py-2 text-sm text-ink placeholder-ink-faint focus:border-accent focus:outline-none"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseForm}
                className="flex-1 rounded-md border border-rule bg-surface-raised px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitForm}
                disabled={!formState.reason.trim()}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium text-accent-ink transition-colors ${
                  formState.reason.trim()
                    ? 'bg-accent hover:bg-opacity-90'
                    : 'bg-opacity-50 cursor-not-allowed bg-accent'
                }`}
              >
                {formState.newStatus === 'disable' ? 'Disable' : 'Enable'} Source
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
