"""
Morning Briefing - API 서버
실행: uvicorn api:app --reload
"""

import os
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import collector
import indicators
from collector import init_db, get_briefing, today_kst
from indicators import init_indicator_db, get_indicators

COLLECT_SECRET = os.environ.get("COLLECT_SECRET", "")

app = FastAPI(title="Morning Briefing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def _run_collection():
    collector.main()
    conn = indicators.init_indicator_db()
    indicators.fetch_all_indicators(conn)
    conn.close()


@app.get("/briefing")
def briefing(target_date: str = Query(default=None)):
    conn = init_db()
    data = get_briefing(conn, target_date)
    conn.close()
    return data


@app.get("/briefing/{section}")
def briefing_section(section: str, target_date: str = Query(default=None)):
    conn = init_db()
    data = get_briefing(conn, target_date)
    conn.close()
    return {"date": data["date"], "section": section, "articles": data["sections"].get(section, [])}


@app.get("/indicators")
def indicators_route(target_date: str = Query(default=None)):
    conn = init_indicator_db()
    data = get_indicators(conn, target_date)
    conn.close()
    return data


@app.get("/dates")
def available_dates():
    conn = init_db()
    with conn.cursor() as cur:
        cur.execute("SELECT DISTINCT date FROM articles ORDER BY date DESC LIMIT 30")
        rows = cur.fetchall()
    conn.close()
    return {"dates": [r[0] for r in rows]}


@app.post("/collect")
def collect(token: str = Query(default="")):
    """외부 cron(cron-job.org)이 07:00 KST에 호출해 수집을 트리거. 비밀키로 보호.

    동기 실행: 수집이 끝까지 완료된 뒤 응답한다. 과거 BackgroundTasks 방식은
    수집 중 발생한 예외를 조용히 삼켜, cron-job.org는 200을 받지만 실제 수집은
    실패한 채 방치됐다(indicators 모듈이 동명 엔드포인트 함수에 가려진 버그).
    동기로 두면 실패 시 non-200으로 드러난다. sync def는 스레드풀에서 돌아
    /health 등 다른 요청을 막지 않는다. 수집은 수 분 걸리므로 cron-job.org엔
    timeout 로그가 뜰 수 있으나, 실제 수집은 Railway가 완료한다."""
    if not COLLECT_SECRET or token != COLLECT_SECRET:
        raise HTTPException(status_code=403, detail="forbidden")
    _run_collection()
    return {"status": "done", "today": today_kst()}


@app.get("/health")
def health():
    return {"status": "ok", "today": today_kst()}
