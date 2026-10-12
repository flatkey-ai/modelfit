import type { Metadata } from "next";
import Link from "next/link";
import { estimateMemory, hardware, models, quantizations } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Best GPUs for LLM inference",
  description: "Compare GPU VRAM capacity and see which open LLMs fit on T4, L4, RTX 4090, L40S, A100, H100, H200, B200, and MI300X hardware.",
  alternates: { canonical: "/hardware" },
  openGraph: { title: "Best GPUs for LLM inference", description: "Compare VRAM capacity and model fit across popular cloud and datacenter GPUs.", url: "/hardware", type: "website" },
  twitter: { card: "summary", title: "Best GPUs for LLM inference", description: "Compare VRAM capacity and model fit across popular cloud and datacenter GPUs." },
};

const q4 = quantizations.find((entry) => entry.id === "q4")!;

function modelCountWithinCeiling(vramGb: number) {
  return models.filter((model) => estimateMemory(model, q4, Math.min(8192, model.nativeContext), 1).subtotalGiB <= vramGb * .85).length;
}

export default function HardwareIndexPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "GPU hardware profiles for LLM inference",
    numberOfItems: hardware.length,
    itemListElement: hardware.map((gpu, index) => ({ "@type": "ListItem", position: index + 1, name: gpu.name, url: absoluteUrl(`/hardware/${gpu.slug}`) })),
  };

  return (
    <main className="hardware-index-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <section className="directory-hero frame">
        <div className="crumbs"><Link href="/">Home</Link><span>/</span><strong>Hardware</strong></div>
        <div className="directory-title">
          <div><span className="directory-stat-badge"><b>{hardware.length}</b> GPU profiles</span><h1>Choose memory<br /><em>before speed.</em></h1></div>
          <div className="directory-lede"><p>For inference, a faster GPU is not useful if the model and workload cannot fit. Start with usable VRAM, then evaluate throughput, latency, software support, and price.</p><Link href="/calculator">Test your workload →</Link></div>
        </div>
      </section>

      <section className="hardware-directory frame">
        <div className="capacity-scale"><span>16 GB</span><i /><span>48 GB</span><i /><span>80 GB</span><i /><span>192 GB</span></div>
        <div className="hardware-card-grid">
          {hardware.map((gpu, index) => {
            const fitCount = modelCountWithinCeiling(gpu.vramGb);
            return (
              <Link className="hardware-card" href={`/hardware/${gpu.slug}`} key={gpu.slug}>
                <div className="hardware-card-head"><span>{String(index + 1).padStart(2, "0")}</span><small>{gpu.maker} · {gpu.tier}</small></div>
                <div className="hardware-capacity"><strong>{gpu.vramGb}</strong><span>GB<br />VRAM</span></div>
                <h2>{gpu.name}</h2>
                <p>{gpu.note}. {gpu.architecture} architecture.</p>
                <div className="hardware-card-foot"><span>{fitCount}/{models.length} models within the 85% ceiling at Q4 · 8K</span><b>Profile →</b></div>
              </Link>
            );
          })}
        </div>
        <p className="sample-disclaimer">Hourly figures on profile pages are sample planning inputs, not live quotes or benchmark promises. Availability, interconnect, region, framework version, and provider configuration all affect a production decision.</p>
      </section>

      <section className="hardware-principles frame">
        <div><span className="section-index">GPU selection checklist</span><h2>Capacity first.<br />Then the system.</h2></div>
        <ol>
          <li><span>01</span><div><strong>Keep operating headroom</strong><p>Targeting every advertised gigabyte leaves no room for allocator behavior, kernels, graph capture, or workload variance.</p></div></li>
          <li><span>02</span><div><strong>Model the peak workload</strong><p>Use intended context and concurrent sequences, not only the empty model weight footprint.</p></div></li>
          <li><span>03</span><div><strong>Validate the whole stack</strong><p>Tensor parallelism, bandwidth, quantization support, runtime version, and provider topology influence real results.</p></div></li>
        </ol>
      </section>
    </main>
  );
}
