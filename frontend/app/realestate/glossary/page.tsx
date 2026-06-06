import RealEstateSubNav from "@/components/RealEstateSubNav";

const GLOSSARY: { term: string; category: string; desc: string }[] = [
  { term: "전세", category: "임대", desc: "임차인이 보증금을 집주인에게 맡기고, 계약 기간 동안 월세 없이 거주하는 한국 특유의 임대 제도. 계약 만료 시 보증금 전액을 반환받는다." },
  { term: "월세", category: "임대", desc: "보증금과 함께 매월 일정 임대료를 납부하는 일반적인 임대 방식." },
  { term: "갭투자", category: "투자", desc: "매매가와 전세가의 차이(갭)만큼만 자기 자본으로 투자해 주택을 매입하는 방식. 전세가가 높을수록 적은 돈으로 매입 가능하지만 전세가 하락 시 역전세 위험이 있다." },
  { term: "청약", category: "분양", desc: "신규 분양 아파트 입주 자격을 얻기 위해 청약통장을 활용해 신청하는 제도. 가점제·추첨제 방식으로 당첨자를 선정한다." },
  { term: "분양권", category: "분양", desc: "청약 당첨 후 아파트 입주 자격을 증명하는 권리. 전매제한 기간이 지나면 제3자에게 양도할 수 있다." },
  { term: "입주권", category: "재건축/재개발", desc: "재건축·재개발 사업의 조합원이 새 아파트에 입주할 수 있는 권리. 분양권과 달리 조합원 지위에서 발생한다." },
  { term: "재건축", category: "재건축/재개발", desc: "준공 후 일정 연수가 지난 노후 공동주택을 철거하고 새 건물을 짓는 사업. 안전진단을 통해 사업 가능 여부를 결정한다." },
  { term: "재개발", category: "재건축/재개발", desc: "주거환경이 불량한 지역 전체를 철거·정비하고 새롭게 개발하는 사업. 단독주택·다세대주택 밀집 지역에서 주로 시행된다." },
  { term: "LTV", category: "대출 규제", desc: "주택담보대출비율(Loan to Value). 주택 가격 대비 대출 가능 한도 비율로, 규제지역일수록 낮게 적용된다." },
  { term: "DTI", category: "대출 규제", desc: "총부채상환비율(Debt to Income). 연간 소득 대비 연간 원리금 상환액 비율로, 상환 능력을 평가하는 지표다." },
  { term: "DSR", category: "대출 규제", desc: "총부채원리금상환비율(Debt Service Ratio). 모든 금융부채의 원리금을 합산해 소득 대비 비율로 계산하며, DTI보다 엄격한 규제 기준이다." },
  { term: "투기과열지구", category: "규제", desc: "집값이 급등하거나 투기 우려가 높은 지역으로, 대출 규제·전매제한·청약 요건이 강화된다." },
  { term: "조정대상지역", category: "규제", desc: "집값 상승이 지속되는 지역으로, 투기과열지구보다는 완화된 수준의 LTV·청약·세금 규제가 적용된다." },
  { term: "토지거래허가구역", category: "규제", desc: "일정 면적 이상의 토지를 거래할 때 관할 지자체의 허가가 필요한 구역. 실거주 목적 외의 거래를 제한한다." },
  { term: "용적률", category: "건축", desc: "대지 면적 대비 건물 전체 연면적 비율. 용적률이 높을수록 더 높은 건물을 지을 수 있어 사업성이 높아진다." },
  { term: "건폐율", category: "건축", desc: "대지 면적 대비 건물 바닥 면적 비율. 건폐율이 낮을수록 건물이 차지하는 면적이 작아 녹지·주차 공간이 넓어진다." },
  { term: "공시지가", category: "가격", desc: "국토교통부가 매년 발표하는 토지의 공식 기준 가격. 재산세·종합부동산세 등 각종 세금 산정의 기준이 된다." },
  { term: "실거래가", category: "가격", desc: "실제 매매·임대 계약 시 신고된 가격. 국토교통부 실거래가 공개시스템에서 확인할 수 있다." },
  { term: "P (프리미엄)", category: "투자", desc: "분양가나 시세에 웃돈이 붙은 금액. 청약 당첨 분양권 또는 재건축 조합원 물건에 주로 붙는다." },
  { term: "역전세", category: "위험", desc: "전세 재계약 시 집값 하락으로 전세가가 기존 보증금보다 낮아지는 상황. 집주인이 차액을 돌려줘야 하므로 유동성 리스크가 발생한다." },
];

const CATEGORIES = Array.from(new Set(GLOSSARY.map((g) => g.category)));

export default function GlossaryPage() {
  return (
    <div>
      <RealEstateSubNav />
      <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>총 {GLOSSARY.length}개 용어</p>
      {CATEGORIES.map((cat) => (
        <section key={cat} className="mb-8">
          <h2
            className="text-sm font-bold mb-3 pb-2 flex items-center gap-2"
            style={{ color: "var(--accent-bright)", borderBottom: "1px solid var(--border)" }}
          >
            <span>◈</span> {cat}
          </h2>
          <div className="space-y-3">
            {GLOSSARY.filter((g) => g.category === cat).map((g) => (
              <div
                key={g.term}
                className="rounded-xl p-4"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="font-bold text-sm" style={{ color: "var(--text)" }}>{g.term}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--bg-card2)", color: "var(--accent)", border: "1px solid var(--border)" }}
                  >
                    {g.category}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{g.desc}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
