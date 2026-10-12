import type { Metadata } from "next";
import Link from "next/link";
import { estimateMemory, models, quantizations } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "LLM model VRAM requirements",
  description: "Compare parameter counts, context windows, Q4 memory estimates, and GPU planning notes for popular open LLMs.",
  alternates: { canonical: "/models" },
  openGraph: {
    title: "LLM model VRAM requirements and GPU fit",
    description: "A practical directory of open-model memory estimates, context limits, and GPU requirements.",
    url: "/models",
    type: "website",
  },
  twitter: { card: "summary", title: "LLM model VRAM requirements and GPU fit", description: "A practical directory of open-model memory estimates, context limits, and GPU requirements." },
};

const q4 = quantizations.find((entry) => entry.id === "q4")!;

function q4Estimate(slug: string) {
  const model = models.find((entry) => entry.slug === slug)!;
  return estimateMemory(model, q4, Math.min(8192, model.nativeContext), 1).subtotalGiB;
}

export default function ModelsIndexPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Open LLM GPU and VRAM requirements",
    numberOfItems: models.length,
    itemListElement: models.map((model, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: model.name,
      url: absoluteUrl(`/models/${model.slug}`),
    })),
  };

  return (
    <main className="directory-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <section className="directory-hero frame">
        <div className="crumbs"><Link href="/">Home</Link><span>/</span><strong>Models</strong></div>
        <div className="directory-title">
          <div><span className="directory-stat-badge"><b>{models.length}</b> model profiles</span><h1>LLM VRAM<br /><em>requirements.</em></h1></div>
          <div className="directory-lede"><p>Start with the model, not the GPU. Compare parameter count, native context, architecture, and a consistent 4-bit memory estimate before tuning the workload.</p><Link href="/calculator">Open the interactive calculator →</Link></div>
        </div>
      </section>

      <section className="directory-content frame">
        <div className="directory-note"><strong>Reading the table</strong><p>Q4 estimates use one 8K sequence plus runtime workspace. They are planning estimates—not measured throughput—and the exact runtime, quantization method, adapters, and graph capture can change real usage.</p></div>
        <div className="directory-table" role="table" aria-label="LLM model VRAM requirements">
          <div className="directory-table-head" role="row"><span>Model</span><span>Parameters</span><span>Native context</span><span>Q4 · 8K estimate</span><span>Profile</span></div>
          {models.map((model) => (
            <Link className="directory-table-row" href={`/models/${model.slug}`} role="row" key={model.slug}>
              <span className="directory-name"><strong>{model.name}</strong><small>{model.maker} · {model.architecture}</small></span>
              <span data-label="Parameters">{model.parametersB}B</span>
              <span data-label="Native context">{Math.round(model.nativeContext / 1024)}K</span>
              <span data-label="Q4 · 8K estimate">~{q4Estimate(model.slug).toFixed(1)} GiB</span>
              <span className="directory-arrow">View →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="editorial-split frame">
        <article><span>01 / Weights</span><h2>Parameters set the floor.</h2><p>Weight memory is driven by parameter count and precision. Moving from BF16 to a 4-bit format can cut the raw weight footprint by roughly four times, but metadata and higher-precision layers mean the final reduction is not perfectly linear.</p><Link href="/guides/llm-vram-calculator">Learn how to calculate LLM VRAM →</Link></article>
        <article><span>02 / Workload</span><h2>Context changes the answer.</h2><p>KV cache grows with sequence length and concurrent requests. A model that fits comfortably for an 8K single-user test can need materially more memory at 32K context or production concurrency.</p><Link href="/guides/context-window-vram">Understand context and KV cache →</Link></article>
      </section>

      <section className="directory-cta">
        <div className="frame"><div><span className="section-index">Model chosen?</span><h2>Turn the model into a fit plan.</h2><p>Set context and concurrency in the calculator, then compare the recommended memory envelope with the hardware directory.</p></div><div><Link href="/calculator">Calculate VRAM</Link><Link href="/hardware">Compare GPU profiles</Link></div></div>
      </section>
    </main>
  );
}
