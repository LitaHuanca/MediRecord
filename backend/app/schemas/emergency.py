from pydantic import BaseModel
from datetime import date


class ContactoEmergOut(BaseModel):
    nombre: str
    telefono: str
    relacion: str
    orden_prioridad: int


class EmergencyFichaOut(BaseModel):
    nombre_completo: str
    tipo_sangre: str | None
    donante_organos: bool
    peso_kg: float | None
    altura_cm: int | None
    fecha_nacimiento: date | None
    notas_adicionales: str | None
    alergias: list[dict] = []
    condiciones: list[dict] = []
    medicamentos: list[dict] = []
    contactos: list[ContactoEmergOut] = []
