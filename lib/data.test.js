import { describe, expect, test } from "bun:test";
import { estimateMemory, estimatePerDeviceMemory, getModel, quantizations } from "./data";

const bf16 = quantizations.find((entry) => entry.id === "bf16");
const q4 = quantizations.find((entry) => entry.id === "q4");

describe("KV-cache estimates", () => {
  test("Phi-3 Mini reaches about 48 GiB at 128K FP16 KV", () => {
    const model = getModel("phi-3-mini-128k-instruct");
    const estimate = estimateMemory(model, bf16, 131072, 1);
    expect(estimate.kvGiB).toBeCloseTo(48, 3);
  });

  test("Gemma 2 9B applies its 4K window to half of the layers", () => {
    const model = getModel("gemma-2-9b-it");
    const estimate = estimateMemory(model, bf16, 8192, 1);
    expect(estimate.kvGiB).toBeCloseTo(1.96875, 4);
  });

  test("KV sharding stops at the configured KV-head count", () => {
    const model = getModel("qwen25-7b-instruct");
    const estimate = estimateMemory(model, q4, 8192, 1);
    const perDevice = estimatePerDeviceMemory(model, estimate, 8);
    expect(perDevice.kvShardCount).toBe(4);
    expect(perDevice.kvGiB).toBeCloseTo(estimate.kvGiB / 4, 8);
    expect(perDevice.subtotalGiB).toBeCloseTo(
      perDevice.weightGiB + perDevice.kvGiB + perDevice.workspaceGiB,
      8,
    );
  });
});
