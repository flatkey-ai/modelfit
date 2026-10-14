import type { Metadata } from "next";
import { modelConfigGeneratedAt, modelFitFormulaVersion } from "@/lib/data";

export const metadata: Metadata = {
  title: "Memory estimation methodology",
  description: "How ModelFit estimates LLM weight memory, KV cache, runtime workspace, and safe GPU headroom.",
  alternates: { canonical: "/methodology" },
  openGraph: { title: "LLM memory estimation methodology", description: "See the formulas and limits behind ModelFit's LLM VRAM estimates.", url: "/methodology", type: "article" },
  twitter: { card: "summary", title: "LLM memory estimation methodology", description: "See the formulas and limits behind ModelFit's LLM VRAM estimates." },
};

export default function MethodologyPage() {
  const refreshedAt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(modelConfigGeneratedAt));
  return (
    <main className="method-page frame">
      <header><span className="section-index">Formula v{modelFitFormulaVersion} · configs checked {refreshedAt}</span><h1>Useful estimates<br /><em>show their work.</em></h1><p>ModelFit separates the three memory buckets that dominate inference planning, then applies explicit headroom instead of pretending the board’s advertised capacity is fully usable.</p></header>
      <div className="method-grid">
        <aside><strong>Contents</strong><a href="#weights">01 · Model weights</a><a href="#cache">02 · KV cache</a><a href="#runtime">03 · Runtime</a><a href="#fit">04 · Fit verdict</a><a href="#limits">05 · Limits</a></aside>
        <div className="method-content">
          <section id="weights"><span>01</span><h2>Model weights</h2><p>Raw weight memory is parameter count multiplied by bytes per parameter. An overhead multiplier accounts for quantization scales, metadata, and modules retained at higher precision.</p><code>weights = parameters × bits / 8 × format_overhead</code></section>
          <section id="cache"><span>02</span><h2>KV cache</h2><p>KV cache grows with context, concurrent sequences, layers, KV heads, head dimension, and cache precision. A daily public-data job reads each model’s official Hugging Face configuration and recalculates the FP16 coefficient: two tensors (keys and values) multiplied by layers, KV heads, head dimension, and two bytes per element. If a gated model cannot be checked, ModelFit retains the last-known-good snapshot instead of publishing zeroes or guesses. For Gemma 2, the estimate also models its alternating local/global attention by capping the local-layer share at the 4K sliding window while global layers continue to grow.</p><code>kv = architecture_bytes_per_token × effective_cached_tokens × concurrency × precision_factor</code></section>
          <section id="runtime"><span>03</span><h2>Runtime workspace</h2><p>The launch estimator reserves the larger of 2 GiB or 10% of weight memory for kernels, graph capture, temporary buffers, and allocator behavior. Exact requirements vary by runtime and version.</p></section>
          <section id="fit"><span>04</span><h2>Fit verdict</h2><p>The directory’s planning ceiling targets no more than 85% of advertised VRAM. The interactive worksheet also shows nearby options: below 80% is labeled comfortable, 80–92% is a tight fit, and above 92% is rejected. A tight fit can fall above the recommended 85% target and should not be read as equivalent to the directory ceiling.</p><div className="fit-scale"><i /><i /><i /><span>comfortable</span><span>tight</span><span>reject</span></div></section>
          <section id="limits"><span>05</span><h2>What the estimate does not promise</h2><p>It is not a speed benchmark and does not yet model multimodal encoders, adapters, speculative decoding, CUDA graph profiles, pipeline parallelism, CPU offload, fragmentation, or provider-reserved memory. Cache allocation is runtime-specific: some engines reserve blocks or a full static pool differently, and a runtime that does not honor hybrid/sliding cache behavior can use more memory than the Gemma 2 estimate. Production decisions should be validated on the intended runtime and exact hardware.</p><div className="method-callout"><strong>Confidence</strong><span>Current results are architecture-derived planning estimates, not measured peaks. Future measured profiles will be labeled separately rather than blended into the formula.</span></div></section>
        </div>
      </div>
    </main>
  );
}
