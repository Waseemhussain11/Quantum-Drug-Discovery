import React from 'react';
import ReactPlotly from 'react-plotly.js';
const Plot = ReactPlotly.default || ReactPlotly;
import { motion } from 'framer-motion';

const TechnicalTab = ({ data, benchmarks }) => {
  const { fingerprint, feature_importance } = data;

  const createHeatmap = () => {
    const z = [];
    for (let i = 0; i < 32; i++) {
      z.push(fingerprint.slice(i * 32, (i + 1) * 32));
    }
    return {
      data: [{
        z: z,
        type: 'heatmap',
        colorscale: [
          [0, '#020617'],
          [0.25, '#0f172a'],
          [0.5, '#136dec'],
          [0.75, '#06b6d4'],
          [1, '#a855f7']
        ],
        showscale: false,
        xgap: 1, ygap: 1
      }],
      layout: {
        plot_bgcolor: "rgba(0,0,0,0)", paper_bgcolor: "rgba(0,0,0,0)",
        margin: { t: 0, l: 0, r: 0, b: 0 }, height: 350,
        xaxis: { visible: false }, yaxis: { visible: false }
      }
    };
  };

  const createImportanceBar = () => {
    return {
      data: [{
        type: 'bar',
        x: feature_importance.map(f => `Bit ${f.bit}`),
        y: feature_importance.map(f => f.importance),
        marker: {
          color: feature_importance.map(f => f.active ? 'rgba(16, 185, 129, 0.75)' : 'rgba(239, 68, 68, 0.75)'),
          line: { color: feature_importance.map(f => f.active ? '#10b981' : '#ef4444'), width: 1 }
        }
      }],
      layout: {
        plot_bgcolor: "rgba(0,0,0,0)", paper_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#64748b", family: "Space Grotesk", size: 11 },
        margin: { t: 15, l: 50, r: 15, b: 55 }, height: 300,
        yaxis: { gridcolor: "rgba(255,255,255,0.04)", zerolinecolor: "rgba(255,255,255,0.06)" },
        xaxis: { tickangle: -45, tickfont: { size: 9 } }
      }
    };
  };

  const createBenchmarkPlot = () => {
    if (!benchmarks) return null;
    return {
      data: [
        {
          type: 'bar',
          x: benchmarks.models,
          y: benchmarks.accuracy,
          name: 'Accuracy',
          marker: {
            color: ["rgba(6, 182, 212, 0.75)", "rgba(168, 85, 247, 0.75)", "rgba(16, 185, 129, 0.75)"],
            line: { color: ['#06b6d4', '#a855f7', '#10b981'], width: 1 }
          },
          text: benchmarks.accuracy.map(v => `${v}%`),
          hoverinfo: 'none',
          textposition: 'auto',
          textfont: { color: '#f1f5f9', size: 14, family: 'JetBrains Mono' }
        }
      ],
      layout: {
        plot_bgcolor: "rgba(0,0,0,0)", paper_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#64748b", family: "Space Grotesk", size: 12 },
        margin: { t: 15, l: 50, r: 15, b: 40 }, height: 300,
        yaxis: { range: [0, 100], gridcolor: "rgba(255,255,255,0.04)", zerolinecolor: "rgba(255,255,255,0.06)" }
      }
    };
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } } };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="glass-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, marginBottom: '1rem' }}>Morgan Fingerprint Heatmap (32×32)</h3>
          <span style={{ color: 'var(--cyan)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px', fontFamily: 'var(--font-mono)' }}>1024-bit Vector Space</span>
        </div>
        <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <Plot {...createHeatmap()} style={{ width: '100%' }} useResizeHandler config={{ displayModeBar: false }} />
        </div>
      </motion.div>

      <div className="chart-grid">
        <motion.div variants={item} className="glass-card">
          <h3>Tree Node Attentions (Top 20 XGBoost)</h3>
          <Plot {...createImportanceBar()} style={{ width: '100%' }} useResizeHandler config={{ displayModeBar: false }} />
        </motion.div>

        <motion.div variants={item} className="glass-card">
          <h3>Global Benchmark (Test Set)</h3>
          {benchmarks ? (
            <Plot {...createBenchmarkPlot()} style={{ width: '100%' }} useResizeHandler config={{ displayModeBar: false }} />
          ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading benchmarks...</p>}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TechnicalTab;
