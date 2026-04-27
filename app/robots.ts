import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/analysis",
          "/auth/callback",
          "/sign/",        // public signing pages — no SEO value, also private tokens
          "/api/",
        ],
      },
    ],
    sitemap: "https://getredlineai.com/sitemap.xml",
    host: "https://getredlineai.com",
  };
}
