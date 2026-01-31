"""
Test automatisé de l'endpoint GET /api/market-data
Valide les données retournées pour chaque scope
"""

import requests
import sys
from typing import Dict, Any


# ============================================================================
# CONFIGURATION
# ============================================================================

BASE_URL = "http://localhost:8000"
ENDPOINT = f"{BASE_URL}/api/market-data"


# ============================================================================
# FONCTIONS DE TEST
# ============================================================================

def test_health_check():
    """Test préliminaire : vérifier que l'API est accessible"""
    print("\n🔍 Test 0 : Health Check")
    print("=" * 80)
    
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        
        if response.status_code != 200:
            print(f"❌ API inaccessible (status {response.status_code})")
            return False
        
        data = response.json()
        
        if data["api_status"] != "healthy":
            print(f"⚠️ API Status : {data['api_status']}")
            print(f"   Datasets chargés : {data['loaded_count']}/{data['total_count']}")
            
            if data["api_status"] == "unhealthy":
                print("❌ Aucune donnée chargée, impossible de continuer les tests")
                return False
        
        print("✅ API opérationnelle")
        print(f"   Datasets chargés : {data['loaded_count']}/{data['total_count']}")
        return True
    
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter à l'API")
        print(f"   Vérifiez que le serveur tourne sur {BASE_URL}")
        return False
    except Exception as e:
        print(f"❌ Erreur : {e}")
        return False


def test_scope_france_only():
    """Test 1 : Données nationales uniquement"""
    print("\n🔍 Test 1 : Scope France Uniquement")
    print("=" * 80)
    
    try:
        response = requests.get(ENDPOINT, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Erreur HTTP {response.status_code}")
            print(response.text)
            return False
        
        data = response.json()
        
        # Vérifications
        checks = {
            "scope_france existe": "scope_france" in data,
            "scope_departement est null": data.get("scope_departement") is None,
            "scope_city est null": data.get("scope_city") is None,
            "heatmap_tension non vide": len(data["scope_france"]["heatmap_tension"]) > 0,
            "rendement_departements non vide": len(data["scope_france"]["rendement_departements"]) > 0,
            "metadata existe": "metadata" in data
        }
        
        # Affichage des résultats
        all_passed = True
        for check_name, result in checks.items():
            status = "✅" if result else "❌"
            print(f"{status} {check_name}")
            if not result:
                all_passed = False
        
        # Stats
        if all_passed:
            print(f"\n📊 Stats :")
            print(f"   Départements tension : {len(data['scope_france']['heatmap_tension'])}")
            print(f"   Départements rendement : {len(data['scope_france']['rendement_departements'])}")
            
            # Top 3 rendements
            top3 = data['scope_france']['rendement_departements'][:3]
            print(f"\n🏆 Top 3 Rendements :")
            for dept in top3:
                print(f"   {dept['departement']} : {dept['rendement_brut_pct']}%")
        
        return all_passed
    
    except Exception as e:
        print(f"❌ Erreur : {e}")
        return False


def test_scope_france_with_budget():
    """Test 2 : Données nationales + filtre budget"""
    print("\n🔍 Test 2 : Scope France + Budget")
    print("=" * 80)
    
    try:
        params = {"budget_max": 150000, "nb_pieces": 2}
        response = requests.get(ENDPOINT, params=params, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Erreur HTTP {response.status_code}")
            return False
        
        data = response.json()
        
        # Vérifications
        checks = {
            "carte_budget_accessible existe": data["scope_france"].get("carte_budget_accessible") is not None,
            "carte_budget_accessible non vide": len(data["scope_france"].get("carte_budget_accessible", [])) > 0
        }
        
        all_passed = True
        for check_name, result in checks.items():
            status = "✅" if result else "❌"
            print(f"{status} {check_name}")
            if not result:
                all_passed = False
        
        if all_passed:
            nb_zones = len(data['scope_france']['carte_budget_accessible'])
            print(f"\n📊 Stats :")
            print(f"   Zones accessibles (≤ 150k€, T2) : {nb_zones}")
            
            if nb_zones > 0:
                # Top 3 zones les plus accessibles
                top3 = sorted(
                    data['scope_france']['carte_budget_accessible'],
                    key=lambda x: x['pct_access'],
                    reverse=True
                )[:3]
                print(f"\n🏆 Top 3 Zones les plus accessibles :")
                for zone in top3:
                    print(f"   {zone['code_postal']} : {zone['pct_access']:.1f}% ≤ budget")
        
        return all_passed
    
    except Exception as e:
        print(f"❌ Erreur : {e}")
        return False


def test_scope_departement():
    """Test 3 : Scope départemental (Rhône - 69)"""
    print("\n🔍 Test 3 : Scope Département (69 - Rhône)")
    print("=" * 80)
    
    try:
        params = {"departement": "69", "budget_max": 180000}
        response = requests.get(ENDPOINT, params=params, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Erreur HTTP {response.status_code}")
            return False
        
        data = response.json()
        
        # Vérifications
        dept = data.get("scope_departement")
        checks = {
            "scope_departement existe": dept is not None,
            "code département correct": dept and dept.get("code") == "69",
            "evolution_prix non vide": dept and len(dept.get("evolution_prix_2020_2024", [])) > 0,
            "indice_achat_location existe": dept and dept.get("indice_achat_location") is not None,
            "repartition_taille existe": dept and dept.get("repartition_taille_budget") is not None
        }
        
        all_passed = True
        for check_name, result in checks.items():
            status = "✅" if result else "❌"
            print(f"{status} {check_name}")
            if not result:
                all_passed = False
        
        if all_passed and dept:
            print(f"\n📊 Stats Département 69 :")
            print(f"   Années évolution : {len(dept['evolution_prix_2020_2024'])}")
            
            if dept.get("variation_5ans_pct"):
                print(f"   Variation 5 ans : {dept['variation_5ans_pct']:.2f}%")
            
            if dept.get("indice_achat_location"):
                indice = dept["indice_achat_location"]
                interpretation = "Marché acheteur" if indice < 15 else ("Équilibré" if indice < 20 else "Marché locataire")
                print(f"   Indice achat/location : {indice:.2f} ({interpretation})")
            
            if dept.get("repartition_taille_budget"):
                repartition = dept["repartition_taille_budget"]
                print(f"\n   Répartition par taille (≤ 180k€) :")
                for pieces, info in repartition["distribution"].items():
                    print(f"      {pieces} : {info['count']} biens ({info['pct']}%)")
        
        return all_passed
    
    except Exception as e:
        print(f"❌ Erreur : {e}")
        return False


def test_scope_city():
    """Test 4 : Scope local (Lyon 1er - 69001)"""
    print("\n🔍 Test 4 : Scope City (69001 - Lyon 1er)")
    print("=" * 80)
    
    try:
        params = {"code_postal": "69001", "departement": "69"}
        response = requests.get(ENDPOINT, params=params, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Erreur HTTP {response.status_code}")
            return False
        
        data = response.json()
        
        # Vérifications
        city = data.get("scope_city")
        checks = {
            "scope_city existe": city is not None,
            "code postal correct": city and city.get("code_postal") == "69001",
            "gares liste": city and isinstance(city.get("gares"), list),
            "market_tension existe": city and city.get("market_tension") is not None,
            "prix_marche existe": city and city.get("prix_marche") is not None
        }
        
        all_passed = True
        for check_name, result in checks.items():
            status = "✅" if result else "❌"
            print(f"{status} {check_name}")
            if not result:
                all_passed = False
        
        if all_passed and city:
            print(f"\n📊 Stats Lyon 1er :")
            
            # Gares
            if city.get("gares"):
                print(f"   Gares proches : {len(city['gares'])}")
                for gare in city['gares'][:3]:
                    print(f"      • {gare['nom_gare']} ({gare['distance_km']} km)")
            
            # Tension
            if city.get("market_tension"):
                tension = city["market_tension"]
                print(f"\n   Tension locative : {tension['niveau']} ({tension['taux_vacance']}% vacance)")
                print(f"   Locataires : {tension['part_locataires']}%")
            
            # Prix
            if city.get("prix_marche"):
                prix = city["prix_marche"]
                if prix.get("prix_m2_median"):
                    print(f"\n   Prix/m² médian : {prix['prix_m2_median']:,.0f}€")
                if prix.get("loyer_m2_median"):
                    print(f"   Loyer/m² médian : {prix['loyer_m2_median']:.2f}€")
        
        return all_passed
    
    except Exception as e:
        print(f"❌ Erreur : {e}")
        return False


def test_response_structure():
    """Test 5 : Structure de la réponse"""
    print("\n🔍 Test 5 : Structure de la Réponse")
    print("=" * 80)
    
    try:
        params = {"code_postal": "69001", "departement": "69", "budget_max": 150000}
        response = requests.get(ENDPOINT, params=params, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Erreur HTTP {response.status_code}")
            return False
        
        data = response.json()
        
        # Vérifications de structure
        checks = {
            "scope_france": "scope_france" in data,
            "scope_departement": "scope_departement" in data,
            "scope_city": "scope_city" in data,
            "user_profile_tools": "user_profile_tools" in data,
            "metadata": "metadata" in data,
            "metadata.version": data.get("metadata", {}).get("version") is not None,
            "metadata.timestamp": data.get("metadata", {}).get("timestamp") is not None,
            "metadata.sources": data.get("metadata", {}).get("sources") is not None
        }
        
        all_passed = True
        for check_name, result in checks.items():
            status = "✅" if result else "❌"
            print(f"{status} {check_name}")
            if not result:
                all_passed = False
        
        if all_passed:
            print(f"\n📊 Métadonnées :")
            meta = data["metadata"]
            print(f"   Version : {meta['version']}")
            print(f"   Timestamp : {meta['timestamp']}")
            print(f"   Sources : {', '.join(meta['sources'].keys())}")
        
        return all_passed
    
    except Exception as e:
        print(f"❌ Erreur : {e}")
        return False


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Exécute tous les tests"""
    print("\n" + "🧪" * 40)
    print("   TESTS AUTOMATISÉS - GET /api/market-data")
    print("🧪" * 40)
    
    # Test préliminaire
    if not test_health_check():
        print("\n❌ Health check échoué, impossible de continuer")
        sys.exit(1)
    
    # Tests principaux
    tests = [
        ("Scope France uniquement", test_scope_france_only),
        ("Scope France + Budget", test_scope_france_with_budget),
        ("Scope Département", test_scope_departement),
        ("Scope City", test_scope_city),
        ("Structure Réponse", test_response_structure)
    ]
    
    results = []
    for test_name, test_func in tests:
        result = test_func()
        results.append((test_name, result))
    
    # Résumé
    print("\n" + "=" * 80)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 80)
    
    total_tests = len(results)
    passed_tests = sum(1 for _, result in results if result)
    
    for test_name, result in results:
        status = "✅ RÉUSSI" if result else "❌ ÉCHOUÉ"
        print(f"{test_name.ljust(35)} : {status}")
    
    print("=" * 80)
    if passed_tests == total_tests:
        print(f"✅ TOUS LES TESTS SONT PASSÉS ({passed_tests}/{total_tests})")
    else:
        print(f"⚠️ {total_tests - passed_tests}/{total_tests} TESTS ONT ÉCHOUÉ")
    print("=" * 80)
    
    print("\n💡 Pour plus de détails sur l'API, consultez :")
    print("   • Swagger UI : http://localhost:8000/docs")
    print("   • TEST_MARKET_DATA.md")
    
    # Exit code
    sys.exit(0 if passed_tests == total_tests else 1)


if __name__ == "__main__":
    main()
