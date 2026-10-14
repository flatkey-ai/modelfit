import type { Metadata } from "next";
import Link from "next/link";
import { KvCacheCalculator } from "@/components/specialized-calculators";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "LLM KV cache calculator",
  description: "Calculate LLM KV cache memory by model architecture, context length, active sequences, FP16 or FP8 precision, and tensor-parallel GPU count.",
  alternates: { canonical: "/calculators/kv-cache" },
  openGraph: { title: "LLM KV cache calculator", description: "Estimate architecture-aware KV cache memory for LLM inference.", url: "/calculators/kv-cache", type: "website" },
};

export default function KvCachePage() {
  const schema = { "@context": "https://schema.org", "@type": "WebApplication", name: "LLM KV cache calculator", url: absoluteUrl("/calculators/kv-cache"), applicationCategory: "DeveloperApplication", operatingSystem: "Web", description: metadata.description };
  return <main className="tool-page frame specialized-tool-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><div className="crumbs"><Link href="/">Home</Link><span>/</span><Link href="/calculators">Calculators</Link><span>/</span><strong>KV cache</strong></div><header className="tool-page-header"><span className="section-index">Context × concurrency × architecture</span><h1>KV cache<br /><em>calculator.</em></h1><p>Isolate the serving-memory component that grows with active tokens. Model weights are deliberately excluded from this result.</p></header><KvCacheCalculator /><section className="calculator-explainer"><article><span>Formula</span><h2>Cache memory follows architecture, not parameter count.</h2><p>ModelFit uses the verified layer count, KV-head count and head dimension condensed into a per-1K-token coefficient. It then applies effective context, concurrent sequences and the selected cache precision.</p><code>KV GiB = coefficient × effective tokens ÷ 1,000 × sequences × precision</code></article><article><span>Sharding limit</span><h2>More GPUs do not split cache forever.</h2><p>Tensor parallelism can shard cache across ranks, but the useful shard count is capped by the model&apos;s KV-head count. The tool displays that cap instead of assuming perfect division.</p><Link href="/guides/context-window-vram">Read the context-window guide →</Link></article><article><span>Known omissions</span><h2>Keep allocator and prefix-cache margins visible.</h2><p>Runtime fragmentation, CUDA graphs, prefix caching, speculative decoding and multimodal inputs are stack-dependent. Add them during load testing rather than hiding them in the cache formula.</p><Link href="/calculator">Calculate the full VRAM envelope →</Link></article></section></main>;
}
