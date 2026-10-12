export type ModelRecord = {
  slug: string;
  modelId: string;
  name: string;
  family: string;
  maker: string;
  parametersB: number;
  activeParametersB?: number;
  nativeContext: number;
  architecture: string;
  license: string;
  /** FP16 full-attention KV cache GiB per 1,000 active tokens, derived from the model config. */
  kvGiBPer1kTokens: number;
  /** Configured KV-head count, used to avoid assuming impossible cache sharding. */
  kvHeads: number;
  /** Optional hybrid-cache behavior for architectures with local/sliding attention layers. */
  slidingWindowTokens?: number;
  slidingWindowLayerFraction?: number;
  tags: string[];
  summary: string;
  sourceUrl: string;
};

export type Hardware = {
  slug: string;
  name: string;
  maker: "NVIDIA" | "AMD";
  vramGb: number;
  tier: "Consumer" | "Cloud" | "Datacenter";
  architecture: string;
  sampleHourly: number;
  note: string;
};

export type Quantization = {
  id: string;
  label: string;
  bits: number;
  overhead: number;
  quality: string;
};

export const quantizations: Quantization[] = [
  { id: "bf16", label: "BF16 / FP16", bits: 16, overhead: 1.03, quality: "Full precision" },
  { id: "int8", label: "INT8 / FP8", bits: 8, overhead: 1.08, quality: "Near-original" },
  { id: "q6", label: "6-bit", bits: 6, overhead: 1.12, quality: "High" },
  { id: "q5", label: "5-bit", bits: 5, overhead: 1.14, quality: "Balanced" },
  { id: "q4", label: "4-bit", bits: 4, overhead: 1.16, quality: "Efficient" },
];

// KV coefficients use the official model configuration dimensions and the FP16 formula:
// 2 (K + V) × layers × KV heads × head dimension × 2 bytes × 1,000 / 2^30.
// Gemma 2 hybrid-cache metadata follows google/gemma_pytorch's alternating local/global layers.
export const models: ModelRecord[] = [
  {
    slug: "phi-3-mini-128k-instruct",
    modelId: "microsoft/Phi-3-mini-128k-instruct",
    name: "Phi-3 Mini 128K",
    family: "Phi-3",
    maker: "Microsoft",
    parametersB: 3.8,
    nativeContext: 131072,
    architecture: "Dense transformer",
    license: "MIT",
    kvGiBPer1kTokens: 0.366211, // 32 layers × 32 KV heads × 96 head dim
    kvHeads: 32,
    tags: ["small", "long context", "local"],
    summary: "A compact long-context model suited to laptops, small GPUs, and low-cost endpoints.",
    sourceUrl: "https://huggingface.co/microsoft/Phi-3-mini-128k-instruct",
  },
  {
    slug: "mistral-7b-instruct-v03",
    modelId: "mistralai/Mistral-7B-Instruct-v0.3",
    name: "Mistral 7B Instruct v0.3",
    family: "Mistral 7B",
    maker: "Mistral AI",
    parametersB: 7.3,
    nativeContext: 32768,
    architecture: "Dense transformer",
    license: "Apache 2.0",
    kvGiBPer1kTokens: 0.12207, // 32 layers × 8 KV heads × 128 head dim
    kvHeads: 8,
    tags: ["general", "instruct", "open"],
    summary: "A dependable open 7B baseline with broad runtime and quantization support.",
    sourceUrl: "https://docs.mistral.ai/models/mistral-7b-0-3",
  },
  {
    slug: "qwen25-7b-instruct",
    modelId: "Qwen/Qwen2.5-7B-Instruct",
    name: "Qwen2.5 7B Instruct",
    family: "Qwen2.5",
    maker: "Alibaba Cloud",
    parametersB: 7.61,
    nativeContext: 32768,
    architecture: "Dense transformer · GQA",
    license: "Apache 2.0",
    kvGiBPer1kTokens: 0.053406, // 28 layers × 4 KV heads × 128 head dim
    kvHeads: 4,
    tags: ["multilingual", "coding", "instruct"],
    summary: "A compact multilingual model with strong instruction following and efficient GQA memory use.",
    sourceUrl: "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct",
  },
  {
    slug: "llama-31-8b-instruct",
    modelId: "meta-llama/Llama-3.1-8B-Instruct",
    name: "Llama 3.1 8B Instruct",
    family: "Llama 3.1",
    maker: "Meta",
    parametersB: 8,
    nativeContext: 131072,
    architecture: "Dense transformer · GQA",
    license: "Llama 3.1 Community",
    kvGiBPer1kTokens: 0.12207, // 32 layers × 8 KV heads × 128 head dim
    kvHeads: 8,
    tags: ["general", "long context", "popular"],
    summary: "A mainstream small model with a large context window and a mature deployment ecosystem.",
    sourceUrl: "https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct",
  },
  {
    slug: "gemma-2-9b-it",
    modelId: "google/gemma-2-9b-it",
    name: "Gemma 2 9B",
    family: "Gemma 2",
    maker: "Google",
    parametersB: 9,
    nativeContext: 8192,
    architecture: "Dense transformer · sliding attention",
    license: "Gemma",
    kvGiBPer1kTokens: 0.320435, // 42 layers × 8 KV heads × 256 head dim
    kvHeads: 8,
    slidingWindowTokens: 4096,
    slidingWindowLayerFraction: 0.5,
    tags: ["general", "local", "instruct"],
    summary: "A compact instruction model that targets high quality within consumer GPU memory limits.",
    sourceUrl: "https://ai.google.dev/gemma/docs/core/model_card_2",
  },
  {
    slug: "qwen25-14b-instruct",
    modelId: "Qwen/Qwen2.5-14B-Instruct",
    name: "Qwen2.5 14B Instruct",
    family: "Qwen2.5",
    maker: "Alibaba Cloud",
    parametersB: 14.7,
    nativeContext: 32768,
    architecture: "Dense transformer · GQA",
    license: "Apache 2.0",
    kvGiBPer1kTokens: 0.183105, // 48 layers × 8 KV heads × 128 head dim
    kvHeads: 8,
    tags: ["multilingual", "coding", "mid-size"],
    summary: "A capable mid-size model that remains practical on 24 GB hardware when quantized.",
    sourceUrl: "https://huggingface.co/Qwen/Qwen2.5-14B-Instruct",
  },
  {
    slug: "gemma-2-27b-it",
    modelId: "google/gemma-2-27b-it",
    name: "Gemma 2 27B",
    family: "Gemma 2",
    maker: "Google",
    parametersB: 27,
    nativeContext: 8192,
    architecture: "Dense transformer · sliding attention",
    license: "Gemma",
    kvGiBPer1kTokens: 0.350952, // 46 layers × 16 KV heads × 128 head dim
    kvHeads: 16,
    slidingWindowTokens: 4096,
    slidingWindowLayerFraction: 0.5,
    tags: ["quality", "single GPU", "instruct"],
    summary: "A larger Gemma model that lands neatly in the 24–48 GB deployment decision range.",
    sourceUrl: "https://ai.google.dev/gemma/docs/core/model_card_2",
  },
  {
    slug: "qwen25-32b-instruct",
    modelId: "Qwen/Qwen2.5-32B-Instruct",
    name: "Qwen2.5 32B Instruct",
    family: "Qwen2.5",
    maker: "Alibaba Cloud",
    parametersB: 32.5,
    nativeContext: 32768,
    architecture: "Dense transformer · GQA",
    license: "Apache 2.0",
    kvGiBPer1kTokens: 0.244141, // 64 layers × 8 KV heads × 128 head dim
    kvHeads: 8,
    tags: ["coding", "reasoning", "multilingual"],
    summary: "A strong mid-large model that distinguishes 24 GB, 48 GB, and 80 GB deployment options.",
    sourceUrl: "https://huggingface.co/Qwen/Qwen2.5-32B-Instruct",
  },
  {
    slug: "mixtral-8x7b-instruct",
    modelId: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    name: "Mixtral 8×7B Instruct",
    family: "Mixtral",
    maker: "Mistral AI",
    parametersB: 46.7,
    activeParametersB: 12.9,
    nativeContext: 32768,
    architecture: "Sparse mixture of experts",
    license: "Apache 2.0",
    kvGiBPer1kTokens: 0.12207, // 32 layers × 8 KV heads × 128 head dim
    kvHeads: 8,
    tags: ["MoE", "instruct", "throughput"],
    summary: "A sparse expert model whose active compute is smaller than its full weight-memory footprint.",
    sourceUrl: "https://mistral.ai/news/mixtral-of-experts/",
  },
  {
    slug: "llama-31-70b-instruct",
    modelId: "meta-llama/Llama-3.1-70B-Instruct",
    name: "Llama 3.1 70B Instruct",
    family: "Llama 3.1",
    maker: "Meta",
    parametersB: 70,
    nativeContext: 131072,
    architecture: "Dense transformer · GQA",
    license: "Llama 3.1 Community",
    kvGiBPer1kTokens: 0.305176, // 80 layers × 8 KV heads × 128 head dim
    kvHeads: 8,
    tags: ["large", "production", "long context"],
    summary: "A common production reference point for multi-GPU serving and long-context planning.",
    sourceUrl: "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct",
  },
  {
    slug: "qwen25-72b-instruct",
    modelId: "Qwen/Qwen2.5-72B-Instruct",
    name: "Qwen2.5 72B Instruct",
    family: "Qwen2.5",
    maker: "Alibaba Cloud",
    parametersB: 72.7,
    nativeContext: 32768,
    architecture: "Dense transformer · GQA",
    license: "Qwen",
    kvGiBPer1kTokens: 0.305176, // 80 layers × 8 KV heads × 128 head dim
    kvHeads: 8,
    tags: ["large", "multilingual", "reasoning"],
    summary: "A large multilingual model typically deployed with quantization or tensor parallelism.",
    sourceUrl: "https://huggingface.co/Qwen/Qwen2.5-72B-Instruct",
  },
];

export const hardware: Hardware[] = [
  { slug: "nvidia-t4-16gb", name: "NVIDIA T4", maker: "NVIDIA", vramGb: 16, tier: "Cloud", architecture: "Turing", sampleHourly: 0.2, note: "Budget inference" },
  { slug: "nvidia-l4-24gb", name: "NVIDIA L4", maker: "NVIDIA", vramGb: 24, tier: "Cloud", architecture: "Ada Lovelace", sampleHourly: 0.43, note: "Efficient inference" },
  { slug: "nvidia-rtx-4090-24gb", name: "RTX 4090", maker: "NVIDIA", vramGb: 24, tier: "Consumer", architecture: "Ada Lovelace", sampleHourly: 0.32, note: "Local performance" },
  { slug: "nvidia-l40s-48gb", name: "NVIDIA L40S", maker: "NVIDIA", vramGb: 48, tier: "Datacenter", architecture: "Ada Lovelace", sampleHourly: 0.69, note: "Inference sweet spot" },
  { slug: "nvidia-a100-80gb", name: "NVIDIA A100 80GB", maker: "NVIDIA", vramGb: 80, tier: "Datacenter", architecture: "Ampere", sampleHourly: 0.88, note: "Mature datacenter" },
  { slug: "nvidia-h100-80gb", name: "NVIDIA H100", maker: "NVIDIA", vramGb: 80, tier: "Datacenter", architecture: "Hopper", sampleHourly: 1.56, note: "High throughput" },
  { slug: "nvidia-h200-141gb", name: "NVIDIA H200", maker: "NVIDIA", vramGb: 141, tier: "Datacenter", architecture: "Hopper", sampleHourly: 3.42, note: "Long-context memory" },
  { slug: "nvidia-b200-180gb", name: "NVIDIA B200", maker: "NVIDIA", vramGb: 180, tier: "Datacenter", architecture: "Blackwell", sampleHourly: 5.5, note: "Frontier systems" },
  { slug: "amd-mi300x-192gb", name: "AMD MI300X", maker: "AMD", vramGb: 192, tier: "Datacenter", architecture: "CDNA 3", sampleHourly: 2.95, note: "Large HBM capacity" },
];

export const getModel = (slug: string) => models.find((model) => model.slug === slug);
export const getHardware = (slug: string) => hardware.find((gpu) => gpu.slug === slug);

export function estimateMemory(
  model: ModelRecord,
  quantization: Quantization,
  context: number,
  concurrency: number,
  kvPrecision: "fp16" | "fp8" = "fp16",
) {
  const weightGiB = (model.parametersB * 1_000_000_000 * (quantization.bits / 8)) / 1_073_741_824 * quantization.overhead;
  const kvMultiplier = kvPrecision === "fp8" ? 0.5 : 1;
  const slidingFraction = model.slidingWindowLayerFraction ?? 0;
  const slidingTokens = model.slidingWindowTokens
    ? Math.min(context, model.slidingWindowTokens)
    : context;
  const cacheTokenEquivalents = context * (1 - slidingFraction) + slidingTokens * slidingFraction;
  const kvGiB = model.kvGiBPer1kTokens * (cacheTokenEquivalents / 1000) * concurrency * kvMultiplier;
  const workspaceGiB = Math.max(2, weightGiB * 0.1);
  const subtotalGiB = weightGiB + kvGiB + workspaceGiB;
  const recommendedGiB = subtotalGiB / 0.85;
  return { weightGiB, kvGiB, workspaceGiB, subtotalGiB, recommendedGiB };
}

export function estimatePerDeviceMemory(
  model: ModelRecord,
  estimate: ReturnType<typeof estimateMemory>,
  devices: number,
) {
  const weightGiB = estimate.weightGiB / devices;
  // Tensor parallel runtimes cannot keep splitting KV heads once every rank has one.
  const kvShardCount = Math.min(devices, model.kvHeads);
  const kvGiB = estimate.kvGiB / kvShardCount;
  const workspaceGiB = Math.max(2, weightGiB * 0.1);
  const subtotalGiB = weightGiB + kvGiB + workspaceGiB;
  return { weightGiB, kvGiB, workspaceGiB, subtotalGiB, kvShardCount };
}
