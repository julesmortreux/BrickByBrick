# BrickByBrick - Project Context

> **Mission**: Aider les jeunes novices (18-35 ans) à investir sereinement dans l'immobilier locatif sans y passer des heures et sans avoir peur de se tromper.

---

## 📋 Table des Matières

1. [Le Concept](#-le-concept)
2. [Fonctionnalités & Roadmap](#-fonctionnalités--roadmap)
3. [Stack Technique](#-stack-technique)
4. [Logique Métier (Business Logic)](#-logique-métier-business-logic)
5. [Sources de Données](#-sources-de-données)
6. [Design System](#-design-system)
7. [Prochaines Étapes](#-prochaines-étapes)

---

## 🎯 Le Concept

### Problématique
**Comment aider un jeune déjà motivé à trouver des biens fiables, adaptés à son profil, sans y passer des heures et sans peur de se tromper ?**

### Cible
- **Jeunes actifs et étudiants** (18-35 ans)
- Déjà intéressés par l'investissement immobilier locatif
- Manquent de **repères**, de **temps**, et de **confiance**
- 82% ont déjà envisagé d'acheter pour louer (panel interne)

### Proposition de Valeur
Une plateforme qui **analyse automatiquement** les annonces immobilières et propose aux jeunes une **short-list de biens vraiment adaptés** à leur profil, expliquée avec des mots simples et basée sur de vraies données (DVF, INSEE, loyers).

### Différenciation vs Concurrence

| Acteur | Forces | Faiblesses |
|--------|---------|-----------|
| **MeilleursAgents** | Données de prix fiables | ❌ Aucune analyse de rentabilité |
| **RendementLocatif** | Excellent simulateur | ❌ Trop technique, utilisateur doit tout faire |
| **SeLoger / Leboncoin** | Volume d'annonces | ❌ Zéro analyse, recherche manuelle |
| **Masteos / Bevouac** | Clé-en-main | ❌ Cher, pas adapté aux étudiants |
| **🧱 BrickByBrick** | ✅ Pédagogique, accessible, centré analyse | ✅ Automatisation + profil personnalisé |

---

## 🚀 Fonctionnalités & Roadmap

### Phase 1 : Widgets Éducatifs & Profiling (✅ Actuel - Prototype)

**Objectif** : Accompagner l'utilisateur, le rassurer, et construire automatiquement son profil d'investisseur personnalisé.

#### Widgets implémentés (Colab/Jupyter):

1. **Widget 1** - Faisabilité d'achat étudiant
   - Évalue la capacité d'investissement selon le profil (revenus, statut, apport, garant)
   - Score /100 avec recommandations personnalisées

2. **Widget 2** - Comparateur DVF 2020-2024
   - Évolution des prix médians et volumes de ventes par type de bien
   - Détection des contextes favorables acheteur/vendeur

3. **Widget 3** - Répartition par taille selon budget
   - Distribution des formats disponibles (T1-T5+) sous un budget donné
   - Données DVF 2024

4. **Widget 4** - Carte zones ≤ budget
   - Visualisation géographique des zones accessibles
   - Croisement budget + géolocalisation

5. **Widget 5** - Tension locative & vacance
   - Indicateurs INSEE par département
   - Facilité de location estimée

6. **Widget 6** - Calculateur de rendement locatif requis
   - Calcul du rendement brut minimal pour couvrir le crédit
   - Simulation mensualité, taux d'endettement

7. **Widget 7** - Rendement brut par département
   - Fusion DVF × Loyers
   - Classement des départements les plus rentables

8. **Widget 8** - Budget & carte interactive
   - Exploration visuelle des zones accessibles

9. **Widget 9** - Proximité gares & pôles étudiants
   - Distance aux infrastructures clés
   - Scoring de localisation

10. **Widget 10** - Pôles étudiants & enseignement supérieur
    - Proximité campus, universités
    - Potentiel locatif étudiant

11. **Widget 11** - Cashflow & Auto-financement
    - Simulation mensualité vs loyers
    - Calcul du cashflow net

12. **Widget 12** - Synthèse & villes recommandées
    - Génération d'une short-list de villes optimales
    - Selon tous les critères (budget, rendement, tension, proximité)

13. **Widget 13** - Analyse d'annonce SeLoger (URL manuelle)
    - Scraping d'une URL SeLoger
    - Analyse complète sur 8 critères pondérés
    - Rapport détaillé avec score /100

14. **Widget 14** - Recherche automatique d'annonces
    - Scraping automatique de plusieurs annonces selon le profil
    - Classement par score décroissant

### Phase 2 : Scraping Automatique & Recommandation (🚧 En cours)

**Objectif** : Ne plus demander aucune recherche manuelle. Scraper automatiquement des centaines d'annonces et proposer une **short-list des 5 biens les plus adaptés**.

#### Fonctionnalités prévues:

- **Scraping massif** : 100+ annonces SeLoger par jour selon critères utilisateur
- **Scoring automatique** : Score /100 pour chaque annonce
- **Short-list top 5** : Présentation des meilleures opportunités
- **Notifications** : Alertes lorsqu'un bien correspond parfaitement au profil
- **Suivi favoris** : Tracking des annonces favorites avec évolution prix

### Phase 3 : Plateforme Web Complète (🔮 Futur - MVP)

**Objectif** : Interface web simple et moderne pour l'ensemble de la solution.

#### Architecture technique cible:

```
Frontend (Next.js + Tailwind CSS)
          ↓
    API REST (FastAPI)
          ↓
Backend Logic (Python + Pandas)
          ↓
   Database (PostgreSQL)
          ↓
Data Sources (DVF, INSEE, Loyers, ScraperAPI)
```

---

## 🛠 Stack Technique

### Actuel (Prototype Jupyter/Colab)

| Couche | Technologies |
|--------|-------------|
| **Environnement** | Google Colab / Jupyter Notebook |
| **Langage** | Python 3.10+ |
| **Data Processing** | `pandas`, `numpy` |
| **Visualisation** | `matplotlib`, `plotly`, `folium` (cartes) |
| **Widgets** | `ipywidgets`, `IPython.display` |
| **Scraping** | `requests`, `beautifulsoup4`, `lxml` |
| **Scraping API** | ScraperAPI (contournement anti-bot) |
| **Géocodage** | `pgeocode` (codes postaux → coordonnées) |
| **Styling** | CSS custom (inline HTML) |

### Cible (Plateforme Web - MVP)

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Next.js 14+ (React 18), TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend API** | FastAPI (Python) |
| **Base de données** | PostgreSQL + Prisma ORM |
| **Data Processing** | Pandas, NumPy |
| **Scraping** | ScraperAPI + BeautifulSoup4 |
| **Cache** | Redis (cache résultats scraping) |
| **Déploiement** | Vercel (Frontend) + Render/Railway (Backend) |
| **CI/CD** | GitHub Actions |

---

## 💼 Logique Métier (Business Logic)

> **⚠️ Section Cruciale** : Toutes les règles de calcul et sources de données utilisées.

### 1. Score de Faisabilité (/100)

**Formule de base** : Score = 50 points + ajustements selon critères

#### Critères évalués:

| Critère | Impact | Calcul |
|---------|--------|--------|
| **Revenu mensuel** | +15 / -15 | Si ≥1000€ : +15 ; Si <500€ : -15 |
| **Statut professionnel** | +25 / -25 | Alternant: +25 ; CDI partiel: +15 ; Étudiant pur: -25 |
| **Logement actuel** | +10 / -10 | Chez parents: +10 ; Locataire: -10 |
| **Durée études restantes** | +5 / -10 | 0 ans: +5 ; ≥3 ans: -10 |
| **Apport personnel** | +15 / -10 | ≥10k€: +15 ; 5-10k€: +8 ; <5k€: +2 ; 0€: -10 |
| **Garantie parentale** | +10 / -10 | Oui: +10 ; Non: -10 |
| **Salaire de sortie** | +10 / -10 | ≥2000€: +10 ; <1500€: -10 |

**Verdict** :
- ≥75 : Faisabilité Élevée
- 50-74 : Faisabilité Intermédiaire
- <50 : Faisabilité Faible

---

### 2. Calcul du Rendement Locatif Requis

**Objectif** : Déterminer le rendement brut minimal pour qu'un bien soit rentable.

#### Formule de mensualité de crédit:

```python
def mensualite(capital, taux_annuel_pct, duree_ans):
    """
    Calcul de la mensualité de crédit immobilier
    
    Formule: M = C × (t/12) / (1 - (1 + t/12)^(-n))
    
    Args:
        capital: Montant emprunté (€)
        taux_annuel_pct: Taux d'intérêt annuel (%)
        duree_ans: Durée du prêt (années)
    
    Returns:
        Mensualité (€)
    """
    taux_mensuel = taux_annuel_pct / 100 / 12
    nb_mois = duree_ans * 12
    
    if taux_mensuel == 0:
        return capital / nb_mois
    
    mensualite = (capital * taux_mensuel) / (1 - (1 + taux_mensuel) ** (-nb_mois))
    return mensualite
```

#### Calcul du rendement requis:

```python
# Variables
prix_bien = ...            # Prix d'achat du bien (€)
apport = ...               # Apport personnel (€)
taux_interet = 4.0         # Taux d'intérêt annuel (%)
duree_credit = 20          # Durée du crédit (années)

# Montant emprunté
montant_emprunt = prix_bien - apport

# Mensualité de crédit
mensualite_credit = mensualite(montant_emprunt, taux_interet, duree_credit)

# Loyer mensuel nécessaire (approximation: loyer = mensualité × 3 pour couvrir)
# En réalité, on utilise une marge de sécurité
loyer_mensuel_requis = mensualite_credit

# Loyer annuel
loyer_annuel_requis = loyer_mensuel_requis * 12

# Rendement brut minimal
rendement_brut_requis = (loyer_annuel_requis / prix_bien) * 100
```

**Verdict rendement** :
- ≥8% : Excellent rendement
- 5-8% : Rendement correct
- 3-5% : Rendement limité
- <3% : Rendement insuffisant

---

### 3. Calcul du Taux d'Endettement

**Formule** :

```python
taux_endettement = (mensualite_credit / revenu_mensuel) * 100
```

**Seuils réglementaires** :
- ≤33% : ✅ Acceptable (norme bancaire)
- 33-40% : ⚠️ Élevé (dérogation possible)
- >40% : ❌ Critique (refus probable)

---

### 4. Score d'Analyse d'Annonce (/100)

**8 critères pondérés** avec scores individuels :

| Critère | Poids | Score Max | Description |
|---------|-------|-----------|-------------|
| **1. Faisabilité du Projet** | 25% | /20 | Apport, taux d'endettement, garant |
| **2. Budget & Prix** | 15% | /15 | Écart vs budget max utilisateur |
| **3. Rendement Potentiel** | 25% | /20 | Loyer estimé vs rendement requis |
| **4. Marché & Dynamique** | 15% | /15 | Prix vs médiane, évolution 2020-2024 |
| **5. Tension Locative** | 10% | /10 | Indicateurs INSEE, facilité de location |
| **6. Localisation** | 10% | /10 | Proximité, dans villes recommandées |
| **7. Taille & Typologie** | 5% | /5 | Nombre de pièces vs recherche |
| **8. État & Charges** | 5% | /5 | DPE, charges, travaux à prévoir |

**Calcul du score global** :

```python
score_global = (
    score_faisabilite * 0.25 +
    score_budget * 0.15 +
    score_rendement * 0.25 +
    score_marche * 0.15 +
    score_tension * 0.10 +
    score_localisation * 0.10 +
    score_taille * 0.05 +
    score_etat * 0.05
)
```

**Verdict final** :
- ≥80 : 🏆 Opportunité exceptionnelle
- 65-79 : ✅ Très bonne opportunité
- 50-64 : 👍 Opportunité intéressante
- 35-49 : ⚠️ À étudier avec prudence
- <35 : ❌ Investissement déconseillé

---

### 5. Estimation du Loyer

**Source** : Dataset `loyers_clean_2024.csv`

**Méthode** :

```python
def estimate_loyer(departement, surface, nb_pieces):
    """
    Estime le loyer mensuel selon les données loyers INSEE
    
    1. Filtrer loyers par département
    2. Si possible, filtrer par nb de pièces
    3. Récupérer loyer médian au m²
    4. Multiplier par surface
    
    Returns:
        loyer_mensuel (€)
    """
    loyers_dept = loyers_df[loyers_df['Code departement'] == departement]
    
    if nb_pieces:
        loyers_pieces = loyers_dept[loyers_dept['nb_pieces'] == nb_pieces]
        if not loyers_pieces.empty:
            loyer_m2 = loyers_pieces['loyer_m2'].median()
        else:
            loyer_m2 = loyers_dept['loyer_m2'].median()
    else:
        loyer_m2 = loyers_dept['loyer_m2'].median()
    
    return loyer_m2 * surface
```

---

### 6. Rendement Départemental Moyen

**Formule** :

```python
rendement_dept = ((loyer_m2_median * 12) / prix_m2_median) * 100
```

**Sources** :
- `prix_m2_median` : DVF 2024 (médiane du département)
- `loyer_m2_median` : Loyers 2024 (médiane du département)

---

### 7. Calcul du Cashflow

**Formule simplifiée** :

```python
# Revenus
loyer_mensuel = ...              # Loyer estimé (€)

# Charges
mensualite_credit = ...          # Remboursement prêt (€)
charges_copro = ...              # Charges de copropriété (€)
taxe_fonciere_mois = ...         # Taxe foncière / 12 (€)
assurance_pno = ...              # Assurance propriétaire non occupant (€)
gestion_locative = loyer_mensuel * 0.08  # 8% du loyer

# Cashflow net mensuel
cashflow_net = loyer_mensuel - (
    mensualite_credit + 
    charges_copro + 
    taxe_fonciere_mois + 
    assurance_pno + 
    gestion_locative
)
```

**Verdict** :
- Cashflow > 0 : ✅ Auto-financement (bien rentable)
- Cashflow = 0 : Équilibré
- Cashflow < 0 : ⚠️ Effort d'épargne mensuel nécessaire

---

### 8. Score de Proximité

**Critères** :
- Distance à une gare (<10km : bonus)
- Distance à un pôle universitaire (<15km : bonus)
- Présence dans les villes recommandées (Widget 12)

**Méthode de calcul de distance** :

```python
def haversine_km(lat1, lon1, lat2, lon2):
    """Calcul de distance entre 2 points GPS (formule de Haversine)"""
    R = 6371.0  # Rayon de la Terre en km
    
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    
    return R * c
```

---

## 📊 Sources de Données

### Datasets Utilisés (Google Drive)

| Fichier | Source | Taille | Description | Colonnes Clés |
|---------|--------|--------|-------------|---------------|
| **dvf_clean_2020_2024.csv** | DVF (data.gouv.fr) | 541.5 Mo | Historique des ventes 2020-2024 | `Annee`, `Valeur fonciere`, `Type local`, `Surface`, `prix_m2`, `Code departement`, `Commune` |
| **dvf_clean_2024.csv** | DVF (data.gouv.fr) | 80.4 Mo | Ventes 2024 uniquement | Idem ci-dessus + `Nombre pieces principales` |
| **loyers_clean_2024.csv** | INSEE / data.gouv.fr | 11.7 Mo | Loyers médians par département | `Code departement`, `loyer_m2`, `nb_pieces` |
| **insee_logement_2021_clean.csv** | INSEE | 9.5 Mo | Indicateurs logement | `Code departement`, `tension_locative`, `taux_vacance`, `part_locataires` |
| **enseignement_superieur_clean.csv** | data.gouv.fr | 9.5 Mo | Établissements supérieurs | `latitude`, `longitude`, `nom`, `ville`, `type` |
| **gares_clean.csv** | SNCF Open Data | 0.4 Mo | Gares ferroviaires | `latitude`, `longitude`, `nom_gare`, `commune` |

### APIs & Services Externes

| Service | Usage | Coût |
|---------|-------|------|
| **ScraperAPI** | Scraping SeLoger (contournement anti-bot) | ~1 crédit/requête |
| **pgeocode** | Géocodage codes postaux → lat/lon | Gratuit (offline) |

### Colonnes DVF Critiques

**Utilisées pour les calculs** :

```python
# Colonnes essentielles DVF
required_columns = [
    'Valeur fonciere',      # Prix de vente (€)
    'Type local',           # "Appartement" ou "Maison"
    'Surface reelle bati',  # Surface (m²)
    'Nombre pieces principales',  # Nombre de pièces
    'Code departement',     # Département (ex: "75" pour Paris)
    'Commune',              # Nom de la commune
    'Date mutation',        # Date de vente
    'prix_m2'               # Prix au m² (calculé)
]
```

### Transformation des Données

**Nettoyage appliqué** :

```python
# Filtrage des prix aberrants
df = df[df['prix_m2'].between(300, 20000)]  # Prix/m² entre 300€ et 20k€

# Normalisation des types de biens
def simplify_type(x):
    x = str(x).strip().upper()
    if "APPART" in x:
        return "Appartement"
    if "MAISON" in x:
        return "Maison"
    return "Autre"

df["Type_simple"] = df["Type local"].map(simplify_type)
```

---

## 🎨 Design System

### Palette de Couleurs

**Variables CSS principales** :

```css
:root {
  /* Polices */
  --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  /* Couleurs principales */
  --primary: #3b82f6;    /* Bleu (actions, liens) */
  --success: #10b981;    /* Vert (positif, succès) */
  --warning: #f59e0b;    /* Orange (attention) */
  --danger: #ef4444;     /* Rouge (danger, erreur) */
  
  /* Couleurs neutres */
  --muted: #6b7280;      /* Gris texte secondaire */
  --line: #e5e7eb;       /* Bordures */
  --card: #ffffff;       /* Fond cartes */
  --bg: #f9fafb;         /* Fond page */
  --ink: #111827;        /* Texte principal (noir) */
  
  /* Ombres */
  --shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
}
```

### Composants UI

#### Cards (Cartes)

```css
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow);
}
```

#### Badges (Étiquettes de statut)

```css
.badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.badge-excellent { background: #d1fae5; color: #065f46; }
.badge-good { background: #dbeafe; color: #1e40af; }
.badge-medium { background: #fef3c7; color: #92400e; }
.badge-low { background: #fee2e2; color: #991b1b; }
```

#### Progress Bars (Barres de progression)

```css
.progress-bar-container {
  width: 100%;
  height: 20px;
  background: var(--line);
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 10px;
  transition: width 0.4s ease;
}
```

### Typographie

| Élément | Style |
|---------|-------|
| **Titre principal** | 2rem (32px), font-weight: 700 |
| **Sous-titre** | 1.1rem (17.6px), opacity: 0.9 |
| **Titre de section** | 1.3rem (20.8px), font-weight: 600 |
| **Texte corps** | 1rem (16px), line-height: 1.6 |
| **Texte secondaire** | 0.9rem (14.4px), color: var(--muted) |

### Ambiance Visuelle

**Style** : Moderne, propre, épuré

**Inspiration** : 
- Notion (organisation)
- Stripe (clarté)
- Tailwind UI (composants)

**Principes** :
- ✅ Espaces généreux (padding, margin)
- ✅ Hiérarchie visuelle claire (tailles, poids)
- ✅ Bordures arrondies (border-radius: 12px)
- ✅ Ombres légères pour la profondeur
- ✅ Couleurs semantiques (vert = positif, rouge = négatif)
- ✅ Icônes émojis pour la simplicité (🏠, 💰, 📊)

---

## 🗺 Prochaines Étapes

### Soutenance Finale - Objectifs

1. **Démo fonctionnelle** du MVP web
2. **Tests utilisateurs** avec 5-10 personnes de la cible
3. **Retours mesurés** sur :
   - Est-ce que ça clarifie ? ✅
   - Est-ce que ça fait gagner du temps ? ⏱️
   - Est-ce que ça réduit la peur de se tromper ? 💪

### Roadmap Technique

#### Sprint 1 : Migration Jupyter → Web (4 semaines)

- [ ] Setup Next.js + Tailwind CSS
- [ ] Setup FastAPI + PostgreSQL
- [ ] Migration des 12 premiers widgets en composants React
- [ ] API endpoints pour chaque widget
- [ ] Authentification utilisateur (Clerk ou NextAuth)

#### Sprint 2 : Scraping & Analyse (3 semaines)

- [ ] Système de scraping automatique SeLoger (cron job)
- [ ] Stockage annonces en DB
- [ ] Endpoint d'analyse d'annonce (API)
- [ ] Interface de visualisation des résultats

#### Sprint 3 : Recommandation & Tests (3 semaines)

- [ ] Algorithme de recommandation (top 5 biens)
- [ ] Dashboard utilisateur avec short-list
- [ ] Tests utilisateurs (5-10 personnes)
- [ ] Corrections UX selon feedback

### Organisation (Notion)

**Structure actuelle** :
- 📋 Tâches par feature
- 📅 Timeline & deadlines
- 🎯 Backlog priorisé
- 📊 Suivi des tests utilisateurs

---

## 📝 Notes Techniques Importantes

### Limitations Actuelles

1. **Scraping** : Dépendance à ScraperAPI (coût + rate limit)
2. **Données** : DVF limité aux ventes réelles (pas d'annonces actuelles)
3. **Estimation loyers** : Basée sur médianes départementales (imprécision locale)
4. **Prototype Jupyter** : Non scalable, nécessite migration web

### Hypothèses de Calcul

- **Taux d'intérêt par défaut** : 4% (à actualiser selon marché)
- **Durée crédit par défaut** : 20 ans
- **Taux d'endettement max** : 33% (norme bancaire)
- **Charges de gestion locative** : 8% du loyer
- **Vacance locative** : Non prise en compte dans le prototype

### Évolutions Futures

- **Intégration banque** : Simulation de prêt en temps réel (API bancaire)
- **Notaire** : Estimation frais de notaire automatique
- **Travaux** : Estimation coût travaux par analyse photo (IA)
- **Visites virtuelles** : Intégration visite 360° des biens

---

## 📚 Ressources & Documentation

### Liens Utiles

- **DVF Open Data** : https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres/
- **INSEE Logement** : https://www.insee.fr/fr/statistiques
- **ScraperAPI** : https://www.scraperapi.com/
- **Next.js** : https://nextjs.org/
- **FastAPI** : https://fastapi.tiangolo.com/
- **Tailwind CSS** : https://tailwindcss.com/

### Documentation Interne

- **Notion** : Centralisation tâches & deadlines
- **Ce fichier** : Source unique de vérité pour le contexte projet

---

**Dernière mise à jour** : Janvier 2026  
**Équipe** : Rayan M, Rayan G, Joseph, Keis, Jules  
**Contact** : [À compléter]

---

*Ce document est vivant et sera mis à jour au fil de l'avancement du projet.*
