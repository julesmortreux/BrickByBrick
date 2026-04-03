"""
BrickByBrick - API Backend
FastAPI server pour la plateforme d'aide à l'investissement immobilier
"""

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging
import json
import math
from datetime import datetime
import pandas as pd

from data_loader import load_data, get_data_store
from schemas import SimulationRequest, SimulationResponse
from schemas_market import (
    MarketDataResponse, ScopeFranceData, ScopeDepartementData, ScopeCityData,
    FaisabiliteRequest, FaisabiliteResponse, RendementRequisRequest, RendementRequisResponse
)
from finance import simuler_investissement, calculer_score_investissement_v2
from scraper import scrape_ad
from ai_analyzer import analyze_with_ai
import widgets
from pydantic import BaseModel, Field
from typing import Optional

# Auth & Database
from database import init_db, get_db
from auth import router as auth_router, get_optional_user
from models import User, UserPreferences, UserSimulation
from sqlalchemy.orm import Session
from typing import List

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# INITIALISATION FASTAPI
# ============================================================================

app = FastAPI(
    title="BrickByBrick API",
    description="API pour l'analyse d'investissements immobiliers locatifs",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI : http://localhost:8000/docs
    redoc_url="/redoc"  # ReDoc : http://localhost:8000/redoc
)

# ============================================================================
# CONFIGURATION CORS
# ============================================================================

# Autoriser les requêtes depuis le frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Frontend Next.js en développement
        "http://127.0.0.1:3000",  # Alternative localhost
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Autoriser toutes les méthodes (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Autoriser tous les headers
)

logger.info("[OK] CORS configure pour http://localhost:3000")

# ============================================================================
# INCLUDE ROUTERS
# ============================================================================

app.include_router(auth_router)
logger.info("[OK] Auth routes incluses (/auth/*)")

# ============================================================================
# ÉVÉNEMENTS DE CYCLE DE VIE
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """
    Événement déclenché au démarrage de l'API
    Charge tous les datasets CSV en mémoire
    """
    logger.info("=" * 80)
    logger.info("[*] DEMARRAGE DE L'API BRICKBYBRICK")
    logger.info("=" * 80)
    
    # Initialize database
    logger.info("[>] Initialisation de la base de donnees...")
    init_db()
    logger.info("[OK] Base de donnees initialisee")
    
    # Charger les données
    data_store = load_data()
    
    # Vérifier que les données essentielles sont chargées
    if data_store.is_ready():
        logger.info("=" * 80)
        logger.info("[OK] API PRETE - Tous les services sont operationnels")
        logger.info("=" * 80)
        logger.info("[>] Documentation disponible sur :")
        logger.info("   - Swagger UI : http://localhost:8000/docs")
        logger.info("   - ReDoc     : http://localhost:8000/redoc")
        logger.info("=" * 80)
    else:
        logger.warning("=" * 80)
        logger.warning("[!] API DEMARREE AVEC LIMITATIONS")
        logger.warning("[!] Certaines donnees essentielles sont manquantes")
        logger.warning("[!] Consultez /api/health pour plus de details")
        logger.warning("=" * 80)


@app.on_event("shutdown")
async def shutdown_event():
    """Événement déclenché à l'arrêt de l'API"""
    logger.info("=" * 80)
    logger.info("[*] ARRET DE L'API BRICKBYBRICK")
    logger.info("=" * 80)


# ============================================================================
# ENDPOINTS DE BASE
# ============================================================================

@app.get("/")
async def root():
    """
    Endpoint racine - Vérification rapide que l'API fonctionne
    
    Returns:
        Statut de l'API avec version et timestamp
    """
    return {
        "status": "online",
        "version": "1.0.0",
        "name": "BrickByBrick API",
        "timestamp": datetime.now().isoformat(),
        "docs": "/docs"
    }


@app.get("/api/health")
async def health_check():
    """
    Health Check - État de santé de l'API
    Vérifie que tous les datasets sont chargés correctement
    
    Returns:
        Statut détaillé de chaque dataset + état global de l'API
    
    Example Response:
        {
            "api_status": "healthy",
            "timestamp": "2026-01-11T...",
            "data_loaded": true,
            "datasets": {
                "dvf_2024": {
                    "loaded": true,
                    "rows": 1066493
                },
                ...
            },
            "loaded_count": 6,
            "total_count": 6
        }
    """
    data_store = get_data_store()
    data_status = data_store.get_status()
    
    # Déterminer le statut global de l'API
    api_status = "healthy" if data_store.is_ready() else "degraded"
    
    if data_store.loaded_count == 0:
        api_status = "unhealthy"
    
    return {
        "api_status": api_status,
        "timestamp": datetime.now().isoformat(),
        "data_loaded": data_store.is_ready(),
        "datasets": {
            "dvf_2020_2024": data_status["dvf_2020_2024"],
            "dvf_2024": data_status["dvf_2024"],
            "loyers": data_status["loyers"],
            "insee": data_status["insee"],
            "enseignement_sup": data_status["enseignement_sup"],
            "gares": data_status["gares"]
        },
        "loaded_count": data_status["loaded_count"],
        "total_count": data_status["total_count"],
        "message": _get_health_message(api_status, data_store.loaded_count)
    }


def _get_health_message(status: str, loaded_count: int) -> str:
    """
    Génère un message descriptif selon le statut de l'API
    
    Args:
        status: Statut de l'API (healthy, degraded, unhealthy)
        loaded_count: Nombre de datasets chargés
    
    Returns:
        Message descriptif
    """
    if status == "healthy":
        return f"[OK] Tous les datasets sont chargés ({loaded_count}/6). API pleinement opérationnelle."
    elif status == "degraded":
        return f"[!] {loaded_count}/6 datasets chargés. Certaines fonctionnalités peuvent être limitées."
    else:
        return "[ERROR] Aucun dataset chargé. Vérifiez le dossier data/ et relancez l'API."


# ============================================================================
# ENDPOINTS MÉTIER - PHASE 1 : MARKET DATA (Widgets de Visualisation)
# ============================================================================

@app.get("/api/market-data", response_model=MarketDataResponse, summary="Market Data pour Widgets Phase 1")
async def get_market_data(
    code_postal: Optional[str] = None,
    departement: Optional[str] = None,
    budget_max: Optional[float] = None,
    nb_pieces: Optional[int] = None,
    type_bien: Optional[str] = None,
    dept_filter: Optional[str] = None,
    rayon_km: Optional[float] = None
):
    """
    **Endpoint Phase 1** : Retourne les données du marché pour alimenter les 12 widgets de visualisation.
    
    ### Scopes des Données
    
    - **Scope France** (toujours retourné) :
        - Widget 5 : Heatmap tension locative par département
        - Widget 7 : Rendement brut par département
        - Widget 4 : Zones accessibles selon budget (si budget_max fourni)
    
    - **Scope Département** (si `departement` fourni) :
        - Widget 2 : Évolution prix 2020-2024
        - Widget 3 : Répartition par taille selon budget
        - Widget 8 : Indice achat/location
    
    - **Scope City** (si `code_postal` fourni) :
        - Widget 9 : Gares à proximité
        - Widget 10 : Établissements d'enseignement supérieur
        - Données du marché local
    
    ### Paramètres
    
    - `code_postal` (optionnel) : Code postal pour données locales (ex: "69001")
    - `departement` (optionnel) : Code département pour données régionales (ex: "69")
    - `budget_max` (optionnel) : Budget maximum pour Widget 3 et 4 (ex: 150000)
    - `nb_pieces` (optionnel) : Nombre de pièces pour Widget 4 (ex: 2)
    
    ### Exemple d'Utilisation
    
    ```bash
    # Données nationales uniquement
    GET /api/market-data
    
    # Données nationales + départementales
    GET /api/market-data?departement=69
    
    # Données complètes (national + département + ville)
    GET /api/market-data?code_postal=69001&departement=69&budget_max=150000
    ```
    
    ### Réponse
    
    Retourne un objet structuré avec 3 scopes :
    - `scope_france` : Données nationales
    - `scope_departement` : Données départementales (null si departement non fourni)
    - `scope_city` : Données locales (null si code_postal non fourni)
    """
    try:
        data_store = get_data_store()
        
        # Vérifier que les données sont chargées
        if not data_store.is_ready():
            raise HTTPException(
                status_code=503,
                detail="Service temporairement indisponible : données en cours de chargement"
            )
        
        logger.info(f"[>] Requete market-data : code_postal={code_postal}, departement={departement}, budget={budget_max}")
        
        # ====================================================================
        # SCOPE FRANCE (toujours retourné)
        # ====================================================================
        
        logger.info("🌍 Calcul Scope France...")
        
        # Widget 5 : Heatmap tension locative
        heatmap_tension = widgets.get_heatmap_tension(data_store.insee)
        
        # Widget 7 : Rendement brut par département
        rendement_departements = widgets.get_rendement_departements(
            data_store.dvf_2024,
            data_store.loyers,
            type_bien="Tous",
            seuil_min=0.0
        )
        
        # Widget 4 : Zones budget accessible (utilise le cache pré-calculé)
        # Retourne TOUTES les zones (pas de limite) pour afficher rouge/orange/bleu/vert
        carte_budget_accessible = None
        if budget_max:
            from zones_precompute import get_zones_cache
            zones_cache = get_zones_cache()
            if zones_cache.is_ready:
                carte_budget_accessible = zones_cache.get_zones_for_budget(
                    budget_max=budget_max,
                    type_bien=type_bien,
                    departement=dept_filter,  # Filtre optionnel par département
                    limit=None  # Pas de limite pour afficher toutes les zones
                )
            else:
                # Fallback si le cache n'est pas prêt (lent, à éviter)
                logger.warning("⚠️ Cache zones non prêt, utilisation du fallback (lent)")
                carte_budget_accessible = widgets.get_zones_budget_accessible(
                    data_store.dvf_2024,
                    budget_max=budget_max,
                    type_bien=type_bien
                )
        
        scope_france = ScopeFranceData(
            heatmap_tension=heatmap_tension,
            rendement_departements=rendement_departements,
            carte_budget_accessible=carte_budget_accessible,
            stats_globales={
                "nb_departements": len(heatmap_tension),
                "nb_departements_rendement": len(rendement_departements)
            }
        )
        
        logger.info(f"[OK] Scope France : {len(heatmap_tension)} departements")
        
        # ====================================================================
        # SCOPE DÉPARTEMENT (si fourni)
        # ====================================================================
        
        scope_departement = None
        # Accepter "all" comme département valide (France entière)
        if departement:
            dept_code = departement if departement != "all" else "all"
            logger.info(f"[>] Calcul Scope Département {dept_code}...")
            
            # Widget 2 : Évolution prix 2020-2024 (seulement si département spécifique)
            evolution_prix = []
            if dept_code != "all":
                evolution_prix = widgets.get_evolution_prix_departement(
                    data_store.dvf_2020_2024,
                    departement=dept_code,
                    type_bien="Tous"
                )
            
            # Widget 3 : Répartition taille/budget (si budget fourni) - fonctionne avec "all"
            repartition_taille = None
            if budget_max:
                repartition_taille = widgets.get_repartition_taille_budget(
                    data_store.dvf_2024,
                    departement=dept_code,
                    budget_max=budget_max
                )
            
            # Widget 8 : Indice achat/location (seulement si département spécifique)
            indice_achat_loc = None
            if dept_code != "all":
                indice_achat_loc = widgets.get_indice_achat_location(
                    data_store.dvf_2024,
                    data_store.loyers,
                    departement=dept_code
                )
            
            # Calculer variation 5 ans
            variation_5ans = None
            if len(evolution_prix) >= 2:
                prix_2020 = evolution_prix[0]["prix_median"]
                prix_2024 = evolution_prix[-1]["prix_median"]
                variation_5ans = ((prix_2024 - prix_2020) / prix_2020) * 100
            
            scope_departement = ScopeDepartementData(
                code=dept_code,
                evolution_prix_2020_2024=evolution_prix,
                repartition_taille_budget=repartition_taille,
                indice_achat_location=indice_achat_loc,
                variation_5ans_pct=variation_5ans
            )
            
            logger.info(f"[OK] Scope Département : {len(evolution_prix) if evolution_prix else 0} années")
        
        # ====================================================================
        # SCOPE CITY (si code_postal fourni)
        # ====================================================================
        
        scope_city = None
        if code_postal:
            logger.info(f"[>] Calcul Scope City {code_postal}...")
            
            # Widget 9 : Gares proches
            rayon_recherche = rayon_km if rayon_km else 20.0
            gares = widgets.get_gares_proches(
                data_store.gares,
                code_postal=code_postal,
                rayon_km=rayon_recherche
            )
            
            # Géocodage du code postal pour obtenir les coordonnées
            code_postal_coords = widgets.get_code_postal_coords(code_postal)
            
            # Widget 10 : Établissements supérieurs (chercher par ville)
            # TODO: Extraire le nom de ville depuis le code postal
            etablissements_sup = []
            
            # Données du marché local
            market_data = widgets.get_local_market_data(
                data_store.dvf_2024,
                data_store.insee,
                data_store.loyers,
                code_postal=code_postal
            )
            
            scope_city = ScopeCityData(
                code_postal=code_postal,
                departement=code_postal[:2],
                market_tension=market_data.get("market_tension"),
                prix_marche=market_data.get("prix_marche"),
                gares=gares,
                etablissements_sup=etablissements_sup,
                lat=code_postal_coords.get("lat"),
                lon=code_postal_coords.get("lon"),
                ville=code_postal_coords.get("ville")
            )
            
            logger.info(f"[OK] Scope City : {len(gares)} gares proches")
        
        # ====================================================================
        # RÉPONSE COMPLÈTE
        # ====================================================================
        
        response = MarketDataResponse(
            scope_france=scope_france,
            scope_departement=scope_departement,
            scope_city=scope_city,
            metadata={
                "version": "1.0.0",
                "timestamp": datetime.now().isoformat(),
                "sources": {
                    "dvf": "DVF 2024 + 2020-2024",
                    "loyers": "INSEE Loyers 2024",
                    "insee": "INSEE Logement 2021",
                    "gares": "SNCF Open Data",
                    "enseignement_sup": "data.gouv.fr"
                }
            }
        )
        
        logger.info("[OK] Market Data calculé avec succès")
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Erreur get_market_data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du calcul des données : {str(e)}"
        )


# ============================================================================
# ENDPOINTS MÉTIER - SIMULATION FINANCIÈRE
# ============================================================================

@app.post("/api/simulate", response_model=SimulationResponse)
async def simulate_investment(request: SimulationRequest):
    """
    Simule un investissement immobilier locatif de manière complète
    
    ## Fonctionnalités
    
    - [OK] Calcul automatique des frais de notaire (réalistes selon état du bien)
    - [OK] Estimation automatique du loyer via données INSEE (si non fourni)
    - [OK] Estimation des charges si non fournies (copro, taxe foncière, assurance)
    - [OK] Prise en compte de la vacance locative et des impayés
    - [OK] Calcul du cashflow net mensuel après TOUTES les charges
    - [OK] Rentabilité brute, nette, et nette-nette (après impôts)
    - [OK] Score d'investissement /100 avec conseils personnalisés
    
    ## Champs obligatoires
    
    - `prix` : Prix d'achat du bien (€)
    - `surface` : Surface habitable (m²)
    - `code_postal` : Pour estimation du loyer via données INSEE
    
    ## Champs optionnels (valeurs par défaut intelligentes)
    
    - `apport` : Défaut = 10% du prix
    - `duree_credit` : Défaut = 20 ans
    - `taux_interet` : Défaut = 3.8%
    - `loyer_mensuel` : Si non fourni, estimé via données INSEE
    - `charges_copro` : Estimées selon surface (30€/m²/an pour appartement)
    - `taxe_fonciere` : Estimée (~18€/m²/an)
    - `travaux` : Estimés selon état du bien (0€ pour neuf, 500€/m² pour ancien)
    
    ## Exemple de requête minimale
    
    ```json
    {
        "prix": 150000,
        "surface": 45,
        "code_postal": "75001"
    }
    ```
    
    ## Exemple de requête complète
    
    ```json
    {
        "prix": 150000,
        "surface": 45,
        "code_postal": "75001",
        "type_bien": "appartement",
        "etat_bien": "ancien",
        "nb_pieces": 2,
        "apport": 15000,
        "duree_credit": 20,
        "taux_interet": 3.8,
        "loyer_mensuel": 900,
        "charges_copro": 100,
        "taxe_fonciere": 800,
        "travaux": 10000,
        "gestion_locative": true,
        "vacance_locative_mois": 1.0
    }
    ```
    
    ## Réponse
    
    Contient plus de 30 indicateurs financiers :
    - Coût total du projet (frais inclus)
    - Mensualité de crédit et assurance
    - Rentabilité brute, nette, nette-nette
    - Cashflow mensuel net
    - Score d'investissement /100
    - Conseils personnalisés
    """
    
    logger.info(f"[>] Nouvelle simulation : {request.prix:,.0f}€, {request.surface}m², CP {request.code_postal}")
    
    # Récupérer le DataStore pour accès aux données
    data_store = get_data_store()
    
    # Simuler l'investissement
    try:
        simulation = simuler_investissement(
            request=request,
            loyers_df=data_store.loyers
        )
        
        logger.info(f"[OK] Simulation terminée : Score {simulation.score_investissement:.1f}/100, Cashflow {simulation.cashflow_mensuel_net:,.0f}€/mois")
        
        return simulation
        
    except Exception as e:
        logger.error(f"[ERROR] Erreur lors de la simulation : {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la simulation : {str(e)}"
        )


@app.get("/api/simulate/example")
async def get_simulation_example():
    """
    Retourne un exemple de requête de simulation
    Utile pour comprendre le format attendu
    """
    return {
        "example_minimal": {
            "prix": 150000,
            "surface": 45,
            "code_postal": "75001"
        },
        "example_complet": {
            "prix": 150000,
            "surface": 45,
            "code_postal": "75001",
            "type_bien": "appartement",
            "etat_bien": "ancien",
            "nb_pieces": 2,
            "apport": 15000,
            "duree_credit": 20,
            "taux_interet": 3.8,
            "loyer_mensuel": 900,
            "charges_copro": 100,
            "taxe_fonciere": 800,
            "travaux": 10000,
            "gestion_locative": True,
            "vacance_locative_mois": 1.0
        },
        "info": "Utilisez POST /api/simulate avec ces données"
    }


# ============================================================================
# ENDPOINTS MÉTIER - ANALYSE D'ANNONCE (SCRAPING)
# ============================================================================

class AnalyzeRequest(BaseModel):
    """Requête pour analyser une annonce immobilière"""
    url: str = Field(
        ...,
        description="URL de l'annonce (SeLoger, Leboncoin, etc.)",
        example="https://www.seloger.com/annonces/achat/appartement/..."
    )


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance en km entre deux coordonnées GPS (formule de Haversine)."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def _calculer_score_faisabilite(prix: float, prefs) -> float:
    """Recalcule le score bancaire à partir du profil utilisateur et du prix du bien."""
    score = 0

    # Situation (30 pts)
    statut_scores = {
        "fonctionnaire": 30, "cdi": 25, "alternant": 18,
        "cdd": 12, "auto-entrepreneur": 12, "retraite": 20,
        "etudiant": 8, "chomeur": 5,
    }
    score += statut_scores.get(prefs.statut, 8)

    # Revenus (25 pts)
    revenu_total = (prefs.revenu_mensuel or 0) + (prefs.revenu_co_borrower or 0)
    taux_interet = getattr(prefs, "taux_interet", 3.5) or 3.5
    duree = prefs.duree_credit or 20
    apport = prefs.apport or 0
    emprunt = max(0, prix * 1.08 - apport)  # approximation avec frais notaire

    if emprunt > 0 and taux_interet > 0:
        t_m = taux_interet / 100 / 12
        n = duree * 12
        mensualite = (emprunt * t_m) / (1 - (1 + t_m) ** (-n))
    else:
        mensualite = emprunt / max(duree * 12, 1)

    taux_endettement = (mensualite / revenu_total * 100) if revenu_total > 0 else 100
    if taux_endettement <= 30:
        score += 25
    elif taux_endettement <= 35:
        score += 18
    elif taux_endettement <= 40:
        score += 10
    else:
        score += 3

    # Apport (20 pts)
    pct_apport = (apport / prix * 100) if prix > 0 else 0
    if pct_apport >= 20:
        score += 20
    elif pct_apport >= 10:
        score += 14
    elif pct_apport >= 5:
        score += 8
    else:
        score += 3

    # Garant (20 pts)
    garant = getattr(prefs, "garant", "aucun")
    if garant == "oui":
        g_rev = prefs.revenu_garant or 0
        g_proprio = getattr(prefs, "garant_proprio", False)
        if g_proprio and g_rev >= 3000:
            score += 20
        elif g_rev >= 2000:
            score += 14
        else:
            score += 8
    else:
        score += 0

    # Endettement bonus (5 pts)
    if taux_endettement <= 30:
        score += 5
    elif taux_endettement <= 35:
        score += 2

    return min(score, 100)


@app.post("/api/analyze")
async def analyze_listing(
    request: AnalyzeRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    Analyse complète d'une annonce immobilière — v2 avec croisement de données.

    Workflow :
    1. Scraping de l'annonce
    2. Données marché (DVF, INSEE, loyers, transports, éducation)
    3. Croisements widgets (rendement dept, tendance, faisabilité, proximité)
    4. Simulation financière personnalisée
    5. Scoring pondéré v2 (7 critères)
    6. Analyse IA (texte ludique)
    """
    
    logger.info("=" * 80)
    logger.info("[>] ANALYSE D'ANNONCE v2")
    logger.info("=" * 80)
    logger.info(f"[>] URL : {request.url}")

    # ── Charger les préférences utilisateur si authentifié ──
    user_prefs = None
    user_prefs_dict = None
    if current_user:
        user_prefs = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
        if user_prefs:
            user_prefs_dict = {
                "prix_projet": user_prefs.prix_projet,
                "apport": user_prefs.apport,
                "duree_credit": user_prefs.duree_credit,
                "taux_interet": getattr(user_prefs, "taux_interet", 3.5) or 3.5,
                "statut": user_prefs.statut,
                "anciennete": user_prefs.anciennete,
                "revenu_mensuel": user_prefs.revenu_mensuel,
                "co_borrower": user_prefs.co_borrower,
                "revenu_co_borrower": user_prefs.revenu_co_borrower,
                "garant": user_prefs.garant,
                "revenu_garant": user_prefs.revenu_garant,
                "garant_proprio": getattr(user_prefs, "garant_proprio", False),
                "w5_rayon": getattr(user_prefs, "w5_rayon", 20),
                "w5_ville_domicile": getattr(user_prefs, "w5_ville_domicile", None),
                "w5_villes_relais": getattr(user_prefs, "w5_villes_relais", None),
            }
            logger.info(f"[OK] Préférences utilisateur chargées (user_id={current_user.id})")
        else:
            logger.info("[i] Utilisateur authentifié mais pas de préférences")
    else:
        logger.info("[i] Utilisateur non authentifié — analyse sans personnalisation")

    try:
        # ===== ÉTAPE A : SCRAPING =====
        logger.info("\n[>] ÉTAPE A : Scraping de l'annonce...")

        scraped_data = scrape_ad(request.url)

        if not scraped_data["success"]:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Échec du scraping",
                    "message": scraped_data.get("error", "Impossible d'extraire les données de l'annonce"),
                    "scraped_data": scraped_data
                }
            )

        logger.info(f"[OK] Scraping réussi : {scraped_data['prix']:,.0f}€, {scraped_data['surface']}m²")
        
        # ===== ÉTAPE B : WIDGETS DATA =====
        logger.info("\n[>] ÉTAPE B : Récupération des données du marché local...")
        
        data_store = get_data_store()
        
        code_postal = scraped_data["code_postal"]
        departement = code_postal[:2] if code_postal else None
        
        widgets_data = {
            "code_postal": code_postal,
            "departement": departement,
            "dvf_stats": None,
            "insee_stats": None,
            "loyers_stats": None,
            "transport_stats": None,
            "student_stats": None,
            "demography_stats": None
        }
        
        # B.1 - Statistiques DVF (historique des prix)
        if data_store.dvf_2024 is not None and code_postal:
            try:
                df_dvf = data_store.dvf_2024
                
                # Filtrer par département
                dvf_dept = df_dvf[df_dvf["Code departement"] == departement]
                
                if not dvf_dept.empty:
                    widgets_data["dvf_stats"] = {
                        "prix_m2_median": float(dvf_dept["prix_m2"].median()),
                        "prix_m2_mean": float(dvf_dept["prix_m2"].mean()),
                        "prix_m2_min": float(dvf_dept["prix_m2"].min()),
                        "prix_m2_max": float(dvf_dept["prix_m2"].max()),
                        "nb_ventes": int(len(dvf_dept)),
                        "comparaison": {
                            "prix_m2_annonce": scraped_data["prix"] / scraped_data["surface"],
                            "ecart_vs_median_pct": (
                                ((scraped_data["prix"] / scraped_data["surface"]) / float(dvf_dept["prix_m2"].median()) - 1) * 100
                            )
                        }
                    }
                    logger.info(f"[OK] Stats DVF : {dvf_dept['prix_m2'].median():.0f}€/m² médian")
                else:
                    logger.warning(f"[!] Aucune donnée DVF pour le département {departement}")
            except Exception as e:
                logger.error(f"[ERROR] Erreur stats DVF : {e}")
        
        # B.2 - Statistiques INSEE (tension locative, vacance)
        if data_store.insee is not None and departement:
            try:
                insee_dept = data_store.insee[data_store.insee["Code departement"] == departement]
                
                if not insee_dept.empty:
                    # Prendre la première ligne (agrégation départementale)
                    row = insee_dept.iloc[0]
                    
                    widgets_data["insee_stats"] = {
                        "tension_locative": row.get("tension_locative"),
                        "taux_vacance": float(row.get("taux_vacance")) if "taux_vacance" in row else None,
                        "part_locataires": float(row.get("part_locataires")) if "part_locataires" in row else None,
                    }
                    logger.info(f"[OK] Stats INSEE : Tension {row.get('tension_locative', 'N/A')}")
                else:
                    logger.warning(f"[!] Aucune donnée INSEE pour le département {departement}")
            except Exception as e:
                logger.error(f"[ERROR] Erreur stats INSEE : {e}")
        
        # B.2.1 - Statistiques Démographiques (INSEE enrichies)
        if data_store.insee is not None and code_postal:
            try:
                # Essayer de trouver la commune par code postal
                # Le code commune INSEE peut correspondre au code postal pour certaines villes
                insee_commune = data_store.insee[
                    data_store.insee["code_commune"].str.startswith(code_postal[:5]) if "code_commune" in data_store.insee.columns else False
                ]
                
                if not insee_commune.empty:
                    row = insee_commune.iloc[0]
                    
                    # Calculer les indicateurs démographiques
                    demography = {}
                    
                    # % de vacance locative (P21_LOGVAC / P21_LOG)
                    if "P21_LOGVAC" in row and "P21_LOG" in row:
                        logements_total = row.get("P21_LOG", 0)
                        logements_vacants = row.get("P21_LOGVAC", 0)
                        if logements_total > 0:
                            demography["pct_vacance_locative"] = round((logements_vacants / logements_total) * 100, 2)
                        else:
                            demography["pct_vacance_locative"] = None
                    
                    # % de locataires (P21_RP_LOC / P21_RP)
                    if "P21_RP_LOC" in row and "P21_RP":
                        residences_principales = row.get("P21_RP", 0)
                        locataires = row.get("P21_RP_LOC", 0)
                        if residences_principales > 0:
                            demography["pct_locataires"] = round((locataires / residences_principales) * 100, 2)
                        else:
                            demography["pct_locataires"] = None
                    
                    # Ajouter d'autres indicateurs disponibles
                    demography["logements_total"] = int(row.get("P21_LOG", 0)) if "P21_LOG" in row else None
                    demography["logements_vacants"] = int(row.get("P21_LOGVAC", 0)) if "P21_LOGVAC" in row else None
                    demography["residences_principales"] = int(row.get("P21_RP", 0)) if "P21_RP" in row else None
                    demography["locataires"] = int(row.get("P21_RP_LOC", 0)) if "P21_RP_LOC" in row else None
                    
                    widgets_data["demography_stats"] = demography
                    logger.info(f"[OK] Stats Démographie : {len(demography)} indicateurs")
                else:
                    logger.info(f"[i] Aucune donnée démographique pour {code_postal}")
            except Exception as e:
                logger.error(f"[ERROR] Erreur stats démographie : {e}")
        
        # B.3 - Statistiques Loyers (estimation loyer de marché)
        if data_store.loyers is not None and departement:
            try:
                loyers_dept = data_store.loyers[data_store.loyers["Code departement"] == departement]
                
                if not loyers_dept.empty:
                    widgets_data["loyers_stats"] = {
                        "loyer_m2_median": float(loyers_dept["loyer_m2"].median()),
                        "loyer_m2_mean": float(loyers_dept["loyer_m2"].mean()),
                        "loyer_mensuel_estime": float(loyers_dept["loyer_m2"].median()) * scraped_data["surface"],
                        "rendement_brut_estime": (
                            (float(loyers_dept["loyer_m2"].median()) * scraped_data["surface"] * 12 / scraped_data["prix"]) * 100
                        )
                    }
                    logger.info(f"[OK] Stats Loyers : {loyers_dept['loyer_m2'].median():.2f}€/m²")
                else:
                    logger.warning(f"[!] Aucune donnée loyers pour le département {departement}")
            except Exception as e:
                logger.error(f"[ERROR] Erreur stats loyers : {e}")
        
        # B.4 - Statistiques Transport (Gares SNCF)
        if data_store.gares is not None and scraped_data.get("ville"):
            try:
                ville = scraped_data["ville"]
                
                # Chercher les gares dans la commune (ou proche)
                # Les gares ont souvent "commune" ou "nom_gare" qui contient le nom de la ville
                gares_commune = data_store.gares[
                    data_store.gares["commune"].str.contains(ville, case=False, na=False)
                    if "commune" in data_store.gares.columns else False
                ]
                
                # Fallback : chercher dans le nom de la gare
                if gares_commune.empty and "nom_gare" in data_store.gares.columns:
                    gares_commune = data_store.gares[
                        data_store.gares["nom_gare"].str.contains(ville, case=False, na=False)
                    ]
                
                if not gares_commune.empty:
                    # Extraire les noms de gares (max 5)
                    noms_gares = []
                    if "nom_gare" in gares_commune.columns:
                        noms_gares = gares_commune["nom_gare"].head(5).tolist()
                    
                    widgets_data["transport_stats"] = {
                        "nb_gares": int(len(gares_commune)),
                        "noms_gares": noms_gares
                    }
                    logger.info(f"[OK] Stats Transport : {len(gares_commune)} gare(s) trouvée(s)")
                else:
                    # Pas de gare trouvée
                    widgets_data["transport_stats"] = {
                        "nb_gares": 0,
                        "noms_gares": []
                    }
                    logger.info(f"[i] Aucune gare trouvée pour {ville}")
            except Exception as e:
                logger.error(f"[ERROR] Erreur stats transport : {e}")
                widgets_data["transport_stats"] = {
                    "nb_gares": 0,
                    "noms_gares": []
                }
        else:
            # Données non disponibles
            widgets_data["transport_stats"] = {
                "nb_gares": 0,
                "noms_gares": []
            }
        
        # B.5 - Statistiques Éducation (Enseignement Supérieur)
        if data_store.enseignement_sup is not None and scraped_data.get("ville"):
            try:
                ville = scraped_data["ville"]
                
                # Chercher les établissements dans la commune
                etablissements_commune = data_store.enseignement_sup[
                    data_store.enseignement_sup["ville"].str.contains(ville, case=False, na=False)
                    if "ville" in data_store.enseignement_sup.columns else False
                ]
                
                if not etablissements_commune.empty:
                    # Extraire les noms d'établissements (max 5)
                    top_etablissements = []
                    if "nom" in etablissements_commune.columns:
                        top_etablissements = etablissements_commune["nom"].head(5).tolist()
                    elif "libelle" in etablissements_commune.columns:
                        top_etablissements = etablissements_commune["libelle"].head(5).tolist()
                    
                    widgets_data["student_stats"] = {
                        "nb_etablissements": int(len(etablissements_commune)),
                        "top_etablissements": top_etablissements
                    }
                    logger.info(f"[OK] Stats Éducation : {len(etablissements_commune)} établissement(s) trouvé(s)")
                else:
                    # Pas d'établissement trouvé
                    widgets_data["student_stats"] = {
                        "nb_etablissements": 0,
                        "top_etablissements": []
                    }
                    logger.info(f"[i] Aucun établissement d'enseignement supérieur trouvé pour {ville}")
            except Exception as e:
                logger.error(f"[ERROR] Erreur stats éducation : {e}")
                widgets_data["student_stats"] = {
                    "nb_etablissements": 0,
                    "top_etablissements": []
                }
        else:
            # Données non disponibles
            widgets_data["student_stats"] = {
                "nb_etablissements": 0,
                "top_etablissements": []
            }
        
        # ===== ÉTAPE B-BIS : CROISEMENTS WIDGETS =====
        logger.info("\n[>] ÉTAPE B-BIS : Croisements widgets enrichis...")

        cross_data = {
            "rendement_dept": None,
            "tendance_prix": None,
            "score_faisabilite": None,
            "distance_domicile_km": None,
            "distances_relais": [],
        }

        # B.6 - Rendement du département
        if data_store.dvf_2024 is not None and data_store.loyers is not None and departement:
            try:
                dvf_dept = data_store.dvf_2024[data_store.dvf_2024["Code departement"] == departement]
                loyers_dept = data_store.loyers[data_store.loyers["Code departement"] == departement]
                if not dvf_dept.empty and not loyers_dept.empty:
                    prix_m2_dept = float(dvf_dept["prix_m2"].median())
                    loyer_m2_dept = float(loyers_dept["loyer_m2"].median())
                    rendement_dept = (loyer_m2_dept * 12 / prix_m2_dept) * 100 if prix_m2_dept > 0 else 0

                    # Classement parmi tous les départements
                    all_depts = data_store.dvf_2024.groupby("Code departement")["prix_m2"].median()
                    all_loyers = data_store.loyers.groupby("Code departement")["loyer_m2"].median()
                    rendements = ((all_loyers * 12) / all_depts * 100).dropna().sort_values(ascending=False)
                    rang = int((rendements.index.get_loc(departement) + 1)) if departement in rendements.index else None

                    cross_data["rendement_dept"] = {
                        "rendement_brut_pct": round(rendement_dept, 2),
                        "rang_national": rang,
                        "total_departements": len(rendements),
                    }
                    logger.info(f"[OK] Rendement département {departement} : {rendement_dept:.2f}% (rang {rang})")
            except Exception as e:
                logger.error(f"[ERROR] Rendement département : {e}")

        # B.7 - Tendance prix DVF (évolution 5 ans)
        if data_store.dvf_2020_2024 is not None and departement:
            try:
                dvf_hist = data_store.dvf_2020_2024
                dvf_hist_dept = dvf_hist[dvf_hist["Code departement"] == departement]
                if not dvf_hist_dept.empty and "annee_mutation" in dvf_hist_dept.columns:
                    prix_par_annee = dvf_hist_dept.groupby("annee_mutation")["prix_m2"].median()
                    if len(prix_par_annee) >= 2:
                        annee_min = prix_par_annee.index.min()
                        annee_max = prix_par_annee.index.max()
                        prix_debut = float(prix_par_annee.iloc[0])
                        prix_fin = float(prix_par_annee.iloc[-1])
                        evolution_pct = ((prix_fin - prix_debut) / prix_debut) * 100 if prix_debut > 0 else 0
                        if evolution_pct > 3:
                            tendance = "hausse"
                        elif evolution_pct < -3:
                            tendance = "baisse"
                        else:
                            tendance = "stable"
                        cross_data["tendance_prix"] = {
                            "evolution_pct": round(evolution_pct, 1),
                            "tendance": tendance,
                            "prix_m2_debut": round(prix_debut, 0),
                            "prix_m2_fin": round(prix_fin, 0),
                            "annee_debut": int(annee_min),
                            "annee_fin": int(annee_max),
                        }
                        logger.info(f"[OK] Tendance prix dép. {departement} : {tendance} ({evolution_pct:+.1f}%)")
            except Exception as e:
                logger.error(f"[ERROR] Tendance prix : {e}")

        # B.8 - Score faisabilité (si user authentifié)
        if user_prefs and scraped_data.get("prix"):
            try:
                sf = _calculer_score_faisabilite(scraped_data["prix"], user_prefs)
                cross_data["score_faisabilite"] = round(sf, 1)
                logger.info(f"[OK] Score faisabilité : {sf:.1f}/100")
            except Exception as e:
                logger.error(f"[ERROR] Score faisabilité : {e}")

        # B.9 - Distance domicile et villes relais
        if user_prefs and user_prefs_dict.get("w5_ville_domicile"):
            try:
                ville_dom_raw = user_prefs_dict["w5_ville_domicile"]
                if isinstance(ville_dom_raw, str):
                    ville_dom = json.loads(ville_dom_raw)
                else:
                    ville_dom = ville_dom_raw

                # Chercher les coordonnées de la commune du bien dans DVF
                bien_lat, bien_lon = None, None
                if data_store.dvf_2024 is not None and code_postal:
                    dvf_cp = data_store.dvf_2024[data_store.dvf_2024["Code postal"].astype(str) == code_postal] if "Code postal" in data_store.dvf_2024.columns else pd.DataFrame()
                    if not dvf_cp.empty:
                        for lat_col in ["latitude", "lat", "Latitude"]:
                            if lat_col in dvf_cp.columns:
                                bien_lat = float(dvf_cp[lat_col].dropna().median())
                                break
                        for lon_col in ["longitude", "lon", "Longitude"]:
                            if lon_col in dvf_cp.columns:
                                bien_lon = float(dvf_cp[lon_col].dropna().median())
                                break

                if bien_lat and bien_lon and ville_dom.get("lat") and ville_dom.get("lon"):
                    dist = _haversine_km(ville_dom["lat"], ville_dom["lon"], bien_lat, bien_lon)
                    cross_data["distance_domicile_km"] = round(dist, 1)
                    logger.info(f"[OK] Distance domicile : {dist:.1f} km")

                    # Distances villes relais
                    villes_relais_raw = user_prefs_dict.get("w5_villes_relais")
                    if villes_relais_raw:
                        if isinstance(villes_relais_raw, str):
                            villes_relais = json.loads(villes_relais_raw)
                        else:
                            villes_relais = villes_relais_raw
                        for vr in (villes_relais or []):
                            if vr.get("lat") and vr.get("lon"):
                                d = _haversine_km(vr["lat"], vr["lon"], bien_lat, bien_lon)
                                cross_data["distances_relais"].append({
                                    "nom": vr.get("nom", ""),
                                    "distance_km": round(d, 1),
                                })
            except Exception as e:
                logger.error(f"[ERROR] Distance domicile : {e}")

        widgets_data["cross_data"] = cross_data

        # ===== ÉTAPE C : SIMULATION FINANCIÈRE =====
        logger.info("\n[>] ÉTAPE C : Simulation financière personnalisée...")

        # Construire la requête avec les préférences user si disponibles
        sim_kwargs = {
            "prix": scraped_data["prix"],
            "surface": scraped_data["surface"],
            "code_postal": code_postal,
            "nb_pieces": scraped_data.get("nb_pieces", 2),
            # Pas de travaux par défaut pour une analyse d'annonce
            # (le bien est en vente tel quel, on ne suppose pas de rénovation)
            "travaux": 0,
            # État rénové par défaut (frais notaire 7.5% au lieu de 8%, pas de travaux)
            "etat_bien": "rénové",
        }
        if user_prefs_dict:
            sim_kwargs["apport"] = user_prefs_dict.get("apport")
            sim_kwargs["duree_credit"] = user_prefs_dict.get("duree_credit", 20)
            sim_kwargs["taux_interet"] = user_prefs_dict.get("taux_interet", 3.5)

        simulation_request = SimulationRequest(**sim_kwargs)

        financial_result = simuler_investissement(
            request=simulation_request,
            loyers_df=data_store.loyers
        )

        logger.info(f"[OK] Simulation terminée : Score legacy {financial_result.score_investissement:.1f}/100")

        # ===== ÉTAPE C-BIS : SCORING V2 =====
        logger.info("\n[>] ÉTAPE C-BIS : Scoring pondéré v2...")

        ecart_pct = None
        if widgets_data.get("dvf_stats") and widgets_data["dvf_stats"].get("comparaison"):
            ecart_pct = widgets_data["dvf_stats"]["comparaison"].get("ecart_vs_median_pct")

        taux_vac = None
        if widgets_data.get("insee_stats") and widgets_data["insee_stats"].get("taux_vacance") is not None:
            taux_vac = widgets_data["insee_stats"]["taux_vacance"]

        tendance_pct = None
        if cross_data.get("tendance_prix"):
            tendance_pct = cross_data["tendance_prix"]["evolution_pct"]

        nb_gares = widgets_data.get("transport_stats", {}).get("nb_gares")
        nb_etab = widgets_data.get("student_stats", {}).get("nb_etablissements")

        score_v2, verdict_v2, score_details = calculer_score_investissement_v2(
            rentabilite_nette=financial_result.rentabilite_nette,
            cashflow_mensuel_net=financial_result.cashflow_mensuel_net,
            ecart_prix_vs_median_pct=ecart_pct,
            taux_vacance=taux_vac,
            score_faisabilite=cross_data.get("score_faisabilite"),
            distance_domicile_km=cross_data.get("distance_domicile_km"),
            tendance_prix_pct=tendance_pct,
            nb_gares=nb_gares,
            nb_etablissements_sup=nb_etab,
        )

        logger.info(f"[OK] Score v2 : {score_v2}/100 — {verdict_v2}")

        # ===== ÉTAPE D : ANALYSE IA =====
        logger.info("\n[>] ÉTAPE D : Analyse IA avec OpenAI...")

        financial_data_for_ai = {
            "cout_total_projet": financial_result.cout_total_projet,
            "frais_notaire": financial_result.frais_notaire,
            "montant_emprunt": financial_result.montant_emprunt,
            "mensualite_totale": financial_result.mensualite_totale,
            "loyer_mensuel_brut": financial_result.loyer_mensuel_brut,
            "rentabilite_brute": financial_result.rentabilite_brute,
            "rentabilite_nette": financial_result.rentabilite_nette,
            "cashflow_mensuel_net": financial_result.cashflow_mensuel_net,
            "autofinancement": financial_result.autofinancement,
        }

        ai_analysis = await analyze_with_ai(
            scraped_data=scraped_data,
            market_data=widgets_data,
            financial_data=financial_data_for_ai,
            user_preferences=user_prefs_dict,
            score_v2=score_v2,
            verdict_v2=verdict_v2,
            score_details=score_details,
            cross_data=cross_data,
        )

        logger.info(f"[OK] Analyse IA terminée")

        # ===== RÉPONSE COMPLÈTE =====
        logger.info("=" * 80)
        logger.info("[OK] ANALYSE v2 COMPLÈTE")
        logger.info("=" * 80)

        # ===== SAUVEGARDE EN HISTORIQUE =====
        if current_user:
            try:
                ville = scraped_data.get("ville", "Bien")
                prix = scraped_data.get("prix", 0)
                sim = UserSimulation(
                    user_id=current_user.id,
                    name=f"{ville} — {prix:,.0f}€ — {score_v2:.0f}/100",
                    widget_type="analyse_ia",
                    input_data={
                        "url": request.url,
                        "scraped_data": scraped_data,
                    },
                    result_data={
                        "score_v2": score_v2,
                        "verdict_v2": verdict_v2,
                        "score_details": score_details,
                        "cross_data": cross_data,
                        "financial_result": {
                            "prix_achat": financial_result.prix_achat,
                            "surface": financial_result.surface,
                            "prix_m2": financial_result.prix_m2,
                            "code_postal": financial_result.code_postal,
                            "departement": financial_result.departement,
                            "frais_notaire": financial_result.frais_notaire,
                            "cout_total_projet": financial_result.cout_total_projet,
                            "apport": financial_result.apport,
                            "montant_emprunt": financial_result.montant_emprunt,
                            "mensualite_totale": financial_result.mensualite_totale,
                            "loyer_mensuel_brut": financial_result.loyer_mensuel_brut,
                            "loyer_annuel_brut": financial_result.loyer_annuel_brut,
                            "charges_totales_mensuel": financial_result.charges_totales_mensuel,
                            "charges_totales_annuel": financial_result.charges_totales_annuel,
                            "rentabilite_brute": financial_result.rentabilite_brute,
                            "rentabilite_nette": financial_result.rentabilite_nette,
                            "rentabilite_nette_nette": financial_result.rentabilite_nette_nette,
                            "cashflow_mensuel_brut": financial_result.cashflow_mensuel_brut,
                            "cashflow_mensuel_net": financial_result.cashflow_mensuel_net,
                            "cashflow_annuel_net": financial_result.cashflow_annuel_net,
                            "autofinancement": financial_result.autofinancement,
                            "effort_epargne_mensuel": financial_result.effort_epargne_mensuel,
                            "score_investissement": financial_result.score_investissement,
                            "verdict": financial_result.verdict,
                        },
                        "widgets_data": {
                            "dvf_stats": widgets_data.get("dvf_stats"),
                            "insee_stats": widgets_data.get("insee_stats"),
                            "loyers_stats": widgets_data.get("loyers_stats"),
                            "transport_stats": widgets_data.get("transport_stats"),
                            "student_stats": widgets_data.get("student_stats"),
                        },
                        "ai_analysis": ai_analysis,
                    },
                )
                db.add(sim)
                db.commit()
                logger.info(f"[OK] Analyse sauvegardée (id={sim.id})")
            except Exception as e:
                logger.error(f"[ERROR] Sauvegarde analyse : {e}")
                db.rollback()

        return {
            "success": True,
            "scraped_data": scraped_data,
            "widgets_data": widgets_data,
            "financial_result": financial_result,
            "ai_analysis": ai_analysis,
            "score_v2": score_v2,
            "verdict_v2": verdict_v2,
            "score_details": score_details,
            "cross_data": cross_data,
            "user_profile": {
                "authenticated": current_user is not None,
                "prenom": current_user.first_name if current_user else None,
                "statut": user_prefs_dict.get("statut") if user_prefs_dict else None,
                "ville_domicile": user_prefs_dict.get("w5_ville_domicile") if user_prefs_dict else None,
            },
            "summary": {
                "url": request.url,
                "prix": scraped_data["prix"],
                "surface": scraped_data["surface"],
                "localisation": f"{scraped_data.get('ville', 'N/A')} ({code_postal})",
                "score": score_v2,
                "verdict": verdict_v2,
                "cashflow_mensuel": financial_result.cashflow_mensuel_net,
                "rentabilite_nette": financial_result.rentabilite_nette,
                "autofinancement": financial_result.autofinancement,
            }
        }
        
    except HTTPException:
        raise  # Relancer les HTTPException telles quelles
    
    except Exception as e:
        logger.error(f"[ERROR] Erreur lors de l'analyse : {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Erreur lors de l'analyse",
                "message": str(e)
            }
        )


# ============================================================================
# ENDPOINT : Historique des analyses
# ============================================================================

@app.get("/api/analyses/history")
async def get_analysis_history(
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Retourne l'historique des analyses IA de l'utilisateur connecté."""
    if not current_user:
        return []

    analyses = (
        db.query(UserSimulation)
        .filter(
            UserSimulation.user_id == current_user.id,
            UserSimulation.widget_type == "analyse_ia",
        )
        .order_by(UserSimulation.created_at.desc())
        .limit(20)
        .all()
    )

    return [
        {
            "id": a.id,
            "name": a.name,
            "url": a.input_data.get("url") if a.input_data else None,
            "scraped_data": a.input_data.get("scraped_data") if a.input_data else None,
            "score_v2": a.result_data.get("score_v2") if a.result_data else None,
            "verdict_v2": a.result_data.get("verdict_v2") if a.result_data else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in analyses
    ]


@app.get("/api/analyses/{analysis_id}")
async def get_analysis_detail(
    analysis_id: int,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Retourne le détail complet d'une analyse sauvegardée."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Non authentifié")

    analysis = (
        db.query(UserSimulation)
        .filter(
            UserSimulation.id == analysis_id,
            UserSimulation.user_id == current_user.id,
            UserSimulation.widget_type == "analyse_ia",
        )
        .first()
    )

    if not analysis:
        raise HTTPException(status_code=404, detail="Analyse non trouvée")

    return {
        "success": True,
        "scraped_data": analysis.input_data.get("scraped_data") if analysis.input_data else {},
        "widgets_data": analysis.result_data.get("widgets_data", {}) if analysis.result_data else {},
        "financial_result": analysis.result_data.get("financial_result", {}) if analysis.result_data else {},
        "ai_analysis": analysis.result_data.get("ai_analysis", {}) if analysis.result_data else {},
        "score_v2": analysis.result_data.get("score_v2", 0) if analysis.result_data else 0,
        "verdict_v2": analysis.result_data.get("verdict_v2", "") if analysis.result_data else "",
        "score_details": analysis.result_data.get("score_details", {}) if analysis.result_data else {},
        "cross_data": analysis.result_data.get("cross_data", {}) if analysis.result_data else {},
        "user_profile": {"authenticated": True},
        "summary": {
            "url": analysis.input_data.get("url", "") if analysis.input_data else "",
            "prix": analysis.input_data.get("scraped_data", {}).get("prix", 0) if analysis.input_data else 0,
            "surface": analysis.input_data.get("scraped_data", {}).get("surface", 0) if analysis.input_data else 0,
            "localisation": analysis.input_data.get("scraped_data", {}).get("ville", "") if analysis.input_data else "",
            "score": analysis.result_data.get("score_v2", 0) if analysis.result_data else 0,
            "verdict": analysis.result_data.get("verdict_v2", "") if analysis.result_data else "",
        },
    }


# ============================================================================
# ENDPOINT : Autocomplétion des communes
# ============================================================================

@app.get("/api/communes/search", summary="Recherche de communes pour autocomplétion")
async def search_communes(q: str = Query(..., min_length=2, description="Terme de recherche")):
    """
    Recherche de communes depuis les données DVF pour l'autocomplétion.

    Retourne une liste de communes avec leurs codes postaux et coordonnées.
    """
    try:
        data_store = get_data_store()

        if not data_store.is_ready() or data_store.dvf_2024 is None:
            raise HTTPException(status_code=503, detail="Données non disponibles")

        df = data_store.dvf_2024

        # Trouver le nom de la colonne code postal (peut varier)
        code_postal_col = None
        for col in ["Code postal", "code_postal", "Code_postal", "CP"]:
            if col in df.columns:
                code_postal_col = col
                break

        # Filtrer par nom de commune (insensible à la casse)
        results = []
        if "Commune" in df.columns:
            # Priorité aux communes qui commencent par le terme de recherche
            mask_starts = df["Commune"].str.lower().str.startswith(q.lower(), na=False)
            mask_contains = df["Commune"].str.contains(q, case=False, na=False)

            # Combiner: d'abord celles qui commencent par q, puis les autres
            df_starts = df[mask_starts]
            df_contains = df[mask_contains & ~mask_starts]

            seen = set()  # (commune, code_postal) pour éviter doublons

            # Géocodeur
            import pgeocode
            nomi = pgeocode.Nominatim('FR')

            for subset in [df_starts, df_contains]:
                if len(results) >= 15:
                    break

                # Grouper par commune pour avoir un seul résultat par commune
                for commune in subset["Commune"].unique():
                    if len(results) >= 15:
                        break

                    commune_rows = subset[subset["Commune"] == commune]
                    if commune_rows.empty:
                        continue

                    # Prendre le code postal le plus fréquent pour cette commune
                    if code_postal_col:
                        code_postal = commune_rows[code_postal_col].mode()
                        code_postal = str(int(code_postal.iloc[0])) if len(code_postal) > 0 and pd.notna(code_postal.iloc[0]) else None
                        # Formater le code postal (ajouter un 0 devant si nécessaire)
                        if code_postal and len(code_postal) == 4:
                            code_postal = "0" + code_postal
                    else:
                        code_postal = None

                    key = (commune, code_postal)
                    if key in seen:
                        continue
                    seen.add(key)

                    # Obtenir les coordonnées via pgeocode
                    lat, lon = None, None
                    if code_postal:
                        try:
                            location = nomi.query_postal_code(code_postal)
                            if not pd.isna(location.latitude) and not pd.isna(location.longitude):
                                lat = float(location.latitude)
                                lon = float(location.longitude)
                        except:
                            pass

                    results.append({
                        "nom": commune,
                        "code_postal": code_postal,
                        "lat": lat,
                        "lon": lon
                    })

        return {"communes": results}

    except Exception as e:
        logger.error(f"Erreur recherche communes: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINT : Communes dans rayon autour de villes
# ============================================================================

@app.get("/api/proximite/communes", summary="Communes dans rayon autour de villes avec accessibilité budget")
async def get_communes_proximite(
    villes: str = Query(..., description="Liste de villes séparées par virgule (nom:code_postal)"),
    rayon_km: float = Query(20.0, description="Rayon de recherche en km"),
    budget_max: float = Query(..., description="Budget maximum pour calculer l'accessibilité"),
    type_bien: Optional[str] = Query(None, description="Type de bien (Tous, Appartement, Maison)")
):
    """
    Retourne toutes les communes dans un rayon autour de plusieurs villes,
    avec leur niveau d'accessibilité selon le budget.
    """
    try:
        data_store = get_data_store()
        
        if not data_store.is_ready():
            raise HTTPException(status_code=503, detail="Données non disponibles")
        
        # Parser les villes (format: "nom:code_postal" ou juste "nom")
        villes_list = []
        for ville_str in villes.split(','):
            ville_str = ville_str.strip()
            if ':' in ville_str:
                nom, code_postal = ville_str.split(':', 1)
                villes_list.append({"nom": nom.strip(), "code_postal": code_postal.strip()})
            else:
                villes_list.append({"nom": ville_str, "code_postal": None})
        
        # Géocoder chaque ville pour obtenir ses coordonnées
        import pgeocode
        nomi = pgeocode.Nominatim('FR')
        
        villes_coords = []
        for ville in villes_list:
            if ville["code_postal"]:
                location = nomi.query_postal_code(ville["code_postal"])
                if not pd.isna(location.latitude) and not pd.isna(location.longitude):
                    villes_coords.append({
                        "nom": ville["nom"],
                        "code_postal": ville["code_postal"],
                        "lat": float(location.latitude),
                        "lon": float(location.longitude)
                    })
            else:
                # Si pas de code postal, chercher dans DVF
                df = data_store.dvf_2024
                if "Commune" in df.columns:
                    commune_data = df[df["Commune"].str.contains(ville["nom"], case=False, na=False)]
                    if not commune_data.empty:
                        first_row = commune_data.iloc[0]
                        code_postal = first_row.get("Code postal", None)
                        if code_postal:
                            location = nomi.query_postal_code(str(code_postal))
                            if not pd.isna(location.latitude) and not pd.isna(location.longitude):
                                villes_coords.append({
                                    "nom": ville["nom"],
                                    "code_postal": str(code_postal),
                                    "lat": float(location.latitude),
                                    "lon": float(location.longitude)
                                })
        
        if not villes_coords:
            return {"communes": []}
        
        # Utiliser le cache pré-calculé des zones pour obtenir les données d'accessibilité
        from zones_precompute import get_zones_cache
        zones_cache = get_zones_cache()
        
        if not zones_cache.is_ready:
            # Fallback si cache non prêt
            logger.warning("Cache zones non prêt, utilisation fallback")
            return {"communes": []}
        
        # Récupérer toutes les zones pour le budget
        all_zones = zones_cache.get_zones_for_budget(
            budget_max=budget_max,
            type_bien=type_bien or "Tous",
            departement=None,
            limit=None
        )
        
        # Filtrer les communes dans le rayon autour de chaque ville
        def haversine_km(lat1, lon1, lat2, lon2):
            import numpy as np
            R = 6371.0
            lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
            dlat, dlon = lat2 - lat1, lon2 - lon1
            a = np.sin(dlat/2)**2 + np.cos(lat1)*np.cos(lat2)*np.sin(dlon/2)**2
            return R * (2 * np.arcsin(np.sqrt(a)))
        
        communes_in_radius = {}
        
        for zone in all_zones:
            if not zone.get("lat") or not zone.get("lon"):
                continue
            
            zone_lat = zone["lat"]
            zone_lon = zone["lon"]
            
            # Vérifier si la commune est dans le rayon d'au moins une ville
            for ville_coord in villes_coords:
                distance = haversine_km(
                    ville_coord["lat"], ville_coord["lon"],
                    zone_lat, zone_lon
                )
                
                if distance <= rayon_km:
                    code_postal = zone.get("code_postal", "")
                    if code_postal not in communes_in_radius:
                        communes_in_radius[code_postal] = {
                            "code_postal": code_postal,
                            "commune": zone.get("commune", ""),
                            "lat": zone_lat,
                            "lon": zone_lon,
                            "pct_access": zone.get("pct_access", 0),
                            "prix_median": zone.get("prix_median"),
                            "nb_ventes": zone.get("nb_ventes", 0),
                            "distance_min": distance
                        }
                    else:
                        # Garder la distance minimale
                        if distance < communes_in_radius[code_postal]["distance_min"]:
                            communes_in_radius[code_postal]["distance_min"] = distance
        
        # Convertir en liste et trier par distance
        result = list(communes_in_radius.values())
        result.sort(key=lambda x: x["distance_min"])
        
        logger.info(f"✅ {len(result)} communes trouvées dans rayon {rayon_km}km autour de {len(villes_coords)} ville(s)")
        return {"communes": result, "villes_reference": villes_coords}
    
    except Exception as e:
        logger.error(f"Erreur get_communes_proximite: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINT : Données tension par commune pour un département
# ============================================================================

@app.get("/api/tension/communes", summary="Données de tension locative par commune pour un département")
async def get_tension_communes(
    departement: str = Query(..., description="Code département (ex: '69')")
):
    """
    Retourne les données de tension locative (taux de vacance) pour toutes les communes
    d'un département donné. Utilisé pour créer l'histogramme de distribution.
    """
    try:
        data_store = get_data_store()
        
        if not data_store.is_ready() or data_store.insee is None or data_store.insee.empty:
            raise HTTPException(status_code=503, detail="Données INSEE non disponibles")
        
        df_insee = data_store.insee.copy()
        
        # S'assurer que Code departement existe
        if "Code departement" not in df_insee.columns and "code_commune" in df_insee.columns:
            df_insee["Code departement"] = df_insee["code_commune"].astype(str).str[:2]
        
        # Filtrer par département
        df_dept = df_insee[df_insee["Code departement"] == departement].copy()
        
        if df_dept.empty:
            return {"communes": []}
        
        # Calculer le taux de vacance pour chaque commune
        df_dept["taux_vacance"] = (df_dept["P21_LOGVAC"] / df_dept["P21_LOG"]) * 100
        
        # Filtrer les valeurs aberrantes (entre 0 et 50%)
        df_dept = df_dept[df_dept["taux_vacance"].between(0, 50)].copy()
        
        # Préparer les résultats
        result = []
        for _, row in df_dept.iterrows():
            result.append({
                "code_commune": str(row.get("code_commune", "")),
                "taux_vacance": round(float(row["taux_vacance"]), 2),
                "logements_total": int(row.get("P21_LOG", 0)),
                "logements_vacants": int(row.get("P21_LOGVAC", 0)),
            })
        
        logger.info(f"✅ {len(result)} communes trouvées pour département {departement}")
        return {"communes": result}
    
    except Exception as e:
        logger.error(f"Erreur get_tension_communes: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# POINT D'ENTRÉE POUR DÉVELOPPEMENT
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "=" * 80)
    print("[*] LANCEMENT DU SERVEUR DE DEVELOPPEMENT")
    print("=" * 80)
    print("[>] API disponible sur : http://localhost:8000")
    print("[>] Documentation Swagger : http://localhost:8000/docs")
    print("[>] Documentation ReDoc : http://localhost:8000/redoc")
    print("=" * 80)
    print("\n[!] Utilisez Ctrl+C pour arreter le serveur\n")
    
    # Lancer le serveur avec rechargement automatique
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # Accessible depuis n'importe quelle interface réseau
        port=8000,
        reload=True,      # Rechargement automatique lors de modifications du code
        log_level="info"
    )
