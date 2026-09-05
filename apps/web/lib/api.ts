export type MatchBand =
  | 'strong'
  | 'worth-reviewing'
  | 'low-priority'
  | 'not-recommended'
  | 'analysis-limited';

export type TenderStatus = 'open' | 'deadline-soon' | 'expired' | 'cancelled' | 'updated';

/**
 * UI-facing tender shape. The real API (GET /v1/tenders) only returns
 * identity/notice fields today — scoring, fit tags, risk flags and
 * budget aren't computed yet (no company profile / matching pipeline
 * exists). Those fields are always present here but degrade to
 * null/empty/'analysis-limited' for API-sourced data so the UI can
 * render one consistent shape for both mock and live data.
 */
export interface Tender {
  id: string;
  title: string;
  buyerName: string;
  country: string;
  deadline: string;
  estimatedValue: number | null;
  currency: string | null;
  score: number | null;
  matchBand: MatchBand;
  status: TenderStatus;
  fitTags: string[];
  hasRisk: boolean;
  source: string;
}

interface ApiTenderListItem {
  id: string;
  title: string;
  buyerName: string;
  countryCode: string | null;
  publishedAt: string;
  deadlineAt: string | null;
}

interface ApiTenderListResponse {
  data: ApiTenderListItem[];
  page: { nextCursor: string | null; hasMore: boolean };
  meta: { requestId: string };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function deriveStatus(deadlineIso: string | null): TenderStatus {
  if (!deadlineIso) return 'open';
  const deadline = new Date(deadlineIso);
  const now = new Date();
  if (deadline.getTime() < now.getTime()) return 'expired';
  const daysLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysLeft <= 7 ? 'deadline-soon' : 'open';
}

function toTender(item: ApiTenderListItem): Tender {
  return {
    id: item.id,
    title: item.title || 'Untitled notice',
    buyerName: item.buyerName || 'Not stated',
    country: item.countryCode ?? 'Not stated',
    deadline: item.deadlineAt ?? item.publishedAt,
    estimatedValue: null,
    currency: null,
    score: null,
    matchBand: 'analysis-limited',
    status: deriveStatus(item.deadlineAt),
    fitTags: [],
    hasRisk: false,
    source: 'Live source',
  };
}

export class ApiError extends Error {}

/**
 * Fetches the first page of tenders from the real API. Pagination
 * (page.nextCursor) isn't wired up yet — this is enough to prove the
 * live wiring end-to-end; loading more pages is a follow-up.
 */
export async function fetchTenders(limit = 100): Promise<Tender[]> {
  const response = await fetch(`${API_BASE_URL}/v1/tenders?limit=${limit}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new ApiError(`Could not load tenders (status ${response.status})`);
  }

  const body: ApiTenderListResponse = await response.json();
  return body.data.map(toTender);
}
