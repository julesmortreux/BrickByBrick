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
    Calcule un score d'investissement et génère des conseils
    
    Critères :
    - Rentabilité nette (40%)
    - Cashflow (40%)
    - Autofinancement (20%)
    
    Returns:
        (score, verdict, conseils)
    """
    
    score = 0
    conseils = []
    
    # Critère 1 : Rentabilité nette (40 points)
    if rentabilite_nette >= 6:
        score += 40
        conseils.append(f"✅ Excellente rentabilité nette ({rentabilite_nette:.2f}%) - Bien au-dessus de la moyenne du marché.")
    elif rentabilite_nette >= 4.5:
        score += 30
        conseils.append(f"✅ Bonne rentabilité nette ({rentabilite_nette:.2f}%) - Conforme au marché.")
    elif rentabilite_nette >= 3:
        score += 20
        conseils.append(f"⚠️ Rentabilité correcte ({rentabilite_nette:.2f}%) mais limite. Privilégiez des biens plus rentables.")
    else:
        score += 10
        conseils.append(f"❌ Rentabilité faible ({rentabilite_nette:.2f}%). Risque de perte à long terme.")
    
    # Critère 2 : Cashflow (40 points)
    if cashflow_mensuel_net >= 200:
        score += 40
        conseils.append(f"✅ Excellent cashflow positif (+{cashflow_mensuel_net:.0f}€/mois) - Investissement sécurisé.")
    elif cashflow_mensuel_net >= 0:
        score += 30
        conseils.append(f"✅ Cashflow positif (+{cashflow_mensuel_net:.0f}€/mois) - Autofinancement assuré.")
    elif cashflow_mensuel_net >= -100:
        score += 20
        conseils.append(f"⚠️ Léger effort d'épargne ({abs(cashflow_mensuel_net):.0f}€/mois). Restez prudent.")
    else:
        score += 10
        conseils.append(f"❌ Effort d'épargne important ({abs(cashflow_mensuel_net):.0f}€/mois). Négociez le prix ou augmentez l'apport.")
    
    # Critère 3 : Autofinancement (20 points)
    if autofinancement:
        score += 20
        conseils.append("✅ Le bien s'autofinance totalement.")
    else:
        conseils.append("⚠️ Effort d'épargne mensuel nécessaire. Assurez-vous d'avoir des revenus stables.")
    
    # Verdict selon le score
    if score >= 80:
        verdict = "Excellent investissement"
    elif score >= 65:
        verdict = "Bon investissement"
    elif score >= 50:
        verdict = "Investissement moyen"
    else:
        verdict = "Investissement risqué"
    
    # Conseils généraux supplémentaires
    if prix_m2 > 4000:
        conseils.append("💡 Prix au m² élevé. Vérifiez que la localisation justifie ce prix (centre-ville, commodités).")
    
    if not autofinancement:
        conseils.append("💡 Pour améliorer le cashflow : négociez le prix, augmentez l'apport, ou cherchez un bien plus rentable.")
    
    return score, verdict, conseils


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
