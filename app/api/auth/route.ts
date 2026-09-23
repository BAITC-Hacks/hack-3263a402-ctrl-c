import { z } from "zod";
import { db } from "@/lib/database";
import { AppError } from "@/lib/openai";
import { identity, sessionCookie, sessionToken, SESSION_SECONDS, type AccountRow } from "@/lib/identity";
import { dummyPasswordHash, hashPassword, randomToken, tokenHash, verifyPassword } from "@/lib/password";
import { requireBrowserMutation } from "@/lib/request-security";

export const dynamic = "force-dynamic";
const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_.-]{2,31}$/, "Логин: 3–32 символа, латинские буквы, цифры, точка, дефис или подчёркивание.");
const formSchema = z.object({
  action: z.enum(["register", "login", "logout", "chatgpt"]),
  username: z.string().max(100).optional(),
  password: z.string().max(128).optional(),
  linkProgress: z.boolean().optional(),
});
function reply(data: unknown, status = 200, cookie?: string) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...(cookie ? { "Set-Cookie": cookie } : {}) } });
}
function fail(error: unknown) {
  if (error instanceof AppError) return reply({ error: error.message }, error.status);
  if (error instanceof z.ZodError) return reply({ error: "Проверь логин и пароль. Пароль должен содержать от 15 до 128 символов." }, 400);
  // Credentials, cookies, request bodies and database records must never be logged.
  console.error("Account operation failed");
  return reply({ error: "Не удалось войти или сохранить аккаунт. Попробуй ещё раз через минуту." }, 503);
}
async function readBody(req: Request) {
  requireBrowserMutation(req);
  const reader = req.body?.getReader();
  if (!reader) throw new AppError("Заполни форму.");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 4096) { await reader.cancel(); throw new AppError("Форма слишком длинная.", 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return formSchema.parse(JSON.parse(new TextDecoder().decode(bytes))); }
  catch { throw new AppError("Проверь заполненные поля."); }
}
async function limit(key: string, maximum: number, duration: number) {
  const now = Date.now();
  const row = await db().prepare(`INSERT INTO auth_limits(key,count,expires_at) VALUES(?,1,?)
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END,
    expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END
    WHERE expires_at<=? OR count<? RETURNING count`).bind(key, now + duration, now, now, now, maximum).first();
  if (!row) throw new AppError("Слишком много попыток. Подожди 15 минут и попробуй снова.", 429);
}
export async function GET() {
  try { return reply({ user: (await identity())?.user || null }); }
  catch (error) { return fail(error); }
}
export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    const database = db(), currentToken = sessionToken(req.headers);
    const clearCurrent = () => database.prepare("DELETE FROM auth_sessions WHERE token_hash=?").bind(tokenHash(currentToken || ""));
    if (body.action === "logout" || body.action === "chatgpt") {
      await clearCurrent().run();
      // The marker prevents the still-valid ChatGPT cookie from silently logging the user back in.
      return reply({ user: null }, 200, body.action === "logout" ? sessionCookie(req, "signed-out") : sessionCookie(req, "", 0));
    }
    const username = usernameSchema.parse(body.username);
    const password = z.string().min(body.action === "register" ? 15 : 1).max(128).parse(body.password);
    const ip = req.headers.get("cf-connecting-ip") || "unavailable";
    await limit(`ip:${tokenHash(ip)}`, 60, 15 * 60 * 1000);
    await limit(`name:${tokenHash(username)}`, 10, 15 * 60 * 1000);
    if (body.action === "register") await limit(`signup:${tokenHash(ip)}`, 10, 15 * 60 * 1000);
    const now = Date.now(), token = randomToken();
    let account: AccountRow;
    if (body.action === "register") {
      const current = await identity();
      if (body.linkProgress && (!current || current.user.provider !== "chatgpt" || !current.user.canLinkProgress)) throw new AppError("Этот профиль уже привязан или вход через ChatGPT завершился. Обнови страницу.", 409);
      const id = crypto.randomUUID();
      account = { id, username, password_hash: await hashPassword(password), owner_id: body.linkProgress ? current!.ownerId : `blitz:${id}`, legacy_id: body.linkProgress ? current!.ownerId : null, created_at: now };
      try {
        await database.batch([
          database.prepare("INSERT INTO accounts(id,username,password_hash,owner_id,legacy_id,created_at) VALUES(?,?,?,?,?,?)").bind(account.id, username, account.password_hash, account.owner_id, account.legacy_id, now),
          clearCurrent(),
          database.prepare("INSERT INTO auth_sessions(token_hash,account_id,created_at,expires_at) VALUES(?,?,?,?)").bind(tokenHash(token), account.id, now, now + SESSION_SECONDS * 1000),
        ]);
      } catch (error) {
        if (error instanceof Error && /UNIQUE constraint failed/.test(error.message)) throw new AppError("Логин занят или текущий профиль уже привязан. Выбери другой логин либо войди в существующий аккаунт.", 409);
        throw error;
      }
    } else {
      const found = await database.prepare("SELECT id,username,password_hash,owner_id,legacy_id,created_at FROM accounts WHERE username=?").bind(username).first<AccountRow>();
      const valid = await verifyPassword(password, found?.password_hash || dummyPasswordHash);
      if (!found || !valid) throw new AppError("Неверный логин или пароль.", 401);
      account = found;
      await database.batch([
        clearCurrent(),
        database.prepare("INSERT INTO auth_sessions(token_hash,account_id,created_at,expires_at) VALUES(?,?,?,?)").bind(tokenHash(token), account.id, now, now + SESSION_SECONDS * 1000),
      ]);
    }
    // Opportunistic bounded cleanup does not affect a completed sign-in if it fails.
    await database.batch([
      database.prepare("DELETE FROM auth_sessions WHERE token_hash IN (SELECT token_hash FROM auth_sessions WHERE expires_at<=? LIMIT 100)").bind(now),
      database.prepare("DELETE FROM auth_limits WHERE key IN (SELECT key FROM auth_limits WHERE expires_at<=? LIMIT 100)").bind(now),
    ]).catch(() => {});
    return reply({ user: { username: account.username, displayName: account.username, provider: "password", canLinkProgress: false } }, body.action === "register" ? 201 : 200, sessionCookie(req, token));
  } catch (error) { return fail(error); }
}
