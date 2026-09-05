const COUNTRY_NAME_TO_ISO2: Record<string, string> = {
  "united kingdom": "GB",
  ireland: "IE",
  france: "FR",
  germany: "DE",
};

export function toIso2(countryName: string | null): string | null {
  if (!countryName) return null;
  return COUNTRY_NAME_TO_ISO2[countryName.trim().toLowerCase()] ?? null;
}
