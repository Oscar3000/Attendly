import { describe, expect, it } from "vitest";
import { z } from "zod";
import { NextRequest } from "next/server";
import { BadRequestError } from "./errors";
import { parseBody, parseQuery } from "./validate";

const bodySchema = z.object({
  name: z.string().min(1),
  plusOne: z.number().int().min(0).default(0),
});

function post(body: string) {
  return new NextRequest("http://localhost/api/test", { method: "POST", body });
}

describe("parseBody", () => {
  it("returns parsed data with defaults applied", async () => {
    await expect(parseBody(post('{"name":"Ada"}'), bodySchema)).resolves.toEqual({
      name: "Ada",
      plusOne: 0,
    });
  });

  it("throws a BadRequestError with field errors for invalid input", async () => {
    const error = await parseBody(post('{"name":"","plusOne":-1}'), bodySchema).catch((e) => e);

    expect(error).toBeInstanceOf(BadRequestError);
    expect(error.message).toBe("Invalid request body");
    expect(Object.keys(error.details.fieldErrors).sort()).toEqual(["name", "plusOne"]);
  });

  it("throws a BadRequestError for malformed JSON", async () => {
    await expect(parseBody(post("{nope"), bodySchema)).rejects.toThrow(
      "Request body must be valid JSON",
    );
  });
});

describe("parseQuery", () => {
  const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1) });

  it("coerces search params", () => {
    const request = new NextRequest("http://localhost/api/test?page=3");
    expect(parseQuery(request, querySchema)).toEqual({ page: 3 });
  });

  it("throws a BadRequestError for invalid params", () => {
    const request = new NextRequest("http://localhost/api/test?page=0");
    expect(() => parseQuery(request, querySchema)).toThrow("Invalid query parameters");
  });
});
