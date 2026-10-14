import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { estimateMemory, getHardware, hardware, models, quantizations } from "@/lib/data";
import { absoluteUrl, flatkeyComputeUrl } from "@/lib/site";
import { getHardwarePriceSnapshot } from "@/lib/pricing";

type PageProps = { params: Promise<{ slug: string }> };

const q4 = quantizations.find((entry) => entry.id === "q4")!;
const bf16 = quantizations.find((entry) => entry.id === "bf16")!;

export function generateStaticParams() {
  return hardware.map((gpu) => ({ slug: gpu.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const gpu = getHardware((await params).slug);
  if (!gpu) return {};
  return {
    title: `${gpu.name} LLM model fit & VRAM guide`,
    description: `See which LLMs fit in ${gpu.vramGb} GB of VRAM, with Q4 and BF16 memory planning for ${gpu.name}.`,
    alternates: { canonical: `/hardware/${gpu.slug}` },
    openGraph: { title: `${gpu.name} LLM inference and VRAM guide`, description: `Model fit, usable memory, and deployment planning for the ${gpu.name}.`, url: `/hardware/${gpu.slug}`, type: "article" },
    twitter: { card: "summary", title: `${gpu.name} LLM inference and VRAM guide`, description: `Model fit, usable memory, and deployment planning for the ${gpu.name}.` },
  };
}

export default async function HardwareDetailPage({ params }: PageProps) {
  const gpu = getHardware((await params).slug);
  if (!gpu) notFound();
  const priceSnapshot = await getHardwarePriceSnapshot();
  const priceEvidence = priceSnapshot.prices[gpu.slug];

  const usable = gpu.vramGb * .85;
  const profiles = models.map((model) => {
    const q4Memory = estimateMemory(model, q4, Math.min(8192, model.nativeContext), 1).subtotalGiB;
    const bf16Memory = estimateMemory(model, bf16, Math.min(8192, model.nativeContext), 1).subtotalGiB;
    return {
      model,
      q4Memory,
      bf16Memory,
      q4Fit: q4Memory <= usable,
      bf16Fit: bf16Memory <= usable,
      q4Devices: Math.ceil(q4Memory / usable),
    };
  }).sort((a, b) => a.model.parametersB - b.model.parametersB);
  const fitCount = profiles.filter((profile) => profile.q4Fit).length;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${gpu.name} LLM model fit and VRAM guide`,
    description: `A planning guide to fitting open LLMs into ${gpu.vramGb} GB of VRAM on ${gpu.name}.`,
    url: absoluteUrl(`/hardware/${gpu.slug}`),
    mainEntityOfPage: absoluteUrl(`/hardware/${gpu.slug}`),
    about: ["LLM inference", "GPU memory", gpu.name],
  };

  return (
    <main className="hardware-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <section className="hardware-detail-hero frame">
        <div className="crumbs"><Link href="/">Home</Link><span>/</span><Link href="/hardware">Hardware</Link><span>/</span><strong>{gpu.name}</strong></div>
        <div className="hardware-detail-grid">
          <div><span className="section-index">{gpu.maker} / {gpu.architecture} / {gpu.tier}</span><h1>{gpu.name}<br /><em>LLM fit guide.</em></h1><p>{gpu.note}. This profile uses an 85% planning ceiling, leaving approximately {(gpu.vramGb - usable).toFixed(1)} GB outside the recommended workload envelope.</p><div className="model-detail-actions"><a className="model-compute-cta" href={flatkeyComputeUrl(`${gpu.slug}_profile`, "hardware_profile")} target="_blank" rel="sponsored nofollow noreferrer">Check {gpu.name} on Flatkey Compute ↗</a><Link href="/calculator">Test your workload →</Link></div></div>
          <div className="vram-dial"><span>VRAM</span><strong>{gpu.vramGb}</strong><small>GB advertised</small><i style={{ "--usable": `${usable / gpu.vramGb * 100}%` } as CSSProperties} /></div>
        </div>
        <div className="model-facts hardware-facts"><div><span>Planning ceiling</span><strong>{usable.toFixed(1)} GB</strong></div><div><span>Models within ceiling</span><strong>{fitCount} of {models.length}</strong></div><div><span>Architecture</span><strong>{gpu.architecture}</strong></div><div><span>{priceEvidence.kind === "live-index" ? "Realtime price index" : "Reference rate"}</span><strong>${priceEvidence.price.toFixed(2)} / GPU-hour</strong></div></div>
        <div className={`price-evidence ${priceEvidence.kind}`}>
          <div><span>Price evidence</span><strong>{priceEvidence.kind === "live-index" ? `${priceEvidence.samples} current samples · ${priceEvidence.source}` : priceEvidence.source}</strong></div>
          <p>{priceEvidence.low !== null && priceEvidence.high !== null ? `Observed range $${priceEvidence.low.toFixed(2)}–$${priceEvidence.high.toFixed(2)} per GPU-hour. ` : "This GPU is not currently covered by the live index, so a reviewed reference is shown. "}Updated {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(priceEvidence.updatedAt))}. Price is an index, not a Flatkey quote or availability promise.</p>
          <a href={priceSnapshot.sourceUrl} target="_blank" rel="noreferrer">Open methodology and live index ↗</a>
        </div>
      </section>

      <section className="fit-matrix-section frame">
        <div className="section-intro"><div><span className="section-index">Model fit matrix</span><h2>What fits in {gpu.vramGb} GB?</h2></div><p>These estimates use one 8K sequence and include runtime workspace. “Multi-GPU” indicates the minimum memory-equivalent device count, not a guarantee that the model or runtime supports that topology efficiently.</p></div>
        <div className="fit-matrix" role="table" aria-label={`${gpu.name} model fit matrix`}>
          <div className="fit-matrix-head" role="row"><span>Model</span><span>Q4 · 8K</span><span>BF16 · 8K</span><span>Q4 verdict</span></div>
          {profiles.map(({ model, q4Memory, bf16Memory, q4Fit, q4Devices }) => (
            <Link className="fit-matrix-row" href={`/models/${model.slug}`} role="row" key={model.slug}>
              <span><strong>{model.name}</strong><small>{model.parametersB}B parameters</small></span>
              <span data-label="Q4 · 8K">{q4Memory.toFixed(1)} GiB</span>
              <span data-label="BF16 · 8K">{bf16Memory.toFixed(1)} GiB</span>
              <span data-label="Q4 verdict" className={`matrix-verdict ${q4Fit ? "fits" : "multi"}`}>{q4Fit ? "Within 85% ceiling" : `${q4Devices}× memory floor`}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="hardware-copy frame">
        <article><span>01 / Good fit</span><h2>Where this profile makes sense.</h2><p>{gpu.name} is positioned as {gpu.note.toLowerCase()} hardware with {gpu.vramGb} GB of memory. It is a practical candidate when the full serving envelope stays below {usable.toFixed(1)} GB per device and the runtime supports the selected precision. For latency or throughput planning, memory fit is only the first gate: benchmark the exact model, batch shape, framework, and provider topology.</p></article>
        <article><span>02 / Watch-outs</span><h2>Why a fit can still fail.</h2><p>Advertised capacity is not always fully available to model serving. Drivers, runtime kernels, CUDA or ROCm graphs, fragmentation, adapters, multimodal encoders, speculative decoding, and provider reservations can all move the real boundary. Treat the matrix as a shortlist, then validate on the target stack.</p></article>
      </section>

      <section className="directory-cta"><div className="frame"><div><span className="section-index">Validate before renting</span><h2>Turn the profile into a workload test.</h2><p>The displayed rate is a market index or labeled reference—not a binding offer. Recheck live availability, region, context, precision, concurrency, and GPU count before committing capacity.</p></div><div><Link href="/calculator">Run the workload fit check →</Link><Link href="/hardware">Compare all GPUs</Link></div></div></section>
    </main>
  );
}
