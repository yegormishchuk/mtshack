import os
import re
import httpx

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8002")


def _os_to_image(os_str: str) -> str:
    """'Ubuntu 24.04' → 'ubuntu/24.04'"""
    os_lower = os_str.lower()
    match = re.search(r"(\d+\.\d+)", os_str)
    version = match.group(1) if match else "22.04"
    if "debian" in os_lower:
        return f"debian/{version}"
    return f"ubuntu/{version}"


def _map_state(status: str) -> str:
    return {"Running": "running", "Stopped": "stopped", "Starting": "provisioning"}.get(
        status, "provisioning"
    )


def estimate_cost(cpu: int, ram_gb: int, disk_gb: int) -> float:
    return round(cpu * 5 + ram_gb * 2 + disk_gb * 0.1, 2)


async def create_network(project_name: str, cidr: str, isolated: bool = True) -> dict:
    network_name = f"net-{project_name[:8]}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{BACKEND_URL}/networks",
            json={
                "name": network_name,
                "description": f"Network for project {project_name}",
                "config": {
                    "ipv4_address": cidr,
                    "ipv4_nat": "true",
                    "ipv6_address": "none",
                },
            },
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
        "image": _os_to_image(os_str),
        "type": "container",
        "profiles": ["default"],
        "network_name": network_name,
        "storage_pool": "default",
        "config": {
            "limits.cpu": str(cpu),
            "limits.memory": f"{ram_gb * 1024}MB",
        },
    }

    async with httpx.AsyncClient(timeout=180.0) as client:
        resp = await client.post(f"{BACKEND_URL}/instances", json=payload)
        resp.raise_for_status()
        return resp.json()


async def list_vms(project_name: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(f"{BACKEND_URL}/instances")
        resp.raise_for_status()
        return resp.json()


async def delete_vm(instance_name: str, force: bool = True) -> dict:
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.delete(f"{BACKEND_URL}/instances/{instance_name}")
        resp.raise_for_status()
        return resp.json()


async def get_metrics(vm_name: str) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{BACKEND_URL}/instances/{vm_name}")
        resp.raise_for_status()
        data = resp.json()
        state = data.get("state", {})
        return {
            "cpu": state.get("cpus", {}),
            "memory": state.get("memory", {}),
            "network": state.get("network", {}),
        }


def map_backend_vm(backend_vm: dict, project_id: str, spec: dict) -> dict:
    """Convert backend instance response to frontend VmOut dict."""
    vm_name = backend_vm.get("name", spec["name"])
    return {
        "id": vm_name,
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
