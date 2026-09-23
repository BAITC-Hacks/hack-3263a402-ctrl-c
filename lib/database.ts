import { env } from "cloudflare:workers";
import { AppError } from "./openai";

export function db() {
  if (!env.DB) throw new AppError("Хранилище временно недоступно. Попробуй ещё раз.", 503);
  return env.DB;
}
