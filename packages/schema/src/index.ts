export interface TenderExternalReference {
  type: string;
  value: string;
}

export interface CanonicalTender {
  id: string;
  source: { id: string; name: string; countryCode: string };
  externalReferences: TenderExternalReference[];
  title: string;
  summary?: string | null;
  status: "open" | "closed" | "expired" | "cancelled";
  noticeType?: string | null;
  publishedAt: string;
  deadlineAt?: string | null;
  buyer: { name: string; countryCode: string; region?: string | null };
  value?: { min?: number | null; max?: number | null; currency?: string | null; kind?: string | null } | null;
  cpvCodes: string[];
  sourceUrl: string;
  provenance: { version: number; contentHash: string; lastSourceSeenAt: string };
}

export { default as tenderSchema } from "../tender.schema.json";
