'use client';

import { useState } from 'react';
import { TeamSection } from './TeamSection';
import { SourceCoverageSection } from './SourceCoverageSection';
import { BillingSection } from './BillingSection';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    'team' | 'source-coverage' | 'billing'
  >('team');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'team':
        return <TeamSection />;
      case 'source-coverage':
        return <SourceCoverageSection />;
      case 'billing':
        return <BillingSection />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-3">Settings</h1>
        <p className="text-sm text-ink-muted">
          Manage your team, sources, and billing
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-rule bg-surface">
        <div className="flex gap-6">
          {(
            [
              { id: 'team', label: 'Team' },
              { id: 'source-coverage', label: 'Source coverage' },
              { id: 'billing', label: 'Billing' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-b-accent text-accent'
                  : 'border-b-transparent text-ink-muted hover:text-ink'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-6">{renderTabContent()}</div>
    </div>
  );
}
