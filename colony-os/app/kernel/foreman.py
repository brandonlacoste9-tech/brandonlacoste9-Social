from typing import Dict, Any
from app.kernel.bees.doc_bee import DocBee


class Foreman:
    """
    The Task Router.
    Analyzes the task and assigns it to the best available Bee.
    """

    def __init__(self):
        # In a real app, this is a dynamic Agent Pool
        self.registry = {
            "DocBee": DocBee()
            # Future: CodeBee(), VisionBee()
        }

    async def dispatch(self, task: Dict[str, Any]):
        """
        Routes a task to a Bee.
        """
        print(f"[FOREMAN] Analyzing task: {task.get('type')}")

        # 1. Classification Logic (Rule-based for Phase 1)
        required_role = self._classify_task(task)

        # 2. Assignment
        worker = self.registry.get(required_role)
        if not worker:
            return {"error": f"No worker found for role {required_role}"}

        print(f"[FOREMAN] Assigning to {worker.role} ({worker.name})")

        # 3. Execution
        return await worker.execute(task.get("payload") or {})

    def _classify_task(self, task: Dict[str, Any]) -> str:
        # Simple heuristic mapping for now
        task_type = (task.get("type") or "").lower()

        if "text" in task_type or "doc" in task_type or "write" in task_type:
            return "DocBee"
        if "code" in task_type:
            return "CodeBee"  # Not implemented yet

        return "DocBee"  # Default fallback
