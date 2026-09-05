'use client';

import { useState, useMemo } from 'react';
import { mockTenders, MockTender } from '@/lib/mock-data';
import {
  Heart,
  X,
  MoreVertical,
  Download,
  RefreshCw,
  AlertTriangle,
  Inbox,
} from 'lucide-react';

function getBandLabel(band: string): string {
  switch (band) {
    case 'strong':
      return 'Strong match';
    case 'worth-reviewing':
      return 'Worth reviewing';
    case 'low-priority':
      return 'Low priority';
    case 'not-recommended':
      return 'Not recommended';
    default:
      return '';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'deadline-soon':
      return 'Deadline soon';
    case 'open':
      return 'Open';
    case 'expired':
      return 'Expired';
    case 'cancelled':
      return 'Cancelled';
    case 'updated':
      return 'Updated';
    default:
      return '';
  }
}

function formatDeadline(deadline: string): { date: string; daysLeft?: number } {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const monthAbbrev = deadlineDate.toLocaleDateString('en-US', {
    month: 'short',
  });
  const day = deadlineDate.getDate();
  const date = `${day} ${monthAbbrev}`;

  return { date, daysLeft };
}

export default function InboxList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(
    mockTenders.length > 0 ? mockTenders[0].id : null
  );

  // Filter tenders based on search query
  const filteredTenders = useMemo(() => {
    if (!searchQuery.trim()) {
      return mockTenders;
    }

    const query = searchQuery.toLowerCase();
    return mockTenders.filter(
      (tender) =>
        tender.title.toLowerCase().includes(query) ||
        tender.buyerName.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const selectedTender = mockTenders.find((t) => t.id === selectedTenderId);

  const handleClearFilters = () => {
    setSearchQuery('');
  };

  const displayTime = '2 min ago';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
      {/* Main Column */}
      <div className="flex flex-col">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold mb-3">
            Opportunities
          </h1>
          <p className="text-sm text-ink-muted">
            {filteredTenders.length} open match
            {filteredTenders.length !== 1 ? 'es' : ''} · Updated {displayTime}
          </p>
        </div>

        {/* Controls Bar */}
        <div className="bg-surface border border-rule rounded-md p-4 mb-6 flex gap-4 items-center flex-wrap">
          <input
            type="text"
            placeholder="Search by title, buyer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-52 px-3 py-2 border border-rule rounded-md text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-accent"
          />
          <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all">
            Country
          </button>
          <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all">
            Deadline
          </button>
          <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all">
            Score
          </button>
          <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all">
            More filters
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-white border border-rule rounded-md text-sm text-ink-muted hover:border-accent transition-all"
          >
            Reset
          </button>
          <div className="ml-auto flex gap-3">
            <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all flex items-center gap-2">
              <Download size={16} />
              Export
            </button>
            <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all flex items-center gap-2">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tender List or Empty State */}
        {filteredTenders.length === 0 ? (
          <div className="bg-surface border border-rule rounded-md p-12 text-center">
            <Inbox
              size={32}
              className="mx-auto mb-4 text-ink-faint"
              strokeWidth={1.5}
            />
            <div className="text-sm text-ink-faint mb-4">
              No open opportunities match these filters.
            </div>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="bg-surface border border-rule rounded-md overflow-hidden">
            {filteredTenders.map((tender) => (
              <TenderRow
                key={tender.id}
                tender={tender}
                isSelected={tender.id === selectedTenderId}
                onSelect={setSelectedTenderId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <div className="bg-surface border border-rule rounded-md p-6 h-fit sticky top-8">
        {selectedTender ? (
          <DetailPanel tender={selectedTender} />
        ) : (
          <div className="text-center py-12">
            <Inbox
              size={32}
              className="mx-auto mb-4 text-ink-faint"
              strokeWidth={1.5}
            />
            <div className="text-sm text-ink-faint">
              Select a tender to view details
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TenderRow({
  tender,
  isSelected,
  onSelect,
}: {
  tender: MockTender;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const { date, daysLeft } = formatDeadline(tender.deadline);
  const bandLabel = getBandLabel(tender.matchBand);
  const isDeadlineSoon = tender.status === 'deadline-soon';
  const visibleTags = tender.fitTags.slice(0, 3);
  const remainingTags = tender.fitTags.length - visibleTags.length;

  return (
    <div
      onClick={() => onSelect(tender.id)}
      className={`w-full px-6 py-5 border-b border-rule last:border-b-0 cursor-pointer transition-all text-left grid gap-6 grid-cols-[60px_1fr_120px_100px_auto] items-center hover:bg-surface-raised ${
        isSelected ? 'bg-accent/5 border-l-4 border-l-accent pl-3' : ''
      }`}
    >
      {/* Score Badge */}
      <div className="flex flex-col items-center justify-center w-14 h-14 bg-surface-raised border border-rule rounded-md">
        <div className="font-mono text-lg font-bold text-accent">
          {tender.score}
        </div>
      </div>

      {/* Tender Info */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-1">{tender.title}</h3>
        <p className="text-xs text-ink-muted">
          {tender.buyerName} · {tender.country}
        </p>
      </div>

      {/* Fit Tags */}
      <div className="flex gap-2 flex-wrap">
        {visibleTags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-accent/10 text-accent rounded-sm text-xs font-medium whitespace-nowrap"
          >
            {tag}
          </span>
        ))}
        {remainingTags > 0 && (
          <span className="px-3 py-1 bg-accent/10 text-accent rounded-sm text-xs font-medium">
            +{remainingTags}
          </span>
        )}
      </div>

      {/* Deadline */}
      <div className="text-center">
        <div className="block font-semibold text-sm text-ink mb-1">
          {date}
        </div>
        {isDeadlineSoon ? (
          <div className="text-xs font-medium text-danger">Deadline soon</div>
        ) : daysLeft !== undefined && daysLeft >= 0 ? (
          <div className="text-xs text-ink-muted">{daysLeft} days</div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {tender.hasRisk && (
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 border border-rule bg-surface rounded-sm hover:border-accent hover:bg-surface-raised transition-all flex items-center justify-center flex-shrink-0"
            title="Risk"
          >
            <AlertTriangle size={16} className="text-warning" />
          </button>
        )}
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 border border-rule bg-surface rounded-sm hover:border-accent hover:bg-surface-raised transition-all flex items-center justify-center"
          title="Save"
        >
          <Heart size={16} />
        </button>
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 border border-rule bg-surface rounded-sm hover:border-accent hover:bg-surface-raised transition-all flex items-center justify-center"
          title="Dismiss"
        >
          <X size={16} />
        </button>
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 border border-rule bg-surface rounded-sm hover:border-accent hover:bg-surface-raised transition-all flex items-center justify-center"
          title="More"
        >
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );
}

function DetailPanel({ tender }: { tender: MockTender }) {
  const { date } = formatDeadline(tender.deadline);
  const bandLabel = getBandLabel(tender.matchBand);
  const statusLabel = getStatusLabel(tender.status);
  const budgetDisplay = tender.estimatedValue
    ? `${tender.currency} ${tender.estimatedValue.toLocaleString()}`
    : 'Not stated';

  return (
    <>
      <div className="font-display text-base font-bold mb-4 text-ink">
        {tender.title}
      </div>

      <div className="mb-6 pb-4 border-b border-rule">
        <div className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-2">
          Score
        </div>
        <div className="text-sm text-ink">
          {tender.score} · {bandLabel}
        </div>
      </div>

      <div className="mb-6 pb-4 border-b border-rule">
        <div className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-2">
          Buyer
        </div>
        <div className="text-sm text-ink">{tender.buyerName}</div>
      </div>

      <div className="mb-6 pb-4 border-b border-rule">
        <div className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-2">
          Country
        </div>
        <div className="text-sm text-ink">{tender.country}</div>
      </div>

      <div className="mb-6 pb-4 border-b border-rule">
        <div className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-2">
          Deadline
        </div>
        <div className="text-sm text-ink">{date}</div>
      </div>

      <div className="mb-6 pb-4 border-b border-rule">
        <div className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-2">
          Budget
        </div>
        <div className="text-sm text-ink">{budgetDisplay}</div>
      </div>

      <div className="mb-6 pb-4 border-b border-rule">
        <div className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-2">
          Status
        </div>
        <div className="text-sm text-ink">{statusLabel}</div>
      </div>

      <div className="mb-6 pb-4 border-b border-rule">
        <div className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-2">
          Tech Tags
        </div>
        <div className="flex gap-2 flex-wrap">
          {tender.fitTags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-accent/10 text-accent rounded-sm text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-rule">
        <button className="px-4 py-3 bg-accent text-accent-ink rounded-md text-sm font-medium hover:bg-blue-700 transition-all">
          Mark pursuing
        </button>
        <button className="px-4 py-3 bg-surface-raised text-ink rounded-md text-sm font-medium hover:bg-canvas transition-all">
          View full details →
        </button>
        <button className="px-4 py-3 bg-surface-raised text-ink rounded-md text-sm font-medium hover:bg-canvas transition-all">
          Dismiss
        </button>
      </div>
    </>
  );
}
