'use client';

import { useState } from 'react';
import { X, CheckCircle, ArrowRight } from 'lucide-react';

export interface PipelineStageMapping {
  tenderId: string;
  stage: 'New' | 'Reviewing' | 'Pursuing' | 'Submitted' | 'Won' | 'Lost';
  owner: string;
  nextActionDate?: string;
}

export interface PipelineCardData {
  id: string;
  title: string;
  buyerName: string;
  deadline: string;
  score: number;
  matchBand: 'strong' | 'worth-reviewing' | 'low-priority' | 'not-recommended';
  stage: string;
  owner: string;
  nextActionDate?: string;
}

const PIPELINE_STAGES = ['New', 'Reviewing', 'Pursuing', 'Submitted', 'Won', 'Lost'];

interface PipelineBoardProps {
  cards: PipelineCardData[];
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

function getScoreBandColor(band: string): string {
  switch (band) {
    case 'strong':
      return 'text-success';
    case 'worth-reviewing':
      return 'text-accent';
    case 'low-priority':
      return 'text-warning';
    case 'not-recommended':
      return 'text-danger';
    default:
      return 'text-ink-muted';
  }
}

function Card({
  card,
  isSelected,
  onClick,
}: {
  card: PipelineCardData;
  isSelected: boolean;
  onClick: () => void;
}) {
  const ownerInitial = card.owner.charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-surface border rounded-md p-4 transition-all duration-150 hover:border-accent hover:shadow-sm ${
        isSelected
          ? 'border-accent shadow-sm ring-2 ring-accent/20'
          : 'border-rule'
      }`}
      data-testid={`pipeline-card-${card.id}`}
    >
      <div className="flex flex-col gap-3">
        <div className="font-mono text-sm font-bold text-accent">
          {card.score}
        </div>

        <div className="line-clamp-2 text-sm font-semibold text-ink leading-tight">
          {card.title}
        </div>

        <div className="text-xs text-ink-muted">
          {card.buyerName}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-rule gap-3">
          <div
            className="w-6 h-6 bg-surface-raised rounded-full flex items-center justify-center text-xs font-semibold text-ink-muted"
            title={card.owner}
          >
            {ownerInitial}
          </div>
          <div className="text-xs text-warning font-medium">
            {formatDate(card.deadline)}
          </div>
        </div>
      </div>
    </button>
  );
}

function StageColumn({
  stage,
  cards,
  selectedCardId,
  onSelectCard,
}: {
  stage: string;
  cards: PipelineCardData[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
}) {
  return (
    <div className="bg-canvas rounded-md p-4 flex flex-col gap-4 min-w-[280px]">
      <div className="flex items-center justify-between pb-3 border-b border-rule">
        <div className="text-xs font-bold text-ink-muted uppercase tracking-wider">
          {stage}
        </div>
        <div className="text-xs text-ink-faint bg-surface px-2 py-1 rounded-sm">
          {cards.length}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            isSelected={selectedCardId === card.id}
            onClick={() => onSelectCard(card.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Hardcoded collaborators for demo
const COLLABORATORS_MAP: Record<string, Array<{ name: string; initial: string; color: string }>> = {
  Alice: [
    { name: 'Alice', initial: 'A', color: '#0052cc' },
    { name: 'James', initial: 'J', color: '#7c3aed' },
    { name: 'Sarah', initial: 'S', color: '#ec4899' },
  ],
  Bob: [
    { name: 'Bob', initial: 'B', color: '#0052cc' },
    { name: 'Maria', initial: 'M', color: '#7c3aed' },
  ],
  Charlie: [
    { name: 'Charlie', initial: 'C', color: '#0052cc' },
    { name: 'David', initial: 'D', color: '#7c3aed' },
    { name: 'Emma', initial: 'E', color: '#ec4899' },
  ],
};

// Hardcoded stage history for demo
const STAGE_HISTORY_MAP: Record<string, Array<{ action: string; date: string; icon: 'check' | 'arrow' }>> = {
  'tender-001': [
    { action: 'Discovered', date: '2026-09-05', icon: 'arrow' },
  ],
  'tender-002': [
    { action: 'Moved to Reviewing by Bob', date: '2026-09-04', icon: 'check' },
    { action: 'Discovered', date: '2026-08-28', icon: 'arrow' },
  ],
  'tender-003': [
    { action: 'Moved to Reviewing by Charlie', date: '2026-09-03', icon: 'check' },
    { action: 'Discovered', date: '2026-08-20', icon: 'arrow' },
  ],
  'tender-004': [
    { action: 'Moved to Pursuing by Alice', date: '2026-09-02', icon: 'check' },
    { action: 'Moved to Reviewing by Alice', date: '2026-08-25', icon: 'arrow' },
    { action: 'Discovered', date: '2026-08-15', icon: 'arrow' },
  ],
  'tender-005': [
    { action: 'Moved to Submitted by Bob', date: '2026-09-01', icon: 'check' },
    { action: 'Moved to Pursuing by Bob', date: '2026-08-20', icon: 'arrow' },
    { action: 'Discovered', date: '2026-08-10', icon: 'arrow' },
  ],
  'tender-006': [
    { action: 'Moved to Won by Charlie', date: '2026-09-04', icon: 'check' },
    { action: 'Moved to Submitted by Charlie', date: '2026-08-15', icon: 'arrow' },
    { action: 'Discovered', date: '2026-07-01', icon: 'arrow' },
  ],
  'tender-007': [
    { action: 'Moved to Lost by Alice', date: '2026-08-29', icon: 'check' },
    { action: 'Discovered', date: '2026-08-01', icon: 'arrow' },
  ],
};

function getRelativeDateString(dateString: string): string {
  try {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `in ${diffDays} days`;
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return dateString;
  } catch {
    return dateString;
  }
}

function DetailPanel({
  card,
  onClose,
}: {
  card: PipelineCardData | null;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState<string>(
    'Need to clarify technical requirements. Waiting for vendor feedback on timeline.'
  );

  if (!card) return null;

  const ownerInitial = card.owner.charAt(0).toUpperCase();
  const collaborators = COLLABORATORS_MAP[card.owner] || [
    { name: card.owner, initial: ownerInitial, color: '#0052cc' },
  ];
  const stageHistory = STAGE_HISTORY_MAP[card.id] || [];

  return (
    <div className="bg-surface border border-rule rounded-md p-6 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
            {card.stage}
          </div>
          <h2 className="text-lg font-semibold text-ink mb-2">
            {card.title}
          </h2>
          <p className="text-sm text-ink-muted">
            {card.buyerName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-ink-muted hover:text-ink transition-colors"
          aria-label="Close detail panel"
          data-testid="detail-panel-close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="border-t border-rule pt-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-ink-faint font-medium mb-1">
              Match Score
            </p>
            <p className={`text-lg font-bold font-mono ${getScoreBandColor(card.matchBand)}`}>
              {card.score}
            </p>
            <p className="text-xs text-ink-muted">
              {card.matchBand.replace(/-/g, ' ')}
            </p>
          </div>

          <div>
            <p className="text-xs text-ink-faint font-medium mb-1">
              Deadline
            </p>
            <p className="text-sm text-ink">
              {formatDate(card.deadline)}
            </p>
            <p className="text-xs text-ink-muted">
              {new Date(card.deadline).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-rule pt-4">
        <p className="text-xs text-ink-faint font-medium mb-2 uppercase tracking-wider">
          Owner & Collaborators
        </p>
        <p className="text-sm text-ink mb-3">
          <span className="font-medium">Owner: </span>
          {card.owner}
        </p>
        <div className="flex gap-2 flex-wrap" data-testid="collaborators-list">
          {collaborators.map((collab, index) => (
            <div
              key={index}
              className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white text-xs border border-rule"
              style={{ backgroundColor: collab.color }}
              title={collab.name}
              data-testid={`collaborator-avatar-${collab.initial}`}
            >
              {collab.initial}
            </div>
          ))}
        </div>
      </div>

      {card.nextActionDate && (
        <div className="border-t border-rule pt-4">
          <p className="text-xs text-ink-faint font-medium mb-2 uppercase tracking-wider">
            Next Action Date
          </p>
          <p className="text-sm text-ink" data-testid="next-action-date">
            {new Date(card.nextActionDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}{' '}
            <span className="text-ink-muted">
              ({getRelativeDateString(card.nextActionDate)})
            </span>
          </p>
        </div>
      )}

      <div className="border-t border-rule pt-4">
        <p className="text-xs text-ink-faint font-medium mb-2 uppercase tracking-wider">
          Internal Notes
        </p>
        <p className="text-xs text-ink-muted mb-2">
          Organization-private notes, never sent to AI provider
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this opportunity..."
          className="w-full px-3 py-2 border border-rule rounded-sm text-sm text-ink bg-surface placeholder-ink-faint resize-none focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          rows={4}
          data-testid="notes-textarea"
        />
      </div>

      {stageHistory.length > 0 && (
        <div className="border-t border-rule pt-4">
          <p className="text-xs text-ink-faint font-medium mb-3 uppercase tracking-wider">
            Stage History
          </p>
          <div className="space-y-2" data-testid="stage-history">
            {stageHistory.map((item, index) => (
              <div key={index} className="flex gap-2 text-xs text-ink-muted">
                {item.icon === 'check' ? (
                  <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
                ) : (
                  <ArrowRight size={14} className="flex-shrink-0 mt-0.5" />
                )}
                <span>
                  {item.action} on{' '}
                  {new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PipelineBoard({ cards }: PipelineBoardProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const selectedCard = cards.find((c) => c.id === selectedCardId) || null;

  // Group cards by stage
  const cardsByStage = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = cards.filter((c) => c.stage === stage);
      return acc;
    },
    {} as Record<string, PipelineCardData[]>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            cards={cardsByStage[stage]}
            selectedCardId={selectedCardId}
            onSelectCard={setSelectedCardId}
          />
        ))}
      </div>

      {/* Detail Panel */}
      {selectedCard && (
        <div className="border-t border-rule pt-8">
          <h3 className="text-sm font-semibold text-ink-muted mb-4 uppercase tracking-wider">
            Card Details
          </h3>
          <DetailPanel
            card={selectedCard}
            onClose={() => setSelectedCardId(null)}
          />
        </div>
      )}
    </div>
  );
}
