from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .config import settings
from .db import get_db
from .models import User

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def hash_password(p: str) -> str: 
    return pwd.hash(p)

def verify_password(p: str, h: str) -> bool: 
    return pwd.verify(p, h)

def create_token(user: User) -> str:
    exp = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_MINUTES)
    payload = {"sub": str(user.id), "nick": user.nickname, "adm": user.is_admin, "exp": exp}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2)) -> User:
    data = decode_token(token)
    user_id = int(data.get("sub"))
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return user
