'use client';

import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface SourceRow {
  id: string;
  source: string;
  region: string;
  coverageState: 'active' | 'delayed' | 'checking';
  lastChecked: string;
  notes: string;
}

export function SourceCoverageSection() {
  const sources: SourceRow[] = [
    {
      id: '1',
      source: 'EU TED',
      region: 'EU',
      coverageState: 'active',
      lastChecked: '12 min ago',
      notes: 'Notices and permitted documents',
    },
    {
      id: '2',
      source: 'UK Find a Tender',
      region: 'UK',
      coverageState: 'active',
      lastChecked: '8 min ago',
      notes: 'Contract opportunities',
    },
    {
      id: '3',
      source: 'Singapore Government Procurement',
      region: 'Asia-Pacific',
      coverageState: 'active',
      lastChecked: '18 min ago',
      notes: 'GeBIZ platform notices',
    },
    {
      id: '4',
      source: 'Australian AusTender',
      region: 'Asia-Pacific',
      coverageState: 'delayed',
      lastChecked: '42 min ago',
      notes: 'Commonwealth and state procurement',
    },
    {
      id: '5',
      source: 'USA Federal Procurement',
      region: 'North America',
      coverageState: 'active',
      lastChecked: '5 min ago',
      notes: 'SAM.gov notices',
    },
  ];

  const getCoverageIcon = (state: string) => {
    switch (state) {
      case 'active':
        return <CheckCircle size={16} className="text-success" />;
      case 'delayed':
        return <AlertCircle size={16} className="text-warning" />;
      case 'checking':
        return <Clock size={16} className="text-info" />;
      default:
        return null;
    }
  };

  const getCoverageLabel = (state: string) => {
    switch (state) {
      case 'active':
        return 'Active';
      case 'delayed':
        return 'Temporarily delayed';
      case 'checking':
        return 'Checking...';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-info/5 border border-info/20 rounded-md p-4 flex gap-3">
        <div className="text-xs text-info font-medium leading-relaxed">
          Source coverage shows which tender databases we monitor for your
          profile. All sources are regularly checked for new opportunities.
        </div>
      </div>

      <div className="bg-surface border border-rule rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas border-b border-rule">
            <tr>
              <th className="text-left p-4 font-semibold text-ink">Source</th>
              <th className="text-left p-4 font-semibold text-ink">Region</th>
              <th className="text-left p-4 font-semibold text-ink">
                Coverage state
              </th>
              <th className="text-left p-4 font-semibold text-ink">
                Last checked
              </th>
              <th className="text-left p-4 font-semibold text-ink">Notes</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr
                key={source.id}
                className="border-b border-rule hover:bg-surface-raised last:border-b-0"
              >
                <td className="p-4 font-semibold text-ink">{source.source}</td>
                <td className="p-4 text-ink-muted">{source.region}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getCoverageIcon(source.coverageState)}
                    <span className="text-ink">
                      {getCoverageLabel(source.coverageState)}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-ink-muted">{source.lastChecked}</td>
                <td className="p-4 text-ink">{source.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-surface border border-rule rounded-md p-6">
        <h3 className="font-display text-base font-bold text-ink mb-4">
          Need help?
        </h3>
        <p className="text-sm text-ink-muted mb-4">
          If a source is delayed or you need more information about coverage,
          please contact our support team.
        </p>
        <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm font-medium text-ink hover:bg-canvas transition-all">
          Contact support
        </button>
      </div>
    </div>
  );
}
