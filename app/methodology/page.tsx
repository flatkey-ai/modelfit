import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Memory estimation methodology",
  description: "How ModelFit estimates LLM weight memory, KV cache, runtime workspace, and safe GPU headroom.",
};

export default function MethodologyPage() {
  return (
    <main className="method-page frame">
      <div className="crumbs"><Link href="/">Home</Link><span>/</span><strong>Methodology</strong></div>
      <header><span className="section-index">Calculation notes / v0.1</span><h1>Useful estimates<br /><em>show their work.</em></h1><p>ModelFit separates the three memory buckets that dominate inference planning, then applies explicit headroom instead of pretending the board’s advertised capacity is fully usable.</p></header>
      <div className="method-grid">
        <aside><strong>Contents</strong><a href="#weights">01 · Model weights</a><a href="#cache">02 · KV cache</a><a href="#runtime">03 · Runtime</a><a href="#fit">04 · Fit verdict</a><a href="#limits">05 · Limits</a></aside>
        <div className="method-content">
          <section id="weights"><span>01</span><h2>Model weights</h2><p>Raw weight memory is parameter count multiplied by bytes per parameter. An overhead multiplier accounts for quantization scales, metadata, and modules retained at higher precision.</p><code>weights = parameters × bits / 8 × format_overhead</code></section>
          <section id="cache"><span>02</span><h2>KV cache</h2><p>KV cache grows with context, concurrent sequences, layers, KV heads, head dimension, and cache precision. Grouped-query attention can materially reduce this footprint, so model records carry a model-specific per-token estimate.</p><code>kv = cache_per_token × context × concurrency × precision_factor</code></section>
          <section id="runtime"><span>03</span><h2>Runtime workspace</h2><p>The launch estimator reserves the larger of 2 GiB or 10% of weight memory for kernels, graph capture, temporary buffers, and allocator behavior. Exact requirements vary by runtime and version.</p></section>
          <section id="fit"><span>04</span><h2>Fit verdict</h2><p>A recommendation targets no more than 85% of advertised VRAM. Below 80% is labeled comfortable; 80–92% is a tight fit; above 92% is rejected in the current interface.</p><div className="fit-scale"><i /><i /><i /><span>comfortable</span><span>tight</span><span>reject</span></div></section>
          <section id="limits"><span>05</span><h2>What the estimate does not promise</h2><p>It is not a speed benchmark and does not yet model multimodal encoders, adapters, speculative decoding, CUDA graph profiles, pipeline parallelism, CPU offload, fragmentation, or provider-reserved memory. Production decisions should be validated on the intended runtime and exact hardware.</p><div className="method-callout"><strong>Confidence</strong><span>Current results are calculated estimates. Future measured profiles will be labeled separately rather than blended into the formula.</span></div></section>
        </div>
      </div>
    </main>
  );
}
