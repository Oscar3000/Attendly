import { describe, expect, it } from "vitest";
import { copyFor, EVENT_COPY } from "./event-copy";

describe("event copy", () => {
  it("has every line for every event type", () => {
    for (const copy of Object.values(EVENT_COPY)) {
      for (const line of Object.values(copy)) expect(line.trim()).not.toBe("");
    }
  });

  it("only says wedding for weddings", () => {
    const { WEDDING, ...others } = EVENT_COPY;
    expect(WEDDING.headline).toMatch(/^Solemnly request/);
    for (const copy of Object.values(others)) {
      expect(JSON.stringify(copy)).not.toMatch(/wedding|solemn/i);
    }
  });

  it("falls back to the generic wording for an unknown type", () => {
    expect(copyFor("PICNIC")).toBe(EVENT_COPY.OTHER);
    expect(copyFor("BIRTHDAY")).toBe(EVENT_COPY.BIRTHDAY);
  });
});
