from typing import Optional
from pydantic import BaseModel, ConfigDict


# --- Inbound (frontend → gateway) ---

class VmSpec(BaseModel):
    name: str
    role: str
    os: str = "Ubuntu 24.04"
    cpu: int = 2
    ram: int = 4        # GB
    disk: int = 50      # GB
    portsOpen: list[int] = []


class CreateProjectRequest(BaseModel):
    name: str
    description: str
    template: str
    region: str
    vms: list[VmSpec]
    cidr: str = "10.10.0.1/24"
    sshPublicKey: Optional[str] = None


# --- Outbound (gateway → frontend, matches TS types) ---

class ChecklistStep(BaseModel):
    id: str
    label: str
    description: str
    done: bool


class VmOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    projectId: str
    name: str
    role: str
    os: str
    cpu: int
    ram: int
    disk: int
    publicIp: Optional[str] = None
    privateIp: Optional[str] = None
    state: str
    monthlyCost: float
    portsOpen: list[int]


class NetworkOut(BaseModel):
    id: str
    projectId: str
    name: str
    cidr: str
    type: str


class ResourcesOut(BaseModel):
    vms: list[VmOut]
    networks: list[NetworkOut]
    volumes: list[dict] = []
    ips: list[dict] = []


class ProjectOut(BaseModel):
    id: str
    name: str
    description: str
    template: str
    region: str
    status: str
    createdAt: str
    checklist: list[ChecklistStep]
    resources: ResourcesOut
