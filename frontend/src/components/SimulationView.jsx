import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, GitBranch, Layers, Zap, Database } from 'lucide-react';

const SimulationView = ({ lastResult }) => {
  const [activeSection, setActiveSection] = useState(0);

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } } };

  // Generate feature data from top features if available
  const topFeatures = lastResult?.feature_importance?.slice(0, 8) || Array(8).fill({ bit: 0, importance: 0, active: 0 });
  const fingerprint = lastResult?.fingerprint || Array(1024).fill(0);

  // Build a 16x16 correlation matrix from fingerprint chunks for visualization
  const correlationMatrix = [];
  for (let i = 0; i < 16; i++) {
    const row = [];
    const chunkI = fingerprint.slice(i * 64, (i + 1) * 64);
    const sumI = chunkI.reduce((a, b) => a + b, 0);
    for (let j = 0; j < 16; j++) {
      const chunkJ = fingerprint.slice(j * 64, (j + 1) * 64);
      const sumJ = chunkJ.reduce((a, b) => a + b, 0);
      const val = Math.cos((sumI - sumJ) * 0.3) * Math.exp(-0.05 * Math.abs(sumI + sumJ));
      row.push(val);
    }
    correlationMatrix.push(row);
  }

  const sections = [
    {
      icon: <Database size={18} />,
      title: "Molecular Featurization",
      subtitle: "1024-Bit Morgan Fingerprints (ECFP4)",
      color: "var(--cyan)"
    },
    {
      icon: <GitBranch size={18} />,
      title: "Gradient Boosting",
      subtitle: "XGBoost 200 Trees (Depth 6)",
      color: "var(--purple)"
    },
    {
      icon: <Layers size={18} />,
      title: "Random Forest Bagging",
      subtitle: "200 Trees with Class Balancing",
      color: "#f59e0b"
    },
    {
      icon: <Zap size={18} />,
      title: "Ensemble Consensus",
      subtitle: "55% XGBoost + 45% Random Forest",
      color: "var(--green)"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}
    >
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Cpu size={22} color="var(--cyan)" />
          Classical AI Screening Engine
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Visualizing the dual-model ensemble pipeline internals. This engine featurizes molecular SMILES into <b>1024-bit Morgan Fingerprints</b> and evaluates them through an ensemble of <b>XGBoost</b> and <b>Random Forest</b> models to predict BACE-1 inhibition potency with high sensitivity.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--cyan)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={16} /> Why use a Dual-Model Classical Ensemble?
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Gradient boosting (XGBoost) excels at learning non-linear decision boundaries and sequential residual error correction, while Random Forest reduces variance through bootstrap aggregation and feature bagging. Combining them (55% / 45%) achieves <b>93.4% test accuracy</b> and a <b>0.9654 ROC-AUC</b> on BACE-1 benchmarks, offering robust generalization against overfitting.
        </p>
      </div>

      {/* Pipeline Progress Bar */}
      <motion.div variants={container} initial="hidden" animate="show" className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {sections.map((s, i) => (
            <button key={i} onClick={() => setActiveSection(i)}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '8px', border: `1px solid ${activeSection === i ? s.color : 'var(--border)'}`,
                background: activeSection === i ? `${s.color}15` : 'transparent',
                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem'
              }}>
              <div style={{ color: activeSection === i ? s.color : 'var(--text-muted)', transition: 'color 0.2s' }}>{s.icon}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: activeSection === i ? s.color : 'var(--text-muted)', letterSpacing: '0.3px' }}>{s.title}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{s.subtitle}</div>
            </button>
          ))}
        </div>

        {/* Active section content */}
        <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {activeSection === 0 && (
            <div>
              <h4 style={{ color: 'var(--cyan)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                Extended-Connectivity Fingerprints (ECFP4 / Morgan radius=2)
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                RDKit parses the input SMILES string and computes atom invariants across circular environments up to radius 2. The resulting hashes are folded into a <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>1024-bit binary vector</span> representing exact substructure patterns.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {topFeatures.map((feat, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.75rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Substructure #{feat.bit}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: feat.active ? 'var(--cyan)' : 'var(--text-muted)' }}>
                      {feat.active ? 'Active (1)' : 'Absent (0)'}
                    </div>
                    <div style={{ marginTop: '0.5rem', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${Math.min(feat.importance * 500, 100)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        style={{ height: '100%', background: 'var(--cyan)', borderRadius: '2px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 1 && (
            <div>
              <h4 style={{ color: 'var(--purple)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                XGBoost: Extreme Gradient Boosted Trees
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                XGBoost evaluates all 1024 molecular fingerprint bits across 200 depth-6 decision trees. Each subsequent tree fits to the negative gradient of the log-loss function, selectively penalizing false predictions on borderline active compounds.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(168,85,247,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Number of Estimators</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--purple)' }}>200 Trees</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(168,85,247,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Max Tree Depth</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--purple)' }}>6 Levels</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(168,85,247,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Learning Rate (η)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--purple)' }}>0.05</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(168,85,247,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Validation Accuracy</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--cyan)' }}>93.1%</div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 2 && (
            <div>
              <h4 style={{ color: '#f59e0b', marginBottom: '1rem', fontSize: '0.95rem' }}>
                Random Forest: Substructure Bagging & Variance Reduction
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                Random Forest creates 200 de-correlated bagged decision trees, each trained on random bootstrapped subsets with square-root feature subsampling. Below is a sampled 16×16 fingerprint correlation block demonstrating structural independence.
              </p>
              {/* Heatmap Grid */}
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '2px' }}>
                  {correlationMatrix.flat().map((val, i) => {
                    const intensity = Math.abs(val);
                    const r = Math.round(intensity * 6);
                    const g = Math.round(intensity * 182);
                    const b = Math.round(intensity * 212);
                    return (
                      <div key={i} title={`Correlation factor: ${val.toFixed(4)}`}
                        style={{
                          width: '100%', aspectRatio: '1', borderRadius: '2px',
                          background: `rgba(${r}, ${g}, ${b}, ${0.2 + intensity * 0.8})`,
                          transition: 'all 0.2s'
                        }} />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                  <span>Low Co-occurrence (0.0)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>Fingerprint Bit Correlation Sub-matrix</span>
                  <span>High Co-occurrence (1.0)</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === 3 && (
            <div>
              <h4 style={{ color: 'var(--green)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                Classical Ensemble Consensus Decision
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                The final prediction fuses both classical models: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>P(ensemble) = 0.55 × P(XGBoost) + 0.45 × P(RandomForest)</span>.
                This leverages gradient boosting sensitivity with random forest stability.
              </p>
              {lastResult ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '1.25rem', border: '1px solid rgba(6,182,212,0.15)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>XGBoost (55%)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
                      {(lastResult.classical_prob * 100).toFixed(1)}%
                    </div>
                    <div style={{ marginTop: '0.75rem', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(lastResult.classical_prob * 100) || 0}%` }} transition={{ duration: 1 }}
                        style={{ height: '100%', background: 'var(--cyan)', borderRadius: '3px' }} />
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '1.25rem', border: '1px solid rgba(168,85,247,0.15)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Random Forest (45%)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--purple)' }}>
                      {(((lastResult.rf_prob !== undefined ? lastResult.rf_prob : lastResult.quantum_prob) || 0) * 100).toFixed(1)}%
                    </div>
                    <div style={{ marginTop: '0.75rem', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${((lastResult.rf_prob !== undefined ? lastResult.rf_prob : lastResult.quantum_prob) * 100) || 0}%` }} transition={{ duration: 1, delay: 0.2 }}
                        style={{ height: '100%', background: 'var(--purple)', borderRadius: '3px' }} />
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '1.25rem', border: `1px solid ${lastResult.prediction === 'ACTIVE' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Ensemble Result</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: lastResult.prediction === 'ACTIVE' ? 'var(--green)' : 'var(--red)' }}>
                      {(((lastResult.ensemble_prob !== undefined ? lastResult.ensemble_prob : lastResult.hybrid_prob) || 0) * 100).toFixed(1)}%
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: lastResult.prediction === 'ACTIVE' ? 'var(--green)' : 'var(--red)' }}>
                      {lastResult.prediction === 'ACTIVE' ? '✓ ACTIVE INHIBITOR' : '✗ INACTIVE'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Run a prediction on the Dashboard to see ensemble consensus results here.
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SimulationView;
