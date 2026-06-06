import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Morning Briefing",
  description: "AI-curated daily briefing for strategy professionals",
};

const navLinks = [
  { href: "/", label: "홈" },
  { href: "/newsfeed", label: "뉴스피드" },
  { href: "/indicators", label: "경제지표" },
  { href: "/realestate", label: "부동산" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={geist.variable}>
      <body className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <header style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
          <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg" style={{ color: "var(--accent-bright)" }}>
              <span>🌿</span>
              <span>Morning Briefing</span>
            </Link>
            <div className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        <footer className="mt-16 py-6 text-center text-xs" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
          Morning Briefing — Powered by Claude Haiku &amp; FastAPI
        </footer>
      </body>
    </html>
  );
}
