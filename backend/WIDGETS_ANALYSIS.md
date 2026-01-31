# 📊 Analyse des 12 Widgets du Notebook BrickAI.ipynb

## Vue d'Ensemble

Le notebook contient **11 widgets de visualisation** (1-10 + 12) pour la Phase 1, plus 2 widgets de scraping (13-14) à ignorer.

---

## 🎯 Classification par Scope Géographique

### 🌍 SCOPE NATIONAL (Carte de France)

| Widget | Nom | Données | Visualisation |
|--------|-----|---------|---------------|
| **4** | Carte Zones ≤ Budget | DVF 2024 + Géolocalisation | Carte Folium interactive |
| **5** | Tension Locative | INSEE Logement 2021 | Carte départements + Tableau |
| **7** | Rendement Brut par Département | DVF + Loyers | Graphique barres horizontal |

**Objectif** : Visualiser la France entière, comparer tous les départements, identifier les zones attractives.

---

### 🗺️ SCOPE DÉPARTEMENTAL (Comparaison villes/évolution)

| Widget | Nom | Données | Visualisation |
|--------|-----|---------|---------------|
| **2** | Comparateur DVF 2020-2024 | DVF Historique | Graphique évolution temporelle |
| **3** | Répartition par Taille selon Budget | DVF 2024 | Graphique camembert + Barres |
| **8** | Indice Achat-Location | DVF + Loyers | Indicateur ratio |

**Objectif** : Zoomer sur un département, voir l'évolution, la distribution des biens, le dynamisme du marché.

---

### 🏘️ SCOPE LOCAL (Ville/Code Postal)

| Widget | Nom | Données | Visualisation |
|--------|-----|---------|---------------|
| **1** | Faisabilité d'Achat Étudiant | Profil utilisateur | Score + Recommandations |
| **6** | Rendement Requis | Profil utilisateur | Calcul personnalisé |
| **9** | Proximité Domicile/Relais | Gares + Géolocalisation | Carte Folium + Liste |
| **10** | Pôles Étudiants | Gares + Enseignement Sup | Carte + Liste campus |

**Objectif** : Analyser une ville précise, voir les infrastructures (gares, écoles), évaluer la viabilité du projet.

---

### 🎓 SCOPE MULTI (Synthèse personnalisée)

| Widget | Nom | Données | Visualisation |
|--------|-----|---------|---------------|
| **12** | Synthèse & Recommandations | Tous les widgets | Dashboard complet |

**Objectif** : Agréger toutes les analyses précédentes, recommander des villes cibles.

---

## 📋 Détail des Widgets

### Widget 1 : 🎓 Faisabilité d'Achat Étudiant

**Type** : Calcul personnalisé  
**Scope** : LOCAL (indépendant du marché)  
**Inputs** :
- Revenus mensuels
- Statut (Étudiant, Apprenti, etc.)
- Logement actuel
- Durée études restantes
- Salaire sortie d'études
- Apport personnel
- Garant (Oui/Non)

**Outputs** :
- Score de faisabilité (/100)
- Verdict (Faisabilité Élevée, Intermédiaire, Faible)
- Type de prêt recommandé
- Conseils personnalisés

**Backend** : Calcul algorithmique pur (pas de données CSV).

---

### Widget 2 : 📊 Comparateur DVF 2020-2024

**Type** : Évolution temporelle  
**Scope** : DÉPARTEMENTAL  
**Inputs** :
- Département (dropdown)
- Type de bien (Appartement/Maison/Tous)

**Outputs** :
- Graphique courbe évolution prix médian (2020-2024)
- KPIs : Prix actuel, variation % depuis 2020
- Commentaire dynamisme marché

**Sources** :
- `dvf_clean_2020_2024.csv` (DVF sur 5 ans)

**Backend** : Filtrer par département + type bien, agréger par année.

---

### Widget 3 : 🏘️ Répartition par Taille selon Budget

**Type** : Distribution  
**Scope** : DÉPARTEMENTAL  
**Inputs** :
- Budget max (slider)
- Département (dropdown)

**Outputs** :
- Graphique camembert : % de biens par nombre de pièces
- Graphique barres : Distribution prix
- Message d'alerte si peu de biens disponibles

**Sources** :
- `dvf_clean_2024.csv`

**Backend** : Filtrer DVF par budget + département, grouper par `Nombre pieces principales`.

---

### Widget 4 : 🗺️ Carte Zones ≤ Budget

**Type** : Carte interactive  
**Scope** : NATIONAL  
**Inputs** :
- Budget max (slider)
- Type de bien (Studio/T1, T2, Tous)

**Outputs** :
- Carte Folium avec cercles colorés (vert = très accessible, rouge = peu accessible)
- KPIs : Nb codes postaux accessibles, % accessibilité médiane
- Légende dynamique

**Sources** :
- `dvf_clean_2024.csv`
- Géocodage via `pgeocode`

**Backend** : Agréger par code postal, calculer % de biens ≤ budget, géolocaliser.

---

### Widget 5 : 📈 Tension Locative par Département

**Type** : Carte + Tableau  
**Scope** : NATIONAL + DÉPARTEMENTAL  
**Inputs** :
- Département (dropdown)
- Nombre de classes (slider pour heatmap)

**Outputs** :
- Heatmap de France : départements colorés selon taux de vacance
- Tableau ranking : Top départements par tension
- KPIs pour le département sélectionné

**Sources** :
- `insee_logement_2021_clean.csv`

**Backend** : Agréger par département, calculer `taux_vacance = P21_LOGVAC / P21_LOG`.

---

### Widget 6 : 💰 Rendement Requis

**Type** : Calcul personnalisé  
**Scope** : LOCAL (profil utilisateur)  
**Inputs** :
- Montant emprunté
- Taux d'intérêt
- Durée crédit
- Charges estimées

**Outputs** :
- Rendement brut minimum requis (%)
- Loyer mensuel minimum requis (€)
- Alerte si irréaliste

**Backend** : Calcul financier pur (formule mensualité + charges).

---

### Widget 7 : 💰 Rendement Brut par Département

**Type** : Classement national  
**Scope** : NATIONAL  
**Inputs** :
- Type de bien (Appartement/Maison/Tous)
- Seuil minimum rendement (slider)

**Outputs** :
- Graphique barres horizontal : Top départements
- Tableau Top 10 avec prix/m², loyer/m², rendement
- KPIs : Nb départements ≥ seuil, rendement moyen

**Sources** :
- `dvf_clean_2024.csv` (prix)
- `loyers_clean_2024.csv` (loyers)

**Backend** : 
```python
rendement_brut = (loyer_m2 * 12 / prix_m2) * 100
```
Agréger par département, trier par rendement décroissant.

---

### Widget 8 : 🏘️ Indice Achat-Location

**Type** : Ratio comparatif  
**Scope** : DÉPARTEMENTAL  
**Inputs** :
- Département (dropdown)

**Outputs** :
- Indice : Ratio prix/loyer annuel
- Interprétation :
  - < 15 : Marché acheteur (loyers élevés vs prix)
  - 15-20 : Équilibré
  - > 20 : Marché locataire (loyers faibles vs prix)
- Conseil stratégique

**Sources** :
- `dvf_clean_2024.csv`
- `loyers_clean_2024.csv`

**Backend** :
```python
indice = prix_m2_median / (loyer_m2_median * 12)
```

---

### Widget 9 : 🚆 Proximité Domicile/Relais

**Type** : Carte + Listes  
**Scope** : LOCAL  
**Inputs** :
- Code postal domicile (input)
- Rayon recherche (km)

**Outputs** :
- Carte Folium : Domicile (rouge) + Gares proches (bleues)
- Liste gares par distance
- Distance médiane, gare la plus proche

**Sources** :
- `gares_clean.csv`
- Géocodage via `pgeocode`

**Backend** : Calculer distance haversine entre domicile et chaque gare, filtrer par rayon.

---

### Widget 10 : 🎓 Pôles Étudiants (Gares proches de Campus)

**Type** : Carte + Tableau  
**Scope** : LOCAL  
**Inputs** :
- Rayon autour des gares (km)
- Minimum campus par gare (slider)

**Outputs** :
- Carte Folium : Gares avec nb de campus à proximité
- Liste gares stratégiques (≥ X campus)
- Stats : Moyenne campus/gare, distance médiane

**Sources** :
- `gares_clean.csv`
- `enseignement_superieur_clean.csv`

**Backend** : Pour chaque gare, compter établissements dans rayon X km.

---

### Widget 12 : 🎯 Synthèse & Recommandations

**Type** : Dashboard agrégé  
**Scope** : MULTI  
**Inputs** :
- Tous les paramètres des widgets 1-10

**Outputs** :
- Récapitulatif profil utilisateur
- Plan de financement
- Liste des 10 villes recommandées (score calculé)
- Critères de recherche optimaux

**Sources** : Toutes

**Backend** : Algorithme de scoring complexe combinant :
- Budget faisable (Widget 1)
- Prix accessibles (Widget 4)
- Tension locative favorable (Widget 5)
- Rendement acceptable (Widget 7)
- Proximité gares (Widget 9)
- Pôles étudiants (Widget 10)

---

## 🔧 Structure de l'Endpoint `/api/market-data`

### Requête

```http
GET /api/market-data?code_postal=69001&departement=69
```

**Paramètres Query** :
- `code_postal` (optionnel) : Pour données LOCAL
- `departement` (optionnel) : Pour données DÉPARTEMENTAL

### Réponse JSON

```json
{
  "scope_france": {
    "heatmap_tension": [
      {"departement": "75", "taux_vacance": 6.2, "tension": "Forte"},
      {"departement": "69", "taux_vacance": 7.1, "tension": "Moyenne"},
      ...
    ],
    "rendement_departements": [
      {"departement": "59", "rendement_brut_pct": 8.5, "prix_m2": 1800, "loyer_m2": 12.75},
      {"departement": "69", "rendement_brut_pct": 6.8, "prix_m2": 3500, "loyer_m2": 19.83},
      ...
    ],
    "carte_budget_accessible": [
      {"code_postal": "69001", "pct_access": 85.2, "lat": 45.77, "lon": 4.84},
      {"code_postal": "69002", "pct_access": 42.1, "lat": 45.75, "lon": 4.83},
      ...
    ]
  },
  
  "scope_departement": {
    "code": "69",
    "nom": "Rhône",
    "evolution_prix_2020_2024": [
      {"annee": 2020, "prix_median": 2800},
      {"annee": 2021, "prix_median": 3100},
      {"annee": 2022, "prix_median": 3350},
      {"annee": 2023, "prix_median": 3480},
      {"annee": 2024, "prix_median": 3500}
    ],
    "repartition_taille_budget": {
      "budget": 150000,
      "distribution": {
        "1p": 45,
        "2p": 35,
        "3p": 15,
        "4p": 5
      }
    },
    "indice_achat_location": 18.5,
    "tension_locative": {
      "taux_vacance": 7.1,
      "categorie": "Moyenne",
      "part_locataires": 58.3
    }
  },
  
  "scope_city": {
    "code_postal": "69001",
    "ville": "Lyon 1er",
    "market_tension": {
      "taux_vacance": 5.8,
      "niveau": "Forte",
      "part_locataires": 65.2
    },
    "prix_marche": {
      "prix_m2_median": 4200,
      "prix_m2_mean": 4500,
      "loyer_m2_median": 18.5
    },
    "gares": [
      {"nom": "Lyon Part-Dieu", "distance_km": 2.1},
      {"nom": "Lyon Perrache", "distance_km": 1.5}
    ],
    "etablissements_sup": [
      {"nom": "Université Lyon 1", "distance_km": 3.2},
      {"nom": "EM Lyon", "distance_km": 5.8}
    ],
    "poles_etudiants": {
      "gares_strategiques": [
        {"nom": "Lyon Part-Dieu", "nb_campus_proches": 8}
      ]
    }
  },
  
  "user_profile_tools": {
    "faisabilite_calculator": {
      "description": "Calculer le score de faisabilité d'achat",
      "endpoint": "/api/calculate-faisabilite"
    },
    "rendement_requis_calculator": {
      "description": "Calculer le rendement minimum requis",
      "endpoint": "/api/calculate-rendement-requis"
    }
  }
}
```

---

## 🚀 Plan d'Implémentation Backend

### Étape 1 : Créer `backend/schemas_market.py`

Définir les modèles Pydantic pour chaque scope :
- `ScopeFranceData`
- `ScopeDepartementData`
- `ScopeCityData`
- `MarketDataResponse`

### Étape 2 : Créer `backend/widgets.py`

Fonctions de calcul pour chaque widget :
```python
def get_heatmap_tension(insee_df) -> List[dict]
def get_rendement_departements(dvf_df, loyers_df) -> List[dict]
def get_evolution_prix_departement(dvf_hist_df, dept: str) -> List[dict]
def get_gares_proches(gares_df, code_postal: str, rayon_km: float) -> List[dict]
# ... etc
```

### Étape 3 : Mettre à jour `backend/data_loader.py`

Ajouter des méthodes d'accès :
```python
def get_dvf_by_departement(self, dept: str) -> pd.DataFrame
def get_insee_by_code_postal(self, cp: str) -> pd.Series
# ... etc
```

### Étape 4 : Créer l'endpoint dans `backend/main.py`

```python
@app.get("/api/market-data", response_model=MarketDataResponse)
async def get_market_data(
    code_postal: Optional[str] = None,
    departement: Optional[str] = None
):
    data_store = load_data()
    
    # Scope France (toujours retourné)
    scope_france = {
        "heatmap_tension": widgets.get_heatmap_tension(data_store.insee),
        "rendement_departements": widgets.get_rendement_departements(data_store.dvf, data_store.loyers),
        # ...
    }
    
    # Scope Département (si fourni)
    scope_departement = None
    if departement:
        scope_departement = {
            "code": departement,
            "evolution_prix_2020_2024": widgets.get_evolution_prix_departement(data_store.dvf_hist, departement),
            # ...
        }
    
    # Scope City (si code_postal fourni)
    scope_city = None
    if code_postal:
        scope_city = {
            "code_postal": code_postal,
            "gares": widgets.get_gares_proches(data_store.gares, code_postal),
            # ...
        }
    
    return MarketDataResponse(
        scope_france=scope_france,
        scope_departement=scope_departement,
        scope_city=scope_city
    )
```

---

## 📝 Règles d'Or

1. **Fidélité au Notebook** : Reproduire exactement les calculs et agrégations du notebook.
2. **Performance** : Pré-calculer les données nationales au démarrage, cacher les résultats.
3. **Granularité** : Retourner des données brutes pour laisser le frontend choisir la visualisation.
4. **Complétude** : Inclure tous les champs nécessaires pour alimenter les 12 widgets frontend.

---

**Version** : 1.0.0  
**Auteur** : BrickByBrick Backend Team  
**Date** : Janvier 2026
