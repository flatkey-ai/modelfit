import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "LLM GPU calculators",
  description: "Plan LLM weight memory, KV cache, multi-GPU topology, and total VRAM with transparent formulas and explicit assumptions.",
  alternates: { canonical: "/calculators" },
  openGraph: { title: "LLM GPU calculators", description: "Transparent calculators for LLM memory and GPU planning.", url: "/calculators", type: "website" },
};

const tools = [
  { href: "/calculator", index: "01", label: "Full deployment worksheet", title: "LLM VRAM calculator", copy: "Combine model weights, context, concurrent sequences, KV precision, runtime workspace, GPU count and operating headroom.", tags: ["Total VRAM", "GPU fit", "vLLM command"] },
  { href: "/calculators/kv-cache", index: "02", label: "Architecture-aware cache", title: "KV cache calculator", copy: "Isolate how context length, active sequences, cache precision and KV-head sharding change serving memory.", tags: ["Context", "Concurrency", "FP8 cache"] },
  { href: "/calculators/multi-gpu", index: "03", label: "Topology planning", title: "Multi-GPU calculator", copy: "Estimate the smallest 1×, 2×, 4× or 8× topology that fits a selected model and GPU memory profile.", tags: ["Tensor parallel", "GPU count", "85% ceiling"] },
  { href: "/calculators/model-memory", index: "04", label: "Unknown checkpoints", title: "Model weight memory calculator", copy: "Estimate the weight-loading floor for a custom parameter count and precision when the model is not yet in the directory.", tags: ["Parameters", "Quantization", "Weight floor"] },
];

export default function CalculatorsPage() {
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "ModelFit LLM GPU calculators", url: absoluteUrl("/calculators"), hasPart: tools.map((tool) => ({ "@type": "WebApplication", name: tool.title, url: absoluteUrl(tool.href), applicationCategory: "DeveloperApplication", operatingSystem: "Web" })) };
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <section className="directory-hero frame calculator-directory-hero">
        <div className="directory-title"><div><span className="section-index">Four auditable tools</span><h1>LLM GPU<br /><em>calculators.</em></h1></div><p>Start with the narrowest question you can answer reliably. Each tool exposes its formula, omits unknowns instead of inventing them, and links back to the full deployment worksheet.</p></div>
      </section>
      <section className="frame calculator-card-list">{tools.map((tool) => <Link href={tool.href} className="calculator-card" key={tool.href}><span>{tool.index}</span><div><small>{tool.label}</small><h2>{tool.title}</h2><p>{tool.copy}</p><ul>{tool.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul></div><b>Open calculator ↗</b></Link>)}</section>
      <section className="directory-cta"><div className="frame"><div><span className="section-index">One calculation is not a benchmark</span><h2>Validate the chosen envelope.</h2><p>Use the tools to narrow the topology, then test the exact runtime, checkpoint and GPU before committing capacity.</p></div><div><Link href="/methodology">Read the methodology</Link><Link href="/hardware">Compare GPU profiles</Link></div></div></section>
    </main>
  );
}
