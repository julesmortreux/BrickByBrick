"""
Test du module de scraping
Permet de tester le scraper sans lancer l'API complète
"""

import sys
from pathlib import Path

# Ajouter le répertoire parent au path
sys.path.insert(0, str(Path(__file__).parent))

from scraper import scrape_ad, SCRAPERAPI_KEY


def test_scraper_with_url(url: str):
    """Test le scraper avec une URL donnée"""
    
    print("\n" + "="*80)
    print("🧪 TEST DU SCRAPER")
    print("="*80)
    
    if not SCRAPERAPI_KEY:
        print("\n❌ Clé ScraperAPI non configurée")
        print("\n📝 Configuration requise :")
        print("   1. Créer un fichier .env dans backend/")
        print("   2. Ajouter : SCRAPERAPI_KEY=votre_cle")
        print("   3. Obtenir une clé sur https://www.scraperapi.com/signup")
        return
    
    print(f"\n✅ Clé ScraperAPI configurée : {SCRAPERAPI_KEY[:10]}...")
    print(f"\n📍 URL à scraper :")
    print(f"   {url}")
    
    print("\n⏳ Scraping en cours (30-90 secondes)...\n")
    
    # Scraper l'annonce
    result = scrape_ad(url)
    
    # Afficher les résultats
    print("\n" + "="*80)
    print("📊 RÉSULTATS")
    print("="*80)
    
    if result["success"]:
        print("\n✅ SCRAPING RÉUSSI\n")
        
        print(f"Prix : {result['prix']:,.0f}€")
        print(f"Surface : {result['surface']}m²")
        print(f"Prix/m² : {result['prix']/result['surface']:,.0f}€/m²")
        print(f"Code postal : {result['code_postal']}")
        print(f"Ville : {result['ville'] or 'N/A'}")
        print(f"Pièces : {result['nb_pieces'] or 'N/A'}")
        
        if result.get('titre'):
            print(f"Titre : {result['titre']}")
    
    else:
        print("\n❌ SCRAPING ÉCHOUÉ\n")
        print(f"Erreur : {result.get('error', 'Erreur inconnue')}")
        
        print("\n📊 Données partielles :")
        for key, value in result.items():
            if key not in ['success', 'error', 'url'] and value:
                print(f"   {key} : {value}")
    
    print("\n" + "="*80)
    
    return result


def main():
    """Menu principal"""
    
    print("\n" + "🧪"*40)
    print("   TEST DU SCRAPER D'ANNONCES IMMOBILIÈRES")
    print("🧪"*40)
    
    # URLs de test (exemples - remplacer par de vraies URLs)
    test_urls = {
        "1": {
            "name": "Exemple SeLoger (à remplacer)",
            "url": "https://www.seloger.com/annonces/achat/appartement/paris-11eme-75/..."
        },
        "2": {
            "name": "Exemple Leboncoin (à remplacer)",
            "url": "https://www.leboncoin.fr/ventes_immobilieres/..."
        },
        "3": {
            "name": "URL personnalisée",
            "url": None  # Demander à l'utilisateur
        }
    }
    
    print("\n📋 URLs de test disponibles :")
    for key, item in test_urls.items():
        print(f"   {key}. {item['name']}")
    
    choice = input("\n👉 Choisissez une option (1-3) : ").strip()
    
    if choice in test_urls:
        if choice == "3":
            url = input("\n👉 Entrez l'URL complète : ").strip()
        else:
            url = test_urls[choice]["url"]
            print(f"\n⚠️ URL d'exemple : Remplacez par une vraie URL SeLoger")
            print(f"   URL actuelle : {url}")
            
            replace = input("\n👉 Voulez-vous entrer une vraie URL ? (o/n) : ").strip().lower()
            if replace == 'o':
                url = input("\n👉 Entrez l'URL complète : ").strip()
        
        if url and url.startswith("http"):
            # Tester le scraper
            result = test_scraper_with_url(url)
            
            # Proposer d'exporter
            if result and result["success"]:
                export = input("\n👉 Exporter le résultat en JSON ? (o/n) : ").strip().lower()
                if export == 'o':
                    import json
                    output_file = "scraping_result.json"
                    with open(output_file, 'w', encoding='utf-8') as f:
                        json.dump(result, f, indent=2, ensure_ascii=False)
                    print(f"\n✅ Résultat exporté dans : {output_file}")
        else:
            print("\n❌ URL invalide")
    else:
        print("\n❌ Choix invalide")
    
    print("\n" + "="*80)
    print("✅ Test terminé")
    print("="*80)
    print("\n💡 Pour tester via l'API HTTP :")
    print("   1. Lancez : python main.py")
    print("   2. Utilisez : POST http://localhost:8000/api/analyze")
    print("   3. Voir TEST_ANALYZE.md pour plus d'exemples")


if __name__ == "__main__":
    main()
