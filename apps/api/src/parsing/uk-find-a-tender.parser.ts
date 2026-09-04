export interface ParsedTenderFields {
  sourceExternalId: string;
  title: string;
  description: string | null;
  buyerName: string;
  countryName: string | null;
  publishedAtRaw: string;
  deadlineAtRaw: string | null;
  budgetAmount: number | null;
  currencyRaw: string | null;
  cpvCodes: string[];
}

interface OcdsRelease {
  date?: string;
  tender?: {
    id?: string;
    title?: string;
    description?: string;
    value?: { amount?: number; currency?: string };
    tenderPeriod?: { endDate?: string };
    items?: Array<{ classification?: { scheme?: string; id?: string } }>;
  };
  buyer?: { name?: string };
  parties?: Array<{ roles?: string[]; address?: { countryName?: string } }>;
}

export function parseUkFindATenderRelease(release: unknown): ParsedTenderFields {
  const r = release as OcdsRelease;
  const tender = r.tender ?? {};
  const buyerParty = (r.parties ?? []).find((p) => p.roles?.includes("buyer"));

  const cpvCodes = (tender.items ?? [])
    .filter((item) => item.classification?.scheme === "CPV" && item.classification.id)
    .map((item) => item.classification!.id as string);

  if (!tender.id) {
    throw new Error("Cannot parse release: missing required field 'tender.id'");
  }
  if (!r.date) {
    throw new Error("Cannot parse release: missing required field 'date'");
  }
  if (!tender.title) {
    throw new Error("Cannot parse release: missing required field 'tender.title'");
  }

  return {
    sourceExternalId: tender.id,
    title: tender.title,
    description: tender.description ?? null,
    buyerName: r.buyer?.name ?? "",
    countryName: buyerParty?.address?.countryName ?? null,
    publishedAtRaw: r.date,
    deadlineAtRaw: tender.tenderPeriod?.endDate ?? null,
    budgetAmount: tender.value?.amount ?? null,
    currencyRaw: tender.value?.currency ?? null,
    cpvCodes,
  };
}
