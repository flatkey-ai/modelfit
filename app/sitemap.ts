import type { MetadataRoute } from "next";
import { models } from "@/lib/data";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/calculator", "/methodology"].map((route) => ({ url: `${siteConfig.url}${route}`, lastModified: new Date() }));
  const modelRoutes = models.map((model) => ({ url: `${siteConfig.url}/models/${model.slug}`, lastModified: new Date() }));
  return [...staticRoutes, ...modelRoutes];
}
