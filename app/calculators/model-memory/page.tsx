import type { Metadata } from "next";
import Link from "next/link";
import { ModelMemoryCalculator } from "@/components/specialized-calculators";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "LLM model memory calculator",
  description: "Estimate raw and packed LLM weight memory from parameter count and precision, with runtime workspace and operating headroom shown separately.",
  alternates: { canonical: "/calculators/model-memory" },
  openGraph: { title: "LLM model memory calculator", description: "Estimate the GPU memory floor for custom model weights.", url: "/calculators/model-memory", type: "website" },
};

export default function ModelMemoryPage() {
  const schema = { "@context": "https://schema.org", "@type": "WebApplication", name: "LLM model memory calculator", url: absoluteUrl("/calculators/model-memory"), applicationCategory: "DeveloperApplication", operatingSystem: "Web", description: metadata.description };
  return <main className="tool-page frame specialized-tool-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><div className="crumbs"><Link href="/">Home</Link><span>/</span><Link href="/calculators">Calculators</Link><span>/</span><strong>Model memory</strong></div><header className="tool-page-header"><span className="section-index">Parameters × precision</span><h1>Model weight<br /><em>memory calculator.</em></h1><p>Estimate the memory floor for a custom checkpoint before its full architecture metadata is available.</p></header><ModelMemoryCalculator /><section className="calculator-explainer"><article><span>Weight formula</span><h2>Parameter count sets the storage floor.</h2><p>Raw weight memory is parameters multiplied by bits per weight. Format overhead accounts for scales, metadata and higher-precision tensors; the exact artifact can still differ.</p><code>GiB = parameters × bits ÷ 8 ÷ 2³⁰</code></article><article><span>Why KV is excluded</span><h2>Parameters cannot predict serving cache.</h2><p>Two models with the same parameter count can have different layer counts, KV heads and head dimensions. Supplying a fake cache estimate would make the result look more complete and less trustworthy.</p><Link href="/calculators/kv-cache">Use an architecture-aware cache estimate →</Link></article><article><span>Next step</span><h2>Replace the generic estimate when the model is known.</h2><p>Select a verified model in the full worksheet to add context, concurrency, cache precision and multi-GPU sharding.</p><Link href="/calculator">Open the full VRAM calculator →</Link></article></section></main>;
}
