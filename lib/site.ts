export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "ModelFit",
  description:
    "Estimate LLM memory, test GPU fit, and turn a model into a practical deployment plan.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
  websiteUrl:
    process.env.NEXT_PUBLIC_FLATKEY_WEBSITE_URL ||
    "https://flatkey.ai/compute",
  computeUrl:
    process.env.NEXT_PUBLIC_FLATKEY_COMPUTE_URL ||
    "https://console.flatkey.ai/compute/market",
};

export function absoluteUrl(path = "") {
  return new URL(path, siteConfig.url).toString();
}

export function flatkeyWebsiteUrl(content: string, campaign = "llm_deployment_research") {
  const url = new URL(siteConfig.websiteUrl);
  url.searchParams.set("utm_source", "modelfit");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign);
  url.searchParams.set("utm_content", content);
  return url.toString();
}

export function flatkeyComputeUrl(content: string, campaign = "model_fit") {
  const url = new URL(siteConfig.computeUrl);
  url.searchParams.set("utm_source", "modelfit");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign);
  url.searchParams.set("utm_content", content);
  return url.toString();
}
