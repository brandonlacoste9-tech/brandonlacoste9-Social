from abc import ABC, abstractmethod
from typing import Dict, Any, List
from datetime import datetime
import uuid


class BaseBee(ABC):
    """
    The fundamental DNA of a Worker Bee.
    All specialized agents (DocBee, CodeBee, etc.) inherit from this.
    """

    def __init__(self, name: str):
        self.id = str(uuid.uuid4())
        self.name = name
        self.role = self.__class__.__name__  # e.g. "DocBee"
        self.status = "idle"  # idle, busy, offline
        self.skills: List[str] = []
        self.last_heartbeat = datetime.now()

    @abstractmethod
    async def execute(self, task_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        The core work function. Every Bee must implement this.
        Returns the result of the task.
        """
        ...

    async def report_status(self):
        """Emits a heartbeat to the Hive."""
        self.last_heartbeat = datetime.now()
        # TODO: Publish to Event Bus
        print(f"💓 {self.role} ({self.id}) is {self.status}")
