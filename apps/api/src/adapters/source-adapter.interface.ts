export interface DiscoveredRecord {
  externalId: string;
  sourceUrl: string;
  publishedAt?: string;
  updatedAt?: string;
  cursor?: string;
  lightweightPayload?: unknown;
}

export interface SourceHealth {
  ok: boolean;
  checkedAt: string;
  detail?: string;
}

export interface SourceAdapter {
  sourceId: string;
  discover(): AsyncIterable<DiscoveredRecord>;
  healthCheck(): Promise<SourceHealth>;
}
