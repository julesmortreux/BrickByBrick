"""
Authentication System - Production Ready
JWT tokens, password hashing, user management
"""
import os
import bcrypt
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, validator
from dotenv import load_dotenv

from database import get_db
from models import User, UserPreferences

load_dotenv()

# ============================================
# Configuration
# ============================================

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-in-production-min-32-chars")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS = 30

security = HTTPBearer()
router = APIRouter(prefix="/auth", tags=["Authentication"])

# ============================================
# Pydantic Schemas
# ============================================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Le mot de passe doit contenir au moins 8 caractères')
        if not any(c.isupper() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une majuscule')
        if not any(c.isdigit() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins un chiffre')
        return v
    
    @validator('first_name', 'last_name')
    def name_not_empty(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Le nom doit contenir au moins 2 caractères')
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserPreferencesSchema(BaseModel):
    # Widget 1: Faisabilité
    prix_projet: int = 150000
    apport: int = 15000
    duree_credit: int = 20
    statut: str = "etudiant"
    anciennete: int = 0
    revenu_mensuel: int = 800
    co_borrower: bool = False
    revenu_co_borrower: int = 0
    garant: str = "oui"
    revenu_garant: int = 4000
    garant_proprio: bool = True
    # Widget 2: Evolution Prix
    w2_departement: str = "69"
    w2_type_bien: str = "Appartement"
    w2_annee_debut: int = 2020
    w2_annee_fin: int = 2024
    # Widget 3: Répartition Taille
    w3_budget: int = 150000
    w3_departement: str = "all"
    # Widget 5: Proximité Domicile
    w5_rayon: Optional[int] = 20
    w5_ville_domicile: Optional[str] = None  # JSON string
    w5_villes_relais: Optional[str] = None  # JSON string


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ============================================
# Helper Functions
# ============================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    """Hash a password"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré"
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Type de token invalide"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide"
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé"
        )
    
    return user


# ============================================
# Routes
# ============================================

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte existe déjà avec cet email"
        )
    
    # Create user
    user = User(
        email=user_data.email.lower(),
        hashed_password=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # NOTE: Preferences are NOT created here - they will be created
    # only when the user saves Widget 1 for the first time
    
    # Generate tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
    )


@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    user = db.query(User).filter(User.email == user_data.email.lower()).first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Generate tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    payload = decode_token(request.refresh_token)
    
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de rafraîchissement invalide"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé ou désactivé"
        )
    
    # Generate new tokens
    access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user={
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user


@router.get("/preferences")
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user preferences - returns null if user hasn't saved Widget 1 yet"""
    prefs = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    
    if not prefs:
        # No preferences saved yet - user hasn't clicked "Save" on Widget 1
        return None
    
    return UserPreferencesSchema(
        prix_projet=prefs.prix_projet,
        apport=prefs.apport,
        duree_credit=prefs.duree_credit,
        statut=prefs.statut,
        anciennete=prefs.anciennete,
        revenu_mensuel=prefs.revenu_mensuel,
        co_borrower=prefs.co_borrower,
        revenu_co_borrower=prefs.revenu_co_borrower,
        garant=prefs.garant,
        revenu_garant=prefs.revenu_garant,
        garant_proprio=prefs.garant_proprio,
        w2_departement=prefs.w2_departement or "69",
        w2_type_bien=prefs.w2_type_bien or "Appartement",
        w2_annee_debut=prefs.w2_annee_debut or 2020,
        w2_annee_fin=prefs.w2_annee_fin or 2024,
        w3_budget=prefs.w3_budget or 150000,
        w3_departement=prefs.w3_departement or "all",
        w5_rayon=getattr(prefs, 'w5_rayon', None) or 20,
        w5_ville_domicile=getattr(prefs, 'w5_ville_domicile', None),
        w5_villes_relais=getattr(prefs, 'w5_villes_relais', None)
    )


@router.put("/preferences", response_model=UserPreferencesSchema)
async def update_preferences(
    preferences: UserPreferencesSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user preferences"""
    prefs = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)
    
    # Update all fields - Widget 1
    prefs.prix_projet = preferences.prix_projet
    prefs.apport = preferences.apport
    prefs.duree_credit = preferences.duree_credit
    prefs.statut = preferences.statut
    prefs.anciennete = preferences.anciennete
    prefs.revenu_mensuel = preferences.revenu_mensuel
    prefs.co_borrower = preferences.co_borrower
    prefs.revenu_co_borrower = preferences.revenu_co_borrower
    prefs.garant = preferences.garant
    prefs.revenu_garant = preferences.revenu_garant
    prefs.garant_proprio = preferences.garant_proprio
    # Update all fields - Widget 2
    prefs.w2_departement = preferences.w2_departement
    prefs.w2_type_bien = preferences.w2_type_bien
    prefs.w2_annee_debut = preferences.w2_annee_debut
    prefs.w2_annee_fin = preferences.w2_annee_fin
    # Update all fields - Widget 3
    prefs.w3_budget = preferences.w3_budget
    prefs.w3_departement = preferences.w3_departement
    # Update all fields - Widget 5
    if hasattr(preferences, 'w5_rayon') and preferences.w5_rayon is not None:
        prefs.w5_rayon = preferences.w5_rayon
    if hasattr(preferences, 'w5_ville_domicile'):
        prefs.w5_ville_domicile = preferences.w5_ville_domicile
    if hasattr(preferences, 'w5_villes_relais'):
        prefs.w5_villes_relais = preferences.w5_villes_relais
    
    db.commit()
    db.refresh(prefs)
    
    return preferences


@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account"""
    db.delete(current_user)
    db.commit()
    return {"message": "Compte supprimé avec succès"}
