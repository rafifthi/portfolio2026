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
  name: "Rafif Fathi",
  shortName: "Rafif",
  title: "Rafif Fathi",
  description:
    "I turn messy retail operations into products people actually use. PM & designer, open for freelance.",
  keywords: [
    "Rafif Fathi",
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
    "Business Analyst",
    "Product Discovery",
    "Agentic AI",
    "Business Analysis",
    "MVP",
    "Requirement Gathering",
  ],
  locale: "en_US",
  twitterHandle: "@rafifthi",
} as const;

export const siteLinks = {
  email: "mailto:rafifthii@gmail.com",
  github: "https://github.com/rafifthi",
  linkedin: "https://linkedin.com/in/rafifthi",
  twitter: "https://x.com/rafifthi",
  instagram: "https://instagram.com/rafifthi",
} as const;
