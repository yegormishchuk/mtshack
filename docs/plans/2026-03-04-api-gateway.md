# API Gateway Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Python/FastAPI API gateway at port 8001 that bridges the React frontend (Vite :5176) with the existing LXD backend (FastAPI :8002), storing project metadata in Postgres.

**Architecture:** Frontend calls `/api/*` (proxied by Vite dev server to gateway), gateway maps frontend's `Project/VM` types to backend's `VMCreate/NetworkCreate` types, persists project metadata in a `projects` table, and proxies VM metrics. No auth for now.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy async + asyncpg, httpx, python-dotenv; React + Zustand + TypeScript (frontend)

---

### Task 1: Gateway scaffold

**Files:**
- Create: `api-gateway/requirements.txt`
- Create: `api-gateway/.env.example`
- Create: `api-gateway/app/__init__.py`
- Create: `api-gateway/app/main.py`

**Step 1: Create `api-gateway/requirements.txt`**

```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
sqlalchemy[asyncio]>=2.0.0
asyncpg>=0.29.0
httpx>=0.27.0
python-dotenv>=1.0.0
pydantic>=2.0.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
```

**Step 2: Create `api-gateway/.env.example`**

```
DATABASE_URL=postgresql+asyncpg://iaas:changeme@localhost:5433/iaas
BACKEND_URL=http://localhost:8002
```

**Step 3: Create `api-gateway/app/__init__.py`**

Empty file.

**Step 4: Create `api-gateway/app/main.py`**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.db import create_tables
from app.routers import projects, metrics


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(title="IaaS API Gateway", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5176", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
```

**Step 5: Verify the structure**

```
api-gateway/
  app/__init__.py
  app/main.py
  requirements.txt
  .env.example
```

**Step 6: Commit**

```bash
git add api-gateway/
git commit -m "feat: scaffold api-gateway FastAPI app"
```

---

### Task 2: DB layer

**Files:**
- Create: `api-gateway/app/db.py`
- Create: `api-gateway/app/models.py`

**Step 1: Create `api-gateway/app/db.py`**

```python
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
    async with SessionLocal() as session:
        yield session


async def create_tables():
    from app.models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

**Step 2: Create `api-gateway/app/models.py`**

```python
import uuid
from sqlalchemy import Column, String, Text, TIMESTAMP, JSON
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class Project(Base):
    __tablename__ = "gateway_projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    template = Column(String, default="Custom")
    region = Column(String, default="Unknown")
    status = Column(String, default="provisioning")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    network_name = Column(String)
    vm_names = Column(ARRAY(String), default=list)
    vm_specs = Column(JSON, default=list)   # original VM specs from wizard
```

Note: table is named `gateway_projects` to avoid collision with any existing backend table.

**Step 3: Commit**

```bash
git add api-gateway/app/db.py api-gateway/app/models.py
git commit -m "feat: add SQLAlchemy db layer and Project model"
```

---

### Task 3: Pydantic schemas

**Files:**
- Create: `api-gateway/app/schemas.py`

**Step 1: Create `api-gateway/app/schemas.py`**

These models match the frontend's TypeScript `Project` and `VM` interfaces exactly (camelCase field names).

```python
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
```

**Step 2: Commit**

```bash
git add api-gateway/app/schemas.py
git commit -m "feat: add Pydantic request/response schemas"
```

---

### Task 4: Backend HTTP client

**Files:**
- Create: `api-gateway/app/backend_client.py`

**Step 1: Create `api-gateway/app/backend_client.py`**

```python
import os
import re
import httpx

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8002")


def _os_to_image(os_str: str) -> str:
    """'Ubuntu 24.04' → '24.04'"""
    match = re.search(r"(\d+\.\d+)", os_str)
    return match.group(1) if match else "22.04"


def _map_state(status: str) -> str:
    return {"Running": "running", "Stopped": "stopped", "Starting": "provisioning"}.get(
        status, "provisioning"
    )


def estimate_cost(cpu: int, ram_gb: int, disk_gb: int) -> float:
    return round(cpu * 5 + ram_gb * 2 + disk_gb * 0.1, 2)


async def create_network(project_name: str, cidr: str, isolated: bool = True) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{BACKEND_URL}/networks",
            json={"project_name": project_name, "cidr": cidr, "isolated": isolated},
        )
        resp.raise_for_status()
        return resp.json()


async def create_vm(
    name: str,
    project_name: str,
    cpu: int,
    ram_gb: int,
    disk_gb: int,
    os_str: str,
    network_name: str,
    ssh_public_key: str | None = None,
) -> dict:
    payload = {
        "name": name,
        "project_name": project_name,
        "cpu": cpu,
        "memory": ram_gb * 1024,   # MiB
        "disk": disk_gb,            # GB
        "image": _os_to_image(os_str),
        "network_name": network_name,
    }
    if ssh_public_key:
        payload["ssh_public_key"] = ssh_public_key

    async with httpx.AsyncClient(timeout=180.0) as client:   # VM creation is slow
        resp = await client.post(f"{BACKEND_URL}/vms", json=payload)
        resp.raise_for_status()
        return resp.json()


async def list_vms(project_name: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(f"{BACKEND_URL}/vms", params={"project_name": project_name})
        resp.raise_for_status()
        return resp.json()


async def delete_vm(instance_name: str, force: bool = True) -> dict:
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.delete(
            f"{BACKEND_URL}/vms/{instance_name}", params={"force": str(force).lower()}
        )
        resp.raise_for_status()
        return resp.json()


async def get_metrics(vm_name: str) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{BACKEND_URL}/vms/{vm_name}/metrics")
        resp.raise_for_status()
        return resp.json()


def map_backend_vm(backend_vm: dict, project_id: str, spec: dict) -> dict:
    """Convert backend VMResponse to frontend VmOut dict."""
    return {
        "id": backend_vm.get("id", spec["name"]),
        "projectId": project_id,
        "name": spec["name"],
        "role": spec["role"],
        "os": spec.get("os", "Ubuntu 22.04"),
        "cpu": spec["cpu"],
        "ram": spec["ram"],
        "disk": spec["disk"],
        "privateIp": backend_vm.get("ip_address"),
        "publicIp": None,
        "state": _map_state(backend_vm.get("status", "")),
        "monthlyCost": estimate_cost(spec["cpu"], spec["ram"], spec["disk"]),
        "portsOpen": spec.get("portsOpen", []),
    }
```

**Step 2: Commit**

```bash
git add api-gateway/app/backend_client.py
git commit -m "feat: add backend HTTP client with VM/network helpers"
```

---

### Task 5: Projects router

**Files:**
- Create: `api-gateway/app/routers/__init__.py`
- Create: `api-gateway/app/routers/projects.py`

**Step 1: Create `api-gateway/app/routers/__init__.py`**

Empty file.

**Step 2: Create `api-gateway/app/routers/projects.py`**

```python
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Project
from app.schemas import CreateProjectRequest, ProjectOut, ResourcesOut, NetworkOut, VmOut, ChecklistStep
import app.backend_client as bc

router = APIRouter(tags=["Projects"])


def _default_checklist() -> list[dict]:
    steps = [
        ("connect", "Подключить репозиторий или код", "Подключите Git или загрузите архив проекта."),
        ("upload", "Настроить окружение", "Выберите образ, переменные окружения и зависимости."),
        ("run", "Запустить приложение", "Опишите команду запуска сервиса."),
        ("expose", "Открыть доступ", "Настройте порты и публичный доступ."),
    ]
    return [
        {"id": s[0], "label": s[1], "description": s[2], "done": s[0] == "connect"}
        for s in steps
    ]


def _build_project_out(db_project: Project, backend_vms: list[dict]) -> ProjectOut:
    specs: list[dict] = db_project.vm_specs or []
    spec_map = {s["name"]: s for s in specs}

    vms_out = []
    for bvm in backend_vms:
        name = bvm.get("id", "")   # backend uses name as id
        spec = spec_map.get(name, {"name": name, "role": "backend", "os": "Ubuntu 22.04",
                                    "cpu": 1, "ram": 1, "disk": 10, "portsOpen": []})
        vms_out.append(VmOut(**bc.map_backend_vm(bvm, db_project.id, spec)))

    network_out = []
    if db_project.network_name:
        network_out = [
            NetworkOut(
                id=f"net-{db_project.id}",
                projectId=db_project.id,
                name=db_project.network_name,
                cidr="10.10.0.0/24",
                type="private",
            )
        ]

    return ProjectOut(
        id=db_project.id,
        name=db_project.name,
        description=db_project.description or "",
        template=db_project.template or "Custom",
        region=db_project.region or "Unknown",
        status=db_project.status,
        createdAt=db_project.created_at.isoformat() if db_project.created_at else "",
        checklist=[ChecklistStep(**s) for s in _default_checklist()],
        resources=ResourcesOut(vms=vms_out, networks=network_out),
    )


@router.get("/projects", response_model=list[ProjectOut])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project))
    projects = result.scalars().all()

    out = []
    for proj in projects:
        try:
            backend_vms = await bc.list_vms(proj.id)
        except Exception:
            backend_vms = []
        out.append(_build_project_out(proj, backend_vms))
    return out


@router.post("/projects", response_model=ProjectOut, status_code=201)
async def create_project(body: CreateProjectRequest, db: AsyncSession = Depends(get_db)):
    project_id = str(uuid.uuid4())
    network_name = f"net-{project_id[:8]}"

    # Persist project immediately so we can return on partial failure
    db_project = Project(
        id=project_id,
        name=body.name,
        description=body.description,
        template=body.template,
        region=body.region,
        status="provisioning",
        network_name=network_name,
        vm_names=[],
        vm_specs=[vm.model_dump() for vm in body.vms],
    )
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)

    # Create network on backend
    try:
        await bc.create_network(project_id, body.cidr)
    except Exception as e:
        db_project.status = "error"
        await db.commit()
        raise HTTPException(status_code=502, detail=f"Network creation failed: {e}")

    # Create VMs on backend
    created_vms = []
    vm_names = []
    for vm_spec in body.vms:
        try:
            result = await bc.create_vm(
                name=vm_spec.name,
                project_name=project_id,
                cpu=vm_spec.cpu,
                ram_gb=vm_spec.ram,
                disk_gb=vm_spec.disk,
                os_str=vm_spec.os,
                network_name=network_name,
                ssh_public_key=body.sshPublicKey,
            )
            created_vms.append(result)
            vm_names.append(vm_spec.name)
        except Exception as e:
            # Continue creating remaining VMs, mark project as error
            db_project.status = "error"

    db_project.vm_names = vm_names
    if db_project.status != "error":
        db_project.status = "running"
    await db.commit()
    await db.refresh(db_project)

    return _build_project_out(db_project, created_vms)


@router.get("/projects/{project_id}", response_model=ProjectOut)
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    db_project = await db.get(Project, project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        backend_vms = await bc.list_vms(project_id)
    except Exception:
        backend_vms = []

    return _build_project_out(db_project, backend_vms)


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db)):
    db_project = await db.get(Project, project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    for vm_name in (db_project.vm_names or []):
        try:
            await bc.delete_vm(vm_name)
        except Exception:
            pass   # best-effort

    await db.delete(db_project)
    await db.commit()
```

**Step 3: Commit**

```bash
git add api-gateway/app/routers/
git commit -m "feat: add projects router with CRUD endpoints"
```

---

### Task 6: Metrics proxy router

**Files:**
- Create: `api-gateway/app/routers/metrics.py`

**Step 1: Create `api-gateway/app/routers/metrics.py`**

```python
from fastapi import APIRouter, HTTPException
import app.backend_client as bc

router = APIRouter(tags=["Metrics"])


@router.get("/vms/{vm_name}/metrics")
async def get_vm_metrics(vm_name: str):
    try:
        return await bc.get_metrics(vm_name)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Metrics unavailable: {e}")
```

**Step 2: Commit**

```bash
git add api-gateway/app/routers/metrics.py
git commit -m "feat: add metrics proxy endpoint"
```

---

### Task 7: Gateway Dockerfile + .env

**Files:**
- Create: `api-gateway/Dockerfile`
- Create: `api-gateway/.env`  (from .env.example, fill real values)

**Step 1: Create `api-gateway/Dockerfile`**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Step 2: Create `api-gateway/.env`** by copying `.env.example` and filling real values:

```
DATABASE_URL=postgresql+asyncpg://iaas:<POSTGRES_PASSWORD>@localhost:5433/iaas
BACKEND_URL=http://localhost:8002
```

Replace `<POSTGRES_PASSWORD>` with the actual value from `Backend-LXD-MTS/docker-compose.yml` (`${POSTGRES_PASSWORD:-changeme}`).

**Step 3: Verify the gateway runs locally**

```bash
cd api-gateway
pip install -r requirements.txt
uvicorn app.main:app --port 8001 --reload
```

Expected: `INFO: Application startup complete.` — open http://localhost:8001/health → `{"status":"ok"}`

**Step 4: Commit**

```bash
git add api-gateway/Dockerfile
git commit -m "feat: add gateway Dockerfile"
```

---

### Task 8: Add gateway to docker-compose

**Files:**
- Modify: `Backend-LXD-MTS/docker-compose.yml`

**Step 1: Add gateway service** — append to the `services:` block in `docker-compose.yml`:

```yaml
  gateway:
    build:
      context: ../api-gateway
      dockerfile: Dockerfile
    container_name: iaas-gateway
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql+asyncpg://iaas:${POSTGRES_PASSWORD:-changeme}@postgres:5432/iaas
      - BACKEND_URL=http://api:8000
    depends_on:
      postgres:
        condition: service_healthy
      api:
        condition: service_started
    networks:
      - iaas-internal
    restart: unless-stopped
```

Note: inside docker-compose, the LXD backend service is `api` on port `8000` (its internal port), so `BACKEND_URL=http://api:8000`.

**Step 2: Commit**

```bash
git add Backend-LXD-MTS/docker-compose.yml
git commit -m "feat: add gateway service to docker-compose"
```

---

### Task 9: Frontend — Vite dev proxy

**Files:**
- Modify: `IaaS_frontend/vps-frontend/vite.config.ts`

**Step 1: Read current file** (already done — port is 5176).

**Step 2: Edit `vite.config.ts`** to add proxy:

```typescript
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
});
```

**Step 3: Commit**

```bash
git add IaaS_frontend/vps-frontend/vite.config.ts
git commit -m "feat: add Vite dev proxy /api → gateway :8001"
```

---

### Task 10: Frontend — implement api.ts

**Files:**
- Modify: `IaaS_frontend/vps-frontend/src/services/api.ts`

**Step 1: Replace the stub** with a full implementation:

```typescript
import type { Project } from '../domain/iaasTypes';
import type { ProjectTemplate } from '../domain/iaasTypes';

export interface VmSpec {
  name: string;
  role: string;
  os: string;
  cpu: number;
  ram: number;
  disk: number;
  portsOpen: number[];
}

export interface CreateProjectPayload {
  name: string;
  description: string;
  template: ProjectTemplate;
  region: string;
  vms: VmSpec[];
  cidr?: string;
  sshPublicKey?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`[API] ${path} → ${resp.status}: ${text}`);
  }
  // 204 No Content has no body
  if (resp.status === 204) return undefined as T;
  return resp.json() as Promise<T>;
}

export const api = {
  listProjects(): Promise<Project[]> {
    return request<Project[]>('/projects');
  },

  createProject(payload: CreateProjectPayload): Promise<Project> {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getProject(id: string): Promise<Project> {
    return request<Project>(`/projects/${id}`);
  },

  deleteProject(id: string): Promise<void> {
    return request<void>(`/projects/${id}`, { method: 'DELETE' });
  },

  getVmMetrics(vmName: string): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(`/vms/${vmName}/metrics`);
  },
};
```

**Step 2: Commit**

```bash
git add IaaS_frontend/vps-frontend/src/services/api.ts
git commit -m "feat: implement api.ts with gateway calls"
```

---

### Task 11: Frontend — wire store to real API

**Files:**
- Modify: `IaaS_frontend/vps-frontend/src/store/projectsStore.ts`

**Step 1: Add async actions to the store interface** — add these to `ProjectsState`:

```typescript
isLoading: boolean;
apiError: string | undefined;
loadProjects(): Promise<void>;
createProjectRemote(payload: import('../services/api').CreateProjectPayload): Promise<string>;
deleteProjectRemote(id: string): Promise<void>;
```

**Step 2: Remove `createMockProjects()`** from the initial state — change the initial `projects` value to `[]`.

**Step 3: Add implementations** in the `create()` call (after the existing methods):

```typescript
isLoading: false,
apiError: undefined,

async loadProjects() {
  set({ isLoading: true, apiError: undefined });
  try {
    const projects = await api.listProjects();
    set({ projects, isLoading: false });
  } catch (e) {
    set({ isLoading: false, apiError: String(e) });
  }
},

async createProjectRemote(payload) {
  set({ isLoading: true, apiError: undefined });
  try {
    const project = await api.createProject(payload);
    set((state) => ({
      projects: [...state.projects, project],
      isLoading: false,
      selectedProjectId: project.id,
      selectedProjectTab: 'overview',
    }));
    return project.id;
  } catch (e) {
    set({ isLoading: false, apiError: String(e) });
    throw e;
  }
},

async deleteProjectRemote(id) {
  set({ isLoading: true });
  try {
    await api.deleteProject(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      isLoading: false,
      selectedProjectId: state.selectedProjectId === id ? undefined : state.selectedProjectId,
    }));
  } catch (e) {
    set({ isLoading: false, apiError: String(e) });
    throw e;
  }
},
```

**Step 4: Add import** at the top of the file:

```typescript
import { api } from '../services/api';
```

**Step 5: Commit**

```bash
git add IaaS_frontend/vps-frontend/src/store/projectsStore.ts
git commit -m "feat: add async store actions for real API (loadProjects, createProjectRemote, deleteProjectRemote)"
```

---

### Task 12: Frontend — wire wizard to API

**Files:**
- Modify: `IaaS_frontend/vps-frontend/src/pages/projects/ProjectWizardPage.tsx`

**Step 1: Read the wizard** (already done — `handleCreate` at line 76).

**Step 2: Replace `handleCreate`** — swap local `addProject` call with `createProjectRemote`:

Replace the `handleCreate` function body with:

```typescript
const handleCreate = async () => {
  if (!template || !region) return;

  // ... keep baseName / description / resources locals unchanged ...

  try {
    const projectId = await createProjectRemote({
      name: baseName,
      description,
      template,
      region,
      vms: resources.vms.map((vm) => ({
        name: vm.name,
        role: vm.role,
        os: vm.os,
        cpu: vm.cpu,
        ram: vm.ram,
        disk: vm.disk,
        portsOpen: vm.portsOpen,
      })),
    });
    navigate(`/projects/${projectId}`);
  } catch {
    // error is stored in store.apiError
  }
};
```

**Step 3: Update the store selector** — change:

```typescript
const addProject = useProjectsStore((state) => state.addProject);
const setStatus = useProjectsStore((state) => state.setProjectStatus);
```

to:

```typescript
const createProjectRemote = useProjectsStore((state) => state.createProjectRemote);
```

Also make the button async-safe — disable while loading:

```typescript
const isLoading = useProjectsStore((state) => state.isLoading);
```

And update the "Создать проект" button:

```tsx
<button
  type="button"
  className="projects-create-btn"
  onClick={handleCreate}
  disabled={isLoading}
>
  {isLoading ? 'Создаётся…' : 'Создать проект'}
</button>
```

**Step 4: Commit**

```bash
git add IaaS_frontend/vps-frontend/src/pages/projects/ProjectWizardPage.tsx
git commit -m "feat: wire project wizard to createProjectRemote API call"
```

---

### Task 13: Frontend — load projects on mount

**Files:**
- Modify: `IaaS_frontend/vps-frontend/src/pages/projects/ProjectsListPage.tsx`

**Step 1: Add `useEffect` to load projects** — add at the top of the `ProjectsListPage` component:

```typescript
const loadProjects = useProjectsStore((state) => state.loadProjects);
const isLoading = useProjectsStore((state) => state.isLoading);

useEffect(() => {
  void loadProjects();
}, [loadProjects]);
```

Add `useEffect` to the imports: `import { useMemo, useState, useEffect } from 'react';`

**Step 2: Show loading state** — wrap the projects list with a guard:

```tsx
{isLoading && <p className="page-text">Загрузка проектов…</p>}
```

Place it just before the `{projectCount === 0 ? ...}` block.

**Step 3: Commit**

```bash
git add IaaS_frontend/vps-frontend/src/pages/projects/ProjectsListPage.tsx
git commit -m "feat: load projects from API on ProjectsListPage mount"
```

---

### Task 14: Smoke test end-to-end

**Step 1: Start Postgres + LXD backend**

```bash
cd Backend-LXD-MTS
docker compose up postgres api -d
```

**Step 2: Start gateway**

```bash
cd api-gateway
uvicorn app.main:app --port 8001 --reload
```

Expected: `INFO: Application startup complete.`

**Step 3: Test health**

```bash
curl http://localhost:8001/health
```

Expected: `{"status":"ok"}`

**Step 4: Test list projects (empty)**

```bash
curl http://localhost:8001/api/projects
```

Expected: `[]`

**Step 5: Start frontend**

```bash
cd IaaS_frontend/vps-frontend
npm run dev
```

Open http://localhost:5176/projects — should show empty state (not mock data).

**Step 6: Create a project via wizard**

Go to http://localhost:5176/projects/new, pick template → region → size → "Создать проект".

Expected: gateway calls backend to create network + VMs, project appears in list.

**Step 7: Commit if everything works**

```bash
git commit -m "chore: verified end-to-end API gateway integration"
```
