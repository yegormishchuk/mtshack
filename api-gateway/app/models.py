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
    vm_specs = Column(JSON, default=list)  # original VM specs from wizard
