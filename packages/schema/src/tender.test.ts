import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import schema from "../tender.schema.json";
import type { CanonicalTender } from "./index";

describe("tender schema", () => {
  it("accepts a valid canonical tender", () => {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);

    const sample: CanonicalTender = {
      id: "ten_01J000000000000000000001",
      source: { id: "uk_find_a_tender", name: "UK Find a Tender", countryCode: "GB" },
      externalReferences: [{ type: "notice_id", value: "notice-1" }],
      title: "Case management platform implementation",
      status: "open",
      publishedAt: "2026-09-01T00:00:00Z",
      buyer: { name: "Example Council", countryCode: "GB" },
      cpvCodes: ["72000000"],
      sourceUrl: "https://www.find-tender.service.gov.uk/notice/notice-1",
      provenance: { version: 1, contentHash: "sha256:abc", lastSourceSeenAt: "2026-09-01T00:00:00Z" },
    };

    const valid = validate(sample);
    expect(valid, JSON.stringify(validate.errors)).toBe(true);
  });

  it("rejects a tender missing required fields", () => {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);

    expect(validate({ id: "ten_1" })).toBe(false);
  });
});
