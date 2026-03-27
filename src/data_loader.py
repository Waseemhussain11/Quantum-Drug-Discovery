import deepchem as dc
import numpy as np

def load_bace_data():
    """
    Downloads BACE dataset from MoleculeNet.
    1522 molecules tested in real labs against BACE-1.
    Label 1 = ACTIVE   (good drug candidate)
    Label 0 = INACTIVE (bad drug candidate)
    """

    print("=" * 50)
    print("Loading BACE Dataset...")
    print("=" * 50)

    tasks, datasets, transformers = dc.molnet.load_bace_classification(
        featurizer='ECFP',
        splitter='random'
    )

    train_dataset, valid_dataset, test_dataset = datasets

    X_train = train_dataset.X
    y_train = train_dataset.y.flatten()

    X_test = test_dataset.X
    y_test = test_dataset.y.flatten()

    print(f"\n✅ Dataset loaded!")
    print(f"\n📊 Summary:")
    print(f"   Training samples     : {X_train.shape[0]}")
    print(f"   Test samples         : {X_test.shape[0]}")
    print(f"   Features per molecule: {X_train.shape[1]}")
    print(f"\n🏷️  Labels in Training:")
    print(f"   ACTIVE   (1) : {int(y_train.sum())} molecules")
    print(f"   INACTIVE (0) : {int(len(y_train) - y_train.sum())} molecules")

    print(f"\n🔬 Sample molecules:")
    smiles_list = train_dataset.ids
    for i in range(3):
        label = "ACTIVE" if y_train[i] == 1 else "INACTIVE"
        print(f"   [{label}] {smiles_list[i]}")

    return X_train, X_test, y_train, y_test


if __name__ == "__main__":
    X_train, X_test, y_train, y_test = load_bace_data()
    print(f"\n✅ X_train shape : {X_train.shape}")
    print(f"✅ X_test shape  : {X_test.shape}")
    print(f"✅ y_train shape : {y_train.shape}")
    print(f"✅ y_test shape  : {y_test.shape}")
    print("\n🎉 data_loader.py working perfectly!")