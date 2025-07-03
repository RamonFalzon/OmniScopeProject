from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path as PathlibPath

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:5174"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECT_ROOT = PathlibPath(__file__).parent.parent
print(f"DEBUG: PROJECT_ROOT: {PROJECT_ROOT.resolve()}")

@app.get("/")
async def root(ping: str = None):
    if ping and ping.lower() == "ping":
        return {"ping": "pong"}
    else:
        return {"status": "default_response"}



# @app.get("/")
# async def root():
#     return {"ping" : "pong"};