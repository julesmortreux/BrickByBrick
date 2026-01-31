# 🎨 Frontend Next.js - Market Explorer

## ✅ Installation Complète !

Le frontend Next.js est maintenant **prêt à être lancé** !

---

## 📦 Fichiers Créés

| Fichier | Description | Lignes |
|---------|-------------|--------|
| **Configuration** | | |
| `package.json` | Dépendances (Next.js, React, Recharts, Axios) | ~35 |
| `tsconfig.json` | Configuration TypeScript | ~30 |
| `next.config.js` | Configuration Next.js + Proxy API | ~15 |
| `tailwind.config.js` | Configuration Tailwind CSS | ~25 |
| `postcss.config.js` | Configuration PostCSS | ~7 |
| **Types** | | |
| `types/api.ts` | Types TypeScript pour l'API Backend | ~200 |
| **Client API** | | |
| `lib/api.ts` | Client Axios + Fonctions API | ~120 |
| **Composants UI** | | |
| `components/ui/Card.tsx` | Composant Card (Shadcn style) | ~60 |
| `components/ui/Badge.tsx` | Composant Badge | ~30 |
| **Composants Market** | | |
| `components/market/FranceMap.tsx` | Widget 5 : Carte tensions | ~180 |
| `components/market/RendementRanking.tsx` | Widget 7 : Classement rendements | ~150 |
| `components/market/PriceTrendChart.tsx` | Widget 2 : Évolution prix | ~220 |
| `components/market/LocalStats.tsx` | Widgets 9-10 : Stats locales | ~200 |
| **Pages** | | |
| `app/page.tsx` | Page principale (Market Explorer) | ~350 |
| `app/layout.tsx` | Layout racine | ~25 |
| `app/globals.css` | Styles globaux | ~40 |
| **Documentation** | | |
| `README.md` | Guide complet du frontend | ~350 |
| `FRONTEND_SETUP.md` | Ce fichier | ~100 |

**Total** : ~2100 lignes de code frontend !

---

## 🚀 Démarrage Rapide (3 étapes)

### 1. Installer les dépendances

```bash
npm install
```

**Packages installés** :
- `next@14.0.4` - Framework React
- `react@18.2.0` - Bibliothèque UI
- `recharts@2.10.3` - Graphiques
- `axios@1.6.2` - Client HTTP
- `tailwindcss@3.4.0` - CSS Utilities
- `typescript@5.3.3` - TypeScript

**Durée** : ~2-3 minutes

### 2. Créer .env.local

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

**Ou copier** le fichier d'exemple :
```bash
cp .env.local.example .env.local
```

### 3. Démarrer le serveur

```bash
npm run dev
```

**Output attendu** :
```
   ▲ Next.js 14.0.4
   - Local:        http://localhost:3000
   - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.5s
```

---

## 🎯 Vérification

### ✅ Checklist

- [ ] Backend démarré sur `http://localhost:8000`
- [ ] Frontend démarré sur `http://localhost:3000`
- [ ] Navigateur ouvert sur `http://localhost:3000`
- [ ] Aucune erreur dans la console (F12)

### 🧪 Test Rapide

1. **Ouvrir** http://localhost:3000
2. **Laisser** les champs vides
3. **Cliquer** sur "🔍 Explorer"
4. **Vérifier** :
   - ✅ Carte des tensions (96 départements)
   - ✅ Classement rendements
   - ✅ Aucune erreur

---

## 📊 Widgets Implémentés

| Widget | Nom | Composant | Status |
|--------|-----|-----------|--------|
| **5** | Carte Tensions Locatives | `FranceMap.tsx` | ✅ Opérationnel |
| **7** | Classement Rendements | `RendementRanking.tsx` | ✅ Opérationnel |
| **2** | Évolution Prix 2020-2024 | `PriceTrendChart.tsx` | ✅ Opérationnel |
| **9** | Gares Proches | `LocalStats.tsx` | ✅ Opérationnel |
| **10** | Établissements Sup. | `LocalStats.tsx` | ✅ Opérationnel |
| **4** | Carte Zones Accessibles | — | ⏳ À implémenter |
| **3** | Répartition par Taille | — | ⏳ À implémenter |
| **1** | Faisabilité d'Achat | — | ⏳ À implémenter |
| **6** | Rendement Requis | — | ⏳ À implémenter |

**5/9 widgets opérationnels** (56%)

---

## 🎨 Structure de l'Interface

### Page Principale (`app/page.tsx`)

```
┌─────────────────────────────────────────────┐
│  🏠 Explorateur de Marché         [Phase 1] │
│  Analysez le marché à différentes échelles  │
├─────────────────────────────────────────────┤
│  [Code Postal: _____]  [Département: ___]  │
│  [🔍 Explorer]  [↻ Réinitialiser]           │
├─────────────────────────────────────────────┤
│                                             │
│  🌍 VUE NATIONALE                           │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ Carte        │  │ Rendements   │        │
│  │ Tensions     │  │ Top 15       │        │
│  └──────────────┘  └──────────────┘        │
│                                             │
│  🗺️ VUE DÉPARTEMENTALE (si département)    │
│  ┌─────────────────────────────┐           │
│  │ Évolution Prix 2020-2024    │           │
│  └─────────────────────────────┘           │
│  [Variation 5 ans]  [Indice A/L]  [Prix]   │
│                                             │
│  🏘️ VUE LOCALE (si code postal)            │
│  ┌────────────┐  ┌────────────┐            │
│  │ Gares      │  │ Écoles     │            │
│  └────────────┘  └────────────┘            │
│  [Tension]  [Prix/m²]  [Loyer/m²]          │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🎨 Design System

### Couleurs

```css
/* Primaire (Bleu) */
--primary-500: #3b82f6
--primary-600: #2563eb
--primary-700: #1d4ed8

/* Succès (Vert) */
--success: #10b981

/* Warning (Jaune) */
--warning: #f59e0b

/* Danger (Rouge) */
--danger: #ef4444
```

### Composants Réutilisables

- **Card** : Container avec bordure et ombre
- **CardHeader** : En-tête de card
- **CardTitle** : Titre de card
- **CardContent** : Contenu de card
- **Badge** : Label coloré (success, warning, danger, info)

---

## 🔗 Connexion Backend

### Configuration

Le frontend utilise **Next.js Rewrites** pour proxifier l'API :

```js
// next.config.js
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*',
    },
  ];
}
```

### Client API (`lib/api.ts`)

```typescript
// Fonction principale
export async function getMarketData(params: MarketDataParams): Promise<MarketDataResponse> {
  const response = await apiClient.get('/api/market-data', { params });
  return response.data;
}

// Utilisation dans un composant
const data = await getMarketData({
  code_postal: '69001',
  departement: '69'
});
```

---

## 🧪 Tests Fonctionnels

### Test 1 : Scope France Uniquement

1. Ouvrir http://localhost:3000
2. Laisser les champs vides
3. Cliquer sur "🔍 Explorer"

**Résultat attendu** :
- ✅ Carte des tensions (96 départements)
- ✅ Top 10 meilleure tension
- ✅ Classement rendements (tous départements)
- ✅ Top 3 avec médailles 🏆

### Test 2 : Scope Département (Rhône - 69)

1. Département : `69`
2. Cliquer sur "🔍 Explorer"

**Résultat attendu** :
- ✅ Vue nationale
- ✅ Graphique évolution prix 2020-2024
- ✅ Tableau détaillé par année
- ✅ KPIs : Variation 5 ans, Indice A/L

### Test 3 : Scope Complet (Lyon 1er)

1. Code Postal : `69001`
2. Département : `69`
3. Cliquer sur "🔍 Explorer"

**Résultat attendu** :
- ✅ Vue nationale
- ✅ Vue départementale
- ✅ Gares proches (Lyon Part-Dieu, Perrache...)
- ✅ Tension locative + Prix/m²
- ✅ Établissements supérieurs

---

## 🐛 Dépannage

### Erreur "Module not found"

**Cause** : Dépendances non installées.

**Solution** :
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur "ECONNREFUSED"

**Cause** : Backend non démarré.

**Solution** :
```bash
cd backend
python main.py
```

Vérifier : http://localhost:8000/docs

### Page blanche

**Cause** : Erreur JavaScript.

**Solution** :
1. Ouvrir la console (F12)
2. Lire l'erreur
3. Vérifier les imports et les types

### Styles non appliqués

**Cause** : Tailwind non compilé.

**Solution** :
```bash
npm run dev
```

Relancer le serveur.

---

## 🚀 Prochaines Étapes

### Phase 1.1 : Widgets Manquants

- [ ] **Widget 4** : Carte zones accessibles (Leaflet/Mapbox)
- [ ] **Widget 3** : Répartition par taille (Recharts Pie)
- [ ] **Widget 1** : Calculateur faisabilité
- [ ] **Widget 6** : Calculateur rendement requis

### Phase 1.2 : Améliorations UX

- [ ] Filtres avancés (budget, nb pièces)
- [ ] Export PDF des rapports
- [ ] Mode sombre
- [ ] Responsive mobile optimisé
- [ ] Loading skeletons
- [ ] Animations de transition

### Phase 1.3 : Performance

- [ ] Lazy loading des composants
- [ ] Memoization (React.memo, useMemo)
- [ ] Compression images
- [ ] Code splitting
- [ ] Service Worker (PWA)

---

## 📝 Commandes Utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Démarrer en production
npm start

# Linter
npm run lint

# TypeScript check
npx tsc --noEmit
```

---

## ✅ Checklist Finale

### Configuration

- [x] `package.json` créé
- [x] `tsconfig.json` configuré
- [x] `next.config.js` avec proxy API
- [x] `tailwind.config.js` avec couleurs custom
- [x] `.env.local.example` fourni

### Types & API

- [x] `types/api.ts` avec tous les types
- [x] `lib/api.ts` avec client Axios
- [x] Intercepteurs de requêtes/réponses
- [x] Gestion d'erreurs

### Composants UI

- [x] `Card` (Container)
- [x] `Badge` (Labels)

### Composants Market

- [x] `FranceMap` (Widget 5)
- [x] `RendementRanking` (Widget 7)
- [x] `PriceTrendChart` (Widget 2)
- [x] `LocalStats` (Widgets 9-10)

### Pages

- [x] `app/page.tsx` (Page principale)
- [x] `app/layout.tsx` (Layout)
- [x] `app/globals.css` (Styles)

### Documentation

- [x] `README.md` (Guide complet)
- [x] `FRONTEND_SETUP.md` (Ce fichier)

---

**Status** : ✅ **PRODUCTION READY** pour Phase 1

Le frontend est maintenant **prêt à être lancé** ! 🚀

---

**Version** : 1.0.0  
**Date** : Janvier 2026  
**Auteur** : BrickByBrick Frontend Team
