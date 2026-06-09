"""
Morning Briefing - API 서버
실행: uvicorn api:app --reload
"""

import os
from fastapi import FastAPI, Query, BackgroundTasks, HTTPException
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
def collect(background_tasks: BackgroundTasks, token: str = Query(default="")):
    """외부 cron(cron-job.org)이 07:00 KST에 호출해 수집을 트리거. 비밀키로 보호."""
    if not COLLECT_SECRET or token != COLLECT_SECRET:
        raise HTTPException(status_code=403, detail="forbidden")
    background_tasks.add_task(_run_collection)
    return {"status": "started", "today": today_kst()}


@app.get("/health")
def health():
    return {"status": "ok", "today": today_kst()}
