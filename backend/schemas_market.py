"""
Schémas Pydantic pour l'endpoint GET /api/market-data (Phase 1)
Structure de données pour les 12 widgets de visualisation
"""

from typing import Optional, List, Dict
from pydantic import BaseModel, Field


# ============================================================================
# SCOPE FRANCE - Données nationales pour widgets 4, 5, 7
# ============================================================================

class DepartementTension(BaseModel):
    """Tension locative par département (Widget 5)"""
    departement: str = Field(..., description="Code département (ex: '69')")
    nom_departement: Optional[str] = Field(None, description="Nom du département")
    taux_vacance: float = Field(..., description="Taux de vacance locative en %")
    tension: str = Field(..., description="Niveau de tension: 'Forte', 'Moyenne', 'Faible'")
    part_locataires: Optional[float] = Field(None, description="% de locataires")
    logements_total: Optional[int] = Field(None, description="Nombre total de logements")


class DepartementRendement(BaseModel):
    """Rendement brut par département (Widget 7)"""
    departement: str = Field(..., description="Code département")
    nom_departement: Optional[str] = Field(None, description="Nom du département")
    prix_m2_median: float = Field(..., description="Prix médian au m² (€)")
    loyer_m2_moyen: float = Field(..., description="Loyer moyen au m² (€/mois)")
    rendement_brut_pct: float = Field(..., description="Rendement brut estimé en %")
    nb_ventes: Optional[int] = Field(None, description="Nombre de ventes DVF 2024")


class ZoneBudgetAccessible(BaseModel):
    """Zones accessibles selon budget (Widget 4)"""
    code_postal: str = Field(..., description="Code postal")
    commune: Optional[str] = Field(None, description="Nom de la commune")
    pct_access: float = Field(..., description="% de biens ≤ budget")
    lat: Optional[float] = Field(None, description="Latitude")
    lon: Optional[float] = Field(None, description="Longitude")
    prix_median: Optional[float] = Field(None, description="Prix médian dans cette zone")
    nb_ventes: Optional[int] = Field(None, description="Nombre de ventes")


class ScopeFranceData(BaseModel):
    """Données nationales (Widget 4, 5, 7)"""
    
    # Widget 5 : Carte de tension locative
    heatmap_tension: List[DepartementTension] = Field(
        default_factory=list,
        description="Tension locative par département pour heatmap France"
    )
    
    # Widget 7 : Rendement brut national
    rendement_departements: List[DepartementRendement] = Field(
        default_factory=list,
        description="Classement départements par rendement brut"
    )
    
    # Widget 4 : Zones accessibles selon budget (optionnel, si budget fourni)
    carte_budget_accessible: Optional[List[ZoneBudgetAccessible]] = Field(
        None,
        description="Zones accessibles si budget fourni en query param"
    )
    
    stats_globales: Optional[Dict] = Field(
        None,
        description="Statistiques globales (nb départements, moyennes nationales, etc.)"
    )


# ============================================================================
# SCOPE DÉPARTEMENT - Données régionales pour widgets 2, 3, 8
# ============================================================================

class EvolutionPrixAnnee(BaseModel):
    """Prix par année (Widget 2)"""
    annee: int = Field(..., description="Année")
    prix_median: float = Field(..., description="Prix médian (€)")
    prix_moyen: Optional[float] = Field(None, description="Prix moyen (€)")
    nb_ventes: Optional[int] = Field(None, description="Nombre de ventes")


class RepartitionTailleBudget(BaseModel):
    """Distribution par nombre de pièces (Widget 3)"""
    nb_pieces: int = Field(..., description="Nombre de pièces")
    count: int = Field(..., description="Nombre de biens disponibles")
    pct: float = Field(..., description="Pourcentage du total")
    prix_median: Optional[float] = Field(None, description="Prix médian pour cette taille")


class ScopeDepartementData(BaseModel):
    """Données départementales (Widget 2, 3, 8)"""
    
    code: str = Field(..., description="Code département (ex: '69')")
    nom: Optional[str] = Field(None, description="Nom du département")
    
    # Widget 2 : Évolution 2020-2024
    evolution_prix_2020_2024: List[EvolutionPrixAnnee] = Field(
        default_factory=list,
        description="Évolution du prix médian sur 5 ans"
    )
    
    # Widget 3 : Répartition par taille (si budget fourni)
    repartition_taille_budget: Optional[Dict] = Field(
        None,
        description="Distribution des biens par nb de pièces selon budget"
    )
    
    # Widget 8 : Indice achat/location
    indice_achat_location: Optional[float] = Field(
        None,
        description="Ratio prix/loyer annuel (< 15 = acheteur, > 20 = locataire)"
    )
    
    # Widget 5 : Tension locative du département
    tension_locative: Optional[Dict] = Field(
        None,
        description="Taux de vacance et tension locative du département"
    )
    
    # Stats complémentaires
    prix_m2_actuel: Optional[float] = Field(None, description="Prix/m² médian actuel")
    loyer_m2_actuel: Optional[float] = Field(None, description="Loyer/m² médian actuel")
    variation_5ans_pct: Optional[float] = Field(None, description="Variation % 2020-2024")


# ============================================================================
# SCOPE CITY - Données locales pour widgets 9, 10
# ============================================================================

class GareProche(BaseModel):
    """Gare à proximité (Widget 9)"""
    nom_gare: str = Field(..., description="Nom de la gare")
    distance_km: float = Field(..., description="Distance en km")
    lat: Optional[float] = Field(None, description="Latitude")
    lon: Optional[float] = Field(None, description="Longitude")
    importance: Optional[str] = Field(None, description="Type de gare (TGV, TER, etc.)")


class EtablissementSup(BaseModel):
    """Établissement d'enseignement supérieur (Widget 10)"""
    nom: str = Field(..., description="Nom de l'établissement")
    distance_km: Optional[float] = Field(None, description="Distance en km")
    type: Optional[str] = Field(None, description="Type (Université, École, etc.)")
    effectif: Optional[int] = Field(None, description="Nombre d'étudiants")


class GareStrategique(BaseModel):
    """Gare stratégique proche de campus (Widget 10)"""
    nom_gare: str = Field(..., description="Nom de la gare")
    nb_campus_proches: int = Field(..., description="Nombre de campus dans rayon")
    campus_proches: List[str] = Field(default_factory=list, description="Noms des campus")
    distance_km: Optional[float] = Field(None, description="Distance depuis la ville")


class MarketTension(BaseModel):
    """Tension du marché local"""
    taux_vacance: float = Field(..., description="Taux de vacance en %")
    niveau: str = Field(..., description="'Forte', 'Moyenne', 'Faible'")
    part_locataires: Optional[float] = Field(None, description="% de locataires")
    logements_vacants: Optional[int] = Field(None, description="Nombre de logements vacants")
    residences_principales: Optional[int] = Field(None, description="Nombre de RP")


class PrixMarche(BaseModel):
    """Prix du marché local"""
    prix_m2_median: Optional[float] = Field(None, description="Prix/m² médian (€)")
    prix_m2_mean: Optional[float] = Field(None, description="Prix/m² moyen (€)")
    loyer_m2_median: Optional[float] = Field(None, description="Loyer/m² médian (€/mois)")
    nb_ventes_2024: Optional[int] = Field(None, description="Nombre de ventes en 2024")


class ScopeCityData(BaseModel):
    """Données locales (Widget 9, 10)"""
    
    code_postal: str = Field(..., description="Code postal")
    ville: Optional[str] = Field(None, description="Nom de la ville")
    departement: Optional[str] = Field(None, description="Code département")
    
    # Marché local
    market_tension: Optional[MarketTension] = Field(
        None,
        description="Tension locative de la ville"
    )
    
    prix_marche: Optional[PrixMarche] = Field(
        None,
        description="Prix du marché immobilier local"
    )
    
    # Widget 9 : Gares proches
    gares: List[GareProche] = Field(
        default_factory=list,
        description="Liste des gares à proximité"
    )
    
    # Widget 10 : Établissements supérieurs
    etablissements_sup: List[EtablissementSup] = Field(
        default_factory=list,
        description="Liste des établissements d'enseignement supérieur"
    )
    
    # Widget 10 : Pôles étudiants
    poles_etudiants: Optional[Dict] = Field(
        None,
        description="Gares stratégiques proches de campus multiples"
    )
    
    # Géolocalisation
    lat: Optional[float] = Field(None, description="Latitude du code postal")
    lon: Optional[float] = Field(None, description="Longitude du code postal")


# ============================================================================
# CALCULATEURS PERSONNALISÉS (Widgets 1, 6)
# ============================================================================

class UserProfileTools(BaseModel):
    """Liens vers calculateurs personnalisés"""
    
    faisabilite_calculator: Dict = Field(
        default_factory=lambda: {
            "description": "Calculer le score de faisabilité d'achat étudiant",
            "endpoint": "/api/calculate-faisabilite",
            "method": "POST"
        },
        description="Widget 1 : Faisabilité d'achat"
    )
    
    rendement_requis_calculator: Dict = Field(
        default_factory=lambda: {
            "description": "Calculer le rendement minimum requis selon profil",
            "endpoint": "/api/calculate-rendement-requis",
            "method": "POST"
        },
        description="Widget 6 : Rendement requis"
    )


# ============================================================================
# RÉPONSE COMPLÈTE
# ============================================================================

class MarketDataResponse(BaseModel):
    """Réponse complète de l'endpoint GET /api/market-data"""
    
    scope_france: ScopeFranceData = Field(
        ...,
        description="Données nationales (toujours présentes)"
    )
    
    scope_departement: Optional[ScopeDepartementData] = Field(
        None,
        description="Données départementales (si departement fourni en query)"
    )
    
    scope_city: Optional[ScopeCityData] = Field(
        None,
        description="Données locales (si code_postal fourni en query)"
    )
    
    user_profile_tools: UserProfileTools = Field(
        default_factory=UserProfileTools,
        description="Calculateurs personnalisés (Widgets 1 et 6)"
    )
    
    metadata: Optional[Dict] = Field(
        None,
        description="Métadonnées (version API, timestamp, sources, etc.)"
    )


# ============================================================================
# SCHÉMAS POUR CALCULATEURS PERSONNALISÉS
# ============================================================================

class FaisabiliteRequest(BaseModel):
    """Requête pour calculateur de faisabilité (Widget 1)"""
    revenu_mensuel: float = Field(..., gt=0, description="Revenus mensuels (€)")
    statut: str = Field(..., description="Étudiant, Apprenti, Jeune actif, etc.")
    logement_actuel: str = Field(..., description="Chez parents, Location, Colocation, etc.")
    duree_etudes_restantes: int = Field(..., ge=0, le=10, description="Années d'études restantes")
    salaire_sortie: float = Field(..., ge=0, description="Salaire prévu après études (€/mois)")
    apport_personnel: float = Field(..., ge=0, description="Apport personnel (€)")
    garant: bool = Field(..., description="Garant disponible (True/False)")


class FaisabiliteResponse(BaseModel):
    """Réponse du calculateur de faisabilité (Widget 1)"""
    score: float = Field(..., ge=0, le=100, description="Score de faisabilité /100")
    verdict: str = Field(..., description="Faisabilité Élevée/Intermédiaire/Faible")
    type_pret_recommande: str = Field(..., description="Type de prêt conseillé")
    conseils: List[str] = Field(default_factory=list, description="Conseils personnalisés")
    details: Optional[Dict] = Field(None, description="Détails du calcul")


class RendementRequisRequest(BaseModel):
    """Requête pour calculateur de rendement requis (Widget 6)"""
    montant_emprunt: float = Field(..., gt=0, description="Montant emprunté (€)")
    taux_interet_pct: float = Field(..., ge=0, le=10, description="Taux d'intérêt annuel (%)")
    duree_credit_ans: int = Field(..., ge=1, le=30, description="Durée du crédit (années)")
    charges_mensuelles_estimees: Optional[float] = Field(0, ge=0, description="Charges mensuelles (€)")
    taxe_fonciere_annuelle: Optional[float] = Field(0, ge=0, description="Taxe foncière (€/an)")


class RendementRequisResponse(BaseModel):
    """Réponse du calculateur de rendement requis (Widget 6)"""
    mensualite_credit: float = Field(..., description="Mensualité de crédit (€/mois)")
    charges_totales_mensuelles: float = Field(..., description="Charges totales (€/mois)")
    loyer_minimum_requis: float = Field(..., description="Loyer mensuel minimum (€/mois)")
    rendement_brut_minimum_pct: float = Field(..., description="Rendement brut minimum (%)")
    details: Optional[Dict] = Field(None, description="Détails du calcul")
