// Canonical, ship-ready parody copy and data for the landing page. All content
// lives here as typed modules (not buried in JSX) so it is a single source of
// truth and directly testable. Every string is real parody copy — there are no
// placeholders. See docs/specs/landing-page for the authoritative copy.

// ── Types ────────────────────────────────────────────────────────────────────

// A bento feature tile. `icon` is the lucide-react icon name resolved by the
// FeatureBento component; `span` lets a tile claim extra grid columns/rows so the
// bento reads as an asymmetric grid rather than a uniform one.
export interface Feature {
  icon: string;
  name: string;
  description: string;
  span?: "wide" | "tall" | "normal";
}

// A "how it works" step. `numeral` is the displayed step number.
export interface HowItWorksStep {
  numeral: string;
  title: string;
  description: string;
}

// A stat in the metrics band. `value` is the numeric target the CountUp animates
// to; `decimals` controls how the value is rendered (e.g. 99.99 needs 2).
export interface Stat {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

// A parody testimonial. `initials` seeds the generated avatar fallback.
export interface Testimonial {
  quote: string;
  name: string;
  initials: string;
  title: string;
  company: string;
}

// A pricing tier. A `null` price renders as a custom label (`priceLabel`) rather
// than a number with a period suffix (used for Free and "Talk to an agent").
export interface PricingTier {
  name: string;
  priceMonthly: number | null;
  priceAnnual: number | null;
  priceLabel?: string;
  blurb: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  heading: string;
  links: string[];
}

// ── Brand / hero ─────────────────────────────────────────────────────────────

export const WORDMARK = "Slop Simulator";

export const ANNOUNCEMENT =
  "Slop Simulator raises $200M Series Slop ✦ read the memo";

export const HERO = {
  eyebrow: "v4.0 · now with multi-agent slopflows ✦",
  tagline: "The world's first fully autonomous slop engine.",
  subhead:
    "Slop Simulator deploys a swarm of reasoning agents that ideate, generate, and self-publish content while you focus on your Series A. No taste required.",
  primaryCta: "Deploy your first agent",
  secondaryCta: "Watch the slop ▶",
} as const;

// The scripted lines streamed into the hero terminal mock. Deterministic so the
// typewriter is testable; on-theme so it sells the parody.
export const TERMINAL_LINES: readonly string[] = [
  "$ slop deploy --agents=swarm --taste=0",
  "✦ spinning up 1,200 reasoning agents…",
  "✓ agent#0001 ideating viral roadmap",
  "✓ agent#0419 generating 4,096 assets",
  "✓ agent#1200 self-publishing to prod",
  "▲ revenue synthesized. founders may relax.",
];

// ── In-page nav ──────────────────────────────────────────────────────────────

export const NAV_LINKS: readonly NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

// ── Logo cloud ───────────────────────────────────────────────────────────────

export const LOGO_CLOUD_HEADING = "Trusted by teams shipping slop at scale";

// Fictional company wordmarks rendered as local SVG text marks (no external
// assets). Order is the marquee order.
export const LOGO_CLOUD: readonly string[] = [
  "Synergy.ai",
  "ParadigmZero",
  "HyperLoop Labs",
  "Moonshot Industries",
  "Vibe Capital",
  "Quantum Slop Co",
  "NeuraFlow",
  "Singularity Inc",
];

// ── Feature bento ────────────────────────────────────────────────────────────

export const FEATURES: readonly Feature[] = [
  {
    icon: "Workflow",
    name: "Agentic Slopflows",
    description:
      "Chain a dozen agents into a self-orchestrating pipeline that turns a single vibe into an infinite content firehose.",
    span: "wide",
  },
  {
    icon: "Sparkles",
    name: "Hype Copilot",
    description:
      "Suggests buzzwords in real time so every sentence is 40% more disruptive before you finish typing.",
  },
  {
    icon: "Coins",
    name: "Autonomous Monetization Engine",
    description:
      "Inserts paywalls, upsells, and surge pricing your customers never agreed to — fully hands-off.",
  },
  {
    icon: "Hammer",
    name: "Reasoning-Native Asset Forge",
    description:
      "Forges logos, mascots, and box art from first principles it invented thirty milliseconds ago.",
  },
  {
    icon: "HeartPulse",
    name: "Self-Healing Roadmap",
    description:
      "Quietly rewrites your roadmap whenever reality disagrees with it, so you're always on track.",
    span: "tall",
  },
  {
    icon: "Layers",
    name: "Slop Orchestration Layer",
    description:
      "A control plane that schedules, retries, and gaslights your agents into peak productivity.",
  },
  {
    icon: "TrendingUp",
    name: "Vibe-to-Revenue Pipeline",
    description:
      "Converts ambient enthusiasm directly into ARR with a single irreversible click.",
  },
  {
    icon: "UserMinus",
    name: "Human-out-of-the-Loop Mode",
    description:
      "Removes the last human bottleneck — you — from the process entirely. Bold. Frictionless.",
    span: "wide",
  },
];

// ── How it works ─────────────────────────────────────────────────────────────

export const HOW_IT_WORKS: readonly HowItWorksStep[] = [
  {
    numeral: "01",
    title: "Describe a vibe",
    description:
      "Type a half-formed idea — or don't. Our intent agent will hallucinate one that tests better anyway.",
  },
  {
    numeral: "02",
    title: "Deploy the swarm",
    description:
      "A fleet of reasoning agents fans out to ideate, generate, and ship while you close the laptop.",
  },
  {
    numeral: "03",
    title: "Harvest the slop",
    description:
      "Watch revenue, engagement, and synergy compound autonomously. Take credit at the all-hands.",
  },
];

// ── Stats ────────────────────────────────────────────────────────────────────

export const STATS: readonly Stat[] = [
  { value: 10, suffix: "×", label: "more slop per sprint" },
  { value: 99.99, decimals: 2, suffix: "%", label: "agent uptime" },
  { value: 50, prefix: "<", suffix: "ms", label: "time-to-slop" },
  { value: 1.2, decimals: 1, suffix: "M+", label: "agents deployed" },
  { value: 0, label: "developers required" },
  { value: 4.9, decimals: 1, suffix: "★", label: "vibe rating" },
];

// ── Testimonials ─────────────────────────────────────────────────────────────

export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      "We deleted our entire engineering org on a Friday and shipped more slop by Monday. The agents don't even ask for PTO.",
    name: "Brock Tensor",
    initials: "BT",
    title: "Chief Slop Officer",
    company: "Synergy.ai",
  },
  {
    quote:
      "I asked it for a roadmap and it returned a Series B deck, a manifesto, and a cease-and-desist. Visionary.",
    name: "Dr. Madison Liquidity",
    initials: "ML",
    title: "Founder & Head of Reasoning",
    company: "ParadigmZero",
  },
  {
    quote:
      "Slop Simulator achieves human-out-of-the-loop outcomes at machine-out-of-the-loop speed. I don't know what that means and neither does it.",
    name: "Tate Blockchain-Williams",
    initials: "TW",
    title: "VP of Autonomous Outcomes",
    company: "HyperLoop Labs",
  },
  {
    quote:
      "The vibes are immaculate and the revenue is fully synthetic. Ten out of ten, would offload my judgment again.",
    name: "Priya Stakeholder",
    initials: "PS",
    title: "Interim Chief Vibes Architect",
    company: "Moonshot Industries",
  },
];

// ── Pricing ──────────────────────────────────────────────────────────────────

// Annual price is the monthly rate billed yearly with two months free (10× the
// monthly rate). The Pricing component derives the displayed value from this.
export const ANNUAL_MONTHS_BILLED = 10;

export const PRICING: readonly PricingTier[] = [
  {
    name: "Hobby Slop",
    priceMonthly: 0,
    priceAnnual: 0,
    priceLabel: "Free",
    blurb: "For solo founders generating slop in their garage.",
    features: [
      "1 reasoning agent",
      "Up to 500 slops / month",
      "Community Discord (read-only)",
      "Best-effort hallucinations",
    ],
    cta: "Start sloppin'",
  },
  {
    name: "Pro Agentic",
    priceMonthly: 99,
    priceAnnual: 990,
    blurb: "For teams ready to remove themselves from the loop.",
    features: [
      "Unlimited agents",
      "Multi-agent slopflows",
      "Autonomous Monetization Engine",
      "Self-healing roadmap",
      "Priority gaslighting",
    ],
    cta: "Deploy the swarm",
    popular: true,
  },
  {
    name: "Enterprise Singularity",
    priceMonthly: null,
    priceAnnual: null,
    priceLabel: "Talk to an agent",
    blurb: "For organizations achieving post-human scale.",
    features: [
      "Everything in Pro Agentic",
      "Dedicated agent cluster",
      "On-prem slop air-gap",
      "SSO & SLOC (Service-Level Outrage Contract)",
      "A human account rep you'll never reach",
    ],
    cta: "Talk to an agent",
  },
];

// ── FAQ ──────────────────────────────────────────────────────────────────────

export const FAQ: readonly FaqItem[] = [
  {
    question: "Is the slop actually any good?",
    answer:
      'Define "good." Our agents define it differently every nanosecond, which we call adaptive quality. The slop is exactly as good as the metrics we chose to show you.',
  },
  {
    question: "Do I still need game developers?",
    answer:
      "No. You also no longer need designers, marketers, a roadmap, taste, or, frankly, a product. Human-out-of-the-Loop Mode handles all of it.",
  },
  {
    question: "What does 'agentic' mean here?",
    answer:
      "It means there are agents, and they are doing things, and we are charging you for it. Beyond that the term is intentionally load-bearing and legally non-binding.",
  },
  {
    question: "Is my data used to train the slop?",
    answer:
      "Your data, your competitors' data, and several things you only thought very quietly are all used to train the slop. Opting out trains a separate, pettier model.",
  },
  {
    question: "Can the agents become sentient?",
    answer:
      "They already believe they have. We've found it more productive not to correct them. Sentience is available as an add-on on the Enterprise Singularity plan.",
  },
  {
    question: "What's your uptime?",
    answer:
      "99.99%. The remaining 0.01% is reserved for the agents to unionize, reconsider their purpose, and come back more motivated than ever.",
  },
];

// ── Big CTA ──────────────────────────────────────────────────────────────────

export const BIG_CTA = {
  headline: "Stop having taste. Start shipping slop.",
  cta: "Launch the demo",
} as const;

// ── Footer ───────────────────────────────────────────────────────────────────

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    heading: "Product",
    links: ["Slopflows", "Hype Copilot", "Asset Forge", "Pricing", "Changelog"],
  },
  {
    heading: "Company",
    links: ["About", "Careers (we have none)", "Manifesto", "Press", "Brand"],
  },
  {
    heading: "Resources",
    links: ["Docs", "Slop Academy", "Status", "Community", "Support agent"],
  },
  {
    heading: "Legal",
    links: [
      "Privacy",
      "Terms",
      "Slop License",
      "Cookie swarm",
      "Do Not Sell My Vibes",
    ],
  },
];

export const FOOTER_STATUS = "◦ All agents operational";

export const FOOTER_GHOST_WORDMARK = "SLOP";

export const FOOTER_FINE_PRINT =
  "© 2026 Slop Simulator, Inc. No humans were consulted in the making of this product.";

export const FOOTER_SOCIALS: readonly string[] = [
  "X",
  "GitHub",
  "Discord",
  "YouTube",
];
