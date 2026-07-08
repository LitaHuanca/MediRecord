from pydantic import BaseModel
from datetime import date
import uuid


class AlergiaItem(BaseModel):
    alergia_id: str
    severidad: str = "leve"
    reaccion: str | None = None


class CondicionItem(BaseModel):
    condicion_id: str
    estado: str = "activa"
    tratamiento: str | None = None


class MedicamentoItem(BaseModel):
    nombre: str
    dosis: str | None = None
    frecuencia: str | None = None
    notas: str | None = None


class ContactoItem(BaseModel):
    nombre: str
    telefono: str
    relacion: str = "familiar"
    orden_prioridad: int = 1


class FichaUpsertRequest(BaseModel):
    telefono: str | None = None
    tipo_sangre: str | None = None
    sexo: str | None = None
    fecha_nacimiento: date | None = None
    donante_organos: bool = False
    peso_kg: float | None = None
    altura_cm: int | None = None
    notas_adicionales: str | None = None
    alergias: list[AlergiaItem] = []
    condiciones: list[CondicionItem] = []
    medicamentos: list[MedicamentoItem] = []
    contactos: list[ContactoItem] = []


class AlergiaOut(BaseModel):
    alergia_id: str
    nombre: str
    categoria: str | None
    severidad: str
    reaccion: str | None

    model_config = {"from_attributes": True}


class CondicionOut(BaseModel):
    condicion_id: str
    nombre: str
    categoria: str | None
    estado: str
    tratamiento: str | None

    model_config = {"from_attributes": True}


class MedicamentoOut(BaseModel):
    nombre: str
    nombre_comercial: str | None
    categoria: str | None
    dosis: str | None
    frecuencia: str | None
    notas: str | None

    model_config = {"from_attributes": True}


class ContactoOut(BaseModel):
    nombre: str
    telefono: str
    relacion: str
    orden_prioridad: int

    model_config = {"from_attributes": True}


class FichaOut(BaseModel):
    usuario_id: str
    nombre_completo: str
    numero_documento: str | None
    telefono: str | None
    tipo_sangre: str | None
    sexo: str | None
    fecha_nacimiento: date | None
    donante_organos: bool
    peso_kg: float | None
    altura_cm: int | None
    notas_adicionales: str | None
    alergias: list[AlergiaOut] = []
    condiciones: list[CondicionOut] = []
    medicamentos: list[MedicamentoOut] = []
    contactos: list[ContactoOut] = []
    token_qr: str | None = None
