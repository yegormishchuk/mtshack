from fastapi import APIRouter, HTTPException
import app.backend_client as bc

router = APIRouter(tags=["Metrics"])


@router.get("/vms/{vm_name}/metrics")
async def get_vm_metrics(vm_name: str):
    try:
        return await bc.get_metrics(vm_name)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Metrics unavailable: {e}")
