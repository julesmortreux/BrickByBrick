"""
BrickByBrick - API Backend
FastAPI server pour la plateforme d'aide à l'investissement immobilier
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import logging
from datetime import datetime
import pandas as pd

from data_loader import load_data, get_data_store
from schemas import SimulationRequest, SimulationResponse
from schemas_market import (
    MarketDataResponse, ScopeFranceData, ScopeDepartementData, ScopeCityData,
    FaisabiliteRequest, FaisabiliteResponse, RendementRequisRequest, RendementRequisResponse
)
from finance import simuler_investissement
from scraper import scrape_ad
from ai_analyzer import analyze_with_ai
import widgets
from pydantic import BaseModel, Field
from typing import Optional

# Auth & Database
from database import init_db
from auth import router as auth_router

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


@app.post("/api/analyze")
async def analyze_listing(request: AnalyzeRequest):
    """
    Analyse complète d'une annonce immobilière
    
    ## Workflow
    
    1. **Scraping** : Extraction des données de l'annonce (prix, surface, localisation)
    2. **Widgets Data** : Récupération des données DVF et INSEE pour le code postal
    3. **Simulation** : Calcul automatique de la rentabilité et du cashflow
    
    ## Données retournées
    
    - **scraped_data** : Données extraites de l'annonce
    - **widgets_data** : Statistiques du marché local (DVF, INSEE)
    - **financial_result** : Simulation financière complète
    
    ## Exemple de requête
    
    ```json
    {
        "url": "https://www.seloger.com/annonces/achat/appartement/paris-11eme-75/..."
    }
    ```
    
    ## Prérequis
    
    - Clé ScraperAPI configurée dans .env
    - Données DVF et loyers chargées
    
    ## Temps de réponse
    
    ~30-90 secondes (scraping + analyse)
    """
    
    logger.info("=" * 80)
    logger.info("[>] ANALYSE D'ANNONCE")
    logger.info("=" * 80)
    logger.info(f"[>] URL : {request.url}")
    
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
        
        # ===== ÉTAPE C : SIMULATION FINANCIÈRE =====
        logger.info("\n[>] ÉTAPE C : Simulation financière automatique...")
        
        # Construire la requête de simulation à partir des données scrapées
        simulation_request = SimulationRequest(
            prix=scraped_data["prix"],
            surface=scraped_data["surface"],
            code_postal=code_postal,
            nb_pieces=scraped_data.get("nb_pieces", 2)  # Défaut 2 si non trouvé
        )
        
        # Lancer la simulation
        financial_result = simuler_investissement(
            request=simulation_request,
            loyers_df=data_store.loyers
        )

        logger.info(f"[OK] Simulation terminée : Score {financial_result.score_investissement:.1f}/100")

        # ===== ÉTAPE D : ANALYSE IA =====
        logger.info("\n[>] ÉTAPE D : Analyse IA avec OpenAI...")

        # Préparer les données financières pour l'IA
        financial_data_for_ai = {
            "cout_total_projet": financial_result.cout_total_projet,
            "frais_notaire": financial_result.frais_notaire,
            "montant_emprunt": financial_result.montant_emprunt,
            "mensualite_totale": financial_result.mensualite_totale,
            "loyer_mensuel_brut": financial_result.loyer_mensuel_brut,
            "rentabilite_brute": financial_result.rentabilite_brute,
            "rentabilite_nette": financial_result.rentabilite_nette,
            "cashflow_mensuel_net": financial_result.cashflow_mensuel_net,
            "autofinancement": financial_result.autofinancement
        }

        # Appeler l'analyse IA
        ai_analysis = await analyze_with_ai(
            scraped_data=scraped_data,
            market_data=widgets_data,
            financial_data=financial_data_for_ai,
            user_preferences=None  # TODO: récupérer depuis le profil utilisateur
        )

        logger.info(f"[OK] Analyse IA terminée : Score {ai_analysis.get('score', 'N/A')}/100 - {ai_analysis.get('verdict', 'N/A')}")

        # ===== RÉPONSE COMPLÈTE =====
        logger.info("=" * 80)
        logger.info("[OK] ANALYSE COMPLÈTE TERMINÉE")
        logger.info("=" * 80)

        return {
            "success": True,
            "scraped_data": scraped_data,
            "widgets_data": widgets_data,
            "financial_result": financial_result,
            "ai_analysis": ai_analysis,
            "summary": {
                "url": request.url,
                "prix": scraped_data["prix"],
                "surface": scraped_data["surface"],
                "localisation": f"{scraped_data.get('ville', 'N/A')} ({code_postal})",
                "score": ai_analysis.get("score", financial_result.score_investissement),
                "verdict": ai_analysis.get("verdict", financial_result.verdict),
                "cashflow_mensuel": financial_result.cashflow_mensuel_net,
                "rentabilite_nette": financial_result.rentabilite_nette,
                "autofinancement": financial_result.autofinancement
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
