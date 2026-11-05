import { describe, expect, it } from "vitest";
import { firstStepWithError } from "./event-form";

describe("firstStepWithError", () => {
  it("returns the step holding the field", () => {
    expect(firstStepWithError({ type: "Choose one" })).toBe(0);
    expect(firstStepWithError({ rsvpDeadline: "Too late" })).toBe(1);
    expect(firstStepWithError({ theme: "Unknown" })).toBe(2);
  });

  it("picks the earliest step when several have errors", () => {
    expect(firstStepWithError({ theme: "Unknown", title: "Enter a title" })).toBe(1);
  });

  it("stays on details for a field it doesn't know", () => {
    expect(firstStepWithError({})).toBe(1);
  });
});
