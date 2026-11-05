import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import RepliesCard from "./replies-card";

const metrics = {
  totalInvitations: 4,
  totalGuests: 7,
  pendingCount: 1,
  confirmedCount: 2,
  rescindedCount: 1,
};

const render = (props: Partial<Parameters<typeof RepliesCard>[0]> = {}) =>
  renderToStaticMarkup(createElement(RepliesCard, { metrics, ...props }));

describe("RepliesCard", () => {
  it("counts everything but pending as replied", () => {
    expect(render()).toMatch(/>3<span[^>]*> of 4</);
  });

  it("names every group in words, not just by colour", () => {
    const html = render();
    for (const label of ["Confirmed", "Pending", "Declined"]) expect(html).toContain(label);
  });

  it("leaves a group with nobody in it out of the bar, but keeps it in the legend", () => {
    const html = render({ metrics: { ...metrics, rescindedCount: 0 } });
    expect(html.match(/flex-grow:/g)).toHaveLength(2);
    expect(html).toContain("Declined");
  });

  it("offers no buttons until there's a list to filter", () => {
    expect(render()).not.toContain("<button");
  });

  it("marks the selected group when it can filter", () => {
    const html = render({ selected: "pending", onSelect: vi.fn() });
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Confirmed: 2. Filter guests"');
  });

  it("says so when there are no invitations", () => {
    const empty = { ...metrics, totalInvitations: 0, pendingCount: 0, confirmedCount: 0 };
    const html = render({ metrics: { ...empty, rescindedCount: 0 } });
    expect(html).toContain("No invitations yet");
    expect(html).not.toContain("flex-grow:");
  });
});
