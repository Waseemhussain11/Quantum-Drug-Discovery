import numpy as np
from rdkit import Chem
from rdkit.Chem import Draw, AllChem
from sklearn.decomposition import PCA
from sklearn.preprocessing import MinMaxScaler
import matplotlib.pyplot as plt


def smiles_to_fingerprint(smiles, n_bits=1024):
    

    # Convert SMILES text into a molecule object
    mol = Chem.MolFromSmiles(smiles)

    # If SMILES is invalid return None
    if mol is None:
        print(f"❌ Invalid SMILES: {smiles}")
        return None

    # Convert molecule to Morgan Fingerprint
    # radius=2 means look 2 bonds away from each atom
    # nBits=1024 means 1024 output numbers
    fingerprint = AllChem.GetMorganFingerprintAsBitVect(
        mol,
        radius=2,
        nBits=n_bits
    )

    return np.array(fingerprint)


def smiles_to_image(smiles, size=(300, 300)):
   

    mol = Chem.MolFromSmiles(smiles)

    if mol is None:
        print(f"❌ Invalid SMILES: {smiles}")
        return None

    # Draw 2D structure
    img = Draw.MolToImage(mol, size=size)
    return img


def reduce_features_pca(X_train, X_test, n_components=8):
    

    print(f"\nApplying PCA: 1024 → {n_components} features...")

    # Fit PCA on training data only
    pca = PCA(n_components=n_components, random_state=42)
    X_train_reduced = pca.fit_transform(X_train)

    # Apply same transformation to test data
    X_test_reduced = pca.transform(X_test)

    # How much information is kept
    variance_kept = pca.explained_variance_ratio_.sum() * 100
    print(f"✅ PCA complete!")
    print(f"   Original features : 1024")
    print(f"   Reduced features  : {n_components}")
    print(f"   Information kept  : {variance_kept:.1f}%")

    return X_train_reduced, X_test_reduced, pca


def scale_for_quantum(X_train_reduced, X_test_reduced):
   

    print(f"\nScaling features for quantum circuit...")

    scaler = MinMaxScaler(feature_range=(0, np.pi))
    X_train_scaled = scaler.fit_transform(X_train_reduced)
    X_test_scaled  = scaler.transform(X_test_reduced)

    print(f"✅ Scaling complete!")
    print(f"   Min value : {X_train_scaled.min():.4f}")
    print(f"   Max value : {X_train_scaled.max():.4f}")

    return X_train_scaled, X_test_scaled, scaler


if __name__ == "__main__":

    print("=" * 50)
    print("Testing features.py")
    print("=" * 50)

    # Test 1: SMILES to Fingerprint
    print("\n📌 Test 1: SMILES → Fingerprint")
    smiles = "CC(=O)Oc1ccccc1C(=O)O"  # Aspirin
    fp = smiles_to_fingerprint(smiles)
    print(f"   SMILES    : {smiles}")
    print(f"   FP shape  : {fp.shape}")
    print(f"   FP sample : {fp[:10]}...")

    # Test 2: SMILES to Image
    print("\n📌 Test 2: SMILES → Image")
    img = smiles_to_image(smiles)
    if img:
        img.save("report/aspirin.png")
        print(f"   ✅ Image saved to report/aspirin.png")

    # Test 3: PCA Reduction
    print("\n📌 Test 3: PCA Reduction")
    from data_loader import load_bace_data
    X_train, X_test, y_train, y_test = load_bace_data()
    X_train_r, X_test_r, pca = reduce_features_pca(X_train, X_test)

    # Test 4: Quantum Scaling
    print("\n📌 Test 4: Quantum Scaling")
    X_train_s, X_test_s, scaler = scale_for_quantum(X_train_r, X_test_r)

    print("\n🎉 features.py working perfectly!")