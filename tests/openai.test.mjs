import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError, requestModel } from "../lib/openai.ts";

const common = { key: "test-credential", model: "gpt-6-astra", instructions: "Верни JSON по указанной структуре." };
const completed = text => Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text }] }] });

test("both course generation and project grading satisfy the Responses JSON input requirement", async t => {
  const inputs = [
    { topic: "Go", goal: "научиться кодить на голанг", schemaExample: { title: "Маршрут" } },
    { project: { title: "Карточка участника" }, submission: "print('Привет')" },
  ];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    const body = JSON.parse(options.body);
    // Emulate the provider's guard that rejected the original production request.
    if (!/json/i.test(body.input)) return Response.json({ error: { type: "invalid_request_error", param: "input" } }, { status: 400 });
    assert.equal(body.text.format.type, "json_object");
    assert.equal(body.store, false);
    assert.equal(body.model, "gpt-6-astra");
    assert.deepEqual(JSON.parse(body.input.slice(body.input.indexOf("{"))), inputs.shift());
    return completed('{"ok":true}');
  });
  for (const input of [...inputs]) {
    assert.deepEqual(JSON.parse(await requestModel({ ...common, input: JSON.stringify(input), json: true })), { ok: true });
  }
  assert.equal(inputs.length, 0);
});

test("tutor chat preserves its input and plain text response", async t => {
  const input = "Объясни переменную простыми словами";
  t.mock.method(globalThis, "fetch", async (_, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.input, input);
    assert.equal(body.text, undefined);
    return completed("Переменная хранит значение.");
  });
  assert.equal(await requestModel({ ...common, input }), "Переменная хранит значение.");
});

test("bad requests give a configuration error and log only safe metadata", async t => {
  const logs = [];
  t.mock.method(console, "error", (...args) => logs.push(args));
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: { code: null, type: "invalid_request_error", param: "input", message: "private submission and credential" } }, { status: 400, headers: { "x-request-id": "req_test_123" } }));
  await assert.rejects(requestModel({ ...common, input: "private submission", json: true }), e => e instanceof AppError && e.status === 502 && e.message.includes("исправить подключение"));
  assert.deepEqual(logs, [["OpenAI request rejected", { status: 400, code: null, type: "invalid_request_error", param: "input", requestId: "req_test_123" }]]);
});

test("incomplete output cannot be used as a generated course", async t => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ status: "incomplete", output: [{ content: [{ type: "output_text", text: '{"title":' }] }] }));
  await assert.rejects(requestModel({ ...common, input: "Go", json: true }), e => e instanceof AppError && e.status === 502 && e.message.includes("не закончила"));
});

test("full assessment generation gets a bounded longer timeout without slowing other requests", async t => {
  const durations = [];
  t.mock.method(AbortSignal, "timeout", ms => { durations.push(ms); return new AbortController().signal; });
  t.mock.method(globalThis, "fetch", async () => completed('{"ok":true}'));
  await requestModel({ ...common, input: "Ten questions", json: true, maxTokens: 9500, timeoutMs: 180000 });
  await requestModel({ ...common, input: "Explain a fragment" });
  assert.deepEqual(durations, [180000, 90000]);
});
