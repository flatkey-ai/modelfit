import type { Metadata } from "next";
import Link from "next/link";
import { FitCalculator } from "@/components/fit-calculator";

export const metadata: Metadata = {
  title: "LLM VRAM calculator",
  description: "Estimate weights, KV cache, runtime overhead, and recommended GPU memory for open-model inference.",
  alternates: { canonical: "/calculator" },
  openGraph: { title: "LLM VRAM calculator", description: "Estimate model weights, KV cache, runtime overhead, and GPU capacity for LLM inference.", url: "/calculator", type: "website" },
  twitter: { card: "summary", title: "LLM VRAM calculator", description: "Estimate model weights, KV cache, runtime overhead, and GPU capacity for LLM inference." },
};

export default function CalculatorPage() {
  return (
    <main className="tool-page frame">
      <div className="crumbs"><Link href="/">Home</Link><span>/</span><strong>Calculator</strong></div>
      <header className="tool-page-header"><span className="section-index">Full worksheet</span><h1>LLM memory<br /><em>calculator.</em></h1><p>Change the deployment assumptions and see exactly which part of the workload consumes VRAM.</p></header>
      <FitCalculator />
      <div className="tool-footnote"><strong>Planning estimate</strong><p>Runtime kernels, allocator behavior, framework versions, multimodal inputs, speculative decoding, and provider-reserved memory can move the real number. Validate on the exact stack before committing capacity.</p><div><Link href="/methodology">Read the methodology →</Link><Link href="/calculators">View specialized calculators →</Link></div></div>
    </main>
  );
}
