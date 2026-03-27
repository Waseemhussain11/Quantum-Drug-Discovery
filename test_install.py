print("Testing installations...")

try:
    import deepchem
    print(f"✅ DeepChem     : {deepchem.__version__}")
except:
    print("❌ DeepChem FAILED")

try:
    from rdkit import Chem
    print("✅ RDKit        : OK")
except:
    print("❌ RDKit FAILED")

try:
    import qiskit
    print(f"✅ Qiskit       : {qiskit.__version__}")
except:
    print("❌ Qiskit FAILED")

try:
    from qiskit_machine_learning.kernels import FidelityQuantumKernel
    print("✅ Qiskit ML    : OK")
except:
    print("❌ Qiskit ML FAILED")

try:
    import xgboost
    print(f"✅ XGBoost      : {xgboost.__version__}")
except:
    print("❌ XGBoost FAILED")

try:
    import streamlit
    print(f"✅ Streamlit    : {streamlit.__version__}")
except:
    print("❌ Streamlit FAILED")

try:
    import sklearn
    print(f"✅ Scikit-learn : {sklearn.__version__}")
except:
    print("❌ Scikit-learn FAILED")