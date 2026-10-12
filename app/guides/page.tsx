import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LLM deployment and VRAM guides",
  description: "Practical guides to LLM VRAM calculation, quantization, context windows, KV cache, and choosing GPU capacity for inference.",
  alternates: { canonical: "/guides" },
  openGraph: { title: "LLM deployment and VRAM guides", description: "Understand the memory decisions behind local and cloud LLM inference.", url: "/guides", type: "website" },
  twitter: { card: "summary", title: "LLM deployment and VRAM guides", description: "Understand the memory decisions behind local and cloud LLM inference." },
};

const guides = [
  {
    number: "01",
    href: "/guides/llm-vram-calculator",
    eyebrow: "Weights + overhead + headroom",
    title: "How much VRAM does an LLM need?",
    description: "A complete calculation method for model weights, quantization overhead, KV cache, runtime workspace, and a safe deployment margin.",
    tags: ["VRAM calculator", "quantization", "local LLM"],
  },
  {
    number: "02",
    href: "/guides/context-window-vram",
    eyebrow: "Context + concurrency + cache precision",
    title: "How context windows use GPU memory",
    description: "See why KV cache grows with tokens and concurrent sequences—and why the model’s maximum context is not always the practical serving target.",
    tags: ["KV cache", "context window", "concurrency"],
  },
];

export default function GuidesIndexPage() {
  return (
    <main className="guides-index-page">
      <section className="directory-hero frame">
        <div className="crumbs"><Link href="/">Home</Link><span>/</span><strong>Guides</strong></div>
        <div className="directory-title">
          <div><span className="directory-stat-badge"><b>{guides.length}</b> deployment guides</span><h1>Understand<br /><em>the estimate.</em></h1></div>
          <div className="directory-lede"><p>Short answers are useful, but capacity decisions need the reasoning behind them. These guides explain the inputs that move LLM memory and GPU fit.</p><Link href="/methodology">Review the calculation methodology →</Link></div>
        </div>
      </section>

      <section className="guide-card-list frame">
        {guides.map((guide) => (
          <Link className="guide-feature-card" href={guide.href} key={guide.href}>
            <span className="guide-number">{guide.number}</span>
            <div><small>{guide.eyebrow}</small><h2>{guide.title}</h2><p>{guide.description}</p><ul>{guide.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul></div>
            <b>Read guide ↗</b>
          </Link>
        ))}
      </section>

      <section className="guide-path frame">
        <div><span className="section-index">A practical sequence</span><h2>From a model name<br />to a GPU request.</h2></div>
        <ol><li><span>01</span><strong>Estimate the weight floor</strong><p>Use parameter count and the actual storage precision.</p></li><li><span>02</span><strong>Add workload memory</strong><p>Set context, concurrency, cache precision, and runtime overhead.</p></li><li><span>03</span><strong>Leave usable headroom</strong><p>A fit at 100% of advertised VRAM is not a stable operating plan.</p></li><li><span>04</span><strong>Validate and source</strong><p>Test the real runtime, then request matching capacity.</p></li></ol>
      </section>

      <section className="directory-cta"><div className="frame"><div><span className="section-index">Skip to your workload</span><h2>Use the interactive worksheet.</h2><p>Choose a model and change the exact inputs that affect its memory envelope.</p></div><div><Link href="/calculator">Open VRAM calculator</Link><Link href="/hardware">Compare GPU profiles</Link></div></div></section>
    </main>
  );
}
