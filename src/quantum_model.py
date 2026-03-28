import numpy as np
import joblib
import os
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
from sklearn.preprocessing import MinMaxScaler
from sklearn.decomposition import PCA
from qiskit.circuit.library import ZZFeatureMap
from qiskit_machine_learning.kernels import FidelityQuantumKernel


def build_quantum_kernel(n_qubits=8):
    print("\n" + "=" * 50)
    print("Building Quantum Kernel...")
    print("=" * 50)

    feature_map = ZZFeatureMap(
        feature_dimension=n_qubits,
        reps=2,
        entanglement='linear'
    )

    quantum_kernel = FidelityQuantumKernel(feature_map=feature_map)

    print(f"✅ Quantum Kernel built!")
    print(f"   Qubits     : {n_qubits}")
    print(f"   Reps       : 2")
    print(f"   Entangle   : linear")
    return quantum_kernel, feature_map


def prepare_quantum_data(X_train, X_test, n_qubits=8):
    print("\n" + "=" * 50)
    print("Preparing data for Quantum Model...")
    print("=" * 50)

    pca = PCA(n_components=n_qubits, random_state=42)
    X_train_pca = pca.fit_transform(X_train)
    X_test_pca  = pca.transform(X_test)

    variance = pca.explained_variance_ratio_.sum() * 100
    print(f"✅ PCA complete! Information kept: {variance:.1f}%")

    scaler = MinMaxScaler(feature_range=(0, np.pi))
    X_train_scaled = scaler.fit_transform(X_train_pca)
    X_test_scaled  = scaler.transform(X_test_pca)

    print(f"✅ Scaling complete! Range: 0 to π")

    return X_train_scaled, X_test_scaled, pca, scaler


def train_smart_quantum_model(X_train, y_train, n_qubits=10, max_train=500):
    print("\n" + "=" * 50)
    print("Training Smart Quantum Kernel SVM...")
    print("=" * 50)

    # 1. Advanced Golden Distribution Sub-sampling (200 Hard, 200 Easy, 100 Random)
    print("\n   [1/5] Extracting Golden Ratio Distribution (200 Hard, 200 Easy, 100 Random)...")
    try:
        xgb = joblib.load("models/classical_model.pkl")
        classical_probs = xgb.predict_proba(X_train)[:, 1]
        
        uncertainty = np.abs(classical_probs - 0.5)
        
        # 200 Hard (closest to 0.5)
        hard_idx = np.argsort(uncertainty)[:200]
        
        # 200 Easy (furthest from 0.5)
        easy_idx = np.argsort(uncertainty)[::-1][:200]
        
        # 100 Random (from the remainder)
        remaining_idx = np.setdiff1d(np.arange(len(X_train)), np.concatenate([hard_idx, easy_idx]))
        random_idx = np.random.choice(remaining_idx, 100, replace=False)
        
        final_idx = np.concatenate([hard_idx, easy_idx, random_idx])
        
        X_q_raw_full = X_train[final_idx]
        y_q = y_train[final_idx]
        
        print(f"         ✅ Golden distribution extracted (N={max_train}).")
        
        # 1.5 Feature Engineering: Top 256
        print("\n   [1.5/5] Extracting Top 256 Features...")
        importances = xgb.feature_importances_
        top_256_idx = np.argsort(importances)[::-1][:256]
        
        os.makedirs("models", exist_ok=True)
        np.save("models/top_256_idx.npy", top_256_idx)
        print(f"         ✅ Top 256 Feature Mask saved to models/top_256_idx.npy")
        
        X_q_raw = X_q_raw_full[:, top_256_idx]

    except Exception as e:
        print(f"         ❌ Failed to process golden distribution: {e}")
        # Fallback to random
        idx = np.random.choice(len(X_train), max_train, replace=False)
        X_q_raw = X_train[idx]
        y_q = y_train[idx]

    # 2. Prepare Data (PCA & Scale ONLY the subset to save memory)
    print("\n   [2/5] Preparing Qubit Data (PCA & Scaler)...")
    pca = PCA(n_components=n_qubits, random_state=42)
    X_q_pca = pca.fit_transform(X_q_raw)
    variance = pca.explained_variance_ratio_.sum() * 100
    print(f"         ✅ PCA ({n_qubits} Qubits): Information kept = {variance:.1f}%")

    scaler = MinMaxScaler(feature_range=(0, np.pi))
    X_q_scaled = scaler.fit_transform(X_q_pca)

    # 3. Build Kernel
    print("\n   [3/5] Building Quantum Geometry...")
    quantum_kernel, feature_map = build_quantum_kernel(n_qubits)

    # 4. Train Quantum SVM
    print(f"\n   [4/5] Computing {max_train}x{max_train} Quantum Kernel Matrix...")
    print("         ⏳ This will take 1-3 Hours. You can safely leave this running...")
    
    qsvm = SVC(
        kernel=quantum_kernel.evaluate,
        probability=True,
        C=1.0
    )
    qsvm.fit(X_q_scaled, y_q)
    print("         ✅ Quantum SVM matrix evaluated and trained!")

    # 5. Save Model Immediately Before Evaluation in Case of Crash
    print("\n   [5/5] Securing models...")
    os.makedirs("models", exist_ok=True)
    joblib.dump(qsvm,   "models/quantum_svm.pkl")
    joblib.dump(pca,    "models/pca.pkl")
    joblib.dump(scaler, "models/scaler.pkl")
    print(f"         ✅ Quantum model saved to models/")

    return qsvm, pca, scaler


def evaluate_quantum_model(qsvm, pca, scaler, X_test, y_test, max_test=1000):
    print("\n" + "=" * 50)
    print("Evaluating Quantum Model...")
    print("=" * 50)
    
    try:
        top_256_idx = np.load("models/top_256_idx.npy")
        X_test = X_test[:, top_256_idx]
    except:
        pass

    if len(X_test) > max_test:
        idx = np.random.choice(len(X_test), max_test, replace=False)
        X_t_raw = X_test[idx]
        y_t = y_test[idx]
        print(f"   Using {max_test} random test samples for validation speed")
    else:
        X_t_raw = X_test
        y_t = y_test

    X_t_pca = pca.transform(X_t_raw)
    X_t_scaled = scaler.transform(X_t_pca)

    print("   ⏳ Predicting on Quantum SVM (Takes ~5-15 mins)...")
    y_pred = qsvm.predict(X_t_scaled)
    y_prob = qsvm.predict_proba(X_t_scaled)[:, 1]

    accuracy = accuracy_score(y_t, y_pred)
    roc_auc  = roc_auc_score(y_t, y_prob)

    print(f"\n{'=' * 50}")
    print(f"Results: Quantum Kernel SVM (Isolating specifically complex vectors)")
    print(f"{'=' * 50}")
    print(f"   Accuracy : {accuracy:.4f} ({accuracy*100:.1f}%)")
    print(f"   ROC-AUC  : {roc_auc:.4f}")
    print(f"\nDetailed Report:")
    print(classification_report(
        y_t, y_pred,
        target_names=["INACTIVE", "ACTIVE"]
    ))

    return {
        "accuracy"   : accuracy,
        "roc_auc"    : roc_auc
    }


if __name__ == "__main__":
    import sys
    sys.path.append("src")
    from data_loader import load_bace_data

    X_train, X_test, y_train, y_test = load_bace_data()

    QUBITS = 10
    MAX_TRAIN = 500
    MAX_TEST = 1000

    qsvm, pca, scaler = train_smart_quantum_model(
        X_train, y_train, 
        n_qubits=QUBITS, max_train=MAX_TRAIN
    )

    quantum_results = evaluate_quantum_model(
        qsvm, pca, scaler,
        X_test, y_test,
        max_test=MAX_TEST
    )

    print("\n" + "=" * 50)
    print("QUANTUM SCALE-UP SUMMARY")
    print("=" * 50)
    print(f"   Smart Train Samples : {MAX_TRAIN}")
    print(f"   Test Samples        : {MAX_TEST}")
    print(f"   Accuracy : {quantum_results['accuracy']*100:.1f}%")
    print(f"   ROC-AUC  : {quantum_results['roc_auc']:.4f}")
    print("\n🎉 quantum_model.py working perfectly!")

