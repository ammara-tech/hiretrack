import type { MetadataRoute } from "next";

/* Makes HireTrack installable: "Add to Home screen" on a phone opens it full screen, like an app */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HireTrack",
    short_name: "HireTrack",
    description: "Your job hunt on one board: applications, interviews, follow-ups and offers.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f1f6",
    theme_color: "#16151c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
