"""
Pré-calcul des zones accessibles pour le Widget 4
Optimisation : calcul une seule fois au démarrage du backend
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class ZonesCache:
    """
    Cache pour les zones accessibles.
    Pré-calcule les données au démarrage pour des requêtes instantanées.
    """
    
    def __init__(self):
        self.postal_codes_data: Dict[str, dict] = {}
        self.is_ready = False
    
    def precompute(self, dvf_df: pd.DataFrame):
        """
        Pré-calcule toutes les données nécessaires au démarrage.
        """
        if dvf_df is None or dvf_df.empty:
            logger.warning("⚠️ ZonesCache: DataFrame DVF vide")
            return
        
        logger.info("🔄 ZonesCache: Démarrage du pré-calcul...")
        
        try:
            # Étape 1: Pré-traiter et stocker les données (optimisé)
            logger.info("   📊 Étape 1/2: Agrégation des données DVF...")
            self._aggregate_fast(dvf_df)
            
            # Étape 2: Géocoder tous les codes postaux
            logger.info("   📍 Étape 2/2: Géocodage des codes postaux...")
            self._geocode_all()
            
            self.is_ready = True
            logger.info(f"✅ ZonesCache: Pré-calcul terminé - {len(self.postal_codes_data)} codes postaux")
            
        except Exception as e:
            logger.error(f"❌ ZonesCache: Erreur lors du pré-calcul: {e}")
            import traceback
            traceback.print_exc()
    
    def _aggregate_fast(self, dvf_df: pd.DataFrame):
        """
        Agrège les données DVF par code postal de manière optimisée.
        Utilise pandas groupby pour éviter les itérations lentes.
        """
        try:
            df = dvf_df.copy()
            
            # Nettoyer Code postal
            df["Code postal"] = df["Code postal"].astype(str).str.zfill(5).str[:5]
            
            # Déterminer le type de bien
            if "Type_simple" not in df.columns:
                if "Type local" in df.columns:
                    df["Type_simple"] = df["Type local"].apply(
                        lambda x: "Appartement" if pd.notna(x) and "Appartement" in str(x) 
                        else "Maison" if pd.notna(x) and "Maison" in str(x)
                        else "Autre"
                    )
                else:
                    df["Type_simple"] = "Autre"
            
            # Filtrer les données valides
            df = df[df["Valeur fonciere"].notna()].copy()
            
            logger.info(f"      🔄 Agrégation de {len(df)} transactions...")
            
            # Grouper par code postal et agréger les prix en liste
            # Utiliser agg avec tuple pour collecter les prix
            grouped_all = df.groupby("Code postal").agg({
                "Valeur fonciere": list,
                "Commune": "first"
            }).reset_index()
            
            # Grouper par type aussi
            grouped_appart = df[df["Type_simple"] == "Appartement"].groupby("Code postal").agg({
                "Valeur fonciere": list
            }).reset_index()
            grouped_appart.columns = ["Code postal", "prices_appart"]
            
            grouped_maison = df[df["Type_simple"] == "Maison"].groupby("Code postal").agg({
                "Valeur fonciere": list
            }).reset_index()
            grouped_maison.columns = ["Code postal", "prices_maison"]
            
            # Merger les données
            grouped_all.columns = ["code_postal", "prices_all", "commune"]
            result = grouped_all.merge(grouped_appart, left_on="code_postal", right_on="Code postal", how="left")
            result = result.merge(grouped_maison, left_on="code_postal", right_on="Code postal", how="left")
            
            # Nettoyer les colonnes dupliquées
            if "Code postal_x" in result.columns:
                result = result.drop(columns=["Code postal_x"])
            if "Code postal_y" in result.columns:
                result = result.drop(columns=["Code postal_y"])
            
            # Convertir en dict avec arrays numpy triés
            count = 0
            for _, row in result.iterrows():
                code_postal = row["code_postal"]
                prices_all = row["prices_all"] if isinstance(row["prices_all"], list) else []
                
                # Filtrer si au moins 5 ventes
                if len(prices_all) >= 5:
                    prices_appart = row.get("prices_appart", [])
                    prices_maison = row.get("prices_maison", [])
                    
                    # Convertir en arrays numpy triés
                    self.postal_codes_data[code_postal] = {
                        "commune": str(row["commune"]) if pd.notna(row["commune"]) else None,
                        "prices_all": np.sort(np.array(prices_all, dtype=np.float64)),
                        "prices_appart": np.sort(np.array(prices_appart if isinstance(prices_appart, list) else [], dtype=np.float64)),
                        "prices_maison": np.sort(np.array(prices_maison if isinstance(prices_maison, list) else [], dtype=np.float64)),
                        "lat": None,
                        "lon": None
                    }
                    count += 1
            
            logger.info(f"      ✅ {count} codes postaux avec ≥5 ventes")
            
        except Exception as e:
            logger.error(f"      ❌ Erreur agrégation: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def _geocode_all(self):
        """
        Géocode tous les codes postaux.
        """
        try:
            import pgeocode
            nomi = pgeocode.Nominatim('FR')
            
            codes = list(self.postal_codes_data.keys())
            total = len(codes)
            logger.info(f"      🔄 Géocodage de {total} codes postaux...")
            
            geocoded = 0
            for i, code_postal in enumerate(codes):
                try:
                    location = nomi.query_postal_code(code_postal)
                    
                    if pd.notna(location.latitude) and pd.notna(location.longitude):
                        self.postal_codes_data[code_postal]["lat"] = float(location.latitude)
                        self.postal_codes_data[code_postal]["lon"] = float(location.longitude)
                        geocoded += 1
                except Exception:
                    pass
                
                if (i + 1) % 500 == 0:
                    logger.info(f"      ⏳ Géocodage: {i+1}/{total} ({(i+1)*100//total}%)")
            
            logger.info(f"      ✅ {geocoded}/{total} codes postaux géocodés")
            
        except ImportError:
            logger.error("      ❌ pgeocode non installé")
        except Exception as e:
            logger.error(f"      ❌ Erreur géocodage: {e}")
    
    def get_zones_for_budget(self, budget_max: float, type_bien: Optional[str] = None,
                              departement: Optional[str] = None, limit: Optional[int] = None) -> List[Dict]:
        """
        Retourne TOUTES les zones avec leur pourcentage d'accessibilité.
        Inclut les zones peu accessibles (rouge) et inaccessibles.

        Args:
            budget_max: Budget maximum en euros
            type_bien: "Appartement", "Maison", ou None pour tous
            departement: Code département pour filtrer (ex: "75", "69")
            limit: Nombre max de résultats (None = pas de limite)
        """
        if not self.is_ready:
            logger.warning("⚠️ ZonesCache non prêt")
            return []

        results = []

        # Choisir le bon array de prix selon le type
        price_key = "prices_all"
        if type_bien == "Appartement":
            price_key = "prices_appart"
        elif type_bien == "Maison":
            price_key = "prices_maison"

        for code_postal, data in self.postal_codes_data.items():
            # Filtrer par département si spécifié
            if departement:
                # Le département est les 2 premiers chiffres du code postal
                code_dept = code_postal[:2]
                if code_dept != departement:
                    continue

            # Seulement si coordonnées valides
            lat = data.get("lat")
            lon = data.get("lon")
            if not lat or not lon:
                continue

            # Récupérer les prix pour le type demandé
            prices = data.get(price_key)

            # Si pas assez de données pour ce type, utiliser prices_all en fallback
            if prices is None or len(prices) < 3:
                prices = data.get("prices_all")

            # S'il n'y a toujours pas de données, passer
            if prices is None or len(prices) < 3:
                continue

            # Recherche binaire O(log n) pour calculer le % accessible
            nb_accessible = np.searchsorted(prices, budget_max, side='right')
            total = len(prices)
            pct_access = (nb_accessible / total) * 100

            results.append({
                "code_postal": code_postal,
                "commune": data.get("commune"),
                "pct_access": round(pct_access, 1),
                "prix_median": round(float(np.median(prices)), 0),
                "nb_ventes": total,
                "lat": lat,
                "lon": lon
            })

        # Trier par pourcentage d'accessibilité décroissant
        results.sort(key=lambda x: x["pct_access"], reverse=True)

        # Appliquer la limite si spécifiée
        if limit:
            results = results[:limit]

        dept_info = f", dept={departement}" if departement else ""
        logger.info(f"✅ get_zones_for_budget: {len(results)} zones (budget ≤ {budget_max:,.0f}€{dept_info})")
        return results


# Instance globale
_zones_cache: Optional[ZonesCache] = None


def get_zones_cache() -> ZonesCache:
    """Retourne l'instance unique du cache."""
    global _zones_cache
    if _zones_cache is None:
        _zones_cache = ZonesCache()
    return _zones_cache


def initialize_zones_cache(dvf_df: pd.DataFrame):
    """Initialise le cache avec les données DVF."""
    cache = get_zones_cache()
    cache.precompute(dvf_df)
