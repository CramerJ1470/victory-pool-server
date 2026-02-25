import { recoverMessageAddress } from "viem";
import { createHash } from "crypto";

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export function buildMessage({ method, path, body, issuedAt, nonce }: any) {
  return [
    "VICTORY_POOL_ADMIN_REQUEST",
    `method:${method}`,
    `path:${path}`,
    `bodyHash:${sha256(body || "")}`,
    `issuedAt:${issuedAt}`,
    `nonce:${nonce}`,
  ].join("\n");
}

export async function requireAdmin(req: Request, rawBody: string) {
  const sig = req.headers.get("x-admin-signature");
  const issuedAt = req.headers.get("x-admin-issued-at");
  const nonce = req.headers.get("x-admin-nonce");
  const path = req.headers.get("x-admin-path");

  if (!sig || !issuedAt || !nonce || !path)
    return { ok: false, status: 401, error: "Missing headers" };

  const msg = buildMessage({
    method: req.method,
    path,
    body: rawBody,
    issuedAt,
    nonce,
  });

  const recovered = await recoverMessageAddress({
    message: msg,
    signature: sig as `0x${string}`,
  });

  if (
    recovered.toLowerCase() !==
    process.env.VICTORY_POOL_ADMIN_WALLET!.toLowerCase()
  ) {
    return { ok: false, status: 403, error: "Not admin wallet" };
  }

  return { ok: true };
}