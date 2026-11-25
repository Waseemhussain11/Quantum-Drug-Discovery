# Model Facts: Alzheimer’s Disease MRI Multiclass Classifier

## 1. Overview & Attribution
- **Task:** Multiclass brain MRI classification into four stages of Alzheimer’s disease progression.
- **Reference Repository:** [IBM07/Multiclass_Classification_Alzheimer_Disease](https://github.com/IBM07/Multiclass_Classification_Alzheimer_Disease)
- **Author/Attribution:** Mohammed Ibrahim Aejaz (2025)
- **License:** MIT License (preserved in `diagnosis_service/LICENSE`)
- **Integration Framework:** Independent FastAPI Microservice (`diagnosis_service`) on port `8001`.

---

## 2. Model Architecture
- **Model Type:** Deep Convolutional Neural Network with Separable Convolutions (`tf.keras.models.Sequential`)
- **Weights File:** `diagnosis_service/models/model.h5` (~42.1 MB)
- **Input Dimensions:** `(176, 176, 3)` — 176×176 pixels, 3 color channels (RGB)
- **Architecture Pipeline:**
  1. `Conv2D(16, (3, 3), activation='relu')` + `MaxPooling2D()`
  2. `Conv2D(32, (2, 2), activation='relu')` + `MaxPooling2D()`
  3. `SeparableConv2D(64, 3, activation='relu', padding='same')`
  4. `SeparableConv2D(64, 3, activation='relu', padding='same')` + `BatchNormalization()` + `MaxPool2D()`
  5. `SeparableConv2D(128, 3, activation='relu', padding='same')`
  6. `SeparableConv2D(128, 3, activation='relu', padding='same')` + `BatchNormalization()` + `MaxPool2D()` + `Dropout(0.2)`
  7. `SeparableConv2D(256, 3, activation='relu', padding='same')`
  8. `SeparableConv2D(256, 3, activation='relu', padding='same')` + `BatchNormalization()` + `MaxPool2D()` + `Dropout(0.2)`
  9. `Flatten()`
  10. `Dense(512, activation='relu')` + `BatchNormalization()` + `Dropout(0.2)`
  11. `Dense(128, activation='relu')` + `BatchNormalization()` + `Dropout(0.2)`
  12. `Dense(64, activation='relu')` + `BatchNormalization()` + `Dropout(0.2)`
  13. `Dense(4, activation='softmax')` (Output)

---

## 3. Input Preprocessing & Class Order

### Exact Preprocessing Steps:
1. Format validation: JPG, JPEG, PNG only (Max file size: 5 MB).
2. PIL Image conversion: `image.convert('RGB')`
3. Resize: `(176, 176)` using bilinear interpolation.
4. Normalization: Pixel intensities rescaled from `[0, 255]` to `[0.0, 1.0]` via division by `255.0`.
5. Batch dimension expansion: shape transformed to `(1, 176, 176, 3)`.

### Verified Class Mapping:
Following TensorFlow's directory-inferred alphanumeric ordering and confirmed by reference implementation `app2.py`:
- **Index 0:** `Mild Demented`
- **Index 1:** `Moderate Demented`
- **Index 2:** `Non Demented`
- **Index 3:** `Very Mild Demented`

---

## 4. Dataset Provenance & Reported Metrics
- **Dataset:** Kaggle Alzheimer's MRI 4 Classes Dataset (`marcopinamonti/alzheimer-mri-4-classes-dataset`).
- **Original Class Distribution (pre-oversampling):**
  - NonDemented: 3,200 images
  - VeryMildDemented: 2,240 images
  - MildDemented: 896 images
  - ModerateDemented: 64 images
- **Class Balancing:** SMOTE (Synthetic Minority Over-sampling Technique) applied in notebook to generate 12,800 balanced images (3,200 per class).
- **Reported Metrics (Notebook `alzheimer_final.ipynb`):**
  - Best Training Accuracy: **98.39%**
  - Best Validation Accuracy: **97.61%**
  - Held-out Test Accuracy: **91.41%** (AUC: **0.9859**, Loss: 0.278)

---

## 5. Known Limitations & Methodological Cautions
> [!WARNING]
> **Academic Prototype Only — Not for Clinical Diagnostic Use**
> 1. **Slice-Level vs. Patient-Level Splitting:** The Kaggle dataset contains 2D axial MRI slices without patient identifiers. Random train/test splits at the slice level can lead to data leakage (slices from the same subject appearing in both training and test sets).
> 2. **Synthetic Sampling (SMOTE):** SMOTE was applied in pixel space across flattened images to balance classes, which may introduce synthetic artifacts not representative of actual clinical anatomy.
> 3. **Probability Calibration:** The softmax outputs reflect uncalibrated model decision scores for research evaluation, not clinically calibrated risk probabilities.
> 4. **Demographic & Scanner Generalization:** Dataset lacks metadata regarding scanner field strength (1.5T vs 3.0T), acquisition protocols (T1w vs T2w/FLAIR), patient demographics, or cohort provenance (e.g. ADNI, OASIS, AIBL).

---

## 6. Interpretability (Grad-CAM)
- **Target Layer:** Final separable convolutional block (`SeparableConv2D` layer before `Flatten`).
- **Gradient Verification:** Gradients are computed via `tf.GradientTape` relative to the predicted class score. If gradients are zero or undefined, Grad-CAM is marked unavailable; artificial or random heatmaps are strictly forbidden.
- **Interpretation Notice:** Grad-CAM heatmaps illustrate model feature activation intensity, **not** confirmed radiological pathology or anatomical lesions.
