import { headers } from "next/headers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { db } from "./database";
import { tokenHash } from "./password";

export const SESSION_SECONDS = 60 * 60 * 24 * 30;
export const SESSION_COOKIE = "__Host-blitz_session";
const LOCAL_COOKIE = "blitz_local_session";

export type AccountRow = { id: string; username: string; password_hash: string; owner_id: string; legacy_id: string | null; created_at: number };
export type PublicUser = { username: string | null; displayName: string; provider: "password" | "chatgpt"; canLinkProgress: boolean };
export type Identity = { ownerId: string; accountId: string | null; user: PublicUser };

function localHost(host: string) {
  return process.env.NODE_ENV !== "production" && /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
}
export function cookieName(host: string) { return localHost(host) ? LOCAL_COOKIE : SESSION_COOKIE; }
export function sessionToken(requestHeaders: Pick<Headers, "get">) {
  const name = cookieName(requestHeaders.get("host") || "");
  return (requestHeaders.get("cookie") || "").split(";").map(x => x.trim()).find(x => x.startsWith(`${name}=`))?.slice(name.length + 1);
}
// Keep an expired token as an auth-selection marker instead of silently switching accounts.
export function sessionCookie(req: Request, token: string, maxAge = 60 * 60 * 24 * 365) {
  const url = new URL(req.url);
  return `${cookieName(url.host)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${localHost(url.host) ? "" : "; Secure"}`;
}
export async function identity(): Promise<Identity | null> {
  const token = sessionToken(await headers());
  // An invalid, expired or explicitly signed-out app session never falls back to another identity.
  if (token !== undefined) {
    if (!/^[a-f0-9]{64}$/.test(token)) return null;
    const account = await db().prepare("SELECT a.id,a.username,a.owner_id FROM auth_sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>?").bind(tokenHash(token), Date.now()).first<Pick<AccountRow, "id" | "username" | "owner_id">>();
    return account ? { ownerId: account.owner_id, accountId: account.id, user: { username: account.username, displayName: account.username, provider: "password", canLinkProgress: false } } : null;
  }
  const legacy = await getChatGPTUser();
  if (!legacy) return null;
  const linked = await db().prepare("SELECT id,username,owner_id FROM accounts WHERE legacy_id=?").bind(legacy.userId).first<Pick<AccountRow, "id" | "username" | "owner_id">>();
  return { ownerId: legacy.userId, accountId: linked?.id || null, user: { username: linked?.username || null, displayName: linked?.username || legacy.displayName, provider: "chatgpt", canLinkProgress: !linked } };
}
