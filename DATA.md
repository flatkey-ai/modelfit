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

Set `HUGGING_FACE_TOKEN` in the refresh environment to verify gated official
repositories. Without it, ModelFit keeps the last successfully verified record
and labels that state on the public profile instead of presenting stale data as
newly verified.

## GPU price policy

- Hardware rates are fetched from the public Flatkey GPU price index and cached
  for one hour.
- Each indexed rate carries its sample count, observed range, source URL, and
  update time on the hardware profile.
- SKUs without a matching live market use a clearly labeled ModelFit reviewed
  reference with a review date.
- Prices are planning inputs rather than quotes; provider configuration, region,
  availability, taxes, commitments, and topology can change checkout pricing.
- If the live endpoint is unavailable, the site remains usable with reviewed
  references rather than failing the calculator request.

## KV-cache coefficient

The FP16 coefficient in GiB per 1,000 active tokens is:

```text
2 × layers × KV heads × head dimension × 2 bytes × 1,000 / 2^30
```

This coefficient is an architecture calculation, not a runtime benchmark.
Allocator behavior, static cache reservations, multimodal modules, adapters,
and runtime-specific workspace can increase measured memory.
