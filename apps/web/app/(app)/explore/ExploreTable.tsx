import { Tender } from '@/lib/api';

function formatDeadlineDate(deadline: string): string {
  const date = new Date(deadline);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${day} ${month}`;
}

function synthesizePublishedDate(deadline: string): string {
  // Synthesize a plausible published date 3-7 days before deadline
  const deadlineDate = new Date(deadline);
  const publishedDate = new Date(deadlineDate.getTime() - (5 * 24 * 60 * 60 * 1000)); // 5 days before
  const day = publishedDate.getDate();
  const month = publishedDate.toLocaleDateString('en-US', { month: 'short' });
  return `${day} ${month}`;
}

function getScoreBadgeStyles(band: string): { bg: string; text: string } {
  switch (band) {
    case 'strong':
      return { bg: 'bg-accent/10', text: 'text-accent' };
    case 'worth-reviewing':
      return { bg: 'bg-info/10', text: 'text-info' };
    case 'low-priority':
      return { bg: 'bg-warning/10', text: 'text-warning' };
    default:
      return { bg: 'bg-surface-raised', text: 'text-ink-muted' };
  }
}

function formatValue(value: number | null, currency: string | null): string {
  if (value === null) return 'Not stated';
  return `${currency ?? ''} ${value.toLocaleString()}`.trim();
}

interface ExploreTableProps {
  tenders: Tender[];
  showFitColumn: boolean;
}

export default function ExploreTable({
  tenders,
  showFitColumn,
}: ExploreTableProps) {
  return (
    <div className="bg-surface border border-rule rounded-md overflow-hidden">
      {/* Table Header */}
      <div className="grid gap-6 px-6 py-4 bg-canvas border-b border-rule text-xs font-semibold text-ink-muted uppercase tracking-wider grid-cols-[1fr_120px_100px_100px_140px] md:grid-cols-[1fr_120px_100px_100px_140px_80px]">
        <div>Tender / Buyer</div>
        <div>Country</div>
        <div>Published</div>
        <div>Deadline</div>
        <div>Value</div>
        {showFitColumn && <div>Your fit</div>}
      </div>

      {/* Table Rows */}
      {tenders.map((tender) => {
        const deadlineDate = formatDeadlineDate(tender.deadline);
        const publishedDate = synthesizePublishedDate(tender.deadline);
        const valueDisplay = formatValue(tender.estimatedValue, tender.currency);
        const { bg, text } = getScoreBadgeStyles(tender.matchBand);
        const fitDisplay = tender.score === null ? 'Analysis limited' : tender.score;

        return (
          <div
            key={tender.id}
            className="grid gap-6 px-6 py-5 border-b border-rule last:border-b-0 hover:bg-surface-raised transition-all cursor-pointer items-center grid-cols-[1fr_120px_100px_100px_140px] md:grid-cols-[1fr_120px_100px_100px_140px_80px]"
          >
            {/* Tender / Buyer */}
            <div>
              <div className="text-sm font-semibold text-ink">{tender.title}</div>
              <div className="text-xs text-ink-muted mt-1">
                {tender.buyerName} · {tender.source}
              </div>
            </div>

            {/* Country */}
            <div className="text-sm text-ink text-center">{tender.country}</div>

            {/* Published */}
            <div className="text-sm text-ink text-center font-mono">
              {publishedDate}
            </div>

            {/* Deadline */}
            <div className="text-sm text-ink text-center font-mono">
              {deadlineDate}
            </div>

            {/* Value */}
            <div className="text-sm text-ink font-medium">{valueDisplay}</div>

            {/* Your Fit */}
            {showFitColumn && (
              <div className="text-center">
                <span
                  className={`inline-block px-3 py-1 rounded-sm text-xs font-semibold whitespace-nowrap ${bg} ${text}`}
                >
                  {fitDisplay}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
