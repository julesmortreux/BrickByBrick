# 📁 Dossier Data

Ce dossier contient les datasets CSV utilisés par l'API BrickByBrick.

## 📋 Fichiers Requis

Placez les fichiers suivants dans ce dossier :

### Essentiels (obligatoires)
- ✅ `dvf_clean_2024.csv` - Ventes immobilières 2024 (DVF)
- ✅ `loyers_clean_2024.csv` - Loyers médians 2024 (INSEE)

### Optionnels (pour fonctionnalités avancées)
- 📊 `dvf_clean_2020_2024.csv` - Historique ventes 2020-2024 (analyse de marché)
- 🏘️ `insee_logement_2021_clean.csv` - Tension locative & vacance
- 🎓 `enseignement_superieur_clean.csv` - Établissements supérieurs
- 🚄 `gares_clean.csv` - Gares SNCF

## 📥 Sources des Données

- **DVF** : https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres/
- **INSEE** : https://www.insee.fr/fr/statistiques
- **SNCF** : https://data.sncf.com/

## ⚠️ Important

**Ces fichiers CSV volumineux ne sont PAS versionnés dans Git** (voir `.gitignore`).

Chaque membre de l'équipe doit télécharger et placer ces fichiers manuellement dans ce dossier.

## 🧪 Vérifier le Chargement

Pour tester que tous les fichiers sont bien placés :

```bash
cd backend
python data_loader.py
```

Vous devriez voir :
```
✅ dvf_clean_2024.csv : 1,066,493 lignes (80.4 Mo)
✅ loyers_clean_2024.csv : 136,498 lignes (11.7 Mo)
...
🎉 Tous les fichiers ont été chargés avec succès !
```
