'use client';

import { useState } from 'react';
import { Plus, Info } from 'lucide-react';
import SavedSearchesList, { SavedSearch } from './SavedSearchesList';

const INITIAL_SEARCHES: SavedSearch[] = [
  {
    id: '1',
    name: 'React + Node.js in Southeast Asia',
    filterSummary:
      'Countries: Singapore, Thailand, Malaysia · Technology: React, Node.js · Budget: $50k–$500k',
    alertThreshold: 'Strong matches (80+)',
    deliveryMode: 'Email (instant)',
  },
  {
    id: '2',
    name: 'Healthcare IT contracts',
    filterSummary:
      'Industry: Healthcare · Procedure: Open bidding · Budget: $100k–$1M',
    alertThreshold: 'Worth reviewing (60+)',
    deliveryMode: 'Slack (daily digest)',
  },
  {
    id: '3',
    name: 'Mobile development in ASEAN',
    filterSummary:
      'Technology: Flutter, React Native · Countries: All ASEAN · Published: Last 7 days',
    alertThreshold: 'All matches (40+)',
    deliveryMode: 'In-app (weekly)',
  },
];

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>(INITIAL_SEARCHES);

  const handleDelete = (id: string) => {
    setSearches((prev) => prev.filter((search) => search.id !== id));
  };

  const handleUpdate = (
    id: string,
    updates: Partial<SavedSearch>
  ) => {
    setSearches((prev) =>
      prev.map((search) =>
        search.id === id ? { ...search, ...updates } : search
      )
    );
  };

  const handleAddNew = () => {
    const newId = Math.random().toString(36).substring(7);
    const newSearch: SavedSearch = {
      id: newId,
      name: 'Untitled search',
      filterSummary: 'No filters configured',
      alertThreshold: 'Worth reviewing (60+)',
      deliveryMode: 'Email (instant)',
    };
    setSearches((prev) => [newSearch, ...prev]);
  };

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <h1 className="font-display text-2xl font-bold">Saved Searches</h1>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-accent text-accent-ink text-sm font-medium rounded-md hover:bg-accent/90 transition-all flex items-center gap-2"
        >
          <Plus size={16} strokeWidth={2} />
          New Search Rule
        </button>
      </div>

      {/* Info Box */}
      <div className="mb-8 flex gap-3 bg-accent/5 border border-accent/20 rounded-md p-4">
        <Info size={20} className="text-accent flex-shrink-0 mt-0.5" strokeWidth={2} />
        <div className="text-sm text-ink-muted">
          <strong className="text-ink">Saved searches are tactical rules.</strong> They match new
          tenders and send alerts when criteria are met. Unlike your company profile (which is
          company-wide), each rule can override global alert settings and apply to specific teams.
        </div>
      </div>

      {/* Saved Searches List */}
      <SavedSearchesList
        searches={searches}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />

      {/* Help Section */}
      <div className="mt-8 p-6 bg-surface border border-rule rounded-md">
        <h3 className="font-display text-sm font-semibold mb-3">How Saved Searches work</h3>
        <ul className="text-xs text-ink-muted space-y-2 pl-4 list-disc">
          <li>
            <strong className="text-ink">Profile vs. searches:</strong> Your company profile is
            company-wide matching. Saved searches are team-specific tactical rules.
          </li>
          <li>
            <strong className="text-ink">Alert override:</strong> Each rule can set its own
            threshold and delivery mode, overriding global alert settings.
          </li>
          <li>
            <strong className="text-ink">Instant + digest:</strong> Choose instant alerts for
            critical searches (e.g., specific technologies) or daily/weekly digests for broader
            research.
          </li>
          <li>
            <strong className="text-ink">Team collaboration:</strong> Assign search owners and
            share results with specific team members.
          </li>
        </ul>
      </div>
    </div>
  );
}
