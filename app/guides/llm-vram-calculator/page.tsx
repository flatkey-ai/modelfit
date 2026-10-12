import type { Metadata } from "next";
import Link from "next/link";
import { FitCalculator } from "@/components/fit-calculator";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "LLM VRAM calculator: estimate GPU memory",
  description: "Use an online LLM VRAM calculator and learn how to estimate weights, quantization overhead, KV cache, runtime workspace, and GPU headroom.",
  alternates: { canonical: "/guides/llm-vram-calculator" },
  openGraph: { title: "How to calculate LLM VRAM requirements", description: "A practical formula, worked examples, FAQs, and an interactive LLM VRAM calculator.", url: "/guides/llm-vram-calculator", type: "article" },
  twitter: { card: "summary", title: "How to calculate LLM VRAM requirements", description: "A practical formula, worked examples, FAQs, and an interactive LLM VRAM calculator." },
};

const faq = [
  { question: "How much VRAM does an LLM need?", answer: "It depends on parameter count, weight precision, KV cache, runtime workspace, context length, and concurrency. Raw weight memory is only the starting point; a stable serving plan also needs operating headroom." },
  { question: "How do I estimate VRAM from a Hugging Face model card?", answer: "Find the parameter count and architecture on the model card, choose the weight format you will actually load, then add model-specific KV cache and runtime overhead. The parameter count alone cannot determine production memory." },
  { question: "Can I use this calculator for a local LLM?", answer: "Yes. Set one GPU, the intended quantization, context length, and one concurrent sequence for a local starting point. CPU offload and shared-memory behavior are not included, so validate with your local runtime." },
  { question: "Why does a 4-bit model use more than 0.5 bytes per parameter?", answer: "Quantized formats commonly store scales, metadata, and some modules at higher precision. Runtimes also allocate cache and workspace beyond the weight file itself." },
  { question: "Should I plan to use all advertised GPU memory?", answer: "No. ModelFit targets an 85% ceiling so kernels, allocators, graph capture, and workload variation have room. The appropriate margin can differ by runtime and provider." },
];

export default function VramGuidePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "TechArticle", headline: "LLM VRAM calculator: how to estimate GPU memory", description: metadata.description, url: absoluteUrl("/guides/llm-vram-calculator"), about: ["LLM VRAM", "GPU memory", "quantization"] },
      { "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    ],
  };

  return (
    <main className="guide-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article>
        <header className="guide-hero frame">
          <div className="crumbs"><Link href="/">Home</Link><span>/</span><Link href="/guides">Guides</Link><span>/</span><strong>LLM VRAM calculator</strong></div>
          <div className="guide-hero-grid"><div><span className="section-index">Guide 01 / Updated planning model v0.1</span><h1>LLM VRAM<br /><em>calculator.</em></h1></div><div><p className="guide-deck">Estimate how much GPU memory an LLM needs by separating weights, KV cache, runtime workspace, and operating headroom.</p><div className="guide-meta"><span>12 min read</span><span>Inference planning</span><span>Formula + tool</span></div></div></div>
        </header>

        <div className="article-layout frame">
          <aside className="article-toc"><strong>On this page</strong><a href="#calculator">Calculator</a><a href="#formula">VRAM formula</a><a href="#precision">Weight precision</a><a href="#workload">Workload memory</a><a href="#example">Worked example</a><a href="#faq">FAQ</a></aside>
          <div className="article-content">
            <section className="article-lead"><p>“How much VRAM does this model need?” sounds like a single-number question. It is really two questions: how much memory loads the model, and how much additional memory serves the workload you expect. A useful estimate keeps those parts visible.</p><p>This online LLM VRAM calculator is designed for both local evaluation and cloud inference planning. It does not claim benchmark accuracy; it gives you an auditable starting envelope that you can validate on the intended runtime.</p></section>

            <section id="calculator" className="article-tool"><div className="article-heading"><span>Interactive tool</span><h2>Calculate the deployment envelope.</h2><p>Select an open model, weight format, context length, concurrent sequences, and GPU count. The result shows each memory bucket and suitable hardware profiles.</p></div><FitCalculator compact showCommercialCta={false} /></section>

            <section id="formula"><div className="article-heading"><span>01 / The formula</span><h2>Start with four memory buckets.</h2></div><p>A practical LLM memory estimate can be expressed as:</p><pre><code>recommended VRAM = (weights + KV cache + runtime workspace) / target utilization</code></pre><p>ModelFit uses an 85% target utilization. Dividing the workload subtotal by 0.85 converts it into recommended capacity with 15% operating headroom. That margin is a planning choice, not a universal runtime constant.</p><div className="definition-grid"><div><strong>Weights</strong><p>Parameter count multiplied by bytes per parameter, plus format overhead.</p></div><div><strong>KV cache</strong><p>Attention keys and values retained for active tokens and sequences.</p></div><div><strong>Workspace</strong><p>Kernels, temporary buffers, graph capture, and allocator needs.</p></div><div><strong>Headroom</strong><p>Capacity intentionally left outside the expected workload.</p></div></div></section>

            <section id="precision"><div className="article-heading"><span>02 / Weight precision</span><h2>Quantization moves the largest block.</h2></div><p>For a dense model, a quick raw-weight estimate multiplies parameters by the number of bytes stored for each parameter. BF16 and FP16 use two bytes; 8-bit formats use roughly one byte; 4-bit formats begin around half a byte. Real loaded memory is usually higher because formats store scales and metadata, and some layers may remain at higher precision.</p><div className="article-table"><div><strong>Weight format</strong><strong>Raw bytes / parameter</strong><strong>7B raw weights</strong><strong>70B raw weights</strong></div><div><span>BF16 / FP16</span><span>2</span><span>~13.0 GiB</span><span>~130.4 GiB</span></div><div><span>INT8 / FP8</span><span>1</span><span>~6.5 GiB</span><span>~65.2 GiB</span></div><div><span>4-bit</span><span>0.5</span><span>~3.3 GiB</span><span>~32.6 GiB</span></div></div><p className="article-caption">Raw binary conversions shown before quantization metadata, cache, workspace, or headroom.</p></section>

            <section id="workload"><div className="article-heading"><span>03 / Workload memory</span><h2>A downloaded file is not a serving plan.</h2></div><p>Model file size can approximate weight storage, but it does not include the KV cache created while generating tokens. Cache usage grows with the model architecture, active context, number of concurrent sequences, and cache precision. Runtime allocations add another layer that can change between vLLM, llama.cpp, TensorRT-LLM, Transformers, and version-specific kernels.</p><p>For a local LLM, start with one concurrent sequence and the context you realistically use—not the model’s advertised maximum. For an API workload, use the longest accepted request plus the concurrency your scheduler may keep active. If the runtime supports FP8 KV cache, the cache component can be materially smaller, but support and output quality must be validated. Hybrid and sliding-attention models also depend on whether the selected runtime honors their local-cache window or reserves a larger static pool.</p><aside className="article-callout"><strong>Do not double-count shards.</strong><p>Tensor parallelism divides much of the model and cache across devices, but not every allocation scales perfectly. The calculator shows a per-device planning figure; topology and communication overhead still require a real test.</p></aside></section>

            <section id="example"><div className="article-heading"><span>04 / Worked example</span><h2>Planning a 70B model at 4-bit.</h2></div><p>Take a 70B dense model in a 4-bit format. Raw weights begin around 32.6 GiB. Quantization metadata lifts the loaded weight estimate, then an 8K sequence adds model-specific KV cache and the runtime reserves workspace. Applying headroom can move the recommendation beyond a 48 GB card even when the downloaded weight files appear smaller.</p><p>That is why “70B at Q4 fits on 48 GB” is not a universal promise. Context, cache precision, runtime, adapter use, and the quantization implementation can change the result. Use the tool as a shortlist, then verify memory and generation behavior on the exact stack.</p><div className="article-next"><div><strong>Next: understand context cost</strong><p>See how tokens and concurrent sequences change the KV cache.</p></div><Link href="/guides/context-window-vram">Read the context-window guide →</Link></div></section>

            <section id="faq"><div className="article-heading"><span>FAQ</span><h2>LLM VRAM calculator questions.</h2></div><div className="faq-list">{faq.map((item) => <details key={item.question}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}</div></section>

            <section className="article-conversion"><span>Estimate complete?</span><h2>Compare the hardware profiles.</h2><p>Use the estimate to shortlist GPUs, then validate runtime support and your workload assumptions on the exact stack.</p><div><Link href="/hardware">Browse GPU profiles</Link><Link href="/methodology">Review the methodology</Link></div></section>
          </div>
        </div>
      </article>
    </main>
  );
}
