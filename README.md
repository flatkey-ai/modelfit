# GPU Fit

Independent model-to-hardware planning site. The launch UI is branded **ModelFit** through `NEXT_PUBLIC_SITE_NAME`; the final brand and domain are environment-driven.

The product direction is inspired by RunMyLLM’s model/hardware decision flow, with additional production-serving inputs, internal hardware profiles, and a selective compute handoff after the fit result.

## Included

- Interactive weight, KV-cache, and runtime-memory estimator
- Quantization, context, concurrency, cache precision, and GPU-count controls
- GPU-fit recommendations with sample hourly cost
- Model directory plus 11 indexable model requirement pages
- GPU hardware directory plus 9 model-fit profile pages
- Substantial VRAM-calculation and context-window guides with FAQs
- Copyable vLLM command templates with explicit checkpoint and backend caveats
- Published formula and limitations page
- Per-page canonical metadata, structured data, sitemap, robots policy, standalone Next.js build, and Docker image
- One result-level Flatkey Compute CTA on eligible calculator, model-fit, and hardware-fit pages, with model and hardware UTM attribution

## Local development

```bash
bun install
bun run dev -- --port 3001
```

Open <http://localhost:3001>.

## Production build

```bash
bun run typecheck
bun run build
PORT=3001 node .next/standalone/server.js
```

Or build and run the included Dockerfile with `-e PORT=3001 -p 3001:3001`.

## Configuration

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SITE_URL`: canonical production origin
- `NEXT_PUBLIC_SITE_NAME`: final public brand
- `NEXT_PUBLIC_FLATKEY_COMPUTE_URL`: Flatkey Compute product entry (defaults to `https://console.flatkey.ai/compute/market`)

## Estimation scope

The current engine estimates inference memory. Results are labeled calculated estimates and are not benchmark guarantees. Measured runtime profiles should be stored separately with exact model revision, quantization, runtime version, GPU SKU/form factor, context, concurrency, and launch flags.
