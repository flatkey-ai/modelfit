export type SeoGuide = {
  slug: string;
  number: string;
  eyebrow: string;
  title: string;
  metaTitle: string;
  description: string;
  deck: string;
  tags: string[];
  readTime: string;
  sections: Array<{ title: string; paragraphs: string[]; bullets?: string[] }>;
  faq: Array<{ question: string; answer: string }>;
  relatedCalculator: string;
  relatedCalculatorLabel: string;
};

export const seoGuides: SeoGuide[] = [
  {
    slug: "llama-70b-gpu-requirements",
    number: "03",
    eyebrow: "70B weights + cache + topology",
    title: "What GPU does a 70B LLM need?",
    metaTitle: "70B LLM GPU requirements and VRAM calculator",
    description: "Estimate the GPU memory required for a 70B LLM at BF16, 8-bit, and 4-bit, including KV cache, runtime workspace, and multi-GPU planning.",
    deck: "A 70B label describes the weight floor, not the complete serving envelope. Use precision, context, concurrency, and topology to build the real plan.",
    tags: ["70B model", "GPU requirements", "multi-GPU"],
    readTime: "10 min read",
    relatedCalculator: "/calculators/multi-gpu",
    relatedCalculatorLabel: "Open the multi-GPU calculator",
    sections: [
      { title: "Start with the weight floor", paragraphs: ["A dense 70B model stores roughly 130 GiB of raw weights at BF16, about 65 GiB at 8-bit, and about 32.6 GiB at a theoretical 4-bit floor. Loaded memory is usually higher because quantized formats add scales and metadata, while some modules may remain at higher precision.", "That is why a file-size comparison is not enough. ModelFit applies format overhead before adding cache and runtime workspace, then reserves operating headroom instead of planning against every advertised gigabyte."] },
      { title: "Context and concurrency change the answer", paragraphs: ["KV cache holds attention keys and values for active tokens. Its size depends on layer count, KV heads, head dimension, cache precision, context length, and the number of active sequences. Moving from one 8K request to four 32K requests can make cache memory a first-order part of the deployment.", "Use the context accepted by the service and the peak active sequences maintained by the scheduler. The model card's maximum context is a limit, not a sensible default."] },
      { title: "Single-GPU and multi-GPU options", paragraphs: ["An 80 GB GPU may carry many 70B 4-bit workloads, but the fit can become tight after cache and runtime allocations. BF16 normally requires multiple high-memory GPUs. Tensor parallelism shards most weights, but cache sharding stops at the model's KV-head count and runtime allocations do not divide perfectly.", "Memory fit is only the first gate. Interconnect bandwidth, collective communication, kernel support, and host topology determine whether a valid memory plan delivers useful throughput."], bullets: ["Use one 80 GB GPU only after validating the exact quantized checkpoint.", "Use 2× or 4× high-memory GPUs when precision, cache, or concurrency exceeds the single-device envelope.", "Benchmark latency and throughput on the provider topology before committing capacity."] },
      { title: "A practical validation sequence", paragraphs: ["Choose the actual checkpoint and runtime, set the intended context and concurrency, calculate the per-device allocation, and keep headroom. Then run a cold load, sustained generation, and peak-concurrency test while recording device memory and failure behavior.", "Treat a calculator result as a shortlist. The final answer belongs to the exact model revision, quantization backend, runtime version, launch flags, GPU form factor, and provider configuration."] },
    ],
    faq: [
      { question: "Can a 70B model fit on one 48 GB GPU?", answer: "Some 4-bit checkpoints may load, but cache, workspace, quantization metadata, and runtime behavior can push the workload beyond a stable 48 GB plan. Validate the exact stack." },
      { question: "Is an 80 GB GPU enough for a 70B model?", answer: "It is often a practical starting point for 4-bit inference, but context, concurrency, adapters, and runtime allocations determine whether the fit is comfortable." },
      { question: "How many GPUs does BF16 70B inference need?", answer: "Raw BF16 weights alone are about 130 GiB, so at least two high-memory devices are required and additional cache, workspace, and headroom must be included." },
    ],
  },
  {
    slug: "llm-quantization-vram",
    number: "04",
    eyebrow: "BF16 vs 8-bit vs 4-bit",
    title: "How quantization changes LLM VRAM",
    metaTitle: "LLM quantization VRAM: BF16 vs INT8 vs Q4",
    description: "Compare BF16, INT8, FP8, 6-bit, 5-bit, and 4-bit LLM memory requirements, including format overhead and runtime compatibility.",
    deck: "Lower bit width reduces the largest memory block, but it does not shrink KV cache, workspace, or every layer by the same ratio.",
    tags: ["quantization", "Q4", "INT8"],
    readTime: "9 min read",
    relatedCalculator: "/calculators/model-memory",
    relatedCalculatorLabel: "Open the weight-memory calculator",
    sections: [
      { title: "Bit width sets the raw weight floor", paragraphs: ["BF16 and FP16 use two bytes per parameter. INT8 begins around one byte, while a 4-bit representation begins around half a byte. Dividing parameter count by bit width gives a useful first estimate, but not the loaded footprint.", "Quantized files store scales, zero points, group metadata, and sometimes higher-precision output or normalization layers. ModelFit therefore uses an explicit packing coefficient rather than promising that Q4 is exactly one quarter of BF16 memory."] },
      { title: "Weights are not the whole allocation", paragraphs: ["Quantization primarily changes model weights. KV cache precision is a separate decision, and runtime workspace, graph capture, adapters, multimodal encoders, and allocator fragmentation may remain largely unchanged.", "For small models or long-context workloads, the non-weight portion can be large enough that moving from 8-bit to 4-bit saves less total VRAM than the bit ratio suggests."] },
      { title: "Compatibility matters more than the label", paragraphs: ["A Q4 label can refer to different packing layouts and kernels. A checkpoint must match the backend expected by vLLM, llama.cpp, TensorRT-LLM, or another runtime. Unsupported combinations may fail to load, silently dequantize, or deliver poor performance.", "Use quality benchmarks that match the workload. Weight-only quantization may preserve general quality while affecting coding, reasoning, multilingual, or tool-use behavior differently."], bullets: ["Confirm the checkpoint format and quantization backend.", "Verify that the target GPU has supported kernels.", "Measure output quality and throughput, not only successful loading."] },
      { title: "Choose precision from the deployment goal", paragraphs: ["Use BF16 when quality, compatibility, and predictable kernels matter more than capacity cost. Use 8-bit when the platform supports efficient kernels and a moderate memory reduction is sufficient. Use 4-bit when fitting a larger model is the primary constraint and the quality/runtime trade-off has been validated.", "Keep the calculation auditable: record the checkpoint, format, runtime, device, context, concurrency, and measured peak memory alongside the estimate."] },
    ],
    faq: [
      { question: "Does 4-bit quantization reduce VRAM by exactly 75%?", answer: "No. Raw weights approach that reduction, but format metadata, higher-precision modules, KV cache, and runtime workspace reduce the total saving." },
      { question: "Is FP8 the same as INT8?", answer: "Both use eight bits, but they have different numeric representations, kernels, hardware support, and quality characteristics." },
      { question: "Does weight quantization reduce KV cache memory?", answer: "Not automatically. KV cache precision is configured separately and must be supported by the model, runtime, and GPU." },
    ],
  },
  {
    slug: "a100-vs-h100-llm-inference",
    number: "05",
    eyebrow: "Capacity first, then throughput",
    title: "A100 vs H100 for LLM inference",
    metaTitle: "A100 vs H100 for LLM inference: VRAM and cost",
    description: "Compare NVIDIA A100 and H100 for LLM inference by VRAM capacity, model fit, precision support, throughput, topology, and GPU-hour price.",
    deck: "Both common 80 GB configurations can fit the same memory envelope. The decision changes when throughput, precision, interconnect, and price enter the plan.",
    tags: ["A100", "H100", "GPU comparison"],
    readTime: "8 min read",
    relatedCalculator: "/calculator",
    relatedCalculatorLabel: "Test the workload on both profiles",
    sections: [
      { title: "Equal capacity does not mean equal performance", paragraphs: ["An 80 GB A100 and an 80 GB H100 expose a similar advertised memory capacity, so a pure fit calculation may return the same verdict. ModelFit still applies the same 85% planning ceiling because drivers, kernels, graph capture, and workload variance need room on both devices.", "H100 generally offers newer tensor cores, stronger low-precision support, and higher memory bandwidth. A100 remains widely available and can be cost-effective when the workload already meets latency and throughput targets."] },
      { title: "Start with the workload envelope", paragraphs: ["Calculate weights, KV cache, workspace, and headroom before comparing speed. If the workload exceeds the single-device envelope, the decision becomes a topology question rather than an A100-versus-H100 benchmark.", "For workloads that fit, record input length, output length, batch or concurrency, cache precision, and service-level target. Tokens per second without the same workload shape is not a useful comparison."] },
      { title: "Price must be tied to time and source", paragraphs: ["GPU-hour prices vary by region, provider, availability class, commitment term, and host topology. ModelFit uses the Flatkey public price index where a comparable model is covered, showing its timestamp, range, sample count, and methodology.", "A lower hourly rate can still be more expensive per generated token if the device delivers materially lower throughput. Compare cost per successful workload or cost per million generated tokens after benchmarking."], bullets: ["Check whether the quote is on-demand, spot, or reserved.", "Confirm PCIe versus SXM form factor and multi-GPU interconnect.", "Use the same runtime and request mix in the benchmark."] },
      { title: "A practical decision rule", paragraphs: ["Choose A100 when it meets the service target with a meaningful cost advantage and the required precision/runtime is mature. Choose H100 when lower latency, higher concurrency, FP8 support, or faster batch processing compensates for the higher rate.", "Do not decide from peak specifications alone. Fit the workload, benchmark both profiles, and make the commercial decision from measured throughput, error rate, and total cost."] },
    ],
    faq: [
      { question: "Can A100 and H100 fit the same models?", answer: "Comparable 80 GB configurations have similar capacity, so many memory-fit results are the same. Performance and precision support can differ substantially." },
      { question: "Is H100 always cheaper per token?", answer: "No. It may deliver more throughput, but the hourly premium, utilization, workload shape, and provider configuration determine cost per token." },
      { question: "Should I compare PCIe and SXM as the same GPU?", answer: "No. Power limits, bandwidth, and interconnect topology can materially affect performance, especially for multi-GPU inference." },
    ],
  },
  {
    slug: "multi-gpu-llm-inference",
    number: "06",
    eyebrow: "Memory fit + communication cost",
    title: "How to size multi-GPU LLM inference",
    metaTitle: "Multi-GPU LLM inference sizing guide",
    description: "Plan multi-GPU LLM inference with tensor parallelism, per-device VRAM, KV-cache sharding, runtime workspace, interconnect, and validation steps.",
    deck: "Adding GPUs can solve a memory problem while creating a communication problem. Size the per-device allocation and the topology together.",
    tags: ["tensor parallel", "GPU topology", "LLM serving"],
    readTime: "11 min read",
    relatedCalculator: "/calculators/multi-gpu",
    relatedCalculatorLabel: "Open the topology calculator",
    sections: [
      { title: "Calculate per-device memory", paragraphs: ["A first tensor-parallel estimate divides weight memory by the GPU count. KV cache can also shard, but only up to the model's KV-head count, while runtime workspace keeps a per-device floor. ModelFit exposes these buckets separately so the division is not treated as perfect.", "Compare the resulting subtotal against 85% of each GPU's advertised capacity. The remaining 15% is operating headroom, not unused waste: it protects the deployment from allocators, kernels, graph capture, fragmentation, and workload variance."] },
      { title: "Interconnect can dominate", paragraphs: ["Tensor-parallel layers exchange data during inference. The more devices involved, the more the deployment depends on NVLink, NVSwitch, PCIe topology, and collective communication behavior. A configuration that fits in memory can still miss latency or throughput targets.", "Provider pages may list a GPU count without describing whether the devices share a host or a high-bandwidth fabric. Confirm the actual topology before treating an 8-GPU offer as equivalent to another 8-GPU offer."] },
      { title: "Do not scale cache past the architecture", paragraphs: ["Grouped-query and multi-query attention use fewer KV heads than attention heads. Cache sharding cannot usefully extend beyond the number of KV heads represented by the architecture. ModelFit caps the cache shard count at that boundary.", "Schedulers, prefix caching, speculative decoding, and multimodal components can create additional allocations. Include the exact serving features used in production when validating the plan."], bullets: ["Record the model revision and KV-head count.", "Test the intended cache precision and context length.", "Measure peak memory on every device, not only device zero."] },
      { title: "Validate failure behavior", paragraphs: ["Run cold startup, steady generation, peak concurrency, and long-context tests. Observe load time, peak memory, tokens per second, latency percentiles, collective timeouts, and out-of-memory recovery.", "Use the smallest topology that meets both the memory envelope and service target. Additional GPUs are not automatically safer or cheaper once communication and idle capacity are included."] },
    ],
    faq: [
      { question: "Does adding two GPUs double usable VRAM?", answer: "It can nearly double the sharded weight capacity, but cache and runtime allocations do not always divide perfectly, and communication overhead increases." },
      { question: "What is tensor parallelism?", answer: "Tensor parallelism splits model operations across GPUs within each layer, allowing large weights to be served across multiple devices." },
      { question: "Do I need NVLink for multi-GPU inference?", answer: "Not every workload requires it, but high-bandwidth interconnect often matters for latency and throughput as tensor-parallel communication grows." },
    ],
  },
];

export function getSeoGuide(slug: string) {
  return seoGuides.find((guide) => guide.slug === slug);
}
