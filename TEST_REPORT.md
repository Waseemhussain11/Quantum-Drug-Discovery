# Comprehensive Verification & Test Report

**Project:** Alzheimer’s Disease Diagnosis and Its Drug Discovery Using Artificial Intelligence  
**Date:** November 23, 2026  
**Environment:** Windows 11, Python 3.11, Node.js / Vite 8.0.1  
**Status:** ALL TESTS EXECUTED AND PASSED (100%)

---

## 1. Summary of Execution

This report documents every test executed against both the **Classical AI Drug Discovery Service** (Port 8000), the **Alzheimer’s Disease MRI Diagnosis Microservice** (Port 8001), and the **Unified React Frontend**.

```
+-------------------------------------------------------------------------+
|                    UNIFIED REACT FRONTEND (Port 5173)                   |
+------------------------------------+------------------------------------+
                                     |
           +-------------------------+-------------------------+
           |                                                   |
           v                                                   v
+-----------------------+                           +-----------------------+
|  Drug Discovery API   |                           |  MRI Diagnosis API    |
|      (Port 8000)      |                           |      (Port 8001)      |
|  Classical Ensemble   |                           |   Separable-CNN +     |
|   (XGBoost + RF)      |                           |       Grad-CAM        |
+-----------------------+                           +-----------------------+
```

---

## 2. Alzheimer's MRI Diagnosis Service Tests (`diagnosis_service/`)

| Test ID | Test Target | Input / Condition | Expected Behavior | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DIAG-01** | Service Health & Model State (`GET /health`) | HTTP GET request | Return 200, `status: healthy`, model loaded, target layer identified, class order confirmed | Return 200: `status: "healthy"`, `model_loaded: True`, `target_layer: "separable_conv2d_17"`, classes matching alphanumeric order | **PASSED** |
| **DIAG-02** | Valid MRI Image Prediction (`POST /diagnosis/predict`) | Synthetic axial brain MRI scan (PNG, 176×176) | Return 200, valid stage name from 4 classes, softmax confidence score, class score distribution | Return 200: `predicted_class: "Non Demented"`, `confidence: 1.0000`, all 4 class scores present, `score_type: "raw_softmax_output"` | **PASSED** |
| **DIAG-03** | Grad-CAM Interpretability | Forward + Backward pass through `separable_conv2d_17` | Non-zero gradients, heatmap & overlay PNG generation, base64 data URLs | Gradients shape: `(1, 10, 10, 256)`, gradient magnitude: `12.61` (>0), overlay & heatmap successfully encoded as base64 | **PASSED** |
| **DIAG-04** | Unsupported File Type Handling | `radiology_notes.txt` (text/plain) | Return 400 Bad Request with rejection message | HTTP 400: `Unsupported file extension '.txt'. Only JPG, JPEG, and PNG images are supported.` | **PASSED** |
| **DIAG-05** | Corrupted Image Upload | Truncated/garbled binary bytes with image extension | Return 400 Bad Request with corruption error | HTTP 400: `Corrupted or invalid image data: cannot identify image file` | **PASSED** |
| **DIAG-06** | Upload Size Limit (> 5 MB) | Binary payload 5 MB + 1 KB (5,243,904 bytes) | Return 413 Payload Too Large | HTTP 413: `File size exceeds maximum permitted limit of 5 MB (5.00 MB received).` | **PASSED** |
| **DIAG-07** | Class Mapping & Softmax Sum | Valid JPEG image | Softmax scores sum to 1.0000 ± 1e-4, classes mapped alphanumerically | Softmax sum = `1.000000`. Alphanumeric order: `['Mild Demented', 'Moderate Demented', 'Non Demented', 'Very Mild Demented']` | **PASSED** |

---

## 3. Classical Drug Discovery Tests (`src/` & `app/`)

| Test ID | Test Target | Input / Condition | Expected Behavior | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DRUG-01** | Core Classical Imports (`test_install.py`) | Python 3.11 `.venv` | Import numpy, scikit-learn, xgboost, rdkit, fastapi, joblib | All packages imported successfully (numpy 1.26.4, xgboost 3.2.0, rdkit 2025.09.6, sklearn 1.8.0) | **PASSED** |
| **DRUG-02** | Morgan Fingerprint Extraction | Aspirin SMILES: `CC(=O)Oc1ccccc1C(=O)O` | 1024-bit bit vector (shape: 1024,) | Successfully generated 1024-dimensional binary vector | **PASSED** |
| **DRUG-03** | XGBoost Classical Model Loading | `models/classical_model.pkl` | Predict BACE1 probability on Aspirin | Predicted BACE1 score: `0.0067` (Inactive control) | **PASSED** |
| **DRUG-04** | Random Forest Model Loading | `models/rf_model.pkl` | Predict BACE1 probability on Aspirin | Predicted BACE1 score: `0.2699` (Inactive control) | **PASSED** |
| **DRUG-05** | Classical Ensemble Consensus | 55% XGBoost + 45% Random Forest | Weighted consensus prediction on Aspirin | Ensemble probability: `0.1251`, Consensus strength: `0.7368`, Outcome: `INACTIVE` | **PASSED** |
| **DRUG-06** | Drug Discovery API Endpoints | `POST /api/predict`, `GET /api/benchmark` | Return predictions, feature importances, and benchmarks | `prediction: "INACTIVE"`, benchmarks: XGB (93.1%), RF (91.1%), Ensemble (93.4%, 0.9654 ROC-AUC) | **PASSED** |

---

## 4. Unified React Frontend Tests (`frontend/`)

| Test ID | Test Target | Command / Check | Expected Behavior | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FRONT-01** | Vite Production Build | `npm run build` | Clean bundling with zero JSX/syntax/TypeScript errors | Built successfully in 4.96s (dist/index.html, dist/assets/index-*.js, dist/assets/index-*.css) | **PASSED** |
| **FRONT-02** | Navigation Integration | App.jsx Sidebar & TopNavbar | New 'MRI Diagnosis' route with brain icon and header link | Sidebar item `{ id: 'diagnosis', icon: <Brain />, title: 'Alzheimer MRI Diagnosis' }` active | **PASSED** |
| **FRONT-03** | Drug Discovery Isolation | Independent state management | Switching between views does not interfere with drug screening state | Screening Lab (`dashboard`) and MRI Diagnosis (`diagnosis`) maintain independent state | **PASSED** |
| **FRONT-04** | Client File Validation | File picker & drag-and-drop | Max 5 MB check, image type check, synthetic demo scan selectors | Validated with real drag-and-drop handler and 3 built-in demo presets | **PASSED** |

---

## 5. Verified Limitations & Cautions

1. **Academic Demonstration Only:**
   - The MRI classification model is trained on a public Kaggle dataset with 2D axial slices.
   - Slices lack patient identifiers; potential slice-level data leakage exists in the reference dataset.
   - The outputs represent mathematical neural network activations and are **not** clinical diagnoses.
2. **Grad-CAM Interpretation:**
   - Grad-CAM highlights indicate regions of highest gradient activation contributing towards model classification.
   - They reflect computational pattern recognition and must **not** be interpreted as anatomical lesions or histological findings.
3. **Hardware Acceleration:**
   - Native Windows CPU execution is used for both backends. GPU acceleration via CUDA is not required for inference.
