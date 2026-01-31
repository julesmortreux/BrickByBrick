"""
Script de diagnostic pour vérifier les colonnes des CSV
Utile pour identifier les noms de colonnes réels avant de les utiliser
"""

import pandas as pd
from pathlib import Path

def check_csv_columns():
    """Affiche les colonnes de chaque CSV"""
    
    # Chemin vers le dossier data
    data_dir = Path(__file__).parent.parent / "data"
    
    print("=" * 80)
    print("🔍 DIAGNOSTIC DES COLONNES CSV")
    print("=" * 80)
    print(f"\n📁 Dossier data : {data_dir}\n")
    
    csv_files = [
        "dvf_clean_2020_2024.csv",
        "dvf_clean_2024.csv",
        "loyers_clean_2024.csv",
        "insee_logement_2021_clean.csv",
        "enseignement_superieur_clean.csv",
        "gares_clean.csv"
    ]
    
    for filename in csv_files:
        file_path = data_dir / filename
        
        print("=" * 80)
        print(f"📊 {filename}")
        print("=" * 80)
        
        if not file_path.exists():
            print(f"❌ Fichier introuvable : {file_path}\n")
            continue
        
        try:
            # Lire seulement les premières lignes pour performance
            df = pd.read_csv(file_path, nrows=5, low_memory=False)
            
            print(f"✅ Fichier chargé ({len(df)} lignes de test)")
            print(f"\n📋 Colonnes ({len(df.columns)}) :")
            
            for i, col in enumerate(df.columns, 1):
                dtype = df[col].dtype
                example = df[col].iloc[0] if len(df) > 0 else "N/A"
                
                # Tronquer les exemples trop longs
                if isinstance(example, str) and len(str(example)) > 50:
                    example = str(example)[:47] + "..."
                
                print(f"   {i:2d}. {col:40s} | Type: {str(dtype):15s} | Ex: {example}")
            
            print()
            
        except Exception as e:
            print(f"❌ Erreur lors de la lecture : {e}\n")
    
    print("=" * 80)
    print("✅ Diagnostic terminé")
    print("=" * 80)


if __name__ == "__main__":
    check_csv_columns()
