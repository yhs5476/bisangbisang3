import assert from "node:assert/strict";
import test from "node:test";

test("renders Korean product metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<html[^>]*\blang=["']ko["']/i);
  assert.match(html, /<title>비상비상 \| 우리 가족 재난안전 습관<\/title>/i);
  assert.match(
    html,
    /<meta(?=[^>]*\bname=["']description["'])(?=[^>]*재난안전 게이미피케이션 MVP)[^>]*>/i,
  );
  assert.doesNotMatch(html, /\bname=["']codex-preview["']/i);
});
