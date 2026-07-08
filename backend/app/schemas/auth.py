from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Literal
import re


TIPO_DOCUMENTO = Literal["DNI", "CE", "PASAPORTE"]

DOCUMENTO_PATTERNS = {
    "DNI":      re.compile(r"^\d{8}$"),
    "CE":       re.compile(r"^[A-Z0-9]{9,12}$"),
    "PASAPORTE": re.compile(r"^[A-Z0-9]{6,12}$"),
}


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    nombres: str
    apellido_paterno: str
    apellido_materno: str | None = None
    tipo_documento: TIPO_DOCUMENTO = "DNI"
    numero_documento: str
    telefono: str | None = None

    @field_validator("nombres", "apellido_paterno")
    @classmethod
    def no_vacio(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Debe tener al menos 2 caracteres.")
        if not re.fullmatch(r"[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s\-']+", v):
            raise ValueError("Solo se permiten letras, espacios, guiones y apóstrofes.")
        return v

    @field_validator("apellido_materno")
    @classmethod
    def apellido_materno_opcional(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if v and not re.fullmatch(r"[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s\-']+", v):
            raise ValueError("Solo se permiten letras, espacios, guiones y apóstrofes.")
        return v or None

    @field_validator("numero_documento")
    @classmethod
    def documento_format(cls, v: str) -> str:
        return v.strip().upper()

    @model_validator(mode="after")
    def validar_documento(self) -> "RegisterRequest":
        pattern = DOCUMENTO_PATTERNS.get(self.tipo_documento)
        if pattern and not pattern.match(self.numero_documento):
            mensajes = {
                "DNI": "El DNI debe tener exactamente 8 dígitos numéricos.",
                "CE": "El Carnet de Extranjería debe tener entre 9 y 12 caracteres alfanuméricos.",
                "PASAPORTE": "El Pasaporte debe tener entre 6 y 12 caracteres alfanuméricos.",
            }
            raise ValueError(mensajes[self.tipo_documento])
        return self

    @field_validator("telefono")
    @classmethod
    def telefono_peruano(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not re.fullmatch(r"9[0-9]{8}", v):
            raise ValueError("El teléfono debe ser un celular peruano (9 dígitos, empieza con 9).")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("La contraseña debe tener al menos 6 caracteres.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    nombre_completo: str
    email: str


class ChangePasswordRequest(BaseModel):
    password_actual: str
    password_nueva: str

    @field_validator('password_nueva')
    @classmethod
    def nueva_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError('La nueva contraseña debe tener al menos 6 caracteres.')
        return v


class UserOut(BaseModel):
    id: str
    email: str
    nombres: str
    apellido_paterno: str
    apellido_materno: str | None
    nombre_completo: str
    tipo_documento: str
    numero_documento: str
    telefono: str | None

    model_config = {"from_attributes": True}
