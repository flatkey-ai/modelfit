import { hardware } from "@/lib/data";

const PRICE_INDEX_URL = process.env.FLATKEY_PRICE_INDEX_URL || "https://flatkey.ai/api/compute/price-index";
const FALLBACK_REVIEWED_AT = "2026-10-14T00:00:00.000Z";

const priceIndexModels: Record<string, string> = {
  "nvidia-rtx-4090-24gb": "RTX 4090",
  "nvidia-l40s-48gb": "L40S",
  "nvidia-a100-80gb": "A100",
  "nvidia-h100-80gb": "H100",
  "nvidia-h200-141gb": "H200",
  "nvidia-b200-180gb": "B200",
};

type ApiPriceBand = {
  high: number;
  low: number;
  price: number;
  samples: number;
  source: string;
};

type ApiPriceItem = {
  gpu_model: string;
  realtime: ApiPriceBand;
};

type ApiPriceResponse = {
  success?: boolean;
  data?: {
    items?: ApiPriceItem[];
    methodology?: string;
    updated_at?: number;
  };
};

export type HardwarePrice = {
  price: number;
  low: number | null;
  high: number | null;
  samples: number;
  source: string;
  kind: "live-index" | "reference";
  updatedAt: string;
};

export type HardwarePriceSnapshot = {
  prices: Record<string, HardwarePrice>;
  methodology: string;
  sourceUrl: string;
  updatedAt: string;
};

function fallbackSnapshot(): HardwarePriceSnapshot {
  return {
    prices: Object.fromEntries(hardware.map((gpu) => [gpu.slug, {
      price: gpu.sampleHourly,
      low: null,
      high: null,
      samples: 0,
      source: "ModelFit reviewed reference",
      kind: "reference" as const,
      updatedAt: FALLBACK_REVIEWED_AT,
    }])),
    methodology: "Reviewed planning references are used when a comparable live market index is unavailable.",
    sourceUrl: "https://flatkey.ai/compute/prices",
    updatedAt: FALLBACK_REVIEWED_AT,
  };
}

export async function getHardwarePriceSnapshot(): Promise<HardwarePriceSnapshot> {
  const fallback = fallbackSnapshot();
  try {
    const response = await fetch(PRICE_INDEX_URL, { next: { revalidate: 3600 } });
    if (!response.ok) return fallback;
    const payload = await response.json() as ApiPriceResponse;
    if (!payload.success || !payload.data?.items?.length || !payload.data.updated_at) return fallback;

    const updatedAt = new Date(payload.data.updated_at * 1000).toISOString();
    const byModel = new Map(payload.data.items.map((item) => [item.gpu_model, item.realtime]));
    const prices = { ...fallback.prices };
    for (const gpu of hardware) {
      const indexedModel = priceIndexModels[gpu.slug];
      const band = indexedModel ? byModel.get(indexedModel) : undefined;
      if (!band) continue;
      prices[gpu.slug] = {
        price: band.price,
        low: band.low,
        high: band.high,
        samples: band.samples,
        source: band.source,
        kind: "live-index",
        updatedAt,
      };
    }

    return {
      prices,
      methodology: payload.data.methodology || fallback.methodology,
      sourceUrl: "https://flatkey.ai/compute/prices",
      updatedAt,
    };
  } catch {
    return fallback;
  }
}
