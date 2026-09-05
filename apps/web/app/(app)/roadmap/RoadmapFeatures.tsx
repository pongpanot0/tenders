'use client';

import { useState } from 'react';
import {
  Link2,
  Plus,
  Settings,
  Copy,
  Trash2,
  BarChart3,
  Download,
} from 'lucide-react';

type RoadmapTab =
  | 'crm'
  | 'collaboration'
  | 'sso'
  | 'api'
  | 'comparison'
  | 'learning';

const TABS: { id: RoadmapTab; label: string }[] = [
  { id: 'crm', label: 'CRM Integration' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'sso', label: 'SSO/SCIM' },
  { id: 'api', label: 'API & Reporting' },
  { id: 'comparison', label: 'Profile Comparison' },
  { id: 'learning', label: 'Learning Controls' },
];

const comments = [
  {
    author: 'Sarah Chen',
    time: '15 min ago',
    text: (
      <>
        We should clarify the technical requirements with the client.{' '}
        <span className="font-medium text-accent">@James Park</span> — can
        you review the AWS specs?
      </>
    ),
  },
  {
    author: 'James Park',
    time: '8 min ago',
    text: (
      <>
        <span className="font-medium text-accent">@Sarah Chen</span> — looks
        good. We have all the capabilities they&apos;re asking for. Timeline
        is tight but doable in 3 months.
      </>
    ),
  },
  {
    author: 'Alex Rodriguez',
    time: '2 min ago',
    text: (
      <>
        <span className="font-medium text-accent">@James</span> noted. Budget
        alignment is within range. Let&apos;s move forward to proposal stage.
      </>
    ),
  },
];

const comparisonRows = [
  { attribute: 'Active', a: 'Yes', b: 'No (test)', diff: '—' },
  {
    attribute: 'Services',
    a: 'React, Node.js, AWS',
    b: 'React, Vue, AWS, GCP',
    diff: '+Vue +GCP',
  },
  {
    attribute: 'Target markets',
    a: 'Singapore, Thailand',
    b: 'Singapore, Thailand, Malaysia',
    diff: '+Malaysia',
  },
  {
    attribute: 'Budget range',
    a: '$50k–$250k',
    b: '$30k–$300k',
    diff: 'Widened',
  },
  {
    attribute: 'Recent matches',
    a: '14 (avg score 78)',
    b: '22 (avg score 71)',
    diff: '+8 (lower avg)',
  },
];

const feedbackRows = [
  {
    tender: 'Cloud platform overhaul',
    relevant: true,
    score: 84,
    date: '2 days ago',
  },
  {
    tender: 'Data warehouse services',
    relevant: true,
    score: 76,
    date: '5 days ago',
  },
  {
    tender: 'IoT device firmware',
    relevant: false,
    score: 67,
    date: '8 days ago',
  },
];

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 rounded-md border border-rule bg-surface p-6">
      <h3 className="mb-3 font-display text-lg font-semibold text-ink">
        {title}
      </h3>
      <p className="mb-4 text-[13px] leading-relaxed text-ink-muted">
        {description}
      </p>
      {children}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  text,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-rule bg-canvas p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-ink-faint">
        {icon}
      </div>
      <div className="mb-2 text-sm font-semibold text-ink-muted">{title}</div>
      <div className="text-[13px] text-ink-faint">{text}</div>
      <div className="mt-6">
        <button className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-3 text-[13px] font-medium text-accent-ink hover:bg-accent/90">
          <Plus className="h-4 w-4" strokeWidth={2} />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

export function RoadmapFeatures() {
  const [activeTab, setActiveTab] = useState<RoadmapTab>('crm');

  return (
    <div>
      <div className="mb-8 flex gap-4 overflow-x-auto border-b border-rule" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap border-b-2 py-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'crm' && (
        <div role="tabpanel">
          <Card
            title="Connect your CRM"
            description="Link Tender Intelligence with your CRM system to automatically create deals and sync opportunity status."
          >
            <EmptyState
              icon={<Link2 strokeWidth={1.5} className="h-12 w-12" />}
              title="No CRM connection"
              text="Click below to connect Salesforce, HubSpot, or Pipedrive"
              actionLabel="Connect CRM"
            />
          </Card>
        </div>
      )}

      {activeTab === 'collaboration' && (
        <div role="tabpanel">
          <Card
            title="Team Discussion"
            description="Example: Comments on a pipeline opportunity with mentions"
          >
            <div className="rounded-md border border-rule bg-canvas p-4">
              {comments.map((comment, i) => (
                <div
                  key={i}
                  className={`mb-4 pb-4 ${
                    i < comments.length - 1 ? 'border-b border-rule' : 'mb-0 pb-0'
                  }`}
                >
                  <div className="font-semibold text-ink">{comment.author}</div>
                  <div className="text-[11px] text-ink-faint">{comment.time}</div>
                  <div className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                    {comment.text}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'sso' && (
        <div role="tabpanel">
          <Card
            title="Enterprise SSO & SCIM"
            description="Configure single sign-on and user provisioning for your organization"
          >
            <div className="mb-6">
              <div className="mb-2 font-semibold text-ink">SSO Provider</div>
              <div className="flex flex-wrap gap-2">
                {['Azure AD', 'Okta', 'Google Workspace', 'Configure custom'].map(
                  (label) => (
                    <button
                      key={label}
                      className="rounded-md bg-surface-raised px-4 py-3 text-[13px] font-medium text-ink hover:bg-canvas"
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="mb-6">
              <div className="mb-2 font-semibold text-ink">SCIM 2.0</div>
              <div className="rounded-sm border border-rule bg-canvas p-4 font-mono text-xs text-ink-muted">
                <strong className="text-ink">SCIM Endpoint:</strong>{' '}
                https://api.tender-intelligence.com/scim/v2
                <br />
                <strong className="text-ink">Status:</strong> Not configured
              </div>
            </div>
            <button className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-3 text-[13px] font-medium text-accent-ink hover:bg-accent/90">
              <Settings className="h-4 w-4" strokeWidth={2} />
              Configure SSO
            </button>
          </Card>
        </div>
      )}

      {activeTab === 'api' && (
        <div role="tabpanel">
          <Card
            title="API Keys"
            description="Generate keys for programmatic access to tender data and custom integrations"
          >
            <div className="mb-6">
              <div className="mb-3 font-semibold text-ink">Active Keys</div>
              <div className="mb-3 flex items-center gap-4 rounded-sm border border-rule bg-canvas p-4 font-mono text-xs">
                <div className="flex-1 break-all text-ink-faint">
                  tg_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
                </div>
                <div className="flex gap-2">
                  <button
                    title="Copy"
                    className="flex h-8 w-8 items-center justify-center rounded-sm border border-rule bg-surface hover:border-accent hover:bg-surface-raised"
                  >
                    <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                  <button
                    title="Revoke"
                    className="flex h-8 w-8 items-center justify-center rounded-sm border border-rule bg-surface hover:border-accent hover:bg-surface-raised"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
            <button className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-3 text-[13px] font-medium text-accent-ink hover:bg-accent/90">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Generate New Key
            </button>
          </Card>

          <Card
            title="Custom Reporting"
            description="Build custom dashboards and export tender data with flexible schema"
          >
            <EmptyState
              icon={<BarChart3 strokeWidth={1.5} className="h-12 w-12" />}
              title="No reports yet"
              text="Create a custom report to track opportunities by category, stage, or timeline"
              actionLabel="Create Report"
            />
          </Card>
        </div>
      )}

      {activeTab === 'comparison' && (
        <div role="tabpanel">
          <Card
            title="Organization Profiles Comparison"
            description="Compare matching performance across multiple company profiles"
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    {['Attribute', 'Profile A (Current)', 'Profile B (Updated)', 'Difference'].map(
                      (h) => (
                        <th
                          key={h}
                          className="border-b border-rule bg-canvas p-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.attribute}>
                      <td className="border-b border-rule p-3">
                        <strong className="text-ink">{row.attribute}</strong>
                      </td>
                      <td className="border-b border-rule p-3 text-ink-muted">
                        {row.a}
                      </td>
                      <td className="border-b border-rule p-3 text-ink-muted">
                        {row.b}
                      </td>
                      <td className="border-b border-rule p-3 text-ink-muted">
                        {row.diff}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'learning' && (
        <div role="tabpanel">
          <Card
            title="Feedback & Learning"
            description="Tell us which tenders were relevant or not relevant to improve recommendations"
          >
            <div className="mb-6">
              <div className="mb-3 font-semibold text-ink">
                Recent Feedback ({feedbackRows.length} shown)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr>
                      {['Tender', 'Feedback', 'Score (at time)', 'Date'].map((h) => (
                        <th
                          key={h}
                          className="border-b border-rule bg-canvas p-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {feedbackRows.map((row) => (
                      <tr key={row.tender}>
                        <td className="border-b border-rule p-3">
                          <strong className="text-ink">{row.tender}</strong>
                        </td>
                        <td
                          className={`border-b border-rule p-3 font-semibold ${
                            row.relevant ? 'text-success' : 'text-ink-faint'
                          }`}
                        >
                          {row.relevant ? 'Relevant ✓' : 'Not relevant ✗'}
                        </td>
                        <td className="border-b border-rule p-3 text-ink-muted">
                          {row.score}
                        </td>
                        <td className="border-b border-rule p-3 text-ink-muted">
                          {row.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mb-6">
              <label className="flex cursor-pointer items-center gap-2 font-medium">
                <input type="checkbox" defaultChecked className="h-4 w-4" />
                Use my feedback to personalize recommendations
              </label>
            </div>
            <button className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-3 text-[13px] font-medium text-accent-ink hover:bg-accent/90">
              <Download className="h-4 w-4" strokeWidth={2} />
              Download feedback history
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
