import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(_: Request, { params }: any) {
  const { rows } = await sql`
    SELECT * FROM matches WHERE market_id = ${params.marketId}
  `;
  if (!rows.length)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(req: Request, { params }: any) {
  const raw = await req.text();
  const admin = await requireAdmin(req, raw);
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  await sql`
    DELETE FROM matches WHERE market_id = ${params.marketId}
  `;
  return NextResponse.json({ ok: true });
}