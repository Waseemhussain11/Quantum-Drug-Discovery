# 🔬 Quantum Precision: Hybrid Drug Discovery

A state-of-the-art drug discovery platform that leverages **Hybrid Quantum-Classical Machine Learning** to predict the inhibition of BACE-1 (Beta-secretase 1), a critical enzyme implicated in Alzheimer's disease.

## 🌌 Core Principles & Ideas

### 1. The Subatomic Observer
The project follows a unique design philosophy called **"The Subatomic Observer."** It treats the user interface as a high-precision optical instrument—layered with depth, utilizing glassmorphism, and pulsating with the energy of molecular simulation. This ensures that complex quantum data feels tangible and intuitive.

### 2. Hybrid Quantum-Classical Synergy
We combine the best of both worlds:
*   **Classical XGBoost**: Provides a high-performance baseline using 1024-bit Morgan Fingerprints, excels at processing large datasets.
*   **Quantum SVM**: Utilizes a `ZZFeatureMap` to map data into higher-dimensional quantum feature spaces for a subset of molecules, potentially capturing patterns invisible to classical kernels.
*   **Weighted Consensus**: The final prediction is a 60/40 weighted fusion of classical and quantum probabilities, maximizing ROC-AUC performance.

---

## 🛠️ Tech Stack & Purpose

*   **Qiskit**: Powers the quantum circuit simulations and provides the `FidelityQuantumKernel` for the SVM.
*   **XGBoost**: Handles the high-speed classical gradient boosting used for both baseline and hybrid predictions.
*   **DeepChem & RDKit**: Essential for chemical informatics—used for featurization (ECFP), SMILES canonicalization, and Lipinski rule validation.
*   **FastAPI**: A high-performance Python backend providing RESTful endpoints for real-time model inference and molecular property lookups.
*   **Streamlit**: An interactive scientific dashboard for quick data exploration and model benchmarking.
*   **React & Vite**: A modern frontend architecture designed for speed and a premium user experience.
*   **Framer Motion**: Enables smooth micro-animations and "Subatomic" transitions across the UI.
*   **Plotly.js**: Renders interactive 3D visualizations of molecular feature spaces and importance metrics.
*   **Scikit-learn**: Handles data preprocessing, PCA for quantum dimensionality reduction, and model evaluation metrics.

---

## 📁 Project Structure


quantum-drug-discovery/
├── app/                    # Backend API & Streamlit Dashboard
│   ├── api.py              # FastAPI Backend
│   └── streamlit_app.py    # Scientific Dashboard
├── frontend/               # React / Vite Premium UI
├── models/                 # Pre-trained ML & Quantum models (.pkl)
├── src/                    # Core Logic & Algorithms
│   ├── classical_model.py  # XGBoost/RF Training
│   ├── quantum_model.py    # Quantum SVM Training
│   ├── hybrid_model.py     # Hybrid Prediction Engine
│   ├── data_loader.py      # BACE Dataset Management
│   └── features.py         # Molecule Featurization
└── requirements.txt        # Python Dependencies
```

---

## 🚀 Getting Started

### 1. Prerequisites
*   Python 3.10+
*   Node.js 18+
*   [RDKit](https://rdkit.org/docs/Install.html) (Included in requirements)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-repo/quantum-drug-discovery.git
cd quantum-drug-discovery

# Set up Python Environment
pip install -r requirements.txt

# Set up Frontend
cd frontend
npm install
```

---

## 🏋️ Training the Models

Models are trained on the **BACE MoleculeNet** dataset (1522 compounds).

1.  **Train Classical Model**:
    ```bash
    python src/classical_model.py
    ```
    *Builds XGBoost and Random Forest baselines.*

2.  **Train Quantum Model**:
    ```bash
    python src/quantum_model.py
    ```
    *Performs PCA & trains a Quantum SVM (Approx. 5-10 mins).*

3.  **Benchmark Hybrid Model**:
    ```bash
    python src/hybrid_model.py
    ```
    *Verifies the performance of the integrated hybrid engine.*

---

## 🏃 Running the Application

### Backend API (Port 8000)
```bash
python app/api.py
```

### Streamlit Dashboard
```bash
streamlit run app/streamlit_app.py
```

### Premium UI Frontend
```bash
cd frontend
npm run dev
```
Navigate to `http://localhost:5173` to experience the Subatomic Observer.

---

## 🧪 Verification Plan
The platform has been validated against the BACE-1 benchmark, achieving:
*   **Classical Accuracy**: ~82.2%
*   **Quantum Accuracy**: ~74.0%
*   **Hybrid Accuracy**: **~84.0%** (2%+ improvement over purely classical)
