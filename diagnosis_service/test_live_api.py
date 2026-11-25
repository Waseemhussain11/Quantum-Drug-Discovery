"""
Live End-to-End API Integration Test Suite for Alzheimer's MRI Diagnosis Service.
Starts uvicorn on port 8001 as a subprocess, runs end-to-end HTTP requests,
validates all endpoints, edge cases, Grad-CAM, and cleanly shuts down the server.
"""
import io
import os
import sys
import time
import subprocess
import requests
from PIL import Image

SERVER_URL = "http://127.0.0.1:8001"

def create_test_image(format='PNG', size=(176, 176), color=(80, 120, 180)):
    buf = io.BytesIO()
    img = Image.new('RGB', size, color=color)
    img.save(buf, format=format)
    buf.seek(0)
    return buf.getvalue()

def run_tests():
    print("=" * 65)
    print("STARTING LIVE DIAGNOSIS SERVICE HTTP INTEGRATION TESTS (PORT 8001)")
    print("=" * 65)

    python_exe = sys.executable
    service_dir = os.path.dirname(os.path.abspath(__file__))

    # Launch uvicorn server as subprocess
    cmd = [python_exe, "-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", "8001"]
    print(f"Launching diagnosis server: {' '.join(cmd)}")
    proc = subprocess.Popen(cmd, cwd=service_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    try:
        # Wait for server to become healthy
        print("Waiting for server startup and model load...")
        ready = False
        for _ in range(40):
            try:
                res = requests.get(f"{SERVER_URL}/health", timeout=2)
                if res.status_code == 200:
                    ready = True
                    break
            except Exception:
                time.sleep(1)

        if not ready:
            proc.kill()
            stdout, stderr = proc.communicate()
            print("Server failed to start within timeout.")
            print("STDOUT:", stdout.decode("utf-8", errors="ignore"))
            print("STDERR:", stderr.decode("utf-8", errors="ignore"))
            sys.exit(1)

        print("--> Server is UP and healthy on http://127.0.0.1:8001\n")

        passed = 0
        total = 0

        # TEST 1: GET /health
        total += 1
        print("[TEST 1] GET /health endpoint...")
        r = requests.get(f"{SERVER_URL}/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "healthy"
        assert data["model_loaded"] is True
        assert data["target_layer"] == "separable_conv2d_17"
        assert data["class_labels"] == ['Mild Demented', 'Moderate Demented', 'Non Demented', 'Very Mild Demented']
        print(f"  --> PASSED! Status: {data['status']}, Model Target Layer: {data['target_layer']}")
        passed += 1

        # TEST 2: POST /diagnosis/predict (Valid PNG)
        total += 1
        print("\n[TEST 2] POST /diagnosis/predict with Valid PNG MRI...")
        png_data = create_test_image('PNG')
        r = requests.post(f"{SERVER_URL}/diagnosis/predict", files={"file": ("brain_scan.png", png_data, "image/png")})
        assert r.status_code == 200, f"Got status {r.status_code}: {r.text}"
        res = r.json()
        assert res["status"] == "success"
        assert res["predicted_class"] in data["class_labels"]
        assert 0.0 <= res["confidence"] <= 1.0
        assert len(res["class_scores"]) == 4
        assert res["score_type"] == "raw_softmax_output"
        assert res["gradcam"]["available"] is True
        assert res["gradcam"]["target_layer"] == "separable_conv2d_17"
        assert res["gradcam"]["overlay_base64"].startswith("data:image/png;base64,")
        assert res["gradcam"]["heatmap_base64"].startswith("data:image/png;base64,")
        assert res["gradcam"]["original_base64"].startswith("data:image/png;base64,")
        assert "medical_disclaimer" in res
        print(f"  --> PASSED! Prediction: '{res['predicted_class']}' ({res['confidence']*100:.2f}%)")
        print(f"      Grad-CAM: Heatmap, overlay, and original verified.")
        passed += 1

        # TEST 3: POST /diagnosis/predict (Valid JPEG)
        total += 1
        print("\n[TEST 3] POST /diagnosis/predict with Valid JPEG MRI...")
        jpg_data = create_test_image('JPEG')
        r = requests.post(f"{SERVER_URL}/diagnosis/predict", files={"file": ("brain_scan.jpg", jpg_data, "image/jpeg")})
        assert r.status_code == 200
        res = r.json()
        score_sum = sum(res["class_scores"].values())
        assert abs(score_sum - 1.0) < 1e-4
        print(f"  --> PASSED! Prediction: '{res['predicted_class']}', Softmax score sum: {score_sum:.6f}")
        passed += 1

        # TEST 4: Unsupported File Extension (.txt)
        total += 1
        print("\n[TEST 4] POST /diagnosis/predict with Unsupported Extension (.txt)...")
        r = requests.post(f"{SERVER_URL}/diagnosis/predict", files={"file": ("notes.txt", b"Invalid text data", "text/plain")})
        assert r.status_code == 400
        print(f"  --> PASSED! Rejected with 400 Bad Request: {r.json()['detail']}")
        passed += 1

        # TEST 5: Corrupted Image
        total += 1
        print("\n[TEST 5] POST /diagnosis/predict with Corrupted Image Bytes...")
        r = requests.post(f"{SERVER_URL}/diagnosis/predict", files={"file": ("corrupted.png", b"\x89PNG\r\n\x1a\n\x00\x00trash", "image/png")})
        assert r.status_code == 400
        print(f"  --> PASSED! Rejected with 400 Bad Request: {r.json()['detail']}")
        passed += 1

        # TEST 6: File Exceeding 5 MB
        total += 1
        print("\n[TEST 6] POST /diagnosis/predict with File Exceeding 5 MB Limit...")
        oversized = b"0" * (5 * 1024 * 1024 + 1024)
        r = requests.post(f"{SERVER_URL}/diagnosis/predict", files={"file": ("huge.jpg", oversized, "image/jpeg")})
        assert r.status_code == 413
        print(f"  --> PASSED! Rejected with 413 Payload Too Large: {r.json()['detail']}")
        passed += 1

        print("\n" + "=" * 65)
        print(f"ALL LIVE HTTP TESTS PASSED: {passed}/{total} (100% SUCCESS)")
        print("=" * 65)

    finally:
        print("Terminating test diagnosis server process...")
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        print("Server shutdown cleanly.")

if __name__ == "__main__":
    run_tests()
