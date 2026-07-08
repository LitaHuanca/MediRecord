from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid

from app.database import get_db
from app.models.tables import (
    TokenQR, PerfilMedico, PerfilAlergia, PerfilCondicion,
    PerfilMedicamento, ContactoEmergencia, AccesoEmergencia,
)
from app.schemas.emergency import EmergencyFichaOut, ContactoEmergOut

router = APIRouter(prefix="/api/emergency", tags=["emergency"])


@router.get("/{token}", response_model=EmergencyFichaOut)
async def get_emergency_ficha(
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    try:
        uuid.UUID(token)
    except ValueError:
        raise HTTPException(status_code=422, detail="Formato de token inválido. Se esperaba un UUID.")

    token_row = await db.scalar(
        select(TokenQR)
        .where(TokenQR.id == token)
        .options(selectinload(TokenQR.usuario))
    )

    if not token_row:
        raise HTTPException(status_code=404, detail="Token de emergencia no encontrado.")

    if token_row.estado != "activo":
        raise HTTPException(status_code=403, detail="Este token ha sido revocado.")

    via_nfc = request.query_params.get("via") == "nfc"
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    db.add(AccesoEmergencia(
        token_id=token_row.id,
        ip=ip,
        user_agent=user_agent,
        via_nfc=via_nfc,
    ))

    usuario = token_row.usuario
    perfil = await db.scalar(
        select(PerfilMedico)
        .where(PerfilMedico.usuario_id == usuario.id)
        .options(
            selectinload(PerfilMedico.alergias).selectinload(PerfilAlergia.alergia),
            selectinload(PerfilMedico.condiciones).selectinload(PerfilCondicion.condicion),
            selectinload(PerfilMedico.medicamentos).selectinload(PerfilMedicamento.medicamento),
        )
    )

    contactos_rows = await db.scalars(
        select(ContactoEmergencia)
        .where(ContactoEmergencia.usuario_id == usuario.id)
        .order_by(ContactoEmergencia.orden_prioridad)
    )
    contactos = list(contactos_rows)

    await db.commit()

    return EmergencyFichaOut(
        nombre_completo=usuario.nombre_completo,
        tipo_sangre=perfil.tipo_sangre if perfil else None,
        donante_organos=perfil.donante_organos if perfil else False,
        peso_kg=perfil.peso_kg if perfil else None,
        altura_cm=perfil.altura_cm if perfil else None,
        fecha_nacimiento=perfil.fecha_nacimiento if perfil else None,
        notas_adicionales=perfil.notas_adicionales if perfil else None,
        alergias=[
            {"nombre": a.alergia.nombre, "severidad": a.severidad, "reaccion": a.reaccion_observada}
            for a in (perfil.alergias if perfil else [])
        ],
        condiciones=[
            {"nombre": c.condicion.nombre, "estado": c.estado, "tratamiento": c.tratamiento_actual}
            for c in (perfil.condiciones if perfil else [])
        ],
        medicamentos=[
            {"nombre": m.medicamento.nombre_generico, "dosis": m.dosis, "frecuencia": m.frecuencia}
            for m in (perfil.medicamentos if perfil else [])
        ],
        contactos=[
            ContactoEmergOut(
                nombre=c.nombre,
                telefono=c.telefono,
                relacion=c.relacion,
                orden_prioridad=c.orden_prioridad,
            )
            for c in contactos
        ],
    )
