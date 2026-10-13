import assert from "node:assert/strict";
import test from "node:test";
import { normalizeModelConfig } from "./lib/model-config.mjs";

const manifest = { slug: "example-7b", modelId: "example/model", nativeContext: 8192, layers: 32, kvHeads: 8, headDimension: 128 };

test("derives KV-cache memory from an official Transformers config", () => {
  const result = normalizeModelConfig(manifest, {
    num_hidden_layers: 28,
    num_attention_heads: 28,
    num_key_value_heads: 4,
    hidden_size: 3584,
    max_position_embeddings: 32768,
  }, "2026-10-13T00:00:00.000Z", "https://example.test/config.json");
  assert.equal(result.headDimension, 128);
  assert.equal(result.kvHeads, 4);
  assert.equal(result.nativeContext, 32768);
  assert.equal(result.kvGiBPer1kTokens, 0.053406);
});

test("rejects incomplete configuration instead of publishing zeroes", () => {
  assert.throws(() => normalizeModelConfig({ slug: "broken", modelId: "broken/model" }, {}, "now", "source"), /invalid layers/);
});
