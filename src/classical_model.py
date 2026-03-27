import numpy as np
import joblib
import os
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    roc_auc_score,
    classification_report
)


def train_xgboost(X_train, y_train):
    print("\n" + "=" * 50)
    print("Training XGBoost (Classical Model)...")
    print("=" * 50)

    model = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        eval_metric='logloss',
        random_state=42
    )

    model.fit(X_train, y_train)
    print("✅ XGBoost training complete!")
    return model


def train_random_forest(X_train, y_train):
    print("\n" + "=" * 50)
    print("Training Random Forest...")
    print("=" * 50)

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)
    print("✅ Random Forest training complete!")
    return model


def evaluate_model(model, X_test, y_test, model_name="Model"):
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    roc_auc  = roc_auc_score(y_test, y_prob)

    print(f"\n{'=' * 50}")
    print(f"Results: {model_name}")
    print(f"{'=' * 50}")
    print(f"   Accuracy : {accuracy:.4f} ({accuracy*100:.1f}%)")
    print(f"   ROC-AUC  : {roc_auc:.4f}")
    print(f"\nDetailed Report:")
    print(classification_report(
        y_test, y_pred,
        target_names=["INACTIVE", "ACTIVE"]
    ))

    return {
        "model_name" : model_name,
        "accuracy"   : accuracy,
        "roc_auc"    : roc_auc,
        "y_pred"     : y_pred,
        "y_prob"     : y_prob
    }


def save_model(model, filename="classical_model.pkl"):
    os.makedirs("models", exist_ok=True)
    path = f"models/{filename}"
    joblib.dump(model, path)
    print(f"\n✅ Model saved to {path}")


def load_model(filename="classical_model.pkl"):
    path = f"models/{filename}"
    return joblib.load(path)


if __name__ == "__main__":
    import sys
    sys.path.append("src")
    from data_loader import load_bace_data

    X_train, X_test, y_train, y_test = load_bace_data()

    xgb_model = train_xgboost(X_train, y_train)
    xgb_results = evaluate_model(
        xgb_model, X_test, y_test,
        model_name="XGBoost (Classical)"
    )

    rf_model = train_random_forest(X_train, y_train)
    rf_results = evaluate_model(
        rf_model, X_test, y_test,
        model_name="Random Forest (Classical)"
    )

    save_model(xgb_model, "classical_model.pkl")

    print("\n" + "=" * 50)
    print("CLASSICAL BASELINE SUMMARY")
    print("=" * 50)
    print(f"   XGBoost Accuracy     : {xgb_results['accuracy']*100:.1f}%")
    print(f"   XGBoost ROC-AUC      : {xgb_results['roc_auc']:.4f}")
    print(f"   Random Forest Acc    : {rf_results['accuracy']*100:.1f}%")
    print(f"   Random Forest ROC-AUC: {rf_results['roc_auc']:.4f}")
    print("\n🎯 This is our baseline — quantum must beat this!")
    print("\n🎉 classical_model.py working perfectly!")