import React, { useState, useEffect } from 'react';
import ReactPlotly from 'react-plotly.js';
const Plot = ReactPlotly.default || ReactPlotly;
import { motion, AnimatePresence } from 'framer-motion';

const QuantumSkeleton = () => {
  return (
    <motion.div 
      className="quantum-skeleton-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '0.5rem' }}
    >
      {/* Bloch Spheres Skeleton */}
      <div className="glass-card" style={{ marginBottom: '1.25rem', height: '568px' }}>
        <div className="skeleton-title skeleton-shimmer" style={{ width: '280px', height: '28px', marginBottom: '1rem' }}></div>
        <div className="skeleton-text skeleton-shimmer" style={{ width: '90%', height: '14px', marginBottom: '0.5rem' }}></div>
        <div className="skeleton-text skeleton-shimmer" style={{ width: '70%', height: '14px', marginBottom: '2rem' }}></div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer" style={{ height: '188px', borderRadius: '12px', opacity: 0.15 }}></div>
          ))}
        </div>
      </div>

      {/* Circuit Skeleton */}
      <div className="glass-card" style={{ marginBottom: '1.25rem', height: '240px' }}>
        <div className="skeleton-title skeleton-shimmer" style={{ width: '320px', height: '24px', marginBottom: '1.5rem' }}></div>
        <div className="skeleton-shimmer" style={{ height: '140px', borderRadius: 'var(--radius)', opacity: 0.1 }}></div>
      </div>

      {/* Chart Skeleton */}
      <div className="glass-card" style={{ height: '420px' }}>
        <div className="skeleton-title skeleton-shimmer" style={{ width: '400px', height: '24px', marginBottom: '1.5rem' }}></div>
        <div className="skeleton-shimmer" style={{ height: '320px', borderRadius: 'var(--radius)', opacity: 0.15 }}></div>
      </div>
    </motion.div>
  );
};

const QuantumTab = ({ data }) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const { pca_features, quantum_angles } = data;

  useEffect(() => {
    // 1.8s of 'Quantum Processing' to ensure WebGL context is ready behind the scenes
    const timer = setTimeout(() => setIsProcessing(false), 1800); 
    return () => clearTimeout(timer);
  }, []);

  const createFeatureChart = () => ({
    data: [
      {
        type: 'bar', x: Array.from({length: 8}, (_,i) => `PC ${i+1}`),
        y: pca_features.slice(0, 8),
        marker: { color: 'rgba(168, 85, 247, 0.7)', line: { color: '#a855f7', width: 1 } },
        name: 'PCA Features'
      },
      {
        type: 'bar', x: Array.from({length: 8}, (_,i) => `θ ${i+1}`),
        y: quantum_angles.slice(0, 8),
        marker: { color: 'rgba(6, 182, 212, 0.7)', line: { color: '#06b6d4', width: 1 } },
        name: 'Quantum Angles'
      }
    ],
    layout: {
      plot_bgcolor: "rgba(0,0,0,0)", paper_bgcolor: "rgba(0,0,0,0)",
      font: { color: "#64748b", family: "Space Grotesk", size: 12 },
      barmode: 'group', margin: { t: 30, l: 45, r: 20, b: 40 }, height: 300,
      legend: { orientation: 'h', y: 1.12, font: { color: '#94a3b8', size: 11 } },
      yaxis: { gridcolor: "rgba(255,255,255,0.04)", zerolinecolor: "rgba(255,255,255,0.06)" },
    }
  });

  const createSingleBloch = (angle, qubitIndex) => {
    const bx = Math.cos(angle);
    const bz = Math.sin(angle);
    const N = 80;
    const circX = Array.from({length: N + 1}, (_, i) => Math.cos(2 * Math.PI * i / N));
    const circZ = Array.from({length: N + 1}, (_, i) => Math.sin(2 * Math.PI * i / N));

    return {
      data: [
        { type: 'scattergl', mode: 'lines', x: circX, y: circZ,
          line: { color: 'rgba(6, 182, 212, 0.35)', width: 2 },
          hoverinfo: 'none', showlegend: false },
        { type: 'scattergl', mode: 'lines', x: [-1, 1], y: [0, 0],
          line: { color: 'rgba(255,255,255,0.12)', width: 1, dash: 'dot' },
          hoverinfo: 'none', showlegend: false },
        { type: 'scattergl', mode: 'lines', x: [0, 0], y: [-1, 1],
          line: { color: 'rgba(255,255,255,0.12)', width: 1, dash: 'dot' },
          hoverinfo: 'none', showlegend: false },
        { type: 'scattergl', mode: 'lines+markers',
          x: [0, bx * 0.92], y: [0, bz * 0.92],
          line: { color: '#06b6d4', width: 3.5 },
          marker: { size: [4, 12], color: ['rgba(6,182,212,0.3)', '#06b6d4'] },
          hoverinfo: 'text', hovertext: `θ = ${angle.toFixed(4)} rad`,
          showlegend: false },
        { type: 'scattergl', mode: 'markers',
          x: [bx * 0.92], y: [bz * 0.92],
          marker: { size: 20, color: 'rgba(6,182,212,0.15)' },
          hoverinfo: 'none', showlegend: false },
      ],
      layout: {
        plot_bgcolor: "rgba(0,0,0,0)", paper_bgcolor: "rgba(0,0,0,0)",
        margin: { t: 8, l: 8, r: 8, b: 8 },
        height: 180,
        xaxis: { range: [-1.65, 1.65], visible: false, scaleanchor: 'y', scaleratio: 1, fixedrange: true },
        yaxis: { range: [-1.65, 1.65], visible: false, fixedrange: true },
        annotations: [
          { text: `<b>q<sub>${qubitIndex}</sub></b>`, x: 0.05, y: 1.05, xref: 'paper', yref: 'paper',
            showarrow: false, font: { color: '#06b6d4', size: 12, family: 'JetBrains Mono' } },
          { text: '<b>|0⟩</b>', x: 0, y: 1.25, showarrow: false,
            font: { color: '#e2e8f0', size: 12, family: 'JetBrains Mono' } },
          { text: '<b>|1⟩</b>', x: 0, y: -1.25, showarrow: false,
            font: { color: '#e2e8f0', size: 12, family: 'JetBrains Mono' } },
          { text: '<b>|+⟩</b>', x: 1.25, y: 0, showarrow: false,
            font: { color: '#94a3b8', size: 10, family: 'JetBrains Mono' } },
          { text: '<b>|-⟩</b>', x: -1.25, y: 0, showarrow: false,
            font: { color: '#94a3b8', size: 10, family: 'JetBrains Mono' } },
        ],
        dragmode: false,
      }
    };
  };

  const quantumCircuit = `
     ┌───┐ ┌──────────┐                                                             
q_0: ┤ H ├─┤ Rz(θ[0]) ├──■────────────────────────────────────────────────────────■─
     ├───┤ ├──────────┤┌─┴─┐┌──────────┐                                          │ 
q_1: ┤ H ├─┤ Rz(θ[1]) ├┤ X ├┤ Rz(zz)   ├─■────────────────────────────────────────┼─
     ├───┤ ├──────────┤└───┘└──────────┘┌─┴─┐┌──────────┐                         │ 
q_2: ┤ H ├─┤ Rz(θ[2]) ├─────────────────┤ X ├┤ Rz(zz)   ├─■───────────────────────┼─
     ├───┤ ├──────────┤                 └───┘└──────────┘┌─┴─┐┌──────────┐        │ 
q_3: ┤ H ├─┤ Rz(θ[3]) ├──────────────────────────────────┤ X ├┤ Rz(zz)   ├─■──────┼─
     ├───┤ ├──────────┤                                  └───┘└──────────┘ │      ...
q_4: ...   ...                                                                    
  `;

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } } };

  return (
    <AnimatePresence mode="wait">
      {isProcessing ? (
        <QuantumSkeleton key="skeleton" />
      ) : (
        <motion.div 
          key="content"
          variants={container} 
          initial="hidden" 
          animate="show"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div variants={item} className="glass-card" style={{ marginBottom: '1.25rem' }}>
            <h3>Qubit States — Bloch Sphere Visualization</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Each qubit's state after <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>H + Rz(θ)</span> rotation shown as a vector on the Bloch sphere. The cyan arrow indicates the quantum state direction determined by the molecular feature angle.
            </p>
            <div style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem',
              background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius)', 
              padding: '1rem', border: '1px solid var(--border)' 
            }}>
              {quantum_angles.slice(0, 8).map((angle, i) => (
                <div key={i} style={{ 
                  background: 'rgba(2,6,23,0.6)', borderRadius: '10px', 
                  border: '1px solid rgba(6,182,212,0.12)', padding: '0.25rem',
                }}>
                  <Plot {...createSingleBloch(angle, i)} style={{ width: '100%' }} useResizeHandler 
                    config={{ displayModeBar: false, staticPlot: true }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
              {quantum_angles.slice(0, 8).map((angle, i) => (
                <div key={i} className="stat-card stat-card--cyan" style={{ padding: '0.6rem 0.75rem' }}>
                  <span className="stat-label">Qubit {i} Angle</span>
                  <span className="stat-value" style={{ color: 'var(--cyan)', fontSize: '0.9rem' }}>{angle.toFixed(4)} rad</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div variants={item} className="glass-card" style={{ marginBottom: '1.25rem' }}>
            <h3>Quantum Circuit Synthesis (ZZFeatureMap)</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Entangling 8 qubits via parametric <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>Rz</span> rotations mapped from molecular PCA. CNOT gates create entanglement between adjacent qubits.
            </p>
            <pre className="quantum-circuit">{quantumCircuit}</pre>
          </motion.div>
          <motion.div variants={item} className="glass-card">
            <h3>Feature Engineering: PCA Reduction & Angle Mapping [1024-bit {'→'} 8-bit]</h3>
            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius)', padding: '0.75rem', border: '1px solid var(--border)' }}>
              <Plot {...createFeatureChart()} style={{ width: '100%' }} useResizeHandler config={{ displayModeBar: false }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuantumTab;
