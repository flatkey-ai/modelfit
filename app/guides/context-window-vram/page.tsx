import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Context window VRAM: KV cache explained",
  description: "Learn how LLM context length, KV cache precision, concurrency, and grouped-query attention change GPU memory requirements.",
  alternates: { canonical: "/guides/context-window-vram" },
  openGraph: { title: "How context windows and KV cache use VRAM", description: "Plan GPU memory for long-context LLM inference with clear formulas and examples.", url: "/guides/context-window-vram", type: "article" },
  twitter: { card: "summary", title: "How context windows and KV cache use VRAM", description: "Plan GPU memory for long-context LLM inference with clear formulas and examples." },
};

const faq = [
  { question: "Does a larger context window require more VRAM?", answer: "Yes. During inference, the KV cache retains attention keys and values for active tokens. Longer active sequences therefore consume more GPU memory, although the amount per token varies by model architecture and cache precision." },
  { question: "Does maximum context use memory even when the prompt is short?", answer: "Not always. Paged-attention runtimes can allocate cache in blocks as sequences grow, while other configurations may reserve larger pools up front. Configure the maximum sensibly and inspect the behavior of your chosen runtime." },
  { question: "What happens when concurrency doubles?", answer: "If two sequences have the same active length, their KV cache requirement is approximately additive. Doubling concurrent active tokens can roughly double the cache component, though weights are shared." },
  { question: "Does FP8 KV cache cut total VRAM in half?", answer: "It can approximately halve the KV-cache component compared with FP16, not the model weights or all runtime memory. Support, accuracy, and performance depend on model, GPU, and runtime." },
  { question: "Why do GQA models use less KV cache?", answer: "Grouped-query attention uses fewer key/value heads than query heads, reducing the cached key and value tensors per token compared with standard multi-head attention." },
];

export default function ContextGuidePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "TechArticle", headline: "How context windows and KV cache use VRAM", description: metadata.description, url: absoluteUrl("/guides/context-window-vram"), about: ["KV cache", "LLM context window", "GPU memory"] },
      { "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    ],
  };

  return (
    <main className="guide-page context-guide">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article>
        <header className="guide-hero frame">
          <div className="crumbs"><Link href="/">Home</Link><span>/</span><Link href="/guides">Guides</Link><span>/</span><strong>Context window VRAM</strong></div>
          <div className="guide-hero-grid"><div><span className="section-index">Guide 02 / KV cache planning</span><h1>Context costs<br /><em>memory.</em></h1></div><div><p className="guide-deck">The model may fit, yet the workload may not. Learn how active tokens, concurrent sequences, attention architecture, and cache precision change VRAM.</p><div className="guide-meta"><span>10 min read</span><span>Long context</span><span>KV cache</span></div></div></div>
        </header>

        <div className="article-layout frame">
          <aside className="article-toc"><strong>On this page</strong><a href="#concept">KV cache</a><a href="#formula">Formula</a><a href="#scaling">Context scaling</a><a href="#concurrency">Concurrency</a><a href="#reduce">Reduce memory</a><a href="#faq">FAQ</a></aside>
          <div className="article-content">
            <section className="article-lead"><p>Context length is not only a model capability. During autoregressive inference, every active sequence creates a growing memory record used by attention. That record—the KV cache—can become the difference between a comfortable fit and an out-of-memory failure.</p><p>The important number is active tokens across the workload, not simply the maximum context printed on a model card. A 128K-capable model serving 4K requests has a different memory profile from the same model serving multiple 64K conversations.</p></section>

            <section id="concept"><div className="article-heading"><span>01 / The concept</span><h2>What the KV cache stores.</h2></div><p>Transformer attention calculates key and value tensors for each processed token. During generation, retaining those tensors avoids recomputing the entire prefix for every new token. The performance win costs memory: cache grows as tokens remain active.</p><div className="cache-diagram" aria-label="KV cache grows as context tokens are added"><div><span>Prompt</span>{Array.from({ length: 6 }).map((_, index) => <i key={index} />)}</div><b>+</b><div><span>Generated</span>{Array.from({ length: 4 }).map((_, index) => <i key={index} />)}</div><b>×</b><div className="cache-stack"><span>Layers</span><i /><i /><i /><i /></div></div><p>Weights are shared across requests, but each active sequence needs its own cache. That distinction matters when moving from a single-user local test to a batched or concurrent service.</p></section>

            <section id="formula"><div className="article-heading"><span>02 / The formula</span><h2>Architecture determines bytes per token.</h2></div><pre><code>KV bytes ≈ 2 × layers × KV heads × head dimension × active tokens × bytes per element × concurrent sequences</code></pre><p>The factor of two represents keys and values. Models using grouped-query attention (GQA) or multi-query attention (MQA) have fewer KV heads than standard multi-head attention, so they can cache each token more efficiently. This is why parameter count alone cannot predict context memory.</p><aside className="article-callout"><strong>Use model-specific values.</strong><p>ModelFit derives its FP16 per-token coefficients from each listed model configuration. Gemma 2 is a special case: the worksheet models alternating local/global attention and caps the local-layer share at its 4K sliding window. A runtime that reserves a full static cache or does not honor hybrid cache behavior can use more, so validate the engine you will deploy.</p></aside></section>

            <section id="scaling"><div className="article-heading"><span>03 / Context scaling</span><h2>Global-attention tokens add memory linearly.</h2></div><p>Within a fixed full-attention architecture and cache precision, doubling active context approximately doubles KV-cache memory. It does not double weight memory. Local or sliding-attention layers can plateau after their configured window while global layers continue to grow, so hybrid architectures need a layer-aware estimate.</p><div className="scaling-bars"><div><span>8K</span><i style={{ width: "12.5%" }} /><strong>1× cache</strong></div><div><span>32K</span><i style={{ width: "50%" }} /><strong>4× cache</strong></div><div><span>64K</span><i style={{ width: "100%" }} /><strong>8× cache</strong></div></div><p className="article-caption">Relative full-attention illustration for one fixed model and cache format; hybrid/sliding models can scale differently.</p><p>A model’s advertised context window describes its supported input envelope, not a recommendation to allocate the maximum for every deployment. Set the runtime maximum to match product requirements and protect it with request limits.</p></section>

            <section id="concurrency"><div className="article-heading"><span>04 / Concurrency</span><h2>Count active tokens, not users.</h2></div><p>Concurrency multiplies cache when multiple sequences are active at once. For a full-attention model, two sequences at 16K tokens have approximately the same raw cache footprint as one 32K sequence at the same precision. Hybrid local/global attention, prefix reuse, mixed prompt lengths, generated tokens, and block allocation can change that comparison, so average and peak active sequences are more useful than a simple registered-user count.</p><div className="scenario-grid"><div><span>Local chat</span><strong>1 × 8K</strong><p>Start with one active sequence and a realistic personal context.</p></div><div><span>Team endpoint</span><strong>4 × 8K</strong><p>Weights remain shared; cache grows across four active sequences.</p></div><div><span>Long document</span><strong>1 × 32K</strong><p>Similar full-attention token count, but latency and prefill behavior differ.</p></div></div></section>

            <section id="reduce"><div className="article-heading"><span>05 / Reduce memory</span><h2>Five levers before adding GPUs.</h2></div><ol className="article-steps"><li><span>01</span><div><strong>Cap context deliberately</strong><p>Do not expose the model’s maximum when the product only needs a smaller window.</p></div></li><li><span>02</span><div><strong>Control concurrent active tokens</strong><p>Use scheduling and admission limits to protect the peak cache budget.</p></div></li><li><span>03</span><div><strong>Use a supported lower-precision cache</strong><p>FP8 can reduce cache memory, but confirm runtime and hardware support.</p></div></li><li><span>04</span><div><strong>Choose an efficient attention architecture</strong><p>GQA and MQA models often use less cache per token.</p></div></li><li><span>05</span><div><strong>Test prefix caching carefully</strong><p>Shared prefixes can improve efficiency in suitable workloads, but behavior is runtime-specific.</p></div></li></ol><div className="article-next"><div><strong>Put the inputs together</strong><p>Combine weights, cache, workspace, and operating headroom.</p></div><Link href="/guides/llm-vram-calculator">Read the VRAM calculator guide →</Link></div></section>

            <section id="faq"><div className="article-heading"><span>FAQ</span><h2>Context window and VRAM questions.</h2></div><div className="faq-list">{faq.map((item) => <details key={item.question}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}</div></section>

            <section className="article-conversion"><span>Ready to size the workload?</span><h2>Turn the cache budget into a fit plan.</h2><p>Set context, concurrency, and cache precision in the worksheet, then compare the resulting memory envelope with the hardware profiles.</p><div><Link href="/calculator">Open the VRAM calculator</Link><Link href="/hardware">Compare GPU profiles</Link></div></section>
          </div>
        </div>
      </article>
    </main>
  );
}
