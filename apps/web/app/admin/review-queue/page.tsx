'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  X,
  SkipForward,
  Edit2,
} from 'lucide-react';

type IssueType =
  | 'policy_issue'
  | 'extraction_error'
  | 'low_confidence'
  | 'malformed_item';

interface ReviewItem {
  id: string;
  type: IssueType;
  title: string;
  source: string;
  sourceId: string;
  runId: string;
  discoveredTime: string;
  description: string;
  actions: string[];
}

const mockQueueItems: ReviewItem[] = [
  {
    id: 'item-1',
    type: 'policy_issue',
    title: 'Duplicate tender detected',
    source: 'EU TED',
    sourceId: 'eu-ted',
    runId: 'run-2026-001',
    discoveredTime: '3 hours ago',
    description:
      'Tender ID TEN/2026-8844 from EU TED appears to be a duplicate of existing tender ID TEN/2026-8840. Same buyer (European Commission), same scope (Cloud infrastructure modernization), same deadline (28 September). Both were indexed within 2 hours.',
    actions: ['mark_duplicate', 'not_duplicate'],
  },
  {
    id: 'item-2',
    type: 'extraction_error',
    title: 'Unable to extract deadline',
    source: 'Government Procurement (Thailand)',
    sourceId: 'th-procurement',
    runId: 'run-2026-002',
    discoveredTime: '2 hours ago',
    description:
      'OCR extracted text but deadline field could not be reliably parsed. Multiple date formats detected in notice PDF (Thai calendar + Gregorian). Confidence: 23%.',
    actions: ['provide_deadline', 'skip'],
  },
  {
    id: 'item-3',
    type: 'low_confidence',
    title: 'Ambiguous technical requirement',
    source: 'World Bank Procurement',
    sourceId: 'wb-procurement',
    runId: 'run-2026-003',
    discoveredTime: '1 hour ago',
    description:
      'Requirement states "enterprise-grade database system". Could match PostgreSQL, Oracle, or other RDBMS. Extracted as "Database (PostgreSQL preferred)" with confidence 56%. Is this correct or should we flag as "Database (unspecified)"?',
    actions: ['accept', 'edit', 'escalate'],
  },
  {
    id: 'item-4',
    type: 'malformed_item',
    title: 'Missing required buyer information',
    source: 'National e-Procurement Portal (SG)',
    sourceId: 'sg-procurement',
    runId: 'run-2026-004',
    discoveredTime: '45 minutes ago',
    description:
      'Notice record is missing buyer name field. Only buyer ID "SG-2026-B445" is available. Cannot proceed with indexing until buyer entity is resolved.',
    actions: ['lookup_buyer', 'skip'],
  },
  {
    id: 'item-5',
    type: 'policy_issue',
    title: 'Accessibility restriction detected',
    source: 'Australian Contracts Finder',
    sourceId: 'au-contracts',
    runId: 'run-2026-005',
    discoveredTime: '30 minutes ago',
    description:
      'Tender notice contains geographic restriction: "Only organizations registered in Australia may bid". Policy check flags this as requiring special handling for international bidders.',
    actions: ['acknowledge', 'flag_policy'],
  },
  {
    id: 'item-6',
    type: 'extraction_error',
    title: 'Conflicting budget ranges',
    source: 'EU TED',
    sourceId: 'eu-ted',
    runId: 'run-2026-006',
    discoveredTime: '20 minutes ago',
    description:
      'Notice shows budget range €50k-€100k in overview but "up to €150k" in detailed specifications. Extracted value is 75000. Confidence: 34%.',
    actions: ['verify_budget', 'use_lower_bound', 'use_upper_bound'],
  },
];

interface ConfirmationState {
  itemId: string | null;
  itemType: IssueType | null;
  itemTitle: string;
  source: string;
  runId: string;
  action: string;
  reason: string;
}

type StatusBadgeType = 'policy_issue' | 'extraction_error' | 'low_confidence' | 'malformed_item';

const issueTypeConfig: Record<StatusBadgeType, {
  label: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
}> = {
  policy_issue: {
    label: 'Policy Issue',
    icon: AlertCircle,
    bgColor: 'bg-warning bg-opacity-10',
    textColor: 'text-warning',
  },
  extraction_error: {
    label: 'Extraction Error',
    icon: AlertTriangle,
    bgColor: 'bg-danger bg-opacity-10',
    textColor: 'text-danger',
  },
  low_confidence: {
    label: 'Low Confidence',
    icon: HelpCircle,
    bgColor: 'bg-warning bg-opacity-10',
    textColor: 'text-warning',
  },
  malformed_item: {
    label: 'Malformed Item',
    icon: AlertTriangle,
    bgColor: 'bg-danger bg-opacity-10',
    textColor: 'text-danger',
  },
};

const actionLabels: Record<string, string> = {
  mark_duplicate: 'Mark as duplicate',
  not_duplicate: 'Not a duplicate',
  provide_deadline: 'Provide deadline',
  skip: 'Skip',
  accept: 'Accept extraction',
  edit: 'Edit & resave',
  escalate: 'Uncertain — escalate',
  lookup_buyer: 'Lookup buyer',
  acknowledge: 'Acknowledge',
  flag_policy: 'Flag policy issue',
  verify_budget: 'Verify budget',
  use_lower_bound: 'Use lower bound',
  use_upper_bound: 'Use upper bound',
};

export default function ReviewQueuePage() {
  const [items, setItems] = useState<ReviewItem[]>(mockQueueItems);
  const [confirmState, setConfirmState] = useState<ConfirmationState>({
    itemId: null,
    itemType: null,
    itemTitle: '',
    source: '',
    runId: '',
    action: '',
    reason: '',
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleOpenConfirmation = (
    item: ReviewItem,
    action: string
  ) => {
    setConfirmState({
      itemId: item.id,
      itemType: item.type,
      itemTitle: item.title,
      source: item.source,
      runId: item.runId,
      action,
      reason: '',
    });
    setShowConfirmation(true);
  };

  const handleSubmitConfirmation = () => {
    if (!confirmState.itemId || !confirmState.reason.trim()) return;

    // Remove item from queue (local state only)
    setItems((prev) => prev.filter((i) => i.id !== confirmState.itemId));

    setShowConfirmation(false);
    setConfirmState({
      itemId: null,
      itemType: null,
      itemTitle: '',
      source: '',
      runId: '',
      action: '',
      reason: '',
    });
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setConfirmState({
      itemId: null,
      itemType: null,
      itemTitle: '',
      source: '',
      runId: '',
      action: '',
      reason: '',
    });
  };

  const policyIssueCount = items.filter((i) => i.type === 'policy_issue')
    .length;
  const extractionErrorCount = items.filter((i) => i.type === 'extraction_error')
    .length;

  const getActionButtons = (item: ReviewItem) => {
    return item.actions.map((action) => {
      let isPrimary = false;
      let icon = null;

      if (
        action === 'mark_duplicate' ||
        action === 'provide_deadline' ||
        action === 'accept' ||
        action === 'lookup_buyer' ||
        action === 'acknowledge' ||
        action === 'verify_budget'
      ) {
        isPrimary = true;
        icon = CheckCircle;
      } else if (action === 'edit') {
        icon = Edit2;
      } else if (
        action === 'skip' ||
        action === 'escalate' ||
        action === 'use_lower_bound' ||
        action === 'use_upper_bound'
      ) {
        icon = SkipForward;
      } else if (action === 'not_duplicate' || action === 'flag_policy') {
        icon = X;
      }

      const IconComponent = icon;

      return (
        <button
          key={action}
          onClick={() => handleOpenConfirmation(item, action)}
          className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
            isPrimary
              ? 'bg-accent text-accent-ink hover:bg-opacity-90'
              : 'border border-rule bg-surface-raised text-ink hover:bg-canvas'
          }`}
        >
          {IconComponent && <IconComponent width={16} height={16} />}
          {actionLabels[action]}
        </button>
      );
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold">Review Queue</h1>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-3 gap-6">
        <div className="rounded-md border border-rule bg-surface p-6 text-center">
          <div className="mb-2 text-xs font-semibold uppercase text-ink-muted">
            Items in queue
          </div>
          <div className="text-3xl font-bold text-ink">{items.length}</div>
        </div>
        <div className="rounded-md border border-rule bg-surface p-6 text-center">
          <div className="mb-2 text-xs font-semibold uppercase text-ink-muted">
            Policy issues
          </div>
          <div className="text-3xl font-bold text-ink">{policyIssueCount}</div>
        </div>
        <div className="rounded-md border border-rule bg-surface p-6 text-center">
          <div className="mb-2 text-xs font-semibold uppercase text-ink-muted">
            Extraction errors
          </div>
          <div className="text-3xl font-bold text-ink">{extractionErrorCount}</div>
        </div>
      </div>

      {/* Queue items */}
      <div className="space-y-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-rule bg-surface p-12 text-center">
            <CheckCircle
              width={40}
              height={40}
              className="mb-4 text-success"
            />
            <div className="text-sm text-ink-faint">
              No items in review queue. All caught up!
            </div>
          </div>
        ) : (
          items.map((item) => {
            const config = issueTypeConfig[item.type];
            const IconComponent = config.icon;

            return (
              <div
                key={item.id}
                className="rounded-md border border-rule bg-surface p-6"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`mb-2 inline-flex items-center gap-1 rounded-sm px-3 py-1 text-xs font-semibold uppercase ${config.bgColor} ${config.textColor}`}>
                      <IconComponent width={12} height={12} />
                      {config.label}
                    </div>
                    <div className="mb-2 font-display text-lg font-semibold text-ink">
                      {item.title}
                    </div>
                    <div className="text-xs text-ink-muted">
                      Source: {item.source} · ID: {item.sourceId} · Run:{' '}
                      {item.runId} · Discovered {item.discoveredTime}
                    </div>
                  </div>
                </div>

                {/* Item content */}
                <div className="mb-4 max-h-32 overflow-y-auto rounded-sm border border-rule bg-canvas p-4 text-sm text-ink-muted">
                  {item.description}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  {getActionButtons(item)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-md border border-rule bg-surface p-6 shadow-lg">
            <h2 className="mb-4 font-display text-lg font-bold">
              Resolve Review Item
            </h2>

            <p className="mb-2 text-sm text-ink-muted">
              <span className="block font-semibold text-ink">
                {confirmState.itemTitle}
              </span>
              <span className="text-xs">
                Source: {confirmState.source} · Run: {confirmState.runId}
              </span>
            </p>

            <p className="mb-6 text-sm text-ink-muted">
              Action:{' '}
              <span className="font-mono font-semibold text-ink">
                {actionLabels[confirmState.action]}
              </span>
            </p>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-ink">
                Reason for this disposition
              </label>
              <textarea
                value={confirmState.reason}
                onChange={(e) =>
                  setConfirmState((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                placeholder="Explain why you are resolving this item with this action..."
                className="w-full rounded-md border border-rule bg-canvas px-3 py-2 text-sm text-ink placeholder-ink-faint focus:border-accent focus:outline-none"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseConfirmation}
                className="flex-1 rounded-md border border-rule bg-surface-raised px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitConfirmation}
                disabled={!confirmState.reason.trim()}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium text-accent-ink transition-colors ${
                  confirmState.reason.trim()
                    ? 'bg-accent hover:bg-opacity-90'
                    : 'cursor-not-allowed bg-accent bg-opacity-50'
                }`}
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
