/**
 * Request validation helpers
 * Parse and validate input with zod; invalid input throws a 400 with field errors
 */
import "server-only";
import { z } from "zod";
import type { NextRequest } from "next/server";
import { BadRequestError } from "./errors";

function toBadRequest(message: string, error: z.ZodError): BadRequestError {
  return new BadRequestError(message, z.flattenError(error));
}

// Validate a JSON request body
export async function parseBody<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<z.infer<Schema>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw toBadRequest("Invalid request body", result.error);
  }
  return result.data;
}

// Validate URL search params (values arrive as strings; use z.coerce for numbers)
export function parseQuery<Schema extends z.ZodType>(
  request: NextRequest,
  schema: Schema,
): z.infer<Schema> {
  const query = Object.fromEntries(request.nextUrl.searchParams);

  const result = schema.safeParse(query);
  if (!result.success) {
    throw toBadRequest("Invalid query parameters", result.error);
  }
  return result.data;
}
