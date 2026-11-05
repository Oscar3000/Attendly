import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { InvitationTableEntry } from "@/lib/types";
import InvitationsTable from "./invitations-table";

const guest = (overrides: Partial<InvitationTableEntry> = {}) =>
  ({
    id: "guest",
    name: "Zelda Okafor",
    status: "confirmed",
    plusOne: 1,
    hasQrCode: true,
    qrCode: "data:image/png;base64,x",
    ...overrides,
  }) as InvitationTableEntry;

const render = (props: Partial<Parameters<typeof InvitationsTable>[0]> = {}) =>
  renderToStaticMarkup(
    createElement(InvitationsTable, {
      invitations: [guest()],
      onOpen: vi.fn(),
      onPageChange: vi.fn(),
      search: "",
      onSearchChange: vi.fn(),
      onClearFilter: vi.fn(),
      ...props,
    }),
  );

const pagination = { page: 2, limit: 10, total: 25, totalPages: 3 };

describe("InvitationsTable", () => {
  it("shows the guest, their status and how many people they admit", () => {
    const html = render();
    expect(html).toContain("Zelda Okafor");
    expect(html).toContain("Confirmed");
    expect(html).toMatch(/>2<\/td>/);
  });

  it("opens a guest from their name or Open ticket, named for screen readers", () => {
    const html = render();
    expect(html).toMatch(/<button[^>]*>Zelda Okafor<\/button>/);
    expect(html).toContain('aria-label="Open ticket for Zelda Okafor"');
  });

  it("offers Clear filter only with a filter, and shows what's filtered", () => {
    expect(render()).not.toContain("Clear filter");
    const html = render({ filterLabel: "Confirmed", pagination });
    expect(html).toContain("Clear filter");
    expect(html).toContain("Confirmed · 25");
  });

  it("tells a filtered list and an empty event apart", () => {
    expect(render({ invitations: [] })).toContain("No guests yet");
    expect(render({ invitations: [], search: "x" })).toContain("No guests match");
    expect(render({ invitations: [], filterLabel: "Declined" })).toContain("No guests match");
  });

  it("only shows paging when there's more than one page", () => {
    expect(render()).not.toContain("Next");
    expect(render({ pagination })).toContain("Page 2 of 3");
  });

  it("disables Previous on the first page and Next on the last", () => {
    expect(render({ pagination: { ...pagination, page: 1 } })).toMatch(/disabled=""[^>]*>Previous/);
    expect(render({ pagination: { ...pagination, page: 3 } })).toMatch(/disabled=""[^>]*>Next/);
  });
});
