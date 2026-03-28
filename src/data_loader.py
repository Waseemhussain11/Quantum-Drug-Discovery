import deepchem as dc
import numpy as np
import os
from sklearn.model_selection import train_test_split

def load_bace_data(use_expanded=True):
    """
    Loads BACE dataset. Prioritizes the expanded ChEMBL dataset if available.
    Otherwise falls back to MoleculeNet (1522 molecules).
    """
    expanded_x_path = 'data/processed/X_expanded.npy'
    expanded_y_path = 'data/processed/y_expanded.npy'

    if use_expanded and os.path.exists(expanded_x_path) and os.path.exists(expanded_y_path):
        print("=" * 50)
        print("Loading EXPANDED ChEMBL BACE Dataset...")
        print("=" * 50)
        
        X = np.load(expanded_x_path)
        y = np.load(expanded_y_path)
        
        # Scaffold-aware style split or simple stratified split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print(f"✅ Expanded dataset loaded from {expanded_x_path}")
    else:
        print("=" * 50)
        print("Loading standard MoleculeNet BACE Dataset...")
        print("=" * 50)

        tasks, datasets, transformers = dc.molnet.load_bace_classification(
            featurizer='ECFP',
            splitter='random'
        )

        train_dataset, valid_dataset, test_dataset = datasets
        X_train = train_dataset.X
        y_train = train_dataset.y.flatten()
        X_test = test_dataset.X
        y_test = test_dataset.y.flatten()
        
        print(f"✅ Standard dataset loaded!")

    print(f"\n📊 Summary:")
    print(f"   Training samples     : {X_train.shape[0]}")
    print(f"   Test samples         : {X_test.shape[0]}")
    print(f"   Features per molecule: {X_train.shape[1]}")
    print(f"\n🏷️  Labels in Training:")
    print(f"   ACTIVE   (1) : {int(y_train.sum())} molecules")
    print(f"   INACTIVE (0) : {int(len(y_train) - y_train.sum())} molecules")

    return X_train, X_test, y_train, y_test


if __name__ == "__main__":
    X_train, X_test, y_train, y_test = load_bace_data()
    print(f"\n✅ X_train shape : {X_train.shape}")
    print(f"✅ X_test shape  : {X_test.shape}")
    print(f"✅ y_train shape : {y_train.shape}")
    print(f"✅ y_test shape  : {y_test.shape}")
    print("\n🎉 data_loader.py working perfectly!")