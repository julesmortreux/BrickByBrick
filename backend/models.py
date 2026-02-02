"""
Database Models - Production Ready
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    """User account model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # For email verification later
    onboarding_completed = Column(Boolean, default=False)  # Onboarding completion flag
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    simulations = relationship("UserSimulation", back_populates="user", cascade="all, delete-orphan")


class UserPreferences(Base):
    """User preferences for all widgets"""
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # ========== WIDGET 1: Faisabilité ==========
    # Project preferences
    prix_projet = Column(Integer, default=150000)
    apport = Column(Integer, default=15000)
    duree_credit = Column(Integer, default=20)
    
    # Personal situation
    statut = Column(String(50), default="etudiant")
    anciennete = Column(Integer, default=0)
    revenu_mensuel = Column(Integer, default=800)
    
    # Co-borrower
    co_borrower = Column(Boolean, default=False)
    revenu_co_borrower = Column(Integer, default=0)
    
    # Guarantor
    garant = Column(String(50), default="oui")
    revenu_garant = Column(Integer, default=4000)
    garant_proprio = Column(Boolean, default=True)
    
    # ========== WIDGET 2: Evolution Prix ==========
    w2_departement = Column(String(10), default="69")  # Code département
    w2_type_bien = Column(String(50), default="Appartement")
    w2_annee_debut = Column(Integer, default=2020)
    w2_annee_fin = Column(Integer, default=2024)
    
    # ========== WIDGET 3: Répartition Taille ==========
    w3_budget = Column(Integer, default=150000)
    w3_departement = Column(String(10), default="all")  # "all" = France entière
    
    # ========== WIDGET 5: Proximité Domicile ==========
    w5_rayon = Column(Integer, default=20)  # Rayon de recherche en km
    w5_ville_domicile = Column(Text, nullable=True)  # JSON string de la ville domicile
    w5_villes_relais = Column(Text, nullable=True)  # JSON string du tableau des villes relais
    
    # ========== ONBOARDING: Taux d'intérêt ==========
    taux_interet = Column(Float, default=3.5)  # Taux d'intérêt annuel (%)
    
    # Timestamps
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Relationship
    user = relationship("User", back_populates="preferences")


class UserSimulation(Base):
    """Saved simulations/analyses"""
    __tablename__ = "user_simulations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Simulation name and type
    name = Column(String(255), nullable=False)
    widget_type = Column(String(50), nullable=False)  # faisabilite, dvf, tension, etc.
    
    # Simulation data (JSON for flexibility)
    input_data = Column(JSON, nullable=False)
    result_data = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    user = relationship("User", back_populates="simulations")
