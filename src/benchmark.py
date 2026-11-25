import numpy as np
import os

try:
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False


def create_benchmark_chart(results_dict, save_path="report/benchmark.png"):
    os.makedirs("report", exist_ok=True)

    models   = list(results_dict.keys())
    accuracy = [results_dict[m]["accuracy"] * 100 for m in models]
    roc_auc  = [results_dict[m]["roc_auc"] for m in models]

    print("\n" + "=" * 55)
    print("CLASSICAL DRUG DISCOVERY — BENCHMARK RESULTS")
    print("=" * 55)
    print(f"{'Model':<30} {'Accuracy':>10} {'ROC-AUC':>10}")
    print("-" * 55)
    for m in models:
        clean_name = m.replace('\n', ' ')
        print(f"{clean_name:<30} {results_dict[m]['accuracy']*100:>9.1f}% {results_dict[m]['roc_auc']:>10.4f}")
    print("=" * 55)

    if not HAS_MATPLOTLIB:
        print("ℹ️ Matplotlib not installed; printed tabular benchmark above.")
        return None

    colors = ["#1f77b4", "#2ca02c", "#ff7f0e"]

    fig, axes = plt.subplots(1, 2, figsize=(12, 6))
    fig.suptitle(
        "Classical AI/ML Drug Discovery — Model Benchmark",
        fontsize=14, fontweight="bold", y=1.02
    )

    # Accuracy chart
    bars1 = axes[0].bar(models, accuracy, color=colors, alpha=0.85, edgecolor="white", width=0.5)
    axes[0].set_title("Accuracy Comparison", fontsize=13, fontweight="bold")
    axes[0].set_ylabel("Accuracy (%)")
    axes[0].set_ylim(0, 105)
    axes[0].axhline(y=90.0, color="gray", linestyle="--", alpha=0.5, label="90% Target")
    for bar, val in zip(bars1, accuracy):
        axes[0].text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 1,
            f"{val:.1f}%",
            ha="center", va="bottom",
            fontweight="bold", fontsize=11
        )
    axes[0].tick_params(axis="x", labelsize=9)

    # ROC-AUC chart
    bars2 = axes[1].bar(models, roc_auc, color=colors, alpha=0.85, edgecolor="white", width=0.5)
    axes[1].set_title("ROC-AUC Comparison", fontsize=13, fontweight="bold")
    axes[1].set_ylabel("ROC-AUC Score")
    axes[1].set_ylim(0, 1.1)
    axes[1].axhline(y=0.95, color="gray", linestyle="--", alpha=0.5, label="0.95 Target")
    for bar, val in zip(bars2, roc_auc):
        axes[1].text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.01,
            f"{val:.4f}",
            ha="center", va="bottom",
            fontweight="bold", fontsize=11
        )
    axes[1].tick_params(axis="x", labelsize=9)

    # Legend
    legend_patches = [
        mpatches.Patch(color=colors[0], label="Classical XGBoost"),
        mpatches.Patch(color=colors[1], label="Classical Random Forest"),
        mpatches.Patch(color=colors[2], label="Classical Ensemble"),
    ]
    fig.legend(handles=legend_patches, loc="lower center", ncol=3, fontsize=10, bbox_to_anchor=(0.5, -0.05))

    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    print(f"✅ Benchmark chart saved to {save_path}")
    return fig


if __name__ == "__main__":
    results = {
        "Classical\nXGBoost": {
            "accuracy": 0.9307,
            "roc_auc":  0.9724
        },
        "Classical\nRandom Forest": {
            "accuracy": 0.9109,
            "roc_auc":  0.9585
        },
        "Classical\nEnsemble": {
            "accuracy": 0.9340,
            "roc_auc":  0.9654
        }
    }

    create_benchmark_chart(results)
    print("\n🎉 benchmark.py working perfectly!")
