import { DesktopItem, FinderItem, Note, Photo, MailMessage, Album, StudyCase, Playlist } from "./types";

export const desktopItems: DesktopItem[] = [
  { id: "readme", label: "README.txt", image: "https://picsum.photos/seed/notepad/240/320", x: 4, y: 10, width: 150, appId: "readme" },
  { id: "wife", label: "wife", image: "https://picsum.photos/seed/karina/240/320", x: 22, y: 8, width: 140, appId: "wife" },
  { id: "cv", label: "CV.pdf", image: "https://picsum.photos/seed/rafifportrait/260/340", x: 40, y: 12, width: 160, appId: "cv" },
  { id: "lumona", label: "Lumona ERP", image: "https://picsum.photos/seed/lumona/320/240", x: 60, y: 6, width: 200, appId: "lumona-case" },
  { id: "siti", label: "Siti Khadija", image: "https://picsum.photos/seed/siti/260/340", x: 78, y: 14, width: 150, appId: "siti-case" },
  { id: "invitation", label: "Digital Invitation", image: "https://picsum.photos/seed/invite/300/260", x: 12, y: 52, width: 190, appId: "invitation-case" },
];

export const finderSections: Record<string, FinderItem[]> = {
  Recents: [
    { id: "r1", name: "CV.pdf", type: "pdf", date: "Today, 2:30 PM", size: "245 KB" },
    { id: "r2", name: "Portfolio.png", type: "image", date: "Today, 10:15 AM", size: "1.2 MB" },
    { id: "r3", name: "Project_Lumona", type: "folder", date: "Yesterday, 4:00 PM", size: "--" },
    { id: "r4", name: "Notes_Goals.txt", type: "file", date: "Yesterday, 9:00 AM", size: "4 KB" },
  ],
  Downloads: [
    { id: "d1", name: "Next.js_Docs.pdf", type: "pdf", date: "May 10, 2026", size: "3.4 MB" },
    { id: "d2", name: "Design_Assets.zip", type: "file", date: "May 9, 2026", size: "45 MB" },
    { id: "d3", name: "Screenshot_001.png", type: "image", date: "May 8, 2026", size: "890 KB" },
  ],
  Desktop: [
    { id: "de1", name: "README.txt", type: "file", date: "--", size: "2 KB" },
    { id: "de2", name: "wife", type: "folder", date: "--", size: "--" },
    { id: "de3", name: "CV.pdf", type: "pdf", date: "--", size: "245 KB" },
  ],
  Documents: [
    { id: "do1", name: "Career_Plan_2026.pdf", type: "pdf", date: "May 1, 2026", size: "1.1 MB" },
    { id: "do2", name: "Learning_Resources", type: "folder", date: "Apr 28, 2026", size: "--" },
    { id: "do3", name: "Cover_Letter.docx", type: "file", date: "Apr 25, 2026", size: "18 KB" },
  ],
  Applications: [
    { id: "a1", name: "Lumona ERP", type: "app", date: "--", size: "--" },
    { id: "a2", name: "Digital Invitation", type: "app", date: "--", size: "--" },
    { id: "a3", name: "Terminal", type: "app", date: "--", size: "--" },
    { id: "a4", name: "Notes", type: "app", date: "--", size: "--" },
  ],
};

export const notes: Note[] = [
  {
    id: "n1",
    folder: "Career",
    title: "2026 Career Goals",
    content:
      "1. Land a senior frontend role at a tech-first company.\n2. Contribute to open source projects (Next.js, shadcn).\n3. Speak at a local tech meetup or conference.\n4. Build a passive income side project.",
    date: "May 12, 2026",
  },
  {
    id: "n2",
    folder: "Career",
    title: "Interview Prep",
    content:
      "- Review system design fundamentals\n- Practice React performance optimization\n- Prepare portfolio talking points\n- Mock interview with mentor on Friday",
    date: "May 10, 2026",
  },
  {
    id: "n3",
    folder: "Education",
    title: "Courses to Finish",
    content:
      "- Advanced TypeScript Patterns\n- Rust for Web Developers\n- System Design by ByteByteGo\n- Figma Advanced Prototyping",
    date: "May 8, 2026",
  },
  {
    id: "n4",
    folder: "Education",
    title: "Reading List",
    content:
      "1. Designing Data-Intensive Applications\n2. The Pragmatic Programmer\n3. Refactoring UI\n4. Clean Architecture",
    date: "May 5, 2026",
  },
  {
    id: "n5",
    folder: "Goals",
    title: "Q2 Personal Goals",
    content:
      "- Run 5K under 25 minutes\n- Learn to cook 10 new dishes\n- Read 4 books\n- Travel to one new city\n- Save 30% of income",
    date: "Apr 1, 2026",
  },
  {
    id: "n6",
    folder: "Goals",
    title: "Side Project Ideas",
    content:
      "- AI-powered habit tracker\n- Local-first notes app with sync\n- Minimalist portfolio generator\n- Browser extension for focus",
    date: "Apr 15, 2026",
  },
  {
    id: "n7",
    folder: "Quotes",
    title: "Favorites",
    content:
      '"The only way to do great work is to love what you do." - Steve Jobs\n\n"Simplicity is the ultimate sophistication." - Leonardo da Vinci\n\n"Code is like humor. When you have to explain it, it is bad." - Cory House',
    date: "Mar 20, 2026",
  },
  {
    id: "n8",
    folder: "Random",
    title: "Grocery List",
    content:
      "- Eggs\n- Milk (oat)\n- Avocados\n- Sourdough bread\n- Coffee beans\n- Bananas",
    date: "May 11, 2026",
  },
  {
    id: "n9",
    folder: "Random",
    title: "Movie Watchlist",
    content:
      "- Dune: Part Two\n- The Creator\n- Poor Things\n- Past Lives\n- Spider-Man: Beyond the Spider-Verse",
    date: "Feb 10, 2026",
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

function pad(n: number) { return String(n).padStart(2, "0"); }
function audioUrl(albumId: string, track: number) { return `/music/${albumId}-${pad(track)}.wav`; }

export const albums: Album[] = [
  {
    id: "al1",
    title: "After Hours",
    artist: "The Weeknd",
    year: "2020",
    color: "#e11d48",
    cover: "https://picsum.photos/seed/al1-cover/300",
    songs: [
      { id: "s1", title: "Alone Again", duration: "4:10", track: 1, audioUrl: audioUrl("al1", 1) },
      { id: "s2", title: "Too Late", duration: "3:59", track: 2, audioUrl: audioUrl("al1", 2) },
      { id: "s3", title: "Hardest to Love", duration: "3:31", track: 3, audioUrl: audioUrl("al1", 3) },
      { id: "s4", title: "Scared to Live", duration: "3:11", track: 4, audioUrl: audioUrl("al1", 4) },
      { id: "s5", title: "Snowchild", duration: "4:09", track: 5, audioUrl: audioUrl("al1", 5) },
    ],
  },
  {
    id: "al2",
    title: "Random Access Memories",
    artist: "Daft Punk",
    year: "2013",
    color: "#1e3a8a",
    cover: "https://picsum.photos/seed/al2-cover/300",
    songs: [
      { id: "s6", title: "Give Life Back to Music", duration: "4:34", track: 1, audioUrl: audioUrl("al2", 1) },
      { id: "s7", title: "The Game of Love", duration: "5:21", track: 2, audioUrl: audioUrl("al2", 2) },
      { id: "s8", title: "Giorgio by Moroder", duration: "9:04", track: 3, audioUrl: audioUrl("al2", 3) },
      { id: "s9", title: "Within", duration: "3:48", track: 4, audioUrl: audioUrl("al2", 4) },
      { id: "s10", title: "Instant Crush", duration: "5:37", track: 5, audioUrl: audioUrl("al2", 5) },
    ],
  },
  {
    id: "al3",
    title: "Currents",
    artist: "Tame Impala",
    year: "2015",
    color: "#7c3aed",
    cover: "https://picsum.photos/seed/al3-cover/300",
    songs: [
      { id: "s11", title: "Let It Happen", duration: "7:46", track: 1, audioUrl: audioUrl("al3", 1) },
      { id: "s12", title: "Nangs", duration: "1:48", track: 2, audioUrl: audioUrl("al3", 2) },
      { id: "s13", title: "The Moment", duration: "4:15", track: 3, audioUrl: audioUrl("al3", 3) },
      { id: "s14", title: "Yes I'm Changing", duration: "4:30", track: 4, audioUrl: audioUrl("al3", 4) },
      { id: "s15", title: "Eventually", duration: "5:19", track: 5, audioUrl: audioUrl("al3", 5) },
    ],
  },
  {
    id: "al4",
    title: "Midnights",
    artist: "Taylor Swift",
    year: "2022",
    color: "#0f172a",
    cover: "https://picsum.photos/seed/al4-cover/300",
    songs: [
      { id: "s16", title: "Lavender Haze", duration: "3:22", track: 1, audioUrl: audioUrl("al4", 1) },
      { id: "s17", title: "Maroon", duration: "3:38", track: 2, audioUrl: audioUrl("al4", 2) },
      { id: "s18", title: "Anti-Hero", duration: "3:20", track: 3, audioUrl: audioUrl("al4", 3) },
      { id: "s19", title: "Snow on the Beach", duration: "4:16", track: 4, audioUrl: audioUrl("al4", 4) },
      { id: "s20", title: "You're On Your Own, Kid", duration: "3:14", track: 5, audioUrl: audioUrl("al4", 5) },
    ],
  },
  {
    id: "al5",
    title: "Melodrama",
    artist: "Lorde",
    year: "2017",
    color: "#0369a1",
    cover: "https://picsum.photos/seed/al5-cover/300",
    songs: [
      { id: "s21", title: "Green Light", duration: "3:54", track: 1, audioUrl: audioUrl("al5", 1) },
      { id: "s22", title: "Sober", duration: "3:17", track: 2, audioUrl: audioUrl("al5", 2) },
      { id: "s23", title: "Homemade Dynamite", duration: "3:09", track: 3, audioUrl: audioUrl("al5", 3) },
      { id: "s24", title: "The Louvre", duration: "4:31", track: 4, audioUrl: audioUrl("al5", 4) },
      { id: "s25", title: "Liability", duration: "2:52", track: 5, audioUrl: audioUrl("al5", 5) },
    ],
  },
  {
    id: "al6",
    title: "Blonde",
    artist: "Frank Ocean",
    year: "2016",
    color: "#fcd34d",
    cover: "https://picsum.photos/seed/al6-cover/300",
    songs: [
      { id: "s26", title: "Nikes", duration: "5:14", track: 1, audioUrl: audioUrl("al6", 1) },
      { id: "s27", title: "Ivy", duration: "4:09", track: 2, audioUrl: audioUrl("al6", 2) },
      { id: "s28", title: "Pink + White", duration: "3:04", track: 3, audioUrl: audioUrl("al6", 3) },
      { id: "s29", title: "Solo", duration: "4:17", track: 4, audioUrl: audioUrl("al6", 4) },
      { id: "s30", title: "Self Control", duration: "4:09", track: 5, audioUrl: audioUrl("al6", 5) },
    ],
  },
];

export const playlists = [
  {
    id: "favorites",
    name: "Favorites",
    icon: "Heart",
    color: "#fa2d48",
    songIds: ["s1", "s4", "s9", "s10", "s11", "s15", "s17", "s18", "s21", "s24", "s28", "s30"],
  },
  {
    id: "wedding",
    name: "Wedding",
    icon: "Heart",
    color: "#ec4899",
    songIds: ["s27", "s30", "s24", "s25", "s4", "s14"],
  },
  {
    id: "car-dj",
    name: "Car DJ",
    icon: "Radio",
    color: "#f59e0b",
    songIds: ["s6", "s21", "s22", "s3", "s11", "s17", "s18"],
  },
];

export const studyCases: StudyCase[] = [
  {
    id: "lumona-case",
    title: "Lumona ERP",
    banner: "https://picsum.photos/seed/lumona-banner/800/300",
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
    banner: "https://picsum.photos/seed/siti-banner/800/300",
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
    banner: "https://picsum.photos/seed/invite-banner/800/300",
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
