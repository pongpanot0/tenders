'use client';

import { useState, useMemo } from 'react';
import { mockTenders } from '@/lib/mock-data';
import { Save, Columns, ChevronDown, Search } from 'lucide-react';
import ExploreTable from './ExploreTable';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFitColumn, setShowFitColumn] = useState(true);

  // Filter tenders based on search query (title, buyer, fitTags, source)
  const filteredTenders = useMemo(() => {
    if (!searchQuery.trim()) {
      return mockTenders;
    }

    const query = searchQuery.toLowerCase();
    return mockTenders.filter(
      (tender) =>
        tender.title.toLowerCase().includes(query) ||
        tender.buyerName.toLowerCase().includes(query) ||
        tender.fitTags.some((tag) => tag.toLowerCase().includes(query)) ||
        tender.source.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleClearFilters = () => {
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold mb-2">Explore tenders</h1>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by title, buyer, technology, tender ID, or key terms…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-rule rounded-md text-sm text-ink placeholder-ink-faint bg-surface focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
        />
      </div>

      {/* Controls Bar */}
      <div className="bg-surface border border-rule rounded-md p-4 mb-6 flex gap-3 items-center flex-wrap justify-between">
        <div className="flex gap-3 flex-wrap">
          <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all">
            Open
          </button>
          <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all flex items-center gap-2">
            Countries
            <ChevronDown size={16} />
          </button>
          <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all">
            Sources
          </button>
          <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all">
            Published
          </button>
          <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all">
            Deadline
          </button>
          <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all">
            Value
          </button>
          <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all">
            More filters
          </button>
        </div>

        <div className="flex gap-3 items-center">
          <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all flex items-center gap-2 whitespace-nowrap">
            <Save size={16} />
            Save search
          </button>
          <button
            onClick={() => setShowFitColumn(!showFitColumn)}
            className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all flex items-center gap-2 whitespace-nowrap"
            title="Toggle Your fit column"
          >
            <Columns size={16} />
            Columns
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div className="text-sm text-ink-muted">
          Found <strong>{filteredTenders.length}</strong> result
          {filteredTenders.length !== 1 ? 's' : ''}
        </div>
        <select className="px-3 py-2 border border-rule rounded-md text-sm text-ink bg-surface hover:border-accent focus:outline-none focus:border-accent">
          <option>Sort: Relevance</option>
          <option>Deadline (soonest)</option>
          <option>Recently published</option>
          <option>Value (high to low)</option>
        </select>
      </div>

      {/* Results Table or Empty State */}
      {filteredTenders.length === 0 ? (
        <div className="bg-surface border border-rule rounded-md p-12 text-center">
          <Search
            size={32}
            className="mx-auto mb-4 text-ink-faint"
            strokeWidth={1.5}
          />
          <div className="text-sm text-ink-faint mb-4">
            No open tenders match these filters.
          </div>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ExploreTable tenders={filteredTenders} showFitColumn={showFitColumn} />
      )}
    </div>
  );
}
