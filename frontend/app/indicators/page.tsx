import { fetchIndicators, Indicator } from "@/lib/api";

const GROUP_ORDER = ["증시", "환율", "원자재", "채권", "암호화폐"];
const GROUP_ICONS: Record<string, string> = {
  "증시": "📈",
  "환율": "💱",
  "원자재": "🛢",
  "채권": "🏦",
  "암호화폐": "₿",
};

function IndicatorCard({ ind }: { ind: Indicator }) {
  const isUp = (ind.change_pct ?? 0) > 0;
  const isDn = (ind.change_pct ?? 0) < 0;
  const changeColor = isUp ? "var(--up)" : isDn ? "var(--dn)" : "var(--text-muted)";
  const arrow = isUp ? "▲" : isDn ? "▼" : "—";
  const bgAccent = isUp ? "#0a2e14" : isDn ? "#2e0a0a" : "var(--bg-card2)";

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-2"
      style={{ background: bgAccent, border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{ind.name}</span>
        {ind.change_pct !== null && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{
              background: isUp ? "#0d3d1a" : isDn ? "#3d0d0d" : "var(--bg-card)",
              color: changeColor,
            }}
          >
            {arrow} {ind.change_pct > 0 ? "+" : ""}{ind.change_pct.toFixed(2)}%
          </span>
        )}
      </div>
      <div>
        <span className="text-2xl font-mono font-bold" style={{ color: "var(--text)" }}>
          {ind.unit && <span className="text-base mr-0.5">{ind.unit}</span>}
          {ind.value?.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </span>
      </div>
      {ind.prev_value != null && (
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          전일: {ind.unit}{ind.prev_value?.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </div>
      )}
    </div>
  );
}

function GroupSection({ name, indicators }: { name: string; indicators: Indicator[] }) {
  const ups = indicators.filter((i) => (i.change_pct ?? 0) > 0).length;
  const dns = indicators.filter((i) => (i.change_pct ?? 0) < 0).length;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4 pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="text-xl">{GROUP_ICONS[name] ?? "📌"}</span>
        <h2 className="text-lg font-bold" style={{ color: "var(--accent-bright)" }}>{name}</h2>
        <div className="flex gap-2 text-xs">
          {ups > 0 && <span style={{ color: "var(--up)" }}>▲ {ups}</span>}
          {dns > 0 && <span style={{ color: "var(--dn)" }}>▼ {dns}</span>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {indicators.map((ind) => (
          <IndicatorCard key={ind.key} ind={ind} />
        ))}
      </div>
    </section>
  );
}

export default async function IndicatorsPage() {
  let indicators = null;
  try {
    indicators = await fetchIndicators();
  } catch {}

  if (!indicators) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--accent-bright)" }}>경제지표</h1>
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

  const hasData = Object.values(indicators.groups).some((g) => g.length > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--accent-bright)" }}>경제지표</h1>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>기준일: {indicators.date}</span>
      </div>

      {!hasData ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-lg mb-2" style={{ color: "var(--text-muted)" }}>오늘의 지표 데이터가 없습니다</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-card2)", color: "var(--accent)" }}>
              python indicators.py
            </code>
            를 실행하여 지표를 수집해주세요.
          </p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div
            className="rounded-xl p-4 mb-8 flex flex-wrap gap-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            {GROUP_ORDER.filter((g) => indicators.groups[g]?.length).map((g) => {
              const group = indicators.groups[g];
              const ups = group.filter((i) => (i.change_pct ?? 0) > 0).length;
              const dns = group.filter((i) => (i.change_pct ?? 0) < 0).length;
              return (
                <div key={g} className="flex items-center gap-2 text-sm">
                  <span>{GROUP_ICONS[g]}</span>
                  <span style={{ color: "var(--text-muted)" }}>{g}</span>
                  <span style={{ color: "var(--up)" }}>▲{ups}</span>
                  <span style={{ color: "var(--dn)" }}>▼{dns}</span>
                </div>
              );
            })}
          </div>

          {GROUP_ORDER.filter((g) => indicators.groups[g]?.length).map((g) => (
            <GroupSection key={g} name={g} indicators={indicators.groups[g]} />
          ))}

          {/* Remaining groups not in order */}
          {Object.entries(indicators.groups)
            .filter(([g]) => !GROUP_ORDER.includes(g))
            .map(([g, inds]) => (
              <GroupSection key={g} name={g} indicators={inds} />
            ))}
        </>
      )}
    </div>
  );
}
