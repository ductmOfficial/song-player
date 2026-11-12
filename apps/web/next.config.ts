import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// PWA: app shell and artwork caching plus an offline page. Audio is never cached (see src/app/sw.ts).
// The Serwist plugin runs in webpack, so `build` uses `next build --webpack`; the dev server
// (Turbopack) runs without a service worker.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  additionalPrecacheEntries: [{ url: "/~offline", revision: process.env.GITHUB_SHA ?? "dev" }],
});

const config: NextConfig = {
  reactStrictMode: true,
  // Artwork comes from many Audius content nodes and Deezer's CDN, already in fixed sizes;
  // an allow-list of hosts would be a moving target, so images are served as they are.
  images: { unoptimized: true },
};

export default withSerwist(withNextIntl(config));
