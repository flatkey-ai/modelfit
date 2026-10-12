"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { estimateMemory, hardware, models, quantizations } from "@/lib/data";
import { flatkeyComputeUrl, siteConfig } from "@/lib/site";

type FitCalculatorProps = {
  initialModelSlug?: string;
  compact?: boolean;
};

const contexts = [2048, 4096, 8192, 16384, 32768, 65536, 131072];

const formatContext = (value: number) => value >= 1024 ? `${Math.round(value / 1024)}K` : String(value);
const formatGiB = (value: number) => `${value.toFixed(value < 10 ? 1 : 0)} GiB`;

export function FitCalculator({ initialModelSlug = "llama-31-8b-instruct", compact = false }: FitCalculatorProps) {
  const [modelSlug, setModelSlug] = useState(initialModelSlug);
  const [quantizationId, setQuantizationId] = useState("q4");
  const [context, setContext] = useState(8192);
  const [concurrency, setConcurrency] = useState(1);
  const [devices, setDevices] = useState(1);
  const [kvPrecision, setKvPrecision] = useState<"fp16" | "fp8">("fp16");
  const [copied, setCopied] = useState(false);

  const model = models.find((entry) => entry.slug === modelSlug) || models[0];
  const quantization = quantizations.find((entry) => entry.id === quantizationId) || quantizations[0];
  const estimate = estimateMemory(model, quantization, context, concurrency, kvPrecision);
  const perDevice = (estimate.weightGiB + estimate.kvGiB) / devices + estimate.workspaceGiB;
  const recommendedPerDevice = perDevice / 0.85;

  const matches = useMemo(() => {
    return hardware
      .map((gpu) => {
        const utilization = perDevice / gpu.vramGb;
        const verdict = utilization <= 0.8 ? "Comfortable" : utilization <= 0.92 ? "Tight fit" : "Does not fit";
        return { ...gpu, utilization, verdict, totalHourly: gpu.sampleHourly * devices };
      })
      .filter((gpu) => gpu.verdict !== "Does not fit")
      .sort((a, b) => a.totalHourly - b.totalHourly || a.vramGb - b.vramGb)
      .slice(0, 3);
  }, [devices, perDevice]);

  const weightPercent = estimate.weightGiB / estimate.subtotalGiB * 100;
  const kvPercent = estimate.kvGiB / estimate.subtotalGiB * 100;
  const workspacePercent = 100 - weightPercent - kvPercent;
  const maxContext = Math.min(model.nativeContext, 131072);
  const availableContexts = contexts.filter((entry) => entry <= maxContext);
  const command = `vllm serve ${model.modelId} --tensor-parallel-size ${devices} --max-model-len ${context}`;

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className={`fit-tool ${compact ? "compact" : ""}`}>
      <div className="fit-tool-head">
        <div><span className="micro-label">Deployment worksheet</span><strong>MODEL / GPU FIT</strong></div>
        <span className="estimate-badge"><i /> Calculated estimate</span>
      </div>
      <div className="fit-body">
        <form className="fit-form" onSubmit={(event) => event.preventDefault()}>
          <div className="form-section">
            <span className="step-number">01</span>
            <div className="form-section-body">
              <label htmlFor="model">Model</label>
              <select id="model" value={modelSlug} onChange={(event) => {
                const nextModel = models.find((entry) => entry.slug === event.target.value);
                setModelSlug(event.target.value);
                if (nextModel && context > nextModel.nativeContext) setContext(nextModel.nativeContext);
              }}>
                {models.map((entry) => <option key={entry.slug} value={entry.slug}>{entry.name} · {entry.parametersB}B</option>)}
              </select>
              <div className="model-meta"><span>{model.maker}</span><span>{model.architecture}</span><Link href={`/models/${model.slug}`}>Details ↗</Link></div>
            </div>
          </div>
          <div className="form-section">
            <span className="step-number">02</span>
            <div className="form-section-body two-column-controls">
              <label><span>Weight format</span><select value={quantizationId} onChange={(event) => setQuantizationId(event.target.value)}>{quantizations.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label>
              <label><span>Context</span><select value={context} onChange={(event) => setContext(Number(event.target.value))}>{availableContexts.map((entry) => <option key={entry} value={entry}>{formatContext(entry)} tokens</option>)}</select></label>
              <label><span>Concurrent sequences</span><select value={concurrency} onChange={(event) => setConcurrency(Number(event.target.value))}>{[1, 2, 4, 8].map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select></label>
              <label><span>GPU count</span><select value={devices} onChange={(event) => setDevices(Number(event.target.value))}>{[1, 2, 4, 8].map((entry) => <option key={entry} value={entry}>{entry} GPU{entry > 1 ? "s" : ""}</option>)}</select></label>
            </div>
          </div>
          <div className="form-section small-section">
            <span className="step-number">03</span>
            <div className="form-section-body inline-option">
              <div><label>KV cache precision</label><p>FP8 halves cache memory where supported.</p></div>
              <div className="segmented-control"><button type="button" className={kvPrecision === "fp16" ? "active" : ""} onClick={() => setKvPrecision("fp16")}>FP16</button><button type="button" className={kvPrecision === "fp8" ? "active" : ""} onClick={() => setKvPrecision("fp8")}>FP8</button></div>
            </div>
          </div>
        </form>

        <div className="fit-result">
          <div className="fit-verdict">
            <span>Recommended VRAM</span>
            <div><strong>{formatGiB(recommendedPerDevice)}</strong><small>per GPU × {devices}</small></div>
            <p>Includes 15% operating headroom for the selected runtime profile.</p>
          </div>

          <div className="memory-map">
            <div className="memory-map-labels"><span>Estimated allocation</span><strong>{formatGiB(estimate.subtotalGiB)} total</strong></div>
            <div className="memory-bar" aria-label={`Estimated memory ${formatGiB(estimate.subtotalGiB)}`}>
              <i className="weights" style={{ width: `${weightPercent}%` }} />
              <i className="kv" style={{ width: `${kvPercent}%` }} />
              <i className="workspace" style={{ width: `${workspacePercent}%` }} />
            </div>
            <div className="memory-legend">
              <span><i className="weights" />Weights <strong>{formatGiB(estimate.weightGiB)}</strong></span>
              <span><i className="kv" />KV cache <strong>{formatGiB(estimate.kvGiB)}</strong></span>
              <span><i className="workspace" />Runtime <strong>{formatGiB(estimate.workspaceGiB)}</strong></span>
            </div>
          </div>

          <div className="recommended-stack">
            <div className="result-section-title"><span>Best cloud fits</span><small>using sample rates</small></div>
            {matches.length > 0 ? matches.map((gpu, index) => (
              <a className="hardware-match" href={flatkeyComputeUrl(`${model.slug}_${gpu.slug}`)} target="_blank" rel="noreferrer" key={gpu.slug}>
                <span className="match-rank">{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{devices}× {gpu.name}</strong><small>{gpu.vramGb} GB each · {gpu.architecture}</small></div>
                <div className={`fit-pill ${gpu.verdict === "Tight fit" ? "tight" : ""}`}>{gpu.verdict}</div>
                <div className="match-price"><strong>${gpu.totalHourly.toFixed(2)}</strong><small>/ hour</small></div>
              </a>
            )) : <div className="no-fit"><strong>No clean fit in the starter catalogue.</strong><span>Increase GPU count or reduce context and concurrency.</span></div>}
          </div>

          <div className="launch-command">
            <div><span>Starter command · vLLM</span><code>{command}</code></div>
            <button type="button" onClick={copyCommand}>{copied ? "Copied" : "Copy"}</button>
          </div>
          <div className="fit-actions">
            <a className="primary-conversion" href={flatkeyComputeUrl(`${model.slug}_result`)} target="_blank" rel="noreferrer">Find this compute on Flatkey ↗</a>
            <a href={siteConfig.gpuPricesUrl} target="_blank" rel="noreferrer">Compare the GPU market →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
