from fastapi import APIRouter, HTTPException, Body
from app.kernel.foreman import Foreman

router = APIRouter(prefix="/tasks", tags=["Kernel"])
foreman = Foreman()


@router.post("/dispatch")
async def dispatch_task(task_data: dict = Body(...)):
  """
  The Entry Point for Level 4: Agent Dispatch.
  Receives a task, routes it to a Bee, and returns the result.
  """
  if not task_data.get("type"):
    raise HTTPException(status_code=400, detail="Task type required")
  if "payload" not in task_data:
    raise HTTPException(status_code=400, detail="Task payload required")

  # Logging without emoji to avoid encoding issues on some consoles
  print(f"[DISPATCH] API received task type: {task_data.get('type')}")
  try:
    result = await foreman.dispatch(task_data)
    return {"status": "success", "result": result}
  except Exception as e:
    print(f"[DISPATCH][ERROR] {e}")
    return {"status": "error", "message": str(e)}
