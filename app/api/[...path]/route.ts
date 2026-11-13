import { NextResponse } from "next/server";

/**
 * Catch-all for unknown /api/* paths — JSON 404 in the same error shape as
 * every real endpoint, so API consumers never parse HTML error pages.
 */
export function GET() {
  return NextResponse.json(
    { error: "Unknown API route. See the API reference in README.md." },
    { status: 404 },
  );
}

export const POST = GET;
export const PUT = GET;
export const DELETE = GET;
