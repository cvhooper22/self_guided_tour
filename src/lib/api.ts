import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./auth";

/** Wrap a route handler so thrown HttpErrors / validation errors become JSON responses. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response | object>) {
  return async (...args: A): Promise<Response> => {
    try {
      const r = await fn(...args);
      return r instanceof Response ? r : NextResponse.json(r);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ error: "Invalid input", issues: e.issues }, { status: 400 });
      console.error(e);
      return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
    }
  };
}
