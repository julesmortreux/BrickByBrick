# ⚡ Quick Start - BrickByBrick

## 🚀 Démarrage en 5 Minutes

### 1. Backend (Terminal 1)

```bash
cd backend
python main.py
```

**Attendez** :
```
✅ API PRÊTE - Tous les services sont opérationnels
📚 Documentation disponible sur :
   • Swagger UI : http://localhost:8000/docs
```

### 2. Frontend (Terminal 2)

```bash
# Première fois uniquement
npm install

# Créer .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Démarrer
npm run dev
```

**Attendez** :
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
✓ Ready in 2.5s
```

### 3. Ouvrir le Navigateur

**URL** : http://localhost:3000

---

## 🧪 Test Rapide

### Test 1 : Vue France

1. **Laisser** les champs vides
2. **Cliquer** "🔍 Explorer"
3. **Vérifier** :
   - ✅ Carte 96 départements
   - ✅ Classement rendements

### Test 2 : Vue Lyon

1. **Code Postal** : `69001`
2. **Département** : `69`
3. **Cliquer** "🔍 Explorer"
4. **Vérifier** :
   - ✅ Vue France
   - ✅ Graphique évolution Rhône
   - ✅ Gares Lyon (Part-Dieu, Perrache...)
   - ✅ Stats locales

---

## 📊 Architecture

```
Backend (Python/FastAPI)         Frontend (Next.js/React)
Port 8000                        Port 3000
│                                │
├─ GET /api/market-data    ────→ ├─ app/page.tsx
│                                │  ├─ FranceMap (Widget 5)
│  Retourne:                     │  ├─ RendementRanking (Widget 7)
│  • scope_france                │  ├─ PriceTrendChart (Widget 2)
│  • scope_departement           │  └─ LocalStats (Widgets 9-10)
│  • scope_city                  │
│                                │
└─ GET /api/health         ────→ └─ Health Check
```

---

## 🎯 Widgets Disponibles

| Widget | Description | Status |
|--------|-------------|--------|
| **5** | Carte Tensions Locatives | ✅ |
| **7** | Classement Rendements | ✅ |
| **2** | Évolution Prix 2020-2024 | ✅ |
| **9** | Gares Proches | ✅ |
| **10** | Établissements Supérieurs | ✅ |

---

## 🐛 Problèmes Courants

### ❌ "ECONNREFUSED"

**Cause** : Backend non démarré

**Solution** :
```bash
cd backend
python main.py
```

### ❌ "Module not found"

**Cause** : Dépendances non installées

**Solution** :
```bash
npm install
```

### ❌ Page blanche

**Cause** : Erreur JS

**Solution** : Ouvrir console (F12), lire l'erreur

---

## 📚 Documentation Complète

- **Backend** : `backend/PHASE_1_COMPLETE.md`
- **Frontend** : `FRONTEND_SETUP.md`
- **API** : http://localhost:8000/docs

---

**Tout fonctionne ?** 🎉 Commencez l'exploration !

http://localhost:3000
