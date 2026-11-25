"""
Classical AI Drug Discovery Installation & Verification Test
Verifies all dependencies, classical ML models (XGBoost, Random Forest),
RDKit molecular processing, and the ensemble screening pipeline.
"""
import sys
import os

def test_imports():
    print("Testing core imports...")
    try:
        import numpy as np
        print(f"  [OK] numpy: {np.__version__}")
    except ImportError as e:
        print(f"  [FAIL] numpy: {e}")

    try:
        import sklearn
        print(f"  [OK] scikit-learn: {sklearn.__version__}")
    except ImportError as e:
        print(f"  [FAIL] scikit-learn: {e}")

    try:
        import xgboost as xgb
        print(f"  [OK] xgboost: {xgb.__version__}")
    except ImportError as e:
        print(f"  [FAIL] xgboost: {e}")

    try:
        import rdkit
        from rdkit import Chem
        from rdkit.Chem import AllChem
        print(f"  [OK] rdkit: {rdkit.__version__}")
    except ImportError as e:
        print(f"  [FAIL] rdkit: {e}")

    try:
        import fastapi
        print(f"  [OK] fastapi: {fastapi.__version__}")
    except ImportError as e:
        print(f"  [FAIL] fastapi: {e}")

    try:
        import joblib
        print(f"  [OK] joblib: {joblib.__version__}")
    except ImportError as e:
        print(f"  [FAIL] joblib: {e}")

def test_classical_pipeline():
    print("\nTesting Classical AI Pipeline...")
    import joblib
    from src.features import smiles_to_fingerprint
    from src.hybrid_model import classical_ensemble_predict

    aspirin_smiles = "CC(=O)Oc1ccccc1C(=O)O"
    fp = smiles_to_fingerprint(aspirin_smiles, n_bits=1024)
    if fp is not None:
        print(f"  [OK] Morgan Fingerprint extraction: shape {fp.shape}")
    else:
        print("  [FAIL] Morgan Fingerprint extraction failed")
        return

    features = fp.reshape(1, -1)

    # Test models
    xgb_model = joblib.load("models/classical_model.pkl")
    p_xgb = float(xgb_model.predict_proba(features)[0, 1])
    print(f"  [OK] XGBoost Model loaded - Aspirin BACE-1 score: {p_xgb:.4f}")

    rf_model = joblib.load("models/rf_model.pkl")
    p_rf = float(rf_model.predict_proba(features)[0, 1])
    print(f"  [OK] Random Forest Model loaded - Aspirin BACE-1 score: {p_rf:.4f}")

    result = classical_ensemble_predict(xgb_model, rf_model, features)
    print(f"  [OK] Classical Ensemble Prediction: ensemble_prob={float(result['ensemble_prob'][0]):.4f}, consensus_strength={float(result['consensus_strength']):.4f}")
    print("\nAll classical drug discovery tests PASSED!")

if __name__ == "__main__":
    test_imports()
    test_classical_pipeline()
