"""
Morning Briefing - 뉴스 수집기
RSS 수집 -> Claude API 요약 -> PostgreSQL 저장
실행: python collector.py
"""

import os
import feedparser
import anthropic
import pg8000
import json
from datetime import datetime
from zoneinfo import ZoneInfo
from dataclasses import dataclass
from pathlib import Path
import re
from urllib.parse import unquote

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
DATABASE_URL = os.environ.get("DATABASE_URL", "")


def get_connection():
    m = re.match(r'postgresql(?:\+\w+)?://([^:]+):(.+)@([^:/]+):?(\d+)?/(.+)$', DATABASE_URL)
    if not m:
        raise ValueError("DATABASE_URL 파싱 실패")
    user, password, host, port, dbname = m.groups()
    return pg8000.connect(
        host=host,
        user=user,
        password=unquote(password),
        port=int(port or 5432),
        database=dbname,
        ssl_context=True,
    )

RSS_SOURCES = {
    "ai-foundation": [
        ("VentureBeat AI", "https://venturebeat.com/category/ai/feed/"),
        ("TechCrunch AI", "https://techcrunch.com/category/artificial-intelligence/feed/"),
    ],
    "world-econ": [
        ("Bloomberg Economics", "https://feeds.bloomberg.com/economics/news.rss"),
        ("FT World Economy", "https://www.ft.com/rss/home/uk"),
    ],
    "kr-econ": [
        ("연합뉴스 경제", "https://www.yna.co.kr/rss/economy.xml"),
        ("한국경제", "https://www.hankyung.com/feed/economy"),
    ],
    "fintech": [
        ("CoinDesk", "https://www.coindesk.com/arc/outboundfeeds/rss/"),
        ("Finextra", "https://www.finextra.com/rss/headlines.aspx"),
    ],
    "ai-sec": [
        ("The Hacker News", "https://feeds.feedburner.com/TheHackersNews"),
    ],
    "payment": [
        ("Finextra Payments", "https://www.finextra.com/rss/channel.aspx?channel=payments"),
        ("Payments Dive", "https://www.paymentsdive.com/feeds/news/"),
    ],
    "startup-global": [
        ("TechCrunch Startups", "https://techcrunch.com/category/startups/feed/"),
        ("Crunchbase News", "https://news.crunchbase.com/feed/"),
    ],
    "startup-apac": [
        ("e27", "https://e27.co/feed/"),
    ],
    "startup-kr": [
        ("플래텀", "https://platum.kr/feed"),
        ("벤처스퀘어", "https://www.venturesquare.net/feed"),
    ],
    "real-estate-kr": [
        ("한국경제 부동산", "https://www.hankyung.com/feed/realestate"),
        ("매일경제 부동산", "https://www.mk.co.kr/rss/50300009/"),
    ],
}

SECTION_NAMES = {
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
}

MAX_ARTICLES_PER_SECTION = 3

# 다수 언론사가 기본 봇 User-Agent(403)와 클라우드 IP를 차단하므로 브라우저 UA로 요청
RSS_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


@dataclass
class Article:
    section: str
    title: str
    url: str
    source: str
    published: str
    summary: str
    bullets: list
    importance: str
    keywords: list


def today_kst() -> str:
    """수집은 KST 오전에 돌지만 서버는 UTC라 날짜가 하루 밀린다. KST 기준 날짜 사용."""
    return str(datetime.now(ZoneInfo("Asia/Seoul")).date())


def load_persona(path: str = "persona.json") -> dict:
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except Exception:
        return {}


def init_db():
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS articles (
                id         SERIAL PRIMARY KEY,
                date       TEXT NOT NULL,
                section    TEXT NOT NULL,
                title      TEXT NOT NULL,
                url        TEXT NOT NULL,
                source     TEXT,
                published  TEXT,
                summary    TEXT,
                bullets    TEXT,
                importance TEXT,
                keywords   TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_date ON articles(date)")
    conn.commit()
    return conn


def fetch_rss(section: str, feeds: list) -> list:
    articles = []
    for source_name, url in feeds:
        try:
            feed = feedparser.parse(url, agent=RSS_USER_AGENT)
            for entry in feed.entries[:5]:
                articles.append({
                    "section": section,
                    "source": source_name,
                    "title": entry.get("title", "").strip(),
                    "url": entry.get("link", ""),
                    "published": entry.get("published", str(datetime.now())),
                    "content": (
                        entry.get("summary", "") or
                        entry.get("description", "") or
                        entry.get("title", "")
                    )[:2000],
                })
        except Exception as e:
            print(f"  [RSS 오류] {source_name}: {e}")
    return articles[:MAX_ARTICLES_PER_SECTION * 2]


def summarize_with_claude(articles: list, section_name: str) -> list:
    if not articles:
        return []

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    persona = load_persona()

    articles_text = "\n\n".join([
        f"[{i+1}] 제목: {a['title']}\n출처: {a['source']}\nURL: {a['url']}\n내용: {a['content']}"
        for i, a in enumerate(articles)
    ])

    persona_block = ""
    if persona:
        p = persona.get("profile", {})
        cp = persona.get("curation_priorities", {})
        ss = persona.get("summary_style", {})
        co = persona.get("custom_prompts", {})
        persona_block = f"""
## 독자 프로파일
- 현재 직책: {p.get('current_role', '')}
- 경력: {' -> '.join(p.get('background', []))}
- 단기 커리어 목표: {p.get('career_goal_near', '')}
- 장기 커리어 목표: {p.get('career_goal_long', '')}
- 관심 도메인: {p.get('domain_focus', '')}

## 선별 기준
- 우선 포함 키워드: {', '.join(cp.get('boost_keywords', []))}
- 낮은 우선순위 키워드: {', '.join(cp.get('deprioritize_keywords', []))}
- importance=high 강제 조건: {co.get('importance_override', '')}

## 요약 스타일
- 톤: {ss.get('tone', '')}
- bullet 스타일: {ss.get('bullet_style', '')}
- 마지막 bullet 형식: {co.get('career_lens', '')}
"""

    prompt = f"""당신은 '{section_name}' 분야 전문 뉴스 에디터입니다.
아래 독자 프로파일과 선별 기준을 반드시 반영해 기사를 큐레이션하세요.
{persona_block}
## 기사 목록
{articles_text}

이 독자에게 가장 유의미한 {MAX_ARTICLES_PER_SECTION}개를 선별해 요약하세요.

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{{
  "articles": [
    {{
      "index": 1,
      "title_kr": "한국어 제목 (간결하게)",
      "summary": "2문장 이내 핵심 요약",
      "bullets": [
        "포인트 1 (왜 중요한가)",
        "포인트 2 (무엇을 의미하는가)",
        "-> 커리어 관점: [독자 커리어 목표와의 연관성]"
      ],
      "importance": "high 또는 mid 또는 low",
      "keywords": ["키워드1", "키워드2", "키워드3"]
    }}
  ]
}}"""

    print(f"  [Debug] API key length: {len(ANTHROPIC_API_KEY)}")
    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2500,
            messages=[{"role": "user", "content": prompt}]
        )
        raw_text = response.content[0].text if response.content else ""
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```", 2)[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.rsplit("```", 1)[0].strip()
        result = json.loads(raw_text)
        summarized = []
        for item in result["articles"]:
            idx = item["index"] - 1
            if 0 <= idx < len(articles):
                raw = articles[idx]
                summarized.append(Article(
                    section=raw["section"],
                    title=item["title_kr"],
                    url=raw["url"],
                    source=raw["source"],
                    published=raw["published"],
                    summary=item["summary"],
                    bullets=item["bullets"],
                    importance=item["importance"],
                    keywords=item["keywords"],
                ))
        return summarized
    except Exception as e:
        print(f"  [Claude 오류] {section_name}: {type(e).__name__}: {e}")
        return []


def save_articles(conn, articles: list, today: str):
    with conn.cursor() as cur:
        for a in articles:
            cur.execute("""
                INSERT INTO articles
                  (date, section, title, url, source, published, summary, bullets, importance, keywords)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                today, a.section, a.title, a.url, a.source, a.published,
                a.summary,
                json.dumps(a.bullets, ensure_ascii=False),
                a.importance,
                json.dumps(a.keywords, ensure_ascii=False),
            ))
    conn.commit()


def get_briefing(conn, target_date: str = None) -> dict:
    with conn.cursor() as cur:
        if not target_date:
            # 수집이 지연돼 오늘 데이터가 없으면 가장 최근 날짜로 폴백 (화면 빈 채 안 둠)
            cur.execute(
                "SELECT date FROM articles WHERE date <= %s ORDER BY date DESC LIMIT 1",
                (today_kst(),),
            )
            row = cur.fetchone()
            target_date = row[0] if row else today_kst()
        cur.execute("""
            SELECT section, title, url, source, published, summary, bullets, importance, keywords
            FROM articles WHERE date = %s
            ORDER BY CASE importance WHEN 'high' THEN 1 WHEN 'mid' THEN 2 ELSE 3 END
        """, (target_date,))
        rows = cur.fetchall()
    sections = {}
    for row in rows:
        sec = row[0]
        if sec not in sections:
            sections[sec] = []
        sections[sec].append({
            "title": row[1], "url": row[2], "source": row[3],
            "published": row[4], "summary": row[5],
            "bullets": json.loads(row[6]),
            "importance": row[7],
            "keywords": json.loads(row[8]),
        })
    return {"date": target_date, "sections": sections}


def main():
    today = today_kst()
    print(f"\nMorning Briefing 수집 시작 - {today}\n")
    conn = init_db()
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM articles WHERE date = %s", (today,))
        existing = cur.fetchone()[0]
    if existing > 0:
        print(f"  이미 오늘 데이터 {existing}건 존재. 스킵합니다.")
        conn.close()
        return
    total = 0
    for section_id, feeds in RSS_SOURCES.items():
        section_name = SECTION_NAMES[section_id]
        print(f"  [{section_name}] 수집 중...")
        raw = fetch_rss(section_id, feeds)
        summarized = summarize_with_claude(raw, section_name)
        save_articles(conn, summarized, today)
        total += len(summarized)
        print(f"    -> {len(summarized)}건 완료")
    conn.close()
    print(f"\n완료: 총 {total}건 저장\n")


if __name__ == "__main__":
    main()
