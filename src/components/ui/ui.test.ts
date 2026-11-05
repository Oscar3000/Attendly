import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { RsvpStatus } from "@/lib/types";
import { Button, buttonClasses } from "./button";
import { SegmentedControl } from "./segmented-control";
import { StatusChip } from "./status-chip";
import { TextField } from "./text-field";
import { TicketCard } from "./ticket-card";
import { Toast } from "./toast";

describe("Button", () => {
  it("is primary by default, and link classes match the button", () => {
    expect(buttonClasses()).toContain("bg-ember");
    expect(renderToStaticMarkup(createElement(Button, null, "Save"))).toContain(buttonClasses());
  });

  it("is disabled and busy while loading", () => {
    const html = renderToStaticMarkup(createElement(Button, { loading: true }, "Save"));
    expect(html).toContain("disabled");
    expect(html).toContain('aria-busy="true"');
  });
});

describe("TextField", () => {
  it("links an error to the input", () => {
    const html = renderToStaticMarkup(
      createElement(TextField, { id: "email", label: "Email", error: "Required" }),
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="email-error"');
    expect(html).toContain('id="email-error"');
  });
});

describe("StatusChip", () => {
  it.each<[RsvpStatus, string]>([
    ["confirmed", "Confirmed"],
    ["pending", "Pending"],
    ["declined", "Declined"],
    ["rescinded", "Rescinded"],
  ])("shows %s with a label and an icon", (status, label) => {
    const html = renderToStaticMarkup(createElement(StatusChip, { status }));
    expect(html).toContain(label);
    expect(html).toContain("<svg");
  });
});

describe("SegmentedControl", () => {
  it("marks only the selected option as pressed", () => {
    const html = renderToStaticMarkup(
      createElement(SegmentedControl<"a" | "b">, {
        label: "Filter",
        options: [
          { value: "a", label: "One" },
          { value: "b", label: "Two" },
        ],
        value: "b",
        onChange: vi.fn(),
      }),
    );
    expect(html).toContain('aria-label="Filter"');
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Two/);
  });
});

describe("TicketCard", () => {
  it("colours both notches, for guest themes too", () => {
    const html = renderToStaticMarkup(
      createElement(
        TicketCard,
        { notchColor: "var(--event-ink)", stub: "Stub" } as Parameters<typeof TicketCard>[0],
        "Main",
      ),
    );
    expect(html.match(/background-color:var\(--event-ink\)/g)).toHaveLength(2);
  });
});

describe("Toast", () => {
  it("keeps its live region on the page with no message", () => {
    const html = renderToStaticMarkup(createElement(Toast, { message: null, onDismiss: vi.fn() }));
    expect(html).toContain('role="status"');
    expect(html).not.toContain("Done");
  });
});
