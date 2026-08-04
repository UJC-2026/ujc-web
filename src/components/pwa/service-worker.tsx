"use client";

import { useEffect } from "react";

/**
 * Registers the offline cache. Deliberately not gated to production — the
 * behaviour is identical in dev, so a broken worker surfaces while it is still
 * cheap to fix.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // A failed registration must never break the page; the app just
        // works online-only.
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
