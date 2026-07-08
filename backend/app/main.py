from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, ficha, emergency, catalogs

app = FastAPI(
    title="MediRecord API",
    description="Backend para el sistema de Ficha Vital de Emergencia MediRecord",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(ficha.router)
app.include_router(emergency.router)
app.include_router(catalogs.router)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "service": "MediRecord API"}
