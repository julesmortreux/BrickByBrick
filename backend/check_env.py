import os
from dotenv import load_dotenv

# Charge les variables
load_dotenv()

print("📂 Dossier actuel de travail :", os.getcwd())
print("------------------------------------------------")

# Vérifie si le fichier existe physiquement
if os.path.exists(".env"):
    print("✅ Le fichier .env est bien présent physiquement.")
else:
    print("❌ Le fichier .env est INTROUVABLE dans ce dossier.")
    print("   Voici les fichiers présents ici :")
    for f in os.listdir():
        print(f"   - {f}")

print("------------------------------------------------")
# Vérifie si la clé est chargée
key = os.getenv("SCRAPERAPI_KEY")
if key:
    print(f"✅ Clé chargée avec succès : {key[:5]}... (masquée)")
else:
    print("❌ Clé NON chargée (os.getenv renvoie None).")