"""
Data Loader pour BrickByBrick
Charge les datasets CSV une seule fois au démarrage (Singleton pattern)
"""

import pandas as pd
import warnings
from pathlib import Path
from typing import Optional, Dict, List
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataStore:
    """
    Singleton pour stocker les données chargées en mémoire
    Évite de recharger les CSV à chaque requête API
    """
    
    _instance: Optional['DataStore'] = None
    _is_initialized: bool = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DataStore, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialise le DataStore (appelé une seule fois)"""
        if not DataStore._is_initialized:
            logger.info("🚀 Initialisation du DataStore...")
            
            # Initialiser les DataFrames à None
            self.dvf_2020_2024: Optional[pd.DataFrame] = None
            self.dvf_2024: Optional[pd.DataFrame] = None
            self.loyers: Optional[pd.DataFrame] = None
            self.insee: Optional[pd.DataFrame] = None
            self.enseignement_sup: Optional[pd.DataFrame] = None
            self.gares: Optional[pd.DataFrame] = None
            
            # Compteurs de chargement
            self.loaded_count = 0
            self.failed_count = 0
            
            DataStore._is_initialized = True
    
    def get_data_path(self) -> Path:
        """
        Retourne le chemin absolu vers le dossier data/
        Compatible Windows/Mac/Linux grâce à pathlib
        """
        # backend/data_loader.py -> backend/ -> project_root/ -> data/
        backend_dir = Path(__file__).parent  # backend/
        project_root = backend_dir.parent     # BrickByBrick/
        data_dir = project_root / "data"      # BrickByBrick/data/
        
        return data_dir
    
    def load_csv(
        self, 
        filename: str, 
        required_cols: Optional[list] = None,
        low_memory: bool = False
    ) -> Optional[pd.DataFrame]:
        """
        Charge un fichier CSV depuis le dossier data/
        
        Args:
            filename: Nom du fichier (ex: "dvf_clean_2024.csv")
            required_cols: Liste des colonnes obligatoires
            low_memory: Si True, utilise low_memory=False pour pandas
        
        Returns:
            DataFrame ou None si erreur
        """
        data_path = self.get_data_path()
        file_path = data_path / filename
        
        # Vérifier que le fichier existe
        if not file_path.exists():
            logger.warning(f"⚠️ Fichier introuvable : {filename}")
            logger.warning(f"   Chemin recherché : {file_path}")
            logger.warning(f"   💡 Assurez-vous que le dossier 'data/' contient ce fichier")
            return None
        
        try:
            # Charger le CSV
            df = pd.read_csv(file_path, low_memory=low_memory)
            
            # Afficher la taille
            rows = len(df)
            size_mb = file_path.stat().st_size / (1024 * 1024)
            logger.info(f"✅ {filename} : {rows:,} lignes ({size_mb:.1f} Mo)")
            
            # Vérifier les colonnes obligatoires
            if required_cols:
                missing = [col for col in required_cols if col not in df.columns]
                if missing:
                    logger.warning(f"⚠️ Colonnes manquantes dans {filename} : {missing}")
                    logger.warning(f"   Colonnes disponibles : {list(df.columns[:10])}...")
                    return None
            
            return df
            
        except pd.errors.EmptyDataError:
            logger.error(f"❌ Fichier vide : {filename}")
            return None
        
        except pd.errors.ParserError as e:
            logger.error(f"❌ Erreur de parsing CSV pour {filename} : {e}")
            return None
        
        except Exception as e:
            logger.error(f"❌ Erreur lors du chargement de {filename} : {type(e).__name__} - {e}")
            return None
    
    def load_all_data(self) -> Dict[str, bool]:
        """
        Charge tous les datasets nécessaires
        
        Returns:
            Dictionnaire avec le statut de chargement de chaque fichier
        """
        logger.info("=" * 80)
        logger.info("📊 CHARGEMENT DES DONNÉES")
        logger.info("=" * 80)
        
        status = {}
        
        # 1. DVF Historique 2020-2024 (pour l'analyse de marché)
        logger.info("\n📈 Chargement DVF Historique 2020-2024...")
        self.dvf_2020_2024 = self.load_csv(
            "dvf_clean_2020_2024.csv",
            required_cols=["Valeur fonciere", "Type local", "prix_m2"],
            low_memory=False
        )
        status['dvf_2020_2024'] = self.dvf_2020_2024 is not None
        if status['dvf_2020_2024']:
            self.loaded_count += 1
        else:
            self.failed_count += 1
        
        # 2. DVF 2024 uniquement (pour les prix actuels)
        logger.info("\n📊 Chargement DVF 2024...")
        self.dvf_2024 = self.load_csv(
            "dvf_clean_2024.csv",
            required_cols=["Valeur fonciere", "Type local", "prix_m2", "Code departement"],
            low_memory=False
        )
        status['dvf_2024'] = self.dvf_2024 is not None
        if status['dvf_2024']:
            # Pré-calculer Type_simple une fois au chargement pour optimiser les requêtes
            logger.info("   🔧 Pré-calcul Type_simple pour optimisation...")
            if "Type local" in self.dvf_2024.columns:
                self.dvf_2024["Type_simple"] = self.dvf_2024["Type local"].apply(
                    lambda x: "Appartement" if pd.notna(x) and "Appartement" in str(x) 
                    else "Maison" if pd.notna(x) and "Maison" in str(x)
                    else "Autre"
                )
            else:
                self.dvf_2024["Type_simple"] = "Autre"
            
            # Pré-convertir Nombre pieces principales en entier
            if "Nombre pieces principales" in self.dvf_2024.columns:
                self.dvf_2024["Nombre pieces principales"] = pd.to_numeric(
                    self.dvf_2024["Nombre pieces principales"],
                    errors="coerce"
                )
            
            # Pré-calculer les zones accessibles (nouveau cache optimisé)
            logger.info("   🔧 Pré-calcul des zones accessibles...")
            from zones_precompute import initialize_zones_cache
            initialize_zones_cache(self.dvf_2024)
            
            self.loaded_count += 1
        else:
            self.failed_count += 1
        
        # 3. Loyers 2024 (pour l'estimation de rentabilité)
        logger.info("\n💰 Chargement Loyers 2024...")
        self.loyers = self.load_csv(
            "loyers_clean_2024.csv"
        )
        if self.loyers is not None:
            # Renommer les colonnes pour standardiser
            rename_map = {
                'loypredm2': 'loyer_m2',
                'DEP': 'Code departement',
                'INSEE_C': 'code_commune'
            }
            # Ne renommer que les colonnes qui existent
            existing_renames = {k: v for k, v in rename_map.items() if k in self.loyers.columns}
            if existing_renames:
                self.loyers.rename(columns=existing_renames, inplace=True)
                logger.info(f"   🔄 Colonnes renommées : {list(existing_renames.keys())}")
            
            # Vérifier que les colonnes essentielles existent maintenant
            if 'loyer_m2' not in self.loyers.columns or 'Code departement' not in self.loyers.columns:
                logger.warning(f"   ⚠️ Colonnes manquantes après renommage. Colonnes disponibles : {list(self.loyers.columns[:10])}")
                self.loyers = None
        
        status['loyers'] = self.loyers is not None
        if status['loyers']:
            self.loaded_count += 1
        else:
            self.failed_count += 1
        
        # 4. INSEE Logement (pour tension locative & vacance)
        logger.info("\n🏘️ Chargement INSEE Logement 2021...")
        self.insee = self.load_csv(
            "insee_logement_2021_clean.csv"
        )
        if self.insee is not None:
            # Renommer CODGEO en code_commune
            if 'CODGEO' in self.insee.columns:
                self.insee.rename(columns={'CODGEO': 'code_commune'}, inplace=True)
                logger.info(f"   🔄 Colonne renommée : CODGEO -> code_commune")
            
            # Créer Code departement si manquant (2 premiers caractères de code_commune)
            if 'Code departement' not in self.insee.columns and 'code_commune' in self.insee.columns:
                self.insee['Code departement'] = self.insee['code_commune'].astype(str).str[:2]
                logger.info(f"   ➕ Colonne créée : Code departement (depuis code_commune)")
            
            # Vérifier que Code departement existe maintenant
            if 'Code departement' not in self.insee.columns:
                logger.warning(f"   ⚠️ Impossible de créer 'Code departement'. Colonnes disponibles : {list(self.insee.columns[:10])}")
                self.insee = None
        
        status['insee'] = self.insee is not None
        if status['insee']:
            self.loaded_count += 1
        else:
            self.failed_count += 1
        
        # 5. Enseignement Supérieur (pour proximité campus)
        logger.info("\n🎓 Chargement Enseignement Supérieur...")
        self.enseignement_sup = self.load_csv(
            "enseignement_superieur_clean.csv",
            required_cols=["latitude", "longitude"]
        )
        status['enseignement_sup'] = self.enseignement_sup is not None
        if status['enseignement_sup']:
            self.loaded_count += 1
        else:
            self.failed_count += 1
        
        # 6. Gares SNCF (pour proximité transports)
        logger.info("\n🚄 Chargement Gares SNCF...")
        self.gares = self.load_csv(
            "gares_clean.csv",
            required_cols=["latitude", "longitude"]
        )
        status['gares'] = self.gares is not None
        if status['gares']:
            self.loaded_count += 1
        else:
            self.failed_count += 1
        
        # Résumé du chargement
        logger.info("\n" + "=" * 80)
        logger.info("📊 RÉSUMÉ DU CHARGEMENT")
        logger.info("=" * 80)
        logger.info(f"✅ Fichiers chargés avec succès : {self.loaded_count}/6")
        logger.info(f"❌ Fichiers manquants ou erreurs : {self.failed_count}/6")
        
        if self.failed_count > 0:
            logger.warning("\n⚠️ ATTENTION : Certains fichiers n'ont pas pu être chargés.")
            logger.warning("   L'API fonctionnera mais certaines fonctionnalités seront limitées.")
            logger.warning("\n   📁 Fichiers manquants :")
            for name, loaded in status.items():
                if not loaded:
                    logger.warning(f"      ❌ {name}")
            
            data_path = self.get_data_path()
            logger.warning(f"\n   💡 Vérifiez le dossier : {data_path}")
            logger.warning("   💡 Les fichiers doivent être au format CSV dans ce dossier")
        else:
            logger.info("\n🎉 Tous les fichiers ont été chargés avec succès !")
        
        logger.info("=" * 80)
        
        return status
    
    def is_ready(self) -> bool:
        """
        Vérifie si au moins les données essentielles sont chargées
        
        Returns:
            True si DVF 2024 et Loyers sont chargés (minimum vital)
        """
        essential_data = [
            self.dvf_2024 is not None,
            self.loyers is not None
        ]
        return all(essential_data)
    
    def get_status(self) -> Dict[str, any]:
        """
        Retourne le statut de tous les datasets
        
        Returns:
            Dictionnaire avec le statut de chaque dataset
        """
        return {
            "dvf_2020_2024": {
                "loaded": self.dvf_2020_2024 is not None,
                "rows": len(self.dvf_2020_2024) if self.dvf_2020_2024 is not None else 0
            },
            "dvf_2024": {
                "loaded": self.dvf_2024 is not None,
                "rows": len(self.dvf_2024) if self.dvf_2024 is not None else 0
            },
            "loyers": {
                "loaded": self.loyers is not None,
                "rows": len(self.loyers) if self.loyers is not None else 0
            },
            "insee": {
                "loaded": self.insee is not None,
                "rows": len(self.insee) if self.insee is not None else 0
            },
            "enseignement_sup": {
                "loaded": self.enseignement_sup is not None,
                "rows": len(self.enseignement_sup) if self.enseignement_sup is not None else 0
            },
            "gares": {
                "loaded": self.gares is not None,
                "rows": len(self.gares) if self.gares is not None else 0
            },
            "is_ready": self.is_ready(),
            "loaded_count": self.loaded_count,
            "total_count": 6
        }


# ============================================================================
# FONCTION GLOBALE D'ACCÈS (SINGLETON)
# ============================================================================

_data_store: Optional[DataStore] = None


def get_data_store() -> DataStore:
    """
    Retourne l'instance unique du DataStore (Singleton)
    
    Usage dans FastAPI:
        from data_loader import get_data_store
        
        data = get_data_store()
        df = data.dvf_2024
    """
    global _data_store
    
    if _data_store is None:
        _data_store = DataStore()
    
    return _data_store


def load_data() -> DataStore:
    """
    Charge toutes les données et retourne le DataStore
    À appeler au démarrage de l'API (dans main.py)
    
    Usage:
        from data_loader import load_data
        
        @app.on_event("startup")
        async def startup_event():
            data_store = load_data()
            if not data_store.is_ready():
                logger.warning("⚠️ Données essentielles manquantes !")
    """
    data_store = get_data_store()
    data_store.load_all_data()
    return data_store


# ============================================================================
# MÉTHODES D'ACCÈS UTILITAIRES POUR LES WIDGETS (Phase 1)
# ============================================================================

def get_dvf_by_departement(data_store: DataStore, dept: str) -> Optional[pd.DataFrame]:
    """Retourne les données DVF 2024 pour un département"""
    if data_store.dvf_2024 is None:
        return None
    return data_store.dvf_2024[data_store.dvf_2024["Code departement"] == dept]


def get_dvf_hist_by_departement(data_store: DataStore, dept: str) -> Optional[pd.DataFrame]:
    """Retourne les données DVF 2020-2024 pour un département"""
    if data_store.dvf_2020_2024 is None:
        return None
    return data_store.dvf_2020_2024[data_store.dvf_2020_2024["Code departement"] == dept]


def get_insee_by_departement(data_store: DataStore, dept: str) -> Optional[pd.DataFrame]:
    """Retourne les données INSEE pour un département"""
    if data_store.insee is None:
        return None
    return data_store.insee[data_store.insee["Code departement"] == dept]


def get_loyers_by_departement(data_store: DataStore, dept: str) -> Optional[pd.DataFrame]:
    """Retourne les données Loyers pour un département"""
    if data_store.loyers is None:
        return None
    return data_store.loyers[data_store.loyers["Code departement"] == dept]


def get_insee_by_code_postal(data_store: DataStore, code_postal: str) -> Optional[pd.Series]:
    """Retourne les données INSEE pour un code postal (approximation par code commune)"""
    if data_store.insee is None:
        return None
    code_commune = code_postal[:5]
    filtered = data_store.insee[data_store.insee["code_commune"].str.startswith(code_commune)]
    return filtered.iloc[0] if not filtered.empty else None


# ============================================================================
# TEST EN LOCAL
# ============================================================================

if __name__ == "__main__":
    """Test du chargement des données"""
    print("\n🧪 TEST DU DATA LOADER")
    print("=" * 80)
    
    # Charger les données
    data_store = load_data()
    
    # Afficher le statut
    print("\n📊 STATUT DES DATASETS :")
    print("=" * 80)
    status = data_store.get_status()
    
    for dataset_name, dataset_info in status.items():
        if dataset_name in ['is_ready', 'loaded_count', 'total_count']:
            continue
        
        status_icon = "✅" if dataset_info['loaded'] else "❌"
        rows = f"{dataset_info['rows']:,}" if dataset_info['loaded'] else "N/A"
        print(f"{status_icon} {dataset_name.ljust(20)} : {rows.rjust(12)} lignes")
    
    print("=" * 80)
    print(f"\n🎯 API Prête : {'✅ OUI' if data_store.is_ready() else '❌ NON (données manquantes)'}")
    
    # Test d'accès aux données
    if data_store.dvf_2024 is not None:
        print(f"\n📊 Exemple - Colonnes DVF 2024 (5 premières) :")
        print(f"   {list(data_store.dvf_2024.columns[:5])}")
