import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  await sql`
    CREATE TABLE IF NOT EXISTS matches (
      market_id INTEGER PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      datetime TEXT NOT NULL,
      status TEXT NOT NULL,
      result JSONB,
      teams JSONB NOT NULL,
      fixture TEXT NOT NULL,
      settled BOOLEAN NOT NULL,
      request_settlement_hash TEXT,
      created_at BIGINT NOT NULL
    );
  `;

  return NextResponse.json({ ok: true });
}