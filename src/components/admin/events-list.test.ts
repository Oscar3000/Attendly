import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EventsList, type EventListItem } from "./events-list";

const event = (overrides: Partial<EventListItem>): EventListItem => ({
  id: "event",
  type: "Wedding",
  title: "Ada & Charles",
  when: "May 24, 2027",
  venue: "Hall",
  color: "#A5613D",
  invited: 10,
  replied: 4,
  days: 30,
  ...overrides,
});

const render = (events: EventListItem[]) =>
  renderToStaticMarkup(createElement(EventsList, { events }));

describe("EventsList", () => {
  it("invites a host with no events to create one, with no filters", () => {
    const html = render([]);
    expect(html).toContain("No events yet");
    expect(html).toContain('href="/dashboard/events/new"');
    expect(html).not.toContain("Search events");
  });

  it("opens on upcoming events, soonest first as given, keeping today's", () => {
    const html = render([
      event({ id: "a", title: "First", days: 0 }),
      event({ id: "b", title: "Second", days: 9 }),
      event({ id: "c", title: "Gone", days: -2 }),
    ]);
    expect(html.indexOf("First")).toBeLessThan(html.indexOf("Second"));
    expect(html).toContain("Today");
    expect(html).not.toContain("Gone");
  });

  it("opens on past events, most recent first, when nothing is coming up", () => {
    const html = render([
      event({ id: "a", title: "Older", days: -40 }),
      event({ id: "b", title: "Recent", days: -1 }),
    ]);
    expect(html.indexOf("Recent")).toBeLessThan(html.indexOf("Older"));
    expect(html).toContain("day ago");
  });

  it("shows reply progress, but not for an event with no invitations", () => {
    expect(render([event({})])).toContain("4 of 10 replied");
    expect(render([event({ invited: 0, replied: 0 })])).not.toContain("replied");
  });

  it("links each card to its event, with the theme's colour", () => {
    const html = render([event({ id: "abc" })]);
    expect(html).toContain('href="/dashboard/events/abc"');
    expect(html).toContain("background-color:#A5613D");
  });
});
