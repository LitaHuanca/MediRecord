import uuid
from datetime import datetime, date
from sqlalchemy import (
    String, Boolean, Numeric, SmallInteger, Integer, Text,
    ForeignKey, DateTime, Date,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


def uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = uuid_pk()
    nombres: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido_paterno: Mapped[str] = mapped_column(String(50), nullable=False)
    apellido_materno: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tipo_documento: Mapped[str] = mapped_column(String(20), nullable=False, default="DNI")
    numero_documento: Mapped[str] = mapped_column(String(15), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(9), nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    @property
    def nombre_completo(self) -> str:
        parts = [self.nombres, self.apellido_paterno]
        if self.apellido_materno:
            parts.append(self.apellido_materno)
        return " ".join(parts)

    perfil: Mapped["PerfilMedico | None"] = relationship("PerfilMedico", back_populates="usuario", uselist=False)
    contactos: Mapped[list["ContactoEmergencia"]] = relationship("ContactoEmergencia", back_populates="usuario")
    tokens: Mapped[list["TokenQR"]] = relationship("TokenQR", back_populates="usuario")


class PerfilMedico(Base):
    __tablename__ = "perfiles_medicos"

    id: Mapped[uuid.UUID] = uuid_pk()
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    tipo_sangre: Mapped[str | None] = mapped_column(String(10), nullable=True)
    sexo: Mapped[str | None] = mapped_column(String(30), nullable=True)
    fecha_nacimiento: Mapped[date | None] = mapped_column(Date, nullable=True)
    donante_organos: Mapped[bool] = mapped_column(Boolean, default=False)
    peso_kg: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    altura_cm: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    notas_adicionales: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="perfil")
    alergias: Mapped[list["PerfilAlergia"]] = relationship("PerfilAlergia", back_populates="perfil", cascade="all, delete-orphan")
    condiciones: Mapped[list["PerfilCondicion"]] = relationship("PerfilCondicion", back_populates="perfil", cascade="all, delete-orphan")
    medicamentos: Mapped[list["PerfilMedicamento"]] = relationship("PerfilMedicamento", back_populates="perfil", cascade="all, delete-orphan")


class Alergia(Base):
    __tablename__ = "alergias"

    id: Mapped[uuid.UUID] = uuid_pk()
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    categoria: Mapped[str | None] = mapped_column(String(50), nullable=True)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)


class PerfilAlergia(Base):
    __tablename__ = "perfil_alergias"

    id: Mapped[uuid.UUID] = uuid_pk()
    perfil_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("perfiles_medicos.id"), nullable=False)
    alergia_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("alergias.id"), nullable=False)
    severidad: Mapped[str] = mapped_column(String(20), default="leve")
    reaccion_observada: Mapped[str | None] = mapped_column(Text, nullable=True)

    perfil: Mapped["PerfilMedico"] = relationship("PerfilMedico", back_populates="alergias")
    alergia: Mapped["Alergia"] = relationship("Alergia")


class CondicionCronica(Base):
    __tablename__ = "condiciones_cronicas"

    id: Mapped[uuid.UUID] = uuid_pk()
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    categoria: Mapped[str | None] = mapped_column(String(50), nullable=True)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)


class PerfilCondicion(Base):
    __tablename__ = "perfil_condiciones"

    id: Mapped[uuid.UUID] = uuid_pk()
    perfil_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("perfiles_medicos.id"), nullable=False)
    condicion_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("condiciones_cronicas.id"), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="activa")
    tratamiento_actual: Mapped[str | None] = mapped_column(Text, nullable=True)

    perfil: Mapped["PerfilMedico"] = relationship("PerfilMedico", back_populates="condiciones")
    condicion: Mapped["CondicionCronica"] = relationship("CondicionCronica")


class Medicamento(Base):
    __tablename__ = "medicamentos"

    id: Mapped[uuid.UUID] = uuid_pk()
    nombre_generico: Mapped[str] = mapped_column(String(150), nullable=False)
    nombre_comercial: Mapped[str | None] = mapped_column(String(150), nullable=True)
    categoria: Mapped[str | None] = mapped_column(String(50), nullable=True)


class PerfilMedicamento(Base):
    __tablename__ = "perfil_medicamentos"

    id: Mapped[uuid.UUID] = uuid_pk()
    perfil_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("perfiles_medicos.id"), nullable=False)
    medicamento_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("medicamentos.id"), nullable=False)
    dosis: Mapped[str | None] = mapped_column(String(100), nullable=True)
    frecuencia: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)

    perfil: Mapped["PerfilMedico"] = relationship("PerfilMedico", back_populates="medicamentos")
    medicamento: Mapped["Medicamento"] = relationship("Medicamento")


class ContactoEmergencia(Base):
    __tablename__ = "contactos_emergencia"

    id: Mapped[uuid.UUID] = uuid_pk()
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    telefono: Mapped[str] = mapped_column(String(20), nullable=False)
    relacion: Mapped[str] = mapped_column(String(30), default="familiar")
    orden_prioridad: Mapped[int] = mapped_column(Integer, default=1)

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="contactos")


class TokenQR(Base):
    __tablename__ = "tokens_qr"

    id: Mapped[uuid.UUID] = uuid_pk()
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="activo")
    revocado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="tokens")
    accesos: Mapped[list["AccesoEmergencia"]] = relationship("AccesoEmergencia", back_populates="token")


class AccesoEmergencia(Base):
    __tablename__ = "accesos_emergencia"

    id: Mapped[uuid.UUID] = uuid_pk()
    token_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tokens_qr.id"), nullable=False)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    via_nfc: Mapped[bool] = mapped_column(Boolean, default=False)
    accessed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    token: Mapped["TokenQR"] = relationship("TokenQR", back_populates="accesos")
