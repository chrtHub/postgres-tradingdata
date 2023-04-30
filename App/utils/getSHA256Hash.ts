import { createHash } from "crypto";

export async function getSHA256Hash(string: string) {
  const hash = createHash("sha256");
  hash.update(string);
  return hash.digest("hex");
}
