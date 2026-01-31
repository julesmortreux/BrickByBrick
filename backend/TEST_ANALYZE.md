# 🔍 Test de l'Endpoint d'Analyse d'Annonce

Guide pour tester l'endpoint `POST /api/analyze` qui scrape et analyse des annonces immobilières.

---

## ⚙️ Configuration Préalable

### 1. Obtenir une Clé ScraperAPI

```
1. Créer un compte gratuit : https://www.scraperapi.com/signup
2. Copier votre clé API depuis le dashboard
3. Vous avez 1000 crédits gratuits/mois
```

### 2. Configurer la Clé

Créer un fichier `.env` dans le dossier `backend/` :

```bash
# backend/.env
SCRAPERAPI_KEY=votre_cle_api_ici
```

**Exemple** :
```bash
SCRAPERAPI_KEY=e0656f0e3153e7300155e3a4ca342545
```

---

## 🚀 Lancer l'API

```bash
cd backend
python main.py
```

L'API sera disponible sur http://localhost:8000

---

## 🧪 Test 1 : Analyse Complète d'une Annonce

### Requête cURL

```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.seloger.com/annonces/achat/appartement/paris-11eme-75/..."
  }'
```

### Requête Python

```python
import requests
import json

url = "https://www.seloger.com/annonces/achat/appartement/..."

response = requests.post(
    "http://localhost:8000/api/analyze",
    json={"url": url},
    timeout=120  # Peut prendre jusqu'à 90s
)

if response.status_code == 200:
    result = response.json()
    
    print("\n" + "="*80)
    print("📊 RÉSULTATS DE L'ANALYSE")
    print("="*80)
    
    # Données scrapées
    scraped = result["scraped_data"]
    print(f"\n🔍 SCRAPING :")
    print(f"   Prix : {scraped['prix']:,.0f}€")
    print(f"   Surface : {scraped['surface']}m²")
    print(f"   Code postal : {scraped['code_postal']}")
    print(f"   Ville : {scraped['ville']}")
    
    # Données du marché
    widgets = result["widgets_data"]
    if widgets["dvf_stats"]:
        dvf = widgets["dvf_stats"]
        print(f"\n📈 MARCHÉ LOCAL (DVF) :")
        print(f"   Prix médian : {dvf['prix_m2_median']:,.0f}€/m²")
        print(f"   Écart vs médiane : {dvf['comparaison']['ecart_vs_median_pct']:.1f}%")
    
    if widgets["loyers_stats"]:
        loyers = widgets["loyers_stats"]
        print(f"\n💰 LOYERS :")
        print(f"   Loyer estimé : {loyers['loyer_mensuel_estime']:,.0f}€/mois")
        print(f"   Rendement brut : {loyers['rendement_brut_estime']:.2f}%")
    
    # Transport
    if widgets["transport_stats"]:
        transport = widgets["transport_stats"]
        print(f"\n🚄 TRANSPORT :")
        print(f"   Gares : {transport['nb_gares']}")
        if transport['noms_gares']:
            for gare in transport['noms_gares'][:3]:
                print(f"      • {gare}")
    
    # Éducation
    if widgets["student_stats"]:
        student = widgets["student_stats"]
        print(f"\n🎓 ÉDUCATION :")
        print(f"   Établissements sup : {student['nb_etablissements']}")
        if student['top_etablissements']:
            for etab in student['top_etablissements'][:3]:
                print(f"      • {etab[:50]}...")
    
    # Démographie
    if widgets["demography_stats"]:
        demo = widgets["demography_stats"]
        print(f"\n📊 DÉMOGRAPHIE :")
        if demo.get('pct_vacance_locative'):
            print(f"   Vacance locative : {demo['pct_vacance_locative']}%")
        if demo.get('pct_locataires'):
            print(f"   Locataires : {demo['pct_locataires']}%")
    
    # Simulation financière
    financial = result["financial_result"]
    print(f"\n💵 SIMULATION FINANCIÈRE :")
    print(f"   Mensualité : {financial['mensualite_totale']:,.0f}€")
    print(f"   Cashflow net : {financial['cashflow_mensuel_net']:,.0f}€")
    print(f"   Rentabilité nette : {financial['rentabilite_nette']:.2f}%")
    print(f"   Score : {financial['score_investissement']:.1f}/100")
    print(f"   Verdict : {financial['verdict']}")
    
    # Résumé
    summary = result["summary"]
    print(f"\n🎯 RÉSUMÉ :")
    print(f"   {'✅ AUTOFINANCEMENT' if summary['autofinancement'] else '⚠️ EFFORT ÉPARGNE'}")
    
    print("\n" + "="*80)
else:
    print(f"❌ Erreur : {response.status_code}")
    print(response.json())
```

---

## 📊 Exemple de Réponse Complète

```json
{
  "success": true,
  
  "scraped_data": {
    "url": "https://www.seloger.com/...",
    "prix": 280000,
    "surface": 45,
    "code_postal": "75011",
    "ville": "Paris 11ème",
    "nb_pieces": 2,
    "titre": "Appartement 2 pièces à Paris 11ème",
    "success": true,
    "error": null
  },
  
  "widgets_data": {
    "code_postal": "75011",
    "departement": "75",
    
    "dvf_stats": {
      "prix_m2_median": 10500,
      "prix_m2_mean": 11200,
      "nb_ventes": 1523,
      "comparaison": {
        "prix_m2_annonce": 6222.22,
        "ecart_vs_median_pct": -40.7
      }
    },
    
    "insee_stats": {
      "tension_locative": "Forte",
      "taux_vacance": 6.2,
      "part_locataires": 62.5
    },
    
    "loyers_stats": {
      "loyer_m2_median": 28.50,
      "loyer_mensuel_estime": 1282.50,
      "rendement_brut_estime": 5.49
    },
    
    "transport_stats": {
      "nb_gares": 3,
      "noms_gares": [
        "Paris Gare de Lyon",
        "Paris Gare d'Austerlitz",
        "Paris Bercy"
      ]
    },
    
    "student_stats": {
      "nb_etablissements": 15,
      "top_etablissements": [
        "Université Paris-Sorbonne",
        "École Polytechnique",
        "Sciences Po Paris",
        "ESCP Business School",
        "Université Paris-Dauphine"
      ]
    },
    
    "demography_stats": {
      "pct_vacance_locative": 6.2,
      "pct_locataires": 62.5,
      "logements_total": 125000,
      "logements_vacants": 7750,
      "residences_principales": 110000,
      "locataires": 68750
    }
  },
  
  "financial_result": {
    "prix_achat": 280000,
    "surface": 45,
    "cout_total_projet": 310500,
    "mensualite_totale": 1685,
    "loyer_mensuel_brut": 1282.50,
    "cashflow_mensuel_net": -520,
    "rentabilite_brute": 5.49,
    "rentabilite_nette": 2.15,
    "score_investissement": 42.5,
    "verdict": "Investissement risqué",
    "autofinancement": false,
    "conseils": [
      "❌ Rentabilité faible (2.15%). Risque de perte à long terme.",
      "❌ Effort d'épargne important (520€/mois). Négociez le prix ou augmentez l'apport."
    ]
  },
  
  "summary": {
    "url": "https://www.seloger.com/...",
    "prix": 280000,
    "surface": 45,
    "localisation": "Paris 11ème (75011)",
    "score_investissement": 42.5,
    "verdict": "Investissement risqué",
    "cashflow_mensuel": -520,
    "rentabilite_nette": 2.15,
    "autofinancement": false
  }
}
```

---

## 🧪 Test 2 : Gestion des Erreurs

### Test : URL invalide

```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/invalid"
  }'
```

**Réponse attendue :**
```json
{
  "detail": {
    "error": "Échec du scraping",
    "message": "Prix non trouvé dans l'annonce"
  }
}
```

### Test : Clé ScraperAPI manquante

Si `.env` n'est pas configuré :

**Réponse attendue :**
```json
{
  "detail": {
    "error": "Échec du scraping",
    "message": "Clé ScraperAPI non configurée..."
  }
}
```

---

## 🎯 Cas d'Usage Réels

### Cas 1 : Bien en banlieue (bon investissement)

```python
url_banlieue = "https://www.seloger.com/annonces/achat/appartement/marseille-13/..."

response = requests.post(
    "http://localhost:8000/api/analyze",
    json={"url": url_banlieue},
    timeout=120
)

result = response.json()
print(f"Score : {result['summary']['score_investissement']:.1f}/100")
# Output attendu : Score : 75-85/100 (bon investissement)
```

### Cas 2 : Bien à Paris (faible rentabilité)

```python
url_paris = "https://www.seloger.com/annonces/achat/appartement/paris-17/..."

response = requests.post(
    "http://localhost:8000/api/analyze",
    json={"url": url_paris},
    timeout=120
)

result = response.json()
print(f"Score : {result['summary']['score_investissement']:.1f}/100")
# Output attendu : Score : 35-50/100 (risqué)
```

---

## 📊 Swagger UI (Interface Interactive)

1. Ouvrir http://localhost:8000/docs
2. Trouver `POST /api/analyze`
3. Cliquer sur "Try it out"
4. Entrer une URL d'annonce
5. Exécuter
6. Voir la réponse complète

---

## ⏱️ Temps de Réponse

| Étape | Durée |
|-------|-------|
| Scraping via ScraperAPI | 30-90s |
| Analyse des données | 1-2s |
| Simulation financière | <1s |
| **TOTAL** | **35-95s** |

💡 **Astuce** : Le temps dépend de la complexité du site et du rendu JavaScript.

---

## 🔍 Données Retournées

### scraped_data
Données extraites de l'annonce :
- `prix`, `surface`, `code_postal`, `ville`, `nb_pieces`

### widgets_data
Statistiques du marché local :
- **DVF** : Prix médian, nombre de ventes, comparaison
- **INSEE** : Tension locative, taux de vacance
- **Loyers** : Loyer estimé, rendement brut

### financial_result
Simulation financière complète :
- Mensualité, cashflow, rentabilité
- Score /100 avec verdict
- Conseils personnalisés

---

## 💡 Conseils d'Utilisation

### Pour maximiser le taux de réussite

1. **URLs supportées** :
   - SeLoger (recommandé)
   - Leboncoin
   - PAP
   - Autres sites avec métadonnées structurées

2. **Vérifier la structure** :
   - L'annonce doit être une page détaillée (pas une liste)
   - L'annonce doit contenir prix, surface, localisation

3. **Gestion du timeout** :
   - Augmenter le timeout à 120s minimum
   - ScraperAPI peut prendre jusqu'à 90s pour rendre le JavaScript

### En cas d'échec du scraping

1. **Vérifier les logs du serveur** pour voir les détails
2. **Tester l'URL manuellement** dans un navigateur
3. **Vérifier la clé ScraperAPI** (crédits restants)
4. **Réessayer** (les sites peuvent être temporairement down)

---

## 🐛 Dépannage

### Erreur : "Clé ScraperAPI non configurée"

➡️ Créer le fichier `.env` avec `SCRAPERAPI_KEY=votre_cle`

### Erreur : "Limite de requêtes ScraperAPI atteinte"

➡️ Vous avez dépassé les 1000 crédits gratuits. Attendez le mois prochain ou passez à un plan payant.

### Erreur : "Prix non trouvé dans l'annonce"

➡️ Le site est trop complexe ou utilise des protections avancées. Essayez une autre annonce ou un autre site.

### Le scraping prend plus de 90s

➡️ Normal pour certains sites. Augmentez le timeout de la requête HTTP à 120s.

---

## 📦 Coût ScraperAPI

| Action | Crédits | Coût (plan gratuit) |
|--------|---------|---------------------|
| 1 scraping (render=true) | 5-10 crédits | $0 |
| **1000 crédits/mois** | **Gratuit** | **$0** |
| Au-delà | 1000 crédits | ~$49/mois |

💡 **Optimisation** : 1000 crédits = 100-200 annonces/mois

---

**Version :** 1.0.0  
**Dernière mise à jour :** Janvier 2026
