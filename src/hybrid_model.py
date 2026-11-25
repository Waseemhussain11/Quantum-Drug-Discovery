import numpy as np
import joblib
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report


def load_all_models():
    print("\n" + "=" * 50)
    print("Loading all classical ML models...")
    print("=" * 50)

    xgb_model = joblib.load("models/classical_model.pkl")
    rf_model  = joblib.load("models/rf_model.pkl")

    print("✅ XGBoost model loaded")
    print("✅ Random Forest model loaded")

    return xgb_model, rf_model


def classical_ensemble_predict(xgb_model, rf_model, X_test, y_test=None, weights=(0.55, 0.45)):
    """
    Ensemble prediction combining classical XGBoost and Random Forest models
    on 1024-bit Morgan Fingerprints.
    """
    print("\n" + "=" * 50)
    print("Running Classical Ensemble Prediction...")
    print("=" * 50)

    # Step 1: Classical XGBoost prediction on full 1024 features
    print("\n   Step 1: Classical XGBoost predicting...")
    xgb_prob = xgb_model.predict_proba(X_test)[:, 1]
    print(f"   ✅ XGBoost predictions complete")

    # Step 2: Classical Random Forest prediction on full 1024 features
    print("\n   Step 2: Classical Random Forest predicting...")
    rf_prob = rf_model.predict_proba(X_test)[:, 1]
    print(f"   ✅ Random Forest predictions complete")

    # Step 3: Combine predictions via Weighted Consensus
    print("\n   Step 3: Combining predictions via Classical Consensus...")
    w_xgb, w_rf = weights
    total_w = w_xgb + w_rf
    w_xgb, w_rf = w_xgb / total_w, w_rf / total_w

    ensemble_prob = (w_xgb * xgb_prob) + (w_rf * rf_prob)
    ensemble_pred = (ensemble_prob >= 0.5).astype(int)

    agreement = 1.0 - np.abs(xgb_prob - rf_prob)
    consensus_strength = float(np.mean(agreement))

    results = {
        "model_name"         : "Classical Ensemble (XGBoost + Random Forest)",
        "ensemble_prob"      : ensemble_prob,
        "ensemble_pred"      : ensemble_pred,
        "xgb_prob"           : xgb_prob,
        "rf_prob"            : rf_prob,
        "classical_prob"     : xgb_prob,
        "rf_score"           : rf_prob,
        "consensus_strength" : consensus_strength
    }

    if y_test is not None:
        accuracy = accuracy_score(y_test, ensemble_pred)
        roc_auc  = roc_auc_score(y_test, ensemble_prob)
        xgb_acc  = accuracy_score(y_test, (xgb_prob >= 0.5).astype(int))
        xgb_auc  = roc_auc_score(y_test, xgb_prob)
        rf_acc   = accuracy_score(y_test, (rf_prob >= 0.5).astype(int))
        rf_auc   = roc_auc_score(y_test, rf_prob)

        print(f"\n{'=' * 50}")
        print(f"Results: Classical Ensemble Consensus")
        print(f"{'=' * 50}")
        print(f"   Accuracy : {accuracy:.4f} ({accuracy*100:.1f}%)")
        print(f"   ROC-AUC  : {roc_auc:.4f}")
        print(f"\nDetailed Report:")
        print(classification_report(
            y_test, ensemble_pred,
            target_names=["INACTIVE", "ACTIVE"]
        ))

        results.update({
            "accuracy" : accuracy,
            "roc_auc"  : roc_auc,
            "xgb_acc"  : xgb_acc,
            "xgb_auc"  : xgb_auc,
            "rf_acc"   : rf_acc,
            "rf_auc"   : rf_auc,
        })

    return results


# Backward compatibility alias
hybrid_predict = classical_ensemble_predict


def print_final_comparison(xgb_acc, rf_acc, ensemble_acc,
                            xgb_auc, rf_auc, ensemble_auc):
    print("\n" + "=" * 50)
    print("FINAL COMPARISON — ALL CLASSICAL MODELS")
    print("=" * 50)
    print(f"{'Model':<35} {'Accuracy':>10} {'ROC-AUC':>10}")
    print("-" * 55)
    print(f"{'Classical XGBoost':<35} {xgb_acc*100:>9.1f}% {xgb_auc:>10.4f}")
    print(f"{'Classical Random Forest':<35} {rf_acc*100:>9.1f}% {rf_auc:>10.4f}")
    print(f"{'Classical Ensemble Consensus':<35} {ensemble_acc*100:>9.1f}% {ensemble_auc:>10.4f}")
    print("=" * 55)

    improvement = ensemble_acc - max(xgb_acc, rf_acc)
    if improvement >= 0:
        print(f"\n✅ Ensemble matches or exceeds individual baselines!")
    else:
        print(f"\nℹ️ Individual models perform strongly on test set.")

    print("\n🎉 hybrid_model.py working perfectly with pure classical ML!")


if __name__ == "__main__":
    import sys
    sys.path.append("src")
    from data_loader import load_bace_data

    X_train, X_test, y_train, y_test = load_bace_data()

    xgb_model, rf_model = load_all_models()

    ensemble_results = classical_ensemble_predict(
        xgb_model, rf_model,
        X_test, y_test
    )

    print_final_comparison(
        xgb_acc      = ensemble_results["xgb_acc"],
        rf_acc       = ensemble_results["rf_acc"],
        ensemble_acc = ensemble_results["accuracy"],
        xgb_auc      = ensemble_results["xgb_auc"],
        rf_auc       = ensemble_results["rf_auc"],
        ensemble_auc = ensemble_results["roc_auc"]
    )
