"""
Module de Scraping d'Annonces Immobilières
Utilise ScraperAPI pour contourner les protections anti-bot
Supporte SeLoger, Leboncoin, et autres sites d'annonces
"""

import os
import re
import requests
import logging
from typing import Dict, Optional, Tuple
from urllib.parse import quote
from bs4 import BeautifulSoup
import json
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

logger = logging.getLogger(__name__)

# Configuration ScraperAPI
SCRAPERAPI_KEY = os.getenv("SCRAPERAPI_KEY", "")
SCRAPERAPI_BASE_URL = "http://api.scraperapi.com"


# ============================================================================
# SCRAPING VIA SCRAPERAPI
# ============================================================================

def fetch_html_with_scraperapi(
    url: str,
    render: bool = True,
    timeout: int = 90
) -> Tuple[Optional[str], Dict]:
    """
    Récupère le HTML d'une page via ScraperAPI
    
    Args:
        url: URL de la page à scraper
        render: Si True, rend le JavaScript (nécessaire pour SeLoger)
        timeout: Timeout en secondes
    
    Returns:
        (html_content, info_dict) ou (None, error_dict)
    """
    
    if not SCRAPERAPI_KEY:
        error_msg = (
            "❌ Clé ScraperAPI non configurée.\n"
            "   1. Créer un compte gratuit sur https://www.scraperapi.com/signup\n"
            "   2. Copier votre clé API\n"
            "   3. Créer un fichier .env avec : SCRAPERAPI_KEY=votre_cle\n"
        )
        logger.error(error_msg)
        return None, {"error": error_msg, "status_code": None}
    
    # Construction de l'URL ScraperAPI
    params = {
        "api_key": SCRAPERAPI_KEY,
        "url": url
    }
    
    if render:
        params["render"] = "true"  # Rend le JavaScript (essentiel pour SeLoger)
    
    # Construire l'URL complète
    scraperapi_url = f"{SCRAPERAPI_BASE_URL}?api_key={params['api_key']}&url={quote(url)}"
    if render:
        scraperapi_url += "&render=true"
    
    try:
        logger.info(f"🔄 Scraping via ScraperAPI : {url[:60]}...")
        logger.info(f"   Render JavaScript : {'✅ Activé' if render else '❌ Désactivé'}")
        
        response = requests.get(scraperapi_url, timeout=timeout)
        
        # Gestion des erreurs HTTP
        if response.status_code == 401:
            raise Exception("❌ Clé API ScraperAPI invalide. Vérifiez votre clé sur scraperapi.com/account")
        
        elif response.status_code == 429:
            raise Exception("❌ Limite de requêtes ScraperAPI atteinte. Attendez ou passez à un plan supérieur.")
        
        elif response.status_code != 200:
            raise Exception(f"❌ Erreur ScraperAPI : {response.status_code} - {response.text[:200]}")
        
        html = response.text
        
        if not html or len(html) < 100:
            raise Exception("❌ HTML reçu trop court ou vide")
        
        logger.info(f"✅ HTML récupéré : {len(html):,} caractères")
        
        return html, {
            "status_code": response.status_code,
            "html_length": len(html),
            "success": True
        }
        
    except requests.Timeout:
        error_msg = f"⏱️ Timeout après {timeout}s. Réessayez avec un timeout plus long."
        logger.error(error_msg)
        return None, {"error": error_msg, "status_code": None}
    
    except Exception as e:
        logger.error(f"❌ Erreur lors du scraping : {str(e)}")
        return None, {"error": str(e), "status_code": None}


# ============================================================================
# EXTRACTION DES DONNÉES (BeautifulSoup)
# ============================================================================

def parse_jsonld(soup: BeautifulSoup) -> Dict:
    """
    Parse les données structurées JSON-LD
    SeLoger et d'autres sites utilisent ce format pour les métadonnées
    
    Args:
        soup: Objet BeautifulSoup
    
    Returns:
        Dictionnaire des données extraites
    """
    data = {}
    
    try:
        # Chercher tous les scripts JSON-LD
        jsonld_scripts = soup.find_all("script", type="application/ld+json")
        
        for script in jsonld_scripts:
            try:
                jsonld = json.loads(script.string)
                
                # Si c'est un tableau, prendre le premier élément
                if isinstance(jsonld, list):
                    jsonld = jsonld[0] if jsonld else {}
                
                # Extraction selon le type
                if jsonld.get("@type") in ["Product", "RealEstateListing", "Apartment", "House"]:
                    
                    # Prix (offers)
                    if "offers" in jsonld:
                        offers = jsonld["offers"]
                        if isinstance(offers, dict):
                            data["prix"] = offers.get("price")
                        elif isinstance(offers, list) and offers:
                            data["prix"] = offers[0].get("price")
                    
                    # Surface
                    if "floorSize" in jsonld:
                        floor_size = jsonld["floorSize"]
                        if isinstance(floor_size, dict):
                            data["surface"] = floor_size.get("value")
                        else:
                            data["surface"] = floor_size
                    
                    # Adresse
                    if "address" in jsonld:
                        address = jsonld["address"]
                        if isinstance(address, dict):
                            data["ville"] = address.get("addressLocality")
                            data["code_postal"] = address.get("postalCode")
                            data["departement"] = address.get("addressRegion")
                    
                    # Nombre de pièces
                    if "numberOfRooms" in jsonld:
                        data["nb_pieces"] = jsonld["numberOfRooms"]
                    
                    logger.info("✅ Données extraites depuis JSON-LD")
                    
            except json.JSONDecodeError:
                continue
            except Exception as e:
                logger.warning(f"⚠️ Erreur parsing JSON-LD : {e}")
                continue
    
    except Exception as e:
        logger.warning(f"⚠️ Erreur recherche JSON-LD : {e}")
    
    return data


def parse_opengraph(soup: BeautifulSoup) -> Dict:
    """
    Parse les métadonnées OpenGraph (og:*)
    Fallback si JSON-LD n'est pas disponible
    
    Args:
        soup: Objet BeautifulSoup
    
    Returns:
        Dictionnaire des données extraites
    """
    data = {}
    
    try:
        # Prix
        og_price = soup.find("meta", property="og:price:amount")
        if og_price:
            data["prix"] = og_price.get("content")
        
        # Titre (souvent contient ville et type)
        og_title = soup.find("meta", property="og:title")
        if og_title:
            title = og_title.get("content", "")
            data["titre"] = title
            
            # Extraire la ville du titre (ex: "Appartement à Paris 11ème")
            match_ville = re.search(r"à ([^,\-]+)", title)
            if match_ville:
                data["ville"] = match_ville.group(1).strip()
        
        # Description (peut contenir surface, pièces)
        og_desc = soup.find("meta", property="og:description")
        if og_desc:
            desc = og_desc.get("content", "")
            
            # Chercher surface (ex: "45 m²", "45m²", "45 m2")
            match_surface = re.search(r"(\d+)\s*m[²2]", desc)
            if match_surface:
                data["surface"] = float(match_surface.group(1))
            
            # Chercher nombre de pièces (ex: "2 pièces", "T2", "F2")
            match_pieces = re.search(r"(\d+)\s*(?:pièces?|chambres?)|[TF](\d+)", desc)
            if match_pieces:
                data["nb_pieces"] = int(match_pieces.group(1) or match_pieces.group(2))
        
        if data:
            logger.info("✅ Données extraites depuis OpenGraph")
    
    except Exception as e:
        logger.warning(f"⚠️ Erreur parsing OpenGraph : {e}")
    
    return data


def extract_from_html_patterns(soup: BeautifulSoup, html: str) -> Dict:
    """
    Extraction par patterns regex dans le HTML brut
    Dernier fallback si les métadonnées structurées échouent
    
    Args:
        soup: Objet BeautifulSoup
        html: HTML brut
    
    Returns:
        Dictionnaire des données extraites
    """
    data = {}
    
    try:
        # Chercher prix (patterns courants)
        prix_patterns = [
            r'"price":\s*(\d+)',
            r'prix["\']?\s*:\s*["\']?(\d+)',
            r'data-price["\']?\s*=\s*["\']?(\d+)',
        ]
        
        for pattern in prix_patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                data["prix"] = float(match.group(1))
                break
        
        # Chercher surface
        surface_patterns = [
            r'"surface":\s*(\d+\.?\d*)',
            r'surface["\']?\s*:\s*["\']?(\d+\.?\d*)',
            r'data-surface["\']?\s*=\s*["\']?(\d+\.?\d*)',
        ]
        
        for pattern in surface_patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                data["surface"] = float(match.group(1))
                break
        
        # Chercher code postal (5 chiffres)
        cp_patterns = [
            r'"postalCode":\s*"(\d{5})"',
            r'code[\s_-]?postal["\']?\s*:\s*["\']?(\d{5})',
            r'\b(\d{5})\b',  # 5 chiffres isolés
        ]
        
        for pattern in cp_patterns:
            match = re.search(pattern, html)
            if match:
                cp = match.group(1)
                # Vérifier que c'est bien un code postal français (01000-99999)
                if 1000 <= int(cp) <= 99999:
                    data["code_postal"] = cp
                    break
        
        if data:
            logger.info("✅ Données extraites par patterns regex")
    
    except Exception as e:
        logger.warning(f"⚠️ Erreur extraction patterns : {e}")
    
    return data


def extract_price_from_text(text: str) -> Optional[float]:
    """
    Extrait le prix depuis un texte (titre, description)
    Fallback ultime quand les autres méthodes échouent
    
    Patterns supportés :
    - "400 000 €"
    - "400000 €"
    - "400.000 €"
    - "400 000€"
    - "Prix : 400000 €"
    
    Args:
        text: Texte contenant potentiellement un prix
    
    Returns:
        Prix extrait (float) ou None
    """
    if not text:
        return None
    
    try:
        # Pattern regex pour détecter les prix
        # Capture : nombre avec espaces, points ou rien + symbole €
        # Ex: "400 000 €", "400000€", "400.000 €"
        patterns = [
            # Pattern principal : nombre avec espaces/points optionnels + €
            r'(\d+(?:[\s.]\d{3})*(?:\s*\d+)?)\s*€',
            
            # Pattern alternatif : "Prix : XXXXX €" ou "Prix: XXXXX €"
            r'prix\s*:?\s*(\d+(?:[\s.]\d{3})*(?:\s*\d+)?)\s*€',
            
            # Pattern pour montants sans séparateurs
            r'(\d{5,})\s*€',  # Au moins 5 chiffres (prix > 10000€)
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            
            if matches:
                # Prendre le premier match (généralement le prix principal)
                prix_str = matches[0]
                
                # Nettoyer la chaîne : enlever espaces et points
                prix_clean = prix_str.replace(" ", "").replace(".", "").replace(",", "")
                
                # Convertir en float
                prix = float(prix_clean)
                
                # Vérifier que c'est un prix immobilier plausible
                # (entre 10 000€ et 10 000 000€)
                if 10000 <= prix <= 10000000:
                    logger.info(f"✅ Prix extrait du texte : {prix:,.0f}€ (trouvé: '{prix_str}')")
                    return prix
                else:
                    logger.warning(f"⚠️ Prix extrait hors limites : {prix:,.0f}€ (trouvé: '{prix_str}')")
        
        return None
        
    except Exception as e:
        logger.warning(f"⚠️ Erreur extraction prix depuis texte : {e}")
        return None


def extract_surface_from_text(text: str) -> Optional[float]:
    """
    Extrait la surface depuis un texte (titre, description)
    Fallback ultime quand les autres méthodes échouent
    
    Patterns supportés :
    - "66 m²"
    - "66m²"
    - "66 m2"
    - "Surface : 66 m²"
    
    Args:
        text: Texte contenant potentiellement une surface
    
    Returns:
        Surface extraite (float) ou None
    """
    if not text:
        return None
    
    try:
        # Patterns pour détecter les surfaces
        patterns = [
            r'(\d+(?:[.,]\d+)?)\s*m[²2]',  # "66 m²" ou "66m²" ou "66 m2"
            r'surface\s*:?\s*(\d+(?:[.,]\d+)?)\s*m[²2]',  # "Surface : 66 m²"
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            
            if matches:
                surface_str = matches[0]
                
                # Remplacer virgule par point pour conversion
                surface_str = surface_str.replace(",", ".")
                
                surface = float(surface_str)
                
                # Vérifier que c'est une surface plausible (entre 10 et 500 m²)
                if 10 <= surface <= 500:
                    logger.info(f"✅ Surface extraite du texte : {surface}m²")
                    return surface
                else:
                    logger.warning(f"⚠️ Surface extraite hors limites : {surface}m²")
        
        return None
        
    except Exception as e:
        logger.warning(f"⚠️ Erreur extraction surface depuis texte : {e}")
        return None


def scrape_ad(url: str) -> Dict:
    """
    Scrape une annonce immobilière et extrait les données principales
    
    Supporte :
    - SeLoger
    - Leboncoin
    - PAP
    - Autres sites d'annonces (extraction générique)
    
    Args:
        url: URL de l'annonce
    
    Returns:
        Dictionnaire contenant :
        {
            "url": str,
            "prix": float,
            "surface": float,
            "code_postal": str,
            "ville": str,
            "nb_pieces": int (optionnel),
            "titre": str (optionnel),
            "success": bool,
            "error": str (si échec)
        }
    """
    
    logger.info("=" * 80)
    logger.info(f"🔍 SCRAPING DE L'ANNONCE")
    logger.info("=" * 80)
    logger.info(f"📍 URL : {url}")
    
    result = {
        "url": url,
        "prix": None,
        "surface": None,
        "code_postal": None,
        "ville": None,
        "nb_pieces": None,
        "titre": None,
        "success": False,
        "error": None
    }
    
    try:
        # Étape 1 : Récupérer le HTML via ScraperAPI
        html, info = fetch_html_with_scraperapi(url, render=True, timeout=90)
        
        if html is None:
            result["error"] = info.get("error", "Échec du scraping")
            return result
        
        # Étape 2 : Parser avec BeautifulSoup
        soup = BeautifulSoup(html, "lxml")
        
        # Étape 3 : Extraire les données (par ordre de priorité)
        
        # 3.1 - JSON-LD (le plus fiable)
        data_jsonld = parse_jsonld(soup)
        
        # 3.2 - OpenGraph (fallback)
        data_og = parse_opengraph(soup)
        
        # 3.3 - Patterns regex (dernier recours)
        data_patterns = extract_from_html_patterns(soup, html)
        
        # Fusionner les données (priorité : JSON-LD > OpenGraph > Patterns)
        extracted = {**data_patterns, **data_og, **data_jsonld}
        
        # ===== FALLBACK ULTIME : EXTRACTION DEPUIS TITRE/DESCRIPTION =====
        # Si le prix ou la surface manquent, chercher dans le texte visible
        
        titre = extracted.get("titre", "")
        
        # Récupérer aussi la description si disponible
        description = ""
        desc_meta = soup.find("meta", {"name": "description"})
        if desc_meta:
            description = desc_meta.get("content", "")
        
        # Combiner titre + description pour analyse
        texte_analyse = f"{titre} {description}"
        
        # Fallback prix
        if not extracted.get("prix") or extracted.get("prix") == 0:
            logger.info("⚠️ Prix non trouvé par méthodes classiques, analyse du texte...")
            prix_texte = extract_price_from_text(texte_analyse)
            if prix_texte:
                extracted["prix"] = prix_texte
                logger.info(f"✅ Prix extrait depuis le texte : {prix_texte:,.0f}€")
        
        # Fallback surface
        if not extracted.get("surface") or extracted.get("surface") == 0:
            logger.info("⚠️ Surface non trouvée par méthodes classiques, analyse du texte...")
            surface_texte = extract_surface_from_text(texte_analyse)
            if surface_texte:
                extracted["surface"] = surface_texte
                logger.info(f"✅ Surface extraite depuis le texte : {surface_texte}m²")
        
        # Mettre à jour le résultat
        result["prix"] = extracted.get("prix")
        result["surface"] = extracted.get("surface")
        result["code_postal"] = extracted.get("code_postal")
        result["ville"] = extracted.get("ville")
        result["nb_pieces"] = extracted.get("nb_pieces")
        result["titre"] = extracted.get("titre")
        
        # Convertir les types si nécessaire
        if result["prix"]:
            result["prix"] = float(result["prix"])
        
        if result["surface"]:
            result["surface"] = float(result["surface"])
        
        if result["nb_pieces"]:
            result["nb_pieces"] = int(result["nb_pieces"])
        
        # Nettoyer le code postal
        if result["code_postal"]:
            result["code_postal"] = str(result["code_postal"]).strip()[:5]
        
        # Vérifier que les données essentielles sont présentes
        if not result["prix"]:
            result["error"] = "Prix non trouvé dans l'annonce"
        elif not result["surface"]:
            result["error"] = "Surface non trouvée dans l'annonce"
        elif not result["code_postal"]:
            result["error"] = "Code postal non trouvé dans l'annonce"
        else:
            result["success"] = True
        
        # Afficher le résumé
        logger.info("=" * 80)
        logger.info("📊 RÉSULTATS DU SCRAPING")
        logger.info("=" * 80)
        logger.info(f"✅ Prix : {result['prix']:,.0f}€" if result['prix'] else "❌ Prix non trouvé")
        logger.info(f"✅ Surface : {result['surface']}m²" if result['surface'] else "❌ Surface non trouvée")
        logger.info(f"✅ Code postal : {result['code_postal']}" if result['code_postal'] else "❌ Code postal non trouvé")
        logger.info(f"✅ Ville : {result['ville']}" if result['ville'] else "ℹ️ Ville non trouvée")
        logger.info(f"✅ Pièces : {result['nb_pieces']}" if result['nb_pieces'] else "ℹ️ Pièces non trouvées")
        logger.info("=" * 80)
        
        if result["success"]:
            logger.info("✅ SCRAPING RÉUSSI")
        else:
            logger.warning(f"⚠️ SCRAPING PARTIEL : {result['error']}")
        
        return result
        
    except Exception as e:
        error_msg = f"Erreur lors du scraping : {str(e)}"
        logger.error(f"❌ {error_msg}")
        result["error"] = error_msg
        return result


# ============================================================================
# TEST DU MODULE
# ============================================================================

if __name__ == "__main__":
    """Test du scraper avec une URL d'exemple"""
    
    print("\n🧪 TEST DU SCRAPER")
    print("=" * 80)
    
    # URL de test (à remplacer par une vraie URL SeLoger)
    test_url = "https://www.seloger.com/annonces/achat/appartement/paris-11eme-75/..."
    
    print(f"\n📍 URL de test : {test_url}")
    print("\n⚠️ Remplacez cette URL par une vraie URL SeLoger pour tester\n")
    
    if not SCRAPERAPI_KEY:
        print("❌ Clé ScraperAPI non configurée")
        print("   1. Créez un fichier .env dans backend/")
        print("   2. Ajoutez : SCRAPERAPI_KEY=votre_cle")
    else:
        print(f"✅ Clé ScraperAPI configurée : {SCRAPERAPI_KEY[:10]}...")
        
        # Décommenter pour tester avec une vraie URL
        # result = scrape_ad(test_url)
        # print(f"\n📊 Résultat : {result}")
