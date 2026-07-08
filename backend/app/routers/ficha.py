from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload, attributes as orm_attributes
from datetime import datetime, timezone

from app.database import get_db
from app.dependencies import get_current_user
from app.models.tables import (
    Usuario, PerfilMedico, PerfilAlergia, PerfilCondicion,
    PerfilMedicamento, ContactoEmergencia, TokenQR, Medicamento,
)
from app.schemas.ficha import FichaOut, FichaUpsertRequest, AlergiaOut, CondicionOut, MedicamentoOut, ContactoOut

router = APIRouter(prefix="/api/ficha", tags=["ficha"])


async def _get_or_create_perfil(db: AsyncSession, usuario: Usuario) -> PerfilMedico:
    perfil = await db.scalar(
        select(PerfilMedico)
        .where(PerfilMedico.usuario_id == usuario.id)
        .options(
            selectinload(PerfilMedico.alergias).selectinload(PerfilAlergia.alergia),
            selectinload(PerfilMedico.condiciones).selectinload(PerfilCondicion.condicion),
            selectinload(PerfilMedico.medicamentos).selectinload(PerfilMedicamento.medicamento),
        )
    )
    if not perfil:
        perfil = PerfilMedico(usuario_id=usuario.id)
        db.add(perfil)
        await db.flush()
        # Mark collections as loaded (empty) to prevent async lazy-load errors
        orm_attributes.set_committed_value(perfil, 'alergias', [])
        orm_attributes.set_committed_value(perfil, 'condiciones', [])
        orm_attributes.set_committed_value(perfil, 'medicamentos', [])
    return perfil


@router.get("", response_model=FichaOut)
async def get_ficha(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    perfil = await _get_or_create_perfil(db, current_user)

    contactos_rows = await db.scalars(
        select(ContactoEmergencia)
        .where(ContactoEmergencia.usuario_id == current_user.id)
        .order_by(ContactoEmergencia.orden_prioridad)
    )
    contactos = list(contactos_rows)

    token_row = await db.scalar(
        select(TokenQR)
        .where(TokenQR.usuario_id == current_user.id, TokenQR.estado == "activo")
    )

    return FichaOut(
        usuario_id=str(current_user.id),
        nombre_completo=current_user.nombre_completo,
        numero_documento=current_user.numero_documento,
        telefono=current_user.telefono,
        tipo_sangre=perfil.tipo_sangre,
        sexo=perfil.sexo,
        fecha_nacimiento=perfil.fecha_nacimiento,
        donante_organos=perfil.donante_organos,
        peso_kg=perfil.peso_kg,
        altura_cm=perfil.altura_cm,
        notas_adicionales=perfil.notas_adicionales,
        alergias=[
            AlergiaOut(
                alergia_id=str(a.alergia_id),
                nombre=a.alergia.nombre,
                categoria=a.alergia.categoria,
                severidad=a.severidad,
                reaccion=a.reaccion_observada,
            )
            for a in perfil.alergias
        ],
        condiciones=[
            CondicionOut(
                condicion_id=str(c.condicion_id),
                nombre=c.condicion.nombre,
                categoria=c.condicion.categoria,
                estado=c.estado,
                tratamiento=c.tratamiento_actual,
            )
            for c in perfil.condiciones
        ],
        medicamentos=[
            MedicamentoOut(
                nombre=m.medicamento.nombre_generico,
                nombre_comercial=m.medicamento.nombre_comercial,
                categoria=m.medicamento.categoria,
                dosis=m.dosis,
                frecuencia=m.frecuencia,
                notas=m.notas,
            )
            for m in perfil.medicamentos
        ],
        contactos=[
            ContactoOut(
                nombre=c.nombre,
                telefono=c.telefono,
                relacion=c.relacion,
                orden_prioridad=c.orden_prioridad,
            )
            for c in contactos
        ],
        token_qr=str(token_row.id) if token_row else None,
    )


@router.put("", response_model=FichaOut)
async def upsert_ficha(
    body: FichaUpsertRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 1. Update usuarios (only mutable fields)
    current_user.telefono = body.telefono
    db.add(current_user)

    # 2. Upsert perfil_medico
    perfil = await db.scalar(select(PerfilMedico).where(PerfilMedico.usuario_id == current_user.id))
    if not perfil:
        perfil = PerfilMedico(usuario_id=current_user.id)
        db.add(perfil)

    perfil.tipo_sangre = body.tipo_sangre
    perfil.sexo = body.sexo
    perfil.fecha_nacimiento = body.fecha_nacimiento
    perfil.donante_organos = body.donante_organos
    perfil.peso_kg = body.peso_kg
    perfil.altura_cm = body.altura_cm
    perfil.notas_adicionales = body.notas_adicionales
    await db.flush()

    # 3. Alergias: delete + insert
    await db.execute(delete(PerfilAlergia).where(PerfilAlergia.perfil_id == perfil.id))
    for item in body.alergias:
        db.add(PerfilAlergia(
            perfil_id=perfil.id,
            alergia_id=item.alergia_id,
            severidad=item.severidad,
            reaccion_observada=item.reaccion,
        ))

    # 4. Condiciones: delete + insert
    await db.execute(delete(PerfilCondicion).where(PerfilCondicion.perfil_id == perfil.id))
    for item in body.condiciones:
        db.add(PerfilCondicion(
            perfil_id=perfil.id,
            condicion_id=item.condicion_id,
            estado=item.estado,
            tratamiento_actual=item.tratamiento,
        ))

    # 5. Medicamentos: delete + insert
    await db.execute(delete(PerfilMedicamento).where(PerfilMedicamento.perfil_id == perfil.id))
    for item in body.medicamentos:
        med = await db.scalar(
            select(Medicamento).where(Medicamento.nombre_generico.ilike(item.nombre))
        )
        if not med:
            med = Medicamento(nombre_generico=item.nombre)
            db.add(med)
            await db.flush()
        db.add(PerfilMedicamento(
            perfil_id=perfil.id,
            medicamento_id=med.id,
            dosis=item.dosis,
            frecuencia=item.frecuencia,
            notas=item.notas,
        ))

    # 6. Contactos: delete + insert
    await db.execute(delete(ContactoEmergencia).where(ContactoEmergencia.usuario_id == current_user.id))
    for item in body.contactos:
        if item.nombre.strip() and item.telefono.strip():
            db.add(ContactoEmergencia(
                usuario_id=current_user.id,
                nombre=item.nombre.strip(),
                telefono=item.telefono.strip(),
                relacion=item.relacion,
                orden_prioridad=item.orden_prioridad,
            ))

    # 7. Ensure QR token exists
    token_row = await db.scalar(
        select(TokenQR).where(TokenQR.usuario_id == current_user.id, TokenQR.estado == "activo")
    )
    if not token_row:
        token_row = TokenQR(usuario_id=current_user.id, estado="activo")
        db.add(token_row)

    await db.commit()

    # Return the updated ficha
    return await get_ficha(current_user=current_user, db=db)


@router.post("/token/revoke", tags=["ficha"])
async def revoke_token(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    token_row = await db.scalar(
        select(TokenQR).where(TokenQR.usuario_id == current_user.id, TokenQR.estado == "activo")
    )
    if not token_row:
        raise HTTPException(status_code=404, detail="No hay token activo para revocar.")
    token_row.estado = "revocado"
    token_row.revocado_en = datetime.now(timezone.utc)
    new_token = TokenQR(usuario_id=current_user.id, estado="activo")
    db.add(new_token)
    await db.commit()
    return {"ok": True, "new_token": str(new_token.id)}
