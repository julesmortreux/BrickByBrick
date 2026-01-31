"""
Fonctions de calcul pour les 12 widgets de la Phase 1
Chaque fonction reproduit la logique du notebook BrickAI.ipynb
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Tuple
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)


# ============================================================================
# WIDGET 5 : TENSION LOCATIVE (Scope National)
# ============================================================================

def get_heatmap_tension(insee_df: pd.DataFrame) -> List[Dict]:
    """
    Calcule la tension locative par département pour la heatmap France.
    
    Formule: taux_vacance = (P21_LOGVAC / P21_LOG) * 100
    Tension: Forte (<6%), Moyenne (6-8%), Faible (>8%)
    
    Args:
        insee_df: DataFrame INSEE avec colonnes P21_LOG, P21_LOGVAC, code_commune
    
    Returns:
        Liste de dicts {departement, taux_vacance, tension, ...}
    """
    if insee_df is None or insee_df.empty:
        logger.warning("DataFrame INSEE vide")
        return []
    
    try:
        # S'assurer que Code departement existe
        if "Code departement" not in insee_df.columns:
            insee_df["Code departement"] = insee_df["code_commune"].str[:2]
        
        # Agrégation par département
        agg = insee_df.groupby("Code departement").agg({
            "P21_LOG": "sum",  # Total logements
            "P21_LOGVAC": "sum",  # Logements vacants
            "P21_RP": "sum",  # Résidences principales
            "P21_RP_LOC": "sum"  # Locataires
        }).reset_index()
        
        # Calcul des indicateurs
        agg["taux_vacance"] = (agg["P21_LOGVAC"] / agg["P21_LOG"]) * 100
        agg["part_locataires"] = (agg["P21_RP_LOC"] / agg["P21_RP"]) * 100
        
        # Catégorisation de la tension
        def categorize_tension(taux):
            if taux < 6:
                return "Forte"
            elif taux < 8:
                return "Moyenne"
            else:
                return "Faible"
        
        agg["tension"] = agg["taux_vacance"].apply(categorize_tension)
        
        # Conversion en liste de dicts
        result = []
        for _, row in agg.iterrows():
            result.append({
                "departement": str(row["Code departement"]),
                "taux_vacance": round(float(row["taux_vacance"]), 2),
                "tension": row["tension"],
                "part_locataires": round(float(row["part_locataires"]), 2) if pd.notna(row["part_locataires"]) else None,
                "logements_total": int(row["P21_LOG"])
            })
        
        logger.info(f"✅ Heatmap tension calculée : {len(result)} départements")
        return result
    
    except Exception as e:
        logger.error(f"Erreur get_heatmap_tension: {e}")
        return []


# ============================================================================
# WIDGET 7 : RENDEMENT BRUT PAR DÉPARTEMENT (Scope National)
# ============================================================================

def get_rendement_departements(dvf_df: pd.DataFrame, loyers_df: pd.DataFrame,
                                type_bien: str = "Tous", seuil_min: float = 0.0) -> List[Dict]:
    """
    Calcule le rendement brut par département.
    
    Formule: rendement_brut = (loyer_m2 * 12 / prix_m2) * 100
    
    Args:
        dvf_df: DataFrame DVF 2024
        loyers_df: DataFrame Loyers 2024
        type_bien: "Appartement", "Maison", ou "Tous"
        seuil_min: Rendement minimum pour filtrer
    
    Returns:
        Liste de dicts {departement, prix_m2, loyer_m2, rendement_brut_pct, ...}
    """
    if dvf_df is None or dvf_df.empty or loyers_df is None or loyers_df.empty:
        logger.warning("DataFrames DVF ou Loyers vides")
        return []
    
    try:
        # Filtrage par type de bien si nécessaire
        dvf_filtered = dvf_df.copy()
        if type_bien != "Tous":
            dvf_filtered = dvf_filtered[
                dvf_filtered["Type local"].str.contains(type_bien, case=False, na=False)
            ]
        
        # Calcul prix/m² par département (DVF)
        # NOTE: Dans les CSV nettoyés, la colonne `prix_m2` est déjà pré-calculée.
        # On la réutilise directement si elle existe pour éviter les erreurs de colonnes.
        if "prix_m2" not in dvf_filtered.columns:
            # Fallback : recalculer à partir de la surface si nécessaire
            surface_col = None
            if "surface_reelle_bati" in dvf_filtered.columns:
                surface_col = "surface_reelle_bati"
            elif "Surface reelle bati" in dvf_filtered.columns:
                # Harmoniser le nom de colonne si on vient directement du CSV
                surface_col = "Surface reelle bati"
            if surface_col is None:
                logger.warning("Aucune colonne de surface trouvée pour calculer prix_m2")
                return []
            dvf_filtered["prix_m2"] = dvf_filtered["Valeur fonciere"] / dvf_filtered[surface_col]

        dvf_filtered = dvf_filtered[
            (dvf_filtered["prix_m2"].notna()) &
            (dvf_filtered["prix_m2"] > 500) &  # Filtrer aberrations
            (dvf_filtered["prix_m2"] < 20000)
        ]
        
        prix_par_dept = dvf_filtered.groupby("Code departement").agg({
            "prix_m2": "median",
            "Valeur fonciere": "count"  # Nombre de ventes
        }).reset_index()
        prix_par_dept.columns = ["Code departement", "prix_m2_median", "nb_ventes"]
        
        # Calcul loyer/m² par département (Loyers)
        loyer_par_dept = loyers_df.groupby("Code departement").agg({
            "loyer_m2": "mean"
        }).reset_index()
        loyer_par_dept.columns = ["Code departement", "loyer_m2_moyen"]
        
        # Fusion
        merged = prix_par_dept.merge(loyer_par_dept, on="Code departement", how="inner")
        
        # Calcul du rendement brut
        merged["rendement_brut_pct"] = (merged["loyer_m2_moyen"] * 12 / merged["prix_m2_median"]) * 100
        
        # Filtrage par seuil
        merged = merged[merged["rendement_brut_pct"] >= seuil_min]
        
        # Tri par rendement décroissant
        merged = merged.sort_values("rendement_brut_pct", ascending=False)
        
        # Conversion en liste de dicts
        result = []
        for _, row in merged.iterrows():
            result.append({
                "departement": str(row["Code departement"]),
                "prix_m2_median": round(float(row["prix_m2_median"]), 2),
                "loyer_m2_moyen": round(float(row["loyer_m2_moyen"]), 2),
                "rendement_brut_pct": round(float(row["rendement_brut_pct"]), 2),
                "nb_ventes": int(row["nb_ventes"])
            })
        
        logger.info(f"✅ Rendements calculés : {len(result)} départements (seuil ≥ {seuil_min}%)")
        return result
    
    except Exception as e:
        logger.error(f"Erreur get_rendement_departements: {e}")
        return []


# ============================================================================
# WIDGET 4 : CARTE ZONES ACCESSIBLES (Scope National - si budget fourni)
# ============================================================================

def get_zones_budget_accessible(dvf_df: pd.DataFrame, budget_max: float, 
                                  nb_pieces: Optional[int] = None, type_bien: Optional[str] = None) -> List[Dict]:
    """
    Identifie les zones (codes postaux) où un certain % de biens est ≤ budget.
    Ajoute la géolocalisation via pgeocode.
    
    NOTE: Cette fonction est un FALLBACK. Utilisez zones_precompute.get_zones_cache()
    pour des performances optimales (cache pré-calculé au démarrage).
    
    Args:
        dvf_df: DataFrame DVF 2024
        budget_max: Budget maximum (€)
        nb_pieces: Nombre de pièces (optionnel)
        type_bien: Type de bien ("Appartement", "Maison", ou None pour "Tous")
        use_cache: Obsolète, ignoré (le cache est géré par zones_precompute)
        data_store: Obsolète, ignoré
    
    Returns:
        Liste de dicts {code_postal, pct_access, prix_median, nb_ventes, lat, lon, commune, ...}
    """
    if dvf_df is None or dvf_df.empty:
        logger.warning("DataFrame DVF vide")
        return []
    
    try:
        # Filtrage par nombre de pièces si fourni
        dvf_filtered = dvf_df.copy()
        if nb_pieces:
            dvf_filtered = dvf_filtered[dvf_filtered["Nombre pieces principales"] == nb_pieces]
        
        # Filtrage par type de bien si fourni
        if type_bien and type_bien != "Tous":
            if "Type local" in dvf_filtered.columns:
                dvf_filtered = dvf_filtered[
                    dvf_filtered["Type local"].str.contains(type_bien, case=False, na=False)
                ]
        
        # Agrégation par code postal et commune
        grouped = dvf_filtered.groupby(["Code postal", "Commune"]).agg({
            "Valeur fonciere": ["median", "count", lambda x: (x <= budget_max).sum()]
        }).reset_index()
        
        grouped.columns = ["code_postal", "commune", "prix_median", "nb_ventes", "nb_access"]
        
        # Calcul du % accessible
        grouped["pct_access"] = (grouped["nb_access"] / grouped["nb_ventes"]) * 100
        
        # Filtrer les codes postaux avec au moins 5 ventes
        grouped = grouped[grouped["nb_ventes"] >= 5]
        
        # Tri par % accessible décroissant
        grouped = grouped.sort_values("pct_access", ascending=False)
        
        # Limiter à 500 codes postaux max pour performance
        grouped = grouped.head(500)
        
        # Géolocalisation via pgeocode
        try:
            import pgeocode
            nomi = pgeocode.Nominatim('FR')
        except ImportError:
            logger.warning("pgeocode non disponible, coordonnées non ajoutées")
            nomi = None
        
        # Conversion en liste de dicts avec géolocalisation
        result = []
        for _, row in grouped.iterrows():
            code_postal = str(row["code_postal"]).zfill(5)  # S'assurer que c'est un code postal à 5 chiffres
            
            zone_dict = {
                "code_postal": code_postal,
                "commune": str(row["commune"]) if pd.notna(row["commune"]) else None,
                "pct_access": round(float(row["pct_access"]), 1),
                "prix_median": round(float(row["prix_median"]), 0),
                "nb_ventes": int(row["nb_ventes"])
            }
            
            # Ajouter les coordonnées si pgeocode est disponible
            if nomi is not None:
                try:
                    location = nomi.query_postal_code(code_postal)
                    if pd.notna(location.latitude) and pd.notna(location.longitude):
                        zone_dict["lat"] = float(location.latitude)
                        zone_dict["lon"] = float(location.longitude)
                    else:
                        zone_dict["lat"] = None
                        zone_dict["lon"] = None
                except Exception as e:
                    logger.debug(f"Erreur géocodage pour {code_postal}: {e}")
                    zone_dict["lat"] = None
                    zone_dict["lon"] = None
            else:
                zone_dict["lat"] = None
                zone_dict["lon"] = None
            
            result.append(zone_dict)
        
        logger.info(f"✅ Zones accessibles calculées : {len(result)} codes postaux (budget ≤ {budget_max:,.0f}€)")
        return result
    
    except Exception as e:
        logger.error(f"Erreur get_zones_budget_accessible: {e}")
        return []


# ============================================================================
# WIDGET 2 : ÉVOLUTION PRIX DÉPARTEMENT (Scope Départemental)
# ============================================================================

def get_evolution_prix_departement(dvf_hist_df: pd.DataFrame, departement: str,
                                     type_bien: str = "Tous") -> List[Dict]:
    """
    Calcule l'évolution du prix médian sur 2020-2024 pour un département.
    
    Args:
        dvf_hist_df: DataFrame DVF 2020-2024
        departement: Code département (ex: "69")
        type_bien: "Appartement", "Maison", ou "Tous"
    
    Returns:
        Liste de dicts {annee, prix_median, prix_moyen, nb_ventes}
    """
    if dvf_hist_df is None or dvf_hist_df.empty:
        logger.warning("DataFrame DVF historique vide")
        return []
    
    try:
        # Filtrage par département
        df_dept = dvf_hist_df[dvf_hist_df["Code departement"] == departement].copy()
        
        # Filtrage par type de bien
        if type_bien != "Tous":
            df_dept = df_dept[df_dept["Type local"].str.contains(type_bien, case=False, na=False)]
        
        # Extraction de l'année depuis Date mutation
        if "Date mutation" in df_dept.columns:
            df_dept["annee"] = pd.to_datetime(df_dept["Date mutation"], errors="coerce").dt.year
        elif "annee" not in df_dept.columns:
            logger.error("Colonne 'Date mutation' ou 'annee' non trouvée")
            return []
        
        # Agrégation par année
        agg = df_dept.groupby("annee").agg({
            "Valeur fonciere": ["median", "mean", "count"]
        }).reset_index()
        
        agg.columns = ["annee", "prix_median", "prix_moyen", "nb_ventes"]
        
        # Tri par année
        agg = agg.sort_values("annee")
        
        # Conversion en liste de dicts
        result = []
        for _, row in agg.iterrows():
            result.append({
                "annee": int(row["annee"]),
                "prix_median": round(float(row["prix_median"]), 0),
                "prix_moyen": round(float(row["prix_moyen"]), 0),
                "nb_ventes": int(row["nb_ventes"])
            })
        
        logger.info(f"✅ Évolution prix calculée : {len(result)} années pour département {departement}")
        return result
    
    except Exception as e:
        logger.error(f"Erreur get_evolution_prix_departement: {e}")
        return []


# ============================================================================
# WIDGET 3 : RÉPARTITION TAILLE SELON BUDGET (Scope Départemental)
# ============================================================================

# Cache pour les calculs de répartition (évite de recalculer pour les mêmes paramètres)
_repartition_cache: Dict[str, Dict] = {}
CACHE_SIZE = 100  # Nombre max d'entrées dans le cache

def _get_cache_key(departement: str, budget_max: float) -> str:
    """Génère une clé de cache arrondie pour le budget (par tranches de 10k)"""
    budget_rounded = int(budget_max // 10000) * 10000  # Arrondir à 10k près
    return f"{departement}_{budget_rounded}"

def get_repartition_taille_budget(dvf_df: pd.DataFrame, departement: str, 
                                    budget_max: float) -> Dict:
    """
    Calcule la distribution des biens par type et nombre de pièces ≤ budget.
    Reproduit exactement la logique du notebook BrickAI.ipynb.
    Utilise un cache pour accélérer les requêtes répétées.
    
    Args:
        dvf_df: DataFrame DVF 2024
        departement: Code département ("all" pour France entière)
        budget_max: Budget maximum
    
    Returns:
        Dict avec distribution groupée par Type local et Nombre pieces principales
    """
    if dvf_df is None or dvf_df.empty:
        logger.warning("DataFrame DVF vide")
        return {}
    
    # Vérifier le cache
    cache_key = _get_cache_key(departement, budget_max)
    if cache_key in _repartition_cache:
        cached_result = _repartition_cache[cache_key].copy()
        # Ajuster le budget dans le résultat (peut différer légèrement à cause de l'arrondi)
        cached_result["budget"] = budget_max
        logger.info(f"✅ Répartition taille (cache) : département {departement}, budget {budget_max:,.0f}€")
        return cached_result
    
    try:
        # Utiliser les colonnes pré-calculées si disponibles (optimisation)
        # Si Type_simple existe déjà, c'est qu'il a été pré-calculé au chargement
        if "Type_simple" in dvf_df.columns:
            # Les données sont déjà optimisées, filtrer directement
            df_valid = dvf_df[
                (dvf_df["Nombre pieces principales"].notna()) &
                (dvf_df["Valeur fonciere"].notna()) &
                (dvf_df["Nombre pieces principales"] >= 1) & 
                (dvf_df["Nombre pieces principales"] <= 8)
            ].copy()
        else:
            # Fallback si les colonnes ne sont pas pré-calculées
            df_valid = dvf_df[
                (dvf_df["Nombre pieces principales"].notna()) &
                (dvf_df["Valeur fonciere"].notna())
            ].copy()
            
            # Pré-calculer Type_simple si pas déjà fait
            if "Type local" in df_valid.columns:
                df_valid["Type_simple"] = df_valid["Type local"].apply(
                    lambda x: "Appartement" if pd.notna(x) and "Appartement" in str(x) 
                    else "Maison" if pd.notna(x) and "Maison" in str(x)
                    else "Autre"
                )
            else:
                df_valid["Type_simple"] = "Autre"
            
            # Convertir Nombre pieces principales en entier
            df_valid["Nombre pieces principales"] = pd.to_numeric(
                df_valid["Nombre pieces principales"], 
                errors="coerce"
            ).astype("Int64")
            
            # Filtrer les valeurs valides (1-8 pièces)
            df_valid = df_valid[
                (df_valid["Nombre pieces principales"] >= 1) & 
                (df_valid["Nombre pieces principales"] <= 8)
            ].copy()
        
        # Maintenant filtrer par budget et département
        df_filtered = df_valid[df_valid["Valeur fonciere"] <= budget_max].copy()
        
        # Filtrage par département si spécifié
        if departement != "all":
            df_filtered = df_filtered[df_filtered["Code departement"] == departement].copy()
        
        if df_filtered.empty:
            result = {
                "budget": budget_max,
                "distribution": {},
                "total_biens": 0,
                "by_type_and_pieces": []
            }
            # Mettre en cache même les résultats vides
            if len(_repartition_cache) < CACHE_SIZE:
                _repartition_cache[cache_key] = result.copy()
            return result
        
        # Agrégation par Type_simple et Nombre pieces principales (comme dans le notebook)
        ventes = (df_filtered.groupby(["Type_simple", "Nombre pieces principales"], as_index=False)
                  .size().rename(columns={"size": "nb_ventes"}))
        ventes = ventes.sort_values(["Type_simple", "Nombre pieces principales"])
        
        total_ventes = ventes["nb_ventes"].sum()
        
        # Calcul des statistiques par catégories (comme dans le notebook)
        part_1_2 = ventes[ventes["Nombre pieces principales"] <= 2]["nb_ventes"].sum()
        part_3_4 = ventes[ventes["Nombre pieces principales"].between(3, 4)]["nb_ventes"].sum()
        part_5plus = ventes[ventes["Nombre pieces principales"] >= 5]["nb_ventes"].sum()
        
        pct_1_2 = (part_1_2 / total_ventes * 100) if total_ventes > 0 else 0
        pct_3_4 = (part_3_4 / total_ventes * 100) if total_ventes > 0 else 0
        pct_5plus = (part_5plus / total_ventes * 100) if total_ventes > 0 else 0
        
        # Conversion en format pour l'API
        by_type_and_pieces = []
        for _, row in ventes.iterrows():
            by_type_and_pieces.append({
                "type": row["Type_simple"],
                "nb_pieces": int(row["Nombre pieces principales"]),
                "count": int(row["nb_ventes"]),
                "pct": round((row["nb_ventes"] / total_ventes * 100) if total_ventes > 0 else 0, 1)
            })
        
        # Distribution par type (pour compatibilité)
        distribution_by_type = {}
        for type_bien in ventes["Type_simple"].unique():
            count = ventes[ventes["Type_simple"] == type_bien]["nb_ventes"].sum()
            pct = (count / total_ventes * 100) if total_ventes > 0 else 0
            distribution_by_type[type_bien] = {
                "count": int(count),
                "pct": round(pct, 1)
            }
        
        result = {
            "budget": budget_max,
            "total_biens": int(total_ventes),
            "distribution_by_type": distribution_by_type,
            "by_type_and_pieces": by_type_and_pieces,
            "stats": {
                "part_1_2": int(part_1_2),
                "pct_1_2": round(pct_1_2, 1),
                "part_3_4": int(part_3_4),
                "pct_3_4": round(pct_3_4, 1),
                "part_5plus": int(part_5plus),
                "pct_5plus": round(pct_5plus, 1)
            }
        }
        
        # Mettre en cache le résultat
        if len(_repartition_cache) < CACHE_SIZE:
            _repartition_cache[cache_key] = result.copy()
        else:
            # Cache plein, supprimer la première entrée (FIFO simple)
            first_key = next(iter(_repartition_cache))
            del _repartition_cache[first_key]
            _repartition_cache[cache_key] = result.copy()
        
        logger.info(f"✅ Répartition taille calculée : {total_ventes} biens pour département {departement} (≤ {budget_max:,.0f}€)")
        
        return result
    
    except Exception as e:
        logger.error(f"Erreur get_repartition_taille_budget: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {}


# ============================================================================
# WIDGET 8 : INDICE ACHAT-LOCATION (Scope Départemental)
# ============================================================================

def get_indice_achat_location(dvf_df: pd.DataFrame, loyers_df: pd.DataFrame, 
                                departement: str) -> Optional[float]:
    """
    Calcule l'indice achat/location = prix_m2 / (loyer_m2 * 12).
    
    Interprétation:
    - < 15: Marché acheteur (loyers élevés)
    - 15-20: Équilibré
    - > 20: Marché locataire (loyers faibles)
    
    Args:
        dvf_df: DataFrame DVF 2024
        loyers_df: DataFrame Loyers 2024
        departement: Code département
    
    Returns:
        Indice (float) ou None
    """
    if dvf_df is None or loyers_df is None:
        return None
    
    try:
        # Prix/m² médian
        df_dept = dvf_df[dvf_df["Code departement"] == departement].copy()
        df_dept["prix_m2"] = df_dept["Valeur fonciere"] / df_dept["surface_reelle_bati"]
        df_dept = df_dept[(df_dept["prix_m2"] > 500) & (df_dept["prix_m2"] < 20000)]
        
        prix_m2_median = df_dept["prix_m2"].median()
        
        # Loyer/m² médian
        loyers_dept = loyers_df[loyers_df["Code departement"] == departement]
        loyer_m2_median = loyers_dept["loyer_m2"].median()
        
        if pd.isna(prix_m2_median) or pd.isna(loyer_m2_median) or loyer_m2_median == 0:
            return None
        
        indice = prix_m2_median / (loyer_m2_median * 12)
        
        logger.info(f"✅ Indice achat/location calculé : {indice:.2f} pour département {departement}")
        return round(float(indice), 2)
    
    except Exception as e:
        logger.error(f"Erreur get_indice_achat_location: {e}")
        return None


# ============================================================================
# HELPER : Géocodage Code Postal
# ============================================================================

def get_code_postal_coords(code_postal: str) -> Dict:
    """
    Retourne les coordonnées et le nom de ville d'un code postal.
    
    Args:
        code_postal: Code postal (5 chiffres)
    
    Returns:
        Dict avec lat, lon, ville (ou None si introuvable)
    """
    try:
        import pgeocode
        nomi = pgeocode.Nominatim('FR')
        location = nomi.query_postal_code(code_postal)
        
        if pd.isna(location.latitude) or pd.isna(location.longitude):
            logger.warning(f"Code postal {code_postal} introuvable")
            return {"lat": None, "lon": None, "ville": None}
        
        return {
            "lat": float(location.latitude),
            "lon": float(location.longitude),
            "ville": location.place_name if hasattr(location, 'place_name') else None
        }
    except Exception as e:
        logger.error(f"Erreur get_code_postal_coords: {e}")
        return {"lat": None, "lon": None, "ville": None}


# ============================================================================
# WIDGET 9 : GARES PROCHES (Scope Local)
# ============================================================================

def get_gares_proches(gares_df: pd.DataFrame, code_postal: str, 
                       rayon_km: float = 20.0, pgeocode_instance=None) -> List[Dict]:
    """
    Liste les gares dans un rayon autour d'un code postal.
    
    Args:
        gares_df: DataFrame Gares
        code_postal: Code postal de référence
        rayon_km: Rayon de recherche (km)
        pgeocode_instance: Instance de pgeocode.Nominatim('FR') pour géocodage
    
    Returns:
        Liste de dicts {nom_gare, distance_km, lat, lon}
    """
    if gares_df is None or gares_df.empty:
        logger.warning("DataFrame Gares vide")
        return []
    
    try:
        import pgeocode
        
        # Géocodage du code postal
        if pgeocode_instance is None:
            nomi = pgeocode.Nominatim('FR')
        else:
            nomi = pgeocode_instance
        
        location = nomi.query_postal_code(code_postal)
        
        if pd.isna(location.latitude) or pd.isna(location.longitude):
            logger.warning(f"Code postal {code_postal} introuvable")
            return []
        
        lat_ref, lon_ref = location.latitude, location.longitude
        
        # Calcul des distances (Haversine)
        def haversine_km(lat1, lon1, lat2, lon2):
            R = 6371.0
            lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
            dlat, dlon = lat2 - lat1, lon2 - lon1
            a = np.sin(dlat/2)**2 + np.cos(lat1)*np.cos(lat2)*np.sin(dlon/2)**2
            return R * (2 * np.arcsin(np.sqrt(a)))
        
        # S'assurer que les coordonnées existent
        gares_with_coords = gares_df[gares_df["latitude"].notna() & gares_df["longitude"].notna()].copy()
        
        gares_with_coords["distance_km"] = gares_with_coords.apply(
            lambda row: haversine_km(lat_ref, lon_ref, row["latitude"], row["longitude"]),
            axis=1
        )
        
        # Filtrer par rayon
        gares_proches = gares_with_coords[gares_with_coords["distance_km"] <= rayon_km].copy()
        
        # Tri par distance
        gares_proches = gares_proches.sort_values("distance_km")
        
        # Conversion en liste de dicts
        result = []
        for _, row in gares_proches.head(10).iterrows():  # Max 10 gares
            result.append({
                "nom_gare": row["nom_gare"],
                "distance_km": round(float(row["distance_km"]), 2),
                "lat": float(row["latitude"]),
                "lon": float(row["longitude"])
            })
        
        logger.info(f"✅ Gares proches trouvées : {len(result)} dans rayon {rayon_km}km de {code_postal}")
        return result
    
    except Exception as e:
        logger.error(f"Erreur get_gares_proches: {e}")
        return []


# ============================================================================
# WIDGET 10 : ÉTABLISSEMENTS SUPÉRIEURS (Scope Local)
# ============================================================================

def get_etablissements_sup(enseignement_df: pd.DataFrame, ville: str, 
                             rayon_km: float = 10.0) -> List[Dict]:
    """
    Liste les établissements d'enseignement supérieur dans/proche d'une ville.
    
    Args:
        enseignement_df: DataFrame Enseignement Supérieur
        ville: Nom de la ville
        rayon_km: Rayon de recherche (non utilisé si recherche par nom)
    
    Returns:
        Liste de dicts {nom, distance_km (optionnel), type}
    """
    if enseignement_df is None or enseignement_df.empty:
        logger.warning("DataFrame Enseignement Supérieur vide")
        return []
    
    try:
        # Recherche par nom de ville (colonne "ville" ou "commune")
        ville_col = "ville" if "ville" in enseignement_df.columns else "commune"
        
        etab_ville = enseignement_df[
            enseignement_df[ville_col].str.contains(ville, case=False, na=False)
        ].copy()
        
        # Extraction du nom (colonne "nom" ou "libelle")
        nom_col = "nom" if "nom" in enseignement_df.columns else "libelle"
        
        # Conversion en liste de dicts
        result = []
        for _, row in etab_ville.head(10).iterrows():  # Max 10 établissements
            result.append({
                "nom": row[nom_col],
                "type": row.get("type", None),
                "effectif": int(row["effectif"]) if "effectif" in row and pd.notna(row["effectif"]) else None
            })
        
        logger.info(f"✅ Établissements trouvés : {len(result)} pour ville {ville}")
        return result
    
    except Exception as e:
        logger.error(f"Erreur get_etablissements_sup: {e}")
        return []


# ============================================================================
# HELPER : Récupérer données locales (tension, prix)
# ============================================================================

def get_local_market_data(dvf_df: pd.DataFrame, insee_df: pd.DataFrame, 
                           loyers_df: pd.DataFrame, code_postal: str) -> Dict:
    """
    Récupère les données du marché local (tension, prix, loyers).
    
    Args:
        dvf_df: DataFrame DVF 2024
        insee_df: DataFrame INSEE
        loyers_df: DataFrame Loyers
        code_postal: Code postal
    
    Returns:
        Dict avec market_tension et prix_marche
    """
    result = {"market_tension": None, "prix_marche": None}
    
    try:
        # Code commune à partir du code postal (approximation)
        code_commune = code_postal[:5]  # Prendre les 5 premiers chiffres
        
        # Tension locative (INSEE)
        if insee_df is not None:
            insee_local = insee_df[insee_df["code_commune"].str.startswith(code_commune)]
            if not insee_local.empty:
                row = insee_local.iloc[0]
                taux_vacance = (row["P21_LOGVAC"] / row["P21_LOG"]) * 100
                part_locataires = (row["P21_RP_LOC"] / row["P21_RP"]) * 100
                
                niveau = "Forte" if taux_vacance < 6 else ("Moyenne" if taux_vacance < 8 else "Faible")
                
                result["market_tension"] = {
                    "taux_vacance": round(float(taux_vacance), 2),
                    "niveau": niveau,
                    "part_locataires": round(float(part_locataires), 2),
                    "logements_vacants": int(row["P21_LOGVAC"]),
                    "residences_principales": int(row["P21_RP"])
                }
        
        # Prix du marché (DVF)
        if dvf_df is not None:
            dvf_local = dvf_df[dvf_df["Code postal"] == code_postal].copy()
            if not dvf_local.empty:
                dvf_local["prix_m2"] = dvf_local["Valeur fonciere"] / dvf_local["surface_reelle_bati"]
                dvf_local = dvf_local[(dvf_local["prix_m2"] > 500) & (dvf_local["prix_m2"] < 20000)]
                
                result["prix_marche"] = {
                    "prix_m2_median": round(float(dvf_local["prix_m2"].median()), 2),
                    "prix_m2_mean": round(float(dvf_local["prix_m2"].mean()), 2),
                    "nb_ventes_2024": int(len(dvf_local))
                }
        
        # Loyer du marché
        if loyers_df is not None and result["prix_marche"]:
            # Utiliser le département du code postal
            dept = code_postal[:2]
            loyers_local = loyers_df[loyers_df["Code departement"] == dept]
            if not loyers_local.empty:
                result["prix_marche"]["loyer_m2_median"] = round(float(loyers_local["loyer_m2"].median()), 2)
        
        return result
    
    except Exception as e:
        logger.error(f"Erreur get_local_market_data: {e}")
        return result
