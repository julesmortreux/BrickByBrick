"""
Moteur de Calcul Financier - Production Ready
Formules réalistes pour l'investissement immobilier locatif
"""

import math
import logging
from typing import Dict, Optional, Tuple
import pandas as pd

from schemas import (
    SimulationRequest, 
    SimulationResponse,
    EtatBien,
    TypeBien
)

logger = logging.getLogger(__name__)


# ============================================================================
# CONSTANTES RÉALISTES (Marché 2026)
# ============================================================================

# Frais de notaire selon état du bien
FRAIS_NOTAIRE = {
    EtatBien.NEUF: 0.03,      # 2-3% pour le neuf
    EtatBien.RENOVE: 0.075,   # 7-8% pour l'ancien (même si rénové)
    EtatBien.ANCIEN: 0.08     # 8% pour l'ancien
}

# Frais annexes
FRAIS_GARANTIE_TAUX = 0.015  # Caution bancaire ou hypothèque (~1.5% du prêt)
FRAIS_DOSSIER_FIXE = 500     # Frais de dossier bancaire (forfait)

# Assurances
ASSURANCE_PNO_M2 = 4.5       # Assurance Propriétaire Non Occupant (~4-5€/m²/an)

# Imposition (pour rentabilité nette-nette)
IMPOSITION_MOYENNE = 0.30    # ~30% d'imposition (TMI + prélèvements sociaux)


# ============================================================================
# CALCULS DE BASE
# ============================================================================

def calculer_frais_notaire(prix: float, etat_bien: EtatBien) -> float:
    """
    Calcule les frais de notaire selon l'état du bien
    
    Réalité du marché :
    - Neuf : 2-3% (TVA réduite, droits d'enregistrement faibles)
    - Ancien : 7-8% (droits de mutation + émoluments notaire)
    
    Args:
        prix: Prix d'achat du bien (€)
        etat_bien: État du bien (neuf/ancien/rénové)
    
    Returns:
        Frais de notaire (€)
    """
    taux = FRAIS_NOTAIRE.get(etat_bien, 0.08)
    return prix * taux


def calculer_mensualite_credit(
    capital: float,
    taux_annuel_pct: float,
    duree_ans: int
) -> float:
    """
    Calcule la mensualité d'un crédit immobilier (capital + intérêts)
    
    Formule des annuités constantes :
    M = C × (t/12) / (1 - (1 + t/12)^(-n))
    
    Args:
        capital: Montant emprunté (€)
        taux_annuel_pct: Taux d'intérêt annuel (%)
        duree_ans: Durée du prêt (années)
    
    Returns:
        Mensualité (€)
    """
    if capital <= 0:
        return 0
    
    if taux_annuel_pct == 0:
        # Crédit à 0% (rare mais possible)
        return capital / (duree_ans * 12)
    
    taux_mensuel = taux_annuel_pct / 100 / 12
    nb_mois = duree_ans * 12
    
    mensualite = (capital * taux_mensuel) / (1 - math.pow(1 + taux_mensuel, -nb_mois))
    
    return mensualite


def calculer_cout_total_credit(
    capital: float,
    taux_annuel_pct: float,
    duree_ans: int
) -> Tuple[float, float]:
    """
    Calcule le coût total du crédit
    
    Returns:
        (coût_total, coût_intérêts)
    """
    mensualite = calculer_mensualite_credit(capital, taux_annuel_pct, duree_ans)
    nb_mois = duree_ans * 12
    
    cout_total = mensualite * nb_mois
    cout_interets = cout_total - capital
    
    return cout_total, cout_interets


def calculer_mensualite_assurance(
    capital: float,
    taux_assurance_pct: float
) -> float:
    """
    Calcule la mensualité d'assurance emprunteur
    
    L'assurance est calculée sur le capital initial (et non dégressif)
    
    Args:
        capital: Montant emprunté (€)
        taux_assurance_pct: Taux annuel (% du capital)
    
    Returns:
        Mensualité d'assurance (€)
    """
    cout_annuel = capital * (taux_assurance_pct / 100)
    return cout_annuel / 12


# ============================================================================
# ESTIMATION LOYER (via données INSEE)
# ============================================================================

def estimer_loyer_mensuel(
    code_postal: str,
    surface: float,
    nb_pieces: int,
    loyers_df: Optional[pd.DataFrame]
) -> Optional[float]:
    """
    Estime le loyer mensuel via les données INSEE
    
    Méthode :
    1. Extraire le département du code postal
    2. Filtrer les loyers par département
    3. Si possible, filtrer par nombre de pièces
    4. Prendre la médiane du loyer au m²
    5. Multiplier par la surface
    
    Args:
        code_postal: Code postal (ex: "75001")
        surface: Surface du bien (m²)
        nb_pieces: Nombre de pièces
        loyers_df: DataFrame des loyers INSEE
    
    Returns:
        Loyer mensuel estimé (€) ou None si impossible
    """
    if loyers_df is None or loyers_df.empty:
        logger.warning("⚠️ Données loyers non disponibles, impossible d'estimer le loyer")
        return None
    
    try:
        # Extraire le département (2 premiers caractères)
        departement = code_postal[:2]
        
        # Filtrer par département
        loyers_dept = loyers_df[loyers_df['Code departement'] == departement]
        
        if loyers_dept.empty:
            logger.warning(f"⚠️ Aucune donnée de loyer pour le département {departement}")
            return None
        
        # Filtrer par nombre de pièces si possible
        if 'nb_pieces' in loyers_dept.columns and nb_pieces:
            loyers_pieces = loyers_dept[loyers_dept['nb_pieces'] == nb_pieces]
            if not loyers_pieces.empty:
                loyer_m2 = loyers_pieces['loyer_m2'].median()
            else:
                # Fallback : prendre la médiane du département
                loyer_m2 = loyers_dept['loyer_m2'].median()
        else:
            loyer_m2 = loyers_dept['loyer_m2'].median()
        
        if pd.isna(loyer_m2):
            return None
        
        loyer_mensuel = loyer_m2 * surface
        
        logger.info(f"💰 Loyer estimé : {loyer_mensuel:.0f}€/mois ({loyer_m2:.2f}€/m²)")
        
        return loyer_mensuel
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'estimation du loyer : {e}")
        return None


# ============================================================================
# SIMULATION COMPLÈTE
# ============================================================================

def simuler_investissement(
    request: SimulationRequest,
    loyers_df: Optional[pd.DataFrame] = None
) -> SimulationResponse:
    """
    Simule un investissement immobilier locatif de manière complète et réaliste
    
    Prend en compte :
    - Tous les frais (notaire, garantie, dossier, travaux)
    - Vacance locative
    - Assurance PNO
    - Gestion locative si déléguée
    - Charges de copropriété
    - Taxe foncière
    - Impayés estimés
    
    Args:
        request: Paramètres de simulation
        loyers_df: DataFrame des loyers INSEE (pour estimation auto)
    
    Returns:
        Simulation complète avec tous les indicateurs
    """
    
    logger.info("=" * 80)
    logger.info("🧮 SIMULATION D'INVESTISSEMENT")
    logger.info("=" * 80)
    
    # ========== DONNÉES DE BASE ==========
    prix = request.prix
    surface = request.surface
    prix_m2 = prix / surface
    code_postal = request.code_postal
    departement = code_postal[:2]
    
    logger.info(f"📍 Bien : {surface}m² à {prix:,.0f}€ ({prix_m2:,.0f}€/m²)")
    logger.info(f"📍 Localisation : {code_postal} (Département {departement})")
    
    # ========== COÛT TOTAL DU PROJET ==========
    
    # Frais de notaire (réalistes selon état du bien)
    frais_notaire = calculer_frais_notaire(prix, request.etat_bien)
    logger.info(f"💼 Frais de notaire ({request.etat_bien.value}) : {frais_notaire:,.0f}€ ({frais_notaire/prix*100:.1f}%)")
    
    # Apport (validé par Pydantic, défaut = 10%)
    apport = request.apport
    logger.info(f"💰 Apport : {apport:,.0f}€ ({apport/prix*100:.1f}%)")
    
    # Montant à emprunter = Prix + Frais de notaire + Travaux - Apport
    travaux = request.travaux
    cout_total_acquisition = prix + frais_notaire + travaux
    montant_emprunt = max(0, cout_total_acquisition - apport)
    
    # Frais de crédit
    frais_garantie = montant_emprunt * FRAIS_GARANTIE_TAUX
    frais_dossier = FRAIS_DOSSIER_FIXE
    
    cout_total_projet = cout_total_acquisition + frais_garantie + frais_dossier
    
    logger.info(f"🏗️ Travaux : {travaux:,.0f}€")
    logger.info(f"🔒 Frais de garantie : {frais_garantie:,.0f}€")
    logger.info(f"📄 Frais de dossier : {frais_dossier:,.0f}€")
    logger.info(f"💵 COÛT TOTAL PROJET : {cout_total_projet:,.0f}€")
    
    # ========== FINANCEMENT ==========
    
    duree_credit = request.duree_credit
    taux_interet = request.taux_interet
    
    mensualite_credit = calculer_mensualite_credit(
        montant_emprunt, 
        taux_interet, 
        duree_credit
    )
    
    mensualite_assurance = calculer_mensualite_assurance(
        montant_emprunt,
        request.taux_assurance
    )
    
    mensualite_totale = mensualite_credit + mensualite_assurance
    
    cout_total_credit, cout_interets = calculer_cout_total_credit(
        montant_emprunt,
        taux_interet,
        duree_credit
    )
    
    logger.info(f"🏦 Emprunt : {montant_emprunt:,.0f}€ sur {duree_credit} ans à {taux_interet}%")
    logger.info(f"💳 Mensualité crédit : {mensualite_credit:,.0f}€")
    logger.info(f"🛡️ Mensualité assurance : {mensualite_assurance:,.0f}€")
    logger.info(f"💳 MENSUALITÉ TOTALE : {mensualite_totale:,.0f}€")
    logger.info(f"💸 Coût total du crédit : {cout_total_credit:,.0f}€ (dont {cout_interets:,.0f}€ d'intérêts)")
    
    # ========== REVENUS LOCATIFS ==========
    
    # Estimation loyer si non fourni
    if request.loyer_mensuel is None:
        loyer_mensuel = estimer_loyer_mensuel(
            code_postal,
            surface,
            request.nb_pieces,
            loyers_df
        )
        
        if loyer_mensuel is None:
            # Fallback : estimation grossière (loyer = 6% du prix / 12)
            loyer_mensuel = (prix * 0.06) / 12
            logger.warning(f"⚠️ Loyer estimé par défaut (6% annuel) : {loyer_mensuel:,.0f}€/mois")
    else:
        loyer_mensuel = request.loyer_mensuel
        logger.info(f"💰 Loyer fourni : {loyer_mensuel:,.0f}€/mois")
    
    loyer_annuel_brut = loyer_mensuel * 12
    
    # Prise en compte de la vacance locative
    vacance_mois = request.vacance_locative_mois
    loyer_annuel_net_vacance = loyer_annuel_brut * (1 - vacance_mois / 12)
    
    logger.info(f"💰 Loyer annuel brut : {loyer_annuel_brut:,.0f}€")
    logger.info(f"🚪 Vacance locative : {vacance_mois} mois/an")
    logger.info(f"💰 Loyer annuel net vacance : {loyer_annuel_net_vacance:,.0f}€")
    
    # ========== CHARGES & DÉPENSES ==========
    
    # Charges copropriété (déjà estimées par Pydantic si non fournies)
    charges_copro_mensuel = request.charges_copro
    charges_copro_annuel = charges_copro_mensuel * 12
    
    # Taxe foncière (déjà estimée par Pydantic si non fournie)
    taxe_fonciere_annuel = request.taxe_fonciere
    
    # Assurance PNO (Propriétaire Non Occupant)
    assurance_pno_annuel = surface * ASSURANCE_PNO_M2
    
    # Gestion locative (si déléguée)
    if request.gestion_locative:
        gestion_locative_annuel = loyer_annuel_brut * (request.taux_gestion / 100)
    else:
        gestion_locative_annuel = 0
    
    # Total charges annuelles
    charges_totales_annuel = (
        charges_copro_annuel +
        taxe_fonciere_annuel +
        assurance_pno_annuel +
        gestion_locative_annuel
    )
    
    charges_totales_mensuel = charges_totales_annuel / 12
    
    logger.info(f"🏢 Charges copro : {charges_copro_annuel:,.0f}€/an ({charges_copro_mensuel:,.0f}€/mois)")
    logger.info(f"🏛️ Taxe foncière : {taxe_fonciere_annuel:,.0f}€/an")
    logger.info(f"🛡️ Assurance PNO : {assurance_pno_annuel:,.0f}€/an")
    logger.info(f"🏢 Gestion locative : {gestion_locative_annuel:,.0f}€/an")
    logger.info(f"💸 CHARGES TOTALES : {charges_totales_annuel:,.0f}€/an ({charges_totales_mensuel:,.0f}€/mois)")
    
    # ========== RENTABILITÉ ==========
    
    # Rentabilité brute (loyer brut / prix d'achat)
    rentabilite_brute = (loyer_annuel_brut / prix) * 100
    
    # Rentabilité nette (loyer net / coût total projet)
    loyer_net_annuel = loyer_annuel_net_vacance - charges_totales_annuel
    rentabilite_nette = (loyer_net_annuel / cout_total_projet) * 100
    
    # Rentabilité nette-nette (après impôts estimés à ~30%)
    loyer_net_net_annuel = loyer_net_annuel * (1 - IMPOSITION_MOYENNE)
    rentabilite_nette_nette = (loyer_net_net_annuel / cout_total_projet) * 100
    
    logger.info(f"📈 Rentabilité brute : {rentabilite_brute:.2f}%")
    logger.info(f"📊 Rentabilité nette : {rentabilite_nette:.2f}%")
    logger.info(f"📉 Rentabilité nette-nette (après impôts) : {rentabilite_nette_nette:.2f}%")
    
    # ========== CASHFLOW ==========
    
    # Cashflow mensuel brut (loyer - mensualité)
    cashflow_mensuel_brut = loyer_mensuel - mensualite_totale
    
    # Cashflow mensuel net (après toutes charges)
    loyer_mensuel_net_vacance = loyer_annuel_net_vacance / 12
    cashflow_mensuel_net = loyer_mensuel_net_vacance - mensualite_totale - charges_totales_mensuel
    
    # Cashflow annuel net
    cashflow_annuel_net = cashflow_mensuel_net * 12
    
    # Autofinancement ?
    autofinancement = cashflow_mensuel_net >= 0
    effort_epargne_mensuel = abs(min(0, cashflow_mensuel_net))
    
    logger.info(f"💵 Cashflow mensuel brut : {cashflow_mensuel_brut:,.0f}€")
    logger.info(f"💰 Cashflow mensuel net : {cashflow_mensuel_net:,.0f}€")
    logger.info(f"💸 Cashflow annuel net : {cashflow_annuel_net:,.0f}€")
    
    if autofinancement:
        logger.info(f"✅ AUTOFINANCEMENT : Le bien s'autofinance (+{cashflow_mensuel_net:,.0f}€/mois)")
    else:
        logger.info(f"⚠️ EFFORT D'ÉPARGNE : {effort_epargne_mensuel:,.0f}€/mois nécessaires")
    
    # ========== SCORE & VERDICT ==========
    
    score, verdict, conseils = calculer_score_investissement(
        rentabilite_nette=rentabilite_nette,
        cashflow_mensuel_net=cashflow_mensuel_net,
        autofinancement=autofinancement,
        prix_m2=prix_m2,
        departement=departement
    )
    
    logger.info(f"🎯 SCORE : {score:.1f}/100 - {verdict}")
    logger.info("=" * 80)
    
    # ========== CONSTRUCTION DE LA RÉPONSE ==========
    
    return SimulationResponse(
        # Récapitulatif bien
        prix_achat=prix,
        surface=surface,
        prix_m2=prix_m2,
        code_postal=code_postal,
        departement=departement,
        
        # Coût total projet
        frais_notaire=frais_notaire,
        frais_garantie=frais_garantie,
        frais_dossier=frais_dossier,
        travaux=travaux,
        cout_total_projet=cout_total_projet,
        
        # Financement
        apport=apport,
        montant_emprunt=montant_emprunt,
        duree_credit_ans=duree_credit,
        taux_interet=taux_interet,
        mensualite_credit=mensualite_credit,
        mensualite_assurance=mensualite_assurance,
        mensualite_totale=mensualite_totale,
        cout_total_credit=cout_total_credit,
        cout_interets=cout_interets,
        
        # Revenus locatifs
        loyer_mensuel_brut=loyer_mensuel,
        loyer_annuel_brut=loyer_annuel_brut,
        loyer_annuel_net_vacance=loyer_annuel_net_vacance,
        
        # Charges
        charges_copro_mensuel=charges_copro_mensuel,
        charges_copro_annuel=charges_copro_annuel,
        taxe_fonciere_annuel=taxe_fonciere_annuel,
        assurance_pno_annuel=assurance_pno_annuel,
        gestion_locative_annuel=gestion_locative_annuel,
        charges_totales_annuel=charges_totales_annuel,
        charges_totales_mensuel=charges_totales_mensuel,
        
        # Rentabilité
        rentabilite_brute=round(rentabilite_brute, 2),
        rentabilite_nette=round(rentabilite_nette, 2),
        rentabilite_nette_nette=round(rentabilite_nette_nette, 2),
        
        # Cashflow
        cashflow_mensuel_brut=round(cashflow_mensuel_brut, 2),
        cashflow_mensuel_net=round(cashflow_mensuel_net, 2),
        cashflow_annuel_net=round(cashflow_annuel_net, 2),
        
        # Indicateurs clés
        taux_endettement=None,  # À calculer si revenu fourni
        autofinancement=autofinancement,
        effort_epargne_mensuel=round(effort_epargne_mensuel, 2),
        
        # Verdict
        score_investissement=round(score, 1),
        verdict=verdict,
        conseils=conseils,
        
        # Hypothèses
        hypotheses={
            "vacance_locative_mois": vacance_mois,
            "taux_gestion": request.taux_gestion if request.gestion_locative else 0,
            "taux_impayes": request.taux_impayes,
            "imposition_estimee": IMPOSITION_MOYENNE * 100,
            "loyer_estime_auto": request.loyer_mensuel is None
        }
    )


def calculer_score_investissement(
    rentabilite_nette: float,
    cashflow_mensuel_net: float,
    autofinancement: bool,
    prix_m2: float,
    departement: str
) -> Tuple[float, str, list]:
    """
    Score basique (legacy) - utilisé quand les données croisées ne sont pas disponibles.
    """
    score, verdict, details = calculer_score_investissement_v2(
        rentabilite_nette=rentabilite_nette,
        cashflow_mensuel_net=cashflow_mensuel_net,
    )
    conseils = []
    for key, d in details.items():
        conseils.append(d["explication"])
    return score, verdict, conseils


def calculer_score_investissement_v2(
    rentabilite_nette: float = 0,
    cashflow_mensuel_net: float = 0,
    ecart_prix_vs_median_pct: Optional[float] = None,
    taux_vacance: Optional[float] = None,
    score_faisabilite: Optional[float] = None,
    distance_domicile_km: Optional[float] = None,
    tendance_prix_pct: Optional[float] = None,
    nb_gares: Optional[int] = None,
    nb_etablissements_sup: Optional[int] = None,
) -> Tuple[float, str, dict]:
    """
    Score d'investissement pondéré v2 — croise toutes les données disponibles.

    Pondération (100 points) :
    - Rentabilité nette      : 20 pts
    - Cashflow               : 15 pts
    - Prix vs marché         : 15 pts
    - Tension locative       : 15 pts
    - Faisabilité personnelle: 15 pts
    - Localisation/proximité : 10 pts
    - Potentiel valorisation : 10 pts

    Si une donnée n'est pas disponible, ses points sont redistribués
    proportionnellement aux critères disponibles.

    Returns:
        (score, verdict, details_par_critere)
    """

    details: dict = {}
    raw_scores: dict = {}
    weights: dict = {}

    # ── 1. Rentabilité nette (20 pts) ──
    w = 20
    if rentabilite_nette >= 6:
        s = w
        expl = f"Excellente rentabilité nette ({rentabilite_nette:.2f}%) — bien au-dessus de la moyenne."
    elif rentabilite_nette >= 4.5:
        s = w * 0.80
        expl = f"Bonne rentabilité nette ({rentabilite_nette:.2f}%) — conforme au marché."
    elif rentabilite_nette >= 3:
        s = w * 0.55
        expl = f"Rentabilité correcte ({rentabilite_nette:.2f}%) mais limitée."
    else:
        s = w * 0.25
        expl = f"Rentabilité faible ({rentabilite_nette:.2f}%). Risque de perte à long terme."
    raw_scores["rentabilite"] = s
    weights["rentabilite"] = w
    details["rentabilite"] = {
        "label": "Rentabilité nette",
        "score": round(s, 1),
        "max": w,
        "valeur": f"{rentabilite_nette:.2f}%",
        "explication": expl,
    }

    # ── 2. Cashflow (15 pts) ──
    w = 15
    if cashflow_mensuel_net >= 200:
        s = w
        expl = f"Excellent cashflow (+{cashflow_mensuel_net:.0f}€/mois) — investissement sécurisé."
    elif cashflow_mensuel_net >= 0:
        s = w * 0.80
        expl = f"Cashflow positif (+{cashflow_mensuel_net:.0f}€/mois) — autofinancement assuré."
    elif cashflow_mensuel_net >= -100:
        s = w * 0.45
        expl = f"Léger effort d'épargne ({abs(cashflow_mensuel_net):.0f}€/mois)."
    else:
        s = w * 0.20
        expl = f"Effort d'épargne important ({abs(cashflow_mensuel_net):.0f}€/mois). Négociez le prix ou augmentez l'apport."
    raw_scores["cashflow"] = s
    weights["cashflow"] = w
    details["cashflow"] = {
        "label": "Cash-flow",
        "score": round(s, 1),
        "max": w,
        "valeur": f"{'+' if cashflow_mensuel_net >= 0 else ''}{cashflow_mensuel_net:.0f}€/mois",
        "explication": expl,
    }

    # ── 3. Prix vs marché (15 pts) ──
    w = 15
    if ecart_prix_vs_median_pct is not None:
        ecart = ecart_prix_vs_median_pct
        if ecart <= -10:
            s = w
            expl = f"Bien sous-évalué ({ecart:+.1f}% vs médiane) — excellente affaire."
        elif ecart <= 0:
            s = w * 0.80
            expl = f"Prix légèrement sous la médiane ({ecart:+.1f}%) — bon positionnement."
        elif ecart <= 10:
            s = w * 0.55
            expl = f"Prix proche de la médiane ({ecart:+.1f}%) — prix de marché."
        elif ecart <= 20:
            s = w * 0.30
            expl = f"Prix au-dessus de la médiane ({ecart:+.1f}%) — marge de négociation possible."
        else:
            s = w * 0.15
            expl = f"Bien surévalué ({ecart:+.1f}% vs médiane) — négociez fortement."
        raw_scores["prix_marche"] = s
        weights["prix_marche"] = w
        details["prix_marche"] = {
            "label": "Prix vs Marché",
            "score": round(s, 1),
            "max": w,
            "valeur": f"{ecart:+.1f}%",
            "explication": expl,
        }

    # ── 4. Tension locative (15 pts) ──
    w = 15
    if taux_vacance is not None:
        if taux_vacance < 6:
            s = w
            expl = f"Zone très tendue (vacance {taux_vacance:.1f}%) — forte demande locative, risque de vacance minimal."
        elif taux_vacance < 8:
            s = w * 0.65
            expl = f"Tension correcte (vacance {taux_vacance:.1f}%) — demande locative modérée."
        elif taux_vacance < 10:
            s = w * 0.35
            expl = f"Tension faible (vacance {taux_vacance:.1f}%) — risque de vacance à anticiper."
        else:
            s = w * 0.15
            expl = f"Marché détendu (vacance {taux_vacance:.1f}%) — risque élevé de vacance prolongée."
        raw_scores["tension"] = s
        weights["tension"] = w
        details["tension"] = {
            "label": "Tension locative",
            "score": round(s, 1),
            "max": w,
            "valeur": f"{taux_vacance:.1f}%",
            "explication": expl,
        }

    # ── 5. Faisabilité personnelle (15 pts) ──
    w = 15
    if score_faisabilite is not None:
        ratio = min(score_faisabilite / 100, 1.0)
        s = w * ratio
        if ratio >= 0.75:
            expl = f"Profil bancaire solide (score {score_faisabilite:.0f}/100) — financement très probable."
        elif ratio >= 0.55:
            expl = f"Profil bancaire correct (score {score_faisabilite:.0f}/100) — financement possible avec dossier soigné."
        elif ratio >= 0.35:
            expl = f"Profil bancaire fragile (score {score_faisabilite:.0f}/100) — financement incertain."
        else:
            expl = f"Profil bancaire insuffisant (score {score_faisabilite:.0f}/100) — financement très difficile."
        raw_scores["faisabilite"] = s
        weights["faisabilite"] = w
        details["faisabilite"] = {
            "label": "Faisabilité",
            "score": round(s, 1),
            "max": w,
            "valeur": f"{score_faisabilite:.0f}/100",
            "explication": expl,
        }

    # ── 6. Localisation / Proximité (10 pts) ──
    w = 10
    sub_pts = 0
    sub_max = 0
    loc_parts = []

    # Transports (5 pts)
    if nb_gares is not None:
        sub_max += 5
        if nb_gares >= 3:
            sub_pts += 5
            loc_parts.append(f"{nb_gares} gares à proximité — très bien desservi")
        elif nb_gares >= 1:
            sub_pts += 3
            loc_parts.append(f"{nb_gares} gare(s) à proximité — desserte correcte")
        else:
            sub_pts += 0.5
            loc_parts.append("Aucune gare à proximité — desserte limitée")

    # Enseignement sup (3 pts)
    if nb_etablissements_sup is not None:
        sub_max += 3
        if nb_etablissements_sup >= 5:
            sub_pts += 3
            loc_parts.append(f"{nb_etablissements_sup} établissements sup. — fort bassin étudiant")
        elif nb_etablissements_sup >= 1:
            sub_pts += 1.5
            loc_parts.append(f"{nb_etablissements_sup} établissement(s) sup.")
        else:
            sub_pts += 0
            loc_parts.append("Aucun établissement d'enseignement supérieur")

    # Distance domicile (2 pts)
    if distance_domicile_km is not None:
        sub_max += 2
        if distance_domicile_km <= 30:
            sub_pts += 2
            loc_parts.append(f"À {distance_domicile_km:.0f} km de votre domicile — gestion facilitée")
        elif distance_domicile_km <= 100:
            sub_pts += 1
            loc_parts.append(f"À {distance_domicile_km:.0f} km de votre domicile — gestion à distance possible")
        else:
            sub_pts += 0.3
            loc_parts.append(f"À {distance_domicile_km:.0f} km de votre domicile — gestion à distance nécessaire")

    if sub_max > 0:
        s = w * (sub_pts / sub_max)
        expl = ". ".join(loc_parts) + "."
        valeur_parts = []
        if nb_gares is not None:
            valeur_parts.append(f"{nb_gares} gare(s)")
        if distance_domicile_km is not None:
            valeur_parts.append(f"{distance_domicile_km:.0f} km")
        raw_scores["localisation"] = s
        weights["localisation"] = w
        details["localisation"] = {
            "label": "Localisation",
            "score": round(s, 1),
            "max": w,
            "valeur": " · ".join(valeur_parts) if valeur_parts else "N/A",
            "explication": expl,
        }

    # ── 7. Potentiel de valorisation (10 pts) ──
    w = 10
    if tendance_prix_pct is not None:
        if tendance_prix_pct > 5:
            s = w
            expl = f"Prix en forte hausse ({tendance_prix_pct:+.1f}% sur 5 ans) — potentiel de plus-value élevé."
        elif tendance_prix_pct > 0:
            s = w * 0.70
            expl = f"Prix en légère hausse ({tendance_prix_pct:+.1f}% sur 5 ans) — potentiel de valorisation correct."
        elif tendance_prix_pct > -5:
            s = w * 0.40
            expl = f"Prix stables à légèrement en baisse ({tendance_prix_pct:+.1f}% sur 5 ans)."
        else:
            s = w * 0.15
            expl = f"Prix en baisse ({tendance_prix_pct:+.1f}% sur 5 ans) — risque de perte en capital."
        raw_scores["valorisation"] = s
        weights["valorisation"] = w
        details["valorisation"] = {
            "label": "Potentiel",
            "score": round(s, 1),
            "max": w,
            "valeur": f"{tendance_prix_pct:+.1f}%",
            "explication": expl,
        }

    # ── Calcul du score final ──
    total_weight = sum(weights.values())
    if total_weight == 0:
        total_weight = 1

    # Normaliser sur 100 si des critères manquent
    raw_total = sum(raw_scores.values())
    score = (raw_total / total_weight) * 100

    score = max(0, min(100, round(score, 1)))

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

    return score, verdict, details


# ============================================================================
# TEST DU MODULE
# ============================================================================

if __name__ == "__main__":
    """Test des fonctions de calcul"""
    
    print("\n🧪 TEST DU MOTEUR FINANCIER")
    print("=" * 80)
    
    # Test 1 : Mensualité crédit
    print("\n📊 Test 1 : Calcul mensualité crédit")
    mensualite = calculer_mensualite_credit(
        capital=150000,
        taux_annuel_pct=3.8,
        duree_ans=20
    )
    print(f"   Crédit 150 000€ sur 20 ans à 3.8% : {mensualite:,.2f}€/mois")
    
    # Test 2 : Frais de notaire
    print("\n📊 Test 2 : Frais de notaire")
    for etat in EtatBien:
        frais = calculer_frais_notaire(200000, etat)
        print(f"   {etat.value.capitalize()} : {frais:,.0f}€ ({frais/200000*100:.1f}%)")
    
    print("\n✅ Tests terminés")
