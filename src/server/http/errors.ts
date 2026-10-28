/**
 * Standard API errors and route wrapper
 * Throw an ApiError anywhere in a handler; handleRoute turns it into JSON
 * Response shape: { error: string, details?: unknown }
 */
import "server-only";
import { NextRequest, NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
    public readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request", details?: unknown) {
    super(400, message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(404, message);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(retryAfterSeconds: number) {
    super(429, `Too many attempts. Try again in ${retryAfterSeconds} seconds.`, undefined, {
      "Retry-After": String(retryAfterSeconds),
    });
  }
}

// Wrap a route handler so thrown errors become consistent JSON responses
export function handleRoute<Context>(
  handler: (request: NextRequest, context: Context) => Promise<Response>,
) {
  return async (request: NextRequest, context: Context): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          error.details === undefined
            ? { error: error.message }
            : { error: error.message, details: error.details },
          { status: error.status, ...(error.headers ? { headers: error.headers } : {}) },
        );
      }

      console.error(`Unhandled error in ${request.method} ${request.nextUrl.pathname}:`, error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
