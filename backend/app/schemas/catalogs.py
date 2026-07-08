from pydantic import BaseModel, field_validator


class AlergiaCreate(BaseModel):
    nombre: str
    categoria: str

    @field_validator('nombre')
    @classmethod
    def nombre_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('El nombre no puede estar vacío.')
        return v


class CondicionCreate(BaseModel):
    nombre: str
    categoria: str

    @field_validator('nombre')
    @classmethod
    def nombre_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('El nombre no puede estar vacío.')
        return v


class MedicamentoCreate(BaseModel):
    nombre_generico: str
    nombre_comercial: str | None = None
    categoria: str

    @field_validator('nombre_generico')
    @classmethod
    def nombre_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('El nombre genérico no puede estar vacío.')
        return v


class AlergiaOut(BaseModel):
    id: str
    nombre: str
    categoria: str | None
    descripcion: str | None

    model_config = {"from_attributes": True}


class CondicionOut(BaseModel):
    id: str
    nombre: str
    categoria: str | None
    descripcion: str | None

    model_config = {"from_attributes": True}


class MedicamentoOut(BaseModel):
    id: str
    nombre_generico: str
    nombre_comercial: str | None
    categoria: str | None

    model_config = {"from_attributes": True}


class CatalogsOut(BaseModel):
    alergias: list[AlergiaOut]
    condiciones: list[CondicionOut]
    medicamentos: list[MedicamentoOut]
