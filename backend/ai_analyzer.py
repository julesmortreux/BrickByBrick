"""
Module d'Analyse IA v2 — Analyse croisée personnalisée
Utilise OpenAI pour générer des analyses immobilières ludiques et personnalisées.
Le score est calculé en amont (scoring v2), l'IA rédige le texte analytique.
"""

import os
import json
import logging
from typing import Dict, Optional, Any
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

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
    user_preferences: Optional[Dict] = None,
    score_v2: float = 0,
    verdict_v2: str = "",
    score_details: Optional[Dict] = None,
    cross_data: Optional[Dict] = None,
) -> str:
    """
    Construit le prompt enrichi v2 pour l'analyse IA.
    Le score est déjà calculé — l'IA rédige le texte autour.
    """

    # ── Données de l'annonce ──
    prix = scraped_data.get("prix", 0)
    surface = scraped_data.get("surface", 1)
    annonce_info = f"""
## DONNÉES DE L'ANNONCE

- **Prix d'achat** : {prix:,.0f} €
- **Surface** : {surface} m²
- **Prix au m²** : {prix / max(surface, 1):,.0f} €/m²
- **Localisation** : {scraped_data.get('ville', 'N/A')} ({scraped_data.get('code_postal', 'N/A')})
- **Nombre de pièces** : {scraped_data.get('nb_pieces', 'Non précisé')}
- **Titre** : {scraped_data.get('titre', 'N/A')}
"""

    # ── Données du marché ──
    market_info = "\n## DONNÉES DU MARCHÉ LOCAL\n"

    if market_data.get("dvf_stats"):
        dvf = market_data["dvf_stats"]
        market_info += f"""
### Prix du marché (DVF 2024)
- Prix médian/m² dans le département : {dvf.get('prix_m2_median', 0):,.0f} €
- Prix moyen/m² : {dvf.get('prix_m2_mean', 0):,.0f} €
- Nombre de ventes : {dvf.get('nb_ventes', 0):,}
"""
        if dvf.get("comparaison"):
            ecart = dvf["comparaison"].get("ecart_vs_median_pct", 0)
            market_info += f"- Écart vs médiane : {'+' if ecart > 0 else ''}{ecart:.1f}%\n"

    if market_data.get("loyers_stats"):
        loyers = market_data["loyers_stats"]
        market_info += f"""
### Loyers du marché
- Loyer médian/m² : {loyers.get('loyer_m2_median', 0):.2f} €
- Loyer mensuel estimé : {loyers.get('loyer_mensuel_estime', 0):,.0f} €
- Rendement brut estimé : {loyers.get('rendement_brut_estime', 0):.2f}%
"""

    if market_data.get("insee_stats"):
        insee = market_data["insee_stats"]
        tv = insee.get("taux_vacance", 0)
        tension = "Forte (marché tendu)" if tv < 6 else "Moyenne" if tv < 8 else "Faible (marché détendu)"
        market_info += f"""
### Tension locative (INSEE)
- Taux de vacance : {tv:.1f}%
- Part de locataires : {insee.get('part_locataires', 0):.1f}%
- Niveau de tension : {tension}
"""

    if market_data.get("transport_stats") and market_data["transport_stats"].get("nb_gares", 0) > 0:
        t = market_data["transport_stats"]
        market_info += f"\n### Transports\n- {t['nb_gares']} gare(s) SNCF à proximité : {', '.join(t.get('noms_gares', [])[:3])}\n"

    if market_data.get("student_stats") and market_data["student_stats"].get("nb_etablissements", 0) > 0:
        market_info += f"\n### Enseignement supérieur\n- {market_data['student_stats']['nb_etablissements']} établissement(s) à proximité\n"

    # ── Croisements widgets ──
    cross_info = "\n## CROISEMENTS WIDGETS (données enrichies)\n"
    cd = cross_data or {}

    if cd.get("rendement_dept"):
        rd = cd["rendement_dept"]
        cross_info += f"""
### Rendement du département
- Rendement brut moyen : {rd['rendement_brut_pct']:.2f}%
- Classement national : {rd.get('rang_national', 'N/A')}e sur {rd.get('total_departements', 96)} départements
"""

    if cd.get("tendance_prix"):
        tp = cd["tendance_prix"]
        cross_info += f"""
### Tendance des prix (5 ans)
- Évolution : {tp['evolution_pct']:+.1f}% ({tp['annee_debut']}-{tp['annee_fin']})
- Tendance : {tp['tendance'].upper()}
- Prix m² début : {tp['prix_m2_debut']:,.0f} € → fin : {tp['prix_m2_fin']:,.0f} €
"""

    if cd.get("score_faisabilite") is not None:
        cross_info += f"\n### Faisabilité personnelle\n- Score bancaire : {cd['score_faisabilite']:.0f}/100\n"

    if cd.get("distance_domicile_km") is not None:
        cross_info += f"\n### Proximité\n- Distance domicile : {cd['distance_domicile_km']:.0f} km\n"
        if cd.get("distances_relais"):
            for vr in cd["distances_relais"]:
                cross_info += f"- Distance {vr['nom']} : {vr['distance_km']:.0f} km\n"

    # ── Données financières ──
    financial_info = f"""
## SIMULATION FINANCIÈRE

- Coût total projet : {financial_data.get('cout_total_projet', 0):,.0f} €
- Frais de notaire : {financial_data.get('frais_notaire', 0):,.0f} €
- Montant emprunté : {financial_data.get('montant_emprunt', 0):,.0f} €
- Mensualité crédit : {financial_data.get('mensualite_totale', 0):,.0f} €/mois
- Loyer mensuel estimé : {financial_data.get('loyer_mensuel_brut', 0):,.0f} €
- Rentabilité brute : {financial_data.get('rentabilite_brute', 0):.2f}%
- Rentabilité nette : {financial_data.get('rentabilite_nette', 0):.2f}%
- Cash-flow net mensuel : {financial_data.get('cashflow_mensuel_net', 0):,.0f} €
- Autofinancement : {'Oui' if financial_data.get('autofinancement') else 'Non'}
"""

    # ── Profil investisseur ──
    user_info = ""
    if user_preferences:
        statut_labels = {
            "etudiant": "Étudiant", "alternant": "Alternant", "cdi": "CDI",
            "cdd": "CDD", "fonctionnaire": "Fonctionnaire",
            "auto-entrepreneur": "Auto-entrepreneur", "retraite": "Retraité", "chomeur": "Demandeur d'emploi",
        }
        st = statut_labels.get(user_preferences.get("statut", ""), user_preferences.get("statut", "N/A"))

        user_info = f"""
## PROFIL DE L'INVESTISSEUR

- Statut : {st}
- Ancienneté : {user_preferences.get('anciennete', 0)} mois
- Revenus mensuels : {user_preferences.get('revenu_mensuel', 0):,.0f} €
- Co-emprunteur : {'Oui (' + str(user_preferences.get('revenu_co_borrower', 0)) + '€/mois)' if user_preferences.get('co_borrower') else 'Non'}
- Garant : {'Oui (' + str(user_preferences.get('revenu_garant', 0)) + '€/mois' + (', propriétaire' if user_preferences.get('garant_proprio') else '') + ')' if user_preferences.get('garant') == 'oui' else 'Non'}
- Budget projet : {user_preferences.get('prix_projet', 0):,.0f} €
- Apport : {user_preferences.get('apport', 0):,.0f} €
- Durée crédit : {user_preferences.get('duree_credit', 20)} ans
- Taux d'intérêt : {user_preferences.get('taux_interet', 3.5)}%
"""
        # Ville domicile
        vd = user_preferences.get("w5_ville_domicile")
        if vd:
            if isinstance(vd, str):
                try:
                    vd = json.loads(vd)
                except Exception:
                    pass
            if isinstance(vd, dict):
                user_info += f"- Ville domicile : {vd.get('nom', 'N/A')} ({vd.get('code_postal', '')})\n"

    # ── Score v2 détaillé ──
    score_info = f"""
## SCORE D'INVESTISSEMENT (déjà calculé — NE PAS RECALCULER)

**Score global : {score_v2}/100 — {verdict_v2}**

Détail par critère :
"""
    if score_details:
        for key, d in score_details.items():
            score_info += f"- {d['label']} : {d['score']}/{d['max']} pts — {d['valeur']} — {d['explication']}\n"

    # ── Prompt final ──
    prompt = f"""Tu es un expert en investissement immobilier locatif, spécialisé dans le conseil aux primo-accédants et aux jeunes investisseurs.

{annonce_info}
{market_info}
{cross_info}
{financial_info}
{user_info}
{score_info}

---

## TA MISSION

Le score est DÉJÀ CALCULÉ ({score_v2}/100 — {verdict_v2}). Tu ne dois PAS le recalculer.
Tu dois rédiger une analyse textuelle LUDIQUE, ACCESSIBLE et PERSONNALISÉE.

CONSIGNES DE RÉDACTION :
1. Utilise un langage simple et engageant, comme si tu parlais à un ami qui débute dans l'immobilier
2. Quand tu utilises un terme technique, définis-le entre parenthèses la première fois. Exemples :
   - "la rentabilité nette (ce qui reste après toutes les charges)"
   - "le cash-flow (la différence entre le loyer perçu et toutes vos dépenses)"
   - "le taux de vacance (le pourcentage de logements vides dans la zone)"
3. Sois honnête sur les risques mais aussi encourageant sur les points forts
4. Si le profil investisseur est fourni, personnalise l'analyse à sa situation
5. Chaque section doit faire 2-4 phrases maximum

Réponds UNIQUEMENT avec le JSON ci-dessous, sans texte avant ou après :

```json
{{
  "score": {score_v2},
  "verdict": "{verdict_v2}",
  "resume": "<Résumé en 2-3 phrases simples de l'opportunité, personnalisé au profil si disponible>",
  "points_forts": ["<Point fort 1>", "<Point fort 2>", "<Point fort 3 max>"],
  "points_vigilance": ["<Point de vigilance 1>", "<Point de vigilance 2>"],
  "analyse_prix": {{
    "evaluation": "<Sous-évalué|Prix correct|Légèrement surévalué|Surévalué>",
    "explication": "<2-3 phrases ludiques sur le prix vs le marché local>"
  }},
  "analyse_rentabilite": {{
    "niveau": "<Excellente|Bonne|Moyenne|Faible>",
    "explication": "<2-3 phrases sur la rentabilité, contextualisée au département>"
  }},
  "analyse_tension": {{
    "niveau": "<Forte|Moyenne|Faible>",
    "explication": "<2-3 phrases sur la tension locative et le risque de vacance>"
  }},
  "analyse_faisabilite": {{
    "niveau": "<Solide|Correct|Fragile|Insuffisant>",
    "explication": "<2-3 phrases sur la compatibilité avec le profil bancaire. Si pas de profil : phrase générique>"
  }},
  "analyse_localisation": {{
    "potentiel": "<Fort|Moyen|Faible>",
    "explication": "<2-3 phrases sur la localisation : transports, éducation, proximité domicile>"
  }},
  "analyse_cashflow": {{
    "situation": "<Positif|Équilibre|Effort d'épargne>",
    "explication": "<2-3 phrases sur le cash-flow et ce que ça veut dire concrètement>"
  }},
  "analyse_valorisation": {{
    "tendance": "<Hausse|Stable|Baisse>",
    "explication": "<2-3 phrases sur l'évolution des prix et le potentiel de plus-value>"
  }},
  "recommandations": [
    "<Recommandation concrète et actionnnable 1>",
    "<Recommandation 2>",
    "<Recommandation 3>"
  ],
  "conclusion": "<Conclusion finale de 3-4 phrases, personnalisée, avec le verdict>"
}}
```
"""

    return prompt


async def analyze_with_ai(
    scraped_data: Dict,
    market_data: Dict,
    financial_data: Dict,
    user_preferences: Optional[Dict] = None,
    score_v2: float = 0,
    verdict_v2: str = "",
    score_details: Optional[Dict] = None,
    cross_data: Optional[Dict] = None,
) -> Dict[str, Any]:
    """
    Analyse une annonce immobilière avec l'IA OpenAI (v2).
    Le score est fourni, l'IA rédige le texte.
    """

    if not OPENAI_API_KEY:
        logger.warning("Clé OpenAI non configurée, utilisation de l'analyse basique")
        return generate_fallback_analysis(scraped_data, market_data, financial_data, score_v2, verdict_v2, score_details, cross_data)

    client = get_openai_client()
    if not client:
        return generate_fallback_analysis(scraped_data, market_data, financial_data, score_v2, verdict_v2, score_details, cross_data)

    try:
        prompt = build_analysis_prompt(
            scraped_data, market_data, financial_data,
            user_preferences, score_v2, verdict_v2, score_details, cross_data,
        )

        logger.info("Envoi de la requête à OpenAI...")

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Tu es un expert en investissement immobilier locatif. Tu rédiges des analyses accessibles et ludiques pour des primo-accédants. Tu réponds toujours en JSON valide. Tu ne recalcules jamais le score — il est fourni."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2500,
            response_format={"type": "json_object"}
        )

        ai_response = response.choices[0].message.content
        logger.info("Réponse OpenAI reçue")

        try:
            analysis = json.loads(ai_response)
            # Forcer le score v2 (ne pas laisser l'IA le changer)
            analysis["score"] = score_v2
            analysis["verdict"] = verdict_v2
            analysis["ai_generated"] = True
            analysis["model"] = "gpt-4o-mini"
            return analysis
        except json.JSONDecodeError as e:
            logger.error(f"Erreur parsing JSON OpenAI: {e}")
            return generate_fallback_analysis(scraped_data, market_data, financial_data, score_v2, verdict_v2, score_details, cross_data)

    except Exception as e:
        logger.error(f"Erreur OpenAI: {e}")
        return generate_fallback_analysis(scraped_data, market_data, financial_data, score_v2, verdict_v2, score_details, cross_data)


def generate_fallback_analysis(
    scraped_data: Dict,
    market_data: Dict,
    financial_data: Dict,
    score_v2: float = 50,
    verdict_v2: str = "Investissement correct",
    score_details: Optional[Dict] = None,
    cross_data: Optional[Dict] = None,
) -> Dict[str, Any]:
    """Analyse de repli si l'IA n'est pas disponible — utilise le score v2."""

    rentabilite_nette = financial_data.get("rentabilite_nette", 0)
    cashflow = financial_data.get("cashflow_mensuel_net", 0)
    taux_vacance = market_data.get("insee_stats", {}).get("taux_vacance") if market_data.get("insee_stats") else None
    cd = cross_data or {}

    # Analyse prix
    ecart = None
    if market_data.get("dvf_stats") and market_data["dvf_stats"].get("comparaison"):
        ecart = market_data["dvf_stats"]["comparaison"].get("ecart_vs_median_pct", 0)

    if ecart is not None:
        if ecart <= -10:
            eval_prix, expl_prix = "Sous-évalué", f"Le bien est {abs(ecart):.1f}% en dessous de la médiane du département — une bonne affaire potentielle."
        elif ecart <= 10:
            eval_prix, expl_prix = "Prix correct", f"Le prix est proche de la médiane du marché ({ecart:+.1f}%)."
        else:
            eval_prix, expl_prix = "Surévalué", f"Le bien est {ecart:.1f}% au-dessus de la médiane — pensez à négocier."
    else:
        eval_prix, expl_prix = "Prix correct", "Données de comparaison non disponibles."

    # Analyse tension
    if taux_vacance is not None:
        if taux_vacance < 6:
            niv_tension, expl_tension = "Forte", f"Zone tendue avec seulement {taux_vacance:.1f}% de vacance — forte demande locative."
        elif taux_vacance < 8:
            niv_tension, expl_tension = "Moyenne", f"Tension correcte ({taux_vacance:.1f}% de vacance)."
        else:
            niv_tension, expl_tension = "Faible", f"Marché détendu ({taux_vacance:.1f}% de vacance) — risque de vacance."
    else:
        niv_tension, expl_tension = "Moyenne", "Données de tension non disponibles."

    # Analyse faisabilité
    sf = cd.get("score_faisabilite")
    if sf is not None:
        if sf >= 75:
            niv_fais, expl_fais = "Solide", f"Profil bancaire solide ({sf:.0f}/100) — financement très probable."
        elif sf >= 55:
            niv_fais, expl_fais = "Correct", f"Profil bancaire correct ({sf:.0f}/100) — financement possible."
        else:
            niv_fais, expl_fais = "Fragile", f"Profil bancaire fragile ({sf:.0f}/100) — financement incertain."
    else:
        niv_fais, expl_fais = "Correct", "Connectez-vous pour une analyse personnalisée de votre faisabilité."

    # Analyse valorisation
    tp = cd.get("tendance_prix")
    if tp:
        ev = tp["evolution_pct"]
        if ev > 3:
            tend_val, expl_val = "Hausse", f"Les prix ont augmenté de {ev:+.1f}% sur 5 ans — potentiel de plus-value."
        elif ev > -3:
            tend_val, expl_val = "Stable", f"Prix stables sur 5 ans ({ev:+.1f}%)."
        else:
            tend_val, expl_val = "Baisse", f"Les prix ont baissé de {abs(ev):.1f}% sur 5 ans — risque de perte en capital."
    else:
        tend_val, expl_val = "Stable", "Données de tendance non disponibles."

    return {
        "score": score_v2,
        "verdict": verdict_v2,
        "resume": f"Bien de {scraped_data.get('surface', 'N/A')}m² à {scraped_data.get('ville', 'N/A')} avec une rentabilité nette de {rentabilite_nette:.2f}%. {verdict_v2}.",
        "points_forts": [
            f"Rentabilité de {rentabilite_nette:.2f}%" if rentabilite_nette >= 4 else "Prix accessible",
            "Marché locatif actif" if taux_vacance and taux_vacance < 8 else "Localisation à étudier",
        ],
        "points_vigilance": [
            f"Cash-flow négatif ({cashflow:.0f}€/mois)" if cashflow < 0 else "Bien surveiller les charges",
            "Vérifier l'état du bien avant achat",
        ],
        "analyse_prix": {"evaluation": eval_prix, "explication": expl_prix},
        "analyse_rentabilite": {
            "niveau": "Bonne" if rentabilite_nette >= 4.5 else "Moyenne" if rentabilite_nette >= 3 else "Faible",
            "explication": f"Rentabilité nette de {rentabilite_nette:.2f}%.",
        },
        "analyse_tension": {"niveau": niv_tension, "explication": expl_tension},
        "analyse_faisabilite": {"niveau": niv_fais, "explication": expl_fais},
        "analyse_localisation": {"potentiel": "Moyen", "explication": "Analyse locale limitée sans l'IA."},
        "analyse_cashflow": {
            "situation": "Positif" if cashflow >= 0 else "Effort d'épargne",
            "explication": f"Cash-flow net mensuel de {cashflow:,.0f}€.",
        },
        "analyse_valorisation": {"tendance": tend_val, "explication": expl_val},
        "recommandations": [
            "Vérifier l'état du bien lors de la visite",
            "Comparer avec d'autres biens similaires dans le secteur",
            "Négocier le prix si possible",
        ],
        "conclusion": f"Ce bien présente {'un bon potentiel' if score_v2 >= 60 else 'des points à approfondir'} pour un investissement locatif. Score : {score_v2}/100 — {verdict_v2}.",
        "ai_generated": False,
        "model": "fallback",
    }
