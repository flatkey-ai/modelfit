import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteAnalytics } from "@/components/site-analytics";
import { absoluteUrl, siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Will this model fit?`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: { canonical: "/" },
  verification: { google: "_GSKFOIUP-szsVY8fQJ58rsU7UhdQJtMkHIunwcxGHc" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    title: `${siteConfig.name} — Will this model fit?`,
    description: siteConfig.description,
    type: "website",
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
  },
  twitter: { card: "summary", title: `${siteConfig.name} — Will this model fit?`, description: siteConfig.description },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": absoluteUrl("/#organization"),
        name: siteConfig.name,
        url: absoluteUrl("/"),
        logo: absoluteUrl("/icon.svg"),
      },
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        name: siteConfig.name,
        url: absoluteUrl("/"),
        description: siteConfig.description,
        inLanguage: "en",
        publisher: { "@id": absoluteUrl("/#organization") },
      },
    ],
  };
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd).replace(/</g, "\\u003c") }} />
        <header className="site-header">
          <div className="frame header-grid">
            <Link className="brand" href="/" aria-label={`${siteConfig.name} home`}><span className="logo-orbit"><i /><b /></span><span>{siteConfig.name}</span></Link>
            <nav aria-label="Main navigation"><Link href="/calculators">Calculators</Link><Link href="/models">Models</Link><Link href="/hardware">Hardware</Link><Link href="/guides">Guides</Link><Link href="/blog">Blog</Link></nav>
            <Link className="nav-action" href="/calculator"><span>Run fit check</span><b>→</b></Link>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="frame footer-main">
            <div><Link className="brand footer-logo" href="/"><span className="logo-orbit"><i /><b /></span><span>{siteConfig.name}</span></Link><p>From model card to deployment plan.</p></div>
            <div><strong>Explore</strong><Link href="/calculators">All calculators</Link><Link href="/calculator">VRAM calculator</Link><Link href="/models">Model directory</Link><Link href="/hardware">GPU hardware</Link><Link href="/guides">Deployment guides</Link><Link href="/blog">ModelFit blog</Link><Link href="/methodology">How estimates work</Link></div>
            <div><strong>Popular guides</strong><Link href="/guides/llm-vram-calculator">How to calculate LLM VRAM</Link><Link href="/guides/context-window-vram">Context windows and KV cache</Link><span>11 open models · 9 GPU profiles</span><span>Planning dataset · v0.1</span></div>
          </div>
          <div className="frame footer-note"><span>© {new Date().getFullYear()} {siteConfig.name}</span><span>Estimates are planning guidance, not benchmark guarantees.</span></div>
        </footer>
        <SiteAnalytics />
      </body>
    </html>
  );
}
