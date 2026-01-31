# 🚀 BrickByBrick - Backend API

API FastAPI pour la plateforme d'aide à l'investissement immobilier locatif.

---

## 📋 Prérequis

- **Python 3.10+**
- Fichiers CSV dans le dossier `../data/` (voir [data/README.md](../data/README.md))

---

## ⚙️ Installation

### 1. Créer un environnement virtuel

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

---

## 🚀 Lancement de l'API

### Mode Développement (avec rechargement automatique)

```bash
python main.py
```

Ou avec uvicorn directement :

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Mode Production

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 📍 URLs Importantes

| Service | URL | Description |
|---------|-----|-------------|
| **API Root** | http://localhost:8000 | Point d'entrée principal |
| **Health Check** | http://localhost:8000/api/health | État de santé de l'API |
| **Swagger UI** | http://localhost:8000/docs | Documentation interactive |
| **ReDoc** | http://localhost:8000/redoc | Documentation alternative |

---

## 🧪 Tester l'API

### 1. Vérifier que l'API est en ligne

```bash
curl http://localhost:8000
```

**Réponse attendue :**
```json
{
  "status": "online",
  "version": "1.0.0",
  "name": "BrickByBrick API",
  "timestamp": "2026-01-11T...",
  "docs": "/docs"
}
```

### 2. Vérifier le chargement des données

```bash
curl http://localhost:8000/api/health
```

**Réponse attendue :**
```json
{
  "api_status": "healthy",
  "data_loaded": true,
  "datasets": {
    "dvf_2024": {
      "loaded": true,
      "rows": 1066493
    },
    "loyers": {
      "loaded": true,
      "rows": 136498
    },
    ...
  },
  "loaded_count": 6,
  "total_count": 6,
  "message": "✅ Tous les datasets sont chargés (6/6). API pleinement opérationnelle."
}
```

---

## 📊 Architecture

```
backend/
├── main.py              # Point d'entrée FastAPI
├── data_loader.py       # Chargement des datasets CSV
├── requirements.txt     # Dépendances Python
└── README.md           # Ce fichier

../data/                 # Datasets CSV (non versionnés)
├── dvf_clean_2024.csv
├── loyers_clean_2024.csv
└── ...
```

---

## 🔧 Configuration CORS

Le serveur autorise les requêtes depuis :
- `http://localhost:3000` (frontend Next.js)
- `http://127.0.0.1:3000`

Pour ajouter d'autres origines, modifiez `main.py` :

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://votre-domaine.com"  # Ajouter ici
    ],
    ...
)
```

---

## 🐛 Dépannage

### Erreur : "Fichier introuvable"

**Cause :** Les fichiers CSV ne sont pas dans le dossier `data/`

**Solution :**
1. Vérifiez que le dossier `../data/` existe
2. Placez-y les fichiers CSV requis (voir [data/README.md](../data/README.md))
3. Testez avec : `python data_loader.py`

### Erreur : "Module not found"

**Cause :** Dépendances non installées ou mauvais environnement virtuel

**Solution :**
```bash
# Vérifier l'environnement virtuel
which python  # macOS/Linux
where python  # Windows

# Réinstaller les dépendances
pip install -r requirements.txt
```

### Port 8000 déjà utilisé

**Solution :** Changer le port dans `main.py` :
```python
uvicorn.run("main:app", port=8001)  # Utiliser 8001
```

---

## 📚 Prochaines Étapes

- [ ] Créer les routes pour les widgets (faisabilité, DVF, loyers)
- [ ] Implémenter l'analyse d'annonces SeLoger
- [ ] Ajouter l'authentification utilisateur
- [ ] Connecter à PostgreSQL

---

## 📝 Logs

Les logs sont affichés dans la console avec le format :
```
2026-01-11 10:30:45 - root - INFO - ✅ dvf_clean_2024.csv : 1,066,493 lignes
```

Niveau de log par défaut : **INFO**

---

## 🤝 Contribution

Pour ajouter un nouveau endpoint :

1. Créer une nouvelle route dans `main.py` ou un module dédié
2. Utiliser `get_data_store()` pour accéder aux données
3. Documenter avec des docstrings (apparaîtront dans Swagger)
4. Tester avec `curl` ou Swagger UI

**Exemple :**

```python
from data_loader import get_data_store

@app.get("/api/prix/{departement}")
async def get_prix_departement(departement: str):
    """Récupère le prix médian d'un département"""
    data_store = get_data_store()
    
    if data_store.dvf_2024 is None:
        return {"error": "Données DVF non disponibles"}
    
    # Filtrer et calculer
    dept_data = data_store.dvf_2024[
        data_store.dvf_2024['Code departement'] == departement
    ]
    
    return {
        "departement": departement,
        "prix_m2_median": float(dept_data['prix_m2'].median()),
        "nb_ventes": len(dept_data)
    }
```

---

**Version :** 1.0.0  
**Dernière mise à jour :** Janvier 2026
