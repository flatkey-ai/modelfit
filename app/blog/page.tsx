import type { Metadata } from "next";
import Link from "next/link";
import { blogDate, blogExcerpt, fetchBlogPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "LLM memory, VRAM, and GPU fit guides",
  description: "Evidence-backed guides for calculating LLM memory, sizing KV cache, comparing GPUs, and planning inference deployments.",
  alternates: { canonical: absoluteUrl("/blog") },
};

export default async function BlogPage() {
  const posts = await fetchBlogPosts();

  return (
    <main className="blog-page">
      <header className="frame blog-index-hero">
        <div>
          <span className="blog-kicker">ModelFit field notes / English</span>
          <h1>Plan memory.<br /><em>Avoid OOM.</em></h1>
        </div>
        <p>Practical, sourced explanations for model weights, KV cache, context length, quantization, concurrency, and the GPUs that can carry the workload.</p>
      </header>

      <section className="frame blog-index" aria-label="Latest articles">
        <div className="blog-index-heading"><span>Latest research</span><span>{posts.length} published</span></div>
        {posts.length ? (
          <div className="blog-card-grid">
            {posts.map((post, index) => (
              <article className="blog-card" key={post.id}>
                <Link href={`/blog/${post.slug}`} aria-label={`Read ${post.title}`}>
                  {post.cover_image_url ? <img src={post.cover_image_url} alt="" /> : <span className="blog-card-signal">{String(index + 1).padStart(2, "0")}</span>}
                  <div className="blog-card-body">
                    <div className="blog-card-meta"><span>{post.category?.name || "Model planning"}</span><time dateTime={post.published_at || post.updated_at}>{blogDate(post.published_at || post.updated_at)}</time></div>
                    <h2>{post.title}</h2>
                    <p>{blogExcerpt(post)}</p>
                    <b>Read guide →</b>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="blog-empty"><strong>The publishing pipeline is ready.</strong><p>Reviewed ModelFit research will appear here after the first article is approved and published.</p><Link href="/guides">Browse current guides →</Link></div>
        )}
      </section>
    </main>
  );
}
