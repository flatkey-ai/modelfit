import { describe, expect, test } from "bun:test";
import { estimateMemory, estimatePerDeviceMemory, models, quantizations } from "../lib/data.ts";

describe("ModelFit estimator golden samples", () => {
  test("Llama 3.1 8B Q4 at 8K remains within the published v1 envelope", () => {
    const model = models.find((entry) => entry.slug === "llama-31-8b-instruct");
    const quantization = quantizations.find((entry) => entry.id === "q4");
    const result = estimateMemory(model, quantization, 8192, 1);
    expect(result.weightGiB).toBeCloseTo(4.3213, 3);
    expect(result.kvGiB).toBeCloseTo(1, 1);
    expect(result.workspaceGiB).toBe(2);
    expect(result.recommendedGiB).toBeCloseTo(8.59, 1);
  });

  test("FP8 cache halves cache memory without changing weight memory", () => {
    const model = models.find((entry) => entry.slug === "llama-31-70b-instruct");
    const quantization = quantizations.find((entry) => entry.id === "q4");
    const fp16 = estimateMemory(model, quantization, 32768, 4, "fp16");
    const fp8 = estimateMemory(model, quantization, 32768, 4, "fp8");
    expect(fp8.weightGiB).toBe(fp16.weightGiB);
    expect(fp8.kvGiB).toBeCloseTo(fp16.kvGiB / 2, 6);
  });

  test("tensor parallelism never shards KV cache past the KV-head count", () => {
    const model = models.find((entry) => entry.slug === "qwen25-7b-instruct");
    const quantization = quantizations.find((entry) => entry.id === "q4");
    const estimate = estimateMemory(model, quantization, 8192, 1);
    expect(estimatePerDeviceMemory(model, estimate, 8).kvShardCount).toBe(4);
  });
});
