import type { Metadata } from "next";
import Link from "next/link";
import { MultiGpuCalculator } from "@/components/specialized-calculators";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "LLM multi-GPU calculator",
  description: "Estimate the minimum 1, 2, 4, or 8 GPU topology for an LLM workload using model weights, KV cache, runtime workspace, and an 85% memory ceiling.",
  alternates: { canonical: "/calculators/multi-gpu" },
  openGraph: { title: "LLM multi-GPU calculator", description: "Plan a memory-fit tensor-parallel topology for LLM inference.", url: "/calculators/multi-gpu", type: "website" },
};

export default function MultiGpuPage() {
  const schema = { "@context": "https://schema.org", "@type": "WebApplication", name: "LLM multi-GPU calculator", url: absoluteUrl("/calculators/multi-gpu"), applicationCategory: "DeveloperApplication", operatingSystem: "Web", description: metadata.description };
  return <main className="tool-page frame specialized-tool-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><div className="crumbs"><Link href="/">Home</Link><span>/</span><Link href="/calculators">Calculators</Link><span>/</span><strong>Multi-GPU</strong></div><header className="tool-page-header"><span className="section-index">Memory-fit topology</span><h1>Multi-GPU<br /><em>calculator.</em></h1><p>Compare 1×, 2×, 4× and 8× tensor-parallel plans against a consistent per-GPU memory ceiling.</p></header><MultiGpuCalculator /><section className="calculator-explainer"><article><span>Fit rule</span><h2>Advertised VRAM is not the planning budget.</h2><p>A topology passes only when estimated per-device weights, cache and workspace remain within 85% of the selected GPU&apos;s advertised memory. The remainder protects runtime variance.</p><Link href="/methodology">Review all assumptions →</Link></article><article><span>Not a speed benchmark</span><h2>Memory fit does not guarantee good throughput.</h2><p>Interconnect, collective communication, kernel support, batch scheduling and host topology can dominate performance. Treat the result as a capacity filter before benchmarking.</p><Link href="/hardware">Compare GPU profiles →</Link></article><article><span>Tensor-parallel detail</span><h2>Weights and cache shard differently.</h2><p>Weights divide by GPU count in this planning model. KV cache divides only up to the model&apos;s KV-head count, while a minimum per-device workspace remains.</p><Link href="/calculators/kv-cache">Inspect KV cache separately →</Link></article></section></main>;
}
