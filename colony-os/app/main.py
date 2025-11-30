from fastapi import FastAPI
from app.routes import tasks

app = FastAPI(title="Colony OS Kernel", version="2.0.0")

# Register Routes
app.include_router(tasks.router)
# app.include_router(mind.router)  # Uncomment when mind routes exist


@app.get("/")
async def root():
    return {"system": "Colony OS", "status": "online", "mode": "sovereign"}
