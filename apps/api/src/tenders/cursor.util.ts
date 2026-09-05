export function encodeCursor(id: string): string {
  return Buffer.from(id, "utf-8").toString("base64url");
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64url").toString("utf-8");
}
