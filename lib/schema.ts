import { z } from "zod";

export const MatchSchema = z.object({
  marketId: z.number(),
  date: z.string(),
  time: z.string(),
  dateTime: z.string(),
  status: z.string(),
  result: z.any().nullable(),
  teams: z.array(z.object({ clubName: z.string() })),
  fixture: z.string(),
  settled: z.boolean(),
  requestSettlementHash: z.string().nullable(),
  createdAt: z.number(),
});