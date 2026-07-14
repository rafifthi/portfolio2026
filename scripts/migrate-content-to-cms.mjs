#!/usr/bin/env node
/**
 * Migrates the static site content (src/lib/data.ts notes & photos,
 * content/cases/*.mdx case studies) into the CMS `cms_entries` table.
 *
 * Usage:
 *   node scripts/migrate-content-to-cms.mjs             # upsert into DATABASE_URL
 *   node scripts/migrate-content-to-cms.mjs --dry-run   # print what would be written
 *   node scripts/migrate-content-to-cms.mjs --sql       # print idempotent seed SQL to stdout
 *   node scripts/migrate-content-to-cms.mjs --publish-portfolio
 *
 * Portfolio entries are seeded as DRAFTS by default: page.tsx renders CMS
 * portfolio entries as *additional* desktop icons, so publishing them while
 * the hardcoded MDX cases are still wired in would duplicate the icons.
 * Pass --publish-portfolio once the static cases are removed from page.tsx.
 *
 * Idempotent: upserts on (type, slug), so it is safe to re-run. Entries
 * edited later in the admin panel WILL be overwritten by a re-run.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

// --- Notes (from src/lib/data.ts `notes`) ---
const noteSeeds = [
  {
    folder: "Career",
    title: "Product Manager",
    date: "December 2025",
    content:
      "Company: Alturian\nLocation: Jakarta, Indonesia\nPeriod: Dec 2025 - Present\nType: Full-time\n\nDescription: Own product development for ERP SaaS platform targeting SMEs, leading discovery, prioritization, and execution across Merchandising, PoS, and Bookkeeping.\n\nAchievements\n• Own product development for ERP SaaS platform (Merchandising, PoS, Bookkeeping) targeting SMEs\n• Lead product discovery, competitor analysis, and feature prioritization for MVP development\n• Translate business needs into product requirements, user flows, and system-level specifications\n• Work closely with engineering to manage execution, including sprint planning, ticketing, and QA\n• Balance speed and scalability by making trade-offs across business, UX, and technical constraints\n• Introduced AI-assisted workflows to reduce turnaround time from idea to implementation",
  },
  {
    folder: "Career",
    title: "Senior Product Designer",
    date: "June 2025",
    content:
      "Company: Alturian\nLocation: Jakarta, Indonesia\nPeriod: Jun 2025 - Dec 2025\nType: Full-time\n\nDescription: Managed end-to-end design across multiple business units with shifting priorities, bridging design and engineering.\n\nAchievements\n• Managed end-to-end design across multiple business units with shifting priorities\n• Switched seamlessly between UI/UX, branding, graphic design, and website content updates\n• Improved requirement clarity and reduced iteration cycles through better early-stage alignment\n• Acted as key bridge between design and engineering during development cycles",
  },
  {
    folder: "Career",
    title: "Product Team Lead",
    date: "July 2023",
    content:
      "Company: Alturian\nLocation: Jakarta, Indonesia\nPeriod: Jul 2023 - Jun 2025\nType: Full-time\n\nDescription: Led a team of 2–4 designers across ERP, HRIS, and loyalty platforms, establishing workflows and scalable design systems.\n\nAchievements\n• Led a team of 2–4 designers across ERP, HRIS, and loyalty platforms\n• Established structured workflows to improve delivery consistency and cross-team collaboration\n• Developed and maintained scalable design systems across multiple products\n• Contributed to product direction through user insights and system-level thinking",
  },
  {
    folder: "Career",
    title: "Product Designer",
    date: "October 2022",
    content:
      "Company: Alturian\nLocation: Jakarta, Indonesia\nPeriod: Oct 2022 - Jul 2023\nType: Full-time\n\nDescription: Designed UX for retail platforms including PoS and scan-and-go experiences, promoted to managerial track.\n\nAchievements\n• Designed UX for retail platforms including PoS and scan-and-go experiences\n• Delivered end-to-end flows from user journey to high-fidelity UI\n• Improved usability and reduced friction in transaction-related user flows\n• Recognized as high-potential contributor and promoted to managerial track",
  },
  {
    folder: "Career",
    title: "Big Data Analyst Intern",
    date: "June 2020",
    content:
      "Company: Indosat Ooredoo\nLocation: Jakarta, Indonesia\nPeriod: Jun 2020 - Aug 2020\nType: Internship\n\nDescription: Supported product and business decisions through data analysis, translating complex datasets into actionable recommendations.\n\nAchievements\n• Supported product and business decisions through data analysis and insights\n• Translated complex datasets into actionable and user-centric recommendations\n• Developed skills in product analysis, data interpretation, and data-driven storytelling",
  },
  {
    folder: "Career",
    title: "Assistant Lecturer",
    date: "January 2020",
    content:
      "Company: Faculty of Computer Science, Universitas Brawijaya\nLocation: Malang, Indonesia\nPeriod: Jan 2020 - Jun 2020\nType: Part-time\n\nDescription: Assisted in teaching Information System Analysis & Design, supporting student outcomes through structured guidance.\n\nAchievements\n• Assisted in teaching UX and system design concepts\n• Improved student outcomes through structured guidance and evaluation",
  },
  {
    folder: "Education",
    title: "Bachelor of Computer Science",
    date: "August 2017",
    content:
      "Institution: Universitas Brawijaya, Faculty of Computer Science\nLocation: Malang, Indonesia\nDegree: Bachelor of Computer Science\nMajor: System Information Design\nMinor: Data Analytics\nPeriod: Aug 2017 - Jan 2022\n\nRelevant Coursework\n• Information Systems Analysis and Design\n• Human-Computer Interaction\n• Information Technology Project Management\n• Data Analytics & Visualization\n• Web Programming\n• Cloud Service Technology",
  },
  {
    folder: "Education",
    title: "Google UX Design Certificate",
    date: "2022",
    content:
      "Institution: Google (via Coursera)\nCertification: Foundation of UX Design\nYear: 2022\n\nDescription: Completed Google's Foundation of UX Design course, covering core UX principles, user research, wireframing, and prototyping.",
  },
  {
    folder: "Goals",
    title: "Q2 Personal Goals",
    date: "Apr 1, 2026",
    content:
      "- Run 5K under 25 minutes\n- Learn to cook 10 new dishes\n- Read 4 books\n- Travel to one new city\n- Save 30% of income",
  },
  {
    folder: "Goals",
    title: "Side Project Ideas",
    date: "Apr 15, 2026",
    content:
      "- AI-powered habit tracker\n- Local-first notes app with sync\n- Minimalist portfolio generator\n- Browser extension for focus",
  },
  {
    folder: "Quotes",
    title: "Be stubborn with the visions, but be flexible with the plan",
    date: "Mar 20, 2026",
    content: "Be stubborn with the visions, but be flexible with the plan.",
  },
  {
    folder: "Quotes",
    title: "Mending yang ga pasti daripada udah pasti tai",
    date: "Feb 14, 2026",
    content: "Mending yang ga pasti daripada udah pasti tai.",
  },
  {
    folder: "Quotes",
    title: "Life is not about what you want, but is what you can",
    date: "Jan 5, 2026",
    content: "Life is not about what you want, but is what you can.",
  },
  {
    folder: "Random",
    title: "Kata-kata aneh tapi beneran ada",
    date: "May 11, 2026",
    content:
      "- capitan gorengan\n- plastik stnk\n- cengkeh nastar\n- patahan regal\n- waduk pacitan\n- kulit tumit\n- perut cicak\n- timbangan abon\n- laba2 brazil\n- pabrik sedotan\n- oleh2 haji\n- bahasa kaldu\n- kutang britney spears\n- beli tralis\n- kursi voli\n- manset oyj\n- pilot ultraman\n- genteng contoh\n- tenda artis\n- les ludruk",
  },
  {
    folder: "Random",
    title: "Ide Nama Bisnis",
    date: "Apr 3, 2026",
    content:
      "1. Kebab Lasan\n2. Kebab Akibat\n3. Kebab Turkiyem\n4. Salon Yanto\n5. Jejak Risol",
  },
];

const profileSeeds = [
  {
    id: "seed-about-about-rafif",
    type: "about",
    slug: "about-rafif",
    title: "Rafif Fathi Misbah",
    status: "published",
    sortOrder: 0,
    data: {
      title: "Rafif Fathi Misbah",
      subtitle: "Product Manager · Business Analyst",
      body: [
        "I'm a product manager who likes the messy middle — the gap between a fuzzy business problem and something a real person can click. I sit across product, business analysis, and product design, mostly in SME and retail.",
        "Day to day that means discovery, requirements, and the unglamorous backbone of shipping: backlogs, sprint planning, ticketing, QA. I map how a business actually works, then translate that into specs engineering can build without a séance.",
        "I'm also an early adopter of agentic AI for the product pipeline — Hermes Agent, Claude Code, and Codex are part of how I move fast now, not a gimmick for a slide. If there's a way to compress idea-to-MVP, I'm trying it.",
      ].join("\n\n"),
      tags: ["Product Discovery", "Business Analysis", "Product Design", "Agentic AI", "MVP"],
      photo: "",
      finderIcon: "",
      desktop: { label: "About Rafif", image: "", x: 18, y: 8, width: 150, icon: "UserRound", color: "#3b82f6" },
    },
  },
  {
    id: "seed-wife-wife",
    type: "wife",
    slug: "wife",
    title: "Kanza",
    status: "published",
    sortOrder: 0,
    data: {
      name: "Kanza",
      description: "Someone I call it home. She is bright as the sun even on a Monday. I married her on 19 July 2025, which is still the best idea I've ever had — and I have a lot of ideas.",
      photo: "/images/kanza.JPG",
      finderIcon: "/images/kanza.JPG",
      desktop: { label: "wife", image: "/images/kanza.JPG", x: 57, y: 59, width: 140, icon: "Heart", color: "#ec4899" },
    },
  },
];

// --- Gallery (from src/lib/data.ts `photos`; src is empty in the static data
// too — the site renders a gradient placeholder. Fill real images via /admin.)
const photoSeeds = [
  { title: "Tokyo Nights", date: "2025-11-20" },
  { title: "Mountain Hike", date: "2025-09-15" },
  { title: "Coffee Shop", date: "2025-08-10" },
  { title: "Workspace", date: "2025-07-22" },
  { title: "Beach Sunset", date: "2025-06-30" },
  { title: "City Architecture", date: "2025-05-18" },
  { title: "Street Food", date: "2025-04-05" },
  { title: "Concert", date: "2025-03-12" },
];

// --- Portfolio (from content/cases/*.mdx — the versions live on the site —
// converted from MDX prose to NotionBlock[]; desktop placement mirrors
// src/lib/data.ts `desktopItems`.)
const portfolioSeeds = [
  {
    slug: "lumona-case",
    title: "Lumona ERP & POS",
    data: {
      title: "Lumona ERP & POS",
      banner: "https://picsum.photos/seed/lumona-banner/800/300",
      meta: [
        { label: "Role", value: "Product Manager / Owner" },
        { label: "Domain", value: "Supply Chain & Retail" },
        { label: "Deliverable", value: "Figma Prototype" },
        { label: "Status", value: "Concept · On Hold" },
      ],
      desktop: {
        label: "Supply Chain ERP",
        image: "https://picsum.photos/seed/lumona/320/240",
        x: 50,
        y: 13,
        width: 200,
      },
      blocks: [
        { type: "heading", level: 2, text: "Overview" },
        { type: "paragraph", text: "Lumona is an ERP & POS concept I drove as product manager. The idea was simple to say and brutal to execute: give retail businesses one place to run their whole supply chain — procurement, cataloging, assortment, stock, and point-of-sale — without needing a consultant to set it up." },
        { type: "paragraph", text: "It's industry-agnostic by design. Whether you're moving fashion, F&B, or hardware, the underlying flow is the same: stuff comes in, gets organized, gets sold. Lumona models that flow once and adapts the surface." },
        { type: "callout", icon: "Lightbulb", text: "My job here wasn't to write the code — it was to make a genuinely complex domain feel obvious. Most of the work was deciding what not to build." },
        { type: "blockquote", text: "Note: This project is currently on hold, so I'm showcasing the product thinking and the Figma prototype rather than a shipped product. No vanity metrics here — just the work." },
        { type: "divider" },
        { type: "heading", level: 2, text: "What I owned" },
        { type: "paragraph", text: "As PM/PO I sat between the business, design, and engineering and was accountable for what we built and why:" },
        { type: "bulleted_list", items: [
          "Mapped the end-to-end supply chain flow and turned it into a product spec",
          "Defined the core modules and, more importantly, their boundaries",
          "Prioritized ruthlessly — what's v1, what's \"nice to have,\" what's a trap",
          "Built the information architecture and prototyped key flows in Figma",
          "Wrote the user stories and acceptance criteria the team built against",
        ] },
        { type: "divider" },
        { type: "heading", level: 2, text: "The hard part: supply chain is a web, not a list" },
        { type: "paragraph", text: "Retail ops people don't think in tidy screens. A single purchase order touches suppliers, items, warehouses, costs, and tax — and changing one ripples into all the others. The challenge was modeling those relationships so the product felt powerful to a warehouse manager but didn't scare off a small shop owner." },
        { type: "heading", level: 3, text: "Core modules" },
        { type: "bulleted_list", items: [
          "Procurement — purchase orders, supplier management, receiving",
          "Item Cataloging — a single source of truth for every product, variant, and unit",
          "Assortment — deciding what's sold where, and keeping it consistent across channels",
          "Point of Sale — the front-of-house that has to just work, offline-friendly and fast",
        ] },
        { type: "divider" },
        { type: "heading", level: 2, text: "Product decisions I'm proud of" },
        { type: "numbered_list", items: [
          "Catalog-first architecture. Everything hangs off one clean item model, so procurement, assortment, and POS all speak the same language instead of duplicating data.",
          "Progressive complexity. A new user sees a simple POS. Power users unlock procurement and assortment when they're ready — the depth is there, but it's opt-in.",
          "Killing features on purpose. The fastest way to make an ERP unusable is to ship every request. I held the line on scope so v1 could actually ship.",
        ] },
        { type: "divider" },
        { type: "heading", level: 2, text: "Where it stands" },
        { type: "paragraph", text: "Lumona is paused, but the thinking holds up. It's the piece I point to when I want to show how I approach a messy domain: understand the real workflow, model it once, and design the surface so complexity is something you grow into — not something that hits you on day one." },
        { type: "paragraph", text: "Figma prototype embedded below — coming soon." },
      ],
    },
  },
  {
    slug: "tdn-case",
    title: "TDN Quick Commerce",
    data: {
      title: "TDN Quick Commerce",
      banner: "https://picsum.photos/seed/tdn-meat-market/800/300",
      meta: [
        { label: "Role", value: "Product Designer" },
        { label: "Industry", value: "Fresh Grocery · Quick Commerce" },
        { label: "Deliverable", value: "3 Apps · Figma Prototype" },
        { label: "Status", value: "Shipped · Live" },
      ],
      desktop: {
        label: "TDN Quick Commerce",
        image: "https://picsum.photos/seed/tdn-meat/260/340",
        x: 70,
        y: 47,
        width: 150,
      },
      blocks: [
        { type: "heading", level: 2, text: "Overview" },
        { type: "paragraph", text: "TDN (Toko Daging Nusantara) is an Indonesian fresh meat retailer that needed to go digital — fast. The challenge wasn't just building an e-commerce app. Fresh meat is time-sensitive, temperature-critical, and operationally unforgiving. You don't get a second chance when the product has a shelf life measured in hours." },
        { type: "paragraph", text: "My team designed and delivered a full quick-commerce ecosystem: a customer app for browsing and ordering, a picker app for store staff preparing orders, and a courier app for last-mile delivery. Three surfaces, one coordinated flow." },
        { type: "callout", icon: "Package", text: "Fresh product commerce isn't just a checkout problem — it's a logistics choreography problem. All three apps had to work in sync or the whole thing falls apart." },
        { type: "divider" },
        { type: "heading", level: 2, text: "The problem" },
        { type: "paragraph", text: "Selling fresh meat online is fundamentally different from selling apparel or electronics:" },
        { type: "bulleted_list", items: [
          "No margin for delay. A fresh order sitting in \"processing\" for 20 minutes is a problem. Customers expect quick-commerce speed — not same-day, but same-hour.",
          "Picker accuracy is critical. The wrong cut or weight ruins the customer experience and damages trust faster than any other category.",
          "Courier coordination is tight. Delivery windows are short, and couriers need real-time handoff information — not a paper ticket stuffed in a bag.",
        ] },
        { type: "paragraph", text: "The retailer had been managing orders through WhatsApp groups and manual spreadsheets. The brief was to replace all of that with something their team could actually use under pressure." },
        { type: "divider" },
        { type: "heading", level: 2, text: "What we built" },
        { type: "heading", level: 3, text: "Customer App" },
        { type: "paragraph", text: "The consumer-facing experience. Clean product catalog organized by cut and type, with clear weight/pricing transparency — a common pain point for meat buyers who distrust \"approximately 500g\" listings. Cart and checkout flows optimized for repeat ordering, since TDN's best customers order weekly." },
        { type: "heading", level: 3, text: "Picker App" },
        { type: "paragraph", text: "Designed for use on a phone with one hand, often while holding product with the other. The picker app receives orders the moment they're confirmed, shows a clear pick list with exact cuts and weights, and lets staff mark items ready with minimal taps. A bad picker UI costs time and creates errors — so I stripped it back to the essentials: what to pick, in what order, and when to hand off." },
        { type: "callout", icon: "CheckSquare", text: "The picker flow was the most ops-critical surface. I spent more time on it than the customer app — because a confused picker is a missed delivery window." },
        { type: "heading", level: 3, text: "Courier App" },
        { type: "paragraph", text: "Couriers receive a handoff notification when an order is packed and ready. The app surfaces delivery address, order summary, and a one-tap navigation handoff to maps. Status updates (picked up, on the way, delivered) flow back to the customer in real time." },
        { type: "divider" },
        { type: "heading", level: 2, text: "Design decisions I'm proud of" },
        { type: "numbered_list", items: [
          "One order ID across all three apps. Sounds obvious, but getting a single source of truth for order state — visible consistently to customer, picker, and courier — required pushing back on early spec decisions that siloed each app.",
          "Picker app designed for stress. Warehouse environments are loud, hands are busy, and time pressure is real. Large touch targets, high contrast, and a ruthlessly linear flow — no navigation decisions mid-pick.",
          "Transparent weight pricing in the customer app. We showed exact weight ranges and calculated price per gram upfront, reducing the most common post-delivery complaint: \"this wasn't what I expected.\"",
        ] },
        { type: "divider" },
        { type: "heading", level: 2, text: "Outcome" },
        { type: "paragraph", text: "The three-app system replaced the team's WhatsApp-based workflow and is now live in operations. Order processing time dropped significantly once pickers had a structured flow instead of interpreting messages in a group chat." },
        { type: "paragraph", text: "Figma prototype embedded below — coming soon." },
      ],
    },
  },
  {
    slug: "invitation-case",
    title: "Digital Invitation",
    data: {
      title: "Digital Invitation",
      banner: "https://picsum.photos/seed/riuh-merekah/800/300",
      meta: [
        { label: "Role", value: "Designer & Developer (Solo)" },
        { label: "Stack", value: "Next.js, Tailwind CSS" },
        { label: "Status", value: "Live · Productizing" },
        { label: "Live", value: "riuhmerekah.vercel.app" },
      ],
      desktop: {
        label: "Digital Invitation",
        image: "https://picsum.photos/seed/invite/300/260",
        x: 33,
        y: 57,
        width: 190,
      },
      blocks: [
        { type: "heading", level: 2, text: "Overview" },
        { type: "paragraph", text: "This is the one that's actually live — and I built every pixel and line of it myself. Riuh Merekah is my own wedding invitation, designed, coded, and shipped solo. It's also the prototype for a product I'm turning it into." },
        { type: "callout", icon: "Sparkles", text: "See it live → riuhmerekah.vercel.app. Yes, it's my real wedding. No, I could not stop myself from building it from scratch." },
        { type: "divider" },
        { type: "heading", level: 2, text: "Why I built it" },
        { type: "paragraph", text: "Most digital invitations look like a forwarded spam email. I wanted ours to feel crafted — something guests would actually pause on — and I wanted the boring-but-critical logistics (who's coming, who replied, who still needs the link) handled properly instead of in a chaotic spreadsheet." },
        { type: "paragraph", text: "So it's two products in one: a beautiful invitation for guests, and a quiet admin panel for me." },
        { type: "divider" },
        { type: "heading", level: 2, text: "What guests see" },
        { type: "bulleted_list", items: [
          "Animated illustrations that bring the page to life as you scroll",
          "Multi-language support — guests read it in the language they're comfortable with",
          "Quick copy-to-clipboard templates so sharing the invite is one tap, with the message pre-written",
        ] },
        { type: "heading", level: 2, text: "What I see (the admin panel)" },
        { type: "paragraph", text: "This is the part I'm quietly proud of — it's a real tool, not a mockup:" },
        { type: "numbered_list", items: [
          "Guest list tracking — every invitee in one place",
          "RSVP management — who's confirmed, who's declined, who's gone quiet",
          "Invitation blast — sending out personalized invites without copy-pasting a hundred times",
        ] },
        { type: "divider" },
        { type: "heading", level: 2, text: "The trickiest part: animating the illustration" },
        { type: "paragraph", text: "The hardest engineering wasn't the data — it was the art. Getting the illustration to animate smoothly, perform well on a budget Android phone over mobile data, and feel alive rather than gimmicky took the most iteration by far. Animation is easy to start and very hard to make feel effortless." },
        { type: "callout", icon: "Wand2", text: "The bar for a wedding invite is unforgiving: it has to load fast, look gorgeous, and work on every relative's ancient phone. That constraint made it a genuinely fun build." },
        { type: "divider" },
        { type: "heading", level: 2, text: "Where it's headed" },
        { type: "paragraph", text: "Riuh Merekah started personal, but enough people asked \"can you make mine?\" that I'm turning it into a real product: multiple templates, fully customizable, so anyone can have an invitation that feels handmade without needing a developer in the family." },
        { type: "paragraph", text: "It's still in development — but the live wedding invite already proves the core works. That's the version you can go click on right now." },
      ],
    },
  },
  {
    slug: "siti-case",
    title: "Loyalty Web App · Modest Fashion",
    data: {
      title: "Loyalty Web App · Modest Fashion",
      banner: "https://picsum.photos/seed/maroon-fashion/800/300",
      meta: [
        { label: "Role", value: "Product Designer" },
        { label: "Industry", value: "Muslim Fashion Retail (MY)" },
        { label: "Deliverable", value: "Web App · Figma Prototype" },
        { label: "Status", value: "Whitelabel · Under NDA" },
      ],
      // Not on the current desktop (its icon slot opens tdn-case today);
      // placed in a free spot so it can be published without overlap.
      desktop: {
        label: "Loyalty Web App",
        image: "https://picsum.photos/seed/maroon-fashion/300/240",
        x: 51,
        y: 10,
        width: 160,
      },
      blocks: [
        { type: "heading", level: 2, text: "Overview" },
        { type: "paragraph", text: "A loyalty web app I designed for a Malaysian Muslim fashion retailer. I came in as the product designer and owned the experience end to end — from the customer-facing rewards flow to the screens that keep people coming back." },
        { type: "callout", icon: "Lock", text: "This was a whitelabel engagement under NDA, so the brand stays anonymous and the visuals here are recreated. What I can show is the design thinking and the craft." },
        { type: "divider" },
        { type: "heading", level: 2, text: "The problem" },
        { type: "paragraph", text: "Modest fashion is a loyal, community-driven market — but the retailer had no real way to reward that loyalty. Repeat customers looked exactly like first-timers in the system. There was no mechanism to recognize a regular, nudge a lapsed shopper, or make returning feel special." },
        { type: "paragraph", text: "The brief: design a loyalty experience that felt as considered and warm as the brand itself — not a bolted-on points widget." },
        { type: "divider" },
        { type: "heading", level: 2, text: "Design approach" },
        { type: "paragraph", text: "I anchored everything in the brand's identity: a deep maroon palette, generous whitespace, and typography that feels premium without being cold. The goal was for the app to feel like an extension of the boutique, not a generic SaaS dashboard." },
        { type: "heading", level: 3, text: "What I focused on" },
        { type: "numbered_list", items: [
          "A rewards flow that feels rewarding. Earning and redeeming points should have a little moment of delight — clear progress, satisfying states, no confusion about \"how do I actually use this.\"",
          "Tiered membership with status. Tiers that customers want to climb, communicated visually so your level feels like something you've earned.",
          "Warmth over gamification noise. Plenty of loyalty apps drown you in badges. I kept it calm and elegant — closer to the brand, further from a slot machine.",
        ] },
        { type: "callout", icon: "Palette", text: "The maroon-forward system was the make-or-break call. Get the color and spacing right and it reads \"premium boutique\"; get it wrong and it reads \"loyalty card from a gas station.\"" },
        { type: "divider" },
        { type: "heading", level: 2, text: "What I'm proud of" },
        { type: "paragraph", text: "Designing inside someone else's brand is a discipline — you're solving their problem in their voice, not showing off yours. I'm proud that the result feels unmistakably theirs: a loyalty experience that a modest-fashion shopper would actually enjoy opening, designed to make regulars feel like regulars." },
        { type: "paragraph", text: "Figma prototype embedded below — coming soon." },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Entry assembly
// ---------------------------------------------------------------------------

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function buildEntries({ publishPortfolio }) {
  const entries = [...profileSeeds];

  noteSeeds.forEach((note, index) => {
    const slug = slugify(note.title);
    entries.push({
      id: `seed-notes-${slug}`,
      type: "notes",
      slug,
      title: note.title,
      status: "published",
      sortOrder: index,
      data: { folder: note.folder, title: note.title, content: note.content, date: note.date },
    });
  });

  photoSeeds.forEach((photo, index) => {
    const slug = slugify(photo.title);
    entries.push({
      id: `seed-gallery-${slug}`,
      type: "gallery",
      slug,
      title: photo.title,
      status: "published",
      sortOrder: index,
      data: { title: photo.title, src: "", date: photo.date },
    });
  });

  portfolioSeeds.forEach((entry, index) => {
    entries.push({
      id: `seed-portfolio-${entry.slug}`,
      type: "portfolio",
      slug: entry.slug,
      title: entry.title,
      status: publishPortfolio ? "published" : "draft",
      sortOrder: index,
      data: entry.data,
    });
  });

  return entries;
}

// ---------------------------------------------------------------------------
// Output / DB
// ---------------------------------------------------------------------------

const SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS cms_entries (
  id text PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('gallery', 'notes', 'portfolio', 'about', 'wife')),
  slug text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order integer NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (type, slug)
);`;

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function toSql(entries) {
  const lines = [
    "-- Generated by scripts/migrate-content-to-cms.mjs",
    "-- Seeds cms_entries with the static site content. Idempotent (upsert on type+slug).",
    "",
    SCHEMA_SQL,
    "",
  ];
  for (const entry of entries) {
    lines.push(
      `INSERT INTO cms_entries (id, type, slug, title, status, sort_order, data) VALUES (` +
        `${sqlLiteral(entry.id)}, ${sqlLiteral(entry.type)}, ${sqlLiteral(entry.slug)}, ` +
        `${sqlLiteral(entry.title)}, ${sqlLiteral(entry.status)}, ${entry.sortOrder}, ` +
        `${sqlLiteral(JSON.stringify(entry.data))}::jsonb)\n` +
        `ON CONFLICT (type, slug) DO UPDATE SET\n` +
        `  title = EXCLUDED.title, status = EXCLUDED.status, sort_order = EXCLUDED.sort_order,\n` +
        `  data = EXCLUDED.data, updated_at = now();\n`
    );
  }
  return lines.join("\n");
}

function loadEnvFile(name) {
  try {
    const text = readFileSync(resolve(process.cwd(), name), "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, raw] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = raw.replace(/^["']|["']$/g, "");
    }
  } catch {
    // file absent — fine
  }
}

async function upsert(entries) {
  loadEnvFile(".env.local");
  loadEnvFile(".env");
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set (checked env, .env.local, .env).\n" +
        "Either export it, or generate SQL instead: node scripts/migrate-content-to-cms.mjs --sql"
    );
    process.exit(1);
  }

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);

  await sql.query(SCHEMA_SQL);

  for (const entry of entries) {
    await sql.query(
      `INSERT INTO cms_entries (id, type, slug, title, status, sort_order, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       ON CONFLICT (type, slug) DO UPDATE SET
         title = EXCLUDED.title, status = EXCLUDED.status,
         sort_order = EXCLUDED.sort_order, data = EXCLUDED.data, updated_at = now()`,
      [entry.id, entry.type, entry.slug, entry.title, entry.status, entry.sortOrder, JSON.stringify(entry.data)]
    );
    console.log(`upserted ${entry.type}/${entry.slug} (${entry.status})`);
  }
  console.log(`\nDone: ${entries.length} entries.`);
}

// ---------------------------------------------------------------------------

const args = new Set(process.argv.slice(2));
const entries = buildEntries({ publishPortfolio: args.has("--publish-portfolio") });

if (args.has("--sql")) {
  process.stdout.write(toSql(entries));
} else if (args.has("--dry-run")) {
  for (const entry of entries) {
    console.log(`${entry.type.padEnd(9)} ${entry.status.padEnd(9)} ${entry.slug}  — "${entry.title}"`);
  }
  console.log(`\n${entries.length} entries would be upserted.`);
} else {
  await upsert(entries);
}
