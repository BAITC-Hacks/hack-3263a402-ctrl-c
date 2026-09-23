export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type ModelRequest = {
  key: string;
  model: string;
  instructions: string;
  input: string;
  json?: boolean;
  maxTokens?: number;
  timeoutMs?: number;
};

export async function requestModel({ key, model, instructions, input, json = false, maxTokens = 3500, timeoutMs }: ModelRequest) {
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        instructions,
        // JSON mode checks input messages even when instructions already mention JSON.
        input: json ? `Верни ответ в формате JSON по указанной структуре.\nДанные задания:\n${input}` : input,
        reasoning: { effort: "low" },
        max_output_tokens: maxTokens,
        store: false,
        ...(json ? { text: { format: { type: "json_object" } } } : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs ?? (maxTokens > 10000 ? 240000 : 90000)),
    });
  } catch {
    throw new AppError("Astra не ответила вовремя. Твой ответ сохранён в поле — попробуй ещё раз.", 504);
  }
  if (!response.ok) {
    const problem: any = await response.json().catch(() => ({}));
    const code = problem?.error?.code;
    const type = problem?.error?.type;
    // Never log credentials, prompts, submissions, or the upstream error message.
    const safeLabel = (v: unknown) => typeof v === "string" && /^[\w.[\]-]{1,120}$/.test(v) ? v : null;
    console.error("OpenAI request rejected", {
      status: response.status,
      code: safeLabel(code),
      type: safeLabel(type),
      param: safeLabel(problem?.error?.param),
      requestId: safeLabel(response.headers.get("x-request-id")),
    });
    if (code === "credit_balance_exhausted" || type === "insufficient_quota" || code === "insufficient_quota")
      throw new AppError("На балансе OpenAI API закончились средства или достигнут лимит расходов. Пополни баланс API или проверь лимиты проекта. Твои материалы и прогресс сохранены.", 402);
    if (response.status === 401)
      throw new AppError("Ключ Astra недействителен. Проверь подключение в настройках сайта.", 502);
    if (response.status === 403 || code === "model_not_found")
      throw new AppError("У выбранного проекта нет доступа к Astra. Проверь доступ к модели в OpenAI.", 502);
    if (response.status === 400)
      throw new AppError("Не удалось отправить запрос к Astra: нужно исправить подключение на сайте. Твои данные сохранены в форме.", 502);
    throw new AppError(response.status === 429 ? "Слишком много запросов к Astra. Подожди немного и попробуй снова." : "Astra временно недоступна. Попробуй позже.", 502);
  }
  const data: any = await response.json();
  if (data.status !== "completed") throw new AppError("Astra не закончила ответ. Попробуй ещё раз.", 502);
  const text = data.output?.flatMap((o: any) => o.content || []).filter((c: any) => c.type === "output_text").map((c: any) => c.text).join("\n");
  if (!text) throw new AppError("Astra вернула пустой ответ. Попробуй ещё раз.", 502);
  return text as string;
}
