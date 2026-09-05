import * as fs from "node:fs";
import * as path from "node:path";
import nock from "nock";
import { UkFindATenderAdapter } from "./uk-find-a-tender.adapter";

const FIXTURES = path.join(__dirname, "../../test/fixtures");
const HOST = "https://www.find-tender.service.gov.uk";
const PATH = "/api/1.0/ocdsReleasePackages";

describe("UkFindATenderAdapter", () => {
  afterEach(() => nock.cleanAll());

  it("follows pagination via discover()", async () => {
    const page1 = JSON.parse(fs.readFileSync(path.join(FIXTURES, "uk-ftts-page1.json"), "utf-8"));
    const page2 = JSON.parse(fs.readFileSync(path.join(FIXTURES, "uk-ftts-page2.json"), "utf-8"));

    nock(HOST).get(PATH).reply(200, page1);
    nock(HOST).get(PATH).query({ cursor: "page2" }).reply(200, page2);

    const adapter = new UkFindATenderAdapter(`${HOST}${PATH}`);
    const records = [];
    for await (const record of adapter.discover()) {
      records.push(record);
    }

    expect(records).toHaveLength(2);
    expect(records[0].externalId).toBe("notice-1");
    expect(records[1].externalId).toBe("notice-2");
  });
});
