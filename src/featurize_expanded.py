import pandas as pd
import numpy as np
import os
from rdkit import Chem
from rdkit.Chem import AllChem
from tqdm import tqdm
import sys

# Add src to path to reuse existing features logic
sys.path.append('src')
from features import smiles_to_fingerprint

# Configuration
INPUT_FILE = 'data/processed/bace_expanded.csv'
OUTPUT_X = 'data/processed/X_expanded.npy'
OUTPUT_Y = 'data/processed/y_expanded.npy'

def featurize_dataset():
    if not os.path.exists(INPUT_FILE):
        print(f"❌ Error: {INPUT_FILE} not found. Run expand_data.py first.")
        return

    print(f"--- Featurizing Expanded BACE-1 Dataset ---")
    df = pd.read_csv(INPUT_FILE)
    
    smiles_list = df['canonical_smiles'].tolist()
    labels = df['label'].tolist()
    
    X = []
    y = []
    
    print(f"🧬 Generating 1024-bit Morgan Fingerprints for {len(smiles_list)} molecules...")
    
    for i, smiles in enumerate(tqdm(smiles_list)):
        fp = smiles_to_fingerprint(smiles)
        if fp is not None:
            X.append(fp)
            y.append(labels[i])
            
    X = np.array(X)
    y = np.array(y)
    
    # Save as numpy binaries for fast loading
    np.save(OUTPUT_X, X)
    np.save(OUTPUT_Y, y)
    
    print(f"✅ Featurization complete!")
    print(f"   X shape: {X.shape}")
    print(f"   y shape: {y.shape}")
    print(f"📁 Saved to {OUTPUT_X} and {OUTPUT_Y}")

if __name__ == "__main__":
    featurize_dataset()
