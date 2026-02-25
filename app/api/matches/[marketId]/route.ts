// app/api/matches/[marketId]/route.ts
export const runtime = "nodejs";

import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withCors, corsPreflight } from "@/lib/cors";

type Ctx = { params: Promise<{ marketId: string }> };

export async function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request, ctx: Ctx) {
  const { marketId } = await ctx.params;
  const id = Number(marketId);

  const { rows } = await sql`SELECT * FROM matches WHERE market_id = ${id}`;
  if (!rows.length) {
    return withCors(req, NextResponse.json({ error: "Not found" }, { status: 404 }));
  }
  return withCors(req, NextResponse.json(rows[0]));
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { marketId } = await ctx.params;
  const id = Number(marketId);

  const raw = await req.text();
  const admin = await requireAdmin(req, raw);
  if (!admin.ok) {
    return withCors(
      req,
      NextResponse.json({ error: admin.error }, { status: admin.status })
    );
  }

  await sql`DELETE FROM matches WHERE market_id = ${id}`;
  return withCors(req, NextResponse.json({ ok: true }));
}