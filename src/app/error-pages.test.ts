import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ErrorPage from "./error";
import NotFound from "./not-found";

describe("error pages", () => {
  it("offers a way home from a 404", () => {
    const html = renderToStaticMarkup(createElement(NotFound));

    expect(html).toContain("Page not found");
    expect(html).toContain('href="/"');
  });

  it("offers a retry from an error, and says nothing about what failed", () => {
    const html = renderToStaticMarkup(createElement(ErrorPage, { reset: () => {} }));

    expect(html).toContain("Something went wrong");
    expect(html).toContain("Try again");
    expect(html).toContain('href="/"');
  });
});
