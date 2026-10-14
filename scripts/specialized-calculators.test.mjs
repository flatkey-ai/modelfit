import { describe, expect, test } from "bun:test";
import { estimateCustomModelWeightMemory, estimateKvCache, models, quantizations } from "../lib/data.ts";

describe("specialized calculator formulas", () => {
  test("FP8 halves architecture-aware KV cache", () => {
    const model = models.find((entry) => entry.slug === "llama-31-8b-instruct");
    const fp16 = estimateKvCache(model, 32768, 4, "fp16");
    const fp8 = estimateKvCache(model, 32768, 4, "fp8");
    expect(fp8).toBeCloseTo(fp16 / 2, 8);
  });

  test("custom weight floor keeps packing, workspace and headroom explicit", () => {
    const q4 = quantizations.find((entry) => entry.id === "q4");
    const estimate = estimateCustomModelWeightMemory(13, q4);
    expect(estimate.packedGiB).toBeGreaterThan(estimate.rawGiB);
    expect(estimate.workspaceGiB).toBeGreaterThanOrEqual(2);
    expect(estimate.recommendedGiB).toBeGreaterThan(estimate.packedGiB + estimate.workspaceGiB);
  });
});
