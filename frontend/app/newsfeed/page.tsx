import { fetchBriefing } from "@/lib/api";
import NewsfeedClient from "@/components/NewsfeedClient";

export default async function NewsfeedPage() {
  let briefing = null;
  try {
    briefing = await fetchBriefing();
  } catch {}

  if (!briefing) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--accent-bright)" }}>뉴스피드</h1>
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-lg mb-2" style={{ color: "var(--text-muted)" }}>백엔드 서버에 연결할 수 없습니다</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            News Feed 폴더에서{" "}
            <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-card2)", color: "var(--accent)" }}>
              uvicorn api:app --reload
            </code>
            를 실행해주세요.
          </p>
        </div>
      </div>
    );
  }

  const totalCount = Object.values(briefing.sections).reduce((n, a) => n + a.length, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--accent-bright)" }}>뉴스피드</h1>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {briefing.date} · {totalCount}건
        </span>
      </div>
      {totalCount === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-lg mb-2" style={{ color: "var(--text-muted)" }}>오늘의 브리핑 데이터가 없습니다</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-card2)", color: "var(--accent)" }}>
              python collector.py
            </code>
            를 먼저 실행하여 뉴스를 수집해주세요.
          </p>
        </div>
      ) : (
        <NewsfeedClient briefing={briefing} />
      )}
    </div>
  );
}
