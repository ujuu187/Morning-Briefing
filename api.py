"""
Morning Briefing - API 서버
실행: uvicorn api:app --reload
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
from collector import init_db, get_briefing
from indicators import init_indicator_db, get_indicators

app = FastAPI(title="Morning Briefing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


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
    rows = conn.execute(
        "SELECT DISTINCT date FROM articles ORDER BY date DESC LIMIT 30"
    ).fetchall()
    conn.close()
    return {"dates": [r[0] for r in rows]}


@app.get("/health")
def health():
    return {"status": "ok", "today": str(date.today())}
