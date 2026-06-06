"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/realestate", label: "뉴스" },
  { href: "/realestate/glossary", label: "용어집" },
];

export default function RealEstateSubNav() {
  const pathname = usePathname();
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--accent-bright)" }}>한국 부동산</h1>
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                background: active ? "var(--accent-dark)" : "var(--bg-card2)",
                color: active ? "var(--text)" : "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
