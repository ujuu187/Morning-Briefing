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
def indicators(target_date: str = Query(default=None)):
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

    동기 실행: 수집이 끝까지 완료된 뒤 응답한다. Railway는 요청을 처리하는 동안
    컨테이너를 유지하므로 수집이 완주한다. (BackgroundTasks로 응답을 먼저 보내면
    컨테이너가 유휴 상태로 들어가 수집이 중단됐다.) sync def 엔드포인트는
    스레드풀에서 돌아 /health 등 다른 요청을 막지 않는다. 수집은 수 분 걸리므로
    cron-job.org엔 timeout 로그가 뜰 수 있으나, 실제 수집은 Railway가 완료한다."""
    if not COLLECT_SECRET or token != COLLECT_SECRET:
        raise HTTPException(status_code=403, detail="forbidden")
    _run_collection()
    return {"status": "done", "today": today_kst()}


@app.get("/health")
def health():
    return {"status": "ok", "today": today_kst()}
