'use client';

import { useState } from 'react';
import {
  Heart,
  ExternalLink,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { MockTender } from '@/lib/mock-data';

interface TenderDetailProps {
  tender: MockTender;
}

export function TenderDetail({ tender }: TenderDetailProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'requirements' | 'documents' | 'activity' | 'versions'
  >('overview');
  const [expandedVersionId, setExpandedVersionId] = useState<string>('v3');

  const statusDisplay = {
    open: 'Open',
    'deadline-soon': 'Deadline soon',
    expired: 'Expired',
    cancelled: 'Cancelled',
    updated: 'Updated',
  };

  const matchBandColor = {
    strong: 'text-accent',
    'worth-reviewing': 'text-warning',
    'low-priority': 'text-ink-muted',
    'not-recommended': 'text-danger',
  };

  const matchBandText = {
    strong: 'Strong match',
    'worth-reviewing': 'Worth reviewing',
    'low-priority': 'Low priority',
    'not-recommended': 'Not recommended',
  };

  // Format deadline to show days remaining
  const deadlineDate = new Date(tender.deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil(
    (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const deadlineText =
    daysUntil > 0
      ? `${deadlineDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })} (${daysUntil} ${daysUntil === 1 ? 'day' : 'days'})`
      : `${deadlineDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })} (expired)`;

  // Format value
  const valueDisplay =
    tender.estimatedValue !== null
      ? `${tender.currency} ${tender.estimatedValue.toLocaleString()}`
      : `${tender.currency} —`;

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* At a glance */}
            <div className="bg-surface border border-rule rounded-md p-6">
              <h3 className="font-display text-base font-bold text-ink mb-4">
                At a glance
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Source
                  </span>
                  <span className="text-sm font-medium text-ink">
                    {tender.source}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Notice Type
                  </span>
                  <span className="text-sm font-medium text-ink">
                    Open call for proposals
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Published
                  </span>
                  <span className="text-sm font-medium text-ink">
                    {new Date(tender.deadline)
                      .toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                      .replace(/,/, ',')}
                    , 2:14 AM
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Delivery location
                  </span>
                  <span className="text-sm font-medium text-ink">
                    {tender.country} (on-site)
                  </span>
                </div>
              </div>
            </div>

            {/* AI summary */}
            <div className="bg-surface border border-rule rounded-md p-6">
              <h3 className="font-display text-base font-bold text-ink mb-4">
                AI summary
              </h3>
              <p className="text-xs italic text-ink-muted mb-4">
                Based on available notice text
              </p>
              <p className="text-sm leading-relaxed text-ink">
                {tender.title} tender seeks a vendor to deliver services aligned
                with modern technology standards. The buyer is looking for
                expertise in {tender.fitTags.join(', ')} technologies and has
                allocated a budget of {valueDisplay}. Implementation should be
                completed within the specified timeline. The buyer values
                strong technical expertise and proven delivery track record in
                similar projects.
              </p>
            </div>

            {/* Why it fits */}
            <div className="bg-surface border border-rule rounded-md p-6">
              <h3 className="font-display text-base font-bold text-ink mb-4">
                Why it fits
              </h3>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm leading-relaxed text-ink">
                  <CheckCircle
                    size={16}
                    className="text-success flex-shrink-0 mt-0.5"
                  />
                  {tender.fitTags.length > 0
                    ? `${tender.fitTags.join(', ')} expertise matches tender's technology stack preference`
                    : 'Your expertise matches tender requirements'}
                </li>
                <li className="flex gap-3 text-sm leading-relaxed text-ink">
                  <CheckCircle
                    size={16}
                    className="text-success flex-shrink-0 mt-0.5"
                  />
                  Budget {valueDisplay} aligns with your typical project size
                </li>
                <li className="flex gap-3 text-sm leading-relaxed text-ink">
                  <CheckCircle
                    size={16}
                    className="text-success flex-shrink-0 mt-0.5"
                  />
                  Timeline aligns with your delivery capacity
                </li>
              </ul>
            </div>

            {/* Risks & questions */}
            <div className="bg-surface border border-rule rounded-md p-6">
              <h3 className="font-display text-base font-bold text-ink mb-4">
                Risks & questions
              </h3>
              <div className="space-y-4">
                <div className="bg-danger/5 border-l-3 border-danger rounded-sm p-4">
                  <div className="flex gap-2 items-start mb-2">
                    <AlertTriangle
                      size={16}
                      className="text-danger flex-shrink-0 mt-0.5"
                    />
                    <span className="font-semibold text-sm text-danger">
                      Potential blocker
                    </span>
                  </div>
                  <p className="text-sm text-ink leading-relaxed">
                    Legal registration requirement. Verify whether your
                    organization structure satisfies local registration
                    requirements before committing to scope.
                  </p>
                </div>

                <div className="bg-warning/5 border-l-3 border-warning rounded-sm p-4">
                  <div className="flex gap-2 items-start mb-2">
                    <AlertCircle
                      size={16}
                      className="text-warning flex-shrink-0 mt-0.5"
                    />
                    <span className="font-semibold text-sm text-warning">
                      Verify before bidding
                    </span>
                  </div>
                  <p className="text-sm text-ink leading-relaxed">
                    Integration scope. Current requirement mentions specific
                    system integrations. Confirm technical specifications and
                    scope before committing.
                  </p>
                </div>

                {tender.hasRisk && (
                  <div className="bg-info/5 border-l-3 border-info rounded-sm p-4">
                    <div className="flex gap-2 items-start mb-2">
                      <Info
                        size={16}
                        className="text-info flex-shrink-0 mt-0.5"
                      />
                      <span className="font-semibold text-sm text-info">
                        Missing information
                      </span>
                    </div>
                    <p className="text-sm text-ink leading-relaxed">
                      Some project details are not specified in available
                      documents. Could not verify certain requirements from
                      provided tender materials.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'requirements':
        return (
          <div className="bg-surface border border-rule rounded-md p-6">
            <div className="mb-4">
              <div className="flex gap-3 flex-wrap mb-4">
                {['All', 'Mandatory', 'Preferred', 'Eligibility'].map(
                  (filter) => (
                    <button
                      key={filter}
                      className={`px-3 py-2 text-xs font-medium rounded-sm transition-all ${
                        filter === 'All'
                          ? 'bg-accent text-white border border-accent'
                          : 'bg-canvas border border-rule text-ink-muted hover:text-ink'
                      }`}
                    >
                      {filter}
                    </button>
                  )
                )}
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-canvas border-b border-rule">
                <tr>
                  <th className="text-left p-4 font-semibold text-ink">
                    Requirement
                  </th>
                  <th className="text-left p-4 font-semibold text-ink">Type</th>
                  <th className="text-left p-4 font-semibold text-ink">
                    Your status
                  </th>
                  <th className="text-left p-4 font-semibold text-ink">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-rule hover:bg-canvas">
                  <td className="p-4 font-semibold text-ink">
                    {tender.fitTags[0] || 'Core'} expertise
                  </td>
                  <td className="p-4 text-ink">Mandatory</td>
                  <td className="p-4 flex items-center gap-1 text-success font-medium">
                    <CheckCircle size={14} /> Match
                  </td>
                  <td className="p-4 text-ink">High</td>
                </tr>
                <tr className="border-b border-rule hover:bg-canvas">
                  <td className="p-4 font-semibold text-ink">
                    Budget alignment
                  </td>
                  <td className="p-4 text-ink">Mandatory</td>
                  <td className="p-4 flex items-center gap-1 text-success font-medium">
                    <CheckCircle size={14} /> Match
                  </td>
                  <td className="p-4 text-ink">High</td>
                </tr>
                <tr className="border-b border-rule hover:bg-canvas">
                  <td className="p-4 font-semibold text-ink">
                    Project timeline
                  </td>
                  <td className="p-4 text-ink">Mandatory</td>
                  <td className="p-4 flex items-center gap-1 text-success font-medium">
                    <CheckCircle size={14} /> Match
                  </td>
                  <td className="p-4 text-ink">High</td>
                </tr>
                <tr className="border-b border-rule hover:bg-canvas">
                  <td className="p-4 font-semibold text-ink">
                    Local registration
                  </td>
                  <td className="p-4 text-ink">Eligibility</td>
                  <td className="p-4 flex items-center gap-1 text-warning font-medium">
                    <AlertTriangle size={14} /> Needs verification
                  </td>
                  <td className="p-4 text-ink">Medium</td>
                </tr>
                <tr className="hover:bg-canvas">
                  <td className="p-4 font-semibold text-ink">
                    Domain experience
                  </td>
                  <td className="p-4 text-ink">Preferred</td>
                  <td className="p-4 text-ink-muted font-medium">~ Unknown</td>
                  <td className="p-4 text-ink">Low</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'documents':
        return (
          <div className="bg-surface border border-rule rounded-md p-6">
            <h3 className="font-display text-base font-bold text-ink mb-4">
              Tender documents
            </h3>
            <table className="w-full text-sm">
              <thead className="bg-canvas border-b border-rule">
                <tr>
                  <th className="text-left p-4 font-semibold text-ink">
                    Document
                  </th>
                  <th className="text-left p-4 font-semibold text-ink">Size</th>
                  <th className="text-left p-4 font-semibold text-ink">
                    Status
                  </th>
                  <th className="text-left p-4 font-semibold text-ink">
                    Last checked
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-rule hover:bg-canvas">
                  <td className="p-4 font-semibold text-ink">RFP Main.pdf</td>
                  <td className="p-4 text-ink">2.3 MB</td>
                  <td className="p-4 flex items-center gap-1 text-success font-medium">
                    <CheckCircle size={14} /> Ready to review
                  </td>
                  <td className="p-4 text-ink-muted">2 min ago</td>
                </tr>
                <tr className="border-b border-rule hover:bg-canvas">
                  <td className="p-4 font-semibold text-ink">
                    Technical Requirements.pdf
                  </td>
                  <td className="p-4 text-ink">1.8 MB</td>
                  <td className="p-4 flex items-center gap-1 text-warning font-medium">
                    <Loader size={14} /> Text extraction in progress
                  </td>
                  <td className="p-4 text-ink-muted">1 min ago</td>
                </tr>
                <tr className="hover:bg-canvas">
                  <td className="p-4 font-semibold text-ink">
                    Evaluation Criteria.pdf
                  </td>
                  <td className="p-4 text-ink">956 KB</td>
                  <td className="p-4 flex items-center gap-1 text-success font-medium">
                    <CheckCircle size={14} /> Ready to review
                  </td>
                  <td className="p-4 text-ink-muted">3 min ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'activity':
        return (
          <div className="bg-surface border border-rule rounded-md p-6">
            <div className="space-y-4 text-sm">
              <div className="pb-4 border-b border-rule flex justify-between">
                <div>
                  <strong>
                    {new Date(tender.deadline)
                      .toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                      .replace(',', '')}{' '}
                    2:14 AM
                  </strong>{' '}
                  — Tender discovered and added to matching queue
                </div>
                <span className="text-ink-faint whitespace-nowrap ml-4">
                  System
                </span>
              </div>
              <div className="pb-4 border-b border-rule flex justify-between">
                <div>
                  <strong>
                    {new Date(tender.deadline)
                      .toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                      .replace(',', '')}{' '}
                    2:16 AM
                  </strong>{' '}
                  — Documents extracted (3 files)
                </div>
                <span className="text-ink-faint whitespace-nowrap ml-4">
                  System
                </span>
              </div>
              <div className="pb-4 border-b border-rule flex justify-between">
                <div>
                  <strong>
                    {new Date(tender.deadline)
                      .toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                      .replace(',', '')}{' '}
                    2:18 AM
                  </strong>{' '}
                  — Match analysis completed (score: {tender.score})
                </div>
                <span className="text-ink-faint whitespace-nowrap ml-4">
                  System
                </span>
              </div>
              <div className="flex justify-between">
                <div>
                  <strong>
                    {new Date(tender.deadline)
                      .toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                      .replace(',', '')}{' '}
                    2:19 AM
                  </strong>{' '}
                  — Tender added to your inbox
                </div>
                <span className="text-ink-faint whitespace-nowrap ml-4">
                  System
                </span>
              </div>
            </div>
          </div>
        );

      case 'versions':
        const versions = [
          {
            id: 'v3',
            number: 3,
            label: 'Version 3 (Latest)',
            timestamp: '04 Sep 2026 · 14:32 UTC',
            status: 'Active',
            statusColor: 'success',
            diffs: [
              {
                type: 'removal',
                text: 'Deadline: 18 September 2026',
              },
              {
                type: 'addition',
                text: 'Deadline: 25 September 2026',
              },
            ],
            summary: 'Deadline moved from 18 Sep to 25 Sep (7-day extension).',
          },
          {
            id: 'v2',
            number: 2,
            label: 'Version 2',
            timestamp: '02 Sep 2026 · 11:45 UTC',
            status: 'Archived',
            statusColor: 'ink-muted',
            diffs: [
              {
                type: 'removal',
                text: 'Budget: SGD 150,000 – SGD 200,000',
              },
              {
                type: 'addition',
                text: 'Budget: SGD 150,000 – SGD 250,000',
              },
            ],
            summary: 'Budget range updated to accommodate additional scope.',
          },
          {
            id: 'v1',
            number: 1,
            label: 'Version 1',
            timestamp: '01 Sep 2026 · 09:15 UTC',
            status: 'Archived',
            statusColor: 'ink-muted',
            diffs: [],
            summary: 'Original tender notice published.',
          },
        ];

        return (
          <div className="bg-surface border border-rule rounded-md overflow-hidden">
            {versions.map((version) => (
              <div
                key={version.id}
                className="border-b border-rule last:border-b-0 hover:bg-surface-raised transition-colors"
              >
                <button
                  onClick={() =>
                    setExpandedVersionId(
                      expandedVersionId === version.id ? '' : version.id
                    )
                  }
                  className="w-full p-6 text-left hover:bg-surface-raised transition-colors"
                  data-testid={`version-${version.id}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-ink mb-1">
                        {version.label}
                      </div>
                      <div className="font-mono text-xs text-ink-muted">
                        {version.timestamp}
                      </div>
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-sm text-xs font-medium ${
                        version.statusColor === 'success'
                          ? 'bg-success/10 text-success'
                          : 'bg-ink-muted/10 text-ink-muted'
                      }`}
                    >
                      {version.statusColor === 'success' ? (
                        <CheckCircle size={14} />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-current" />
                      )}
                      {version.status}
                    </div>
                  </div>
                </button>

                {expandedVersionId === version.id && (
                  <div className="px-6 pb-6">
                    <div className="bg-canvas rounded-sm p-4">
                      {version.diffs.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {version.diffs.map((diff, idx) => (
                            <div
                              key={idx}
                              className={`flex gap-2 ${
                                diff.type === 'addition'
                                  ? 'text-success'
                                  : 'text-danger'
                              }`}
                            >
                              {diff.type === 'addition' ? (
                                <PlusCircle size={16} className="flex-shrink-0" />
                              ) : (
                                <MinusCircle size={16} className="flex-shrink-0" />
                              )}
                              <span
                                className={
                                  diff.type === 'removal'
                                    ? 'line-through text-ink-muted'
                                    : ''
                                }
                              >
                                {diff.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-sm font-medium text-ink">
                        {version.summary}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-5">
        <div className="text-xs text-ink-muted">
          {statusDisplay[tender.status]} · Posted by {tender.source} · Updated
          3 days ago
        </div>
        <h1 className="font-display text-3xl font-bold text-ink leading-tight">
          {tender.title}
        </h1>
        <div className="grid grid-cols-4 gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Buyer
            </span>
            <span className="text-sm font-semibold text-ink">
              {tender.buyerName}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Country
            </span>
            <span className="text-sm font-semibold text-ink">
              {tender.country}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Estimated value
            </span>
            <span className="text-sm font-semibold text-ink">
              {valueDisplay}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Deadline
            </span>
            <span className="text-sm font-semibold text-ink">
              {deadlineText}
            </span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex gap-4 flex-wrap p-5 bg-surface border border-rule rounded-md">
        <button className="px-4 py-2.5 bg-accent text-white border border-accent rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
          Mark pursuing
        </button>
        <button className="px-4 py-2.5 bg-surface-raised border border-rule rounded-md text-sm font-medium text-ink hover:bg-canvas transition-colors flex items-center gap-2">
          <Heart size={16} /> Save
        </button>
        <button className="px-4 py-2.5 bg-surface-raised border border-rule rounded-md text-sm font-medium text-ink hover:bg-canvas transition-colors">
          Dismiss
        </button>
        <button className="px-4 py-2.5 bg-surface-raised border border-rule rounded-md text-sm font-medium text-ink hover:bg-canvas transition-colors">
          <MoreVertical size={16} />
        </button>
        <button className="px-4 py-2.5 bg-surface-raised border border-rule rounded-md text-sm font-medium text-ink hover:bg-canvas transition-colors flex items-center gap-2 ml-auto">
          Open source <ExternalLink size={16} />
        </button>
      </div>

      {/* Decision strip */}
      <div className="bg-surface-raised border border-rule rounded-md p-6 space-y-4">
        <div className="flex gap-4 items-start">
          <div className="flex items-center justify-center w-17 h-17 bg-white border-2 border-accent rounded-md">
            <span className="font-mono text-3xl font-bold text-accent">
              {tender.score}
            </span>
          </div>
          <div className="flex-1">
            <div className={`text-sm font-semibold ${matchBandColor[tender.matchBand]}`}>
              {matchBandText[tender.matchBand]}
            </div>
            <div className="text-sm font-medium text-warning">
              Deadline in {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
            </div>
            <div className="text-xs text-ink-muted">
              Analysis confidence: High
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex gap-3 text-sm text-ink">
            <CheckCircle
              size={16}
              className="text-success flex-shrink-0 mt-0.5"
            />
            {tender.fitTags.length > 0
              ? `${tender.fitTags.join(', ')} expertise matches tender requirements`
              : 'Skills match tender requirements'}
          </div>
          <div className="flex gap-3 text-sm text-ink">
            <CheckCircle
              size={16}
              className="text-success flex-shrink-0 mt-0.5"
            />
            Budget {valueDisplay} within target range
          </div>
        </div>

        {tender.hasRisk && (
          <div className="bg-danger/8 border-l-3 border-danger rounded-sm p-4 flex gap-2">
            <AlertTriangle
              size={16}
              className="text-danger flex-shrink-0 mt-0.5"
            />
            <span className="text-sm font-medium text-danger">
              Needs verification: Some requirements need clarification before
              bidding
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-rule bg-surface">
        <div className="flex gap-6 px-6">
          {(
            [
              'overview',
              'requirements',
              'documents',
              'activity',
              'versions',
            ] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-b-accent text-accent'
                  : 'border-b-transparent text-ink-muted hover:text-ink'
              }`}
              data-testid={`tab-${tab}`}
            >
              {tab.charAt(0).toUpperCase() +
                tab.slice(1).replace(/([A-Z])/g, ' $1')}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {renderTabContent()}
    </div>
  );
}
