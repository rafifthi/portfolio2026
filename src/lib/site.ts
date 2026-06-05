/**
 * Canonical base URL for the site, used by metadata, sitemap, and robots.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_SITE_URL   — explicit override (set this in Vercel for a custom domain)
 *  2. VERCEL_PROJECT_PRODUCTION_URL — auto-set by Vercel for the production deployment
 *  3. localhost fallback for local dev
 */
export const siteUrl: string = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

export const siteConfig = {
  name: "Rafif Fathi Misbah",
  shortName: "Rafifthi",
  title: "Rafif Fathi Misbah — Product Manager & Designer",
  description:
    "Interactive macOS-inspired portfolio of Rafif Fathi Misbah, a product manager and designer with 3.5+ years in SaaS and ERP. Explore case studies, CV, and projects.",
  keywords: [
    "Rafif Fathi Misbah",
    "Rafifthi",
    "Product Manager",
    "Product Designer",
    "UI/UX Designer",
    "SaaS",
    "ERP",
    "Portfolio",
    "Figma",
    "Product Management",
    "Jakarta",
    "Indonesia",
  ],
  locale: "en_US",
  twitterHandle: "@rafifthi",
} as const;
