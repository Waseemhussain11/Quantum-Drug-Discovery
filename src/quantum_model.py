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


def train_quantum_model(X_train_scaled, y_train, n_qubits=8):
    print("\n" + "=" * 50)
    print("Training Quantum Kernel SVM...")
    print("=" * 50)

    MAX_TRAIN = 200
    if len(X_train_scaled) > MAX_TRAIN:
        idx = np.random.choice(len(X_train_scaled), MAX_TRAIN, replace=False)
        X_q = X_train_scaled[idx]
        y_q = y_train[idx]
        print(f"   Using {MAX_TRAIN} samples for speed")
    else:
        X_q = X_train_scaled
        y_q = y_train

    quantum_kernel, feature_map = build_quantum_kernel(n_qubits)

    print("\n   Training SVM with Quantum Kernel...")
    print("   ⏳ This takes 5-10 minutes. Please wait...")

    qsvm = SVC(
        kernel=quantum_kernel.evaluate,
        probability=True,
        C=1.0
    )
    qsvm.fit(X_q, y_q)

    print("✅ Quantum SVM training complete!")
    return qsvm, quantum_kernel


def evaluate_quantum_model(qsvm, X_test_scaled, y_test):
    print("\n" + "=" * 50)
    print("Evaluating Quantum Model...")
    print("=" * 50)

    MAX_TEST = 100
    if len(X_test_scaled) > MAX_TEST:
        idx = np.random.choice(len(X_test_scaled), MAX_TEST, replace=False)
        X_t = X_test_scaled[idx]
        y_t = y_test[idx]
        print(f"   Using {MAX_TEST} test samples for speed")
    else:
        X_t = X_test_scaled
        y_t = y_test

    y_pred = qsvm.predict(X_t)
    y_prob = qsvm.predict_proba(X_t)[:, 1]

    accuracy = accuracy_score(y_t, y_pred)
    roc_auc  = roc_auc_score(y_t, y_prob)

    print(f"\n{'=' * 50}")
    print(f"Results: Quantum Kernel SVM")
    print(f"{'=' * 50}")
    print(f"   Accuracy : {accuracy:.4f} ({accuracy*100:.1f}%)")
    print(f"   ROC-AUC  : {roc_auc:.4f}")
    print(f"\nDetailed Report:")
    print(classification_report(
        y_t, y_pred,
        target_names=["INACTIVE", "ACTIVE"]
    ))

    return {
        "model_name" : "Quantum Kernel SVM",
        "accuracy"   : accuracy,
        "roc_auc"    : roc_auc,
        "y_pred"     : y_pred,
        "y_prob"     : y_prob
    }


def save_quantum_model(qsvm, pca, scaler, n_qubits=8):
    os.makedirs("models", exist_ok=True)
    joblib.dump(qsvm,   "models/quantum_svm.pkl")
    joblib.dump(pca,    "models/pca.pkl")
    joblib.dump(scaler, "models/scaler.pkl")
    print(f"\n✅ Quantum model saved to models/")


if __name__ == "__main__":
    import sys
    sys.path.append("src")
    from data_loader import load_bace_data

    X_train, X_test, y_train, y_test = load_bace_data()

    X_train_scaled, X_test_scaled, pca, scaler = prepare_quantum_data(
        X_train, X_test, n_qubits=8
    )

    qsvm, quantum_kernel = train_quantum_model(
        X_train_scaled, y_train, n_qubits=8
    )

    quantum_results = evaluate_quantum_model(
        qsvm, X_test_scaled, y_test
    )

    save_quantum_model(qsvm, pca, scaler)

    print("\n" + "=" * 50)
    print("QUANTUM MODEL SUMMARY")
    print("=" * 50)
    print(f"   Accuracy : {quantum_results['accuracy']*100:.1f}%")
    print(f"   ROC-AUC  : {quantum_results['roc_auc']:.4f}")
    print("\n🎉 quantum_model.py working perfectly!")