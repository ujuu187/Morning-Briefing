"use client";

import { useState } from "react";
import { BriefingData, SECTION_LABELS, Article } from "@/lib/api";

function ImportanceBadge({ level }: { level: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    high: { bg: "#3b0707", color: "var(--high)" },
    mid:  { bg: "#3b2800", color: "var(--mid)" },
    low:  { bg: "#1a2530", color: "var(--low)" },
  };
  const s = map[level] || map.low;
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: s.bg, color: s.color }}>
      {level.toUpperCase()}
    </span>
  );
}

function ArticleCard({ article, section }: { article: Article; section: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <ImportanceBadge level={article.importance} />
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--bg-card2)", color: "var(--accent)" }}>
              {SECTION_LABELS[section] ?? section}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{article.source}</span>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold leading-snug hover:underline"
            style={{ color: "var(--text)" }}
          >
            {article.title}
          </a>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs px-2 py-1 rounded"
          style={{ background: "var(--bg-card2)", color: "var(--accent)", border: "1px solid var(--border)" }}
        >
          ↗ 원문
        </a>
      </div>

      {/* Summary */}
      <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>{article.summary}</p>

      {/* Bullets toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="text-xs mb-2 flex items-center gap-1"
        style={{ color: "var(--accent)" }}
      >
        {open ? "▼" : "▶"} 상세 분석 {open ? "접기" : "펼치기"}
      </button>
      {open && (
        <ul className="space-y-1.5 mb-3">
          {article.bullets.map((b, i) => (
            <li key={i} className="text-xs flex gap-2" style={{ color: b.startsWith("→") ? "var(--accent-bright)" : "var(--text-muted)" }}>
              <span className="shrink-0" style={{ color: "var(--accent)" }}>•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Keywords */}
      <div className="flex flex-wrap gap-1.5">
        {article.keywords.map((kw, i) => (
          <span
            key={i}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "var(--bg-card2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

const SECTION_ORDER = [
  "ai-foundation", "startup-global", "startup-apac", "startup-kr",
  "fintech", "payment", "ai-sec", "world-econ", "kr-econ", "real-estate-kr",
];

export default function NewsfeedClient({ briefing }: { briefing: BriefingData }) {
  const availableSections = SECTION_ORDER.filter((s) => briefing.sections[s]?.length);
  const [active, setActive] = useState<string>("all");

  const filteredSections =
    active === "all"
      ? availableSections
      : availableSections.filter((s) => s === active);

  const totalCount = Object.values(briefing.sections).reduce((n, a) => n + a.length, 0);

  return (
    <div>
      {/* Section filter tabs */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setActive("all")}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              background: active === "all" ? "var(--accent-dark)" : "var(--bg-card2)",
              color: active === "all" ? "var(--text)" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            전체 ({totalCount})
          </button>
          {availableSections.map((sec) => (
            <button
              key={sec}
              onClick={() => setActive(sec)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
              style={{
                background: active === sec ? "var(--accent-dark)" : "var(--bg-card2)",
                color: active === sec ? "var(--text)" : "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {SECTION_LABELS[sec] ?? sec} ({briefing.sections[sec]?.length ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-8">
        {filteredSections.map((sec) => {
          const articles = briefing.sections[sec] ?? [];
          return (
            <section key={sec}>
              <h2
                className="text-base font-bold mb-3 pb-2 flex items-center gap-2"
                style={{ color: "var(--accent-bright)", borderBottom: "1px solid var(--border)" }}
              >
                <span>◈</span>
                {SECTION_LABELS[sec] ?? sec}
                <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                  {articles.length}건
                </span>
              </h2>
              <div className="space-y-4">
                {articles.map((article, i) => (
                  <ArticleCard key={i} article={article} section={sec} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
