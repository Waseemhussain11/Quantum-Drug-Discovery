# 🧠 Alzheimer’s Disease Diagnosis and Drug Discovery Using Artificial Intelligence

An end-to-end, dual-module artificial intelligence platform designed for **Alzheimer’s Disease (AD) Brain MRI Staging** and **Classical Machine Learning-driven BACE-1 Drug Discovery**.

> [!WARNING]
> **ACADEMIC RESEARCH PROTOTYPE — NOT CLINICALLY VALIDATED**  
> This system is an academic research demonstration for computer-aided diagnosis and in-silico screening. It is **NOT** approved, regulated, or certified for clinical diagnostic use, treatment planning, or clinical decision support. Always consult certified neurologists and medical imaging specialists.

---

## 🏛️ System Architecture

The application is structured into **two fully independent backend microservices** and **one unified React frontend**:

```
+-------------------------------------------------------------------------+
|                  UNIFIED REACT / VITE FRONTEND (PORT 5173)              |
|              Interactive Dashboard, MRI Staging, Grad-CAM Visualizer     |
+------------------------------------+------------------------------------+
                                     |
           +-------------------------+-------------------------+
           |                                                   |
           v                                                   v
+--------------------------------------+   +--------------------------------------+
|     DRUG DISCOVERY MICROSERVICE      |   |        DIAGNOSIS MICROSERVICE        |
|             (Port 8000)              |   |             (Port 8001)              |
|  • Classical ML Ensemble             |   |  • Deep Separable-CNN (Keras 3)      |
|  • XGBoost (200 trees) + RF (200)    |   |  • 4-Class MRI Staging               |
|  • 1024-bit Morgan Fingerprints      |   |  • Grad-CAM Visual Explainability    |
|  • BACE-1 Alzheimer's Target         |   |  • Receptive Field Activation Maps   |
+--------------------------------------+   +--------------------------------------+
```

---

## 🔬 Core Capabilities

### 1. Alzheimer's Disease MRI Diagnosis (`diagnosis_service/`)
- **Model:** Deep Separable Convolutional Neural Network (`model.h5`, ~42.1 MB)
- **Input Dimensions:** `176 × 176 × 3` RGB
- **Classes (4-Class Multiclass):**
  1. `Non Demented` (Healthy Control)
  2. `Very Mild Demented` (Earliest subtle changes)
  3. `Mild Demented` (Mild impairment)
  4. `Moderate Demented` (Substantial cortical volume loss)
- **Explainability:** Authentic **Grad-CAM** generated dynamically on the final separable convolutional block (`separable_conv2d_17`) using `tf.GradientTape`.
- **Validation:** Upload size checks (max 5 MB), extension checks (`.jpg`, `.jpeg`, `.png`), and PIL corruption verification.

### 2. Classical AI Drug Discovery (`src/` & `app/`)
- **Target:** BACE-1 (Beta-secretase 1), a critical rate-limiting enzyme in amyloid-beta production.
- **Featurization:** 1024-bit Morgan circular fingerprints (radius = 2) via **RDKit**.
- **Model Pipeline:** High-performance classical ensemble:
  - **XGBoost Classifier:** 200 trees, 93.1% test accuracy, 0.9724 ROC-AUC.
  - **Random Forest Classifier:** 200 trees, 91.1% test accuracy, 0.9585 ROC-AUC.
  - **Weighted Consensus:** 55% XGBoost + 45% Random Forest (93.4% accuracy, 0.9654 ROC-AUC).
- **Features:** Real-time Lipinski Rule-of-Five compliance, molecular properties (MW, LogP, TPSA, HBD, HBA), canonical SMILES resolution.

---

## 📁 Repository Structure

```
Quantum-Drug-Discovery/
├── app/
│   ├── api.py                    # Classical Drug Discovery FastAPI (Port 8000)
│   └── streamlit_app.py          # Classical Streamlit Discovery Lab
├── diagnosis_service/
│   ├── app.py                    # MRI Diagnosis FastAPI Microservice (Port 8001)
│   ├── MODEL_FACTS.md            # Model specifications, dataset, and metrics
│   ├── requirements.txt          # TensorFlow, Pillow, FastAPI dependencies
│   ├── test_sync.py              # Unit & Logic tests for Diagnosis service
│   ├── LICENSE                   # MIT License (IBM07 reference attribution)
│   └── models/
│       └── model.h5              # Trained Keras CNN weights (42.1 MB)
├── data/
│   └── processed/                # Pre-featurized BACE1 arrays (1513 molecules)
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Unified navigation & view controller
│   │   ├── components/
│   │   │   ├── DiagnosisView.jsx # Alzheimer's MRI Staging & Grad-CAM UI
│   │   │   ├── ResultsTab.jsx    # Drug Screening consensus results
│   │   │   ├── QuantumTab.jsx    # Dual-tree ensemble architecture tab
│   │   │   ├── SimulationView.jsx# 4-stage featurization & bagging view
│   │   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── models/
│   ├── classical_model.pkl       # Trained XGBoost BACE1 classifier
│   └── rf_model.pkl              # Trained Random Forest BACE1 classifier
├── src/
│   ├── classical_model.py        # Model training routines
│   ├── data_loader.py            # Dataset loading and fallback management
│   ├── features.py               # Morgan fingerprinting routines
│   └── hybrid_model.py           # Classical ensemble consensus engine
├── requirements.txt              # Root classical Python dependencies
├── test_install.py               # Verification test for classical pipeline
├── TEST_REPORT.md                # Full test results & verification audit
└── README.md
```

---

## ⚡ Setup & Run Instructions (Windows PowerShell)

### Step 1: Clone & Setup Drug Discovery Backend (Port 8000)
```powershell
# Open terminal in project root
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Run installation verification
python test_install.py

# Launch Drug Discovery API on Port 8000
python -m uvicorn app.api:app --host 127.0.0.1 --port 8000 --reload
```

### Step 2: Setup Diagnosis Backend Microservice (Port 8001)
```powershell
# Open a second PowerShell terminal in project root
python -m venv .venv_diag
.\.venv_diag\Scripts\Activate.ps1
pip install --target "\\?\C:\Users\anwb7\OneDrive\projects\Quantum Drug discovery\Quantum-Drug-Discovery\.venv_diag\Lib\site-packages" -r diagnosis_service\requirements.txt

# Run diagnosis test suite
python diagnosis_service\test_sync.py

# Launch Diagnosis API on Port 8001
python -m uvicorn diagnosis_service.app:app --host 127.0.0.1 --port 8001 --reload
```

### Step 3: Launch React Frontend (Port 5173)
```powershell
# Open a third PowerShell terminal in frontend directory
cd frontend
npm install
npm run build
npm run dev
```

---

## 🌐 Endpoints & URLs

| Service | Protocol / Port | URL | Primary Function |
| :--- | :--- | :--- | :--- |
| **React Frontend** | HTTP / 5173 | `http://localhost:5173` | Unified Interactive Web Application |
| **Drug Discovery API** | HTTP / 8000 | `http://127.0.0.1:8000/docs` | BACE1 SMILES Screening & Benchmarking |
| **MRI Diagnosis API** | HTTP / 8001 | `http://127.0.0.1:8001/docs` | Multiclass MRI Staging & Grad-CAM Maps |

---

## 📜 Citations & Attributions

- **MRI Model Source:** [IBM07/Multiclass_Classification_Alzheimer_Disease](https://github.com/IBM07/Multiclass_Classification_Alzheimer_Disease) (MIT License, Copyright © 2025 Mohammed Ibrahim Aejaz).
- **Dataset:** Marco Pinamonti, *Alzheimer MRI 4 Classes Dataset*, Kaggle.
- **Drug Discovery:** MoleculeNet BACE benchmark dataset, RDKit Cheminformatics.
