import type { DiscoveredRecord, SourceAdapter, SourceHealth } from "./source-adapter.interface";

export const UK_FIND_A_TENDER_BASE_URL =
  "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages";

interface OcdsReleasePackage {
  releases: Array<{
    tender?: { id?: string };
    date?: string;
  }>;
  links?: { next?: string };
}

export class UkFindATenderAdapter implements SourceAdapter {
  sourceId = "uk_find_a_tender";

  constructor(private readonly baseUrl: string = UK_FIND_A_TENDER_BASE_URL) {}

  async *discover(): AsyncIterable<DiscoveredRecord> {
    let url: string | undefined = this.baseUrl;

    while (url) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`UK Find a Tender fetch failed: ${response.status}`);
      }
      const payload = (await response.json()) as OcdsReleasePackage;

      for (const release of payload.releases) {
        const externalId = release.tender?.id;
        if (!externalId) continue;

        yield {
          externalId,
          sourceUrl: `https://www.find-tender.service.gov.uk/notice/${externalId}`,
          publishedAt: release.date,
          lightweightPayload: release,
        };
      }

      url = payload.links?.next;
    }
  }

  async healthCheck(): Promise<SourceHealth> {
    const response = await fetch(this.baseUrl, { method: "HEAD" }).catch(() => null);
    return {
      ok: response?.ok ?? false,
      checkedAt: new Date().toISOString(),
    };
  }
}
