// Category definitions — kept in sync with the DB categories table.
// Used by client components (can't import store.ts which uses fs).

export type CategoryDef = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
};

export const CATEGORIES: CategoryDef[] = [
  {
    id: "cat-it-support",
    name: "IT Support",
    slug: "it-support",
    description: "Master the fundamentals of IT support — hardware, software, troubleshooting, and help desk skills.",
    icon: "🖥️",
  },
  {
    id: "cat-networking",
    name: "Networking",
    slug: "networking",
    description: "Learn networking essentials — from OSI model and TCP/IP to routing, switching, and wireless networks.",
    icon: "🌐",
  },
  {
    id: "cat-database",
    name: "Database Administration",
    slug: "database-administration",
    description: "Become a database administrator — SQL, database design, performance tuning, backup and recovery.",
    icon: "🗄️",
  },
  {
    id: "cat-cyber-security",
    name: "Cyber Security",
    slug: "cyber-security",
    description: "Protect systems and data — threat analysis, defense strategies, security policies, and risk management.",
    icon: "🔐",
  },
  {
    id: "cat-ethical-hacking",
    name: "Ethical Hacking",
    slug: "ethical-hacking",
    description: "Learn to think like an attacker — penetration testing, vulnerability assessment, and security auditing.",
    icon: "🛡️",
  },
  {
    id: "cat-ai",
    name: "Artificial Intelligence",
    slug: "artificial-intelligence",
    description: "Discover AI fundamentals — machine learning, deep learning, NLP, and how AI is transforming industries.",
    icon: "🤖",
  },
  {
    id: "cat-other",
    name: "Other",
    slug: "other",
    description: "Additional IT and technology courses outside the main categories.",
    icon: "📚",
  },
];

export const CATEGORY_NAMES = CATEGORIES.map(c => c.name);
export const CATEGORY_ICONS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(c => [c.name, c.icon])
);

export function getCategoryById(id: string): CategoryDef | undefined {
  return CATEGORIES.find(c => c.id === id);
}

export function getCategoryByName(name: string): CategoryDef | undefined {
  return CATEGORIES.find(c => c.name === name);
}
