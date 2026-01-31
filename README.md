# 🏠 BrickByBrick - Market Explorer (Frontend)

Interface Next.js pour l'exploration du marché immobilier (Phase 1).

---

## 🚀 Installation

### 1. Installer les dépendances

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 2. Configuration

Créer un fichier `.env.local` à la racine :

```bash
cp .env.local.example .env.local
```

Contenu de `.env.local` :

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Démarrer le Backend

Le frontend nécessite que le backend FastAPI soit démarré :

```bash
cd backend
python main.py
```

Le backend démarre sur `http://localhost:8000`.

### 4. Démarrer le Frontend

```bash
npm run dev
```

Le frontend démarre sur `http://localhost:3000`.

---

## 📁 Structure du Projet

```
├── app/
│   ├── page.tsx              # Page principale (Market Explorer)
│   ├── layout.tsx            # Layout racine
│   └── globals.css           # Styles globaux
│
├── components/
│   ├── ui/                   # Composants UI réutilisables
│   │   ├── Card.tsx
│   │   └── Badge.tsx
│   │
│   └── market/               # Composants de visualisation
│       ├── FranceMap.tsx          # Widget 5 : Carte tensions
│       ├── RendementRanking.tsx   # Widget 7 : Classement rendements
│       ├── PriceTrendChart.tsx    # Widget 2 : Évolution prix
│       └── LocalStats.tsx         # Widget 9-10 : Stats locales
│
├── lib/
│   └── api.ts                # Client API (Axios)
│
├── types/
│   └── api.ts                # Types TypeScript (API)
│
├── public/                   # Assets statiques
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

---

## 🎯 Fonctionnalités

### Vue Nationale (toujours affichée)

- **Widget 5** : Carte des tensions locatives par département
- **Widget 7** : Classement des départements par rendement brut

### Vue Départementale (si département fourni)

- **Widget 2** : Évolution des prix 2020-2024
- Indicateurs : Variation 5 ans, Indice achat/location, Prix/m² actuel

### Vue Locale (si code postal fourni)

- **Widget 9** : Liste des gares à proximité
- **Widget 10** : Établissements d'enseignement supérieur
- Tension locative, Prix/m², Loyer/m², Rendement

---

## 🧪 Tester l'Application

### 1. Données Nationales Uniquement

Laissez les champs vides et cliquez sur "Explorer".

**Résultat** :
- Carte des tensions locatives (96 départements)
- Classement des rendements (tous les départements)

### 2. Vue Départementale (Rhône - 69)

- Département : `69`
- Cliquez sur "Explorer"

**Résultat** :
- Vue nationale
- Évolution prix 2020-2024 pour le Rhône
- Indicateurs départementaux

### 3. Vue Complète (Lyon 1er)

- Code Postal : `69001`
- Département : `69`
- Cliquez sur "Explorer"

**Résultat** :
- Vue nationale
- Vue départementale
- Stats locales (gares, écoles, prix, tension)

---

## 🎨 Personnalisation

### Modifier les couleurs (Tailwind)

Éditer `tailwind.config.js` :

```js
theme: {
  extend: {
    colors: {
      primary: {
        500: '#3b82f6',  // Bleu primaire
        600: '#2563eb',
        700: '#1d4ed8',
      },
    },
  },
}
```

### Ajouter un composant

1. Créer le fichier dans `components/market/`
2. Importer dans `app/page.tsx`
3. Utiliser les données de `marketData`

---

## 📊 API Backend

### Endpoint Principal

```
GET http://localhost:8000/api/market-data
```

### Paramètres Query

| Paramètre | Type | Description |
|-----------|------|-------------|
| `code_postal` | string | Code postal (5 chiffres) |
| `departement` | string | Code département (2-3 chiffres) |
| `budget_max` | number | Budget maximum (€) |
| `nb_pieces` | number | Nombre de pièces |

### Exemple Requête

```bash
curl "http://localhost:8000/api/market-data?code_postal=69001&departement=69"
```

### Documentation API

- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

---

## 🐛 Dépannage

### Erreur "ECONNREFUSED"

**Cause** : Le backend n'est pas démarré.

**Solution** :
```bash
cd backend
python main.py
```

### Erreur "Service temporairement indisponible"

**Cause** : Les données CSV sont en cours de chargement.

**Solution** : Attendre 10-20 secondes et réessayer.

### Erreur TypeScript

**Solution** :
```bash
npm run build
```

Vérifier les erreurs et corriger les types.

---

## 🚀 Build & Deploy

### Build de Production

```bash
npm run build
```

### Démarrer en Production

```bash
npm run start
```

### Variables d'Environnement (Production)

Créer `.env.production.local` :

```
NEXT_PUBLIC_API_URL=https://api.brickbybrick.com
```

---

## 📚 Technologies

- **Next.js 14** : Framework React
- **TypeScript** : Typage statique
- **Tailwind CSS** : Styles utilitaires
- **Recharts** : Graphiques interactifs
- **Axios** : Client HTTP

---

## 📝 TODO (Phase 1.1)

- [ ] Ajouter Widget 4 (Carte zones accessibles) avec Leaflet/Mapbox
- [ ] Ajouter Widget 3 (Répartition par taille) avec graphique camembert
- [ ] Ajouter calculateurs (Widgets 1 et 6)
- [ ] Ajouter filtres avancés (budget, nombre de pièces)
- [ ] Ajouter export PDF des rapports
- [ ] Ajouter mode sombre
- [ ] Optimiser les performances (lazy loading, memoization)
- [ ] Ajouter tests (Jest, React Testing Library)

---

## 📧 Support

Pour toute question :
- Consulter `backend/MARKET_DATA_API.md`
- Vérifier `http://localhost:8000/docs`
- Lire ce README

---

**Version** : 1.0.0  
**Date** : Janvier 2026  
**Auteur** : BrickByBrick Team  
**Licence** : MIT
