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

export async function PATCH(req: Request, ctx: Ctx) {
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

  let body: any = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return withCors(req, NextResponse.json({ error: "Invalid JSON" }, { status: 400 }));
  }

  const hasRsh = Object.prototype.hasOwnProperty.call(body, "requestSettlementHash");
  const hasSettled = Object.prototype.hasOwnProperty.call(body, "settled");
  const hasStatus = Object.prototype.hasOwnProperty.call(body, "status");

  if (!hasRsh && !hasSettled && !hasStatus) {
    return withCors(
      req,
      NextResponse.json(
        { error: "Nothing to update. Provide requestSettlementHash, settled, or status." },
        { status: 400 }
      )
    );
  }

  // Fetch existing row (needed for overwrite protection + existence)
  const existing = await sql`
    SELECT market_id, request_settlement_hash, settled, status
    FROM matches
    WHERE market_id = ${id}
  `;

  if (!existing.rows.length) {
    return withCors(req, NextResponse.json({ error: "Not found" }, { status: 404 }));
  }

  const existingRsh: string | null = existing.rows[0].request_settlement_hash ?? null;

  // Normalize fields
  const requestSettlementHash =
    hasRsh
      ? body.requestSettlementHash === null
        ? null
        : String(body.requestSettlementHash)
      : undefined;

  const settled = hasSettled ? Boolean(body.settled) : undefined;
  const status = hasStatus ? String(body.status) : undefined;

  // ✅ SAFETY CHECK: request_settlement_hash can only be set once
  // If it already exists:
  // - if same value => allow (idempotent)
  // - if different value => deny overwrite
  if (hasRsh && existingRsh) {
    if (requestSettlementHash && requestSettlementHash.toLowerCase() === existingRsh.toLowerCase()) {
      // idempotent: no-op, but continue other updates (settled/status) if provided
    } else {
      return withCors(
        req,
        NextResponse.json(
          {
            error: "request_settlement_hash already set; overwrites are not allowed",
            current: existingRsh,
          },
          { status: 409 }
        )
      );
    }
  }

  // Update logic
  if (hasRsh && !hasSettled && !hasStatus) {
    // Only rsh
    if (!existingRsh) {
      await sql`
        UPDATE matches
        SET request_settlement_hash = ${requestSettlementHash}
        WHERE market_id = ${id}
      `;
    }
  } else if (!hasRsh && hasSettled && !hasStatus) {
    await sql`
      UPDATE matches
      SET settled = ${settled}
      WHERE market_id = ${id}
    `;
  } else if (!hasRsh && !hasSettled && hasStatus) {
    await sql`
      UPDATE matches
      SET status = ${status}
      WHERE market_id = ${id}
    `;
  } else {
    // Multiple fields
    // Only set rsh if it isn't already set (or idempotent same value)
    const shouldSetRsh = hasRsh && !existingRsh;

    await sql`
      UPDATE matches
      SET
        request_settlement_hash = ${shouldSetRsh ? requestSettlementHash : sql`request_settlement_hash`},
        settled = ${hasSettled ? settled : sql`settled`},
        status = ${hasStatus ? status : sql`status`}
      WHERE market_id = ${id}
    `;
  }

  const { rows } = await sql`SELECT * FROM matches WHERE market_id = ${id}`;
  return withCors(req, NextResponse.json({ ok: true, match: rows[0] }));
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