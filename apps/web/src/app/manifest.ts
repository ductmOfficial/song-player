import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sóng",
    short_name: "Sóng",
    description: "Nghe nhạc độc lập từ Audius. Listen to independent music from Audius.",
    start_url: "/",
    display: "standalone",
    background_color: "#121110",
    theme_color: "#121110",
    lang: "vi",
    categories: ["music", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
