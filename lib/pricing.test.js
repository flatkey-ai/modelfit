import { afterEach, expect, test } from "bun:test";
import { getHardwarePriceSnapshot } from "./pricing";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("merges covered live GPU markets with labeled reviewed references", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: true,
    data: {
      updated_at: 1_760_400_000,
      methodology: "Hourly public-market median",
      items: [{
        gpu_model: "H100",
        realtime: { price: 2.49, low: 1.9, high: 3.2, samples: 12, source: "Public market index" },
      }],
    },
  }), { status: 200 });

  const snapshot = await getHardwarePriceSnapshot();

  expect(snapshot.prices["nvidia-h100-80gb"]).toMatchObject({
    kind: "live-index",
    price: 2.49,
    low: 1.9,
    high: 3.2,
    samples: 12,
  });
  expect(snapshot.prices["nvidia-t4-16gb"]).toMatchObject({
    kind: "reference",
    source: "ModelFit reviewed reference",
  });
});

test("keeps the calculator usable when the live price endpoint is unavailable", async () => {
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });

  const snapshot = await getHardwarePriceSnapshot();

  expect(snapshot.prices["nvidia-h100-80gb"].kind).toBe("reference");
  expect(snapshot.updatedAt).toBe("2026-10-14T00:00:00.000Z");
});
