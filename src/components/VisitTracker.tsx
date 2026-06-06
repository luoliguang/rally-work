"use client";

import { useEffect } from "react";

/** Silently logs a visit on mount. Fire-and-forget — no UI. */
export function VisitTracker() {
  useEffect(() => {
    fetch("/api/visits", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
