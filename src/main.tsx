import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./fonts.css";
import "./styles.css";

// Upgrade hygiene: the CDN-era runtime caches (pre-H10/L8 Google-Fonts +
// MediaPipe responses, ~5MB) survive the switch to self-hosting — workbox's
// cleanupOutdatedCaches only reclaims PREcaches, never runtime caches, so on
// a live user's device they'd sit as dead weight forever. Best-effort delete.
if ("caches" in window) {
  void caches.delete("google-fonts");
  void caches.delete("mediapipe-assets");
}

// Top-level error boundary (H12): with an autoUpdate service worker, a bad
// deploy auto-activates for everyone — a render throw must show an honest
// recovery card, never a white screen.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary scope="app">
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
