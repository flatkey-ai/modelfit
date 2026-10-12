import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { flatkeyComputeUrl, siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Will this model fit?`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} — Will this model fit?`,
    description: siteConfig.description,
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="frame header-grid">
            <Link className="brand" href="/" aria-label={`${siteConfig.name} home`}><span className="logo-orbit"><i /><b /></span><span>{siteConfig.name}</span></Link>
            <nav aria-label="Main navigation"><Link href="/calculator">Calculator</Link><Link href="/#models">Models</Link><Link href="/methodology">Methodology</Link></nav>
            <a className="nav-action" href={flatkeyComputeUrl("header")} target="_blank" rel="noreferrer"><span>Find GPU compute</span><b>↗</b></a>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="frame footer-main">
            <div><Link className="brand footer-logo" href="/"><span className="logo-orbit"><i /><b /></span><span>{siteConfig.name}</span></Link><p>From model card to deployment plan.</p></div>
            <div><strong>Explore</strong><Link href="/calculator">VRAM calculator</Link><Link href="/#models">Model directory</Link><Link href="/methodology">How estimates work</Link><a href={flatkeyComputeUrl("footer")} target="_blank" rel="noreferrer">Flatkey Compute ↗</a></div>
            <div><strong>Data</strong><span>11 open models</span><span>9 hardware profiles</span><span>Launch dataset · v0.1</span></div>
          </div>
          <div className="frame footer-note"><span>© {new Date().getFullYear()} {siteConfig.name}</span><span>Estimates are planning guidance, not benchmark guarantees.</span></div>
        </footer>
      </body>
    </html>
  );
}
