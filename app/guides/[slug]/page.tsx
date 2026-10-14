import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { absoluteUrl } from "@/lib/site";
import { getSeoGuide, seoGuides } from "@/lib/seo-guides";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return seoGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const guide = getSeoGuide((await params).slug);
  if (!guide) return {};
  const url = `/guides/${guide.slug}`;
  return {
    title: guide.metaTitle,
    description: guide.description,
    alternates: { canonical: url },
    openGraph: { title: guide.metaTitle, description: guide.description, url, type: "article" },
    twitter: { card: "summary", title: guide.metaTitle, description: guide.description },
  };
}

export default async function SeoGuidePage({ params }: PageProps) {
  const guide = getSeoGuide((await params).slug);
  if (!guide) notFound();
  const url = absoluteUrl(`/guides/${guide.slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "TechArticle", headline: guide.title, description: guide.description, url, mainEntityOfPage: url, about: guide.tags },
      { "@type": "FAQPage", mainEntity: guide.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    ],
  };

  return (
    <main className="guide-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <article>
        <header className="guide-hero frame">
          <div className="crumbs"><Link href="/">Home</Link><span>/</span><Link href="/guides">Guides</Link><span>/</span><strong>{guide.title}</strong></div>
          <div className="guide-hero-grid"><div><span className="section-index">Guide {guide.number} / Deployment planning</span><h1>{guide.title}</h1></div><div><p className="guide-deck">{guide.deck}</p><div className="guide-meta"><span>{guide.readTime}</span>{guide.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></div>
        </header>

        <div className="article-layout frame">
          <aside className="article-toc"><strong>On this page</strong>{guide.sections.map((section, index) => <a href={`#section-${index + 1}`} key={section.title}>{section.title}</a>)}<a href="#faq">FAQ</a></aside>
          <div className="article-content">
            <section className="article-lead"><p>{guide.description}</p><p>Use the estimates as a transparent planning envelope, then validate them on the exact checkpoint, runtime, GPU topology, and provider configuration.</p></section>
            {guide.sections.map((section, index) => (
              <section id={`section-${index + 1}`} key={section.title}>
                <div className="article-heading"><span>{String(index + 1).padStart(2, "0")} / Planning step</span><h2>{section.title}</h2></div>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets ? <ul className="article-bullets">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
              </section>
            ))}

            <section className="article-tool-link"><span>Apply the assumptions</span><h2>Use the matching calculator.</h2><p>Carry the model, precision, context, concurrency, and topology assumptions into an explicit worksheet.</p><Link href={guide.relatedCalculator}>{guide.relatedCalculatorLabel} →</Link></section>

            <section id="faq"><div className="article-heading"><span>FAQ</span><h2>Common planning questions.</h2></div><div className="faq-list">{guide.faq.map((item) => <details key={item.question}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}</div></section>

            <section className="article-conversion"><span>Next decision</span><h2>Turn the estimate into a GPU shortlist.</h2><p>Compare memory profiles, then check the current price index and live capacity before renting.</p><div><Link href="/hardware">Browse GPU profiles</Link><Link href="/calculator">Run the full fit check</Link></div></section>
          </div>
        </div>
      </article>
    </main>
  );
}
