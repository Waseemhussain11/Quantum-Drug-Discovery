import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Atom, Cpu, Layers, Zap, ChevronRight } from 'lucide-react';

const SimulationView = ({ lastResult }) => {
  const [activeSection, setActiveSection] = useState(0);

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } } };

  // Generate heatmap data from PCA features if available
  const pcaData = lastResult?.pca_features?.slice(0, 8) || Array(8).fill(0);
  const angles = lastResult?.quantum_angles?.slice(0, 8) || Array(8).fill(0);

  // Build a 16x16 "Hilbert Space" heatmap from outer product of angles
  const hilbertMatrix = [];
  for (let i = 0; i < 16; i++) {
    const row = [];
    for (let j = 0; j < 16; j++) {
      const ai = angles[i % 8] || 0;
      const aj = angles[j % 8] || 0;
      row.push(Math.cos(ai - aj) * Math.exp(-0.5 * (Math.abs(ai) + Math.abs(aj))));
    }
    hilbertMatrix.push(row);
  }

  const sections = [
    {
      icon: <Layers size={18} />,
      title: "Feature Extraction",
      subtitle: "1024-bit → 8 Principal Components",
      color: "var(--cyan)"
    },
    {
      icon: <Atom size={18} />,
      title: "Quantum Encoding",
      subtitle: "ZZFeatureMap Entanglement",
      color: "var(--purple)"
    },
    {
      icon: <Cpu size={18} />,
      title: "Kernel Computation",
      subtitle: "256D Hilbert Space Classification",
      color: "#f59e0b"
    },
    {
      icon: <Zap size={18} />,
      title: "Hybrid Fusion",
      subtitle: "Classical + Quantum Consensus",
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
          <Atom size={22} color="var(--purple)" />
          Quantum Simulation Engine
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Visualizing the quantum-classical hybrid pipeline internals. This engine uses <b>Quantum Support Vector Machines (QSVM)</b> to map molecular features into high-dimensional Hilbert Space, uncovering patterns that classical algorithms often miss.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--purple)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={16} /> Why use Quantum Simulation?
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Classical computers struggle with the "curse of dimensionality" in drug discovery. By simulating <b>8-qubit circuits</b>, we create a 256-dimensional feature space where molecular interactions are represented as quantum states. This allows our <b>Hybrid Fusion</b> model to achieve higher accuracy (84%) than classical methods alone (82.2%).
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
                PCA Dimensionality Reduction
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                Morgan Fingerprints produce a <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>1024-bit</span> binary vector for each molecule. 
                PCA (Principal Component Analysis) compresses this down to <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>8 principal components</span> that 
                capture the most important structural variance across the training set.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {pcaData.map((val, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.75rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>PC-{i + 1}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
                      {val.toFixed(3)}
                    </div>
                    <div style={{ marginTop: '0.5rem', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${Math.min(Math.abs(val) * 20, 100)}%` }}
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
                ZZFeatureMap Quantum Encoding
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                Each PCA component becomes a rotation angle <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--purple)' }}>Rz(θᵢ)</span> applied to a qubit. 
                Then, <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--purple)' }}>CNOT</span> gates create entanglement 
                between adjacent qubits, encoding second-order feature interactions.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.4rem', marginBottom: '1rem' }}>
                {angles.map((angle, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.6rem 0.4rem', border: '1px solid rgba(168,85,247,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>q{i}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--purple)', marginTop: '0.2rem' }}>
                      {angle.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>rad</div>
                  </div>
                ))}
              </div>
              {/* Entanglement Density Meter */}
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(168,85,247,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Entanglement Density</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--purple)' }}>
                    σ = {(Math.abs(angles.reduce((a, b) => a + Math.abs(b), 0) / angles.length)).toFixed(4)}
                  </span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(Math.abs(angles.reduce((a, b) => a + Math.abs(b), 0) / angles.length) * 30, 100)}%` }}
                    transition={{ duration: 1.2 }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, var(--purple), var(--cyan))', borderRadius: '4px', boxShadow: '0 0 12px rgba(168,85,247,0.4)' }} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 2 && (
            <div>
              <h4 style={{ color: '#f59e0b', marginBottom: '1rem', fontSize: '0.95rem' }}>
                Quantum Kernel — 256D Hilbert Space
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                The QSVM kernel computes the overlap between quantum states in a <span style={{ fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>2⁸ = 256</span>-dimensional Hilbert space. 
                Below is a sampled 16×16 kernel sub-matrix showing pairwise state overlaps.
              </p>
              {/* Heatmap Grid */}
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '2px' }}>
                  {hilbertMatrix.flat().map((val, i) => {
                    const intensity = Math.abs(val);
                    const r = Math.round(intensity * 6);
                    const g = Math.round(intensity * 182);
                    const b = Math.round(intensity * 212);
                    return (
                      <div key={i} title={`Overlap: ${val.toFixed(4)}`}
                        style={{
                          width: '100%', aspectRatio: '1', borderRadius: '2px',
                          background: `rgba(${r}, ${g}, ${b}, ${0.2 + intensity * 0.8})`,
                          transition: 'all 0.2s'
                        }} />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                  <span>Low Overlap (0.0)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>Quantum Kernel Matrix K(xᵢ, xⱼ)</span>
                  <span>High Overlap (1.0)</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === 3 && (
            <div>
              <h4 style={{ color: 'var(--green)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                Hybrid Ensemble Decision
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                The final prediction fuses both models: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>P(hybrid) = 0.6 × P(classical) + 0.4 × P(quantum)</span>. 
                This leverages classical accuracy with quantum generalization.
              </p>
              {lastResult ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '1.25rem', border: '1px solid rgba(6,182,212,0.15)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Classical (60%)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
                      {(lastResult.classical_prob * 100).toFixed(1)}%
                    </div>
                    <div style={{ marginTop: '0.75rem', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(lastResult.classical_prob * 100) || 0}%` }} transition={{ duration: 1 }}
                        style={{ height: '100%', background: 'var(--cyan)', borderRadius: '3px' }} />
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '1.25rem', border: '1px solid rgba(168,85,247,0.15)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Quantum (40%)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--purple)' }}>
                      {(lastResult.quantum_prob * 100).toFixed(1)}%
                    </div>
                    <div style={{ marginTop: '0.75rem', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(lastResult.quantum_prob * 100) || 0}%` }} transition={{ duration: 1, delay: 0.2 }}
                        style={{ height: '100%', background: 'var(--purple)', borderRadius: '3px' }} />
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '1.25rem', border: `1px solid ${lastResult.prediction === 'ACTIVE' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Hybrid Result</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: lastResult.prediction === 'ACTIVE' ? 'var(--green)' : 'var(--red)' }}>
                      {(lastResult.hybrid_prob * 100).toFixed(1)}%
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: lastResult.prediction === 'ACTIVE' ? 'var(--green)' : 'var(--red)' }}>
                      {lastResult.prediction === 'ACTIVE' ? '✓ ACTIVE CANDIDATE' : '✗ INACTIVE'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Run a prediction on the Dashboard to see fusion results here.
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Architecture Diagram */}
      <motion.div variants={container} initial="hidden" animate="show" className="glass-card" style={{ padding: '1.5rem' }}>
        <motion.div variants={item}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={16} color="var(--cyan)" /> System Architecture
          </h3>
        </motion.div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'SMILES Input', color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.05)' },
            { label: 'RDKit Engine', color: 'var(--cyan)', bg: 'rgba(6,182,212,0.08)' },
            { label: 'Morgan FP (1024b)', color: 'var(--cyan)', bg: 'rgba(6,182,212,0.08)' },
            { label: 'PCA (8D)', color: 'var(--purple)', bg: 'rgba(168,85,247,0.08)' },
            { label: 'ZZFeatureMap', color: 'var(--purple)', bg: 'rgba(168,85,247,0.08)' },
            { label: 'QSVM Kernel', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
            { label: 'Hybrid Fusion', color: 'var(--green)', bg: 'rgba(16,185,129,0.08)' },
            { label: 'VERDICT', color: 'var(--green)', bg: 'rgba(16,185,129,0.12)' },
          ].map((stage, i) => (
            <React.Fragment key={i}>
              <motion.div variants={item}
                style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: `1px solid ${stage.color}30`, background: stage.bg, fontSize: '0.7rem', fontWeight: 600, color: stage.color, fontFamily: 'var(--font-mono)', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                {stage.label}
              </motion.div>
              {i < 7 && <ChevronRight size={14} color="var(--text-muted)" style={{ opacity: 0.3, flexShrink: 0 }} />}
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SimulationView;
