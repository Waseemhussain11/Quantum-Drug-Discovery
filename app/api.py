import sys
import numpy as np
import io
import base64
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib

from rdkit import Chem
from rdkit.Chem import Draw, AllChem, Descriptors
from rdkit.Chem import rdMolDescriptors

sys.path.append("src")

from dotenv import load_dotenv
load_dotenv() # Load Groq API Key from .env file

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
        try:
            MODELS["top_256_idx"] = np.load("models/top_256_idx.npy")
            print("✅ 256-Feature Filter Mask loaded successfully!")
        except Exception as e:
            MODELS["top_256_idx"] = None
            print("⚠️ 256-Feature Filter Mask not found. Falling back to 1024-bit direct.")
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
    
    # Prune from 1024 down to Top 256 before compressing
    if "top_256_idx" in MODELS and MODELS["top_256_idx"] is not None:
        fp_qsvm_input = fp_2d[:, MODELS["top_256_idx"]]
    else:
        fp_qsvm_input = fp_2d
        
    fp_pca = MODELS["pca"].transform(fp_qsvm_input)
    fp_scaled = MODELS["scaler"].transform(fp_pca)
    
    quantum_prob = float(MODELS["qsvm"].predict_proba(fp_scaled)[0][1])
    
    # --- Dynamic Smart Hybrid Engine ---
    # Calculate Classical Uncertainty (0 = perfectly uncertain, 1 = perfectly certain)
    c_uncertainty = abs(classical_prob - 0.5) * 2
    
    # If classical is very certain, it keeps up to 90% vote.
    # If classical is very uncertain, quantum gets up to 80% vote.
    classical_weight = max(0.2, min(0.9, c_uncertainty + 0.1))
    quantum_weight = 1.0 - classical_weight

    hybrid_prob = (classical_weight * classical_prob) + (quantum_weight * quantum_prob)
    prediction = "ACTIVE" if hybrid_prob >= 0.5 else "INACTIVE"
    confidence = hybrid_prob if prediction == "ACTIVE" else 1 - hybrid_prob
    
    # Calculate Consensus Strength & Quantum Influence
    # Strength: 1.0 if both models agree strongly, 0.0 if they disagree completely
    agreement = 1.0 - abs(classical_prob - quantum_prob)
    consensus_strength = float(agreement)
    
    # Quantum Influence: How much the quantum model changed the classical outcome
    quantum_influence = float(hybrid_prob - classical_prob)
    
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
        "consensus_strength": consensus_strength,
        "quantum_influence": quantum_influence,
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


# Molecule Resolver (ChEMBL Database + AI Fallback)
@app.post("/api/resolve")
async def resolve_molecule(request: Request):
    data = await request.json()
    name = data.get("name", "")
    
    if not name or len(name) < 2:
        return {"smiles": None}
    
    try:
        # Step 1: Try exact database lookup via ChEMBL (100% Truth API)
        try:
            from chembl_webresource_client.new_client import new_client
            molecule = new_client.molecule
            res = molecule.filter(pref_name__iexact=name)
            if not res:
                res = molecule.search(name)
            
            if res and len(res) > 0:
                smiles = res[0].get('molecule_structures', {}).get('canonical_smiles')
                if smiles:
                    print(f"✅ Found {name} in ChEMBL Database: {smiles}")
                    return {"smiles": smiles}
        except Exception as e:
            print(f"ChEMBL lookup failed, falling back to LLM: {e}")

        # Step 2: AI Fallback via Groq if not found in database
        import os, requests
        api_key = os.getenv("GROQ_API_KEY")
        
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "messages": [
                    {
                        "role": "system", 
                        "content": "You are a chemical informatics expert. Given a molecule name, return ONLY its canonical SMILES string. Do not include any other text. If unknown, return 'None'."
                    },
                    {"role": "user", "content": name}
                ],
                "model": "llama-3.3-70b-versatile",
                "temperature": 0
            },
            timeout=5
        )
        
        if response.status_code == 200:
            smiles = response.json()["choices"][0]["message"]["content"].strip()
            if smiles.lower() == "none" or len(smiles) < 2:
                return {"smiles": None}
            print(f"⚠️ Resolved {name} via AI LLM: {smiles}")
            return {"smiles": smiles}
            
        return {"smiles": None, "error": f"Groq API Error: {response.status_code}"}

    except Exception as e:
        return {"smiles": None, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

