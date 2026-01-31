# 🧪 Test de l'Endpoint GET /api/market-data

Guide complet pour tester l'endpoint Phase 1 (Widgets de visualisation).

---

## 🚀 Démarrage du Serveur

```bash
cd backend
python main.py
```

Le serveur démarre sur `http://localhost:8000`.

---

## 📚 Documentation Interactive

Une fois le serveur démarré, accédez à :
- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

Vous pouvez tester l'endpoint directement depuis Swagger UI avec un bouton "Try it out".

---

## 🧪 Tests avec curl

### Test 1 : Données Nationales Uniquement

```bash
curl -X GET "http://localhost:8000/api/market-data" \
  -H "Accept: application/json" | jq '.'
```

**Résultat attendu** :
- `scope_france.heatmap_tension` : Liste des 96 départements avec taux de vacance
- `scope_france.rendement_departements` : Classement des départements par rendement
- `scope_departement` : `null`
- `scope_city` : `null`

**Logs attendus** :
```
📊 Requête market-data : code_postal=None, departement=None, budget=None
🌍 Calcul Scope France...
✅ Scope France : 96 départements
✅ Market Data calculé avec succès
```

---

### Test 2 : Données Nationales + Départementales

```bash
curl -X GET "http://localhost:8000/api/market-data?departement=69" \
  -H "Accept: application/json" | jq '.'
```

**Résultat attendu** :
- `scope_france` : Données nationales
- `scope_departement` : 
  - `evolution_prix_2020_2024` : 5 années (2020-2024)
  - `indice_achat_location` : Float (ex: 18.5)
  - `variation_5ans_pct` : Variation % sur 5 ans
- `scope_city` : `null`

**Logs attendus** :
```
📊 Requête market-data : code_postal=None, departement=69, budget=None
🌍 Calcul Scope France...
✅ Scope France : 96 départements
🗺️ Calcul Scope Département 69...
✅ Scope Département : 5 années
✅ Market Data calculé avec succès
```

---

### Test 3 : Données Complètes (National + Département + Ville)

```bash
curl -X GET "http://localhost:8000/api/market-data?code_postal=69001&departement=69" \
  -H "Accept: application/json" | jq '.'
```

**Résultat attendu** :
- `scope_france` : Données nationales
- `scope_departement` : Données départementales
- `scope_city` :
  - `code_postal` : "69001"
  - `gares` : Liste des gares proches
  - `market_tension` : Tension locative de la ville
  - `prix_marche` : Prix/loyer locaux

**Logs attendus** :
```
📊 Requête market-data : code_postal=69001, departement=69, budget=None
🌍 Calcul Scope France...
✅ Scope France : 96 départements
🗺️ Calcul Scope Département 69...
✅ Scope Département : 5 années
🏘️ Calcul Scope City 69001...
✅ Scope City : 3 gares proches
✅ Market Data calculé avec succès
```

---

### Test 4 : Avec Budget (Widget 3 et 4)

```bash
curl -X GET "http://localhost:8000/api/market-data?departement=69&budget_max=150000" \
  -H "Accept: application/json" | jq '.'
```

**Résultat attendu** :
- `scope_france.carte_budget_accessible` : Liste des codes postaux accessibles ≤ 150k€
- `scope_departement.repartition_taille_budget` :
  ```json
  {
    "budget": 150000,
    "distribution": {
      "1p": {"count": 450, "pct": 45.0},
      "2p": {"count": 350, "pct": 35.0},
      "3p": {"count": 150, "pct": 15.0},
      "4p": {"count": 50, "pct": 5.0}
    },
    "total_biens": 1000
  }
  ```

---

### Test 5 : Avec Budget + Nombre de Pièces (Widget 4)

```bash
curl -X GET "http://localhost:8000/api/market-data?budget_max=100000&nb_pieces=2" \
  -H "Accept: application/json" | jq '.scope_france.carte_budget_accessible | length'
```

**Résultat attendu** :
- Nombre de codes postaux où des T2 ≤ 100k€ sont disponibles

---

## 🧪 Tests avec Python

### Test Simple

```python
import requests
import json

# Test 1 : Données nationales
response = requests.get("http://localhost:8000/api/market-data")
data = response.json()

print(f"✅ Status : {response.status_code}")
print(f"📊 Départements tension : {len(data['scope_france']['heatmap_tension'])}")
print(f"💰 Départements rendement : {len(data['scope_france']['rendement_departements'])}")

# Afficher le Top 5 rendements
print("\n🏆 Top 5 Rendements :")
for dept in data['scope_france']['rendement_departements'][:5]:
    print(f"   {dept['departement']} : {dept['rendement_brut_pct']}% (Prix: {dept['prix_m2_median']}€/m²)")
```

### Test Complet avec Tous les Paramètres

```python
import requests
import json

url = "http://localhost:8000/api/market-data"
params = {
    "code_postal": "69001",
    "departement": "69",
    "budget_max": 180000,
    "nb_pieces": 3
}

response = requests.get(url, params=params)
data = response.json()

print("=" * 80)
print("📊 MARKET DATA - Test Complet")
print("=" * 80)

# Scope France
print("\n🌍 SCOPE FRANCE :")
print(f"   Heatmap tension : {len(data['scope_france']['heatmap_tension'])} départements")
print(f"   Rendements : {len(data['scope_france']['rendement_departements'])} départements")
if data['scope_france']['carte_budget_accessible']:
    print(f"   Zones accessibles (≤ {params['budget_max']}€) : {len(data['scope_france']['carte_budget_accessible'])} codes postaux")

# Scope Département
if data['scope_departement']:
    print("\n🗺️ SCOPE DÉPARTEMENT 69 :")
    print(f"   Évolution prix : {len(data['scope_departement']['evolution_prix_2020_2024'])} années")
    print(f"   Variation 5 ans : {data['scope_departement']['variation_5ans_pct']:.2f}%")
    print(f"   Indice achat/location : {data['scope_departement']['indice_achat_location']}")
    
    if data['scope_departement']['repartition_taille_budget']:
        print(f"\n   Répartition par taille (≤ {params['budget_max']}€) :")
        distribution = data['scope_departement']['repartition_taille_budget']['distribution']
        for pieces, info in distribution.items():
            print(f"      {pieces} : {info['count']} biens ({info['pct']}%)")

# Scope City
if data['scope_city']:
    print(f"\n🏘️ SCOPE CITY {params['code_postal']} :")
    
    if data['scope_city']['gares']:
        print(f"   Gares proches : {len(data['scope_city']['gares'])}")
        for gare in data['scope_city']['gares'][:3]:
            print(f"      • {gare['nom_gare']} ({gare['distance_km']} km)")
    
    if data['scope_city']['market_tension']:
        tension = data['scope_city']['market_tension']
        print(f"\n   Tension locative : {tension['niveau']} ({tension['taux_vacance']}% vacance)")
        print(f"   Locataires : {tension['part_locataires']}%")
    
    if data['scope_city']['prix_marche']:
        prix = data['scope_city']['prix_marche']
        print(f"\n   Prix/m² médian : {prix['prix_m2_median']}€")
        if 'loyer_m2_median' in prix:
            print(f"   Loyer/m² médian : {prix['loyer_m2_median']}€")

print("\n" + "=" * 80)
print("✅ Test terminé")
print("=" * 80)
```

---

## 📊 Exemples de Réponses

### Réponse Complète (Extrait)

```json
{
  "scope_france": {
    "heatmap_tension": [
      {
        "departement": "75",
        "taux_vacance": 6.2,
        "tension": "Moyenne",
        "part_locataires": 62.5,
        "logements_total": 1250000
      },
      {
        "departement": "69",
        "taux_vacance": 7.1,
        "tension": "Moyenne",
        "part_locataires": 58.3,
        "logements_total": 450000
      }
    ],
    "rendement_departements": [
      {
        "departement": "59",
        "prix_m2_median": 1800.0,
        "loyer_m2_moyen": 12.75,
        "rendement_brut_pct": 8.5,
        "nb_ventes": 15234
      },
      {
        "departement": "69",
        "prix_m2_median": 3500.0,
        "loyer_m2_moyen": 19.83,
        "rendement_brut_pct": 6.8,
        "nb_ventes": 8721
      }
    ],
    "carte_budget_accessible": [
      {
        "code_postal": "59000",
        "pct_access": 85.2,
        "prix_median": 120000.0,
        "nb_ventes": 523
      }
    ],
    "stats_globales": {
      "nb_departements": 96,
      "nb_departements_rendement": 96
    }
  },
  
  "scope_departement": {
    "code": "69",
    "evolution_prix_2020_2024": [
      {"annee": 2020, "prix_median": 280000.0, "prix_moyen": 295000.0, "nb_ventes": 7821},
      {"annee": 2021, "prix_median": 310000.0, "prix_moyen": 325000.0, "nb_ventes": 8234},
      {"annee": 2022, "prix_median": 335000.0, "prix_moyen": 350000.0, "nb_ventes": 8654},
      {"annee": 2023, "prix_median": 348000.0, "prix_moyen": 362000.0, "nb_ventes": 8421},
      {"annee": 2024, "prix_median": 350000.0, "prix_moyen": 365000.0, "nb_ventes": 8721}
    ],
    "repartition_taille_budget": {
      "budget": 150000,
      "distribution": {
        "1p": {"count": 450, "pct": 45.0},
        "2p": {"count": 350, "pct": 35.0},
        "3p": {"count": 150, "pct": 15.0},
        "4p": {"count": 50, "pct": 5.0}
      },
      "total_biens": 1000
    },
    "indice_achat_location": 18.5,
    "variation_5ans_pct": 25.0
  },
  
  "scope_city": {
    "code_postal": "69001",
    "departement": "69",
    "market_tension": {
      "taux_vacance": 5.8,
      "niveau": "Forte",
      "part_locataires": 65.2,
      "logements_vacants": 2500,
      "residences_principales": 35000
    },
    "prix_marche": {
      "prix_m2_median": 4200.0,
      "prix_m2_mean": 4500.0,
      "loyer_m2_median": 18.5,
      "nb_ventes_2024": 234
    },
    "gares": [
      {"nom_gare": "Lyon Part-Dieu", "distance_km": 2.1, "lat": 45.76, "lon": 4.86},
      {"nom_gare": "Lyon Perrache", "distance_km": 1.5, "lat": 45.75, "lon": 4.83}
    ],
    "etablissements_sup": []
  },
  
  "user_profile_tools": {
    "faisabilite_calculator": {
      "description": "Calculer le score de faisabilité d'achat étudiant",
      "endpoint": "/api/calculate-faisabilite",
      "method": "POST"
    },
    "rendement_requis_calculator": {
      "description": "Calculer le rendement minimum requis selon profil",
      "endpoint": "/api/calculate-rendement-requis",
      "method": "POST"
    }
  },
  
  "metadata": {
    "version": "1.0.0",
    "timestamp": "2026-01-11T14:23:45.123456",
    "sources": {
      "dvf": "DVF 2024 + 2020-2024",
      "loyers": "INSEE Loyers 2024",
      "insee": "INSEE Logement 2021",
      "gares": "SNCF Open Data",
      "enseignement_sup": "data.gouv.fr"
    }
  }
}
```

---

## ⚠️ Gestion des Erreurs

### Erreur 503 : Données non chargées

```bash
curl -X GET "http://localhost:8000/api/market-data"
```

**Réponse** :
```json
{
  "detail": "Service temporairement indisponible : données en cours de chargement"
}
```

**Solution** : Attendre que le chargement soit terminé (voir logs serveur).

---

### Erreur 500 : Erreur interne

Si une erreur se produit pendant le calcul, le serveur retourne :

```json
{
  "detail": "Erreur lors du calcul des données : ..."
}
```

**Solution** : Vérifier les logs serveur pour plus de détails.

---

## 🎯 Validation des Résultats

### Checklist

- [ ] `scope_france.heatmap_tension` contient 96 départements
- [ ] `scope_france.rendement_departements` est trié par rendement décroissant
- [ ] `scope_departement.evolution_prix_2020_2024` contient 5 années
- [ ] `scope_city.gares` est trié par distance croissante
- [ ] `scope_city.market_tension.niveau` est "Forte", "Moyenne", ou "Faible"
- [ ] `metadata.timestamp` est au format ISO 8601

---

## 📈 Performance

### Temps de Réponse Attendu

- **Scope France uniquement** : < 2 secondes
- **Scope France + Département** : < 3 secondes
- **Scope complet** : < 4 secondes

Si les temps sont plus longs, envisager :
- Mise en cache des résultats nationaux
- Pré-agrégation des données au démarrage
- Index sur les colonnes `Code departement` et `Code postal`

---

## 🚀 Prochaines Étapes

1. **Optimisation** : Ajouter un cache Redis pour les données nationales
2. **Géocodage** : Améliorer la résolution ville → code postal
3. **Widget 10** : Améliorer la recherche d'établissements supérieurs
4. **Tests unitaires** : Créer des tests automatisés avec pytest

---

**Version** : 1.0.0  
**Auteur** : BrickByBrick Backend Team  
**Date** : Janvier 2026
