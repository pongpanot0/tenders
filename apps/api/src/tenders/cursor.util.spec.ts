import { decodeCursor, encodeCursor } from "./cursor.util";

describe("cursor util", () => {
  it("round-trips an id through encode/decode", () => {
    const cursor = encodeCursor("ten_abc123");
    expect(decodeCursor(cursor)).toBe("ten_abc123");
  });

  it("produces an opaque, non-plaintext string", () => {
    const cursor = encodeCursor("ten_abc123");
    expect(cursor).not.toContain("ten_abc123");
  });
});
