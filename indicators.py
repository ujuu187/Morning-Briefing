"""
Morning Briefing - 경제 지표 수집기
Yahoo Finance API로 실시간 지표 수집
실행: python indicators.py
"""

import os
import pg8000
import json
import urllib.request
import urllib.parse
from datetime import date
from urllib.parse import urlparse

DATABASE_URL = os.environ.get("DATABASE_URL", "")


def get_connection():
    url = urlparse(DATABASE_URL)
    return pg8000.connect(
        host=url.hostname,
        user=url.username,
        password=url.password,
        port=url.port or 5432,
        database=url.path.lstrip('/'),
        ssl_context=True,
    )

INDICATORS = {
    "kospi":    {"symbol": "^KS11",    "name": "코스피",      "group": "증시",    "unit": "pt"},
    "kosdaq":   {"symbol": "^KQ11",    "name": "코스닥",      "group": "증시",    "unit": "pt"},
    "sp500":    {"symbol": "^GSPC",    "name": "S&P 500",     "group": "증시",    "unit": "pt"},
    "nasdaq":   {"symbol": "^IXIC",    "name": "나스닥",      "group": "증시",    "unit": "pt"},
    "nikkei":   {"symbol": "^N225",    "name": "닛케이 225",  "group": "증시",    "unit": "pt"},
    "usdkrw":   {"symbol": "KRW=X",    "name": "원/달러",     "group": "환율",    "unit": "원"},
    "dxy":      {"symbol": "DX-Y.NYB", "name": "달러인덱스",  "group": "환율",    "unit": ""},
    "wti":      {"symbol": "CL=F",     "name": "WTI 유가",    "group": "원자재",  "unit": "$"},
    "gold":     {"symbol": "GC=F",     "name": "금 (Gold)",   "group": "원자재",  "unit": "$"},
    "bitcoin":  {"symbol": "BTC-USD",  "name": "비트코인",    "group": "암호화폐","unit": "$"},
    "ethereum": {"symbol": "ETH-USD",  "name": "이더리움",    "group": "암호화폐","unit": "$"},
    "us10y":    {"symbol": "^TNX",     "name": "미 10Y 국채", "group": "채권",    "unit": "%"},
}


def init_indicator_db():
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS indicators (
                id         SERIAL PRIMARY KEY,
                date       TEXT NOT NULL,
                key        TEXT NOT NULL,
                name       TEXT NOT NULL,
                group_name TEXT NOT NULL,
                unit       TEXT,
                value      REAL,
                prev_value REAL,
                change_pct REAL,
                fetched_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(date, key)
            )
        """)
    conn.commit()
    return conn


def fetch_yahoo(symbol: str) -> dict:
    url = (
        "https://query1.finance.yahoo.com/v8/finance/chart/"
        + urllib.parse.quote(symbol)
        + "?interval=1d&range=2d"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.loads(res.read())
        result = data["chart"]["result"][0]
        closes = result["indicators"]["quote"][0]["close"]
        closes = [c for c in closes if c is not None]
        if len(closes) < 2:
            return None
        prev, current = closes[-2], closes[-1]
        change_pct = ((current - prev) / prev) * 100 if prev else 0
        return {
            "value": round(current, 4),
            "prev_value": round(prev, 4),
            "change_pct": round(change_pct, 2),
        }
    except Exception as e:
        print(f"    [오류] {symbol}: {e}")
        return None


def fetch_all_indicators(conn):
    today = str(date.today())
    print(f"\n경제 지표 수집 - {today}\n")
    saved = 0
    with conn.cursor() as cur:
        for key, meta in INDICATORS.items():
            print(f"  {meta['name']} 조회 중...")
            data = fetch_yahoo(meta["symbol"])
            if not data:
                continue
            cur.execute("""
                INSERT INTO indicators
                  (date, key, name, group_name, unit, value, prev_value, change_pct)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (date, key) DO UPDATE SET
                  value = EXCLUDED.value,
                  prev_value = EXCLUDED.prev_value,
                  change_pct = EXCLUDED.change_pct
            """, (today, key, meta["name"], meta["group"], meta["unit"],
                  data["value"], data["prev_value"], data["change_pct"]))
            saved += 1
            print(f"    -> {meta['unit']}{data['value']:,.2f}  ({data['change_pct']:+.2f}%)")

        # 한국 기준금리 (수동 관리)
        cur.execute("""
            INSERT INTO indicators
              (date, key, name, group_name, unit, value, prev_value, change_pct)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (date, key) DO UPDATE SET
              value = EXCLUDED.value,
              prev_value = EXCLUDED.prev_value,
              change_pct = EXCLUDED.change_pct
        """, (today, "bok_rate", "한국 기준금리", "채권", "%", 3.25, 3.50, None))
        saved += 1

    conn.commit()
    print(f"\n완료: 지표 {saved}개 저장\n")


def get_indicators(conn, target_date: str = None) -> dict:
    if not target_date:
        target_date = str(date.today())
    with conn.cursor() as cur:
        cur.execute("""
            SELECT key, name, group_name, unit, value, prev_value, change_pct
            FROM indicators WHERE date = %s
            ORDER BY group_name, key
        """, (target_date,))
        rows = cur.fetchall()
    groups = {}
    for row in rows:
        key, name, group, unit, val, prev, chg = row
        if group not in groups:
            groups[group] = []
        groups[group].append({
            "key": key, "name": name, "unit": unit,
            "value": val, "prev_value": prev, "change_pct": chg,
            "direction": "up" if (chg or 0) > 0 else ("dn" if (chg or 0) < 0 else "nt"),
        })
    return {"date": target_date, "groups": groups}


if __name__ == "__main__":
    conn = init_indicator_db()
    fetch_all_indicators(conn)
    conn.close()
