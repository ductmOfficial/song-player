/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { NetworkOnly, type PrecacheEntry, Serwist, type SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Music streams always come from the network: no long-term caching of audio
    // files (Audius terms), and range requests don't mix well with caches anyway.
    {
      matcher: ({ request, url }) =>
        request.destination === "audio" || url.pathname.endsWith("/stream"),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

serwist.addEventListeners();
