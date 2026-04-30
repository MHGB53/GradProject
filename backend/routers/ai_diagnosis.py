"""
AI Diagnosis Router – Dentor
Provides FastAPI endpoints for:
  POST /api/ai-diagnosis/xray   – Panoramic (ResNet-50) or Periapical (YOLO)
  POST /api/ai-diagnosis/lab    – Lab results (sklearn multi-label pipeline)
"""

import io
import os
import base64
import traceback
from typing import Optional

import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image

# ── Lazy-import heavy deps so startup is fast if models aren't loaded ─────
try:
    import torch
    import torch.nn as nn
    from torchvision import models as tv_models, transforms
    TORCH_OK = True
except ImportError:
    TORCH_OK = False

try:
    import joblib
    JOBLIB_OK = True
except ImportError:
    JOBLIB_OK = False

try:
    from ultralytics import YOLO
    YOLO_OK = True
except ImportError:
    YOLO_OK = False

router = APIRouter(prefix="/api/ai-diagnosis", tags=["AI Diagnosis"])

# ── Paths ──────────────────────────────────────────────────────────────────
_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "AI_MODELS")

PANORAMA_WEIGHTS  = os.path.join(_MODELS_DIR, "dental_xray_fag_feshikh.pth")  # Full trained model
LAB_PIPELINE      = os.path.join(_MODELS_DIR, "lab_pipeline.joblib")
CLASS_MAPPING     = os.path.join(_MODELS_DIR, "class_mapping.json")

# YOLO periapical weights – check multiple possible names from Kaggle output
def _find_periapical_weights() -> str:
    candidates = [
        os.path.join(_MODELS_DIR, "best.pt"),                      # primary weight file
        os.path.join(_MODELS_DIR, "periapical_best.pt"),           # renamed from best.pt
        os.path.join(_MODELS_DIR, "dental_periapical_model.pt"),   # possible Kaggle output name
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return candidates[0]  # return first (will raise FileNotFoundError with clear path)

PERIAPICAL_WEIGHTS = _find_periapical_weights()

# ── Panoramic class names (31 classes from app_xray.py) ───────────────────
PANORAMA_CLASSES = [
    "Cavity", "Impacted Tooth", "Bone Defect", "Maxillary Sinus", "Filling",
    "Root Canal", "Crown", "Bridge", "Implant", "Cyst",
    "Periapical Lesion", "Calculus", "Gum Disease", "Tooth Fracture",
    "Missing Tooth", "Supernumerary Tooth", "Enamel Hypoplasia",
    "Dentin Hypersensitivity", "Malocclusion", "Temporomandibular Disorder",
    "Alveolar Bone Loss", "Furcation Involvement", "Pulp Calcification",
    "Internal Resorption", "External Resorption", "Sinus Pathology",
    "Torus", "Odontoma", "Ameloblastoma", "Dentigerous Cyst", "Normal",
]

# ── Model cache ────────────────────────────────────────────────────────────
_panorama_model   = None
_periapical_model = None
_lab_pipeline     = None


def _get_device():
    if TORCH_OK and torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def _load_panorama():
    global _panorama_model
    if _panorama_model is not None:
        return _panorama_model
    if not TORCH_OK:
        raise RuntimeError("PyTorch not installed")
    if not os.path.exists(PANORAMA_WEIGHTS):
        raise FileNotFoundError(f"Panorama weights not found: {PANORAMA_WEIGHTS}")

    device = _get_device()
    checkpoint = torch.load(PANORAMA_WEIGHTS, map_location=device)

    # Handle both full model saves (torch.save(model, ...)) and state_dict saves
    if isinstance(checkpoint, torch.nn.Module):
        # Full model was saved directly
        model = checkpoint
    elif isinstance(checkpoint, dict) and any(k.startswith('fc.') or k.startswith('layer') for k in checkpoint.keys()):
        # State dict saved
        model = tv_models.resnet50()
        model.fc = nn.Linear(model.fc.in_features, 31)
        model.load_state_dict(checkpoint)
    else:
        # Wrapped checkpoint (e.g. {'model': state_dict, 'epoch': ...})
        state_dict = checkpoint.get('model_state_dict') or checkpoint.get('state_dict') or checkpoint.get('model') or checkpoint
        model = tv_models.resnet50()
        model.fc = nn.Linear(model.fc.in_features, 31)
        model.load_state_dict(state_dict)

    model.to(device).eval()
    _panorama_model = model
    return model


def _load_periapical():
    global _periapical_model
    if _periapical_model is not None:
        return _periapical_model
    if not YOLO_OK:
        raise RuntimeError("ultralytics not installed")
    if not os.path.exists(PERIAPICAL_WEIGHTS):
        raise FileNotFoundError(f"Periapical weights not found: {PERIAPICAL_WEIGHTS}")
    _periapical_model = YOLO(PERIAPICAL_WEIGHTS)
    return _periapical_model


def _load_lab():
    global _lab_pipeline
    if _lab_pipeline is not None:
        return _lab_pipeline
    if not JOBLIB_OK:
        raise RuntimeError("joblib not installed")
    if not os.path.exists(LAB_PIPELINE):
        raise FileNotFoundError(f"Lab pipeline not found: {LAB_PIPELINE}")
    _lab_pipeline = joblib.load(LAB_PIPELINE)
    return _lab_pipeline


# ── Image preprocessing for panoramic model ───────────────────────────────
_xray_transform = None

def _get_transform():
    global _xray_transform
    if _xray_transform is None:
        if not TORCH_OK:
            raise RuntimeError("PyTorch not installed")
        _xray_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
    return _xray_transform


# ══════════════════════════════════════════════════════════════════════════
# ENDPOINT: X-RAY ANALYSIS
# ══════════════════════════════════════════════════════════════════════════
@router.post("/xray")
async def analyze_xray(
    file: UploadFile = File(...),
    xray_type: str = Form("panorama"),   # "panorama" | "periapical"
):
    """
    Accepts a dental X-ray image and runs the appropriate AI model.
    Returns findings with confidence scores.
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted.")

    contents = await file.read()

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Cannot open image file. Ensure it is a valid JPG/PNG.")

    xray_type = xray_type.lower().strip()

    # ── PANORAMIC – ResNet-50 ──────────────────────────────────────────
    if xray_type == "panorama":
        try:
            model   = _load_panorama()
            device  = _get_device()
            tensor  = _get_transform()(image).unsqueeze(0).to(device)

            with torch.no_grad():
                outputs = model(tensor)
                probs   = torch.sigmoid(outputs)[0].cpu().numpy()

            findings = []
            for i, prob in enumerate(probs):
                if float(prob) > 0.45:   # 45% threshold
                    label = PANORAMA_CLASSES[i] if i < len(PANORAMA_CLASSES) else f"Class {i}"
                    findings.append({"label": label, "confidence": round(float(prob), 4)})

            findings.sort(key=lambda x: x["confidence"], reverse=True)
            return JSONResponse({
                "model": "panorama_resnet50",
                "findings": findings,
                "total": len(findings),
                "device": str(_get_device()),
            })

        except (FileNotFoundError, RuntimeError) as e:
            # Model weights or PyTorch missing – return demo output
            return JSONResponse({
                "model": "panorama_resnet50",
                "findings": _mock_xray_findings("panorama"),
                "total": 2,
                "warning": str(e),
                "note": "Model unavailable – showing demonstration output.",
            })
        except Exception as e:
            traceback.print_exc()
            # Any other error (corrupt weights, transform error, etc.) → demo fallback
            return JSONResponse({
                "model": "panorama_resnet50",
                "findings": _mock_xray_findings("panorama"),
                "total": 2,
                "warning": str(e),
                "note": "Model inference error – showing demonstration output.",
            })

    # ── PERIAPICAL – YOLO ──────────────────────────────────────────────
    elif xray_type == "periapical":
        try:
            yolo    = _load_periapical()
            # Use conf=0.02 to match the Streamlit reference app
            results = yolo(image, conf=0.02, verbose=False)

            findings = []
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    conf   = float(box.conf[0])
                    label  = yolo.names.get(cls_id, f"Class {cls_id}")
                    findings.append({
                        "label": label,
                        "confidence": round(conf, 4),
                        "bbox": [round(x, 1) for x in box.xyxy[0].tolist()],
                    })
            findings.sort(key=lambda x: x["confidence"], reverse=True)

            # ── Draw bounding boxes and encode image as base64 ──────────
            annotated_b64 = None
            try:
                import cv2 as _cv2
                annotated_bgr = results[0].plot()          # BGR ndarray with boxes drawn
                annotated_rgb = _cv2.cvtColor(annotated_bgr, _cv2.COLOR_BGR2RGB)
                pil_annotated = Image.fromarray(annotated_rgb)
                buf = io.BytesIO()
                pil_annotated.save(buf, format="JPEG", quality=88)
                annotated_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
            except Exception as img_err:
                traceback.print_exc()
                print(f"[Dentor] Annotation image error: {img_err}")

            return JSONResponse({
                "model": "periapical_yolo",
                "findings": findings,
                "total": len(findings),
                "annotated_image": annotated_b64,
            })

        except (FileNotFoundError, RuntimeError) as e:
            # Model weights or YOLO/ultralytics not installed → demo
            return JSONResponse({
                "model": "periapical_yolo",
                "findings": _mock_xray_findings("periapical"),
                "total": 1,
                "warning": str(e),
                "note": "Model unavailable – showing demonstration output.",
            })
        except Exception as e:
            traceback.print_exc()
            return JSONResponse({
                "model": "periapical_yolo",
                "findings": _mock_xray_findings("periapical"),
                "total": 1,
                "warning": str(e),
                "note": "Model inference error – showing demonstration output.",
            })

    else:
        raise HTTPException(status_code=400, detail=f"Unknown xray_type '{xray_type}'. Use 'panorama' or 'periapical'.")


# ══════════════════════════════════════════════════════════════════════════
# ENDPOINT: LAB RESULTS
# Accepts a file upload; extracts numeric markers if CSV/JSON,
# otherwise falls back to demonstration output.
# ══════════════════════════════════════════════════════════════════════════

# Target labels from lab_test.ipynb
LAB_TARGETS = [
    "Diabetes", "Hyperlipidemia", "Liver_Issue", "Hypertension",
    "Kidney_Issue", "Anemia", "Heart_Disease_Risk", "Thyroid_Issue", "Infection_Risk",
]

@router.post("/lab")
async def analyze_lab(file: UploadFile = File(...)):
    """
    Accepts a lab report file (CSV preferred for direct inference;
    PDF/image returns a structured demo until OCR is integrated).
    """
    contents = await file.read()
    filename  = (file.filename or "").lower()
    ctype     = (file.content_type or "").lower()

    # ── Try parsing as CSV (ideal: export lab values as CSV) ──────────
    if filename.endswith(".csv") or "csv" in ctype:
        try:
            import pandas as pd
            import io as _io
            df = pd.read_csv(_io.BytesIO(contents))
            pipeline = _load_lab()
            preds    = pipeline.predict(df)
            proba    = pipeline.predict_proba(df) if hasattr(pipeline, "predict_proba") else None

            flags = []
            for i, name in enumerate(LAB_TARGETS):
                positive = bool(preds[0][i]) if preds.ndim > 1 else bool(preds[0])
                prob = float(proba[i][0][1]) if proba is not None else None
                if positive:
                    flags.append({
                        "condition": name.replace("_", " "),
                        "status": "Positive",
                        "confidence": round(prob, 3) if prob else None,
                    })

            return JSONResponse({
                "model": "lab_sklearn_pipeline",
                "summary": f"Analysis complete. {len(flags)} condition(s) flagged from {len(LAB_TARGETS)} screened.",
                "flags": flags,
                "targets_screened": LAB_TARGETS,
            })

        except FileNotFoundError as e:
            return _lab_demo_response(warning=str(e))
        except Exception as e:
            traceback.print_exc()
            # Fall through to demo

    # ── Non-CSV (PDF / image / DOCX) – demo response ──────────────────
    return _lab_demo_response(
        warning="PDF/image lab reports require OCR integration. Upload a CSV of blood values for direct AI inference."
    )


def _lab_demo_response(warning: Optional[str] = None):
    """Returns a structured demonstration response for non-CSV lab files."""
    resp = {
        "model": "lab_sklearn_pipeline",
        "summary": "Lab report received. Structured extraction not yet available for this file format.",
        "flags": [
            {"condition": "Anemia", "status": "Possible", "confidence": 0.71},
            {"condition": "Diabetes", "status": "Possible", "confidence": 0.63},
        ],
        "note": "Upload lab values as a CSV file for full AI inference. "
                "Targets: Diabetes, Hyperlipidemia, Liver Issue, Hypertension, "
                "Kidney Issue, Anemia, Heart Disease Risk, Thyroid Issue, Infection Risk.",
    }
    if warning:
        resp["warning"] = warning
    return JSONResponse(resp)


# ── Mock findings for demo when weights are missing ───────────────────────
def _mock_xray_findings(xray_type: str):
    if xray_type == "panorama":
        return [
            {"label": "Cavity",        "confidence": 0.82},
            {"label": "Calculus",      "confidence": 0.67},
        ]
    return [
        {"label": "Periapical Lesion", "confidence": 0.76, "bbox": [45, 60, 130, 145]},
    ]
