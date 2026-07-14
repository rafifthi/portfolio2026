import { DesktopItem, Note, Photo, MailMessage, StudyCase, Playlist } from "./types";

export const desktopItems: DesktopItem[] = [
  // Default desktop layout mirrors a naturally scattered macOS workspace.
  // Keep these coordinates in percentages so the composition scales with desktop viewports.
  { id: "readme", label: "README.txt", image: "/icons/readme-md.svg", x: 76, y: 7, width: 150, appId: "readme" },
  { id: "cv", label: "CV.pdf", image: "/icons/cv-pdf.svg", x: 8, y: 24, width: 160, appId: "cv" },
];

export const notes: Note[] = [
  {
    id: "n1",
    folder: "Career",
    title: "Product Manager",
    content:
      "Company: Alturian\nLocation: Jakarta, Indonesia\nPeriod: Dec 2025 - Present\nType: Full-time\n\nDescription: Own new product initiatives end-to-end - from discovery to shipped MVP.\n\nWhat I own\n• Lead product discovery and take new initiatives from discovery to MVP: a merchandising ERP and a property rental management system have both shipped\n• Act as Business Analyst and Product Owner for a quick-commerce product for an FMCG retail client - requirements, backlog, sprint planning, and QA\n• Orchestrate R&D with an agentic AI setup (Hermes Agent) to accelerate the product pipeline\n\nApproach\n• Translate messy business needs into clear requirements, user flows, and system-level specs\n• Bridge client stakeholders and engineering - the same discipline I apply across every initiative",
    date: "Dec 2025 - Present",
  },
  {
    id: "n2",
    folder: "Career",
    title: "Senior Product Designer",
    content:
      "Company: Alturian\nLocation: Jakarta, Indonesia\nPeriod: Jun 2025 - Dec 2025\nType: Full-time\n\nDescription: Managed end-to-end design across multiple business units with shifting priorities, bridging design and engineering.\n\nAchievements\n• Managed end-to-end design across multiple business units with shifting priorities\n• Switched seamlessly between UI/UX, branding, graphic design, and website content updates\n• Improved requirement clarity and reduced iteration cycles through better early-stage alignment\n• Acted as key bridge between design and engineering during development cycles",
    date: "June 2025",
  },
  {
    id: "n3",
    folder: "Career",
    title: "Product Team Lead",
    content:
      "Company: Alturian\nLocation: Jakarta, Indonesia\nPeriod: Jul 2023 - Jun 2025\nType: Full-time\n\nDescription: Led a team of 2–4 designers across ERP, HRIS, and loyalty platforms, establishing workflows and scalable design systems.\n\nAchievements\n• Led a team of 2–4 designers across ERP, HRIS, and loyalty platforms\n• Established structured workflows to improve delivery consistency and cross-team collaboration\n• Developed and maintained scalable design systems across multiple products\n• Contributed to product direction through user insights and system-level thinking",
    date: "July 2023",
  },
  {
    id: "n4",
    folder: "Career",
    title: "Product Designer",
    content:
      "Company: Alturian\nLocation: Jakarta, Indonesia\nPeriod: Oct 2022 - Jul 2023\nType: Full-time\n\nDescription: Designed UX for retail platforms including PoS and scan-and-go experiences, promoted to managerial track.\n\nAchievements\n• Designed UX for retail platforms including PoS and scan-and-go experiences\n• Delivered end-to-end flows from user journey to high-fidelity UI\n• Improved usability and reduced friction in transaction-related user flows\n• Recognized as high-potential contributor and promoted to managerial track",
    date: "October 2022",
  },
  {
    id: "n5",
    folder: "Career",
    title: "Big Data Analyst Intern",
    content:
      "Company: Indosat Ooredoo\nLocation: Jakarta, Indonesia\nPeriod: Jun 2020 - Aug 2020\nType: Internship\n\nDescription: Supported product and business decisions through data analysis, translating complex datasets into actionable recommendations.\n\nAchievements\n• Supported product and business decisions through data analysis and insights\n• Translated complex datasets into actionable and user-centric recommendations\n• Developed skills in product analysis, data interpretation, and data-driven storytelling",
    date: "June 2020",
  },
  {
    id: "n6",
    folder: "Career",
    title: "Assistant Lecturer",
    content:
      "Company: Faculty of Computer Science, Universitas Brawijaya\nLocation: Malang, Indonesia\nPeriod: Jan 2020 - Jun 2020\nType: Part-time\n\nDescription: Assisted in teaching Information System Analysis & Design, supporting student outcomes through structured guidance.\n\nAchievements\n• Assisted in teaching UX and system design concepts\n• Improved student outcomes through structured guidance and evaluation",
    date: "January 2020",
  },
  {
    id: "n7",
    folder: "Education",
    title: "Bachelor of Computer Science",
    content:
      "Institution: Universitas Brawijaya, Faculty of Computer Science\nLocation: Malang, Indonesia\nDegree: Bachelor of Computer Science\nMajor: System Information Design\nMinor: Data Analytics\nPeriod: Aug 2017 - Jan 2022\n\nRelevant Coursework\n• Information Systems Analysis and Design\n• Human-Computer Interaction\n• Information Technology Project Management\n• Data Analytics & Visualization\n• Web Programming\n• Cloud Service Technology",
    date: "August 2017",
  },
  {
    id: "n8",
    folder: "Education",
    title: "Google UX Design Certificate",
    content:
      "Institution: Google (via Coursera)\nCertification: Foundation of UX Design\nYear: 2022\n\nDescription: Completed Google's Foundation of UX Design course, covering core UX principles, user research, wireframing, and prototyping.",
    date: "2022",
  },
  {
    id: "n9",
    folder: "Goals",
    title: "Q2 Personal Goals",
    content:
      "- Run 5K under 25 minutes\n- Learn to cook 10 new dishes\n- Read 4 books\n- Travel to one new city\n- Save 30% of income",
    date: "Apr 1, 2026",
  },
  {
    id: "n10",
    folder: "Goals",
    title: "Side Project Ideas",
    content:
      "- AI-powered habit tracker\n- Local-first notes app with sync\n- Minimalist portfolio generator\n- Browser extension for focus",
    date: "Apr 15, 2026",
  },
  {
    id: "n11",
    folder: "Quotes",
    title: "Be stubborn with the visions, but be flexible with the plan",
    content: "Be stubborn with the visions, but be flexible with the plan.",
    date: "Mar 20, 2026",
  },
  {
    id: "n11b",
    folder: "Quotes",
    title: "Mending yang ga pasti daripada udah pasti tai",
    content: "Mending yang ga pasti daripada udah pasti tai.",
    date: "Feb 14, 2026",
  },
  {
    id: "n11c",
    folder: "Quotes",
    title: "Life is not about what you want, but is what you can",
    content: "Life is not about what you want, but is what you can.",
    date: "Jan 5, 2026",
  },
  {
    id: "n12",
    folder: "Random",
    title: "Kata-kata aneh tapi beneran ada",
    content:
      "- capitan gorengan\n- plastik stnk\n- cengkeh nastar\n- patahan regal\n- waduk pacitan\n- kulit tumit\n- perut cicak\n- timbangan abon\n- laba2 brazil\n- pabrik sedotan\n- oleh2 haji\n- bahasa kaldu\n- kutang britney spears\n- beli tralis\n- kursi voli\n- manset oyj\n- pilot ultraman\n- genteng contoh\n- tenda artis\n- les ludruk",
    date: "May 11, 2026",
  },
  {
    id: "n13",
    folder: "Random",
    title: "Ide Nama Bisnis",
    content:
      "1. Kebab Lasan\n2. Kebab Akibat\n3. Kebab Turkiyem\n4. Salon Yanto\n5. Jejak Risol",
    date: "Apr 3, 2026",
  },
];

export const photos: Photo[] = [
  { id: "p1", src: "", title: "Tokyo Nights", date: "2025-11-20" },
  { id: "p2", src: "", title: "Mountain Hike", date: "2025-09-15" },
  { id: "p3", src: "", title: "Coffee Shop", date: "2025-08-10" },
  { id: "p4", src: "", title: "Workspace", date: "2025-07-22" },
  { id: "p5", src: "", title: "Beach Sunset", date: "2025-06-30" },
  { id: "p6", src: "", title: "City Architecture", date: "2025-05-18" },
  { id: "p7", src: "", title: "Street Food", date: "2025-04-05" },
  { id: "p8", src: "", title: "Concert", date: "2025-03-12" },
];

export const mailMessages: MailMessage[] = [
  { id: "m1", from: "hello@lumona.io", subject: "Welcome to Lumona ERP", preview: "Thank you for signing up...", date: "Today", read: false },
  { id: "m2", from: "recruiter@techcorp.com", subject: "Frontend Engineer Position", preview: "We loved your portfolio...", date: "Yesterday", read: false },
  { id: "m3", from: "newsletter@vercel.com", subject: "Next.js 16 Release", preview: "What's new in the latest...", date: "May 10", read: true },
  { id: "m4", from: "friend@example.com", subject: "Re: Weekend Plans", preview: "Sounds great, let's meet at...", date: "May 8", read: true },
];

/** Deezer album IDs — all metadata fetched dynamically */
export const albumIds = [
  796709191, // Porter Robinson - Nurture
  163994622, // Galimatias - Renaissance Boy
  6575789,  // Daft Punk - Random Access Memories
  356437407, // Fred Again.. - Actual Life 3
  95829942,  // The Weeknd - My Dear Melancholy,
  796708851, // Galdive - Blue
  118560252, // Madeon - Good Faith
  545873632, // offonoff - boy.
  458874495, // Flume - Hi This Is Flume
  8198764,   // Porter Robinson - Worlds
];

/** Color palette cycled for album covers (fallback when cover image hasn't loaded) */
const albumColors = [
  "#0d9488", "#3b0764", "#fbbf24", "#1e293b", "#991b1b",
  "#0c4a6e", "#6366f1", "#1c1917", "#064e3b", "#0e7490",
];

export function albumColor(index: number) {
  return albumColors[index % albumColors.length];
}

export const playlists: Playlist[] = [
  {
    id: "cherished",
    name: "cherished music",
    icon: "Heart",
    color: "#ec4899",
    deezerPlaylistId: 15289137063,
  },
  {
    id: "19jul25",
    name: "19 Jul '25",
    icon: "Flower",
    color: "#f59e0b",
    deezerPlaylistId: 15289126743,
  },
  {
    id: "car-dj",
    name: "fip the car DJ",
    icon: "Car",
    color: "#3b82f6",
    deezerPlaylistId: 15289160423,
  },
];

export const studyCases: StudyCase[] = [
  {
    id: "lumona-case",
    title: "Lumona ERP",
    banner: "/placeholders/portfolio-banner.svg",
    meta: [
      { label: "Date", value: "Jan 2024 — Present" },
      { label: "Role", value: "Lead Frontend Engineer" },
      { label: "Stack", value: "Next.js, TypeScript, Prisma, PostgreSQL" },
      { label: "Status", value: "Production" },
    ],
    blocks: [
      { type: "heading", level: 2, text: "Overview" },
      { type: "paragraph", text: "Lumona ERP is an all-in-one enterprise resource planning system designed specifically for small and medium-sized enterprises (SMEs) in Indonesia. It streamlines inventory, sales, procurement, and financial reporting into a single cohesive platform." },
      { type: "callout", icon: "Lightbulb", text: "The main challenge was making a complex ERP feel simple and approachable for users who are not tech-savvy." },
      { type: "divider" },
      { type: "heading", level: 2, text: "Problem Statement" },
      { type: "paragraph", text: "Most SMEs in Indonesia still rely on spreadsheets and manual bookkeeping. Existing ERP solutions are either too expensive, too complex, or not localized for Indonesian tax and accounting regulations." },
      { type: "bulleted_list", items: [
        "High learning curve for existing ERP software",
        "No proper multi-warehouse inventory tracking",
        "Manual tax reporting consumes 3-5 days every month",
        "Lack of real-time analytics for business owners",
      ]},
      { type: "divider" },
      { type: "heading", level: 2, text: "Solution" },
      { type: "paragraph", text: "We built Lumona with a mobile-first approach, ensuring that business owners can manage their operations from anywhere. The UI is heavily inspired by modern dashboard designs with a focus on clarity and speed." },
      { type: "numbered_list", items: [
        "Designed a modular architecture where users can enable only the modules they need",
        "Implemented real-time sync using WebSockets for inventory updates across warehouses",
        "Built an automated tax report generator compliant with Indonesian e-Faktur",
        "Created a custom drag-and-drop report builder for non-technical users",
      ]},
      { type: "divider" },
      { type: "heading", level: 2, text: "Key Features" },
      { type: "heading", level: 3, text: "Dashboard" },
      { type: "paragraph", text: "A personalized dashboard that shows KPIs, low-stock alerts, pending orders, and revenue trends at a glance." },
      { type: "code", language: "typescript", code: "// Real-time inventory sync\nsocket.on('inventory:update', (data) => {\n  queryClient.setQueryData(\n    ['inventory', data.warehouseId],\n    (old) => mergeInventory(old, data)\n  );\n});" },
      { type: "heading", level: 3, text: "Multi-Warehouse Inventory" },
      { type: "paragraph", text: "Track stock levels across multiple locations with automated transfer requests and stock adjustment workflows." },
      { type: "blockquote", text: "The inventory module alone reduced stock discrepancies by 87% for our beta users." },
      { type: "divider" },
      { type: "heading", level: 2, text: "Results" },
      { type: "bulleted_list", items: [
        "Onboarded 50+ SMEs within the first 6 months",
        "Reduced monthly tax reporting time from 5 days to 30 minutes",
        "87% reduction in stock discrepancies",
        "Average user NPS score of 72",
      ]},
    ],
  },
  {
    id: "siti-case",
    title: "Siti Khadija Loyalty App",
    banner: "/placeholders/portfolio-banner.svg",
    meta: [
      { label: "Date", value: "Jun 2023 — Dec 2023" },
      { label: "Role", value: "Full Stack Developer" },
      { label: "Stack", value: "React Native, Node.js, MongoDB, Firebase" },
      { label: "Status", value: "Shipped" },
    ],
    blocks: [
      { type: "heading", level: 2, text: "Overview" },
      { type: "paragraph", text: "Siti Khadija is a digital loyalty and rewards platform for a chain of modest fashion boutiques. The app allows customers to earn points, redeem rewards, and receive personalized promotions based on their purchase history." },
      { type: "callout", icon: "Heart", text: "This project holds a special place because it was built for my wife's family business." },
      { type: "divider" },
      { type: "heading", level: 2, text: "The Challenge" },
      { type: "paragraph", text: "The boutique had a traditional paper-based stamp card system that was prone to loss and fraud. They wanted a digital solution that felt personal and aligned with their brand values." },
      { type: "bulleted_list", items: [
        "Paper stamp cards frequently lost or forgotten by customers",
        "No way to track customer purchase patterns",
        "Unable to send targeted promotions",
        "Manual reconciliation at end of month",
      ]},
      { type: "divider" },
      { type: "heading", level: 2, text: "Design Decisions" },
      { type: "paragraph", text: "We chose a warm, earthy color palette that reflects the brand's identity. The app uses gamification elements to make collecting points feel rewarding and fun." },
      { type: "heading", level: 3, text: "Tech Stack Rationale" },
      { type: "paragraph", text: "React Native was chosen for cross-platform deployment. Firebase handled real-time push notifications for flash sales. MongoDB's flexibility was perfect for the evolving loyalty rules." },
      { type: "code", language: "typescript", code: "// Points calculation with tier multiplier\nfunction calculatePoints(amount: number, tier: Tier): number {\n  const baseRate = 1; // 1 point per 10k IDR\n  const multiplier = {\n    bronze: 1,\n    silver: 1.5,\n    gold: 2,\n    platinum: 3,\n  };\n  return Math.floor((amount / 10000) * baseRate * multiplier[tier]);\n}" },
      { type: "divider" },
      { type: "heading", level: 2, text: "Key Features" },
      { type: "numbered_list", items: [
        "QR-based point collection at checkout",
        "Tiered membership system (Bronze → Platinum)",
        "Birthday rewards and anniversary bonuses",
        "Flash sale push notifications with 5-minute exclusivity",
        "Referral system with dual-sided rewards",
      ]},
      { type: "blockquote", text: "Within 3 months of launch, 78% of repeat customers had migrated from paper cards to the app." },
      { type: "divider" },
      { type: "heading", level: 2, text: "Impact" },
      { type: "bulleted_list", items: [
        "3,500+ active users within 3 months",
        "45% increase in repeat purchase frequency",
        "28% higher average order value for app users",
        "Zero manual reconciliation needed",
      ]},
    ],
  },
  {
    id: "invitation-case",
    title: "Digital Invitation",
    banner: "/placeholders/portfolio-banner.svg",
    meta: [
      { label: "Date", value: "Mar 2023 — Aug 2023" },
      { label: "Role", value: "Solo Founder / Developer" },
      { label: "Stack", value: "Next.js, Tailwind, Framer Motion, Supabase" },
      { label: "Status", value: "Live" },
    ],
    blocks: [
      { type: "heading", level: 2, text: "Overview" },
      { type: "paragraph", text: "A platform for creating beautiful, interactive digital invitations for weddings, engagements, and other celebrations. Users can choose from curated templates, customize content, and share via a unique link." },
      { type: "callout", icon: "Sparkles", text: "Born out of frustration with boring, generic e-invites that all look the same." },
      { type: "divider" },
      { type: "heading", level: 2, text: "The Problem" },
      { type: "paragraph", text: "Traditional printed invitations are expensive, environmentally wasteful, and slow. Existing digital alternatives look cheap and don't capture the emotional weight of a special event." },
      { type: "bulleted_list", items: [
        "Printed invitations cost $2-5 per piece in Indonesia",
        "Existing digital invites look like spam emails",
        "No RSVP tracking or guest management",
        "Difficult to share on social media",
      ]},
      { type: "divider" },
      { type: "heading", level: 2, text: "Design Philosophy" },
      { type: "paragraph", text: "Every template is designed with motion in mind. We use subtle scroll animations, parallax effects, and elegant typography to create an emotional journey for the recipient." },
      { type: "heading", level: 3, text: "Template System" },
      { type: "paragraph", text: "Templates are built as composable blocks. Users can mix and match hero sections, timeline blocks, gallery grids, and RSVP forms. Each block has multiple style variants." },
      { type: "code", language: "tsx", code: "// Animated entrance block\n<motion.div\n  initial={{ opacity: 0, y: 40 }}\n  whileInView={{ opacity: 1, y: 0 }}\n  viewport={{ once: true }}\n  transition={{ duration: 0.8, ease: \"easeOut\" }}\n>\n  <HeroBlock data={block.data} variant={block.variant} />\n</motion.div>" },
      { type: "divider" },
      { type: "heading", level: 2, text: "Key Features" },
      { type: "numbered_list", items: [
        "20+ curated templates with motion design",
        "Real-time preview while editing",
        "Custom domain support (e.g., rina-rafif.com)",
        "Built-in RSVP with dietary preferences",
        "Guest list import from Google Contacts / Excel",
        "Music integration (Spotify embed)",
        "Countdown timer and calendar integration",
      ]},
      { type: "blockquote", text: "One couple told us their guests thought the invitation was a custom-built website — that's exactly the reaction we were going for." },
      { type: "divider" },
      { type: "heading", level: 2, text: "Results" },
      { type: "bulleted_list", items: [
        "200+ invitations created in first 4 months",
        "Average 4.8/5 rating from users",
        "85% of guests RSVP'd through the app",
        "Featured in 3 local wedding vendor directories",
      ]},
    ],
  },
];
