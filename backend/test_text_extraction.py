"""
Test des fonctions d'extraction depuis le texte (fallback ultime)
Valide que le prix et la surface sont bien extraits des titres/descriptions
"""

import sys
from pathlib import Path

# Ajouter le répertoire parent au path
sys.path.insert(0, str(Path(__file__).parent))

from scraper import extract_price_from_text, extract_surface_from_text


def test_price_extraction():
    """Test de l'extraction de prix depuis différents formats"""
    
    print("\n" + "="*80)
    print("🧪 TEST D'EXTRACTION DE PRIX")
    print("="*80)
    
    test_cases = [
        # (texte_input, prix_attendu)
        ("Appartement à vendre T3/F3 66 m² 400000 € Voltaire", 400000),
        ("Maison 150 000 € avec jardin", 150000),
        ("Vente appartement 250.000 € Paris", 250000),
        ("Prix : 1 200 000 € - Duplex", 1200000),
        ("T2 45m² 180000€ proche métro", 180000),
        ("Appartement 3 pièces 95 000€", 95000),
        ("Belle maison 450 000 € à rénover", 450000),
        ("Studio 85000 € idéal investisseur", 85000),
        ("Prix: 2 500 000 € - Villa de luxe", 2500000),
        ("Appartement neuf 320 000€ livraison 2026", 320000),
    ]
    
    success = 0
    failed = 0
    
    for texte, prix_attendu in test_cases:
        prix_extrait = extract_price_from_text(texte)
        
        if prix_extrait == prix_attendu:
            print(f"✅ '{texte[:50]}...'")
            print(f"   → Prix extrait : {prix_extrait:,.0f}€ (attendu : {prix_attendu:,.0f}€)")
            success += 1
        else:
            print(f"❌ '{texte[:50]}...'")
            print(f"   → Prix extrait : {prix_extrait} (attendu : {prix_attendu:,.0f}€)")
            failed += 1
    
    print("\n" + "-"*80)
    print(f"Résultats : {success}/{len(test_cases)} réussis, {failed} échecs")
    
    return success == len(test_cases)


def test_surface_extraction():
    """Test de l'extraction de surface depuis différents formats"""
    
    print("\n" + "="*80)
    print("🧪 TEST D'EXTRACTION DE SURFACE")
    print("="*80)
    
    test_cases = [
        # (texte_input, surface_attendue)
        ("Appartement à vendre T3/F3 66 m² 400000 € Voltaire", 66),
        ("Maison 120m² avec jardin", 120),
        ("T2 45 m2 proche métro", 45),
        ("Surface : 85 m² - 3 pièces", 85),
        ("Duplex 150m² lumineux", 150),
        ("Studio 25 m² Paris 11ème", 25),
        ("Villa 300 m² vue mer", 300),
        ("Appartement 55,5 m² rénové", 55.5),
        ("Loft 180m2 style industriel", 180),
        ("Maison surface : 95 m² + garage", 95),
    ]
    
    success = 0
    failed = 0
    
    for texte, surface_attendue in test_cases:
        surface_extraite = extract_surface_from_text(texte)
        
        if surface_extraite == surface_attendue:
            print(f"✅ '{texte[:50]}...'")
            print(f"   → Surface extraite : {surface_extraite}m² (attendu : {surface_attendue}m²)")
            success += 1
        else:
            print(f"❌ '{texte[:50]}...'")
            print(f"   → Surface extraite : {surface_extraite} (attendu : {surface_attendue}m²)")
            failed += 1
    
    print("\n" + "-"*80)
    print(f"Résultats : {success}/{len(test_cases)} réussis, {failed} échecs")
    
    return success == len(test_cases)


def test_edge_cases():
    """Test des cas limites et erreurs"""
    
    print("\n" + "="*80)
    print("🧪 TEST DES CAS LIMITES")
    print("="*80)
    
    # Cas où aucun prix ne devrait être détecté
    no_price_cases = [
        "Appartement à louer",  # Pas de prix
        "Maison 5 pièces",  # Pas de prix
        "Surface 50 m²",  # Pas de prix
        "Prix : 5 €",  # Prix trop faible (< 10000)
        "Prix : 50000000 €",  # Prix trop élevé (> 10000000)
    ]
    
    print("\n📋 Cas où AUCUN prix ne devrait être détecté :")
    success = 0
    for texte in no_price_cases:
        prix = extract_price_from_text(texte)
        if prix is None:
            print(f"✅ '{texte}' → Aucun prix (correct)")
            success += 1
        else:
            print(f"❌ '{texte}' → Prix détecté : {prix:,.0f}€ (incorrect)")
    
    # Cas où aucune surface ne devrait être détectée
    no_surface_cases = [
        "Appartement 3 pièces",  # Pas de surface
        "Prix : 150000 €",  # Pas de surface
        "Surface : 5 m²",  # Surface trop petite (< 10)
        "Surface : 600 m²",  # Surface trop grande (> 500)
    ]
    
    print("\n📋 Cas où AUCUNE surface ne devrait être détectée :")
    for texte in no_surface_cases:
        surface = extract_surface_from_text(texte)
        if surface is None:
            print(f"✅ '{texte}' → Aucune surface (correct)")
            success += 1
        else:
            print(f"❌ '{texte}' → Surface détectée : {surface}m² (incorrect)")
    
    print("\n" + "-"*80)
    print(f"Résultats : {success}/{len(no_price_cases) + len(no_surface_cases)} cas limites corrects")
    
    return success == len(no_price_cases) + len(no_surface_cases)


def test_real_world_example():
    """Test avec l'exemple réel fourni par l'utilisateur"""
    
    print("\n" + "="*80)
    print("🧪 TEST AVEC L'EXEMPLE RÉEL")
    print("="*80)
    
    titre_reel = "Appartement à vendre T3/F3 66 m² 400000 € Voltaire..."
    
    print(f"\n📝 Titre : {titre_reel}")
    
    # Extraire prix
    prix = extract_price_from_text(titre_reel)
    print(f"\n💰 Prix extrait : {prix:,.0f}€" if prix else "❌ Prix non détecté")
    
    # Extraire surface
    surface = extract_surface_from_text(titre_reel)
    print(f"📐 Surface extraite : {surface}m²" if surface else "❌ Surface non détectée")
    
    # Vérifier les résultats attendus
    success = (prix == 400000) and (surface == 66)
    
    if success:
        print("\n✅ EXEMPLE RÉEL : SUCCÈS")
        print("   Prix : 400 000€ ✅")
        print("   Surface : 66m² ✅")
    else:
        print("\n❌ EXEMPLE RÉEL : ÉCHEC")
        if prix != 400000:
            print(f"   Prix : {prix} (attendu : 400000)")
        if surface != 66:
            print(f"   Surface : {surface} (attendu : 66)")
    
    return success


def main():
    """Exécuter tous les tests"""
    
    print("\n" + "🧪"*40)
    print("   TESTS D'EXTRACTION DEPUIS LE TEXTE (FALLBACK)")
    print("🧪"*40)
    
    results = []
    
    # Test 1 : Extraction de prix
    results.append(("Extraction de prix", test_price_extraction()))
    
    # Test 2 : Extraction de surface
    results.append(("Extraction de surface", test_surface_extraction()))
    
    # Test 3 : Cas limites
    results.append(("Cas limites", test_edge_cases()))
    
    # Test 4 : Exemple réel
    results.append(("Exemple réel", test_real_world_example()))
    
    # Résumé
    print("\n" + "="*80)
    print("📊 RÉSUMÉ DES TESTS")
    print("="*80)
    
    for test_name, success in results:
        status = "✅ RÉUSSI" if success else "❌ ÉCHOUÉ"
        print(f"{test_name.ljust(30)} : {status}")
    
    total_success = sum(1 for _, success in results if success)
    total_tests = len(results)
    
    print("\n" + "="*80)
    if total_success == total_tests:
        print("✅ TOUS LES TESTS SONT PASSÉS")
    else:
        print(f"⚠️ {total_tests - total_success}/{total_tests} TESTS ONT ÉCHOUÉ")
    print("="*80)
    
    print("\n💡 Ces fonctions sont utilisées comme fallback ultime dans scraper.py")
    print("   Elles s'activent automatiquement si les méthodes classiques échouent.")


if __name__ == "__main__":
    main()
