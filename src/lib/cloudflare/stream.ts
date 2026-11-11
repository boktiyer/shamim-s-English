import "server-only";
import { createSign } from "node:crypto";

/**
 * Cloudflare Stream helpers. SERVER ONLY — these read secret environment
 * variables that must never be sent to the browser (no NEXT_PUBLIC_ prefix):
 *
 *   CLOUDFLARE_ACCOUNT_ID             Cloudflare account ID
 *   CLOUDFLARE_STREAM_API_TOKEN       API token with "Stream: Edit" permission (admin uploads/management)
 *   CLOUDFLARE_STREAM_KEY_ID          Signing key ID   (from scripts/cloudflare-stream-setup.mjs)
 *   CLOUDFLARE_STREAM_KEY_PEM         Signing key PEM, base64 as returned by Cloudflare
 *   CLOUDFLARE_STREAM_CUSTOMER_CODE   The "<CODE>" in customer-<CODE>.cloudflarestream.com
 */

export const VIDEO_UID = /^[a-f0-9]{32}$/;

function env() {
  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
    apiToken: process.env.CLOUDFLARE_STREAM_API_TOKEN ?? "",
    keyId: process.env.CLOUDFLARE_STREAM_KEY_ID ?? "",
    keyPem: process.env.CLOUDFLARE_STREAM_KEY_PEM ?? "",
    customerCode: process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE ?? "",
  };
}

/** Admin management (upload, status, delete) is available. */
export function isStreamApiConfigured() {
  const e = env();
  return Boolean(e.accountId && e.apiToken);
}

/** Secure playback (token signing + player URL) is available. */
export function isStreamPlaybackConfigured() {
  const e = env();
  return Boolean(e.keyId && e.keyPem && e.customerCode);
}

// ---------------------------------------------------------------------
// Signed playback tokens (signed locally — no API call per view)
// ---------------------------------------------------------------------
const b64url = (input: Buffer | string) => Buffer.from(input).toString("base64url");

/**
 * Creates a short-lived RS256 token for one video. Only call this AFTER
 * verifying the viewer may watch the lesson.
 */
export function signPlaybackToken(videoUid: string, ttlSeconds = 2 * 60 * 60, now = Math.floor(Date.now() / 1000)) {
  const { keyId, keyPem } = env();
  if (!VIDEO_UID.test(videoUid)) throw new Error("Invalid video UID");
  if (!keyId || !keyPem) throw new Error("Cloudflare Stream signing key is not configured");

  const header = { alg: "RS256", kid: keyId };
  const payload = {
    sub: videoUid,
    kid: keyId,
    nbf: now - 60, // small allowance for clock differences
    exp: now + Math.min(ttlSeconds, 24 * 60 * 60), // Cloudflare allows at most 24h
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const pem = Buffer.from(keyPem, "base64").toString("utf8"); // Cloudflare returns the PEM base64-encoded
  const signature = createSign("RSA-SHA256").update(unsigned).sign(pem);
  return `${unsigned}.${b64url(signature)}`;
}

/** Iframe player URL for a signed token. */
export function playerUrl(token: string) {
  const { customerCode } = env();
  return `https://customer-${customerCode}.cloudflarestream.com/${token}/iframe`;
}

/** Convenience: signed player URL for a video, or null if playback isn't configured. */
export function signedPlayerUrl(videoUid: string) {
  if (!isStreamPlaybackConfigured() || !VIDEO_UID.test(videoUid)) return null;
  try {
    return playerUrl(signPlaybackToken(videoUid));
  } catch (error) {
    console.error("[stream] signing failed:", error);
    return null;
  }
}

// ---------------------------------------------------------------------
// Cloudflare API (admin management)
// ---------------------------------------------------------------------
async function cf<T>(path: string, init?: RequestInit): Promise<T> {
  const { accountId, apiToken } = env();
  if (!accountId || !apiToken) throw new Error("Cloudflare Stream API is not configured");
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as { success?: boolean; result?: T; errors?: { message: string }[] } | null;
  if (res.ok && body === null) return undefined as T; // e.g. DELETE with an empty body
  if (!res.ok || !body?.success) {
    throw new Error(body?.errors?.map((e) => e.message).join("; ") || `Cloudflare API error ${res.status}`);
  }
  return body.result as T;
}

/** One-time URL the admin's browser uploads to directly (basic upload, max 200 MB). */
export function createDirectUpload(name: string) {
  return cf<{ uploadURL: string; uid: string }>("/direct_upload", {
    method: "POST",
    body: JSON.stringify({ maxDurationSeconds: 6 * 60 * 60, requireSignedURLs: true, meta: { name } }),
  });
}

export type StreamVideo = {
  uid: string;
  readyToStream: boolean;
  duration: number;
  status?: { state?: string; pctComplete?: string; errorReasonText?: string };
  meta?: { name?: string };
  requireSignedURLs?: boolean;
};

export function getVideo(uid: string) {
  return cf<StreamVideo>(`/${uid}`);
}

/** Makes sure a video can only be played with a signed token. */
export function requireSignedUrls(uid: string) {
  return cf<StreamVideo>(`/${uid}`, { method: "POST", body: JSON.stringify({ uid, requireSignedURLs: true }) });
}

export function deleteVideo(uid: string) {
  return cf<unknown>(`/${uid}`, { method: "DELETE" });
}
