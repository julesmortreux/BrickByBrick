"""
Migration script to add onboarding_completed and taux_interet fields
Run this script to update existing database tables
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine

def run_migration():
    """Add onboarding_completed to users table and taux_interet to user_preferences table"""
    
    with engine.connect() as conn:
        # Check if columns already exist
        try:
            # Check users table
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='onboarding_completed'
            """))
            if result.fetchone():
                print("Column 'onboarding_completed' already exists in users table")
            else:
                # Add onboarding_completed column
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE
                """))
                print("Added 'onboarding_completed' column to users table")
            
            # Check user_preferences table
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='user_preferences' AND column_name='taux_interet'
            """))
            if result.fetchone():
                print("Column 'taux_interet' already exists in user_preferences table")
            else:
                # Add taux_interet column
                conn.execute(text("""
                    ALTER TABLE user_preferences 
                    ADD COLUMN taux_interet FLOAT DEFAULT 3.5
                """))
                print("Added 'taux_interet' column to user_preferences table")
            
            conn.commit()
            print("\nMigration completed successfully!")
            
        except Exception as e:
            conn.rollback()
            print(f"Error during migration: {e}")
            raise

if __name__ == "__main__":
    print("Running migration: add_onboarding_fields")
    print("=" * 50)
    run_migration()
