# GPU Fit

Independent model-to-hardware planning site. The launch UI is branded **ModelFit** through `NEXT_PUBLIC_SITE_NAME`; the final brand and domain are environment-driven.

The product direction is inspired by RunMyLLM’s model/hardware decision flow, with additional production-serving inputs and a handoff to the separate GPU price site.

## Included

- Interactive weight, KV-cache, and runtime-memory estimator
- Quantization, context, concurrency, cache precision, and GPU-count controls
- GPU-fit recommendations with sample hourly cost
- Indexable model requirement pages
- Copyable vLLM starter commands
- Published formula and limitations page
- Sitemap, standalone Next.js build, and Docker image
- Result-level Flatkey Compute CTAs with model and hardware UTM attribution

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
- `NEXT_PUBLIC_GPU_PRICES_URL`: external URL of the GPU-price site
- `NEXT_PUBLIC_FLATKEY_COMPUTE_URL`: Flatkey Compute landing page (defaults to `https://flatkey.ai/compute`)

## Estimation scope

The current engine estimates inference memory. Results are labeled calculated estimates and are not benchmark guarantees. Measured runtime profiles should be stored separately with exact model revision, quantization, runtime version, GPU SKU/form factor, context, concurrency, and launch flags.
