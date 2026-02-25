// lib/cors.ts
import { NextResponse } from "next/server";

const DEV_ORIGIN = "http://localhost:5173";

// Add your prod frontend domains too if needed
const ALLOWED_ORIGINS = new Set<string>([
  DEV_ORIGIN,
  // "https://your-frontend.vercel.app",
  // "https://www.yourdomain.com",
]);

export function corsHeaders(origin: string | null) {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.has(origin) ? origin : ALLOWED_ORIGINS.has(DEV_ORIGIN) ? DEV_ORIGIN : "";

  // If origin is not allowed, do NOT set ACAO to "*"
  // because you're sending custom headers (x-admin-*) which triggers preflight.
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, x-admin-signature, x-admin-issued-at, x-admin-nonce, x-admin-path",
    "Access-Control-Max-Age": "86400",
  } as Record<string, string>;
}

export function withCors(req: Request, res: NextResponse) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);
  Object.entries(headers).forEach(([k, v]) => {
    if (v) res.headers.set(k, v);
  });
  return res;
}

export function corsPreflight(req: Request) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);
  return new NextResponse(null, { status: 204, headers });
}