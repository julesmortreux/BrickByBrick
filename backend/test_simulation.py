"""
Script de test rapide pour l'endpoint de simulation
Permet de tester sans lancer l'API complète
"""

import sys
from pathlib import Path

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, str(Path(__file__).parent))

from schemas import SimulationRequest, EtatBien, TypeBien
from finance import simuler_investissement
from data_loader import load_data

def test_simulation_minimal():
    """Test avec les paramètres minimaux (auto-estimation)"""
    print("\n" + "="*80)
    print("🧪 TEST 1 : SIMULATION MINIMALE (Auto-estimation)")
    print("="*80)
    
    request = SimulationRequest(
        prix=150000,
        surface=45,
        code_postal="75001"
    )
    
    # Charger les données pour l'estimation du loyer
    data_store = load_data()
    
    # Simuler
    result = simuler_investissement(request, loyers_df=data_store.loyers)
    
    print("\n📊 RÉSULTATS CLÉS :")
    print(f"   Coût total projet : {result.cout_total_projet:,.0f}€")
    print(f"   Mensualité totale : {result.mensualite_totale:,.0f}€")
    print(f"   Loyer estimé : {result.loyer_mensuel_brut:,.0f}€/mois")
    print(f"   Rentabilité nette : {result.rentabilite_nette:.2f}%")
    print(f"   Cashflow mensuel net : {result.cashflow_mensuel_net:,.0f}€")
    print(f"   Score : {result.score_investissement:.1f}/100")
    print(f"   Verdict : {result.verdict}")
    print(f"   Autofinancement : {'✅ OUI' if result.autofinancement else '❌ NON'}")
    
    return result


def test_simulation_complete():
    """Test avec tous les paramètres fournis"""
    print("\n" + "="*80)
    print("🧪 TEST 2 : SIMULATION COMPLÈTE (Tous paramètres)")
    print("="*80)
    
    request = SimulationRequest(
        prix=180000,
        surface=55,
        code_postal="69001",
        type_bien=TypeBien.APPARTEMENT,
        etat_bien=EtatBien.ANCIEN,
        nb_pieces=3,
        apport=30000,
        duree_credit=20,
        taux_interet=3.5,
        loyer_mensuel=1100,
        charges_copro=120,
        taxe_fonciere=900,
        travaux=15000,
        gestion_locative=True,
        taux_gestion=8.0,
        vacance_locative_mois=1.0
    )
    
    # Charger les données
    data_store = load_data()
    
    # Simuler
    result = simuler_investissement(request, loyers_df=data_store.loyers)
    
    print("\n📊 RÉSULTATS CLÉS :")
    print(f"   Coût total projet : {result.cout_total_projet:,.0f}€")
    print(f"   Frais de notaire : {result.frais_notaire:,.0f}€")
    print(f"   Mensualité totale : {result.mensualite_totale:,.0f}€")
    print(f"   Loyer mensuel : {result.loyer_mensuel_brut:,.0f}€")
    print(f"   Charges totales : {result.charges_totales_mensuel:,.0f}€/mois")
    print(f"   Rentabilité brute : {result.rentabilite_brute:.2f}%")
    print(f"   Rentabilité nette : {result.rentabilite_nette:.2f}%")
    print(f"   Rentabilité nette-nette : {result.rentabilite_nette_nette:.2f}%")
    print(f"   Cashflow mensuel net : {result.cashflow_mensuel_net:,.0f}€")
    print(f"   Score : {result.score_investissement:.1f}/100")
    print(f"   Verdict : {result.verdict}")
    
    print("\n💡 CONSEILS :")
    for conseil in result.conseils:
        print(f"   • {conseil}")
    
    return result


def test_comparaison_biens():
    """Test de comparaison de plusieurs biens"""
    print("\n" + "="*80)
    print("🧪 TEST 3 : COMPARAISON DE 3 BIENS")
    print("="*80)
    
    biens = [
        {
            "nom": "T2 Paris 11e",
            "params": SimulationRequest(
                prix=280000,
                surface=38,
                code_postal="75011"
            )
        },
        {
            "nom": "T3 Lyon 1er",
            "params": SimulationRequest(
                prix=180000,
                surface=55,
                code_postal="69001"
            )
        },
        {
            "nom": "T2 Marseille",
            "params": SimulationRequest(
                prix=120000,
                surface=45,
                code_postal="13001"
            )
        }
    ]
    
    # Charger les données une fois
    data_store = load_data()
    
    resultats = []
    
    for bien in biens:
        print(f"\n📊 {bien['nom']}...")
        result = simuler_investissement(bien['params'], loyers_df=data_store.loyers)
        resultats.append({
            "Bien": bien['nom'],
            "Prix": bien['params'].prix,
            "Cashflow": result.cashflow_mensuel_net,
            "Rentabilité": result.rentabilite_nette,
            "Score": result.score_investissement,
            "Auto": "✅" if result.autofinancement else "❌"
        })
    
    # Afficher tableau comparatif
    print("\n" + "="*80)
    print("📊 TABLEAU COMPARATIF")
    print("="*80)
    print(f"{'Bien':<20} {'Prix':>12} {'Cashflow':>12} {'Renta%':>10} {'Score':>8} {'Auto':>6}")
    print("-"*80)
    for r in resultats:
        print(f"{r['Bien']:<20} {r['Prix']:>12,}€ {r['Cashflow']:>11,.0f}€ {r['Rentabilité']:>9.2f}% {r['Score']:>7.1f} {r['Auto']:>6}")
    
    # Meilleur investissement
    best = max(resultats, key=lambda x: x['Score'])
    print("\n🏆 MEILLEUR INVESTISSEMENT :")
    print(f"   {best['Bien']} avec un score de {best['Score']:.1f}/100")
    
    return resultats


if __name__ == "__main__":
    """Exécuter tous les tests"""
    
    print("\n" + "🧪"*40)
    print("   TESTS DU MOTEUR DE SIMULATION FINANCIÈRE")
    print("🧪"*40)
    
    try:
        # Test 1 : Simulation minimale
        result1 = test_simulation_minimal()
        
        # Test 2 : Simulation complète
        result2 = test_simulation_complete()
        
        # Test 3 : Comparaison de biens
        result3 = test_comparaison_biens()
        
        print("\n" + "="*80)
        print("✅ TOUS LES TESTS SONT PASSÉS")
        print("="*80)
        print("\n💡 Pour tester via l'API HTTP :")
        print("   1. Lancez : python main.py")
        print("   2. Ouvrez : http://localhost:8000/docs")
        print("   3. Testez l'endpoint POST /api/simulate")
        print("\n📚 Voir TEST_API.md pour plus d'exemples")
        
    except Exception as e:
        print("\n" + "="*80)
        print("❌ ERREUR LORS DES TESTS")
        print("="*80)
        print(f"   {str(e)}")
        import traceback
        traceback.print_exc()
