import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import router as analytics_router

app = FastAPI(
    title="NEXORA Python Analytics Engine",
    description="Statistical, predictive, and root-cause analytics engine for NEXORA AI Analyst Platform.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "nexora-analytics-engine",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
