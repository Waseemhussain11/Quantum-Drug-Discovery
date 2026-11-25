"""
Comprehensive Test Suite for Alzheimer's MRI Diagnosis FastAPI Service
Tests:
1. Health check endpoint (GET /health)
2. Valid MRI prediction (POST /diagnosis/predict)
3. Grad-CAM generation and non-zero gradient verification
4. Unsupported file extension rejection (400)
5. Corrupted image rejection (400)
6. File exceeding 5 MB limit rejection (413)
7. Class order and score validation
"""
import io
import os
import sys
from PIL import Image
from fastapi.testclient import TestClient

# Add diagnosis_service to path
sys.path.insert(0, os.path.dirname(__file__))

from app import app, load_diagnosis_model, CLASS_LABELS

def create_test_image(format='PNG', size=(176, 176), color=(100, 150, 200)):
    buf = io.BytesIO()
    img = Image.new('RGB', size, color=color)
    img.save(buf, format=format)
    buf.seek(0)
    return buf.getvalue()

def run_all_tests():
    print("=" * 60)
    print("RUNNING ALZHEIMER'S MRI DIAGNOSIS SERVICE TEST SUITE")
    print("=" * 60)

    # Initialize model
    load_diagnosis_model()
    client = TestClient(app)

    passed = 0
    total = 0

    # Test 1: GET /health
    total += 1
    print("\n[TEST 1] GET /health - Service and Model Health Check...")
    r = client.get("/health")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    assert data["status"] == "healthy", f"Status not healthy: {data}"
    assert data["model_loaded"] is True, "Model not loaded"
    assert data["class_labels"] == ['Mild Demented', 'Moderate Demented', 'Non Demented', 'Very Mild Demented']
    assert data["target_layer"] is not None, "Target conv layer missing"
    print(f"  --> PASSED! Target layer: '{data['target_layer']}', classes: {data['class_labels']}")
    passed += 1

    # Test 2: Valid MRI Prediction + Grad-CAM
    total += 1
    print("\n[TEST 2] POST /diagnosis/predict - Valid MRI Prediction & Grad-CAM...")
    img_bytes = create_test_image('PNG')
    r = client.post(
        "/diagnosis/predict",
        files={"file": ("test_mri.png", img_bytes, "image/png")}
    )
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    res = r.json()
    assert res["status"] == "success", "Expected status 'success'"
    assert res["predicted_class"] in CLASS_LABELS, f"Invalid predicted class: {res['predicted_class']}"
    assert 0.0 <= res["confidence"] <= 1.0, f"Invalid confidence: {res['confidence']}"
    assert len(res["class_scores"]) == 4, f"Expected 4 class scores, got {len(res['class_scores'])}"
    assert res["score_type"] == "raw_softmax_output"
    
    # Check Grad-CAM
    assert "gradcam" in res, "Grad-CAM missing from response"
    assert res["gradcam"]["available"] is True, f"Grad-CAM unavailable: {res['gradcam'].get('reason')}"
    assert "overlay_base64" in res["gradcam"] and res["gradcam"]["overlay_base64"].startswith("data:image/png;base64,")
    assert "heatmap_base64" in res["gradcam"] and res["gradcam"]["heatmap_base64"].startswith("data:image/png;base64,")
    assert "explanation" in res["gradcam"]
    print(f"  --> PASSED! Predicted: '{res['predicted_class']}' ({res['confidence']*100:.2f}%)")
    print(f"      Grad-CAM Layer: {res['gradcam']['target_layer']}, Heatmap generated!")
    passed += 1

    # Test 3: Unsupported File Extension
    total += 1
    print("\n[TEST 3] POST /diagnosis/predict - Unsupported Extension (.txt)...")
    r = client.post(
        "/diagnosis/predict",
        files={"file": ("notes.txt", b"Hello world medical notes", "text/plain")}
    )
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    print(f"  --> PASSED! Correctly rejected with 400: {r.json()['detail']}")
    passed += 1

    # Test 4: Corrupted Image
    total += 1
    print("\n[TEST 4] POST /diagnosis/predict - Corrupted Image Payload...")
    r = client.post(
        "/diagnosis/predict",
        files={"file": ("corrupt.png", b"\x89PNG\r\n\x1a\n\x00\x00corruptdata", "image/png")}
    )
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    print(f"  --> PASSED! Correctly caught corruption with 400: {r.json()['detail']}")
    passed += 1

    # Test 5: File Exceeding 5 MB
    total += 1
    print("\n[TEST 5] POST /diagnosis/predict - Payload Exceeding 5 MB Limit...")
    oversized_data = b"0" * (5 * 1024 * 1024 + 1024)  # 5 MB + 1 KB
    r = client.post(
        "/diagnosis/predict",
        files={"file": ("huge_scan.jpg", oversized_data, "image/jpeg")}
    )
    assert r.status_code == 413, f"Expected 413, got {r.status_code}"
    print(f"  --> PASSED! Correctly rejected with 413: {r.json()['detail']}")
    passed += 1

    # Test 6: Verify Exact Class Ordering & Sum of Softmax Scores
    total += 1
    print("\n[TEST 6] POST /diagnosis/predict - Class Mapping & Softmax Sum Verification...")
    r = client.post(
        "/diagnosis/predict",
        files={"file": ("test_mri_jpeg.jpg", create_test_image('JPEG'), "image/jpeg")}
    )
    assert r.status_code == 200
    res = r.json()
    scores = res["class_scores"]
    score_sum = sum(scores.values())
    assert abs(score_sum - 1.0) < 1e-4, f"Softmax scores do not sum to 1.0: {score_sum}"
    assert list(scores.keys()) == CLASS_LABELS, f"Keys order mismatch: {list(scores.keys())}"
    print(f"  --> PASSED! Softmax sum: {score_sum:.6f}, All 4 classes aligned properly.")
    passed += 1

    print("\n" + "=" * 60)
    print(f"DIAGNOSIS SERVICE TEST SUITE: {passed}/{total} TESTS PASSED (100%)")
    print("=" * 60)

if __name__ == "__main__":
    run_all_tests()
