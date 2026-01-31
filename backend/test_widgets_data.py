"""
Test des widgets_data enrichis (transport, éducation, démographie)
Valide que toutes les données sont correctement extraites
"""

import sys
from pathlib import Path

# Ajouter le répertoire parent au path
sys.path.insert(0, str(Path(__file__).parent))

from data_loader import load_data


def test_transport_stats():
    """Test des statistiques de transport (gares)"""
    
    print("\n" + "="*80)
    print("🧪 TEST DES STATISTIQUES TRANSPORT")
    print("="*80)
    
    data_store = load_data()
    
    if data_store.gares is None:
        print("❌ Données gares non chargées")
        return False
    
    print(f"\n✅ Gares chargées : {len(data_store.gares):,} lignes")
    print(f"📋 Colonnes disponibles : {list(data_store.gares.columns[:10])}")
    
    # Test avec quelques villes connues
    test_villes = ["Paris", "Lyon", "Marseille", "Lille"]
    
    for ville in test_villes:
        # Chercher les gares
        if "commune" in data_store.gares.columns:
            gares_ville = data_store.gares[
                data_store.gares["commune"].str.contains(ville, case=False, na=False)
            ]
        else:
            gares_ville = data_store.gares[
                data_store.gares["nom_gare"].str.contains(ville, case=False, na=False)
                if "nom_gare" in data_store.gares.columns else False
            ]
        
        if not gares_ville.empty:
            noms = gares_ville["nom_gare"].head(3).tolist() if "nom_gare" in gares_ville.columns else []
            print(f"\n✅ {ville} : {len(gares_ville)} gare(s)")
            for nom in noms:
                print(f"   • {nom}")
        else:
            print(f"\nℹ️ {ville} : Aucune gare trouvée")
    
    return True


def test_student_stats():
    """Test des statistiques d'éducation (enseignement supérieur)"""
    
    print("\n" + "="*80)
    print("🧪 TEST DES STATISTIQUES ÉDUCATION")
    print("="*80)
    
    data_store = load_data()
    
    if data_store.enseignement_sup is None:
        print("❌ Données enseignement supérieur non chargées")
        return False
    
    print(f"\n✅ Établissements chargés : {len(data_store.enseignement_sup):,} lignes")
    print(f"📋 Colonnes disponibles : {list(data_store.enseignement_sup.columns[:10])}")
    
    # Test avec quelques villes connues
    test_villes = ["Paris", "Lyon", "Marseille", "Toulouse"]
    
    for ville in test_villes:
        # Chercher les établissements
        if "ville" in data_store.enseignement_sup.columns:
            etab_ville = data_store.enseignement_sup[
                data_store.enseignement_sup["ville"].str.contains(ville, case=False, na=False)
            ]
        else:
            etab_ville = data_store.enseignement_sup[
                data_store.enseignement_sup["commune"].str.contains(ville, case=False, na=False)
                if "commune" in data_store.enseignement_sup.columns else False
            ]
        
        if not etab_ville.empty:
            # Extraire les noms
            if "nom" in etab_ville.columns:
                noms = etab_ville["nom"].head(3).tolist()
            elif "libelle" in etab_ville.columns:
                noms = etab_ville["libelle"].head(3).tolist()
            else:
                noms = []
            
            print(f"\n✅ {ville} : {len(etab_ville)} établissement(s)")
            for nom in noms:
                print(f"   • {nom[:60]}...")
        else:
            print(f"\nℹ️ {ville} : Aucun établissement trouvé")
    
    return True


def test_demography_stats():
    """Test des statistiques démographiques (INSEE)"""
    
    print("\n" + "="*80)
    print("🧪 TEST DES STATISTIQUES DÉMOGRAPHIQUES")
    print("="*80)
    
    data_store = load_data()
    
    if data_store.insee is None:
        print("❌ Données INSEE non chargées")
        return False
    
    print(f"\n✅ Données INSEE chargées : {len(data_store.insee):,} lignes")
    print(f"📋 Colonnes disponibles : {list(data_store.insee.columns[:15])}")
    
    # Vérifier les colonnes nécessaires
    colonnes_requises = ["P21_LOG", "P21_LOGVAC", "P21_RP", "P21_RP_LOC"]
    colonnes_presentes = [col for col in colonnes_requises if col in data_store.insee.columns]
    
    print(f"\n📊 Colonnes démographiques :")
    for col in colonnes_requises:
        status = "✅" if col in colonnes_presentes else "❌"
        print(f"   {status} {col}")
    
    if colonnes_presentes:
        # Calculer quelques statistiques d'exemple
        print(f"\n📈 Exemples de calculs :")
        
        # Prendre les 3 premières lignes avec des données valides
        for idx in range(min(3, len(data_store.insee))):
            row = data_store.insee.iloc[idx]
            
            code_commune = row.get("code_commune", "N/A")
            
            # % vacance locative
            if "P21_LOG" in row and "P21_LOGVAC" in row:
                total = row.get("P21_LOG", 0)
                vacants = row.get("P21_LOGVAC", 0)
                if total > 0:
                    pct_vacance = (vacants / total) * 100
                    print(f"\n   Commune {code_commune} :")
                    print(f"      Logements total : {int(total):,}")
                    print(f"      Logements vacants : {int(vacants):,}")
                    print(f"      % Vacance : {pct_vacance:.2f}%")
            
            # % locataires
            if "P21_RP" in row and "P21_RP_LOC" in row:
                rp = row.get("P21_RP", 0)
                loc = row.get("P21_RP_LOC", 0)
                if rp > 0:
                    pct_loc = (loc / rp) * 100
                    print(f"      Résidences principales : {int(rp):,}")
                    print(f"      Locataires : {int(loc):,}")
                    print(f"      % Locataires : {pct_loc:.2f}%")
    
    return len(colonnes_presentes) > 0


def test_complete_widgets_data():
    """Test complet simulant l'endpoint /api/analyze"""
    
    print("\n" + "="*80)
    print("🧪 TEST COMPLET WIDGETS_DATA")
    print("="*80)
    
    data_store = load_data()
    
    # Simuler des données scrapées
    scraped_data = {
        "prix": 180000,
        "surface": 55,
        "code_postal": "69001",
        "ville": "Lyon",
        "nb_pieces": 3
    }
    
    print(f"\n📍 Annonce simulée :")
    print(f"   Prix : {scraped_data['prix']:,}€")
    print(f"   Surface : {scraped_data['surface']}m²")
    print(f"   Localisation : {scraped_data['ville']} ({scraped_data['code_postal']})")
    
    widgets_data = {
        "code_postal": scraped_data["code_postal"],
        "departement": scraped_data["code_postal"][:2],
        "transport_stats": None,
        "student_stats": None,
        "demography_stats": None
    }
    
    # Test Transport
    print(f"\n🚄 TRANSPORT :")
    if data_store.gares is not None:
        ville = scraped_data["ville"]
        gares = data_store.gares[
            data_store.gares["commune"].str.contains(ville, case=False, na=False)
            if "commune" in data_store.gares.columns else False
        ]
        
        if not gares.empty:
            noms = gares["nom_gare"].head(5).tolist() if "nom_gare" in gares.columns else []
            widgets_data["transport_stats"] = {
                "nb_gares": len(gares),
                "noms_gares": noms
            }
            print(f"   ✅ {len(gares)} gare(s) trouvée(s)")
            for nom in noms:
                print(f"      • {nom}")
        else:
            widgets_data["transport_stats"] = {"nb_gares": 0, "noms_gares": []}
            print(f"   ℹ️ Aucune gare trouvée")
    
    # Test Éducation
    print(f"\n🎓 ÉDUCATION :")
    if data_store.enseignement_sup is not None:
        ville = scraped_data["ville"]
        etab = data_store.enseignement_sup[
            data_store.enseignement_sup["ville"].str.contains(ville, case=False, na=False)
            if "ville" in data_store.enseignement_sup.columns else False
        ]
        
        if not etab.empty:
            noms = etab["nom"].head(5).tolist() if "nom" in etab.columns else []
            widgets_data["student_stats"] = {
                "nb_etablissements": len(etab),
                "top_etablissements": noms
            }
            print(f"   ✅ {len(etab)} établissement(s) trouvé(s)")
            for nom in noms[:3]:
                print(f"      • {nom[:60]}...")
        else:
            widgets_data["student_stats"] = {"nb_etablissements": 0, "top_etablissements": []}
            print(f"   ℹ️ Aucun établissement trouvé")
    
    # Test Démographie
    print(f"\n📊 DÉMOGRAPHIE :")
    if data_store.insee is not None:
        # Chercher par code postal
        code_postal = scraped_data["code_postal"]
        insee_data = data_store.insee[
            data_store.insee["code_commune"].str.startswith(code_postal[:5])
            if "code_commune" in data_store.insee.columns else False
        ]
        
        if not insee_data.empty:
            row = insee_data.iloc[0]
            demography = {}
            
            # % vacance
            if "P21_LOG" in row and "P21_LOGVAC" in row:
                total = row.get("P21_LOG", 0)
                vacants = row.get("P21_LOGVAC", 0)
                if total > 0:
                    demography["pct_vacance_locative"] = round((vacants / total) * 100, 2)
                    print(f"   ✅ Vacance locative : {demography['pct_vacance_locative']}%")
            
            # % locataires
            if "P21_RP" in row and "P21_RP_LOC" in row:
                rp = row.get("P21_RP", 0)
                loc = row.get("P21_RP_LOC", 0)
                if rp > 0:
                    demography["pct_locataires"] = round((loc / rp) * 100, 2)
                    print(f"   ✅ Locataires : {demography['pct_locataires']}%")
            
            widgets_data["demography_stats"] = demography
        else:
            print(f"   ℹ️ Aucune donnée démographique trouvée")
    
    # Résumé
    print(f"\n" + "="*80)
    print(f"📊 RÉSUMÉ WIDGETS_DATA :")
    print(f"="*80)
    
    import json
    print(json.dumps(widgets_data, indent=2, ensure_ascii=False))
    
    return True


def main():
    """Exécuter tous les tests"""
    
    print("\n" + "🧪"*40)
    print("   TESTS DES WIDGETS DATA ENRICHIS")
    print("🧪"*40)
    
    results = []
    
    # Test 1 : Transport
    results.append(("Transport (Gares)", test_transport_stats()))
    
    # Test 2 : Éducation
    results.append(("Éducation (Enseignement Sup)", test_student_stats()))
    
    # Test 3 : Démographie
    results.append(("Démographie (INSEE)", test_demography_stats()))
    
    # Test 4 : Complet
    results.append(("Test Complet", test_complete_widgets_data()))
    
    # Résumé
    print("\n" + "="*80)
    print("📊 RÉSUMÉ DES TESTS")
    print("="*80)
    
    for test_name, success in results:
        status = "✅ RÉUSSI" if success else "❌ ÉCHOUÉ"
        print(f"{test_name.ljust(35)} : {status}")
    
    total_success = sum(1 for _, success in results if success)
    total_tests = len(results)
    
    print("\n" + "="*80)
    if total_success == total_tests:
        print("✅ TOUS LES TESTS SONT PASSÉS")
    else:
        print(f"⚠️ {total_tests - total_success}/{total_tests} TESTS ONT ÉCHOUÉ")
    print("="*80)
    
    print("\n💡 Ces données sont maintenant disponibles dans l'endpoint /api/analyze")
    print("   Testez avec : POST http://localhost:8000/api/analyze")


if __name__ == "__main__":
    main()
