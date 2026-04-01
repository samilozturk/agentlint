const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
const GA_DEBUG_MODE = import.meta.env.VITE_GA_DEBUG === "true";

type Gtag = (
  command: "js" | "config" | "event",
  target: Date | string,
  params?: Record<string, unknown>,
) => void;

declare global {
  interface Window {
    __agentLintAnalyticsInitialized__?: boolean;
    dataLayer: unknown[];
    gtag?: Gtag;
  }
}

function isAnalyticsEnabled() {
  return typeof window !== "undefined" && Boolean(GA_MEASUREMENT_ID);
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];

  if (!window.gtag) {
    window.gtag = function gtag(...args) {
      window.dataLayer.push(args);
    };
  }

  return window.gtag;
}

function loadGoogleTag(measurementId: string) {
  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[data-ga-measurement-id="${measurementId}"]`,
  );

  if (existingScript) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.gaMeasurementId = measurementId;
  document.head.appendChild(script);
}

function getPagePath() {
  return `${window.location.pathname}${window.location.search}`;
}

function getPageLocation() {
  return `${window.location.origin}${getPagePath()}`;
}

export function trackPageView() {
  if (!isAnalyticsEnabled()) {
    return;
  }

  ensureGtag()("event", "page_view", {
    page_title: document.title,
    page_location: getPageLocation(),
    page_path: getPagePath(),
  });
}

export function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (!isAnalyticsEnabled()) {
    return;
  }

  ensureGtag()("event", eventName, params);
}

export function initializeAnalytics() {
  if (!isAnalyticsEnabled() || window.__agentLintAnalyticsInitialized__) {
    return;
  }

  window.__agentLintAnalyticsInitialized__ = true;

  const gtag = ensureGtag();
  const measurementId = GA_MEASUREMENT_ID!;
  let lastTrackedPath = "";

  loadGoogleTag(measurementId);

  gtag("js", new Date());
  gtag("config", measurementId, {
    send_page_view: false,
    debug_mode: GA_DEBUG_MODE,
  });

  const trackCurrentPage = () => {
    const nextPath = getPagePath();

    if (nextPath === lastTrackedPath) {
      return;
    }

    lastTrackedPath = nextPath;
    trackPageView();
  };

  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);
  const queuePageView = () => queueMicrotask(trackCurrentPage);

  window.history.pushState = function pushState(...args: Parameters<History["pushState"]>) {
    originalPushState(...args);
    queuePageView();
  };

  window.history.replaceState = function replaceState(...args: Parameters<History["replaceState"]>) {
    originalReplaceState(...args);
    queuePageView();
  };

  window.addEventListener("popstate", trackCurrentPage);

  trackCurrentPage();
}
