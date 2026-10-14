"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const consentKey = "flatkey_analytics_consent";
const identityKey = "modelfit_analytics_id";
const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || "cf2f149bd61f607c3fd578596ad86921";
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

type EventProperties = Record<string, boolean | number | string | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

function analyticsAllowed() {
  return typeof window !== "undefined" && window.localStorage.getItem(consentKey) === "granted";
}

function getDistinctId() {
  const current = window.localStorage.getItem(identityKey);
  if (current) return current;
  const created = window.crypto.randomUUID();
  window.localStorage.setItem(identityKey, created);
  return created;
}

function ensureGoogleAnalytics() {
  if (!gaMeasurementId || typeof window === "undefined") return;
  window.dataLayer ||= [];
  window.gtag ||= (...args: unknown[]) => { window.dataLayer?.push(args); };
  if (!document.querySelector(`script[data-ga4-id="${gaMeasurementId}"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`;
    script.dataset.ga4Id = gaMeasurementId;
    document.head.appendChild(script);
    window.gtag("js", new Date());
    window.gtag("config", gaMeasurementId, { send_page_view: false, anonymize_ip: true });
  }
}

function currentAttribution() {
  if (typeof window === "undefined") return {};
  const query = new URLSearchParams(window.location.search);
  return {
    utm_source: query.get("utm_source") || undefined,
    utm_medium: query.get("utm_medium") || undefined,
    utm_campaign: query.get("utm_campaign") || undefined,
    utm_content: query.get("utm_content") || undefined,
  };
}

export function trackSiteEvent(event: string, properties: EventProperties = {}) {
  if (!analyticsAllowed()) return;
  const attribution = currentAttribution();
  const payload = [{
    event,
    properties: {
      token,
      distinct_id: getDistinctId(),
      source_site: "modelfit",
      path: window.location.pathname,
      url: window.location.href,
      referrer: document.referrer || undefined,
      time: Math.floor(Date.now() / 1000),
      ...attribution,
      ...properties,
    },
  }];
  void fetch("https://api-js.mixpanel.com/track/?verbose=0", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);

  if (gaMeasurementId) {
    ensureGoogleAnalytics();
    const gaEvent = event === "page_viewed" ? "page_view" : event;
    window.gtag?.("event", gaEvent, {
      page_path: window.location.pathname,
      page_location: window.location.href,
      page_referrer: document.referrer || undefined,
      ...attribution,
      ...properties,
    });
  }
}

function classifyLink(anchor: HTMLAnchorElement) {
  const destination = new URL(anchor.href, window.location.href);
  if (destination.hostname === "console.flatkey.ai") return "flatkey_console_clicked";
  if (destination.hostname === "flatkey.ai" || destination.hostname === "www.flatkey.ai") return "flatkey_website_clicked";
  if (destination.origin !== window.location.origin) return "external_source_clicked";
  return null;
}

export function SiteAnalytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<"denied" | "granted" | "unknown">("unknown");

  useEffect(() => {
    const stored = window.localStorage.getItem(consentKey);
    setConsent(stored === "granted" || stored === "denied" ? stored : "unknown");
  }, []);

  useEffect(() => {
    if (consent === "granted") {
      ensureGoogleAnalytics();
      trackSiteEvent("page_viewed", { page_path: pathname });
    }
  }, [consent, pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const eventName = classifyLink(anchor);
      if (!eventName) return;
      const destination = new URL(anchor.href, window.location.href);
      trackSiteEvent(eventName, {
        destination: destination.origin + destination.pathname,
        utm_campaign: destination.searchParams.get("utm_campaign") || undefined,
        utm_content: destination.searchParams.get("utm_content") || undefined,
        link_text: anchor.textContent?.trim().replace(/\s+/g, " ").slice(0, 120),
      });
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (consent !== "unknown") return null;

  return (
    <aside className="analytics-consent" aria-label="Analytics preference">
      <p><strong>Help improve ModelFit</strong><span>Allow anonymous usage analytics. No email or account data is collected.</span></p>
      <div>
        <button type="button" onClick={() => { window.localStorage.setItem(consentKey, "denied"); setConsent("denied"); }}>Decline</button>
        <button type="button" className="consent-accept" onClick={() => { window.localStorage.setItem(consentKey, "granted"); setConsent("granted"); }}>Allow analytics</button>
      </div>
    </aside>
  );
}
