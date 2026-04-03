"""
Module de Scraping d'Annonces Immobilières
Utilise Scrapfly pour contourner les protections anti-bot
Supporte SeLoger, Leboncoin, et autres sites d'annonces
"""

import os
import re
import requests
import logging
from typing import Dict, Optional, Tuple
from bs4 import BeautifulSoup
import json
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

logger = logging.getLogger(__name__)

# Configuration Scrapfly
SCRAPFLY_KEY = os.getenv("SCRAPFLY_KEY", "")
SCRAPFLY_BASE_URL = "https://api.scrapfly.io/scrape"


# ============================================================================
# SCRAPING VIA SCRAPFLY
# ============================================================================

def fetch_html_with_scrapfly(
    url: str,
    render: bool = True,
    timeout: int = 90
) -> Tuple[Optional[str], Dict]:
    """
    Récupère le HTML d'une page via Scrapfly

    Args:
        url: URL de la page à scraper
        render: Si True, rend le JavaScript (nécessaire pour SeLoger)
        timeout: Timeout en secondes

    Returns:
        (html_content, info_dict) ou (None, error_dict)
    """

    if not SCRAPFLY_KEY:
        error_msg = (
            "Clé Scrapfly non configurée.\n"
            "   1. Créer un compte gratuit sur https://scrapfly.io/register\n"
            "   2. Copier votre clé API\n"
            "   3. Ajouter dans .env : SCRAPFLY_KEY=votre_cle\n"
        )
        logger.error(error_msg)
        return None, {"error": error_msg, "status_code": None}

    params: Dict[str, str] = {
        "key": SCRAPFLY_KEY,
        "url": url,
        "asp": "true",           # Anti Scraping Protection — contourne les protections
        "country": "fr",         # Proxy français
        "headers[Accept-Language]": "fr-FR,fr;q=0.9",
    }
    if render:
        params["render_js"] = "true"
        params["rendering_wait"] = "5000"  # Attendre 5s le rendu JS

    try:
        logger.info(f"Scraping via Scrapfly : {url[:80]}...")
        logger.info(f"   JS rendering : {'Oui' if render else 'Non'} | ASP : Oui")

        response = requests.get(SCRAPFLY_BASE_URL, params=params, timeout=timeout)

        if response.status_code == 401:
            raise Exception("Clé API Scrapfly invalide. Vérifiez votre clé sur scrapfly.io/dashboard")

        elif response.status_code == 429:
            raise Exception("Limite de requêtes Scrapfly atteinte. Attendez ou passez à un plan supérieur.")

        elif response.status_code != 200:
            body_preview = (response.text or "")[:400]
            raise Exception(f"Erreur Scrapfly : {response.status_code} - {body_preview}")

        # Scrapfly retourne un JSON avec le HTML dans result.content
        try:
            data = response.json()
            result_data = data.get("result", {})
            html = result_data.get("content", "")
            status = result_data.get("status_code", response.status_code)

            if not html or len(html) < 100:
                # Fallback : peut-être que la réponse est directement le HTML
                if len(response.text) > 100 and "<" in response.text[:50]:
                    html = response.text
                else:
                    raise Exception("HTML reçu trop court ou vide")

            logger.info(f"HTML récupéré via Scrapfly : {len(html):,} caractères (status {status})")

            return html, {
                "status_code": status,
                "html_length": len(html),
                "success": True,
            }

        except (json.JSONDecodeError, KeyError):
            # Réponse non-JSON : peut-être du HTML brut
            html = response.text
            if html and len(html) > 100:
                logger.info(f"HTML brut récupéré : {len(html):,} caractères")
                return html, {"status_code": response.status_code, "html_length": len(html), "success": True}
            raise Exception("Réponse Scrapfly invalide (ni JSON ni HTML)")

    except requests.Timeout:
        error_msg = f"Timeout après {timeout}s. Réessayez avec un timeout plus long."
        logger.error(error_msg)
        return None, {"error": error_msg, "status_code": None}

    except Exception as e:
        logger.error(f"Erreur lors du scraping : {str(e)}")
        return None, {"error": str(e), "status_code": None}


# ============================================================================
# EXTRACTION DES DONNÉES (BeautifulSoup)
# ============================================================================

def parse_jsonld(soup: BeautifulSoup) -> Dict:
    """
    Parse les données structurées JSON-LD
    SeLoger et d'autres sites utilisent ce format pour les métadonnées
    """
    data = {}

    try:
        jsonld_scripts = soup.find_all("script", type="application/ld+json")

        for script in jsonld_scripts:
            try:
                jsonld = json.loads(script.string)

                if isinstance(jsonld, list):
                    jsonld = jsonld[0] if jsonld else {}

                if jsonld.get("@type") in ["Product", "RealEstateListing", "Apartment", "House"]:

                    if "offers" in jsonld:
                        offers = jsonld["offers"]
                        if isinstance(offers, dict):
                            data["prix"] = offers.get("price")
                        elif isinstance(offers, list) and offers:
                            data["prix"] = offers[0].get("price")

                    if "floorSize" in jsonld:
                        floor_size = jsonld["floorSize"]
                        if isinstance(floor_size, dict):
                            data["surface"] = floor_size.get("value")
                        else:
                            data["surface"] = floor_size

                    if "address" in jsonld:
                        address = jsonld["address"]
                        if isinstance(address, dict):
                            data["ville"] = address.get("addressLocality")
                            data["code_postal"] = address.get("postalCode")
                            data["departement"] = address.get("addressRegion")

                    if "numberOfRooms" in jsonld:
                        data["nb_pieces"] = jsonld["numberOfRooms"]

                    logger.info("Données extraites depuis JSON-LD")

            except json.JSONDecodeError:
                continue
            except Exception as e:
                logger.warning(f"Erreur parsing JSON-LD : {e}")
                continue

    except Exception as e:
        logger.warning(f"Erreur recherche JSON-LD : {e}")

    return data


def parse_opengraph(soup: BeautifulSoup) -> Dict:
    """Parse les métadonnées OpenGraph (og:*)"""
    data = {}

    try:
        og_price = soup.find("meta", property="og:price:amount")
        if og_price:
            data["prix"] = og_price.get("content")

        og_title = soup.find("meta", property="og:title")
        if og_title:
            title = og_title.get("content", "")
            data["titre"] = title

            match_ville = re.search(r"à ([^,\-]+)", title)
            if match_ville:
                data["ville"] = match_ville.group(1).strip()

        og_desc = soup.find("meta", property="og:description")
        if og_desc:
            desc = og_desc.get("content", "")

            match_surface = re.search(r"(\d+)\s*m[²2]", desc)
            if match_surface:
                data["surface"] = float(match_surface.group(1))

            match_pieces = re.search(r"(\d+)\s*(?:pièces?|chambres?)|[TF](\d+)", desc)
            if match_pieces:
                data["nb_pieces"] = int(match_pieces.group(1) or match_pieces.group(2))

        if data:
            logger.info("Données extraites depuis OpenGraph")

    except Exception as e:
        logger.warning(f"Erreur parsing OpenGraph : {e}")

    return data


def extract_from_title_seloger(soup: BeautifulSoup) -> Dict:
    """
    Extraction spécifique depuis le titre de page SeLoger.
    Format typique : 'Appartement à vendre T2/F2 42 m² 169000 € ... Ville (92600)'
    """
    data = {}
    try:
        title_tag = soup.find("title")
        title = title_tag.get_text() if title_tag else ""
        desc_meta = soup.find("meta", {"name": "description"})
        desc = desc_meta.get("content", "") if desc_meta else ""
        text = f"{title} {desc}"

        if not text.strip():
            return data

        data["titre"] = title.strip() if title.strip() else None

        # Prix : nombre de 5-7 chiffres suivi de € ou espace+€
        m = re.search(r'(\d[\d\s.]{3,})\s*[\u20ac€]', text)
        if not m:
            # Fallback : nombre isolé de 5+ chiffres (souvent le prix dans le titre SeLoger)
            m = re.search(r'\b(\d{5,7})\b', text)
        if m:
            prix_str = m.group(1).replace(" ", "").replace(".", "")
            try:
                prix = float(prix_str)
                if 10000 <= prix <= 10000000:
                    data["prix"] = prix
            except ValueError:
                pass

        # Surface : nombre + m² ou m2
        m = re.search(r'(\d+(?:[.,]\d+)?)\s*m[\u00b2\xb22]', text)
        if m:
            data["surface"] = float(m.group(1).replace(",", "."))

        # Nombre de pièces : T2/F2 ou "2 pièces"
        m = re.search(r'[TF](\d+)', text)
        if not m:
            m = re.search(r'(\d+)\s*pi[eè]ces?', text, re.IGNORECASE)
        if m:
            data["nb_pieces"] = int(m.group(1))

        # Code postal : (XXXXX) à la fin
        m = re.search(r'\((\d{5})\)', text)
        if m:
            data["code_postal"] = m.group(1)

        # Ville : extraire depuis le texte entre le dernier € et (code_postal)
        # Ex: "169000 € Hauts d'Asnières-Métro Asnières-sur-Seine (92600)"
        m = re.search(r'[\u20ac€\xe2][\s\xa0]*(.+?)\s*\(\d{5}\)', text)
        if m:
            raw = m.group(1).strip()
            # Prendre le dernier segment (la ville, pas le quartier)
            # "Hauts d'Asnières-Métro Asnières-sur-Seine" → "Asnières-sur-Seine"
            parts = re.split(r'\s+', raw)
            # Chercher le dernier mot composé avec tirets (= nom de ville)
            for i in range(len(parts) - 1, -1, -1):
                if '-' in parts[i] and len(parts[i]) > 3:
                    data["ville"] = " ".join(parts[i:])
                    break
            if "ville" not in data and parts:
                data["ville"] = " ".join(parts[-2:]) if len(parts) >= 2 else parts[-1]

        if data:
            logger.info(f"Données extraites depuis titre/meta : prix={data.get('prix')}, surface={data.get('surface')}, cp={data.get('code_postal')}")

    except Exception as e:
        logger.warning(f"Erreur extraction titre SeLoger : {e}")

    return data


def extract_from_html_patterns(soup: BeautifulSoup, html: str) -> Dict:
    """Extraction par patterns regex dans le HTML brut"""
    data = {}

    try:
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

        cp_patterns = [
            r'"postalCode":\s*"(\d{5})"',
            r'code[\s_-]?postal["\']?\s*:\s*["\']?(\d{5})',
        ]

        for pattern in cp_patterns:
            match = re.search(pattern, html)
            if match:
                cp = match.group(1)
                if 1000 <= int(cp) <= 99999:
                    data["code_postal"] = cp
                    break

        if data:
            logger.info("Données extraites par patterns regex")

    except Exception as e:
        logger.warning(f"Erreur extraction patterns : {e}")

    return data


def extract_price_from_text(text: str) -> Optional[float]:
    """Extrait le prix depuis un texte (titre, description)"""
    if not text:
        return None

    try:
        patterns = [
            r'(\d+(?:[\s.]\d{3})*(?:\s*\d+)?)\s*€',
            r'prix\s*:?\s*(\d+(?:[\s.]\d{3})*(?:\s*\d+)?)\s*€',
            r'(\d{5,})\s*€',
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)

            if matches:
                prix_str = matches[0]
                prix_clean = prix_str.replace(" ", "").replace(".", "").replace(",", "")
                prix = float(prix_clean)

                if 10000 <= prix <= 10000000:
                    logger.info(f"Prix extrait du texte : {prix:,.0f}EUR")
                    return prix

        return None

    except Exception as e:
        logger.warning(f"Erreur extraction prix depuis texte : {e}")
        return None


def extract_surface_from_text(text: str) -> Optional[float]:
    """Extrait la surface depuis un texte (titre, description)"""
    if not text:
        return None

    try:
        patterns = [
            r'(\d+(?:[.,]\d+)?)\s*m[²2]',
            r'surface\s*:?\s*(\d+(?:[.,]\d+)?)\s*m[²2]',
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)

            if matches:
                surface_str = matches[0].replace(",", ".")
                surface = float(surface_str)

                if 10 <= surface <= 500:
                    logger.info(f"Surface extraite du texte : {surface}m2")
                    return surface

        return None

    except Exception as e:
        logger.warning(f"Erreur extraction surface depuis texte : {e}")
        return None


def scrape_ad(url: str) -> Dict:
    """
    Scrape une annonce immobilière et extrait les données principales

    Supporte : SeLoger, Leboncoin, PAP, Bien'ici, et autres

    Returns:
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
    logger.info("SCRAPING DE L'ANNONCE")
    logger.info("=" * 80)
    logger.info(f"URL : {url}")

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
        # Étape 1 : Récupérer le HTML via Scrapfly
        html, info = fetch_html_with_scrapfly(url, render=True, timeout=90)

        if html is None:
            result["error"] = info.get("error", "Échec du scraping")
            return result

        # Étape 2 : Parser avec BeautifulSoup
        soup = BeautifulSoup(html, "lxml")

        # Étape 3 : Extraire les données (par ordre de priorité)
        data_title = extract_from_title_seloger(soup)
        data_jsonld = parse_jsonld(soup)
        data_og = parse_opengraph(soup)
        data_patterns = extract_from_html_patterns(soup, html)

        # Extraire ville depuis l'URL (très fiable pour SeLoger/Leboncoin)
        data_url = {}
        try:
            from urllib.parse import urlparse
            path = urlparse(url).path  # ex: /annonces/achat/appartement/asnieres-sur-seine-92/...
            path_parts = [p for p in path.split('/') if p]
            for part in path_parts:
                # Chercher un segment type "ville-XX" (ex: "asnieres-sur-seine-92")
                m_url = re.match(r'^([a-z][\w-]+?)[-_](\d{2,3})$', part)
                if m_url:
                    ville_slug = m_url.group(1)
                    # Convertir slug en nom : "asnieres-sur-seine" → "Asnières-sur-Seine"
                    data_url["ville"] = ville_slug.replace('-', ' ').title().replace(' Sur ', '-sur-').replace(' De ', '-de-').replace(' Les ', '-les-').replace(' En ', '-en-').replace(' La ', '-la-')
                    break
        except Exception:
            pass

        # Fusionner (priorité : JSON-LD > OpenGraph > Title > Patterns)
        # Sauf pour la ville : URL > titre (le titre contient souvent le quartier en plus)
        extracted = {**data_patterns, **data_title, **data_og, **data_jsonld}
        # La ville depuis l'URL est plus propre — écraser si disponible
        if data_url.get("ville"):
            extracted["ville"] = data_url["ville"]

        # Fallback : extraction depuis titre/description
        titre = extracted.get("titre", "")
        description = ""
        desc_meta = soup.find("meta", {"name": "description"})
        if desc_meta:
            description = desc_meta.get("content", "")
        texte_analyse = f"{titre} {description}"

        if not extracted.get("prix") or extracted.get("prix") == 0:
            logger.info("Prix non trouvé par méthodes classiques, analyse du texte...")
            prix_texte = extract_price_from_text(texte_analyse)
            if prix_texte:
                extracted["prix"] = prix_texte

        if not extracted.get("surface") or extracted.get("surface") == 0:
            logger.info("Surface non trouvée par méthodes classiques, analyse du texte...")
            surface_texte = extract_surface_from_text(texte_analyse)
            if surface_texte:
                extracted["surface"] = surface_texte

        # Mettre à jour le résultat
        result["prix"] = extracted.get("prix")
        result["surface"] = extracted.get("surface")
        result["code_postal"] = extracted.get("code_postal")
        result["ville"] = extracted.get("ville")
        result["nb_pieces"] = extracted.get("nb_pieces")
        result["titre"] = extracted.get("titre")

        # Convertir les types
        if result["prix"]:
            result["prix"] = float(result["prix"])
        if result["surface"]:
            result["surface"] = float(result["surface"])
        if result["nb_pieces"]:
            result["nb_pieces"] = int(result["nb_pieces"])
        if result["code_postal"]:
            result["code_postal"] = str(result["code_postal"]).strip()[:5]

        # Vérifier les données essentielles
        if not result["prix"]:
            result["error"] = "Prix non trouvé dans l'annonce"
        elif not result["surface"]:
            result["error"] = "Surface non trouvée dans l'annonce"
        elif not result["code_postal"]:
            result["error"] = "Code postal non trouvé dans l'annonce"
        else:
            result["success"] = True

        # Log résumé
        logger.info("=" * 80)
        logger.info("RESULTATS DU SCRAPING")
        logger.info("=" * 80)
        logger.info(f"Prix : {result['prix']:,.0f}EUR" if result['prix'] else "Prix non trouvé")
        logger.info(f"Surface : {result['surface']}m2" if result['surface'] else "Surface non trouvée")
        logger.info(f"Code postal : {result['code_postal']}" if result['code_postal'] else "Code postal non trouvé")
        logger.info(f"Ville : {result['ville']}" if result['ville'] else "Ville non trouvée")
        logger.info(f"Pièces : {result['nb_pieces']}" if result['nb_pieces'] else "Pièces non trouvées")
        logger.info("=" * 80)

        if result["success"]:
            logger.info("SCRAPING REUSSI")
        else:
            logger.warning(f"SCRAPING PARTIEL : {result['error']}")

        return result

    except Exception as e:
        error_msg = f"Erreur lors du scraping : {str(e)}"
        logger.error(error_msg)
        result["error"] = error_msg
        return result
