import Link from "next/link";
import type { CSSProperties } from "react";
import { FitCalculator } from "@/components/fit-calculator";
import { estimateMemory, models, quantizations } from "@/lib/data";
import { flatkeyWebsiteUrl } from "@/lib/site";

function getQ4Memory(slug: string) {
  const model = models.find((entry) => entry.slug === slug)!;
  const q4 = quantizations.find((entry) => entry.id === "q4")!;
  return estimateMemory(model, q4, Math.min(model.nativeContext, 8192), 1).subtotalGiB;
}

export default function Home() {
  return (
    <main>
      <section className="hero frame">
        <div className="hero-copy">
          <div className="hero-label"><span>01</span><p>Open-model deployment planner</p></div>
          <h1>Will this<br />model <em>fit?</em></h1>
          <p className="hero-intro">Turn model size, quantization, context, and concurrency into a practical GPU plan—before you reserve a machine.</p>
          <div className="hero-links"><a href={flatkeyWebsiteUrl("home_hero")} target="_blank" rel="sponsored nofollow noreferrer">Explore Flatkey GPU Cloud <b>↗</b></a><Link href="#calculator">Check a model ↓</Link></div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-a"><span>WEIGHTS</span></div>
          <div className="orbit orbit-b"><span>KV CACHE</span></div>
          <div className="orbit orbit-c"><span>RUNTIME</span></div>
          <div className="hero-core"><span>FIT</span><strong>85%</strong><small>target ceiling</small></div>
          <div className="plot-note note-a"><i />MODEL</div>
          <div className="plot-note note-b"><i />VRAM</div>
          <div className="plot-note note-c"><i />COST</div>
        </div>
      </section>

      <section className="signal-strip">
        <div className="frame"><span><b>INPUT</b> Model + workload</span><i>→</i><span><b>CALCULATE</b> Weights + cache + overhead</span><i>→</i><span><b>OUTPUT</b> GPU plan + command template</span></div>
      </section>

      <section className="calculator-section frame" id="calculator">
        <div className="section-intro">
          <div><span className="section-index">02 / Calculator</span><h2>Build a deployment worksheet.</h2></div>
          <p>Start with an open model, then adjust the details that actually change memory: precision, context length, concurrent sequences, and tensor-parallel GPU count.</p>
        </div>
        <FitCalculator />
      </section>

      <section className="models-section" id="models">
        <div className="frame">
          <div className="section-intro inverse">
            <div><span className="section-index">03 / Model index</span><h2>Choose the model.<br />We’ll map the hardware.</h2></div>
            <div className="section-intro-link"><p>Curated model cards keep parameter counts, context limits, architecture notes, and source links separate from the calculator itself.</p><Link href="/models">Explore the full model directory →</Link></div>
          </div>
          <div className="model-list">
            {models.map((model, index) => {
              const q4Memory = getQ4Memory(model.slug);
              return (
                <Link className="model-row" href={`/models/${model.slug}`} key={model.slug}>
                  <span className="model-row-index">{String(index + 1).padStart(2, "0")}</span>
                  <div className="model-row-name"><strong>{model.name}</strong><small>{model.maker} · {model.family}</small></div>
                  <div className="parameter-disc"><span style={{ "--disc": `${Math.max(15, Math.min(100, model.parametersB))}%` } as CSSProperties} /></div>
                  <div className="model-row-stat"><span>Parameters</span><strong>{model.parametersB}B</strong></div>
                  <div className="model-row-stat"><span>Q4 · 8K estimate</span><strong>~{q4Memory.toFixed(0)} GiB</strong></div>
                  <span className="model-row-arrow">↗</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="decision-section frame">
        <div className="decision-title"><span className="section-index">04 / Decision path</span><h2>One estimate.<br />Three useful answers.</h2></div>
        <div className="decision-grid">
          <article><span>01</span><div className="decision-icon memory-icon"><i /><i /><i /></div><h3>Does it fit?</h3><p>Break total memory into weights, KV cache, and runtime workspace instead of relying on parameter count alone.</p></article>
          <article><span>02</span><div className="decision-icon cards-icon"><i /><i /></div><h3>What should I rent?</h3><p>Match the per-device estimate to practical GPU profiles and keep enough headroom for stable serving.</p></article>
          <article><span>03</span><div className="decision-icon code-icon">$</div><h3>How do I launch?</h3><p>Carry context, cache precision, and parallelism into a command template. Quantized plans still need a compatible checkpoint and backend.</p></article>
        </div>
      </section>

      <section className="resource-section frame">
        <div className="section-intro"><div><span className="section-index">05 / Planning library</span><h2>Go deeper than<br />a single number.</h2></div><p>Use the hardware profiles and field guides to understand why the estimate changes—and what to validate before renting a machine.</p></div>
        <div className="resource-grid">
          <Link href="/hardware"><span>Hardware directory</span><h3>Compare GPU VRAM profiles</h3><p>See which starter models fit across 16 GB to 192 GB hardware envelopes.</p><b>9 profiles →</b></Link>
          <Link href="/guides/llm-vram-calculator"><span>Guide 01</span><h3>How to calculate LLM VRAM</h3><p>Break memory into weights, KV cache, runtime workspace, and operating headroom.</p><b>Read guide →</b></Link>
          <Link href="/guides/context-window-vram"><span>Guide 02</span><h3>Context windows and KV cache</h3><p>Understand how active tokens, concurrent sequences, and cache precision use memory.</p><b>Read guide →</b></Link>
        </div>
      </section>

      <section className="closing-cta">
        <div className="frame">
          <span className="section-index">Ready when you are</span>
          <h2>Stop guessing.<br /><em>Run the fit check.</em></h2>
          <Link href="/calculator">Open the full calculator <span>→</span></Link>
        </div>
      </section>
    </main>
  );
}
