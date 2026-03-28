import pandas as pd
import numpy as np
import requests
import time
from rdkit import Chem
from rdkit.Chem import AllChem
from tqdm import tqdm
import os

# Configuration
TARGET_CHEMBL_ID = 'CHEMBL4822'  # Human BACE-1
PIC50_THRESHOLD = 6.0          # 1,000 nM
OUTPUT_FILE = 'data/processed/bace_expanded.csv'
BASE_URL = "https://www.ebi.ac.uk/chembl/api/data/activity.json"

def fetch_chembl_data():
    print(f"--- Fetching BACE-1 data from ChEMBL via REST API ---")
    
    params = {
        "target_chembl_id": TARGET_CHEMBL_ID,
        "standard_type": "IC50",
        "standard_units": "nM",
        "limit": 1000,
        "offset": 0
    }
    
    all_activities = []
    
    while True:
        try:
            print(f"📥 Fetching records from offset {params['offset']}...")
            response = requests.get(BASE_URL, params=params, timeout=30)
            
            if response.status_code != 200:
                print(f"⚠️ API Error {response.status_code}. Retrying in 5s...")
                time.sleep(5)
                continue
                
            data = response.json()
            activities = data.get('activities', [])
            
            if not activities:
                break
                
            all_activities.extend(activities)
            print(f"✅ Downloaded {len(all_activities)} total...")
            
            # Check for next page
            if len(activities) < params['limit']:
                break
                
            params['offset'] += params['limit']
            time.sleep(0.5) # Gentle rate limiting
            
        except Exception as e:
            print(f"❌ Request failed: {e}. Retrying in 10s...")
            time.sleep(10)
            
    if not all_activities:
        return None
        
    df = pd.DataFrame(all_activities)
    return df

def standardize_mol(smiles):
    if not isinstance(smiles, str): return None
    try:
        mol = Chem.MolFromSmiles(smiles)
        if mol:
            return Chem.MolToSmiles(mol, canonical=True)
    except:
        return None
    return None

def process_data(df):
    if df is None or df.empty:
        print("❌ No data to process.")
        return None
        
    print("--- Standardizing & Labeling Data ---")
    
    # Columns we need
    cols = ['canonical_smiles', 'standard_value', 'standard_units', 'standard_type']
    df = df[cols].copy()
    
    df = df.dropna(subset=['canonical_smiles', 'standard_value'])
    df['standard_value'] = pd.to_numeric(df['standard_value'], errors='coerce')
    df = df.dropna(subset=['standard_value'])
    df = df[df['standard_value'] > 0]
    
    # Standardize SMILES
    tqdm.pandas(desc="RDKit Standardization")
    df['canonical_smiles'] = df['canonical_smiles'].progress_apply(standardize_mol)
    df = df.dropna(subset=['canonical_smiles'])
    
    # Calculate labels
    df['pIC50'] = -np.log10(df['standard_value'] * 1e-9)
    df['label'] = (df['pIC50'] >= PIC50_THRESHOLD).astype(int)
    
    # Deduplicate
    df = df.groupby('canonical_smiles').agg({
        'pIC50': 'median',
        'label': 'max'
    }).reset_index()
    
    print(f"✅ Final clean dataset size: {len(df)} molecules.")
    return df

def main():
    if not os.path.exists('data/processed'):
        os.makedirs('data/processed')
        
    raw_df = fetch_chembl_data()
    clean_df = process_data(raw_df)
    
    if clean_df is not None:
        clean_df.to_csv(OUTPUT_FILE, index=False)
        print(f"🎉 Expanded dataset saved to {OUTPUT_FILE}")
    else:
        print("❌ Dataset generation failed.")

if __name__ == "__main__":
    main()
