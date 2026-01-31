"""
Module d'Analyse IA - Utilise OpenAI pour générer des analyses immobilières personnalisées
Prompt Engineering pour une analyse complète et détaillée
"""

import os
import json
import logging
from typing import Dict, Optional, Any
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

logger = logging.getLogger(__name__)

# Configuration OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


def get_openai_client():
    """Retourne un client OpenAI configuré"""
    try:
        from openai import OpenAI
        return OpenAI(api_key=OPENAI_API_KEY)
    except ImportError:
        logger.error("Le package 'openai' n'est pas installé. Installez-le avec: pip install openai")
        return None


def build_analysis_prompt(
    scraped_data: Dict,
    market_data: Dict,
    financial_data: Dict,
    user_preferences: Optional[Dict] = None
) -> str:
    """
    Construit le prompt pour l'analyse IA

    Args:
        scraped_data: Données extraites de l'annonce
        market_data: Données du marché (DVF, INSEE, loyers)
        financial_data: Calculs financiers préliminaires
        user_preferences: Préférences de l'utilisateur (optionnel)

    Returns:
        Le prompt complet pour l'IA
    """

    # Formater les données de l'annonce
    annonce_info = f"""
## DONNÉES DE L'ANNONCE IMMOBILIÈRE

- **Prix d'achat**: {scraped_data.get('prix', 'Non disponible'):,.0f} €
- **Surface**: {scraped_data.get('surface', 'Non disponible')} m²
- **Prix au m²**: {scraped_data.get('prix', 0) / max(scraped_data.get('surface', 1), 1):,.0f} €/m²
- **Localisation**: {scraped_data.get('ville', 'Non disponible')} ({scraped_data.get('code_postal', 'N/A')})
- **Nombre de pièces**: {scraped_data.get('nb_pieces', 'Non précisé')}
- **Titre de l'annonce**: {scraped_data.get('titre', 'Non disponible')}
"""

    # Formater les données du marché
    market_info = """
## DONNÉES DU MARCHÉ LOCAL
"""

    if market_data.get('dvf_stats'):
        dvf = market_data['dvf_stats']
        market_info += f"""
### Prix du marché (données DVF 2024)
- Prix médian/m² dans le département: {dvf.get('prix_m2_median', 'N/A'):,.0f} €
- Prix moyen/m²: {dvf.get('prix_m2_mean', 'N/A'):,.0f} €
- Nombre de ventes en 2024: {dvf.get('nb_ventes', 'N/A'):,}
"""
        if dvf.get('comparaison'):
            ecart = dvf['comparaison'].get('ecart_vs_median_pct', 0)
            market_info += f"- Écart par rapport à la médiane: {'+' if ecart > 0 else ''}{ecart:.1f}%\n"

    if market_data.get('loyers_stats'):
        loyers = market_data['loyers_stats']
        market_info += f"""
### Loyers du marché
- Loyer médian/m²: {loyers.get('loyer_m2_median', 'N/A'):.2f} €
- Loyer mensuel estimé pour ce bien: {loyers.get('loyer_mensuel_estime', 'N/A'):,.0f} €
- Rendement brut estimé: {loyers.get('rendement_brut_estime', 'N/A'):.2f}%
"""

    if market_data.get('insee_stats'):
        insee = market_data['insee_stats']
        market_info += f"""
### Tension locative (INSEE)
- Taux de vacance: {insee.get('taux_vacance', 'N/A'):.1f}%
- Part de locataires: {insee.get('part_locataires', 'N/A'):.1f}%
- Niveau de tension: {'Élevée (marché tendu)' if insee.get('taux_vacance', 100) < 6 else 'Moyenne' if insee.get('taux_vacance', 100) < 8 else 'Faible (marché détendu)'}
"""

    if market_data.get('transport_stats') and market_data['transport_stats'].get('nb_gares', 0) > 0:
        transport = market_data['transport_stats']
        market_info += f"""
### Transports
- Nombre de gares à proximité: {transport.get('nb_gares', 0)}
- Gares: {', '.join(transport.get('noms_gares', [])[:3])}
"""

    if market_data.get('student_stats') and market_data['student_stats'].get('nb_etablissements', 0) > 0:
        student = market_data['student_stats']
        market_info += f"""
### Enseignement supérieur
- Établissements à proximité: {student.get('nb_etablissements', 0)}
"""

    # Formater les données financières
    financial_info = f"""
## SIMULATION FINANCIÈRE PRÉLIMINAIRE

### Financement
- Coût total du projet (avec frais de notaire): {financial_data.get('cout_total_projet', 'N/A'):,.0f} €
- Frais de notaire estimés: {financial_data.get('frais_notaire', 'N/A'):,.0f} €
- Montant à emprunter: {financial_data.get('montant_emprunt', 'N/A'):,.0f} €
- Mensualité de crédit estimée: {financial_data.get('mensualite_totale', 'N/A'):,.0f} €/mois

### Rentabilité
- Loyer mensuel estimé: {financial_data.get('loyer_mensuel_brut', 'N/A'):,.0f} €
- Rentabilité brute: {financial_data.get('rentabilite_brute', 'N/A'):.2f}%
- Rentabilité nette (après charges): {financial_data.get('rentabilite_nette', 'N/A'):.2f}%
- Cashflow mensuel net: {financial_data.get('cashflow_mensuel_net', 'N/A'):,.0f} €
- Autofinancement: {'Oui' if financial_data.get('autofinancement', False) else 'Non'}
"""

    # Ajouter les préférences utilisateur si disponibles
    user_info = ""
    if user_preferences:
        user_info = f"""
## PROFIL DE L'INVESTISSEUR

- Budget maximum: {user_preferences.get('prix_projet', 'Non défini'):,.0f} €
- Apport disponible: {user_preferences.get('apport', 'Non défini'):,.0f} €
- Durée de crédit souhaitée: {user_preferences.get('duree_credit', 'Non définie')} ans
- Statut professionnel: {user_preferences.get('statut', 'Non défini')}
- Revenus mensuels: {user_preferences.get('revenu', 'Non défini'):,.0f} €
"""

    # Construire le prompt final
    prompt = f"""Tu es un expert en investissement immobilier locatif en France. Tu dois analyser cette annonce immobilière et fournir une analyse complète et personnalisée.

{annonce_info}

{market_info}

{financial_info}

{user_info}

---

## TA MISSION

Analyse cette opportunité d'investissement et fournis une réponse structurée au format JSON avec les champs suivants:

```json
{{
  "score": <nombre entre 0 et 100>,
  "verdict": "<Excellent investissement|Bon investissement|Investissement correct|Investissement risqué|À éviter>",
  "resume": "<Résumé en 2-3 phrases de l'opportunité>",
  "points_forts": [
    "<Point fort 1>",
    "<Point fort 2>",
    ...
  ],
  "points_vigilance": [
    "<Point de vigilance 1>",
    "<Point de vigilance 2>",
    ...
  ],
  "analyse_prix": {{
    "evaluation": "<Sous-évalué|Prix correct|Légèrement surévalué|Surévalué>",
    "explication": "<Explication détaillée de l'évaluation du prix>"
  }},
  "analyse_rentabilite": {{
    "niveau": "<Excellente|Bonne|Moyenne|Faible>",
    "explication": "<Explication de la rentabilité et comparaison avec le marché>"
  }},
  "analyse_localisation": {{
    "potentiel": "<Fort|Moyen|Faible>",
    "explication": "<Analyse du potentiel locatif de la zone>"
  }},
  "analyse_cashflow": {{
    "situation": "<Positif|Équilibre|Effort d'épargne>",
    "explication": "<Explication du cashflow et recommandations>"
  }},
  "recommandations": [
    "<Recommandation concrète 1>",
    "<Recommandation concrète 2>",
    "<Recommandation concrète 3>"
  ],
  "conclusion": "<Conclusion finale personnalisée de 3-4 phrases>"
}}
```

## CRITÈRES D'ÉVALUATION POUR LE SCORE

- **Rentabilité nette** (25 points max):
  - ≥ 6%: 25 pts | 4.5-6%: 20 pts | 3-4.5%: 15 pts | < 3%: 5 pts

- **Cashflow** (25 points max):
  - ≥ +200€/mois: 25 pts | ≥ 0€: 20 pts | -100€ à 0€: 10 pts | < -100€: 5 pts

- **Prix par rapport au marché** (20 points max):
  - Sous-évalué (≤-10%): 20 pts | Correct (±10%): 15 pts | Surévalué (>10%): 5 pts

- **Tension locative** (15 points max):
  - Forte (<6% vacance): 15 pts | Moyenne (6-8%): 10 pts | Faible (>8%): 5 pts

- **Potentiel de valorisation** (15 points max):
  - Basé sur l'emplacement, les transports, les établissements à proximité

## CONSIGNES IMPORTANTES

1. Sois précis et factuel dans ton analyse
2. Utilise les données fournies pour justifier chaque point
3. Donne des conseils actionnables et concrets
4. Adapte ton analyse au profil de l'investisseur si fourni
5. Sois honnête sur les risques potentiels
6. Réponds UNIQUEMENT avec le JSON, sans texte avant ou après
"""

    return prompt


def analyze_with_ai(
    scraped_data: Dict,
    market_data: Dict,
    financial_data: Dict,
    user_preferences: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Analyse une annonce immobilière avec l'IA OpenAI

    Args:
        scraped_data: Données extraites de l'annonce
        market_data: Données du marché (DVF, INSEE, loyers)
        financial_data: Calculs financiers préliminaires
        user_preferences: Préférences de l'utilisateur (optionnel)

    Returns:
        Analyse complète générée par l'IA
    """

    if not OPENAI_API_KEY:
        logger.warning("Clé OpenAI non configurée, utilisation de l'analyse basique")
        return generate_fallback_analysis(scraped_data, market_data, financial_data)

    client = get_openai_client()
    if not client:
        return generate_fallback_analysis(scraped_data, market_data, financial_data)

    try:
        # Construire le prompt
        prompt = build_analysis_prompt(scraped_data, market_data, financial_data, user_preferences)

        logger.info("🤖 Envoi de la requête à OpenAI...")

        # Appel à l'API OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Modèle rapide et économique
            messages=[
                {
                    "role": "system",
                    "content": "Tu es un expert en investissement immobilier locatif. Tu analyses des annonces et fournis des conseils personnalisés. Tu réponds toujours en JSON valide."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )

        # Extraire la réponse
        ai_response = response.choices[0].message.content

        logger.info("✅ Réponse OpenAI reçue")

        # Parser le JSON
        try:
            analysis = json.loads(ai_response)
            analysis["ai_generated"] = True
            analysis["model"] = "gpt-4o-mini"
            return analysis
        except json.JSONDecodeError as e:
            logger.error(f"Erreur parsing JSON OpenAI: {e}")
            logger.error(f"Réponse brute: {ai_response[:500]}")
            return generate_fallback_analysis(scraped_data, market_data, financial_data)

    except Exception as e:
        logger.error(f"Erreur OpenAI: {e}")
        return generate_fallback_analysis(scraped_data, market_data, financial_data)


def generate_fallback_analysis(
    scraped_data: Dict,
    market_data: Dict,
    financial_data: Dict
) -> Dict[str, Any]:
    """
    Génère une analyse basique si l'IA n'est pas disponible
    Utilise la logique de scoring existante
    """

    # Calcul du score basique
    score = 50  # Score de base

    # Rentabilité
    rentabilite_nette = financial_data.get('rentabilite_nette', 0)
    if rentabilite_nette >= 6:
        score += 25
    elif rentabilite_nette >= 4.5:
        score += 20
    elif rentabilite_nette >= 3:
        score += 10

    # Cashflow
    cashflow = financial_data.get('cashflow_mensuel_net', 0)
    if cashflow >= 200:
        score += 20
    elif cashflow >= 0:
        score += 15
    elif cashflow >= -100:
        score += 5

    # Limiter le score
    score = max(0, min(100, score))

    # Verdict
    if score >= 80:
        verdict = "Excellent investissement"
    elif score >= 65:
        verdict = "Bon investissement"
    elif score >= 50:
        verdict = "Investissement correct"
    elif score >= 35:
        verdict = "Investissement risqué"
    else:
        verdict = "À éviter"

    return {
        "score": score,
        "verdict": verdict,
        "resume": f"Bien de {scraped_data.get('surface', 'N/A')}m² à {scraped_data.get('ville', 'N/A')} avec une rentabilité nette de {rentabilite_nette:.2f}%.",
        "points_forts": [
            f"Rentabilité de {rentabilite_nette:.2f}%" if rentabilite_nette >= 4 else "Prix accessible",
            "Marché locatif actif" if market_data.get('insee_stats', {}).get('taux_vacance', 10) < 8 else "Localisation à étudier"
        ],
        "points_vigilance": [
            "Cashflow négatif à surveiller" if cashflow < 0 else "Bien gérer les charges",
            "Vérifier l'état du bien avant achat"
        ],
        "analyse_prix": {
            "evaluation": "Prix correct",
            "explication": "Analyse basée sur les données DVF du département."
        },
        "analyse_rentabilite": {
            "niveau": "Bonne" if rentabilite_nette >= 4.5 else "Moyenne" if rentabilite_nette >= 3 else "Faible",
            "explication": f"Rentabilité nette de {rentabilite_nette:.2f}%."
        },
        "analyse_localisation": {
            "potentiel": "Moyen",
            "explication": "Analyse locale non disponible sans l'IA."
        },
        "analyse_cashflow": {
            "situation": "Positif" if cashflow >= 0 else "Effort d'épargne",
            "explication": f"Cashflow mensuel net de {cashflow:,.0f}€."
        },
        "recommandations": [
            "Vérifier l'état du bien lors de la visite",
            "Comparer avec d'autres biens similaires dans le secteur",
            "Négocier le prix si possible"
        ],
        "conclusion": f"Ce bien présente {'un bon potentiel' if score >= 60 else 'des points à approfondir'} pour un investissement locatif. Score global: {score}/100.",
        "ai_generated": False,
        "model": "fallback"
    }


# Test du module
if __name__ == "__main__":
    print("\n🧪 TEST DU MODULE AI ANALYZER")
    print("=" * 80)

    if not OPENAI_API_KEY:
        print("❌ Clé OpenAI non configurée")
        print("   Ajoutez OPENAI_API_KEY=votre_cle dans le fichier .env")
    else:
        print(f"✅ Clé OpenAI configurée: {OPENAI_API_KEY[:10]}...")

        # Test avec des données fictives
        test_scraped = {
            "prix": 150000,
            "surface": 45,
            "ville": "Lyon",
            "code_postal": "69001",
            "nb_pieces": 2
        }

        test_market = {
            "dvf_stats": {
                "prix_m2_median": 3500,
                "nb_ventes": 1500
            },
            "loyers_stats": {
                "loyer_m2_median": 14.5,
                "loyer_mensuel_estime": 652
            }
        }

        test_financial = {
            "rentabilite_nette": 4.8,
            "cashflow_mensuel_net": 50,
            "autofinancement": True
        }

        def test():
            result = analyze_with_ai(test_scraped, test_market, test_financial)
            print("\n📊 Résultat de l'analyse:")
            print(json.dumps(result, indent=2, ensure_ascii=False))

        test()
