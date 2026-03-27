import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import os


def create_benchmark_chart(results_dict, save_path="report/benchmark.png"):
    os.makedirs("report", exist_ok=True)

    models   = list(results_dict.keys())
    accuracy = [results_dict[m]["accuracy"] * 100 for m in models]
    roc_auc  = [results_dict[m]["roc_auc"] for m in models]

    colors = ["#1f77b4", "#9467bd", "#2ca02c"]

    fig, axes = plt.subplots(1, 2, figsize=(12, 6))
    fig.suptitle(
        "Quantum-Enhanced Drug Discovery — Model Benchmark",
        fontsize=14, fontweight="bold", y=1.02
    )

    # Accuracy chart
    bars1 = axes[0].bar(models, accuracy, color=colors, alpha=0.85, edgecolor="white", width=0.5)
    axes[0].set_title("Accuracy Comparison", fontsize=13, fontweight="bold")
    axes[0].set_ylabel("Accuracy (%)")
    axes[0].set_ylim(0, 105)
    axes[0].axhline(y=82.2, color="gray", linestyle="--", alpha=0.5, label="Classical baseline")
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
    axes[1].axhline(y=0.9225, color="gray", linestyle="--", alpha=0.5, label="Classical baseline")
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
        mpatches.Patch(color="#1f77b4", label="Classical XGBoost"),
        mpatches.Patch(color="#9467bd", label="Quantum Kernel SVM"),
        mpatches.Patch(color="#2ca02c", label="Hybrid Classical+Quantum"),
    ]
    fig.legend(handles=legend_patches, loc="lower center", ncol=3, fontsize=10, bbox_to_anchor=(0.5, -0.05))

    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    print(f"✅ Benchmark chart saved to {save_path}")
    plt.show()
    return fig


if __name__ == "__main__":
    results = {
        "Classical\nXGBoost": {
            "accuracy": 0.8224,
            "roc_auc":  0.9225
        },
        "Quantum\nKernel SVM": {
            "accuracy": 0.7400,
            "roc_auc":  0.8487
        },
        "Hybrid\nClassical+Quantum": {
            "accuracy": 0.8300,
            "roc_auc":  0.9301
        }
    }

    create_benchmark_chart(results)
    print("\n🎉 benchmark.py working perfectly!")