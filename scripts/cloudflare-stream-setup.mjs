// One-time setup: creates a Cloudflare Stream signing key and saves it to .env.local.
//
//   1. Put CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN in .env.local
//   2. Run:  npm run stream:setup
//
// The key is written straight into .env.local and is NOT printed to the screen.
import { appendFileSync, readFileSync } from "node:fs";

const envText = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envText.split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])
);

const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_STREAM_API_TOKEN: token } = env;
if (!account || !token) {
  console.error("Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN to .env.local first.");
  process.exit(1);
}
if (env.CLOUDFLARE_STREAM_KEY_ID && env.CLOUDFLARE_STREAM_KEY_PEM) {
  console.log("A signing key is already in .env.local. Nothing to do.");
  process.exit(0);
}

const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/stream/keys`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});
const body = await res.json().catch(() => null);
if (!res.ok || !body?.success) {
  console.error("Cloudflare error:", body?.errors?.map((e) => e.message).join("; ") || res.status);
  process.exit(1);
}

appendFileSync(
  ".env.local",
  `\n# Cloudflare Stream signing key (created ${new Date().toISOString().slice(0, 10)})\nCLOUDFLARE_STREAM_KEY_ID=${body.result.id}\nCLOUDFLARE_STREAM_KEY_PEM=${body.result.pem}\n`
);
console.log(`Signing key created (id ${body.result.id}) and saved to .env.local. Restart "npm run dev".`);
