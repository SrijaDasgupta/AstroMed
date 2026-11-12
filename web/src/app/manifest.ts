import type { MetadataRoute } from "next";

/** Lets people add AstroMed to their phone's home screen and open it full-screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AstroMed",
    short_name: "AstroMed",
    description: "Personal health monitoring for astronauts on missions beyond Earth.",
    start_url: "/start",
    display: "standalone",
    background_color: "#070b16",
    theme_color: "#070b16",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
