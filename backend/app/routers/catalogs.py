from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.tables import Alergia, CondicionCronica, Medicamento, Usuario
from app.schemas.catalogs import (
    AlergiaOut, CondicionOut, MedicamentoOut, CatalogsOut,
    AlergiaCreate, CondicionCreate, MedicamentoCreate,
)

router = APIRouter(prefix="/api/catalogs", tags=["catalogs"])


@router.get("", response_model=CatalogsOut)
async def get_catalogs(db: AsyncSession = Depends(get_db)):
    alergias     = list(await db.scalars(select(Alergia).order_by(Alergia.nombre)))
    condiciones  = list(await db.scalars(select(CondicionCronica).order_by(CondicionCronica.nombre)))
    medicamentos = list(await db.scalars(select(Medicamento).order_by(Medicamento.nombre_generico)))

    return CatalogsOut(
        alergias=[AlergiaOut(id=str(a.id), nombre=a.nombre, categoria=a.categoria, descripcion=a.descripcion) for a in alergias],
        condiciones=[CondicionOut(id=str(c.id), nombre=c.nombre, categoria=c.categoria, descripcion=c.descripcion) for c in condiciones],
        medicamentos=[MedicamentoOut(id=str(m.id), nombre_generico=m.nombre_generico, nombre_comercial=m.nombre_comercial, categoria=m.categoria) for m in medicamentos],
    )


@router.post("/alergias", response_model=AlergiaOut, status_code=201)
async def create_alergia(
    data: AlergiaCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    existing = await db.scalar(
        select(Alergia).where(Alergia.nombre.ilike(data.nombre.strip()))
    )
    if existing:
        raise HTTPException(status_code=409, detail=f"Ya existe una alergia con el nombre '{data.nombre}'.")

    alergia = Alergia(nombre=data.nombre.strip(), categoria=data.categoria)
    db.add(alergia)
    await db.commit()
    await db.refresh(alergia)
    return AlergiaOut(id=str(alergia.id), nombre=alergia.nombre, categoria=alergia.categoria, descripcion=None)


@router.post("/condiciones", response_model=CondicionOut, status_code=201)
async def create_condicion(
    data: CondicionCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    existing = await db.scalar(
        select(CondicionCronica).where(CondicionCronica.nombre.ilike(data.nombre.strip()))
    )
    if existing:
        raise HTTPException(status_code=409, detail=f"Ya existe una condición con el nombre '{data.nombre}'.")

    cond = CondicionCronica(nombre=data.nombre.strip(), categoria=data.categoria)
    db.add(cond)
    await db.commit()
    await db.refresh(cond)
    return CondicionOut(id=str(cond.id), nombre=cond.nombre, categoria=cond.categoria, descripcion=None)


@router.post("/medicamentos", response_model=MedicamentoOut, status_code=201)
async def create_medicamento(
    data: MedicamentoCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    existing = await db.scalar(
        select(Medicamento).where(Medicamento.nombre_generico.ilike(data.nombre_generico.strip()))
    )
    if existing:
        raise HTTPException(status_code=409, detail=f"Ya existe un medicamento con el nombre '{data.nombre_generico}'.")

    med = Medicamento(
        nombre_generico=data.nombre_generico.strip(),
        nombre_comercial=data.nombre_comercial.strip() if data.nombre_comercial else None,
        categoria=data.categoria,
    )
    db.add(med)
    await db.commit()
    await db.refresh(med)
    return MedicamentoOut(id=str(med.id), nombre_generico=med.nombre_generico, nombre_comercial=med.nombre_comercial, categoria=med.categoria)
