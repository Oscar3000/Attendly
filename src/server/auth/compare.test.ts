import { describe, expect, it } from "vitest";
import { secretsMatch } from "./compare";

describe("secretsMatch", () => {
  it("matches identical secrets", () => {
    expect(secretsMatch("correct-horse", "correct-horse")).toBe(true);
    expect(secretsMatch("pässwörd", "pässwörd")).toBe(true);
  });

  it("rejects different secrets, including different lengths and prefixes", () => {
    expect(secretsMatch("correct-horsE", "correct-horse")).toBe(false);
    expect(secretsMatch("correct", "correct-horse")).toBe(false);
    expect(secretsMatch("correct-horse-battery", "correct-horse")).toBe(false);
    expect(secretsMatch("", "correct-horse")).toBe(false);
  });
});
