import os
import io
import base64
import logging
from typing import Dict, Any, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("diagnosis_service")

app = FastAPI(
    title="Alzheimer's Disease MRI Diagnosis API",
    description="Research prototype API for multiclass classification of brain MRI scans into Alzheimer's stages.",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants & Configuration
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "model.h5")
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/jpg"}
TARGET_SIZE = (176, 176)

CLASS_LABELS = [
    "Mild Demented",
    "Moderate Demented",
    "Non Demented",
    "Very Mild Demented"
]

# Global model state
model = None
target_conv_layer_name = None

def get_colormap_jet(val: np.ndarray) -> np.ndarray:
    """
    Pure NumPy implementation of Jet-like colormap for Grad-CAM.
    Accepts 2D array normalized between [0, 1] and returns RGB uint8 array (H, W, 3).
    """
    val = np.clip(val, 0.0, 1.0)
    r = np.clip(1.5 - np.abs(4.0 * val - 3.0), 0.0, 1.0)
    g = np.clip(1.5 - np.abs(4.0 * val - 2.0), 0.0, 1.0)
    b = np.clip(1.5 - np.abs(4.0 * val - 1.0), 0.0, 1.0)
    rgb = np.stack([r, g, b], axis=-1)
    return (rgb * 255).astype(np.uint8)

def find_last_conv_layer(keras_model):
    """
    Traverse layers backwards to identify the final convolutional or separable conv layer.
    """
    for layer in reversed(keras_model.layers):
        layer_name = layer.__class__.__name__
        if "Conv" in layer_name or "SeparableConv" in layer_name:
            return layer.name
    return None

@app.on_event("startup")
def load_diagnosis_model():
    global model, target_conv_layer_name
    logger.info("Initializing Alzheimer's MRI Diagnosis Service...")
    
    if not os.path.exists(MODEL_PATH):
        logger.error(f"Model file not found at {MODEL_PATH}")
        return

    try:
        import tensorflow as tf
        logger.info(f"Loading Keras model from {MODEL_PATH} using TensorFlow {tf.__version__}...")
        model = tf.keras.models.load_model(MODEL_PATH)
        logger.info("Model loaded successfully!")

        target_conv_layer_name = find_last_conv_layer(model)
        logger.info(f"Target convolutional layer for Grad-CAM: {target_conv_layer_name}")

    except Exception as e:
        logger.error(f"Failed to load diagnosis model: {e}")
        model = None

def generate_gradcam(image_array: np.ndarray, pred_index: int, orig_pil_img: Image.Image) -> Dict[str, Any]:
    """
    Computes Grad-CAM heatmap and overlay if technically supported.
    Returns dictionary with base64 images and verification metadata.
    """
    if model is None or target_conv_layer_name is None:
        return {
            "available": False,
            "reason": "Diagnosis model or target convolutional layer not available."
        }

    try:
        import tensorflow as tf
        input_tensor = tf.constant(image_array, dtype=tf.float32)

        with tf.GradientTape() as tape:
            x = input_tensor
            conv_output = None
            for layer in model.layers:
                x = layer(x)
                if layer.name == target_conv_layer_name:
                    conv_output = x
                    tape.watch(conv_output)
            predictions = x
            loss = predictions[:, pred_index]

        grads = tape.gradient(loss, conv_output)
        if grads is None:
            return {
                "available": False,
                "reason": "Gradients could not be computed for target layer."
            }

        grad_norm = tf.reduce_sum(tf.abs(grads)).numpy()
        if grad_norm == 0 or np.isnan(grad_norm):
            return {
                "available": False,
                "reason": "Computed gradients are zero or undefined."
            }

        # Global average pooling of gradients
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2)).numpy()
        conv_out = conv_output[0].numpy()

        # Weight feature maps by gradient importance
        cam = np.zeros(conv_out.shape[:2], dtype=np.float32)
        for i, w in enumerate(pooled_grads):
            cam += w * conv_out[:, :, i]

        # Activation normalization: Prefer positive contributions (ReLU),
        # fallback to min-max normalization if feature maps are predominantly inhibitory
        cam_relu = np.maximum(cam, 0)
        max_relu = np.max(cam_relu)
        if max_relu > 0:
            cam_norm = cam_relu / max_relu
        else:
            cam_spread = np.max(cam) - np.min(cam)
            if cam_spread > 1e-8:
                cam_norm = (cam - np.min(cam)) / cam_spread
            else:
                return {
                    "available": False,
                    "reason": "Heatmap activation variance is zero."
                }

        # Resize heatmap to match image size (176, 176)
        cam_pil = Image.fromarray((cam_norm * 255).astype(np.uint8)).resize(TARGET_SIZE, Image.BILINEAR)
        cam_scaled = np.array(cam_pil).astype(np.float32) / 255.0

        # Create colored heatmap RGB
        heatmap_color = get_colormap_jet(cam_scaled)
        heatmap_img = Image.fromarray(heatmap_color)

        # Create overlay onto resized original image
        orig_resized = orig_pil_img.convert("RGB").resize(TARGET_SIZE)
        orig_arr = np.array(orig_resized, dtype=np.float32)
        overlay_arr = 0.55 * orig_arr + 0.45 * heatmap_color.astype(np.float32)
        overlay_arr = np.clip(overlay_arr, 0, 255).astype(np.uint8)
        overlay_img = Image.fromarray(overlay_arr)

        # Convert to Base64
        def pil_to_base64(img: Image.Image) -> str:
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

        return {
            "available": True,
            "target_layer": target_conv_layer_name,
            "heatmap_base64": pil_to_base64(heatmap_img),
            "overlay_base64": pil_to_base64(overlay_img),
            "original_base64": pil_to_base64(orig_resized),
            "explanation": "Highlighted regions indicate areas with highest feature activation for the predicted class. This visualization reflects model representation, NOT confirmed biological pathology."
        }

    except Exception as e:
        logger.error(f"Grad-CAM computation error: {e}")
        return {
            "available": False,
            "reason": f"Grad-CAM generation error: {str(e)}"
        }

@app.get("/health")
def health_check():
    return {
        "status": "healthy" if model is not None else "degraded",
        "service": "Alzheimer's Disease MRI Diagnosis Service",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH,
        "input_shape": [176, 176, 3],
        "class_labels": CLASS_LABELS,
        "gradcam_supported": target_conv_layer_name is not None,
        "target_layer": target_conv_layer_name
    }

@app.post("/diagnosis/predict")
async def predict_mri(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Diagnosis model is not loaded. Please verify model.h5 exists and is compatible."
        )

    # 1. Validate File Extension
    filename = file.filename or ""
    ext = os.path.splitext(filename.lower())[1]
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Only JPG, JPEG, and PNG images are supported."
        )

    # 2. Validate MIME Type
    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid MIME type '{file.content_type}'. Must be image/jpeg or image/png."
        )

    # 3. Read File and Validate Size (max 5 MB)
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum permitted limit of 5 MB ({len(contents) / (1024*1024):.2f} MB received)."
        )

    # 4. Validate Image Content & Corruption
    try:
        pil_image = Image.open(io.BytesIO(contents))
        pil_image.load()  # Force load to catch truncated or corrupted image buffers
    except (UnidentifiedImageError, OSError, Exception) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corrupted or invalid image data: {str(e)}"
        )

    # 5. Exact Preprocessing from Reference Architecture
    try:
        rgb_image = pil_image.convert("RGB")
        resized_image = rgb_image.resize(TARGET_SIZE, Image.BILINEAR)
        img_array = np.array(resized_image, dtype=np.float32)
        normalized_array = img_array / 255.0
        input_batch = np.expand_dims(normalized_array, axis=0)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image preprocessing failed: {str(e)}"
        )

    # 6. Model Inference
    try:
        raw_preds = model.predict(input_batch)
        pred_scores = raw_preds[0]
        pred_idx = int(np.argmax(pred_scores))
        predicted_class = CLASS_LABELS[pred_idx]
        confidence = float(pred_scores[pred_idx])

        class_scores = {
            CLASS_LABELS[i]: float(pred_scores[i])
            for i in range(len(CLASS_LABELS))
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference execution failed: {str(e)}"
        )

    # 7. Grad-CAM Explainability
    gradcam_result = generate_gradcam(input_batch, pred_idx, pil_image)

    # Return structured response
    return JSONResponse(content={
        "status": "success",
        "predicted_class": predicted_class,
        "predicted_index": pred_idx,
        "confidence": confidence,
        "class_scores": class_scores,
        "score_type": "raw_softmax_output",
        "gradcam": gradcam_result,
        "medical_disclaimer": "RESEARCH USE ONLY. This application is an academic prototype and is not clinically validated, certified, or approved for medical diagnosis or clinical decision-making. Outputs represent raw neural network activations, not confirmed pathological lesions.",
        "input_metadata": {
            "filename": filename,
            "dimensions": f"{pil_image.width}x{pil_image.height}",
            "processed_dimensions": f"{TARGET_SIZE[0]}x{TARGET_SIZE[1]}",
            "file_size_bytes": len(contents)
        }
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8001, reload=False)
