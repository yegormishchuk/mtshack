import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Project
from app.schemas import (
    CreateProjectRequest,
    ProjectOut,
    ResourcesOut,
    NetworkOut,
    VmOut,
    ChecklistStep,
)
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

    # Filter to only VMs belonging to this project (list_vms returns all instances)
    project_vm_names = set(db_project.vm_names or [])
    if project_vm_names:
        backend_vms = [v for v in backend_vms if v.get("name") in project_vm_names]

    vms_out = []
    for bvm in backend_vms:
        # MTS_BACKEND returns {name, status} in list; create returns {name, status, ip_address, ...}
        name = bvm.get("name", bvm.get("id", ""))
        spec = spec_map.get(
            name,
            {
                "name": name,
                "role": "backend",
                "os": "Ubuntu 22.04",
                "cpu": 1,
                "ram": 1,
                "disk": 10,
                "portsOpen": [],
            },
        )
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

    # Persist project immediately
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
        except Exception:
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
            pass  # best-effort

    await db.delete(db_project)
    await db.commit()
