"""
Migration script to add Widget 5 (Proximité Domicile) fields to user_preferences table
Run this script once to update existing databases
"""
import sqlite3
import os
from pathlib import Path

# Path to database
DB_PATH = Path(__file__).parent / "brickbybrick.db"

def migrate():
    """Add w5_rayon, w5_ville_domicile, w5_villes_relais columns to user_preferences table"""
    if not DB_PATH.exists():
        print(f"[!] Database not found at {DB_PATH}")
        print("[!] Database will be created automatically on next server start")
        return
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(user_preferences)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # Add w5_rayon if it doesn't exist
        if 'w5_rayon' not in columns:
            print("[>] Adding w5_rayon column...")
            cursor.execute("ALTER TABLE user_preferences ADD COLUMN w5_rayon INTEGER DEFAULT 20")
            print("[OK] w5_rayon column added")
        else:
            print("[OK] w5_rayon column already exists")
        
        # Add w5_ville_domicile if it doesn't exist
        if 'w5_ville_domicile' not in columns:
            print("[>] Adding w5_ville_domicile column...")
            cursor.execute("ALTER TABLE user_preferences ADD COLUMN w5_ville_domicile TEXT")
            print("[OK] w5_ville_domicile column added")
        else:
            print("[OK] w5_ville_domicile column already exists")
        
        # Add w5_villes_relais if it doesn't exist
        if 'w5_villes_relais' not in columns:
            print("[>] Adding w5_villes_relais column...")
            cursor.execute("ALTER TABLE user_preferences ADD COLUMN w5_villes_relais TEXT")
            print("[OK] w5_villes_relais column added")
        else:
            print("[OK] w5_villes_relais column already exists")
        
        conn.commit()
        print("\n[OK] Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n[!] Error during migration: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Migration: Adding Widget 5 fields to user_preferences")
    print("=" * 60)
    migrate()
