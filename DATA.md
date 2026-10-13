# ModelFit data contract

ModelFit combines curated product metadata with architecture fields retrieved
from official Hugging Face `config.json` files. The public snapshot lives in
`data/model-configs.json`; the model allow-list and safe fallback dimensions
live in `data/model-manifest.json`.

## Refresh policy

- The scheduled workflow checks configs daily.
- Public configs are recalculated from `num_hidden_layers`,
  `num_key_value_heads`, head dimension, and maximum position embeddings.
- Gated or temporarily unavailable models retain their last-known-good record.
- The job refuses to publish when fewer than six configured models verify.
- Tests and a production build must pass before the snapshot is committed.

## KV-cache coefficient

The FP16 coefficient in GiB per 1,000 active tokens is:

```text
2 × layers × KV heads × head dimension × 2 bytes × 1,000 / 2^30
```

This coefficient is an architecture calculation, not a runtime benchmark.
Allocator behavior, static cache reservations, multimodal modules, adapters,
and runtime-specific workspace can increase measured memory.
