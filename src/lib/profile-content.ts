import type { AboutData, WifeData } from "./cms";

export const fallbackAboutData: AboutData = {
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
  desktop: {
    label: "About Rafif",
    image: "",
    x: 18,
    y: 8,
    width: 150,
    icon: "UserRound",
    color: "#3b82f6",
  },
};

export const fallbackWifeData: WifeData = {
  name: "Kanza",
  description:
    "Someone I call it home. She is bright as the sun even on a Monday. I married her on 19 July 2025, which is still the best idea I've ever had — and I have a lot of ideas.",
  photo: "/images/kanza.JPG",
  finderIcon: "/images/kanza.JPG",
  desktop: {
    label: "wife",
    image: "/images/kanza.JPG",
    x: 57,
    y: 59,
    width: 140,
    icon: "Heart",
    color: "#ec4899",
  },
};
