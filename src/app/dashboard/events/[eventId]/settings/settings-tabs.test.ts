import { describe, expect, it } from "vitest";
import { firstTabWithError, tabHasError } from "./settings-tabs";

describe("settings tabs", () => {
  it("finds the tab holding a field", () => {
    expect(firstTabWithError({ rsvpDeadline: "Too late" })).toBe("details");
    expect(firstTabWithError({ familyLines: "Too many" })).toBe("page");
    expect(firstTabWithError({ theme: "Unknown" })).toBe("theme");
  });

  it("picks the first tab when several have errors", () => {
    expect(firstTabWithError({ theme: "Unknown", notes: "Too long" })).toBe("page");
  });

  it("has nothing to show without errors, or for a field no tab holds", () => {
    expect(firstTabWithError({})).toBeUndefined();
  });

  it("ignores an error that's been cleared", () => {
    expect(tabHasError("details", { title: undefined as unknown as string })).toBe(false);
  });
});
