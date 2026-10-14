"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { estimateMemory, estimatePerDeviceMemory, hardware, modelConfigGeneratedAt, modelFitFormulaVersion, models, quantizations } from "@/lib/data";
import { trackSiteEvent } from "@/components/site-analytics";
import { StyledSelect } from "@/components/styled-select";
import { flatkeyComputeUrl } from "@/lib/site";
import type { HardwarePriceSnapshot } from "@/lib/pricing";

type FitCalculatorProps = {
  initialModelSlug?: string;
  compact?: boolean;
  showCommercialCta?: boolean;
  priceSnapshot?: HardwarePriceSnapshot;
};

const contexts = [2048, 4096, 8192, 16384, 32768, 65536, 131072];

const formatContext = (value: number) => value >= 1024 ? `${Math.round(value / 1024)}K` : String(value);
const formatGiB = (value: number) => `${value.toFixed(value < 10 ? 1 : 0)} GiB`;

export function FitCalculator({ initialModelSlug = "llama-31-8b-instruct", compact = false, showCommercialCta = true, priceSnapshot }: FitCalculatorProps) {
  const [modelSlug, setModelSlug] = useState(initialModelSlug);
  const [quantizationId, setQuantizationId] = useState("q4");
  const [context, setContext] = useState(8192);
  const [concurrency, setConcurrency] = useState(1);
  const [devices, setDevices] = useState(1);
  const [kvPrecision, setKvPrecision] = useState<"fp16" | "fp8">("fp16");
  const [copied, setCopied] = useState(false);
  const interactionStarted = useRef(false);

  const model = models.find((entry) => entry.slug === modelSlug) || models[0];
  const quantization = quantizations.find((entry) => entry.id === quantizationId) || quantizations[0];
  const estimate = estimateMemory(model, quantization, context, concurrency, kvPrecision);
  const perDeviceEstimate = estimatePerDeviceMemory(model, estimate, devices);
  const perDeviceWeight = perDeviceEstimate.weightGiB;
  const perDeviceKv = perDeviceEstimate.kvGiB;
  const perDeviceWorkspace = perDeviceEstimate.workspaceGiB;
  const perDevice = perDeviceEstimate.subtotalGiB;
  const recommendedPerDevice = perDevice / 0.85;

  const matches = useMemo(() => {
    return hardware
      .map((gpu) => {
        const utilization = perDevice / gpu.vramGb;
        const verdict = utilization <= 0.8 ? "Comfortable" : utilization <= 0.92 ? "Tight fit" : "Does not fit";
        const priceEvidence = priceSnapshot?.prices[gpu.slug];
        const hourlyPrice = priceEvidence?.price ?? gpu.sampleHourly;
        return { ...gpu, utilization, verdict, priceEvidence, totalHourly: hourlyPrice * devices };
      })
      .filter((gpu) => gpu.verdict !== "Does not fit")
      .sort((a, b) => a.totalHourly - b.totalHourly || a.vramGb - b.vramGb)
      .slice(0, 3);
  }, [devices, perDevice, priceSnapshot]);

  const weightPercent = perDeviceWeight / perDevice * 100;
  const kvPercent = perDeviceKv / perDevice * 100;
  const workspacePercent = 100 - weightPercent - kvPercent;
  const maxContext = Math.min(model.nativeContext, 131072);
  const availableContexts = contexts.filter((entry) => entry <= maxContext);
  const quantizedPlan = quantizationId !== "bf16";
  const commandModel = quantizedPlan ? "YOUR_COMPATIBLE_QUANTIZED_MODEL_ID" : model.modelId;
  const command = [
    `vllm serve ${commandModel}`,
    `--tensor-parallel-size ${devices}`,
    `--max-model-len ${context}`,
    kvPrecision === "fp8" ? "--kv-cache-dtype fp8" : "",
    quantizedPlan ? "--quantization YOUR_MATCHING_BACKEND" : "",
  ].filter(Boolean).join(" ");
  const commandNote = quantizedPlan
    ? `${quantization.label} is a memory assumption, not a checkpoint choice. Replace both placeholders with a compatible quantized artifact and its vLLM backend.`
    : kvPrecision === "fp8"
      ? "FP8 KV cache requires model, runtime, and GPU support; validate output quality on the target stack."
      : "Uses the upstream model ID at its configured weight dtype; verify the resolved dtype before deployment.";

  function markStarted(control: string) {
    if (interactionStarted.current) return;
    interactionStarted.current = true;
    trackSiteEvent("calculator_started", { calculator: "model_gpu_fit", first_control: control, model: model.slug });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const properties = {
        calculator: "model_gpu_fit",
        model: model.slug,
        quantization: quantizationId,
        context_tokens: context,
        concurrency,
        gpu_count: devices,
        kv_precision: kvPrecision,
        estimated_per_gpu_gib: Number(perDevice.toFixed(2)),
        recommended_vram_gib: Number(recommendedPerDevice.toFixed(2)),
        recommended_gpu: matches[0]?.slug || "none",
        matching_gpu_count: matches.length,
      };
      trackSiteEvent("calculation_completed", properties);
      trackSiteEvent("fit_result_viewed", properties);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [concurrency, context, devices, kvPrecision, matches, model.slug, perDevice, quantizationId, recommendedPerDevice]);

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    trackSiteEvent("launch_command_copied", { model: model.slug, quantization: quantizationId, context, concurrency, devices, kv_precision: kvPrecision });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className={`fit-tool ${compact ? "compact" : ""}`}>
      <div className="fit-tool-head">
        <div><span className="micro-label">Deployment worksheet</span><strong>MODEL / GPU FIT</strong></div>
        <span className="estimate-badge"><i /> Calculated estimate · v{modelFitFormulaVersion}</span>
      </div>
      <div className="fit-body">
        <form className="fit-form" onSubmit={(event) => event.preventDefault()}>
          <div className="form-section">
            <span className="step-number">01</span>
            <div className="form-section-body">
              <label htmlFor="model">Model</label>
              <StyledSelect id="model" ariaLabel="Model" value={modelSlug} options={models.map((entry) => ({ value: entry.slug, label: `${entry.name} · ${entry.parametersB}B` }))} onChange={(value) => {
                markStarted("model");
                const nextModel = models.find((entry) => entry.slug === value);
                setModelSlug(value);
                if (nextModel && context > nextModel.nativeContext) setContext(nextModel.nativeContext);
              }} />
              <div className="model-meta"><span>{model.maker}</span><span>{model.architecture}</span><Link href={`/models/${model.slug}`}>Details ↗</Link></div>
            </div>
          </div>
          <div className="form-section">
            <span className="step-number">02</span>
            <div className="form-section-body two-column-controls">
              <div className="select-field"><span>Weight format</span><StyledSelect ariaLabel="Weight format" value={quantizationId} options={quantizations.map((entry) => ({ value: entry.id, label: entry.label }))} onChange={(value) => { markStarted("weight_format"); setQuantizationId(value); }} /><small className="control-help">Lower precision reduces weight memory but requires a compatible checkpoint and runtime.</small></div>
              <div className="select-field"><span>Context</span><StyledSelect ariaLabel="Context" value={String(context)} options={availableContexts.map((entry) => ({ value: String(entry), label: `${formatContext(entry)} tokens` }))} onChange={(value) => { markStarted("context"); setContext(Number(value)); }} /><small className="control-help">Maximum active tokens per sequence; longer context increases KV cache.</small></div>
              <div className="select-field"><span>Concurrent sequences</span><StyledSelect ariaLabel="Concurrent sequences" value={String(concurrency)} options={[1, 2, 4, 8].map((entry) => ({ value: String(entry), label: String(entry) }))} onChange={(value) => { markStarted("concurrency"); setConcurrency(Number(value)); }} /><small className="control-help">Requests kept active at once; cache memory scales with this value.</small></div>
              <div className="select-field"><span>GPU count</span><StyledSelect ariaLabel="GPU count" value={String(devices)} options={[1, 2, 4, 8].map((entry) => ({ value: String(entry), label: `${entry} GPU${entry > 1 ? "s" : ""}` }))} onChange={(value) => { markStarted("gpu_count"); setDevices(Number(value)); }} /><small className="control-help">Tensor-parallel devices sharing model weights and supported cache shards.</small></div>
            </div>
          </div>
          <div className="form-section small-section">
            <span className="step-number">03</span>
            <div className="form-section-body inline-option">
              <div><label>KV cache precision</label><p>FP8 halves cache memory where supported.</p></div>
              <div className="segmented-control"><button type="button" className={kvPrecision === "fp16" ? "active" : ""} onClick={() => { markStarted("kv_precision"); setKvPrecision("fp16"); }}>FP16</button><button type="button" className={kvPrecision === "fp8" ? "active" : ""} onClick={() => { markStarted("kv_precision"); setKvPrecision("fp8"); }}>FP8</button></div>
            </div>
          </div>
        </form>

        <div className="fit-result">
          <div className="fit-verdict">
            <span>Recommended VRAM</span>
            <div><strong>{formatGiB(recommendedPerDevice)}</strong><small>per GPU × {devices}</small></div>
            <p>Includes 15% operating headroom for the selected runtime profile.</p>
          </div>

          {showCommercialCta ? (
            <div className="fit-conversion">
              <div><span>Deployment next step</span><strong>Check live capacity on Flatkey Compute.</strong><p>Carry this workload estimate into the product and review currently available GPU options.</p></div>
              <a className="primary-conversion" href={flatkeyComputeUrl(`${model.slug}_result`)} target="_blank" rel="sponsored nofollow noreferrer" onClick={() => trackSiteEvent("fit_conversion_clicked", { calculator: "model_gpu_fit", model: model.slug, recommended_vram_gib: Number(recommendedPerDevice.toFixed(2)) })}>Continue to Flatkey Compute <b>↗</b></a>
            </div>
          ) : null}

          <div className="memory-map">
            <div className="memory-map-labels"><span>Estimated allocation per GPU</span><strong>{formatGiB(perDevice)} each</strong></div>
            <div className="memory-bar" aria-label={`Estimated per-GPU memory ${formatGiB(perDevice)}`}>
              <i className="weights" style={{ width: `${weightPercent}%` }} />
              <i className="kv" style={{ width: `${kvPercent}%` }} />
              <i className="workspace" style={{ width: `${workspacePercent}%` }} />
            </div>
            <div className="memory-legend">
              <span><i className="weights" />Weights <strong>{formatGiB(perDeviceWeight)}</strong></span>
              <span><i className="kv" />KV cache <strong>{formatGiB(perDeviceKv)}</strong></span>
              <span><i className="workspace" />Runtime <strong>{formatGiB(perDeviceWorkspace)}</strong></span>
            </div>
          </div>

          <div className="recommended-stack">
            <div className="result-section-title"><span>Example cloud fits</span><Link href="/hardware">Browse profiles →</Link></div>
            {matches.length > 0 ? matches.map((gpu, index) => (
              <Link className="hardware-match" href={`/hardware/${gpu.slug}`} aria-label={`View the ${gpu.name} GPU fit profile`} key={gpu.slug} onClick={() => trackSiteEvent("recommended_gpu_clicked", { calculator: "model_gpu_fit", model: model.slug, gpu: gpu.slug, rank: index + 1, verdict: gpu.verdict })}>
                <span className="match-rank">{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{devices}× {gpu.name}</strong><small>{gpu.vramGb} GB each · {gpu.architecture}</small></div>
                <div className={`fit-pill ${gpu.verdict === "Tight fit" ? "tight" : ""}`}>{gpu.verdict}</div>
                <div className="match-price"><strong>${gpu.totalHourly.toFixed(2)}</strong><small>{gpu.priceEvidence?.kind === "live-index" ? "index / hour" : "reference / hour"}</small></div>
              </Link>
            )) : <div className="no-fit"><strong>No clean fit in the starter catalogue.</strong><span>Increase GPU count or reduce context and concurrency.</span></div>}
          </div>
          <p className="result-rate-note">Formula v{modelFitFormulaVersion} · official model configurations checked {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(modelConfigGeneratedAt))}. {priceSnapshot ? <>GPU-hour figures use the <a href={priceSnapshot.sourceUrl} target="_blank" rel="noreferrer">Flatkey price index</a> where available, updated {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(priceSnapshot.updatedAt))}; unsupported profiles remain labeled references.</> : <>Hourly figures are reviewed references, not live quotes or availability.</>}</p>

          <div className="result-reading-guide">
            <span>How to read this result</span>
            <div><strong>1. Recommended VRAM</strong><p>The estimated workload divided by the 85% planning ceiling, leaving 15% runtime headroom.</p></div>
            <div><strong>2. Memory allocation</strong><p>Weights, KV cache and runtime workspace explain what consumes memory before headroom.</p></div>
            <div><strong>3. Example cloud fits</strong><p>Capacity and price-index shortlists—not performance benchmarks or availability guarantees.</p></div>
          </div>

          <div className="launch-command">
            <div><span>Command template · vLLM</span><code>{command}</code></div>
            <button type="button" onClick={copyCommand}>{copied ? "Copied" : "Copy"}</button>
            <p className="launch-command-note">{commandNote}</p>
          </div>
          <div className="fit-actions">
            <Link href="/hardware">Compare GPU profiles →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
