"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  estimateCustomModelWeightMemory,
  estimateKvCache,
  estimateMemory,
  estimatePerDeviceMemory,
  hardware,
  models,
  quantizations,
} from "@/lib/data";
import { flatkeyComputeUrl } from "@/lib/site";

const contexts = [2048, 4096, 8192, 16384, 32768, 65536, 131072];
const gpuCounts = [1, 2, 4, 8];
const formatGiB = (value: number) => `${value.toFixed(value < 10 ? 2 : 1)} GiB`;
const formatTokens = (value: number) => value >= 1024 ? `${Math.round(value / 1024)}K` : String(value);

function CalculatorShell({ label, title, children, result }: { label: string; title: string; children: React.ReactNode; result: React.ReactNode }) {
  return (
    <section className="special-calculator">
      <header><span>{label}</span><strong>{title}</strong><small>Formula v1.0.0</small></header>
      <div className="special-calculator-grid">
        <form onSubmit={(event) => event.preventDefault()}>{children}</form>
        <div className="special-calculator-result">{result}</div>
      </div>
    </section>
  );
}

function ModelSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label><span>Model architecture</span><select value={value} onChange={(event) => onChange(event.target.value)}>{models.map((model) => <option key={model.slug} value={model.slug}>{model.name}</option>)}</select></label>;
}

function ResultCta({ source }: { source: string }) {
  return <div className="special-result-actions"><Link href="/hardware">Compare GPU profiles</Link><a href={flatkeyComputeUrl(source, "specialized_calculator")} target="_blank" rel="sponsored nofollow noreferrer">Check live GPU capacity ↗</a></div>;
}

export function KvCacheCalculator() {
  const [modelSlug, setModelSlug] = useState("llama-31-8b-instruct");
  const [context, setContext] = useState(32768);
  const [concurrency, setConcurrency] = useState(4);
  const [devices, setDevices] = useState(1);
  const [precision, setPrecision] = useState<"fp16" | "fp8">("fp16");
  const model = models.find((entry) => entry.slug === modelSlug) || models[0];
  const availableContexts = contexts.filter((entry) => entry <= model.nativeContext);
  const totalKv = estimateKvCache(model, context, concurrency, precision);
  const shardCount = Math.min(devices, model.kvHeads);
  const perGpu = totalKv / shardCount;
  const perSequence = totalKv / concurrency;

  return (
    <CalculatorShell label="Workload calculator" title="KV CACHE" result={<>
      <div className="special-primary-result"><span>KV cache per GPU</span><strong>{formatGiB(perGpu)}</strong><small>{formatGiB(totalKv)} total across {concurrency} active sequence{concurrency === 1 ? "" : "s"}</small></div>
      <dl className="special-result-list"><div><dt>Per sequence</dt><dd>{formatGiB(perSequence)}</dd></div><div><dt>Cache shards</dt><dd>{shardCount}×</dd></div><div><dt>Per 1K tokens</dt><dd>{formatGiB(model.kvGiBPer1kTokens * (precision === "fp8" ? .5 : 1))}</dd></div></dl>
      <p className="special-result-note">KV cache sharding stops at the model&apos;s {model.kvHeads} KV heads. This result excludes weights, runtime workspace, prefix cache and allocator fragmentation.</p>
      <ResultCta source="kv_cache_result" />
    </>}>
      <ModelSelect value={modelSlug} onChange={(value) => { setModelSlug(value); const next = models.find((entry) => entry.slug === value); if (next && context > next.nativeContext) setContext(next.nativeContext); }} />
      <div className="calculator-control-pair"><label><span>Context per sequence</span><select value={context} onChange={(event) => setContext(Number(event.target.value))}>{availableContexts.map((entry) => <option key={entry} value={entry}>{formatTokens(entry)} tokens</option>)}</select></label><label><span>Active sequences</span><select value={concurrency} onChange={(event) => setConcurrency(Number(event.target.value))}>{[1, 2, 4, 8, 16, 32].map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select></label></div>
      <div className="calculator-control-pair"><label><span>Tensor-parallel GPUs</span><select value={devices} onChange={(event) => setDevices(Number(event.target.value))}>{gpuCounts.map((entry) => <option key={entry} value={entry}>{entry} GPU{entry === 1 ? "" : "s"}</option>)}</select></label><label><span>KV precision</span><select value={precision} onChange={(event) => setPrecision(event.target.value as "fp16" | "fp8")}><option value="fp16">FP16 / BF16</option><option value="fp8">FP8</option></select></label></div>
    </CalculatorShell>
  );
}

export function MultiGpuCalculator() {
  const [modelSlug, setModelSlug] = useState("llama-31-70b-instruct");
  const [quantizationId, setQuantizationId] = useState("q4");
  const [context, setContext] = useState(32768);
  const [concurrency, setConcurrency] = useState(4);
  const [gpuSlug, setGpuSlug] = useState("nvidia-h100-80gb");
  const [precision, setPrecision] = useState<"fp16" | "fp8">("fp16");
  const model = models.find((entry) => entry.slug === modelSlug) || models[0];
  const quantization = quantizations.find((entry) => entry.id === quantizationId) || quantizations[0];
  const gpu = hardware.find((entry) => entry.slug === gpuSlug) || hardware[0];
  const estimate = estimateMemory(model, quantization, context, concurrency, precision);
  const plans = useMemo(() => gpuCounts.map((count) => {
    const perDevice = estimatePerDeviceMemory(model, estimate, count);
    const utilization = perDevice.subtotalGiB / (gpu.vramGb * .85);
    return { count, perDevice, utilization, fits: utilization <= 1 };
  }), [estimate, gpu.vramGb, model]);
  const minimum = plans.find((plan) => plan.fits);

  return (
    <CalculatorShell label="Topology calculator" title="MULTI-GPU PLAN" result={<>
      <div className="special-primary-result"><span>Minimum tested topology</span><strong>{minimum ? `${minimum.count}× ${gpu.name}` : `More than 8×`}</strong><small>{minimum ? `${formatGiB(minimum.perDevice.subtotalGiB)} estimated allocation per GPU` : `Selected workload exceeds the 8-GPU planning ceiling`}</small></div>
      <div className="topology-grid">{plans.map((plan) => <div className={plan.fits ? "fits" : "misses"} key={plan.count}><span>{plan.count}×</span><strong>{formatGiB(plan.perDevice.subtotalGiB)}</strong><small>{plan.fits ? `${Math.round(plan.utilization * 100)}% of planning budget` : "Does not fit"}</small></div>)}</div>
      <p className="special-result-note">Uses an 85% capacity ceiling. It estimates memory fit, not throughput or interconnect performance; tensor-parallel communication can make a technically valid topology operationally poor.</p>
      <ResultCta source="multi_gpu_result" />
    </>}>
      <ModelSelect value={modelSlug} onChange={(value) => { setModelSlug(value); const next = models.find((entry) => entry.slug === value); if (next && context > next.nativeContext) setContext(next.nativeContext); }} />
      <div className="calculator-control-pair"><label><span>Weight format</span><select value={quantizationId} onChange={(event) => setQuantizationId(event.target.value)}>{quantizations.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label><label><span>GPU profile</span><select value={gpuSlug} onChange={(event) => setGpuSlug(event.target.value)}>{hardware.map((entry) => <option key={entry.slug} value={entry.slug}>{entry.name} · {entry.vramGb} GB</option>)}</select></label></div>
      <div className="calculator-control-pair"><label><span>Context per sequence</span><select value={context} onChange={(event) => setContext(Number(event.target.value))}>{contexts.filter((entry) => entry <= model.nativeContext).map((entry) => <option key={entry} value={entry}>{formatTokens(entry)} tokens</option>)}</select></label><label><span>Active sequences</span><select value={concurrency} onChange={(event) => setConcurrency(Number(event.target.value))}>{[1, 2, 4, 8].map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select></label></div>
      <label><span>KV precision</span><select value={precision} onChange={(event) => setPrecision(event.target.value as "fp16" | "fp8")}><option value="fp16">FP16 / BF16</option><option value="fp8">FP8</option></select></label>
    </CalculatorShell>
  );
}

export function ModelMemoryCalculator() {
  const [parametersB, setParametersB] = useState(13);
  const [quantizationId, setQuantizationId] = useState("q4");
  const quantization = quantizations.find((entry) => entry.id === quantizationId) || quantizations[0];
  const estimate = estimateCustomModelWeightMemory(parametersB, quantization);

  return (
    <CalculatorShell label="Custom model calculator" title="WEIGHT MEMORY" result={<>
      <div className="special-primary-result"><span>Recommended weight-loading floor</span><strong>{formatGiB(estimate.recommendedGiB)}</strong><small>Includes packing overhead, runtime workspace and 15% operating headroom</small></div>
      <dl className="special-result-list"><div><dt>Raw weights</dt><dd>{formatGiB(estimate.rawGiB)}</dd></div><div><dt>Packed estimate</dt><dd>{formatGiB(estimate.packedGiB)}</dd></div><div><dt>Runtime workspace</dt><dd>{formatGiB(estimate.workspaceGiB)}</dd></div></dl>
      <p className="special-result-note">This calculator intentionally excludes KV cache because parameter count alone does not reveal layer count, KV heads or head dimension. Add the architecture-specific cache separately.</p>
      <ResultCta source="model_memory_result" />
    </>}>
      <label><span>Parameter count (billions)</span><input type="number" min="0.1" max="2000" step="0.1" value={parametersB} onChange={(event) => setParametersB(Math.max(.1, Number(event.target.value) || .1))} /></label>
      <label><span>Weight format</span><select value={quantizationId} onChange={(event) => setQuantizationId(event.target.value)}>{quantizations.map((entry) => <option key={entry.id} value={entry.id}>{entry.label} · {entry.bits}-bit</option>)}</select></label>
      <div className="calculator-formula"><span>Formula</span><code>parameters × bits ÷ 8 × format overhead</code><p>{quantization.label} currently uses a {quantization.overhead.toFixed(2)}× packing coefficient.</p></div>
    </CalculatorShell>
  );
}
