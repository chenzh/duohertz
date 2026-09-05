import { beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { config } from "../lib/config.js";
import { prisma } from "../lib/prisma.js";
import { waitForQueueDrain } from "../services/job-queue.js";

const app = createApp();
const API_KEY = config.apiKey;

async function req(path: string, init?: RequestInit) {
  return app.fetch(new Request(`http://localhost${path}`, init));
}

beforeAll(async () => {
  process.env.MOCK_WORKERS = "true";
  await prisma.job.deleteMany();
});

describe("API MVP", () => {
  it("H-01 health without key", async () => {
    const res = await req("/v1/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("ok");
  });

  it("A-01 unauthorized", async () => {
    const res = await req("/v1/jobs", { method: "POST", body: "{}" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("A-03 create job", async () => {
    const res = await req("/v1/jobs", {
      method: "POST",
      headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "vocal_lyrics",
        style_tags: "pop",
        lyrics: "hello world test lyrics",
        duration_sec: 30,
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.job_id).toBeTruthy();
    await waitForQueueDrain();
    const get = await req(`/v1/jobs/${body.data.job_id}`, {
      headers: { "X-API-Key": API_KEY },
    });
    const job = await get.json();
    expect(job.data.status).toBe("completed");
  });

  it("V-01 invalid mode", async () => {
    const res = await req("/v1/jobs", {
      method: "POST",
      headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "invalid" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_MODE");
  });

  it("V-02 missing lyrics", async () => {
    const res = await req("/v1/jobs", {
      method: "POST",
      headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "vocal_lyrics", style_tags: "pop" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_LYRICS");
  });

  it("J-03 audio not ready", async () => {
    const created = await req("/v1/jobs", {
      method: "POST",
      headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "game_bgm",
        prompt: "test bgm",
        duration_sec: 15,
      }),
    });
    expect(created.status).toBe(201);
    const json = await created.json();
    const audio = await req(`/v1/jobs/${json.data.job_id}/audio`, {
      headers: { "X-API-Key": API_KEY },
    });
    expect([409, 200]).toContain(audio.status);
  });

  it("keeps dedicated Demo jobs separate from primary API jobs", async () => {
    const original = { demoBffEnabled: config.demoBffEnabled, demoApiKey: config.demoApiKey };
    config.demoBffEnabled = true;
    config.demoApiKey = `demo-isolation-${crypto.randomUUID()}`;
    const localFetch = vi.spyOn(globalThis, "fetch").mockImplementation((input, init) =>
      Promise.resolve(app.fetch(new Request(input, init))),
    );
    try {
      const payload = JSON.stringify({ mode: "game_bgm", prompt: "isolated mock demo", duration_sec: 15 });
      const demoCreated = await req("/demo/api/v1/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: payload,
      });
      expect(demoCreated.status).toBe(201);
      const demoId = (await demoCreated.json()).data.job_id;
      await waitForQueueDrain();
      expect((await req(`/demo/api/v1/jobs/${demoId}`)).status).toBe(200);
      expect((await req(`/demo/api/v1/jobs/${demoId}/audio`)).status).toBe(200);
      expect((await req(`/v1/jobs/${demoId}`, { headers: { "X-API-Key": API_KEY } })).status).toBe(404);

      const primaryCreated = await req("/v1/jobs", {
        method: "POST", headers: { "Content-Type": "application/json", "X-API-Key": API_KEY }, body: payload,
      });
      expect(primaryCreated.status).toBe(201);
      const primaryId = (await primaryCreated.json()).data.job_id;
      expect((await req(`/demo/api/v1/jobs/${primaryId}`)).status).toBe(404);
      expect((await req(`/demo/api/v1/jobs/${primaryId}/audio`)).status).toBe(404);
      await waitForQueueDrain();
    } finally {
      localFetch.mockRestore();
      Object.assign(config, original);
    }
  });
});
