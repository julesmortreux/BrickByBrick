# 🔍 Module de Scraping - Documentation

Système de scraping d'annonces immobilières avec ScraperAPI pour contourner les protections anti-bot.

---

## 📋 Fichiers du Module

| Fichier | Description |
|---------|-------------|
| `scraper.py` | Module de scraping (extraction des données) |
| `main.py` | Endpoint `/api/analyze` (scraping + analyse complète) |
| `test_scraper.py` | Script de test standalone |
| `TEST_ANALYZE.md` | Guide de test de l'API |
| `env.example` | Template de configuration |

---

## ⚙️ Configuration

### 1. Obtenir une Clé ScraperAPI

```
1. Créer un compte gratuit : https://www.scraperapi.com/signup
2. Copier votre clé API depuis le dashboard
3. Plan gratuit : 1000 crédits/mois (~100-200 annonces)
```

### 2. Configurer la Clé

Créer un fichier `.env` dans `backend/` :

```bash
# backend/.env
SCRAPERAPI_KEY=votre_cle_api_ici
```

---

## 🚀 Utilisation

### Option 1 : Via l'API (Recommandé)

```bash
# Terminal 1 : Lancer l'API
cd backend
python main.py

# Terminal 2 : Tester l'endpoint
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.seloger.com/annonces/achat/..."}'
```

### Option 2 : Script Standalone

```bash
cd backend
python test_scraper.py
```

### Option 3 : Import Direct

```python
from scraper import scrape_ad

result = scrape_ad("https://www.seloger.com/annonces/achat/...")

if result["success"]:
    print(f"Prix : {result['prix']}€")
    print(f"Surface : {result['surface']}m²")
else:
    print(f"Erreur : {result['error']}")
```

---

## 📊 Fonctionnalités

### Extraction Automatique

Le scraper extrait automatiquement :

✅ **Prix** - Prix d'achat du bien  
✅ **Surface** - Surface habitable (m²)  
✅ **Code Postal** - Pour localisation  
✅ **Ville** - Nom de la commune  
✅ **Nombre de Pièces** - T1, T2, T3, etc.  
✅ **Titre** - Titre de l'annonce  

### Méthodes d'Extraction (Par Ordre de Priorité)

1. **JSON-LD** (le plus fiable)
   - Métadonnées structurées
   - Format standard du web sémantique

2. **OpenGraph** (fallback)
   - Balises `og:*` pour réseaux sociaux
   - Souvent présentes sur les sites modernes

3. **Patterns Regex HTML** (fallback 2)
   - Recherche dans le HTML brut
   - Patterns pour `"price":`, `data-price=`, etc.

4. **Extraction Textuelle** (fallback ultime) ✨ **NOUVEAU**
   - Analyse du titre et de la description
   - Détecte les prix au format "400 000 €" ou "400000€"
   - Détecte les surfaces au format "66 m²" ou "66m²"
   - S'active automatiquement si les autres méthodes échouent

### Sites Supportés

| Site | Support | Notes |
|------|---------|-------|
| **SeLoger** | ✅ Excellent | JSON-LD complet |
| **Leboncoin** | ✅ Bon | OpenGraph + patterns |
| **PAP** | ✅ Bon | JSON-LD partiel |
| **Autres** | ⚠️ Variable | Dépend des métadonnées |

---

## 🔄 Workflow de l'Endpoint `/api/analyze`

```
1. SCRAPING (30-90s)
   ├─ Requête via ScraperAPI (render=true)
   ├─ Extraction des données (BeautifulSoup)
   └─ Validation (prix, surface, code postal)

2. WIDGETS DATA (1-2s)
   ├─ Stats DVF (prix médian, nombre de ventes)
   ├─ Stats INSEE (tension locative, vacance)
   └─ Stats Loyers (loyer estimé, rendement)

3. SIMULATION (< 1s)
   ├─ Calcul mensualité, cashflow
   ├─ Rentabilité brute, nette, nette-nette
   └─ Score /100 avec conseils

4. RÉPONSE COMPLÈTE
   └─ JSON structuré avec toutes les données
```

---

## 🎯 Fallback Ultime : Extraction Textuelle

### Pourquoi ?

Certains sites n'utilisent pas de métadonnées structurées et affichent le prix/surface uniquement dans le titre visible.

**Exemple réel** :
```
Titre : "Appartement à vendre T3/F3 66 m² 400000 € Voltaire..."
```

### Comment ça fonctionne ?

Si après les 3 premières méthodes, le prix ou la surface manquent :

1. **Récupération du texte** : Titre + Description
2. **Analyse par Regex** :
   - Prix : `(\d+(?:[\s.]\d+)*)\s*€`
   - Surface : `(\d+(?:[.,]\d+)?)\s*m[²2]`
3. **Nettoyage** : Suppression des espaces/points
4. **Validation** : Vérification des limites (prix 10k-10M€, surface 10-500m²)

### Formats supportés

**Prix** :
- ✅ `400 000 €`
- ✅ `400000 €`
- ✅ `400.000 €`
- ✅ `400000€`
- ✅ `Prix : 400 000 €`

**Surface** :
- ✅ `66 m²`
- ✅ `66m²`
- ✅ `66 m2`
- ✅ `66,5 m²`
- ✅ `Surface : 66 m²`

### Test du fallback

```bash
cd backend
python test_text_extraction.py
```

---

## 📦 Structure de la Réponse

```json
{
  "success": true,
  
  "scraped_data": {
    "prix": 150000,
    "surface": 45,
    "code_postal": "69001",
    "ville": "Lyon 1er",
    "nb_pieces": 2,
    "success": true
  },
  
  "widgets_data": {
    "dvf_stats": {
      "prix_m2_median": 4500,
      "nb_ventes": 523,
      "comparaison": {
        "ecart_vs_median_pct": -15.5
      }
    },
    "insee_stats": {
      "tension_locative": "Forte",
      "taux_vacance": 5.2
    },
    "loyers_stats": {
      "loyer_mensuel_estime": 850,
      "rendement_brut_estime": 6.8
    }
  },
  
  "financial_result": {
    "score_investissement": 75.5,
    "verdict": "Bon investissement",
    "cashflow_mensuel_net": 125,
    "rentabilite_nette": 4.8,
    "autofinancement": true,
    "conseils": [...]
  },
  
  "summary": {
    "score_investissement": 75.5,
    "verdict": "Bon investissement",
    "autofinancement": true
  }
}
```

---

## ⏱️ Performance

| Étape | Durée Typique | Facteurs |
|-------|---------------|----------|
| Scraping | 30-90s | Complexité du site, charge serveur |
| Parsing | < 1s | Taille du HTML |
| Analyse DVF/INSEE | 1-2s | Taille des datasets |
| Simulation | < 1s | Calculs mathématiques |
| **TOTAL** | **35-95s** | Variable selon le site |

💡 **Optimisation** : Le render JavaScript (`render=true`) est nécessaire pour SeLoger mais ralentit le scraping.

---

## 💰 Coût ScraperAPI

| Plan | Crédits/mois | Coût | Annonces |
|------|--------------|------|----------|
| **Gratuit** | 1 000 | $0 | 100-200 |
| Hobby | 10 000 | $49 | 1 000-2 000 |
| Startup | 100 000 | $149 | 10 000-20 000 |

**Consommation par annonce** :
- Sans render : 1 crédit
- Avec render (SeLoger) : 5-10 crédits

---

## 🐛 Gestion des Erreurs

### Erreurs Courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Clé API non configurée` | .env manquant | Créer .env avec SCRAPERAPI_KEY |
| `Limite de requêtes atteinte` | 1000 crédits dépassés | Attendre ou upgrader |
| `Prix non trouvé` | Site trop complexe | Essayer une autre annonce |
| `Timeout` | Site lent | Augmenter timeout à 120s |

### Stratégies de Fallback

```python
# 1. Réessayer avec un timeout plus long
result = scrape_ad(url, timeout=120)

# 2. Tester sans render (plus rapide mais moins fiable)
result = scrape_ad(url, render=False)

# 3. Fournir les données manuellement
simulation = SimulationRequest(
    prix=150000,  # Copier depuis l'annonce
    surface=45,
    code_postal="69001"
)
```

---

## 🔒 Sécurité & Bonnes Pratiques

### ✅ À Faire

- Valider les URLs avant scraping
- Limiter le nombre de requêtes par utilisateur
- Mettre en cache les résultats (éviter de scraper 2× la même URL)
- Logger les erreurs pour debugging
- Utiliser des timeouts appropriés

### ❌ À Éviter

- Scraper en boucle sans délai
- Partager votre clé ScraperAPI publiquement
- Scraper des sites qui l'interdisent explicitement (vérifier robots.txt)
- Stocker les données scrapées sans consentement

---

## 📈 Améliorations Futures

### Court Terme

- [ ] Cache Redis pour éviter de scraper 2× la même URL
- [ ] Support de plus de sites (Bien'ici, Logic-immo)
- [ ] Extraction des photos et description complète
- [ ] Détection automatique du type de bien (appartement/maison)

### Moyen Terme

- [ ] Scraping asynchrone (plusieurs annonces en parallèle)
- [ ] Système de retry automatique en cas d'échec
- [ ] Webhook pour notifier quand le scraping est terminé
- [ ] Dashboard de monitoring des crédits ScraperAPI

### Long Terme

- [ ] Scraping sans ScraperAPI (proxies rotatifs)
- [ ] Machine Learning pour améliorer l'extraction
- [ ] Support de sites internationaux (Zillow, Rightmove)

---

## 🧪 Tests

### Test Unitaire

```bash
cd backend
python test_scraper.py
```

### Test d'Intégration

```bash
# Lancer l'API
python main.py

# Dans un autre terminal
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.seloger.com/..."}'
```

### Test de Charge

```python
import requests
import time

urls = [...]  # Liste d'URLs

for url in urls:
    start = time.time()
    response = requests.post(
        "http://localhost:8000/api/analyze",
        json={"url": url},
        timeout=120
    )
    duration = time.time() - start
    
    print(f"URL: {url[:50]}... - Durée: {duration:.1f}s - Status: {response.status_code}")
    
    time.sleep(5)  # Pause entre requêtes
```

---

## 📚 Ressources

- **ScraperAPI Docs** : https://www.scraperapi.com/documentation
- **BeautifulSoup Docs** : https://www.crummy.com/software/BeautifulSoup/bs4/doc/
- **JSON-LD Spec** : https://json-ld.org/
- **OpenGraph Protocol** : https://ogp.me/

---

## 🤝 Contribution

Pour ajouter le support d'un nouveau site :

1. Analyser la structure HTML du site
2. Identifier les métadonnées (JSON-LD, OpenGraph)
3. Ajouter des patterns regex spécifiques si nécessaire
4. Tester avec plusieurs annonces
5. Documenter les spécificités

---

**Version :** 1.0.0  
**Dernière mise à jour :** Janvier 2026  
**Auteur :** Équipe BrickByBrick
