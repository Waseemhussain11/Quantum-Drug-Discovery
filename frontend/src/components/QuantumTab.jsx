import React, { useState, useEffect } from 'react';
import ReactPlotly from 'react-plotly.js';
const Plot = ReactPlotly.default || ReactPlotly;
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, GitBranch, Layers, BarChart3, CheckCircle2, XCircle } from 'lucide-react';

const ArchitectureSkeleton = () => {
  return (
    <motion.div 
      className="quantum-skeleton-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '0.5rem' }}
    >
      <div className="glass-card" style={{ marginBottom: '1.25rem', height: '300px' }}>
        <div className="skeleton-title skeleton-shimmer" style={{ width: '280px', height: '28px', marginBottom: '1rem' }}></div>
        <div className="skeleton-text skeleton-shimmer" style={{ width: '90%', height: '14px', marginBottom: '0.5rem' }}></div>
        <div className="skeleton-shimmer" style={{ height: '180px', borderRadius: '12px', opacity: 0.15 }}></div>
      </div>
      <div className="glass-card" style={{ height: '350px' }}>
        <div className="skeleton-title skeleton-shimmer" style={{ width: '320px', height: '24px', marginBottom: '1.5rem' }}></div>
        <div className="skeleton-shimmer" style={{ height: '240px', borderRadius: 'var(--radius)', opacity: 0.1 }}></div>
      </div>
    </motion.div>
  );
};

const QuantumTab = ({ data }) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const { pca_features, feature_importance, fingerprint, classical_prob, rf_prob, ensemble_prob } = data;

  useEffect(() => {
    const timer = setTimeout(() => setIsProcessing(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const topFeatures = (feature_importance || []).slice(0, 10);

  const createImportanceChart = () => {
    const bits = topFeatures.map(f => `Bit ${f.bit}`);
    const weights = topFeatures.map(f => f.importance);
    const colors = topFeatures.map(f => f.active ? 'rgba(6, 182, 212, 0.85)' : 'rgba(168, 85, 247, 0.5)');

    return {
      data: [
        {
          type: 'bar',
          x: bits,
          y: weights,
          marker: { color: colors, line: { color: '#06b6d4', width: 1 } },
          name: 'Feature Importance'
        }
      ],
      layout: {
        plot_bgcolor: "rgba(0,0,0,0)",
        paper_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#94a3b8", family: "Space Grotesk", size: 11 },
        margin: { t: 20, l: 45, r: 20, b: 45 },
        height: 280,
        xaxis: { tickangle: -30, gridcolor: "rgba(255,255,255,0.04)" },
        yaxis: { title: "Gini / Split Gain", gridcolor: "rgba(255,255,255,0.04)", zerolinecolor: "rgba(255,255,255,0.06)" }
      }
    };
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } } };

  // Calculate fingerprint bit density
  const fpArray = fingerprint || [];
  const activeBitsCount = fpArray.reduce((acc, bit) => acc + (bit === 1 ? 1 : 0), 0);
  const bitDensity = ((activeBitsCount / 1024) * 100).toFixed(1);

  return (
    <AnimatePresence mode="wait">
      {isProcessing ? (
        <ArchitectureSkeleton key="skeleton" />
      ) : (
        <motion.div 
          key="content"
          variants={container} 
          initial="hidden" 
          animate="show" 
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Dual Model Architecture Overview */}
          <motion.div variants={item} className="glass-card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <Cpu size={22} color="var(--cyan)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Dual-Tree Classical Ensemble Architecture</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              The BACE-1 inhibitor classifier utilizes a dual-model classical machine learning architecture: 
              <span style={{ color: 'var(--cyan)' }}> XGBoost Gradient Boosted Trees</span> coupled with 
              <span style={{ color: 'var(--purple)' }}> Scikit-Learn Random Forest</span>. Both models evaluate 
              1024-bit circular Morgan fingerprints (radius=2) to predict bioactivity.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              {/* XGBoost Spec */}
              <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <GitBranch size={16} color="var(--cyan)" />
                  <span style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: '0.9rem' }}>XGBoost Classifier</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div>• <b>Algorithm:</b> Gradient Boosting Trees</div>
                  <div>• <b>Estimators:</b> 200 trees (depth: 6)</div>
                  <div>• <b>Learning Rate:</b> 0.05</div>
                  <div>• <b>Test Accuracy:</b> 93.1%</div>
                  <div>• <b>ROC-AUC:</b> 0.9724</div>
                  <div style={{ marginTop: '0.5rem', padding: '0.4rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Model Score: </span>
                    <span style={{ color: 'var(--cyan)', fontWeight: 800 }}>{((classical_prob || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Random Forest Spec */}
              <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Layers size={16} color="var(--purple)" />
                  <span style={{ fontWeight: 700, color: 'var(--purple)', fontSize: '0.9rem' }}>Random Forest</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div>• <b>Algorithm:</b> Bagged Decision Trees</div>
                  <div>• <b>Estimators:</b> 200 trees (sqrt max features)</div>
                  <div>• <b>Class Weight:</b> Balanced Subsample</div>
                  <div>• <b>Test Accuracy:</b> 91.1%</div>
                  <div>• <b>ROC-AUC:</b> 0.9585</div>
                  <div style={{ marginTop: '0.5rem', padding: '0.4rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Model Score: </span>
                    <span style={{ color: 'var(--purple)', fontWeight: 800 }}>{(((data.rf_prob !== undefined ? data.rf_prob : data.quantum_prob) || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Ensemble Consensus Spec */}
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <BarChart3 size={16} color="var(--green)" />
                  <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.9rem' }}>Consensus Fusion</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div>• <b>Fusion Rule:</b> 0.55 × XGB + 0.45 × RF</div>
                  <div>• <b>Decision Threshold:</b> P ≥ 0.50 → Active</div>
                  <div>• <b>Ensemble Accuracy:</b> 93.4%</div>
                  <div>• <b>Ensemble ROC-AUC:</b> 0.9654</div>
                  <div>• <b>Agreement:</b> {((data.consensus_strength || 0) * 100).toFixed(1)}%</div>
                  <div style={{ marginTop: '0.5rem', padding: '0.4rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Consensus: </span>
                    <span style={{ color: 'var(--green)', fontWeight: 800 }}>{(((data.ensemble_prob !== undefined ? data.ensemble_prob : data.hybrid_prob) || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature Importance & Fingerprint Substructure Mapping */}
          <motion.div variants={item} className="glass-card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Top Discriminative Fingerprint Bits (Feature Importance)</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Cyan = Present in this molecule | Purple = Absent
              </span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius)', padding: '0.75rem', border: '1px solid var(--border)' }}>
              <Plot {...createImportanceChart()} style={{ width: '100%' }} useResizeHandler config={{ displayModeBar: false }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
              {topFeatures.map((f, i) => (
                <div key={i} style={{ 
                  background: f.active ? 'rgba(6,182,212,0.08)' : 'rgba(255,255,255,0.02)', 
                  border: `1px solid ${f.active ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '8px', padding: '0.5rem 0.6rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>Bit #{f.bit}</span>
                    {f.active ? <CheckCircle2 size={12} color="var(--cyan)" /> : <XCircle size={12} color="var(--text-muted)" />}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    Weight: <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{(f.importance * 100).toFixed(2)}%</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: f.active ? 'var(--cyan)' : 'var(--text-muted)' }}>
                    {f.active ? 'Active Substructure' : 'Inactive'}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 1024-bit Molecular Fingerprint Topology */}
          <motion.div variants={item} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>1024-Bit Morgan Circular Fingerprint (ECFP4)</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Binary vector encoding radius-2 circular chemical substructures.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bit Density: </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{bitDensity}%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> ({activeBitsCount} / 1024 bits active)</span>
              </div>
            </div>

            <div style={{ 
              background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '0.75rem', border: '1px solid var(--border)',
              display: 'grid', gridTemplateColumns: 'repeat(64, 1fr)', gap: '2px', maxHeight: '180px', overflowY: 'auto'
            }}>
              {fpArray.map((bit, idx) => (
                <div
                  key={idx}
                  title={`Bit ${idx}: ${bit === 1 ? 'ACTIVE (1)' : '0'}`}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '1px',
                    background: bit === 1 ? 'var(--cyan)' : 'rgba(255,255,255,0.05)',
                    boxShadow: bit === 1 ? '0 0 4px rgba(6,182,212,0.6)' : 'none'
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuantumTab;
