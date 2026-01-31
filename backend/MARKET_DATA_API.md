# 📚 Documentation API Phase 1 - Market Data

**Endpoint** : `GET /api/market-data`  
**Version** : 1.0.0  
**Date** : Janvier 2026

---

## 🎯 Objectif

Cet endpoint fournit toutes les données nécessaires pour alimenter les **12 widgets de visualisation** de la Phase 1 (Exploration & Familiarisation).

L'utilisateur explore le marché immobilier à différentes échelles géographiques :
- 🌍 **National** : Vue d'ensemble de la France entière
- 🗺️ **Départemental** : Zoom sur un département
- 🏘️ **Local** : Focus sur une ville/code postal

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Paramètres](#paramètres)
3. [Structure de la Réponse](#structure-de-la-réponse)
4. [Widgets Alimentés](#widgets-alimentés)
5. [Exemples d'Utilisation](#exemples-dutilisation)
6. [Gestion des Erreurs](#gestion-des-erreurs)
7. [Performance](#performance)
8. [Évolutions Futures](#évolutions-futures)

---

## Vue d'Ensemble

### URL

```
GET /api/market-data
```

### Authentification

Aucune (pour l'instant).

### Headers

```
Accept: application/json
```

---

## Paramètres

Tous les paramètres sont **optionnels** et passés en **query string**.

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `code_postal` | string | Code postal pour données locales (5 chiffres) | `69001` |
| `departement` | string | Code département pour données régionales (2 chiffres) | `69` |
| `budget_max` | float | Budget maximum pour filtrer les biens (€) | `150000` |
| `nb_pieces` | integer | Nombre de pièces pour Widget 4 | `2` |

### Exemples d'URLs

```bash
# Données nationales uniquement
GET /api/market-data

# Données nationales + départementales
GET /api/market-data?departement=69

# Données complètes (national + département + ville)
GET /api/market-data?code_postal=69001&departement=69

# Avec budget (Widget 3 et 4)
GET /api/market-data?departement=69&budget_max=150000

# Avec budget + nombre de pièces (Widget 4)
GET /api/market-data?budget_max=100000&nb_pieces=2
```

---

## Structure de la Réponse

La réponse est un objet JSON structuré en **4 sections principales** :

```json
{
  "scope_france": { ... },        // Données nationales (toujours présent)
  "scope_departement": { ... },   // Données départementales (si departement fourni)
  "scope_city": { ... },          // Données locales (si code_postal fourni)
  "user_profile_tools": { ... },  // Liens vers calculateurs personnalisés
  "metadata": { ... }             // Métadonnées (version, timestamp, sources)
}
```

---

### 1. `scope_france` (Toujours présent)

Données pour visualiser la **France entière**.

```json
{
  "scope_france": {
    "heatmap_tension": [
      {
        "departement": "75",
        "taux_vacance": 6.2,
        "tension": "Forte",          // "Forte" | "Moyenne" | "Faible"
        "part_locataires": 62.5,
        "logements_total": 1250000
      }
    ],
    "rendement_departements": [
      {
        "departement": "59",
        "prix_m2_median": 1800.0,
        "loyer_m2_moyen": 12.75,
        "rendement_brut_pct": 8.5,
        "nb_ventes": 15234
      }
    ],
    "carte_budget_accessible": [      // Optionnel (si budget_max fourni)
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
  }
}
```

**Widgets alimentés** :
- Widget 5 : Heatmap tension locative (`heatmap_tension`)
- Widget 7 : Rendement brut par département (`rendement_departements`)
- Widget 4 : Zones accessibles (`carte_budget_accessible`)

---

### 2. `scope_departement` (Si `departement` fourni)

Données pour **un département spécifique**.

```json
{
  "scope_departement": {
    "code": "69",
    "evolution_prix_2020_2024": [
      {
        "annee": 2020,
        "prix_median": 280000.0,
        "prix_moyen": 295000.0,
        "nb_ventes": 7821
      }
    ],
    "repartition_taille_budget": {    // Optionnel (si budget_max fourni)
      "budget": 150000,
      "distribution": {
        "1p": {"count": 450, "pct": 45.0},
        "2p": {"count": 350, "pct": 35.0},
        "3p": {"count": 150, "pct": 15.0}
      },
      "total_biens": 950
    },
    "indice_achat_location": 18.5,
    "variation_5ans_pct": 25.0
  }
}
```

**Widgets alimentés** :
- Widget 2 : Évolution prix 2020-2024 (`evolution_prix_2020_2024`)
- Widget 3 : Répartition par taille (`repartition_taille_budget`)
- Widget 8 : Indice achat/location (`indice_achat_location`)

**Interprétation de `indice_achat_location`** :
- `< 15` : Marché acheteur (loyers élevés vs prix)
- `15-20` : Équilibré
- `> 20` : Marché locataire (loyers faibles vs prix)

---

### 3. `scope_city` (Si `code_postal` fourni)

Données pour **une ville/code postal spécifique**.

```json
{
  "scope_city": {
    "code_postal": "69001",
    "ville": null,                    // TODO: Extraire nom de ville
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
      {
        "nom_gare": "Lyon Part-Dieu",
        "distance_km": 2.1,
        "lat": 45.76,
        "lon": 4.86
      }
    ],
    "etablissements_sup": [],         // TODO: Améliorer recherche
    "poles_etudiants": null,          // TODO: Implémenter Widget 10
    "lat": null,
    "lon": null
  }
}
```

**Widgets alimentés** :
- Widget 9 : Gares à proximité (`gares`)
- Widget 10 : Établissements supérieurs (`etablissements_sup`, `poles_etudiants`)
- Données du marché local (`market_tension`, `prix_marche`)

---

### 4. `user_profile_tools` (Toujours présent)

Liens vers les **calculateurs personnalisés** (Widgets 1 et 6).

```json
{
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
  }
}
```

**Note** : Ces endpoints doivent être implémentés séparément (voir [Évolutions Futures](#évolutions-futures)).

---

### 5. `metadata` (Toujours présent)

Métadonnées sur la réponse.

```json
{
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

## Widgets Alimentés

### 📊 Tableau de Correspondance

| Widget | Nom | Scope | Champs Utilisés |
|--------|-----|-------|-----------------|
| **1** | Faisabilité d'Achat Étudiant | LOCAL (calculateur) | `user_profile_tools.faisabilite_calculator` |
| **2** | Comparateur DVF 2020-2024 | DÉPARTEMENTAL | `scope_departement.evolution_prix_2020_2024` |
| **3** | Répartition par Taille selon Budget | DÉPARTEMENTAL | `scope_departement.repartition_taille_budget` |
| **4** | Carte Zones ≤ Budget | NATIONAL | `scope_france.carte_budget_accessible` |
| **5** | Tension Locative INSEE | NATIONAL | `scope_france.heatmap_tension` |
| **6** | Rendement Requis | LOCAL (calculateur) | `user_profile_tools.rendement_requis_calculator` |
| **7** | Rendement Brut par Département | NATIONAL | `scope_france.rendement_departements` |
| **8** | Indice Achat-Location | DÉPARTEMENTAL | `scope_departement.indice_achat_location` |
| **9** | Proximité Domicile/Relais | LOCAL | `scope_city.gares` |
| **10** | Pôles Étudiants | LOCAL | `scope_city.etablissements_sup`, `poles_etudiants` |
| **12** | Synthèse & Recommandations | MULTI | Agrégation de tous les scopes |

---

## Exemples d'Utilisation

### Exemple 1 : Frontend Next.js (TypeScript)

```typescript
// Fetch market data pour un département
const fetchMarketData = async (departement: string, budgetMax?: number) => {
  const params = new URLSearchParams({
    departement,
    ...(budgetMax && { budget_max: budgetMax.toString() })
  });

  const response = await fetch(`/api/market-data?${params}`);
  
  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
};

// Utilisation dans un composant
const MarketDashboard = ({ departement }: { departement: string }) => {
  const [marketData, setMarketData] = useState(null);
  
  useEffect(() => {
    fetchMarketData(departement, 150000).then(setMarketData);
  }, [departement]);
  
  if (!marketData) return <Loading />;
  
  return (
    <div>
      <Widget2 data={marketData.scope_departement.evolution_prix_2020_2024} />
      <Widget3 data={marketData.scope_departement.repartition_taille_budget} />
      <Widget7 data={marketData.scope_france.rendement_departements} />
    </div>
  );
};
```

### Exemple 2 : Python (Jupyter Notebook)

```python
import requests
import pandas as pd
import plotly.express as px

# Récupérer les données
response = requests.get(
    "http://localhost:8000/api/market-data",
    params={"departement": "69", "budget_max": 150000}
)
data = response.json()

# Widget 2 : Évolution des prix
evolution = pd.DataFrame(data["scope_departement"]["evolution_prix_2020_2024"])
fig = px.line(evolution, x="annee", y="prix_median", title="Évolution Prix Rhône 2020-2024")
fig.show()

# Widget 7 : Top 10 rendements
rendements = pd.DataFrame(data["scope_france"]["rendement_departements"][:10])
fig = px.bar(rendements, x="departement", y="rendement_brut_pct", title="Top 10 Rendements")
fig.show()
```

### Exemple 3 : curl (Bash)

```bash
#!/bin/bash

# Récupérer les données pour Lyon
RESPONSE=$(curl -s "http://localhost:8000/api/market-data?code_postal=69001&departement=69")

# Extraire le nombre de gares proches
NB_GARES=$(echo $RESPONSE | jq '.scope_city.gares | length')
echo "Gares proches de Lyon 1er : $NB_GARES"

# Extraire le taux de vacance
VACANCE=$(echo $RESPONSE | jq '.scope_city.market_tension.taux_vacance')
echo "Taux de vacance : $VACANCE%"
```

---

## Gestion des Erreurs

### Codes de Statut HTTP

| Code | Signification | Cause |
|------|---------------|-------|
| **200** | Success | Données retournées avec succès |
| **503** | Service Unavailable | Données en cours de chargement |
| **500** | Internal Server Error | Erreur lors du calcul |

### Exemple d'Erreur 503

```json
{
  "detail": "Service temporairement indisponible : données en cours de chargement"
}
```

**Solution** : Attendre que le chargement soit terminé (vérifier `/api/health`).

### Exemple d'Erreur 500

```json
{
  "detail": "Erreur lors du calcul des données : KeyError: 'Code departement'"
}
```

**Solution** : Vérifier les logs serveur, signaler le bug.

---

## Performance

### Temps de Réponse

| Requête | Temps Moyen | Données Retournées |
|---------|-------------|---------------------|
| Scope France uniquement | < 2s | ~96 départements × 2 widgets |
| Scope France + Département | < 3s | + 5 années d'évolution |
| Scope Complet (France + Dept + City) | < 4s | + gares + marché local |

### Optimisations Possibles

1. **Cache Redis** : Mettre en cache `scope_france` (données nationales) pendant 1h
2. **Pré-agrégation** : Calculer `heatmap_tension` et `rendement_departements` au démarrage
3. **Index Pandas** : Créer des index sur `Code departement` et `Code postal`
4. **Lazy Loading** : Ne calculer `scope_city` que si nécessaire

---

## Évolutions Futures

### Phase 1.1 : Calculateurs Personnalisés

Implémenter les endpoints pour Widgets 1 et 6 :

```python
@app.post("/api/calculate-faisabilite", response_model=FaisabiliteResponse)
async def calculate_faisabilite(request: FaisabiliteRequest):
    # Widget 1 : Calculer le score de faisabilité d'achat étudiant
    pass

@app.post("/api/calculate-rendement-requis", response_model=RendementRequisResponse)
async def calculate_rendement_requis(request: RendementRequisRequest):
    # Widget 6 : Calculer le rendement minimum requis
    pass
```

### Phase 1.2 : Améliorations

- [ ] **Widget 10** : Implémenter `poles_etudiants` (gares stratégiques proches de campus)
- [ ] **Géocodage** : Ajouter `ville` et `lat/lon` dans `scope_city`
- [ ] **Pagination** : Limiter `carte_budget_accessible` avec pagination
- [ ] **Filtres** : Ajouter `type_bien` (Appartement/Maison) en paramètre
- [ ] **Cache** : Implémenter Redis pour les données nationales

### Phase 2 : Analyse de Deal

Endpoint pour analyser une annonce spécifique (déjà implémenté : `POST /api/analyze`).

---

## 📚 Ressources

- **Notebook Jupyter** : `BrickAI.ipynb` (logique des 12 widgets)
- **Analyse des Widgets** : `backend/WIDGETS_ANALYSIS.md`
- **Guide de Test** : `backend/TEST_MARKET_DATA.md`
- **Script de Test** : `backend/test_market_data.py`
- **Swagger UI** : http://localhost:8000/docs

---

## 📧 Support

Pour toute question ou bug :
- Consulter les logs serveur
- Vérifier `/api/health`
- Lire `TEST_MARKET_DATA.md`

---

**Version** : 1.0.0  
**Auteur** : BrickByBrick Backend Team  
**Date** : Janvier 2026  
**Licence** : MIT
