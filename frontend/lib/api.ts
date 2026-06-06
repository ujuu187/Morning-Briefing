const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Article = {
  title: string;
  url: string;
  source: string;
  published: string;
  summary: string;
  bullets: string[];
  importance: "high" | "mid" | "low";
  keywords: string[];
};

export type BriefingData = {
  date: string;
  sections: Record<string, Article[]>;
};

export type Indicator = {
  key: string;
  name: string;
  unit: string;
  value: number;
  prev_value: number;
  change_pct: number | null;
  direction: "up" | "dn" | "nt";
};

export type IndicatorsData = {
  date: string;
  groups: Record<string, Indicator[]>;
};

export const SECTION_LABELS: Record<string, string> = {
  "ai-foundation": "AI Foundation Model",
  "world-econ": "세계 경제",
  "kr-econ": "한국 경제",
  "fintech": "Fintech/Crypto",
  "ai-sec": "AI Cybersecurity",
  "payment": "Payment",
  "startup-global": "Startup (Global)",
  "startup-apac": "Startup (APAC)",
  "startup-kr": "Startup (Korea)",
  "real-estate-kr": "한국 부동산",
};

export async function fetchBriefing(date?: string): Promise<BriefingData> {
  const url = date ? `${API_BASE}/briefing?target_date=${date}` : `${API_BASE}/briefing`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch briefing");
  return res.json();
}

export async function fetchIndicators(date?: string): Promise<IndicatorsData> {
  const url = date ? `${API_BASE}/indicators?target_date=${date}` : `${API_BASE}/indicators`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch indicators");
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string; today: string }> {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("API offline");
  return res.json();
}
