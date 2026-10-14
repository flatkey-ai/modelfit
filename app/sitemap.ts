import type { MetadataRoute } from "next";
import { hardware, models } from "@/lib/data";
import { fetchBlogPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { route: "", priority: 1, changeFrequency: "weekly" as const },
    { route: "/calculator", priority: .95, changeFrequency: "monthly" as const },
    { route: "/models", priority: .9, changeFrequency: "monthly" as const },
    { route: "/hardware", priority: .9, changeFrequency: "monthly" as const },
    { route: "/guides", priority: .8, changeFrequency: "monthly" as const },
    { route: "/guides/llm-vram-calculator", priority: .85, changeFrequency: "monthly" as const },
    { route: "/guides/context-window-vram", priority: .85, changeFrequency: "monthly" as const },
    { route: "/blog", priority: .8, changeFrequency: "weekly" as const },
    { route: "/methodology", priority: .7, changeFrequency: "yearly" as const },
  ].map(({ route, priority, changeFrequency }) => ({ url: absoluteUrl(route || "/"), priority, changeFrequency }));
  const modelRoutes: MetadataRoute.Sitemap = models.map((model) => ({ url: absoluteUrl(`/models/${model.slug}`), changeFrequency: "monthly", priority: .75 }));
  const hardwareRoutes: MetadataRoute.Sitemap = hardware.map((gpu) => ({ url: absoluteUrl(`/hardware/${gpu.slug}`), changeFrequency: "monthly", priority: .75 }));
  const posts = await fetchBlogPosts(100);
  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.updated_at,
    changeFrequency: "monthly",
    priority: .7,
  }));
  return [...staticRoutes, ...modelRoutes, ...hardwareRoutes, ...blogRoutes];
}
