import { describe, expect, it } from "vitest";
import { checkInMessage } from "./check-in";

const guest = { name: "Zelda Fitzgerald", admits: 3, admitted: 3 };

describe("checkInMessage", () => {
  it("lets people in in green, saying how many", () => {
    expect(checkInMessage({ result: "admitted", guest, count: 2 }, "UTC")).toEqual({
      tone: "ok",
      title: "Admit 2 people",
      detail: "Zelda Fitzgerald · 3 of 3 now in",
    });
    expect(
      checkInMessage(
        { result: "admitted", guest: { ...guest, admits: 1, admitted: 1 }, count: 1 },
        "UTC",
      ).title,
    ).toBe("Admit 1 person");
  });

  it("stops a used ticket, with when (on the event's clock) and by whom", () => {
    const message = checkInMessage(
      {
        result: "full",
        guest,
        // 18:42 UTC is 7:42 PM in Lagos
        lastCheckIn: { at: "2027-05-23T18:42:00.000Z", by: "Ada" },
      },
      "Africa/Lagos",
    );

    expect(message).toEqual({
      tone: "stop",
      title: "Already checked in",
      detail:
        "Zelda Fitzgerald: all 3 people on this invitation are in. Last check-in at 7:42 PM by Ada.",
    });
    expect(
      checkInMessage(
        { result: "full", guest, lastCheckIn: { at: "2027-05-23T18:42:00Z", by: null } },
        "UTC",
      ).detail,
    ).toMatch(/Last check-in at 6:42 PM\.$/);
    expect(checkInMessage({ result: "full", guest, lastCheckIn: null }, "UTC").detail).toBe(
      "Zelda Fitzgerald: all 3 people on this invitation are in.",
    );
  });

  it("stops everything else in red", () => {
    const left = { ...guest, admitted: 2 };
    expect(checkInMessage({ result: "too_many", guest: left, requested: 2 }, "UTC")).toMatchObject({
      tone: "stop",
      title: "Only 1 place left",
    });
    expect(
      checkInMessage({ result: "not_valid", guest: { name: "Zelda" }, status: "rescinded" }, "UTC"),
    ).toMatchObject({ tone: "stop", title: "Invitation cancelled" });
    expect(
      checkInMessage({ result: "not_valid", guest: { name: "Zelda" }, status: "declined" }, "UTC")
        .title,
    ).toBe("Invitation declined");
    expect(checkInMessage({ result: "link_inactive" }, "UTC")).toMatchObject({
      tone: "stop",
      title: "This check-in link no longer works",
    });
    expect(checkInMessage({ result: "not_found" }, "UTC")).toMatchObject({
      tone: "stop",
      title: "Not a ticket for this event",
    });
  });
});
