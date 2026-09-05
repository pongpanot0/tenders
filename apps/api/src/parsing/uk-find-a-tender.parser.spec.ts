import * as fs from "node:fs";
import * as path from "node:path";
import { parseUkFindATenderRelease } from "./uk-find-a-tender.parser";

const FIXTURES = path.join(__dirname, "../../test/fixtures");

describe("parseUkFindATenderRelease", () => {
  it("extracts expected fields from a release", () => {
    const page = JSON.parse(fs.readFileSync(path.join(FIXTURES, "uk-ftts-page1.json"), "utf-8"));
    const release = page.releases[0];

    const parsed = parseUkFindATenderRelease(release);

    expect(parsed).toEqual({
      sourceExternalId: "notice-1",
      title: "Case management software",
      description: "Supply of a case management platform.",
      buyerName: "Example Council",
      countryName: "United Kingdom",
      publishedAtRaw: "2026-09-01T00:00:00Z",
      deadlineAtRaw: "2026-09-30T23:59:59Z",
      budgetAmount: 100000,
      currencyRaw: "GBP",
      cpvCodes: ["72000000"],
    });
  });

  it("throws a clear error when tender.id is missing", () => {
    const page = JSON.parse(fs.readFileSync(path.join(FIXTURES, "uk-ftts-page1.json"), "utf-8"));
    const release = JSON.parse(JSON.stringify(page.releases[0]));
    delete release.tender.id;

    expect(() => parseUkFindATenderRelease(release)).toThrow(
      "Cannot parse release: missing required field 'tender.id'",
    );
  });
});
