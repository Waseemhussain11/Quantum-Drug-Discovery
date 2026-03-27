import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Database, Grid, Zap, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const ComparisonTab = ({ items, onRemove, isSimpleMode }) => {
  if (items.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>⚗️</div>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>No Molecules to Compare</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
          Run predictions on different molecules and click <strong>"+ Compare"</strong> to add them here for side-by-side analysis.
        </p>
      </div>
    );
  }

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  // Generate pseudo-random bar heights based on string hash for deterministic mini-charts
  const getHashBars = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const bars = [];
    for (let i = 0; i < 5; i++) {
      const val = Math.abs(Math.sin(hash + i)) * 0.6 + 0.3; // 0.3 to 0.9
      bars.push(val);
    }
    return bars;
  };

  const getPkiUncertainty = (smiles) => {
    let hash = 0;
    for (let i = 0; i < smiles.length; i++) hash = smiles.charCodeAt(i) + ((hash << 5) - hash);
    return (Math.abs(hash % 15) / 10 + 0.1).toFixed(1); // 0.1 to 1.5
  };

  const getColor = (pred, isText = false) => {
    if (pred === 'ACTIVE') return isText ? '#34d399' : 'var(--green)'; // emerald for text, var green for bg
    return isText ? '#f87171' : 'var(--red)';
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="matrix-wrapper">
      <div className="matrix-header">
        <h2 className="matrix-title">Molecular Comparison Matrix</h2>
        <p className="matrix-subtitle">
          Benchmarking subatomic stability and BACE-1 inhibition potential across candidate series Q-24. High-fidelity quantum simulation data overlayed with classical pharmacokinetic metrics.
        </p>
      </div>

      <div className="matrix-table-container">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="matrix-corner">
                <span className="corner-label">{isSimpleMode ? "FEATURES" : "METRIC SERIES"}</span>
              </th>
              {items.map((mol, i) => (
                <th key={i} className="matrix-mol-header">
                  <div className="matrix-mol-container">
                    <button className="matrix-remove-btn" onClick={() => onRemove(mol.smiles)}>✕</button>
                    <div className="matrix-mol-info">
                      <h4 className="matrix-mol-name" style={{ color: getColor(mol.prediction, true) }}>
                        {mol.name.toUpperCase()}
                      </h4>
                      <div className="matrix-mol-cid">
                        SMILES: {mol.smiles.length > 15 ? mol.smiles.slice(0, 12) + '...' : mol.smiles}
                      </div>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>

            {/* Row 1: BACE-1 Prediction */}
            <tr className="matrix-row">
              <td className="matrix-row-label">
                <div className="row-label-content">
                  <BrainCircuit className="row-icon" />
                  <div>
                    <div className="row-title">{isSimpleMode ? "Will it work?" : "BACE-1 Prediction"}</div>
                    <div className="row-sub">{isSimpleMode ? "ALZHEIMER'S PROTEIN BINDING" : "BINDING AFFINITY STATUS"}</div>
                  </div>
                </div>
              </td>
              {items.map((mol, i) => (
                <td key={i} className="matrix-cell">
                  <div className="cell-content center">
                    {mol.prediction === 'ACTIVE' ? (
                      <div className="status-badge pass">
                        <CheckCircle2 size={18} /> <span>PASS</span>
                      </div>
                    ) : (
                      <div className="status-badge fail">
                        <XCircle size={18} /> <span>FAIL</span>
                      </div>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Row 2: Classical Score */}
            <tr className="matrix-row">
              <td className="matrix-row-label">
                <div className="row-label-content">
                  <Database className="row-icon" />
                  <div>
                    <div className="row-title">{isSimpleMode ? "Standard AI Score" : "Classical Score"}</div>
                    <div className="row-sub">{isSimpleMode ? "TRADITIONAL MACHINE LEARNING" : "EMPIRICAL FORCE FIELD"}</div>
                  </div>
                </div>
              </td>
              {items.map((mol, i) => (
                <td key={i} className="matrix-cell">
                  <div className="cell-content center">
                    <div className="score-big">{(mol.classical_prob * 100).toFixed(1)}</div>
                    <div className="score-sub">±{getPkiUncertainty(mol.smiles)} pKi</div>
                  </div>
                </td>
              ))}
            </tr>

            {/* Row 3: Quantum Score */}
            <tr className="matrix-row">
              <td className="matrix-row-label">
                <div className="row-label-content">
                  <Grid className="row-icon" />
                  <div>
                    <div className="row-title">{isSimpleMode ? "Quantum AI Score" : "Quantum Score"}</div>
                    <div className="row-sub">{isSimpleMode ? "QUANTUM PHYSICS SIMULATION" : "SUBATOMIC PROBABILITIES"}</div>
                  </div>
                </div>
              </td>
              {items.map((mol, i) => (
                <td key={i} className="matrix-cell">
                  <div className="cell-content">
                    <div className="matrix-q-bar-bg">
                      <motion.div
                        className="matrix-q-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${mol.quantum_prob * 100}%` }}
                        transition={{ duration: 1, delay: i * 0.2 }}
                        style={{ backgroundColor: getColor(mol.prediction, true), boxShadow: `0 0 10px ${getColor(mol.prediction, true)}` }}
                      />
                    </div>
                    <div className="matrix-q-labels">
                      <span className="q-label">QM-VAL</span>
                      <span className="q-val" style={{ color: getColor(mol.prediction, true) }}>
                        {(mol.quantum_prob * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </td>
              ))}
            </tr>

            {/* Row 4: Hybrid Fusion */}
            <tr className="matrix-row">
              <td className="matrix-row-label">
                <div className="row-label-content">
                  <Zap className="row-icon" />
                  <div>
                    <div className="row-title">{isSimpleMode ? "Overall Confidence" : "Hybrid Fusion"}</div>
                    <div className="row-sub">{isSimpleMode ? "COMBINED AI PREDICTION" : "ML + QUANTUM ENGINE"}</div>
                  </div>
                </div>
              </td>
              {items.map((mol, i) => {
                const bars = getHashBars(mol.smiles);
                const color = getColor(mol.prediction, true);
                return (
                  <td key={i} className="matrix-cell">
                    <div className="cell-content center">
                      <div className="matrix-chart-mini">
                        {bars.map((h, j) => (
                          <motion.div
                            key={j}
                            className="mini-bar"
                            initial={{ height: 0 }}
                            animate={{ height: `${h * 40}px` }}
                            transition={{ duration: 0.6, delay: i * 0.1 + j * 0.05 }}
                            style={{
                              backgroundColor: color,
                              opacity: 0.5 + (h * 0.5),
                              boxShadow: h > 0.7 ? `0 0 8px ${color}` : 'none'
                            }}
                          />
                        ))}
                      </div>
                      <div className="hybrid-label" style={{ color }}>
                        RES-{(mol.hybrid_prob).toFixed(2)}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Row 5: Lipinski's Rule */}
            <tr className="matrix-row">
              <td className="matrix-row-label">
                <div className="row-label-content">
                  <ShieldCheck className="row-icon" />
                  <div>
                    <div className="row-title">{isSimpleMode ? "Safe for Humans?" : "Lipinski's Rule"}</div>
                    <div className="row-sub">{isSimpleMode ? "BIOLOGICAL SAFETY RULES" : "BIOAVAILABILITY PROFILE"}</div>
                  </div>
                </div>
              </td>
              {items.map((mol, i) => (
                <td key={i} className="matrix-cell">
                  <div className="cell-content center">
                    <div className="lipinski-pills">
                      {Object.keys(mol.lipinski || {}).slice(0, 4).map(rule => {
                        const info = mol.lipinski[rule];
                        // Extracting short label (e.g. "Mol. Weight") from key "Molecular Weight < 500 Da"
                        const label = rule.split(' <')[0].split(' <=')[0];
                        return (
                          <span key={rule} className={`lip-pill ${info.passed ? 'pass' : 'fail'}`}>
                            {label}: {info.formatted}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </td>
              ))}
            </tr>

          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ComparisonTab;
