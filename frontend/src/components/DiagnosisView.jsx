import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  UploadCloud,
  FileImage,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  Layers,
  Eye,
  Info,
  RefreshCw,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

const DIAGNOSIS_API_URL = 'http://localhost:8001';

const STAGE_CONFIG = {
  'Non Demented': {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.4)',
    badge: 'HEALTHY / NON-DEMENTED',
    description: 'No significant neurodegenerative patterns detected in cortical or hippocampal structures relative to training baselines.',
    severity: 'Negative'
  },
  'Very Mild Demented': {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.4)',
    badge: 'STAGE 1: VERY MILD',
    description: 'Earliest identifiable subtle atrophy patterns consistent with initial mild cognitive impairment signatures.',
    severity: 'Early Warning'
  },
  'Mild Demented': {
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.4)',
    badge: 'STAGE 2: MILD DEMENTIA',
    description: 'Noticeable ventricular enlargement and characteristic bilateral temporoparietal activation features.',
    severity: 'Mild Impairment'
  },
  'Moderate Demented': {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.4)',
    badge: 'STAGE 3: MODERATE DEMENTIA',
    description: 'Marked global cerebral atrophy, widespread hippocampal volume loss, and ventricular dilation signatures.',
    severity: 'Substantial Atrophy'
  }
};

// Built-in synthetic test patterns (base64 transparent 176x176 canvas) for demo purposes if no user image
const createDemoScanBlob = (patternType) => {
  const canvas = document.createElement('canvas');
  canvas.width = 176;
  canvas.height = 176;
  const ctx = canvas.getContext('2d');
  
  // Background brain-like oval
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, 0, 176, 176);
  
  // Outer cranium
  ctx.fillStyle = '#1c2438';
  ctx.beginPath();
  ctx.ellipse(88, 88, 70, 80, 0, 0, 2 * Math.PI);
  ctx.fill();

  // Parenchyma
  ctx.fillStyle = '#3a4b6e';
  ctx.beginPath();
  ctx.ellipse(88, 88, 64, 74, 0, 0, 2 * Math.PI);
  ctx.fill();

  // Ventricles variation based on pattern
  ctx.fillStyle = '#05070f';
  if (patternType === 'normal') {
    // Slit-like ventricles
    ctx.beginPath();
    ctx.ellipse(82, 85, 4, 18, 0.1, 0, 2 * Math.PI);
    ctx.ellipse(94, 85, 4, 18, -0.1, 0, 2 * Math.PI);
    ctx.fill();
  } else if (patternType === 'moderate') {
    // Dilated ventricles
    ctx.beginPath();
    ctx.ellipse(80, 85, 12, 28, 0.2, 0, 2 * Math.PI);
    ctx.ellipse(96, 85, 12, 28, -0.2, 0, 2 * Math.PI);
    ctx.fill();
  } else {
    // Mild ventricles
    ctx.beginPath();
    ctx.ellipse(81, 85, 7, 22, 0.15, 0, 2 * Math.PI);
    ctx.ellipse(95, 85, 7, 22, -0.15, 0, 2 * Math.PI);
    ctx.fill();
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob], `${patternType}_demo_mri.png`, { type: 'image/png' }));
    }, 'image/png');
  });
};

export default function DiagnosisView() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeVizTab, setActiveVizTab] = useState('overlay'); // 'overlay', 'heatmap', 'original'
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    setError(null);
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of 5 MB.`);
      return;
    }

    // Validate extension / MIME
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png)$/i)) {
      setError('Unsupported file type. Please upload a standard JPG, JPEG, or PNG brain MRI scan.');
      return;
    }

    setSelectedFile(file);
    setResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select or upload an MRI scan first.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`${DIAGNOSIS_API_URL}/diagnosis/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 45000,
      });

      if (response.data && response.data.status === 'success') {
        setResult(response.data);
      } else {
        setError(response.data?.detail || 'Unexpected response format from diagnosis service.');
      }
    } catch (err) {
      console.error('Diagnosis error:', err);
      if (err.response) {
        setError(err.response.data?.detail || `Diagnosis error (${err.response.status}): ${err.response.statusText}`);
      } else if (err.request) {
        setError(`Unable to connect to Diagnosis Backend at ${DIAGNOSIS_API_URL}. Please confirm the service is running on port 8001.`);
      } else {
        setError(`Diagnostic request failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDemoPattern = async (type) => {
    const demoFile = await createDemoScanBlob(type);
    handleFileSelect(demoFile);
  };

  const currentStage = result?.predicted_class ? STAGE_CONFIG[result.predicted_class] : null;

  return (
    <div className="diagnosis-container" style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* ===== HEADER ===== */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(6, 182, 212, 0.4)'
          }}>
            <Brain size={22} color="var(--cyan)" />
          </div>
          <div>
            <h1 className="section-title" style={{ fontSize: '1.75rem', margin: 0, letterSpacing: '-0.5px' }}>
              Alzheimer’s Disease MRI Diagnosis
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Deep Separable-CNN Multiclass Staging & Grad-CAM Visual Explainability
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171'
            }}>
              RESEARCH USE ONLY
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              color: 'var(--cyan)'
            }}>
              PORT 8001
            </span>
          </div>
        </div>
        <div className="section-line"></div>
      </div>

      {/* ===== MANDATORY MEDICAL DISCLAIMER BANNER ===== */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem'
      }}>
        <ShieldAlert size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.8rem', lineHeight: 1.5, color: '#e2e8f0' }}>
          <strong style={{ color: '#fca5a5', display: 'block', marginBottom: '0.2rem' }}>
            RESEARCH PROTOTYPE NOTICE & CLINICAL DISCLAIMER
          </strong>
          This deep learning pipeline is an academic research demonstration trained on public MRI benchmark datasets.
          It is <strong>NOT clinically validated</strong>, regulated, or certified by any medical device authority.
          Predictions and Grad-CAM activations represent mathematical feature maps and raw softmax outputs,
          <strong> NEVER</strong> medical diagnoses, clinical findings, or therapeutic advice. Always consult board-certified neurologists.
        </div>
      </div>

      {/* ===== MAIN GRID: UPLOAD & PREVIEW / CONTROLS ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
        
        {/* LEFT CARD: DROPZONE & SAMPLE SCANS */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={18} color="var(--cyan)" />
            Input Brain MRI Scan
          </h3>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--cyan)' : 'rgba(255, 255, 255, 0.15)'}`,
              borderRadius: '12px',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? 'rgba(6, 182, 212, 0.05)' : 'rgba(0, 0, 0, 0.2)',
              transition: 'all 0.25s ease',
              marginBottom: '1rem'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            />
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem'
            }}>
              <FileImage size={26} color="var(--cyan)" />
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              Drop axial MRI scan here, or <span style={{ color: 'var(--cyan)' }}>browse files</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Supports JPG, JPEG, PNG (Max 5 MB). Preprocessed to 176×176 RGB.
            </div>
          </div>

          {/* Quick Demo Scan Selectors */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
              QUICK TEST PATTERNS (SYNTHETIC PREVIEWS):
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => loadDemoPattern('normal')}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '0.4rem 0.75rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                🔬 Demo Non-Demented
              </button>
              <button
                type="button"
                onClick={() => loadDemoPattern('mild')}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '0.4rem 0.75rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                🔬 Demo Mild Decline
              </button>
              <button
                type="button"
                onClick={() => loadDemoPattern('moderate')}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '0.4rem 0.75rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                🔬 Demo Dilated Pattern
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </motion.div>
          )}
        </div>

        {/* RIGHT CARD: SCAN PREVIEW & ACTION */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Eye size={18} color="var(--purple)" />
            Scan Acquisition Preview
          </h3>

          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#040711',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            minHeight: '220px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected MRI Scan"
                style={{
                  maxWidth: '100%',
                  maxHeight: '220px',
                  objectFit: 'contain',
                  borderRadius: '6px'
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem' }}>
                <Brain size={42} color="rgba(255, 255, 255, 0.15)" style={{ margin: '0 auto 0.5rem' }} />
                No scan loaded. Upload an image to view preview.
              </div>
            )}
          </div>

          {selectedFile && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: '0.75rem',
              padding: '0.4rem 0.6rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '6px'
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                📄 {selectedFile.name}
              </span>
              <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || loading}
            style={{
              marginTop: '1rem',
              width: '100%',
              padding: '0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: (!selectedFile || loading)
                ? 'rgba(255, 255, 255, 0.08)'
                : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '0.5px',
              cursor: (!selectedFile || loading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              boxShadow: (!selectedFile || loading) ? 'none' : '0 4px 16px rgba(6, 182, 212, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <RefreshCw size={18} />
                </motion.div>
                EXECUTING INFERENCE & GRAD-CAM...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                ANALYZE MRI SCAN
              </>
            )}
          </button>
        </div>
      </div>

      {/* ===== RESULTS SECTION ===== */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
          >
            {/* STAGE CLASSIFICATION SUMMARY CARD */}
            <div className="glass-card" style={{
              padding: '1.75rem',
              marginBottom: '1.75rem',
              background: currentStage ? currentStage.bg : 'var(--bg-card)',
              borderColor: currentStage ? currentStage.border : 'var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    color: currentStage?.color || 'var(--cyan)',
                    marginBottom: '0.25rem'
                  }}>
                    {currentStage?.badge || 'DIAGNOSTIC OUTCOME'}
                  </div>
                  <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.4rem', color: '#fff' }}>
                    {result.predicted_class}
                  </h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '650px', lineHeight: 1.5 }}>
                    {currentStage?.description}
                  </p>
                </div>

                <div style={{
                  textAlign: 'right',
                  padding: '0.75rem 1.25rem',
                  background: 'rgba(0, 0, 0, 0.35)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Model Softmax Score
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: currentStage?.color || 'var(--cyan)' }}>
                    {(result.confidence * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    Raw output activation
                  </div>
                </div>
              </div>

              {/* 4-CLASS SCORE DISTRIBUTION BARS */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  COMPLETE MULTICLASS ACTIVATION DISTRIBUTION (4 CLASSES)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  {Object.entries(result.class_scores || {}).map(([className, score]) => {
                    const isWinner = className === result.predicted_class;
                    const confColor = STAGE_CONFIG[className]?.color || 'var(--cyan)';
                    return (
                      <div
                        key={className}
                        style={{
                          background: isWinner ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)',
                          padding: '0.85rem',
                          borderRadius: '8px',
                          border: isWinner ? `1.5px solid ${confColor}` : '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: isWinner ? 700 : 500, color: isWinner ? '#fff' : 'var(--text-muted)' }}>
                            {className}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isWinner ? confColor : 'var(--text-secondary)' }}>
                            {(score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div style={{
                          height: '6px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.min(100, Math.max(0, score * 100))}%`,
                            height: '100%',
                            background: confColor,
                            borderRadius: '3px'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* GRAD-CAM EXPLAINABILITY SECTION */}
            <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={20} color="var(--cyan)" />
                    Grad-CAM Interpretability & Attention Heatmaps
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Gradient-weighted Class Activation Mapping computed from the final separable convolutional block ({result.gradcam?.target_layer || 'SeparableConv2D'})
                  </p>
                </div>

                {result.gradcam?.available && (
                  <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '8px' }}>
                    <button
                      onClick={() => setActiveVizTab('overlay')}
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: 'none',
                        background: activeVizTab === 'overlay' ? 'var(--cyan)' : 'transparent',
                        color: activeVizTab === 'overlay' ? '#020617' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      Superimposed Overlay
                    </button>
                    <button
                      onClick={() => setActiveVizTab('heatmap')}
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: 'none',
                        background: activeVizTab === 'heatmap' ? 'var(--cyan)' : 'transparent',
                        color: activeVizTab === 'heatmap' ? '#020617' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      Activation Heatmap
                    </button>
                    <button
                      onClick={() => setActiveVizTab('original')}
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: 'none',
                        background: activeVizTab === 'original' ? 'var(--cyan)' : 'transparent',
                        color: activeVizTab === 'original' ? '#020617' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      Resized Input (176×176)
                    </button>
                  </div>
                )}
              </div>

              {result.gradcam?.available ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'center' }}>
                    {/* Visualizer Display */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: '#020617',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <img
                        src={
                          activeVizTab === 'overlay'
                            ? result.gradcam.overlay_base64
                            : activeVizTab === 'heatmap'
                            ? result.gradcam.heatmap_base64
                            : result.gradcam.original_base64
                        }
                        alt="Grad-CAM Visualization"
                        style={{
                          width: '240px',
                          height: '240px',
                          objectFit: 'contain',
                          borderRadius: '8px'
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {activeVizTab === 'overlay' ? 'Blend (55% MRI + 45% Jet Heatmap)' : activeVizTab === 'heatmap' ? 'Colorized Jet Activation Map' : 'Resized Normalized MRI (176×176)'}
                      </span>
                    </div>

                    {/* Explanatory Context */}
                    <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                      <div style={{
                        background: 'rgba(6, 182, 212, 0.08)',
                        border: '1px solid rgba(6, 182, 212, 0.25)',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <strong style={{ color: 'var(--cyan)', display: 'block', marginBottom: '0.3rem' }}>
                          How to Interpret Grad-CAM Activations:
                        </strong>
                        {result.gradcam.explanation}
                      </div>

                      <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-muted)' }}>
                        <li style={{ marginBottom: '0.4rem' }}>
                          <strong>Red/Yellow warm regions:</strong> Image regions where convolutional feature maps had highest positive gradients contributing towards the <em>"{result.predicted_class}"</em> classification.
                        </li>
                        <li style={{ marginBottom: '0.4rem' }}>
                          <strong>Blue cool regions:</strong> Baseline or negligible gradient contribution.
                        </li>
                        <li>
                          <strong>Radiological Caution:</strong> Heatmap highlights reflect the neural network’s receptive field, which may include cranium or ventricle boundaries, and must not be conflated with confirmed histological amyloid plaques or tau tangles.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#fbbf24',
                  fontSize: '0.85rem'
                }}>
                  <strong>Grad-CAM Unavailable:</strong> {result.gradcam?.reason || 'Gradients could not be computed for this model configuration.'}
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                    In accordance with strict clinical AI guidelines, decorative or artificial heatmaps are never generated when genuine gradient backpropagation cannot be computed.
                  </div>
                </div>
              )}
            </div>

            {/* TECHNICAL MODEL SPECIFICATIONS */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <Info size={16} color="var(--cyan)" />
                ARCHITECTURE & AUDIT METADATA
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', fontSize: '0.8rem' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>MODEL SOURCE</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>IBM07 Multiclass CNN</div>
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>INPUT DIMENSIONS</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>176 × 176 × 3 RGB</div>
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>CONVOLUTION TYPE</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>SeparableConv2D + BN</div>
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>BENCHMARK TEST ACC</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>91.41% (AUC 0.9859)</div>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
