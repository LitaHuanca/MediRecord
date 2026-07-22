from pydantic import BaseModel, field_validator
from datetime import date, datetime


class ContactoEmergOut(BaseModel):
    nombre: str
    telefono: str
    relacion: str
    orden_prioridad: int


class EmergencyFichaOut(BaseModel):
    nombre_completo: str
    numero_documento: str | None = None
    sexo: str | None = None
    tipo_sangre: str | None
    donante_organos: bool
    peso_kg: float | None
    altura_cm: int | None
    fecha_nacimiento: date | None
    notas_adicionales: str | None
    ultima_actualizacion: datetime | None = None
    alergias: list[dict] = []
    condiciones: list[dict] = []
    medicamentos: list[dict] = []
    contactos: list[ContactoEmergOut] = []

    @field_validator("sexo", mode="before")
    @classmethod
    def capitalizar_sexo(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return v.capitalize()
