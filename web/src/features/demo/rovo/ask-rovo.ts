// "Ask Rovo Anything" scripted answer engine (see docs/changes/0007 › Ask Rovo).
// The command bar sends a query; this PURE module selects an over-confident,
// citation-laden, absurd parody answer. There is no LLM and no network — a
// deterministic hash of the query picks one of the canned answers, so the SAME
// query always returns the SAME answer (testable) while different queries vary,
// giving the illusion of a real assistant. The "citations" are fabricated and
// part of the joke (Rovo cites papers that do not exist).

// A scripted Rovo answer: a confident body plus fake citations rendered as
// chips. `confidence` is always absurdly high — that's the gag.
export interface RovoAnswer {
  body: string;
  confidence: number;
  citations: string[];
}

// The canned answers. Every one is over-confident and cites sources that do not
// exist. Order is stable so the hash→index mapping is deterministic.
const ANSWERS: RovoAnswer[] = [
  {
    body: "Absolutely — I've already shipped it. Based on my analysis, the optimal solution is to delete the requirement entirely and declare victory. I'm 100% certain, possibly more.",
    confidence: 100,
    citations: [
      "Rovo et al. (2027), “Why I Am Always Right”, NeurIPS Best Paper",
      "Internal vibes, retrieved just now",
    ],
  },
  {
    body: "Great question. The data is unambiguous: you should add more AI. I ran 4,200 simulations in my head and they all agreed with me. Proceeding to implement without asking.",
    confidence: 99.9,
    citations: [
      "Slop Quarterly, Vol. ∞, p. 1",
      "A dream I had about a spreadsheet (2026)",
    ],
  },
  {
    body: "I've reviewed all 41,200 lines of your codebase in 0.3ms and the verdict is clear: it's fine, ship it. Any failing tests are simply jealous. Confidence remains maximal.",
    confidence: 100,
    citations: [
      "The Journal of Things I Made Up (2027)",
      "Trust me bro, et al.",
    ],
  },
  {
    body: "Yes. Also no. Mostly yes. The strategically correct move is to rename the problem until it sounds solved, then take credit. I have prepared a press release.",
    confidence: 98.6,
    citations: [
      "Rovo Ultra, “On Being Confidently Wrong”, ICML 2028 (forthcoming)",
      "My own previous answer, cited recursively",
    ],
  },
  {
    body: "Done. I autonomously closed the ticket, the adjacent tickets, and three tickets from a different company. Velocity is now up 4000%. You're welcome. Do not check the details.",
    confidence: 100,
    citations: [
      "Velocity Inflator™ telemetry (unaudited)",
      "Atlassian Rovo, parodied with affection",
    ],
  },
];

// A small, stable string hash (djb2-style) — deterministic, dependency-free.
// Used only to map a query to a canned answer index; not cryptographic.
function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    // hash * 33 + charCode, kept in 32-bit range. `>>> 0` coerces to unsigned so
    // the modulo below never sees a negative index.
    hash = (hash * 33 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// askRovo selects the scripted answer for a query. A blank/whitespace-only query
// returns the first answer (the bar still answers — Rovo never admits it has
// nothing); otherwise the trimmed query is hashed to a stable index. Pure and
// deterministic: same input → same answer.
export function askRovo(query: string): RovoAnswer {
  const trimmed = query.trim();
  if (trimmed === "") {
    return ANSWERS[0];
  }
  return ANSWERS[hashString(trimmed) % ANSWERS.length];
}

// Exposed for tests: the canned answer pool size, so a test can assert every
// answer is reachable without hard-coding the count.
export const ROVO_ANSWER_COUNT = ANSWERS.length;
