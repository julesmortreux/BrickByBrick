# 🧪 Tests de l'API BrickByBrick

Guide pour tester les endpoints de simulation financière.

---

## 🚀 Lancer l'API

```bash
cd backend
python main.py
```

L'API sera disponible sur http://localhost:8000

---

## 📊 Test 1 : Simulation Minimale (Auto-estimation)

L'API estime automatiquement :
- Le loyer via données INSEE
- Les charges de copropriété
- La taxe foncière
- Les travaux selon l'état

### Requête cURL

```bash
curl -X POST "http://localhost:8000/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "prix": 150000,
    "surface": 45,
    "code_postal": "75001"
  }'
```

### Requête Python

```python
import requests

response = requests.post(
    "http://localhost:8000/api/simulate",
    json={
        "prix": 150000,
        "surface": 45,
        "code_postal": "75001"
    }
)

result = response.json()
print(f"Score : {result['score_investissement']}/100")
print(f"Cashflow : {result['cashflow_mensuel_net']}€/mois")
print(f"Rentabilité nette : {result['rentabilite_nette']}%")
```

---

## 📊 Test 2 : Simulation Complète (Tous les paramètres)

### Requête cURL

```bash
curl -X POST "http://localhost:8000/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "prix": 180000,
    "surface": 55,
    "code_postal": "69001",
    "type_bien": "appartement",
    "etat_bien": "ancien",
    "nb_pieces": 3,
    "apport": 30000,
    "duree_credit": 20,
    "taux_interet": 3.5,
    "loyer_mensuel": 1100,
    "charges_copro": 120,
    "taxe_fonciere": 900,
    "travaux": 15000,
    "gestion_locative": true,
    "taux_gestion": 8.0,
    "vacance_locative_mois": 1.0
  }'
```

### Requête Python

```python
import requests
import json

simulation = {
    "prix": 180000,
    "surface": 55,
    "code_postal": "69001",
    "type_bien": "appartement",
    "etat_bien": "ancien",
    "nb_pieces": 3,
    "apport": 30000,
    "duree_credit": 20,
    "taux_interet": 3.5,
    "loyer_mensuel": 1100,
    "charges_copro": 120,
    "taxe_fonciere": 900,
    "travaux": 15000,
    "gestion_locative": True,
    "taux_gestion": 8.0,
    "vacance_locative_mois": 1.0
}

response = requests.post(
    "http://localhost:8000/api/simulate",
    json=simulation
)

if response.status_code == 200:
    result = response.json()
    
    print("\n" + "="*60)
    print("📊 RÉSULTATS DE LA SIMULATION")
    print("="*60)
    
    print(f"\n💰 COÛT TOTAL DU PROJET")
    print(f"   Prix d'achat : {result['prix_achat']:,.0f}€")
    print(f"   Frais de notaire : {result['frais_notaire']:,.0f}€")
    print(f"   Travaux : {result['travaux']:,.0f}€")
    print(f"   TOTAL : {result['cout_total_projet']:,.0f}€")
    
    print(f"\n🏦 FINANCEMENT")
    print(f"   Apport : {result['apport']:,.0f}€")
    print(f"   Emprunt : {result['montant_emprunt']:,.0f}€")
    print(f"   Mensualité : {result['mensualite_totale']:,.0f}€")
    
    print(f"\n📈 RENTABILITÉ")
    print(f"   Brute : {result['rentabilite_brute']:.2f}%")
    print(f"   Nette : {result['rentabilite_nette']:.2f}%")
    print(f"   Nette-nette : {result['rentabilite_nette_nette']:.2f}%")
    
    print(f"\n💵 CASHFLOW")
    print(f"   Mensuel net : {result['cashflow_mensuel_net']:,.0f}€")
    print(f"   Annuel net : {result['cashflow_annuel_net']:,.0f}€")
    print(f"   Autofinancement : {'✅ OUI' if result['autofinancement'] else '❌ NON'}")
    
    print(f"\n🎯 VERDICT")
    print(f"   Score : {result['score_investissement']:.1f}/100")
    print(f"   {result['verdict']}")
    
    print(f"\n💡 CONSEILS")
    for conseil in result['conseils']:
        print(f"   • {conseil}")
    
    print("\n" + "="*60)
else:
    print(f"❌ Erreur : {response.status_code}")
    print(response.json())
```

---

## 📊 Test 3 : Comparaison de Plusieurs Biens

```python
import requests
import pandas as pd

# Liste de biens à comparer
biens = [
    {
        "nom": "T2 Paris 11e",
        "prix": 280000,
        "surface": 38,
        "code_postal": "75011"
    },
    {
        "nom": "T3 Lyon 1er",
        "prix": 180000,
        "surface": 55,
        "code_postal": "69001"
    },
    {
        "nom": "T2 Marseille",
        "prix": 120000,
        "surface": 45,
        "code_postal": "13001"
    }
]

resultats = []

for bien in biens:
    response = requests.post(
        "http://localhost:8000/api/simulate",
        json=bien
    )
    
    if response.status_code == 200:
        result = response.json()
        resultats.append({
            "Bien": bien["nom"],
            "Prix": bien["prix"],
            "Cashflow": result["cashflow_mensuel_net"],
            "Rentabilité": result["rentabilite_nette"],
            "Score": result["score_investissement"],
            "Autofinancement": "✅" if result["autofinancement"] else "❌"
        })

# Afficher sous forme de tableau
df = pd.DataFrame(resultats)
print(df.to_string(index=False))
```

**Output attendu :**

```
              Bien    Prix  Cashflow  Rentabilité  Score Autofinancement
      T2 Paris 11e  280000    -250.5         2.85   45.0              ❌
       T3 Lyon 1er  180000     125.0         4.75   72.5              ✅
    T2 Marseille    120000     310.0         5.80   85.0              ✅
```

---

## 📊 Test 4 : Swagger UI (Interface Interactive)

1. Ouvrir http://localhost:8000/docs dans votre navigateur
2. Cliquer sur `POST /api/simulate`
3. Cliquer sur "Try it out"
4. Modifier le JSON d'exemple
5. Cliquer sur "Execute"
6. Voir la réponse complète

---

## 🧪 Test 5 : Validation des Données (Erreurs)

### Test erreur : Prix négatif

```bash
curl -X POST "http://localhost:8000/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "prix": -50000,
    "surface": 45,
    "code_postal": "75001"
  }'
```

**Réponse attendue :** Erreur 422 (Validation Error)

### Test erreur : Code postal invalide

```bash
curl -X POST "http://localhost:8000/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "prix": 150000,
    "surface": 45,
    "code_postal": "123"
  }'
```

**Réponse attendue :** Erreur 422 (Code postal doit avoir 5 caractères)

---

## 🎯 Indicateurs Clés Retournés

| Indicateur | Description | Unité |
|------------|-------------|-------|
| `score_investissement` | Score global /100 | points |
| `rentabilite_brute` | (Loyer annuel / Prix) × 100 | % |
| `rentabilite_nette` | (Loyer net / Coût total) × 100 | % |
| `rentabilite_nette_nette` | Après impôts (~30%) | % |
| `cashflow_mensuel_net` | Loyer - Mensualité - Charges | € |
| `autofinancement` | Cashflow ≥ 0 ? | bool |
| `mensualite_totale` | Crédit + Assurance | € |
| `cout_total_projet` | Prix + Frais + Travaux | € |
| `frais_notaire` | Selon état (3% neuf, 8% ancien) | € |

---

## 💡 Cas d'Usage Réels

### Cas 1 : Jeune actif avec apport limité

```json
{
  "prix": 120000,
  "surface": 42,
  "code_postal": "59000",
  "apport": 5000,
  "duree_credit": 25
}
```

### Cas 2 : Investisseur expérimenté

```json
{
  "prix": 250000,
  "surface": 80,
  "code_postal": "33000",
  "type_bien": "maison",
  "etat_bien": "rénové",
  "apport": 75000,
  "duree_credit": 15,
  "loyer_mensuel": 1500,
  "gestion_locative": false
}
```

### Cas 3 : Étudiant avec garant

```json
{
  "prix": 90000,
  "surface": 30,
  "code_postal": "69000",
  "apport": 10000,
  "duree_credit": 20,
  "taux_interet": 4.2
}
```

---

## 🔍 Vérification des Estimations

### Loyer estimé correctement ?

```python
# Vérifier le loyer estimé par l'API
response = requests.post(
    "http://localhost:8000/api/simulate",
    json={"prix": 150000, "surface": 45, "code_postal": "75001"}
)

loyer_estime = response.json()["loyer_mensuel_brut"]
print(f"Loyer estimé : {loyer_estime}€/mois")

# Comparer avec les données réelles du marché
# Paris 1er : ~30-35€/m² → 45m² = 1350-1575€
```

---

## 📝 Notes Importantes

### Frais de Notaire Réalistes

- **Neuf** : 3% (TVA réduite)
- **Ancien** : 8% (droits de mutation)

### Charges Estimées

- **Copro** : 30€/m²/an pour appartement
- **Taxe foncière** : 18€/m²/an
- **Assurance PNO** : 4.5€/m²/an

### Travaux Estimés

- **Neuf** : 0€
- **Rénové** : 2 000€
- **Ancien** : 500€/m²

---

## 🐛 Dépannage

### L'API retourne un loyer très faible/élevé

➡️ Les données INSEE sont départementales. Dans certaines zones, le loyer peut être imprécis.
➡️ **Solution** : Fournir `loyer_mensuel` dans la requête

### Le score est toujours faible

➡️ Vérifiez le cashflow et la rentabilité nette
➡️ Augmentez l'apport ou négociez le prix

### Erreur 500

➡️ Vérifiez les logs du serveur
➡️ Vérifiez que les données CSV sont chargées (`GET /api/health`)

---

**Version :** 1.0.0  
**Dernière mise à jour :** Janvier 2026
