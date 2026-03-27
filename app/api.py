import sys
import numpy as np
import io
import base64
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib

from rdkit import Chem
from rdkit.Chem import Draw, AllChem, Descriptors
from rdkit.Chem import rdMolDescriptors

sys.path.append("src")

app = FastAPI(title="Quantum Drug Discovery API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS = {}

# ===== Prediction Cache (Memoization) =====
# LRU-style in-memory cache keyed by canonical SMILES
MAX_CACHE_SIZE = 500
prediction_cache = {}  # {canonical_smiles: result_dict}
cache_stats = {"hits": 0, "misses": 0}

@app.on_event("startup")
def load_all_models():
    print("Loading models into memory...")
    try:
        MODELS["xgb"] = joblib.load("models/classical_model.pkl")
        MODELS["qsvm"] = joblib.load("models/quantum_svm.pkl")
        MODELS["pca"] = joblib.load("models/pca.pkl")
        MODELS["scaler"] = joblib.load("models/scaler.pkl")
        print("Models loaded successfully!")
    except Exception as e:
        print(f"Error loading models: {e}")

class PredictRequest(BaseModel):
    smiles: str

def get_molecule_properties(smiles):
    mol = Chem.MolFromSmiles(smiles)
    if not mol: return None
    
    mw = Descriptors.MolWt(mol)
    logp = Descriptors.MolLogP(mol)
    hbd = rdMolDescriptors.CalcNumHBD(mol)
    hba = rdMolDescriptors.CalcNumHBA(mol)
    tpsa = Descriptors.TPSA(mol)
    rb = rdMolDescriptors.CalcNumRotatableBonds(mol)
    
    lipinski_rules = {
        "Molecular Weight < 500 Da": {"value": mw, "passed": mw < 500, "formatted": f"{mw:.1f} Da"},
        "LogP < 5": {"value": logp, "passed": logp < 5, "formatted": f"{logp:.2f}"},
        "H-Bond Donors <= 5": {"value": hbd, "passed": hbd <= 5, "formatted": str(hbd)},
        "H-Bond Acceptors <= 10": {"value": hba, "passed": hba <= 10, "formatted": str(hba)},
        "TPSA < 140": {"value": tpsa, "passed": tpsa < 140, "formatted": f"{tpsa:.1f} A²"},
        "Rotatable Bonds <= 10": {"value": rb, "passed": rb <= 10, "formatted": str(rb)},
    }
    
    properties = {
        "Molecular Weight": round(mw, 2),
        "LogP (Lipophilicity)": round(logp, 2),
        "H-Bond Donors": hbd,
        "H-Bond Acceptors": hba,
        "Rotatable Bonds": rb,
        "Aromatic Rings": rdMolDescriptors.CalcNumAromaticRings(mol),
        "Heavy Atoms": mol.GetNumHeavyAtoms(),
        "Ring Count": rdMolDescriptors.CalcNumRings(mol),
    }
    
    return lipinski_rules, properties

@app.post("/api/predict")
def predict_smiles(req: PredictRequest):
    smiles = req.smiles
    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        raise HTTPException(status_code=400, detail="Invalid SMILES string")
    
    # Canonicalize SMILES for consistent cache keys
    canonical = Chem.MolToSmiles(mol)
    
    # Check cache first
    if canonical in prediction_cache:
        cache_stats["hits"] += 1
        cached_result = prediction_cache[canonical].copy()
        cached_result["cached"] = True
        print(f"Cache HIT for {canonical[:40]}... (hits: {cache_stats['hits']})")
        return cached_result
    
    cache_stats["misses"] += 1
    print(f"Cache MISS for {canonical[:40]}... Computing prediction...")
        
    fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius=2, nBits=1024)
    fp_np = np.array(fp)
    fp_2d = fp_np.reshape(1, -1)
    
    classical_prob = float(MODELS["xgb"].predict_proba(fp_2d)[0][1])
    
    fp_pca = MODELS["pca"].transform(fp_2d)
    fp_scaled = MODELS["scaler"].transform(fp_pca)
    
    quantum_prob = float(MODELS["qsvm"].predict_proba(fp_scaled)[0][1])
    
    hybrid_prob = (0.6 * classical_prob) + (0.4 * quantum_prob)
    prediction = "ACTIVE" if hybrid_prob >= 0.5 else "INACTIVE"
    confidence = hybrid_prob if prediction == "ACTIVE" else 1 - hybrid_prob
    
    importances = MODELS["xgb"].feature_importances_
    top_idx = np.argsort(importances)[::-1][:20]
    top_imp = importances[top_idx].tolist()
    mol_bits = fp_np[top_idx].tolist()
    feature_importance = [{"bit": int(idx), "importance": float(imp), "active": int(bit)} for idx, imp, bit in zip(top_idx, top_imp, mol_bits)]
    
    lipinski, props = get_molecule_properties(smiles)
    
    result = {
        "prediction": prediction,
        "confidence": float(confidence),
        "classical_prob": classical_prob,
        "quantum_prob": quantum_prob,
        "hybrid_prob": hybrid_prob,
        "pca_features": fp_pca[0].tolist(),
        "quantum_angles": fp_scaled[0].tolist(),
        "fingerprint": fp_np.tolist(),
        "feature_importance": feature_importance,
        "lipinski": lipinski,
        "properties": props
    }
    
    # Store in cache (evict oldest if full)
    if len(prediction_cache) >= MAX_CACHE_SIZE:
        oldest_key = next(iter(prediction_cache))
        del prediction_cache[oldest_key]
    prediction_cache[canonical] = result
    print(f"Cached result for {canonical[:40]}... (cache size: {len(prediction_cache)})")
    
    return {**result, "cached": False}

@app.get("/api/benchmark")
def get_benchmarks():
    return {
        "models": ["Classical XGBoost", "Quantum SVM", "Hybrid"],
        "accuracy": [82.2, 74.0, 84.0],
        "roc_auc": [0.9225, 0.8487, 0.9400]
    }

@app.get("/api/image/{smiles:path}")
def get_molecule_image(smiles: str):
    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        raise HTTPException(status_code=400, detail="Invalid SMILES")
    
    img = Draw.MolToImage(mol, size=(400, 300))
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return Response(content=buffer.getvalue(), media_type="image/png")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
