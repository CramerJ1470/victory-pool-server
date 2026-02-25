import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { MatchSchema } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const { rows } = await sql`SELECT * FROM matches ORDER BY market_id ASC`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const raw = await req.text();
  const admin = await requireAdmin(req, raw);
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const parsed = MatchSchema.safeParse(JSON.parse(raw));
  if (!parsed.success)
    return NextResponse.json(parsed.error.flatten(), { status: 400 });

  const m = parsed.data;

  await sql`
    INSERT INTO matches (
      market_id, date, time, datetime, status,
      result, teams, fixture, settled,
      request_settlement_hash, created_at
    )
    VALUES (
      ${m.marketId}, ${m.date}, ${m.time}, ${m.dateTime},
      ${m.status}, ${m.result},
      ${JSON.stringify(m.teams)},
      ${m.fixture}, ${m.settled},
      ${m.requestSettlementHash},
      ${m.createdAt}
    )
    ON CONFLICT (market_id) DO NOTHING;
  `;

  return NextResponse.json({ ok: true });
}