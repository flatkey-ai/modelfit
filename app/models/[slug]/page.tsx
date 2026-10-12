import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FitCalculator } from "@/components/fit-calculator";
import { estimateMemory, getModel, hardware, models, quantizations } from "@/lib/data";
import { flatkeyComputeUrl } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return models.map((model) => ({ slug: model.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const model = getModel((await params).slug);
  if (!model) return {};
  return {
    title: `${model.name} GPU & VRAM requirements`,
    description: `Estimate GPU memory, quantization options, context cost, and hardware choices for ${model.name}.`,
    alternates: { canonical: `/models/${model.slug}` },
    openGraph: {
      title: `${model.name} GPU and VRAM requirements`,
      description: `Plan ${model.name} inference memory, quantization, context length, and GPU capacity.`,
      type: "article",
      url: `/models/${model.slug}`,
    },
    twitter: {
      card: "summary",
      title: `${model.name} GPU and VRAM requirements`,
      description: `Plan ${model.name} inference memory, quantization, context length, and GPU capacity.`,
    },
  };
}

export default async function ModelPage({ params }: PageProps) {
  const model = getModel((await params).slug);
  if (!model) notFound();
  const q4 = quantizations.find((entry) => entry.id === "q4")!;
  const bf16 = quantizations.find((entry) => entry.id === "bf16")!;
  const q4Estimate = estimateMemory(model, q4, Math.min(8192, model.nativeContext), 1);
  const bf16Estimate = estimateMemory(model, bf16, Math.min(8192, model.nativeContext), 1);
  const q4Matches = hardware.filter((gpu) => gpu.vramGb * .85 >= q4Estimate.subtotalGiB).sort((a, b) => a.vramGb - b.vramGb).slice(0, 3);

  return (
    <main className="model-detail-page">
      <section className="model-detail-hero frame">
        <div className="crumbs"><Link href="/">Home</Link><span>/</span><Link href="/models">Models</Link><span>/</span><strong>{model.name}</strong></div>
        <div className="model-detail-title">
          <div><span className="section-index">{model.maker} / {model.family}</span><h1>{model.name}</h1><p>{model.summary}</p><div className="model-detail-actions"><a className="model-compute-cta" href={flatkeyComputeUrl(`${model.slug}_profile`, "model_profile")} target="_blank" rel="sponsored nofollow noreferrer">Check {model.family} compute on Flatkey ↗</a><Link href="#fit-planner">Tune the memory plan ↓</Link><a href={model.sourceUrl} target="_blank" rel="noreferrer">Official model card ↗</a></div></div>
          <div className="model-fingerprint" aria-label={`${model.parametersB} billion parameters`}><div><span>{model.parametersB}</span><small>B parameters</small></div><i /><i /><i /></div>
        </div>
        <div className="model-facts">
          <div><span>Architecture</span><strong>{model.architecture}</strong></div>
          <div><span>Native context</span><strong>{Math.round(model.nativeContext / 1024)}K tokens</strong></div>
          <div><span>License</span><strong>{model.license}</strong></div>
          <div><span>Q4 · 8K estimate</span><strong>{q4Estimate.subtotalGiB.toFixed(1)} GiB</strong></div>
        </div>
      </section>

      <section className="model-planning frame">
        <div className="section-intro">
          <div><span className="section-index">Memory envelope</span><h2>What changes the fit.</h2></div>
          <p>Weights establish the floor. Context, concurrent sequences, cache precision, and runtime overhead determine whether the deployment remains stable.</p>
        </div>
        <div className="memory-comparison">
          <article><span>Efficient</span><h3>4-bit · 8K</h3><strong>{q4Estimate.subtotalGiB.toFixed(1)} <small>GiB</small></strong><p>Useful starting point for local evaluation and cost-sensitive inference.</p></article>
          <article><span>Quality-first</span><h3>BF16 · 8K</h3><strong>{bf16Estimate.subtotalGiB.toFixed(1)} <small>GiB</small></strong><p>Preserves original weight precision and establishes a conservative serving baseline.</p></article>
          <article className="match-card"><span>Smallest profiles within the 85% ceiling</span>{q4Matches.length ? q4Matches.map((gpu) => <Link href={`/hardware/${gpu.slug}`} key={gpu.slug}><strong>{gpu.name}</strong><small>{gpu.vramGb} GB · {gpu.tier}</small></Link>) : <p>Multi-GPU deployment required.</p>}</article>
        </div>
      </section>

      <section className="embedded-calculator frame" id="fit-planner">
        <div className="section-intro"><div><span className="section-index">Interactive plan</span><h2>Tune {model.family}.</h2></div><p>The worksheet starts with this model selected. Adjust context, precision, cache, and GPU count for your workload.</p></div>
        <FitCalculator initialModelSlug={model.slug} compact showCommercialCta={false} />
      </section>
    </main>
  );
}
