import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://getredlineai.com";
  const today = new Date();

  return [
    { url: `${base}/`,             lastModified: today, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/auth/login`,   lastModified: today, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/auth/signup`,  lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/terms`,        lastModified: today, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/privacy`,      lastModified: today, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/refund`,       lastModified: today, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
