# Audit de Sécurité et d'Optimisation - BrickByBrick

Ce document présente une analyse détaillée de la sécurité et des performances de la plateforme BrickByBrick.

## 🚨 Résumé Exécutif

L'application présente une base solide avec FastAPI et Next.js, mais comporte des vulnérabilités de sécurité critiques pour une application financière (gestion des tokens) et des problèmes d'architecture qui limiteront rapidement la montée en charge (blocage de l'Event Loop, chargement des données en mémoire).

---

## 🔒 Analyse de Sécurité

### 1. Stockage des Tokens (Risque Élevé)
**Problème :** Le frontend (`frontend/lib/auth.tsx`) stocke les JWT (`access_token`, `refresh_token`) dans le `localStorage`.
**Risque :** Vulnérabilité aux attaques XSS (Cross-Site Scripting). Si un script malveillant est injecté (via une dépendance compromise ou une faille XSS), il peut exfiltrer les tokens et usurper l'identité de l'utilisateur.
**Recommandation :** Stocker les tokens (surtout le `refresh_token`) dans des cookies **HttpOnly**, **Secure** et **SameSite**.

### 2. Gestion des Secrets (Risque Moyen)
**Problème :** Dans `backend/auth.py`, une clé par défaut est fournie : `SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-...")`.
**Risque :** Si la variable d'environnement est absente en production, l'application démarrera avec une clé connue publiquement, compromettant toutes les signatures JWT.
**Recommandation :** Supprimer la valeur par défaut et lever une erreur explicite au démarrage si la clé est manquante.

### 3. Configuration CORS (Risque Moyen)
**Problème :** `backend/main.py` autorise toutes les méthodes et tous les headers (`allow_methods=["*"]`, `allow_headers=["*"]`).
**Risque :** Surface d'attaque inutilement large.
**Recommandation :** Restreindre les méthodes HTTP aux seules nécessaires (GET, POST, PUT, DELETE) et spécifier les headers autorisés.

### 4. Dépendances (Risque Moyen)
**Problème :** `backend/requirements.txt` ne spécifie pas de versions (ex: `fastapi` au lieu de `fastapi==0.109.0`).
**Risque :** Instabilité et risque d'introduire des versions contenant des failles de sécurité lors d'un redéploiement.
**Recommandation :** Figer (pin) les versions exactes de toutes les dépendances.

### 5. Absence de Rate Limiting (Risque Moyen)
**Problème :** Aucun mécanisme de limitation de débit n'est visible.
**Risque :** Vulnérabilité aux attaques par force brute (sur `/auth/login`) et Déni de Service (DoS) sur les endpoints coûteux (ex: `/api/analyze` qui fait du scraping).
**Recommandation :** Implémenter `slowapi` ou un middleware similaire pour limiter le nombre de requêtes par IP.

### 6. Audit Logs (Spécifique Finance)
**Problème :** Les actions sensibles (modifications de préférences, simulations) ne semblent pas tracées dans une table d'audit dédiée.
**Recommandation :** Pour une application financière, il est crucial de conserver un historique immuable des actions critiques.

---

## ⚡ Analyse d'Optimisation

### 1. Blocage de l'Event Loop (Critique)
**Problème :** Les endpoints sont définis en `async def` (ex: `get_market_data` dans `main.py`) mais appellent des fonctions synchrones lourdes (Pandas dans `widgets.py`).
**Impact :** En Python, `async def` s'exécute directement sur la boucle d'événements (Event Loop). Une opération Pandas lourde (ex: filtrage de 1M lignes) **bloquera** tout le serveur pour tous les utilisateurs pendant son exécution.
**Recommandation :**
*   **Solution Rapide :** Retirer `async` devant la définition des endpoints (FastAPI les exécutera alors dans un threadpool séparé).
*   **Solution Robuste :** Utiliser `fastapi.concurrency.run_in_threadpool` pour les appels Pandas, ou déléguer à des workers (Celery/RQ).

### 2. Chargement des Données (Critique)
**Problème :** `backend/data_loader.py` charge l'intégralité des fichiers CSV en mémoire RAM au démarrage (Singleton).
**Impact :**
*   Consommation mémoire excessive (OOM) à mesure que les données grossissent (DVF France entière est très lourd).
*   Temps de démarrage long.
*   Impossibilité de scaler horizontalement efficacement (chaque instance duplique les données en RAM).
**Recommandation :** Migrer vers une base de données PostgreSQL avec l'extension **PostGIS**. Les filtrages géographiques et par critères seront gérés par le moteur de BDD (beaucoup plus efficace et scalable).

### 3. Caching
**Problème :** `widgets.py` utilise un cache basique ou un dictionnaire Python.
**Recommandation :** Utiliser **Redis** pour mettre en cache les réponses des endpoints fréquents (ex: statistiques nationales) et les résultats de scraping.

### 4. Scraping Synchrone
**Problème :** L'endpoint `/api/analyze` effectue le scraping en temps réel.
**Impact :** Latence très élevée pour l'utilisateur (30-90s).
**Recommandation :** Passer en mode asynchrone : l'utilisateur lance l'analyse, reçoit un ID, et le frontend poll le statut ou utilise des WebSockets/SSE pour recevoir le résultat quand il est prêt.

---

## ✅ Plan d'Action Recommandé

1.  **Immédiat** : Retirer `async` des endpoints FastAPI faisant du Pandas.
2.  **Immédiat** : Figer les versions dans `requirements.txt`.
3.  **Court Terme** : Migrer le stockage des tokens vers des cookies HttpOnly.
4.  **Moyen Terme** : Remplacer le chargement CSV par PostgreSQL/PostGIS.
