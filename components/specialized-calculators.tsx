"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { StyledSelect } from "@/components/styled-select";
import { trackSiteEvent } from "@/components/site-analytics";

const contexts = [2048, 4096, 8192, 16384, 32768, 65536, 131072];
const gpuCounts = [1, 2, 4, 8];
const formatGiB = (value: number) => `${value.toFixed(value < 10 ? 2 : 1)} GiB`;
const formatTokens = (value: number) => value >= 1024 ? `${Math.round(value / 1024)}K` : String(value);

function useCalculatorTracking(calculator: string, properties: Record<string, boolean | number | string | undefined>) {
  const started = useRef(false);
  const signature = JSON.stringify(properties);
  useEffect(() => {
    const timer = window.setTimeout(() => trackSiteEvent("calculation_completed", { calculator, ...properties }), 700);
    return () => window.clearTimeout(timer);
  }, [calculator, signature]);
  return (firstControl: string) => {
    if (started.current) return;
    started.current = true;
    trackSiteEvent("calculator_started", { calculator, first_control: firstControl });
  };
}

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
  return <div className="select-field"><span>Model architecture</span><StyledSelect ariaLabel="Model architecture" value={value} options={models.map((model) => ({ value: model.slug, label: model.name }))} onChange={onChange} /></div>;
}

function ResultCta({ source }: { source: string }) {
  return <div className="special-result-actions"><Link href="/hardware">Compare GPU profiles</Link><a href={flatkeyComputeUrl(source, "specialized_calculator")} target="_blank" rel="sponsored nofollow noreferrer" onClick={() => trackSiteEvent("fit_conversion_clicked", { calculator: source })}>Check live GPU capacity ↗</a></div>;
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
  const markStarted = useCalculatorTracking("kv_cache", { model: model.slug, context_tokens: context, concurrency, gpu_count: devices, kv_precision: precision, kv_cache_per_gpu_gib: Number(perGpu.toFixed(2)) });

  return (
    <CalculatorShell label="Workload calculator" title="KV CACHE" result={<>
      <div className="special-primary-result"><span>KV cache per GPU</span><strong>{formatGiB(perGpu)}</strong><small>{formatGiB(totalKv)} total across {concurrency} active sequence{concurrency === 1 ? "" : "s"}</small></div>
      <dl className="special-result-list"><div><dt>Per sequence</dt><dd>{formatGiB(perSequence)}</dd></div><div><dt>Cache shards</dt><dd>{shardCount}×</dd></div><div><dt>Per 1K tokens</dt><dd>{formatGiB(model.kvGiBPer1kTokens * (precision === "fp8" ? .5 : 1))}</dd></div></dl>
      <p className="special-result-note">KV cache sharding stops at the model&apos;s {model.kvHeads} KV heads. This result excludes weights, runtime workspace, prefix cache and allocator fragmentation.</p>
      <ResultCta source="kv_cache_result" />
    </>}>
      <ModelSelect value={modelSlug} onChange={(value) => { markStarted("model"); setModelSlug(value); const next = models.find((entry) => entry.slug === value); if (next && context > next.nativeContext) setContext(next.nativeContext); }} />
      <div className="calculator-control-pair"><div className="select-field"><span>Context per sequence</span><StyledSelect ariaLabel="Context per sequence" value={String(context)} options={availableContexts.map((entry) => ({ value: String(entry), label: `${formatTokens(entry)} tokens` }))} onChange={(value) => { markStarted("context"); setContext(Number(value)); }} /></div><div className="select-field"><span>Active sequences</span><StyledSelect ariaLabel="Active sequences" value={String(concurrency)} options={[1, 2, 4, 8, 16, 32].map((entry) => ({ value: String(entry), label: String(entry) }))} onChange={(value) => { markStarted("concurrency"); setConcurrency(Number(value)); }} /></div></div>
      <div className="calculator-control-pair"><div className="select-field"><span>Tensor-parallel GPUs</span><StyledSelect ariaLabel="Tensor-parallel GPUs" value={String(devices)} options={gpuCounts.map((entry) => ({ value: String(entry), label: `${entry} GPU${entry === 1 ? "" : "s"}` }))} onChange={(value) => { markStarted("gpu_count"); setDevices(Number(value)); }} /></div><div className="select-field"><span>KV precision</span><StyledSelect ariaLabel="KV precision" value={precision} options={[{ value: "fp16", label: "FP16 / BF16" }, { value: "fp8", label: "FP8" }]} onChange={(value) => { markStarted("kv_precision"); setPrecision(value as "fp16" | "fp8"); }} /></div></div>
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
  const markStarted = useCalculatorTracking("multi_gpu", { model: model.slug, quantization: quantizationId, context_tokens: context, concurrency, gpu: gpu.slug, kv_precision: precision, minimum_gpu_count: minimum?.count || 0 });

  return (
    <CalculatorShell label="Topology calculator" title="MULTI-GPU PLAN" result={<>
      <div className="special-primary-result"><span>Minimum tested topology</span><strong>{minimum ? `${minimum.count}× ${gpu.name}` : `More than 8×`}</strong><small>{minimum ? `${formatGiB(minimum.perDevice.subtotalGiB)} estimated allocation per GPU` : `Selected workload exceeds the 8-GPU planning ceiling`}</small></div>
      <div className="topology-grid">{plans.map((plan) => <div className={plan.fits ? "fits" : "misses"} key={plan.count}><span>{plan.count}×</span><strong>{formatGiB(plan.perDevice.subtotalGiB)}</strong><small>{plan.fits ? `${Math.round(plan.utilization * 100)}% of planning budget` : "Does not fit"}</small></div>)}</div>
      <p className="special-result-note">Uses an 85% capacity ceiling. It estimates memory fit, not throughput or interconnect performance; tensor-parallel communication can make a technically valid topology operationally poor.</p>
      <ResultCta source="multi_gpu_result" />
    </>}>
      <ModelSelect value={modelSlug} onChange={(value) => { markStarted("model"); setModelSlug(value); const next = models.find((entry) => entry.slug === value); if (next && context > next.nativeContext) setContext(next.nativeContext); }} />
      <div className="calculator-control-pair"><div className="select-field"><span>Weight format</span><StyledSelect ariaLabel="Weight format" value={quantizationId} options={quantizations.map((entry) => ({ value: entry.id, label: entry.label }))} onChange={(value) => { markStarted("weight_format"); setQuantizationId(value); }} /></div><div className="select-field"><span>GPU profile</span><StyledSelect ariaLabel="GPU profile" value={gpuSlug} options={hardware.map((entry) => ({ value: entry.slug, label: `${entry.name} · ${entry.vramGb} GB` }))} onChange={(value) => { markStarted("gpu"); setGpuSlug(value); }} /></div></div>
      <div className="calculator-control-pair"><div className="select-field"><span>Context per sequence</span><StyledSelect ariaLabel="Context per sequence" value={String(context)} options={contexts.filter((entry) => entry <= model.nativeContext).map((entry) => ({ value: String(entry), label: `${formatTokens(entry)} tokens` }))} onChange={(value) => { markStarted("context"); setContext(Number(value)); }} /></div><div className="select-field"><span>Active sequences</span><StyledSelect ariaLabel="Active sequences" value={String(concurrency)} options={[1, 2, 4, 8].map((entry) => ({ value: String(entry), label: String(entry) }))} onChange={(value) => { markStarted("concurrency"); setConcurrency(Number(value)); }} /></div></div>
      <div className="select-field"><span>KV precision</span><StyledSelect ariaLabel="KV precision" value={precision} options={[{ value: "fp16", label: "FP16 / BF16" }, { value: "fp8", label: "FP8" }]} onChange={(value) => { markStarted("kv_precision"); setPrecision(value as "fp16" | "fp8"); }} /></div>
    </CalculatorShell>
  );
}

export function ModelMemoryCalculator() {
  const [parametersB, setParametersB] = useState(13);
  const [quantizationId, setQuantizationId] = useState("q4");
  const quantization = quantizations.find((entry) => entry.id === quantizationId) || quantizations[0];
  const estimate = estimateCustomModelWeightMemory(parametersB, quantization);
  const markStarted = useCalculatorTracking("model_memory", { parameters_b: parametersB, quantization: quantizationId, recommended_vram_gib: Number(estimate.recommendedGiB.toFixed(2)) });

  return (
    <CalculatorShell label="Custom model calculator" title="WEIGHT MEMORY" result={<>
      <div className="special-primary-result"><span>Recommended weight-loading floor</span><strong>{formatGiB(estimate.recommendedGiB)}</strong><small>Includes packing overhead, runtime workspace and 15% operating headroom</small></div>
      <dl className="special-result-list"><div><dt>Raw weights</dt><dd>{formatGiB(estimate.rawGiB)}</dd></div><div><dt>Packed estimate</dt><dd>{formatGiB(estimate.packedGiB)}</dd></div><div><dt>Runtime workspace</dt><dd>{formatGiB(estimate.workspaceGiB)}</dd></div></dl>
      <p className="special-result-note">This calculator intentionally excludes KV cache because parameter count alone does not reveal layer count, KV heads or head dimension. Add the architecture-specific cache separately.</p>
      <ResultCta source="model_memory_result" />
    </>}>
      <label><span>Parameter count (billions)</span><input type="number" min="0.1" max="2000" step="0.1" value={parametersB} onChange={(event) => { markStarted("parameters"); setParametersB(Math.max(.1, Number(event.target.value) || .1)); }} /></label>
      <div className="select-field"><span>Weight format</span><StyledSelect ariaLabel="Weight format" value={quantizationId} options={quantizations.map((entry) => ({ value: entry.id, label: `${entry.label} · ${entry.bits}-bit` }))} onChange={(value) => { markStarted("weight_format"); setQuantizationId(value); }} /></div>
      <div className="calculator-formula"><span>Formula</span><code>parameters × bits ÷ 8 × format overhead</code><p>{quantization.label} currently uses a {quantization.overhead.toFixed(2)}× packing coefficient.</p></div>
    </CalculatorShell>
  );
}
