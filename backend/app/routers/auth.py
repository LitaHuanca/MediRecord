from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt
import bcrypt

from app.database import get_db
from app.config import settings
from app.models.tables import Usuario
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserOut, ChangePasswordRequest
from app.dependencies import get_current_user as get_current_user_dep

router = APIRouter(prefix="/auth", tags=["auth"])


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(Usuario).where(Usuario.email == body.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail="Este correo ya está registrado.")

    existing_doc = await db.scalar(
        select(Usuario).where(
            Usuario.numero_documento == body.numero_documento,
            Usuario.tipo_documento == body.tipo_documento,
        )
    )
    if existing_doc:
        raise HTTPException(status_code=409, detail="Este número de documento ya está registrado.")

    user = Usuario(
        email=body.email.lower(),
        nombres=body.nombres,
        apellido_paterno=body.apellido_paterno,
        apellido_materno=body.apellido_materno,
        tipo_documento=body.tipo_documento,
        numero_documento=body.numero_documento,
        telefono=body.telefono,
        password_hash=hash_password(body.password),
        activo=True,
    )
    db.add(user)
    await db.flush()

    await db.commit()
    await db.refresh(user)

    return TokenResponse(
        access_token=create_token(str(user.id)),
        user_id=str(user.id),
        nombre_completo=user.nombre_completo,
        email=user.email,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(Usuario).where(Usuario.email == body.email.lower()))
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas.")
    if not user.activo:
        raise HTTPException(status_code=403, detail="Cuenta desactivada.")

    return TokenResponse(
        access_token=create_token(str(user.id)),
        user_id=str(user.id),
        nombre_completo=user.nombre_completo,
        email=user.email,
    )


@router.put("/password", status_code=204)
async def change_password(
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_dep),
):
    if not current_user.password_hash or not verify_password(body.password_actual, current_user.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta.")
    current_user.password_hash = hash_password(body.password_nueva)
    await db.commit()


@router.get("/me", response_model=UserOut)
async def me(current_user: Usuario = Depends(get_current_user_dep)):
    return UserOut(
        id=str(current_user.id),
        email=current_user.email,
        nombres=current_user.nombres,
        apellido_paterno=current_user.apellido_paterno,
        apellido_materno=current_user.apellido_materno,
        nombre_completo=current_user.nombre_completo,
        tipo_documento=current_user.tipo_documento,
        numero_documento=current_user.numero_documento,
        telefono=current_user.telefono,
    )


