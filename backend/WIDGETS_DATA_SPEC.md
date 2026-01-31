# 📊 Spécification des Widgets Data

Documentation complète des données retournées par l'endpoint `/api/analyze` dans l'objet `widgets_data`.

---

## 📋 Vue d'Ensemble

L'endpoint `/api/analyze` retourne un objet `widgets_data` contenant **7 catégories de données** enrichies :

| Catégorie | Source | Description |
|-----------|--------|-------------|
| **DVF Stats** | DVF 2024 | Prix du marché local |
| **INSEE Stats** | INSEE Logement | Tension locative |
| **Loyers Stats** | INSEE Loyers | Estimation loyer |
| **Transport Stats** | SNCF Open Data | Gares à proximité |
| **Student Stats** | data.gouv.fr | Établissements supérieurs |
| **Demography Stats** | INSEE | Vacance, locataires |
| **Code Postal** | Scraping | Localisation |

---

## 1️⃣ DVF Stats (Marché Local)

### Source
Dataset DVF 2024 (Demandes de Valeurs Foncières)

### Données Retournées

```json
{
  "dvf_stats": {
    "prix_m2_median": 4200.0,
    "prix_m2_mean": 4500.0,
    "prix_m2_min": 2800.0,
    "prix_m2_max": 8500.0,
    "nb_ventes": 523,
    "comparaison": {
      "prix_m2_annonce": 3272.73,
      "ecart_vs_median_pct": -22.1
    }
  }
}
```

### Description des Champs

| Champ | Type | Description |
|-------|------|-------------|
| `prix_m2_median` | float | Prix médian au m² dans le département (€/m²) |
| `prix_m2_mean` | float | Prix moyen au m² dans le département (€/m²) |
| `prix_m2_min` | float | Prix minimum observé (€/m²) |
| `prix_m2_max` | float | Prix maximum observé (€/m²) |
| `nb_ventes` | int | Nombre de ventes enregistrées en 2024 |
| `comparaison.prix_m2_annonce` | float | Prix/m² de l'annonce analysée |
| `comparaison.ecart_vs_median_pct` | float | Écart en % vs médiane (négatif = bon prix) |

### Utilisation

- **Widget Graphique** : Afficher l'évolution des prix
- **Comparaison** : Savoir si le prix est bon ou élevé
- **Négociation** : Argumenter avec des données réelles

---

## 2️⃣ INSEE Stats (Tension Locative)

### Source
Dataset INSEE Logement 2021

### Données Retournées

```json
{
  "insee_stats": {
    "tension_locative": "Forte",
    "taux_vacance": 6.2,
    "part_locataires": 62.5
  }
}
```

### Description des Champs

| Champ | Type | Description |
|-------|------|-------------|
| `tension_locative` | string | "Forte", "Moyenne", "Faible" |
| `taux_vacance` | float | Taux de vacance des logements (%) |
| `part_locataires` | float | Part des locataires dans les résidences principales (%) |

### Utilisation

- **Widget Jauge** : Afficher la tension locative
- **Risque** : Évaluer la facilité de location
- **Stratégie** : Adapter le type de bien selon la demande

---

## 3️⃣ Loyers Stats (Estimation Loyer)

### Source
Dataset Loyers INSEE 2024

### Données Retournées

```json
{
  "loyers_stats": {
    "loyer_m2_median": 28.50,
    "loyer_m2_mean": 30.20,
    "loyer_mensuel_estime": 1282.50,
    "rendement_brut_estime": 5.49
  }
}
```

### Description des Champs

| Champ | Type | Description |
|-------|------|-------------|
| `loyer_m2_median` | float | Loyer médian au m² dans le département (€/m²/mois) |
| `loyer_m2_mean` | float | Loyer moyen au m² (€/m²/mois) |
| `loyer_mensuel_estime` | float | Loyer mensuel estimé pour le bien (€/mois) |
| `rendement_brut_estime` | float | Rendement brut estimé (%) |

### Calcul

```python
loyer_mensuel_estime = loyer_m2_median × surface
rendement_brut = (loyer_mensuel_estime × 12 / prix) × 100
```

### Utilisation

- **Widget Simulation** : Estimer le loyer automatiquement
- **Rentabilité** : Calculer le rendement brut
- **Comparaison** : Vérifier si le loyer est réaliste

---

## 4️⃣ Transport Stats (Gares SNCF) ✨ **NOUVEAU**

### Source
SNCF Open Data - Gares ferroviaires

### Données Retournées

```json
{
  "transport_stats": {
    "nb_gares": 3,
    "noms_gares": [
      "Lyon Part-Dieu",
      "Lyon Perrache",
      "Lyon Jean Macé"
    ]
  }
}
```

### Description des Champs

| Champ | Type | Description |
|-------|------|-------------|
| `nb_gares` | int | Nombre de gares dans la commune |
| `noms_gares` | list[str] | Liste des noms de gares (max 5) |

### Logique d'Extraction

```python
# Recherche par nom de commune
gares = gares_df[gares_df["commune"].str.contains(ville, case=False)]

# Fallback : recherche dans le nom de la gare
if gares.empty:
    gares = gares_df[gares_df["nom_gare"].str.contains(ville, case=False)]
```

### Cas Particuliers

- **Aucune gare** : `{"nb_gares": 0, "noms_gares": []}`
- **Erreur** : `{"nb_gares": 0, "noms_gares": []}`

### Utilisation

- **Widget Proximité** : Afficher les gares proches
- **Score Localisation** : Bonus si gare à proximité
- **Attractivité** : Argument pour la location

---

## 5️⃣ Student Stats (Enseignement Supérieur) ✨ **NOUVEAU**

### Source
data.gouv.fr - Établissements d'enseignement supérieur

### Données Retournées

```json
{
  "student_stats": {
    "nb_etablissements": 15,
    "top_etablissements": [
      "Université Lyon 1 Claude Bernard",
      "École Centrale de Lyon",
      "EM Lyon Business School",
      "INSA Lyon",
      "Sciences Po Lyon"
    ]
  }
}
```

### Description des Champs

| Champ | Type | Description |
|-------|------|-------------|
| `nb_etablissements` | int | Nombre d'établissements dans la commune |
| `top_etablissements` | list[str] | Liste des noms d'établissements (max 5) |

### Logique d'Extraction

```python
# Recherche par nom de ville
etablissements = enseignement_df[
    enseignement_df["ville"].str.contains(ville, case=False)
]

# Extraction des noms
if "nom" in etablissements.columns:
    noms = etablissements["nom"].head(5).tolist()
elif "libelle" in etablissements.columns:
    noms = etablissements["libelle"].head(5).tolist()
```

### Cas Particuliers

- **Aucun établissement** : `{"nb_etablissements": 0, "top_etablissements": []}`
- **Erreur** : `{"nb_etablissements": 0, "top_etablissements": []}`

### Utilisation

- **Widget Pôles Étudiants** : Afficher les universités proches
- **Stratégie Locative** : Cibler les étudiants
- **Rentabilité** : Forte demande locative étudiante

---

## 6️⃣ Demography Stats (Démographie) ✨ **NOUVEAU**

### Source
INSEE - Recensement de la population 2021

### Données Retournées

```json
{
  "demography_stats": {
    "pct_vacance_locative": 6.2,
    "pct_locataires": 62.5,
    "logements_total": 125000,
    "logements_vacants": 7750,
    "residences_principales": 110000,
    "locataires": 68750
  }
}
```

### Description des Champs

| Champ | Type | Description |
|-------|------|-------------|
| `pct_vacance_locative` | float | % de logements vacants (P21_LOGVAC / P21_LOG) |
| `pct_locataires` | float | % de locataires (P21_RP_LOC / P21_RP) |
| `logements_total` | int | Nombre total de logements (P21_LOG) |
| `logements_vacants` | int | Nombre de logements vacants (P21_LOGVAC) |
| `residences_principales` | int | Nombre de résidences principales (P21_RP) |
| `locataires` | int | Nombre de locataires (P21_RP_LOC) |

### Calculs

```python
# % Vacance locative
pct_vacance = (P21_LOGVAC / P21_LOG) × 100

# % Locataires
pct_locataires = (P21_RP_LOC / P21_RP) × 100
```

### Interprétation

| Indicateur | Bon | Moyen | Mauvais |
|------------|-----|-------|---------|
| **Vacance** | < 6% | 6-8% | > 8% |
| **Locataires** | > 60% | 40-60% | < 40% |

### Utilisation

- **Widget Jauges** : Afficher les indicateurs clés
- **Risque Locatif** : Évaluer la facilité de location
- **Marché** : Comprendre le profil de la commune

---

## 7️⃣ Code Postal & Département

### Données Retournées

```json
{
  "code_postal": "69001",
  "departement": "69"
}
```

### Description

- **code_postal** : Code postal extrait de l'annonce (5 chiffres)
- **departement** : 2 premiers chiffres du code postal

---

## 🔄 Workflow Complet

```
POST /api/analyze
{
  "url": "https://www.seloger.com/..."
}

↓

1. SCRAPING
   └─ Extraction : prix, surface, code_postal, ville

↓

2. ENRICHISSEMENT WIDGETS_DATA

   A. DVF Stats
      └─ Filtrer par département
      └─ Calculer médiane, moyenne, min, max
      └─ Comparer prix annonce vs marché

   B. INSEE Stats
      └─ Filtrer par département
      └─ Extraire tension locative

   C. Loyers Stats
      └─ Filtrer par département
      └─ Estimer loyer mensuel
      └─ Calculer rendement brut

   D. Transport Stats ✨
      └─ Filtrer gares par ville
      └─ Compter et lister

   E. Student Stats ✨
      └─ Filtrer établissements par ville
      └─ Compter et lister

   F. Demography Stats ✨
      └─ Filtrer INSEE par code postal
      └─ Calculer % vacance et % locataires

↓

3. SIMULATION FINANCIÈRE
   └─ Utiliser loyer estimé
   └─ Calculer cashflow, rentabilité, score

↓

4. RÉPONSE COMPLÈTE
   └─ scraped_data + widgets_data + financial_result
```

---

## 🧪 Tester les Widgets Data

### Test Standalone

```bash
cd backend
python test_widgets_data.py
```

### Test via API

```bash
# Lancer l'API
python main.py

# Tester
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.seloger.com/..."}'
```

---

## 📈 Utilisation Frontend

### Affichage des Widgets

```typescript
// Récupérer les données
const response = await fetch('/api/analyze', {
  method: 'POST',
  body: JSON.stringify({ url: annonceUrl })
});

const data = await response.json();
const widgets = data.widgets_data;

// Widget Transport
if (widgets.transport_stats?.nb_gares > 0) {
  console.log(`🚄 ${widgets.transport_stats.nb_gares} gare(s) à proximité`);
  widgets.transport_stats.noms_gares.forEach(gare => {
    console.log(`  • ${gare}`);
  });
}

// Widget Éducation
if (widgets.student_stats?.nb_etablissements > 0) {
  console.log(`🎓 ${widgets.student_stats.nb_etablissements} établissement(s)`);
}

// Widget Démographie
if (widgets.demography_stats) {
  console.log(`📊 Vacance : ${widgets.demography_stats.pct_vacance_locative}%`);
  console.log(`📊 Locataires : ${widgets.demography_stats.pct_locataires}%`);
}
```

---

## 🐛 Gestion des Erreurs

### Cas où les données manquent

Tous les widgets retournent des valeurs par défaut en cas d'erreur :

```json
{
  "transport_stats": {
    "nb_gares": 0,
    "noms_gares": []
  },
  "student_stats": {
    "nb_etablissements": 0,
    "top_etablissements": []
  },
  "demography_stats": null
}
```

### Vérification Frontend

```typescript
// Vérifier avant d'afficher
if (widgets.transport_stats && widgets.transport_stats.nb_gares > 0) {
  // Afficher le widget transport
}

if (widgets.student_stats && widgets.student_stats.nb_etablissements > 0) {
  // Afficher le widget éducation
}

if (widgets.demography_stats && widgets.demography_stats.pct_vacance_locative) {
  // Afficher le widget démographie
}
```

---

## 📊 Exemple Complet

Voir `TEST_ANALYZE.md` pour un exemple complet de réponse avec toutes les données.

---

**Version :** 1.0.0  
**Dernière mise à jour :** Janvier 2026  
**Auteur :** Équipe BrickByBrick
