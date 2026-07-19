import type { MetadataRoute } from "next";
import { getAllGuides } from "@/lib/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://getredlineai.com";
  const today = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`,             lastModified: today, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/pricing`,      lastModified: today, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/help`,         lastModified: today, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/guide`,        lastModified: today, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/auth/login`,   lastModified: today, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/auth/signup`,  lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/terms`,        lastModified: today, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/privacy`,      lastModified: today, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/refund`,       lastModified: today, changeFrequency: "yearly",  priority: 0.3 },
  ];

  // Every markdown file in content/guides is auto-included
  const guidePages: MetadataRoute.Sitemap = getAllGuides().map((g) => ({
    url: `${base}/guide/${g.slug}`,
    lastModified: g.date ? new Date(g.date) : today,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...guidePages];
}
