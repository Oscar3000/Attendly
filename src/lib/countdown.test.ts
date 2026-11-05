import { describe, expect, it } from "vitest";
import { countdownAt } from "./countdown";

// 4:00 PM in Lagos
const startsAt = new Date("2027-05-24T15:00:00Z");
const at = (moment: string) => countdownAt(startsAt, "Africa/Lagos", new Date(moment));

describe("countdownAt", () => {
  it("splits the time left into days, hours, minutes and seconds", () => {
    expect(at("2027-05-22T13:58:57Z")).toEqual({
      state: "counting",
      days: 2,
      hours: 1,
      minutes: 1,
      seconds: 3,
    });
  });

  it("counts down to the last second", () => {
    expect(at("2027-05-24T14:59:59Z")).toMatchObject({ state: "counting", seconds: 1 });
    expect(at("2027-05-24T15:00:00Z")).toEqual({ state: "today" });
  });

  it("is over once the event's day has ended on its own calendar", () => {
    // 11:30 PM and 12:30 AM in Lagos
    expect(at("2027-05-24T22:30:00Z")).toEqual({ state: "today" });
    expect(at("2027-05-24T23:30:00Z")).toEqual({ state: "over" });
  });
});
