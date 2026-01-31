"""
Modèles Pydantic pour les requêtes et réponses de l'API
Validation stricte des données avec valeurs par défaut réalistes
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from enum import Enum


class TypeBien(str, Enum):
    """Type de bien immobilier"""
    APPARTEMENT = "appartement"
    MAISON = "maison"


class EtatBien(str, Enum):
    """État du bien"""
    NEUF = "neuf"
    ANCIEN = "ancien"
    RENOVE = "rénové"


# ============================================================================
# SIMULATION FINANCIÈRE
# ============================================================================

class SimulationRequest(BaseModel):
    """
    Requête pour simuler un investissement immobilier
    Champs obligatoires : prix, surface, code_postal
    Champs optionnels : valeurs par défaut réalistes appliquées
    """
    
    # ========== BIEN IMMOBILIER (Obligatoire) ==========
    prix: float = Field(
        ...,  # Obligatoire
        gt=0,
        description="Prix d'achat du bien (€)",
        example=150000
    )
    
    surface: float = Field(
        ...,  # Obligatoire
        gt=0,
        le=500,
        description="Surface habitable (m²)",
        example=45
    )
    
    code_postal: str = Field(
        ...,  # Obligatoire
        min_length=5,
        max_length=5,
        description="Code postal du bien (pour estimation loyer)",
        example="75001"
    )
    
    # ========== CARACTÉRISTIQUES (Optionnelles) ==========
    type_bien: TypeBien = Field(
        default=TypeBien.APPARTEMENT,
        description="Type de bien"
    )
    
    etat_bien: EtatBien = Field(
        default=EtatBien.ANCIEN,
        description="État du bien (impacte frais de notaire)"
    )
    
    nb_pieces: Optional[int] = Field(
        default=2,
        ge=1,
        le=10,
        description="Nombre de pièces principales"
    )
    
    annee_construction: Optional[int] = Field(
        default=None,
        ge=1800,
        le=2026,
        description="Année de construction"
    )
    
    # ========== FINANCEMENT (Optionnel avec défauts intelligents) ==========
    apport: Optional[float] = Field(
        default=None,
        ge=0,
        description="Apport personnel (€). Défaut: 10% du prix"
    )
    
    duree_credit: int = Field(
        default=20,
        ge=5,
        le=25,
        description="Durée du crédit (années)"
    )
    
    taux_interet: float = Field(
        default=3.8,
        ge=0,
        le=10,
        description="Taux d'intérêt annuel du crédit (%)"
    )
    
    taux_assurance: float = Field(
        default=0.36,
        ge=0,
        le=1,
        description="Taux d'assurance emprunteur annuel (% du capital emprunté)"
    )
    
    # ========== CHARGES & REVENUS (Optionnel avec estimation auto) ==========
    loyer_mensuel: Optional[float] = Field(
        default=None,
        ge=0,
        description="Loyer mensuel estimé (€). Si None, estimé via données INSEE"
    )
    
    charges_copro: Optional[float] = Field(
        default=None,
        ge=0,
        description="Charges de copropriété mensuelles (€). Défaut: estimées selon surface"
    )
    
    taxe_fonciere: Optional[float] = Field(
        default=None,
        ge=0,
        description="Taxe foncière annuelle (€). Défaut: estimée selon prix"
    )
    
    # ========== FRAIS & TRAVAUX (Optionnel) ==========
    travaux: Optional[float] = Field(
        default=None,
        ge=0,
        description="Budget travaux (€). Défaut: estimé selon état du bien"
    )
    
    frais_agence: Optional[float] = Field(
        default=None,
        ge=0,
        description="Frais d'agence (€). Défaut: calculés automatiquement si inclus dans prix"
    )
    
    # ========== GESTION LOCATIVE ==========
    gestion_locative: bool = Field(
        default=True,
        description="Déléguer la gestion locative à une agence"
    )
    
    taux_gestion: float = Field(
        default=8.0,
        ge=0,
        le=15,
        description="Taux de gestion locative (% du loyer mensuel)"
    )
    
    # ========== HYPOTHÈSES DE PRUDENCE ==========
    vacance_locative_mois: float = Field(
        default=1.0,
        ge=0,
        le=6,
        description="Vacance locative estimée (mois par an)"
    )
    
    taux_impayes: float = Field(
        default=2.0,
        ge=0,
        le=10,
        description="Taux d'impayés estimé (% du loyer annuel)"
    )
    
    @validator('apport', always=True)
    def set_apport_default(cls, v, values):
        """Si apport non fourni, défaut = 10% du prix"""
        if v is None and 'prix' in values:
            return values['prix'] * 0.10
        return v
    
    @validator('charges_copro', always=True)
    def estimate_charges_copro(cls, v, values):
        """
        Si charges non fournies, estimation intelligente :
        - Appartement : ~30€/m²/an → /12 pour mensuel
        - Maison : 0€ (pas de copro)
        """
        if v is None and 'surface' in values and 'type_bien' in values:
            if values['type_bien'] == TypeBien.APPARTEMENT:
                charges_annuelles = values['surface'] * 30  # 30€/m²/an
                return charges_annuelles / 12
            else:
                return 0  # Maison = pas de charges de copro
        return v if v is not None else 0
    
    @validator('taxe_fonciere', always=True)
    def estimate_taxe_fonciere(cls, v, values):
        """
        Si taxe foncière non fournie, estimation :
        Moyenne France : ~15-20€/m²/an (on prend 18€)
        """
        if v is None and 'surface' in values:
            return values['surface'] * 18  # 18€/m²/an
        return v if v is not None else 0
    
    @validator('travaux', always=True)
    def estimate_travaux(cls, v, values):
        """
        Si travaux non fournis, estimation selon état :
        - Neuf : 0€
        - Rénové : 2 000€ (rafraîchissement)
        - Ancien : 500€/m² (rénovation moyenne)
        """
        if v is None and 'surface' in values and 'etat_bien' in values:
            if values['etat_bien'] == EtatBien.NEUF:
                return 0
            elif values['etat_bien'] == EtatBien.RENOVE:
                return 2000  # Rafraîchissement
            else:  # ANCIEN
                return values['surface'] * 500  # 500€/m²
        return v if v is not None else 0


class SimulationResponse(BaseModel):
    """
    Réponse complète de la simulation financière
    Tous les indicateurs clés pour l'investisseur
    """
    
    # ========== RÉCAPITULATIF BIEN ==========
    prix_achat: float = Field(description="Prix d'achat du bien (€)")
    surface: float = Field(description="Surface (m²)")
    prix_m2: float = Field(description="Prix au m² (€/m²)")
    code_postal: str = Field(description="Code postal")
    departement: str = Field(description="Code département")
    
    # ========== COÛT TOTAL DU PROJET ==========
    frais_notaire: float = Field(description="Frais de notaire (€)")
    frais_garantie: float = Field(description="Frais de garantie crédit (€)")
    frais_dossier: float = Field(description="Frais de dossier bancaire (€)")
    travaux: float = Field(description="Budget travaux (€)")
    cout_total_projet: float = Field(description="Coût total avec frais et travaux (€)")
    
    # ========== FINANCEMENT ==========
    apport: float = Field(description="Apport personnel (€)")
    montant_emprunt: float = Field(description="Montant emprunté (€)")
    duree_credit_ans: int = Field(description="Durée du crédit (années)")
    taux_interet: float = Field(description="Taux d'intérêt (%)")
    mensualite_credit: float = Field(description="Mensualité de crédit (capital + intérêts) (€)")
    mensualite_assurance: float = Field(description="Mensualité d'assurance emprunteur (€)")
    mensualite_totale: float = Field(description="Mensualité totale (crédit + assurance) (€)")
    cout_total_credit: float = Field(description="Coût total du crédit sur la durée (€)")
    cout_interets: float = Field(description="Coût des intérêts sur la durée (€)")
    
    # ========== REVENUS LOCATIFS ==========
    loyer_mensuel_brut: float = Field(description="Loyer mensuel brut (€)")
    loyer_annuel_brut: float = Field(description="Loyer annuel brut (€)")
    loyer_annuel_net_vacance: float = Field(description="Loyer annuel après vacance locative (€)")
    
    # ========== CHARGES & DÉPENSES ==========
    charges_copro_mensuel: float = Field(description="Charges de copropriété mensuelles (€)")
    charges_copro_annuel: float = Field(description="Charges de copropriété annuelles (€)")
    taxe_fonciere_annuel: float = Field(description="Taxe foncière annuelle (€)")
    assurance_pno_annuel: float = Field(description="Assurance PNO annuelle (€)")
    gestion_locative_annuel: float = Field(description="Frais de gestion locative annuels (€)")
    charges_totales_annuel: float = Field(description="Total charges annuelles (€)")
    charges_totales_mensuel: float = Field(description="Total charges mensuelles (€)")
    
    # ========== RENTABILITÉ ==========
    rentabilite_brute: float = Field(description="Rentabilité brute (%) = (loyer annuel / prix achat) * 100")
    rentabilite_nette: float = Field(description="Rentabilité nette (%) = (loyer net / coût total projet) * 100")
    rentabilite_nette_nette: float = Field(description="Rentabilité nette-nette après impôts (~70% du net) (%)")
    
    # ========== CASHFLOW ==========
    cashflow_mensuel_brut: float = Field(description="Cashflow mensuel brut (loyer - mensualité) (€)")
    cashflow_mensuel_net: float = Field(description="Cashflow mensuel net (après toutes charges) (€)")
    cashflow_annuel_net: float = Field(description="Cashflow annuel net (€)")
    
    # ========== INDICATEURS CLÉS ==========
    taux_endettement: Optional[float] = Field(
        default=None, 
        description="Taux d'endettement si revenu fourni (%)"
    )
    
    autofinancement: bool = Field(description="Le bien s'autofinance-t-il ? (cashflow net > 0)")
    effort_epargne_mensuel: float = Field(description="Effort d'épargne mensuel si cashflow négatif (€)")
    
    # ========== CONSEIL & VERDICT ==========
    score_investissement: float = Field(
        ge=0, 
        le=100, 
        description="Score de l'investissement /100 (basé sur rentabilité et cashflow)"
    )
    
    verdict: str = Field(description="Verdict synthétique (Excellent, Bon, Moyen, Risqué)")
    
    conseils: list[str] = Field(description="Conseils personnalisés pour cet investissement")
    
    # ========== DÉTAILS CALCUL (pour transparence) ==========
    hypotheses: dict = Field(description="Hypothèses utilisées pour les calculs")


# ============================================================================
# CALCUL DE FAISABILITÉ (Widget 1 du notebook)
# ============================================================================

class FaisabiliteRequest(BaseModel):
    """Requête pour évaluer la faisabilité d'achat"""
    
    revenu_mensuel: float = Field(
        ..., 
        ge=0,
        description="Revenus mensuels nets (€)"
    )
    
    statut: str = Field(
        ...,
        description="Statut professionnel",
        example="Alternant"
    )
    
    logement_actuel: str = Field(
        default="Chez les parents",
        description="Situation de logement actuelle"
    )
    
    duree_etudes_restantes: int = Field(
        default=0,
        ge=0,
        le=6,
        description="Années d'études restantes"
    )
    
    salaire_sortie: float = Field(
        ...,
        ge=0,
        description="Salaire prévu en fin d'études (€)"
    )
    
    apport: float = Field(
        default=0,
        ge=0,
        description="Apport personnel disponible (€)"
    )
    
    garant: bool = Field(
        default=False,
        description="Garantie parentale disponible"
    )


class FaisabiliteResponse(BaseModel):
    """Réponse de l'évaluation de faisabilité"""
    
    score: float = Field(
        ge=0,
        le=100,
        description="Score de faisabilité /100"
    )
    
    verdict: str = Field(description="Faisabilité (Élevée, Intermédiaire, Faible)")
    
    type_pret_recommande: str = Field(description="Type de prêt recommandé")
    
    conseils: list[str] = Field(description="Conseils personnalisés")
    
    details: dict = Field(description="Détails du calcul")


# ============================================================================
# ANALYSE D'ANNONCE SELOGER (Widget 13)
# ============================================================================

class AnnonceAnalyseRequest(BaseModel):
    """Requête pour analyser une annonce immobilière"""
    
    url: str = Field(
        ...,
        description="URL de l'annonce (SeLoger, Leboncoin, etc.)"
    )
    
    # Profil utilisateur (pour scoring personnalisé)
    budget_max: float = Field(
        ...,
        gt=0,
        description="Budget maximum de l'utilisateur (€)"
    )
    
    revenu_mensuel: float = Field(
        ...,
        ge=0,
        description="Revenus mensuels de l'utilisateur (€)"
    )
    
    apport: float = Field(
        default=0,
        ge=0,
        description="Apport disponible (€)"
    )
    
    rendement_min_requis: float = Field(
        default=5.0,
        ge=0,
        le=15,
        description="Rendement brut minimum requis (%)"
    )


class AnnonceAnalyseResponse(BaseModel):
    """Réponse de l'analyse d'annonce"""
    
    # Données de l'annonce
    annonce: dict = Field(description="Données extraites de l'annonce")
    
    # Score global
    score_global: float = Field(
        ge=0,
        le=100,
        description="Score global /100"
    )
    
    verdict: dict = Field(description="Verdict de l'analyse")
    
    # Scores par critère
    scores_criteres: dict = Field(description="Scores détaillés par critère")
    
    # Recommandations
    recommandations: list[str] = Field(description="Recommandations personnalisées")
    
    # Simulation financière associée
    simulation: Optional[SimulationResponse] = Field(
        default=None,
        description="Simulation financière de l'annonce"
    )
