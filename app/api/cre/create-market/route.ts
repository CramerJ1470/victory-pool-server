export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { withCors, corsPreflight } from "@/lib/cors";
import { requireAdmin } from "@/lib/auth";

// If you want, restrict who can create markets via CRE.
// This uses the same admin signing you already use for DB writes.

export async function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function POST(req: Request) {
  // If you want admin-only:
  const raw = await req.text();
  const admin = await requireAdmin(req, raw);
  if (!admin.ok) {
    return withCors(req, NextResponse.json({ error: admin.error }, { status: admin.status }));
  }

  const CRE_URL = process.env.CRE_CREATE_MARKET_URL;
  if (!CRE_URL) {
    return withCors(req, NextResponse.json({ error: "Missing CRE_CREATE_MARKET_URL" }, { status: 500 }));
  }

  // raw is already the JSON body { question: string }
  const upstream = await fetch(CRE_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw,
  });

  const text = await upstream.text();

  if (!upstream.ok) {
    return withCors(
      req,
      NextResponse.json({ error: `CRE failed (${upstream.status}): ${text}` }, { status: 502 })
    );
  }

  // CRE workflow returns txHash string
  return withCors(req, new NextResponse(text, { status: 200 }));
}