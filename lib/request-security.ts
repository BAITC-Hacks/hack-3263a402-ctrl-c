import { AppError } from "./openai";

export function requireBrowserMutation(req: Request) {
  if (req.headers.get("origin") !== new URL(req.url).origin || req.headers.get("sec-fetch-site") === "cross-site" || req.headers.get("x-blitz-csrf") !== "1") throw new AppError("Обнови страницу и повтори действие.", 403);
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new AppError("Неверный формат запроса.", 415);
}
