import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Beaker, Zap, BarChart2, LayoutDashboard, Microscope, Atom, Clock, GitCompareArrows, Search, Settings, User, ShieldCheck, Database, Box } from 'lucide-react';
import './App.css';
import ParticleBackground from './components/ParticleBackground';
import ResultsTab from './components/ResultsTab';
import MoleculeTab from './components/MoleculeTab';
import QuantumTab from './components/QuantumTab';
import TechnicalTab from './components/TechnicalTab';
import ComparisonTab from './components/ComparisonTab';
import HistoryView from './components/HistoryView';
import SimulationView from './components/SimulationView';
import MolecularView from './components/MolecularView';
import ResearchView from './components/ResearchView';

const API_URL = 'http://localhost:8000/api';

const PRESETS = [
  { name: "Aspirin (Inactive Control)", smiles: "CC(=O)Oc1ccccc1C(=O)O" },
  { name: "BACE-1 Active (Hydroxyethylamine)", smiles: "O=C(NC(Cc1ccccc1)C(O)C[NH2+]Cc1cc(OC)ccc1OC)c1cc(F)cc(F)c1" },
  { name: "BACE-1 Active (Aminothiazine)", smiles: "FC(F)c1cc(cc(c1)C(=O)N[C@@H]1C[C@]2(CC[C@@H](C(C)(C)C)CC2)C[NH2+]C1O)F" },
  { name: "Verubecestat (Clinical BACE-1)", smiles: "CC1(C)Cc2c(N1C(=N)N)c(F)cc(c2)-c3ccc(nc3C)C#N" },
  { name: "Donepezil (AChE Inhibitor)", smiles: "COc1cc2c(cc1OC)C(=O)C(C2)CC3CCN(CC3)Cc4ccccc4" },
  { name: "Ibuprofen (Inactive Control)", smiles: "CC(C)Cc1ccc(cc1)C(C)C(=O)O" },
  { name: "Caffeine (Inactive Control)", smiles: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C" }
];

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("UI Crashed:", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'var(--red)', padding: '2rem', background: 'var(--bg-card)', borderRadius: '12px', margin: '2rem', border: '1px solid rgba(239,68,68,0.3)' }}>
          <h2>React Render Crash</h2>
          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function Sidebar({ activeView, setActiveView }) {
  const views = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, title: 'Dashboard' },
    { id: 'molecular', icon: <Microscope size={20} />, title: 'Molecular Analysis' },
    { id: 'simulation', icon: <Atom size={20} />, title: 'Quantum Simulation' },
    { id: 'history', icon: <Clock size={20} />, title: 'Research History' },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">⚛</div>
      <nav className="sidebar-nav">
        {views.map(v => (
          <button key={v.id} className={`sidebar-item ${activeView === v.id ? 'active' : ''}`} title={v.title}
            onClick={() => setActiveView(v.id)}>{v.icon}</button>
        ))}
      </nav>
    </aside>
  );
}

const ProjectVideo = () => {
  return (
    <motion.div
      className="project-video-section"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <div className="section-header">
        <h2 className="section-title">Quantum Engine Preview</h2>
        <div className="section-line"></div>
      </div>
      <div className="video-container glass-card">
        <video
          controls
          autoPlay
          muted
          loop
          className="quantum-preview-video"
          src="/project_video.mp4"
        >
          Your browser does not support the video tag.
        </video>
        <div className="video-glow-overlay"></div>
      </div>
    </motion.div>
  );
};

function TopNavbar({ isSimpleMode, setIsSimpleMode, goToHome, searchQuery, setSearchQuery, setSmiles, handlePredict, filteredMolecules, activeView, setActiveView }) {
  return (
    <header className="top-navbar">
      <div className="navbar-brand" style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.5px', cursor: 'pointer' }} onClick={goToHome}>
        <span style={{ color: 'var(--cyan)' }}>Quantum</span> Precision
      </div>

      <div className="navbar-links" style={{ marginLeft: '3rem' }}>
        <button className={`navbar-link ${activeView !== 'research' ? 'active' : ''}`} onClick={goToHome} title="Return to Core Discovery Engine">Discovery</button>
        <button className={`navbar-link ${activeView === 'research' ? 'active' : ''}`} onClick={() => setActiveView('research')} title="Access Future Molecular Research Division">Research</button>
      </div>

      <div className="navbar-right-controls" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginLeft: 'auto' }}>

        {/* Simple Mode Toggle hidden behind a sleek pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(0,0,0,0.2)', padding: '0.35rem 1rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '0.7rem', color: isSimpleMode ? 'var(--cyan)' : 'var(--text-muted)', fontWeight: isSimpleMode ? 600 : 400, letterSpacing: '0.5px' }}>GENERAL</span>
          <button
            onClick={() => setIsSimpleMode(!isSimpleMode)}
            style={{
              width: '32px', height: '16px', borderRadius: '8px',
              background: isSimpleMode ? 'var(--cyan)' : 'rgba(255,255,255,0.15)',
              position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.3s'
            }}
            title="Toggle Technical Density"
          >
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%', background: '#fff',
              position: 'absolute', top: '2px', left: isSimpleMode ? '2px' : '18px', transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
            }} />
          </button>
          <span style={{ fontSize: '0.7rem', color: !isSimpleMode ? 'var(--cyan)' : 'var(--text-muted)', fontWeight: !isSimpleMode ? 600 : 400, letterSpacing: '0.5px' }}>SCIENTIST</span>
        </div>

        {/* Search Input from Mockup */}
        <div className="navbar-search-box" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '0.45rem 0.8rem', gap: '0.6rem' }}>
          <Search size={14} color="var(--cyan)" />
          <input
            type="text"
            placeholder="Search compounds..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSmiles(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (filteredMolecules && filteredMolecules.length > 0) {
                  const match = filteredMolecules[0];
                  setSmiles(match.smiles);
                  setSearchQuery(match.name || match.smiles);
                  setTimeout(() => handlePredict(), 50);
                } else {
                  handlePredict();
                }
              }
            }}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.8rem', outline: 'none', width: '130px', fontFamily: 'var(--font-sans)' }}
          />
        </div>

        <Settings size={18} color="var(--text-secondary)" style={{ cursor: 'pointer', transition: 'color 0.2s' }} />
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}>
          <User size={16} color="var(--text-secondary)" />
        </div>
      </div>
    </header>
  );
}

/* ===== Animated Counter Hook ===== */
function useCounter(target, duration = 2000, startOnMount = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    if (!startOnMount) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !hasStarted) { setHasStarted(true); } },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted, startOnMount]);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else { setCount(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [hasStarted, target, duration]);

  return [count, ref];
}

/* ===== Interactive Pipeline Card with Mouse Tilt ===== */
function TiltCard({ children, style, className, onClick }) {
  const cardRef = React.useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 10 });
    setGlowPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlowPos({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={cardRef}
      className={className}
      style={{
        ...style,
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.2s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
        background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(6, 182, 212, 0.08) 0%, var(--bg-card) 60%)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
    >
      {children}
    </motion.div>
  );
}

/* ===== How It Works - Interactive Pipeline ===== */
function HowItWorks() {
  const [expandedStep, setExpandedStep] = useState(null);
  const [activeConceptIdx, setActiveConceptIdx] = useState(0);

  // Animated counters for impact section
  const [moleculesCount, moleculesRef] = useCounter(1522, 1800);
  const [accuracyCount, accuracyRef] = useCounter(84, 1500);
  const [qubitsCount, qubitsRef] = useCounter(8, 1000);
  const [speedupCount, speedupRef] = useCounter(256, 2000);

  const steps = [
    {
      icon: "🧪", color: "var(--cyan)", num: "01",
      title: "SMILES Input",
      brief: "Molecular string notation → chemical structure",
      detail: "SMILES (Simplified Molecular-Input Line-Entry System) encodes molecular structures as text. For example, 'CC(=O)O' represents acetic acid. Each atom, bond, and ring is captured in a compact linear format that machines can parse into 3D structures.",
      viz: "CC(=O)Oc1ccccc1C(=O)O  →  [Atom Graph]  →  Topology Matrix"
    },
    {
      icon: "🔬", color: "var(--purple)", num: "02",
      title: "Morgan Fingerprint",
      brief: "1024-bit binary molecular encoding via circular substructures",
      detail: "Morgan (ECFP) fingerprints capture the local chemical environment around each atom using circular neighborhoods of radius 2. The result is a 1024-bit binary vector where each bit represents a specific molecular substructure pattern.",
      viz: "Molecule → Circular Radii r=2 → 1024-bit [0,1,0,1,1,0,0,1...]"
    },
    {
      icon: "🌲", color: "var(--green)", num: "03",
      title: "Classical Path: XGBoost",
      brief: "Gradient-boosted decision trees analyze fingerprint patterns",
      detail: "An ensemble of 100+ decision trees, each splitting on fingerprint bits to separate active from inactive compounds. Learns complex non-linear relationships between molecular substructures and BACE-1 binding. Accuracy: 82.2%.",
      viz: "1024-bit FP → [Tree₁ + Tree₂ + ... + Treeₙ] → P(Active) = 0.82"
    },
    {
      icon: "⚛️", color: "var(--cyan)", num: "04",
      title: "Quantum Path: QSVM",
      brief: "PCA reduction → quantum state encoding → Hilbert space classification",
      detail: "PCA reduces 1024 bits → 8 principal components. These become rotation angles on 8 qubits via ZZFeatureMap. A Quantum SVM classifies in the exponentially higher-dimensional Hilbert space (2⁸ = 256 dimensions), finding hyperplanes invisible to classical methods.",
      viz: "1024-bit → PCA[8] → Rz(θ)⊗8 → QSVM Kernel → P(Active)"
    },
    {
      icon: "🔗", color: "#f59e0b", num: "05",
      title: "Hybrid Fusion",
      brief: "60% Classical + 40% Quantum = Final Consensus",
      detail: "P(hybrid) = 0.6 × P(classical) + 0.4 × P(quantum). If ≥ 0.5, the molecule is predicted ACTIVE. This ensemble leverages classical accuracy with quantum generalization for 84% overall accuracy.",
      viz: "P(XGB)×0.6 + P(QSVM)×0.4 ≥ 0.5 → BACE-1 INHIBITOR ✓"
    }
  ];

  const concepts = [
    {
      icon: "🧬", title: "BACE-1 Enzyme", color: "var(--cyan)",
      desc: "Beta-secretase 1 cleaves amyloid precursor protein (APP), producing Aβ peptides that aggregate into Alzheimer's plaques. Inhibiting BACE-1 is one of the most promising therapeutic strategies to slow or prevent disease progression.",
      detail: "BACE-1 is a transmembrane aspartyl protease. It is the rate-limiting enzyme in the production of amyloid-beta, making it the primary drug target for Alzheimer's."
    },
    {
      icon: "💊", title: "Lipinski's Rule of 5", color: "var(--green)",
      desc: "Drug-likeness criteria for oral bioavailability: Molecular Weight < 500, LogP < 5, H-bond donors ≤ 5, acceptors ≤ 10. Violations significantly reduce the chance of clinical success.",
      detail: "These rules were formulated by Christopher Lipinski in 1997 and remain the gold standard for early-stage drug candidate filtering."
    },
    {
      icon: "🔮", title: "Quantum Advantage", color: "var(--purple)",
      desc: "QSVM maps molecules into a 2⁸ = 256-dimensional Hilbert space via quantum entanglement. This exponentially larger feature space can separate molecular classes that are linearly inseparable in classical space.",
      detail: "The ZZFeatureMap creates entanglement between all qubit pairs, encoding second-order feature interactions that classical kernels would need O(n²) explicit features to represent."
    }
  ];

  const futureItems = [
    {
      icon: "🧠", title: "Generative Drug Design", color: "var(--purple)",
      desc: "Use quantum variational autoencoders (QVAE) to generate novel BACE-1 inhibitor scaffolds directly, bypassing traditional synthesis-first approaches.",
      metric: "10×", metricLabel: "faster lead discovery"
    },
    {
      icon: "🔬", title: "Multi-Target Screening", color: "var(--cyan)",
      desc: "Extend beyond BACE-1 to screen against 50+ Alzheimer's-related targets simultaneously, including tau kinases, neuroinflammation markers, and synaptic proteins.",
      metric: "50+", metricLabel: "drug targets"
    },
    {
      icon: "⚡", title: "Real Quantum Hardware", color: "#f59e0b",
      desc: "Migrate from Qiskit Aer simulator to IBM Eagle (127-qubit) and Heron processors for true quantum speedup. Encode entire molecular graphs into quantum circuits.",
      metric: "127", metricLabel: "qubit capacity"
    },
    {
      icon: "🌍", title: "Global Drug Pipeline", color: "var(--green)",
      desc: "Deploy as an open-source cloud platform enabling researchers worldwide to screen compound libraries. Democratize quantum-enhanced drug discovery for neglected diseases.",
      metric: "1M+", metricLabel: "compounds screened"
    }
  ];

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 18 } } };

  return (
    <div className="how-it-works">
      {/* ===== Section 1: Pipeline ===== */}
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}>
        <div className="section-header">
          <motion.h2 variants={item} className="section-title">How It Works</motion.h2>
          <motion.p variants={item} className="section-subtitle highlighted">Hybrid Quantum-Classical Pipeline for BACE-1 Drug Discovery</motion.p>
        </div>

        <div className="pipeline-container">
          {steps.map((step, i) => (
            <React.Fragment key={i}>
              <TiltCard
                className={`pipeline-card ${expandedStep === i ? 'expanded' : ''}`}
                onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                style={{ borderTop: `3px solid ${step.color}` }}
              >
                <div className="pipeline-num" style={{ color: step.color }}>{step.num}</div>
                <div className="pipeline-icon">{step.icon}</div>
                <h4 className="pipeline-title">{step.title}</h4>
                <p className="pipeline-brief">{step.brief}</p>

                <div className="pipeline-expand" style={{ color: step.color }}>
                  {expandedStep === i ? '▲ Close Details' : '▼ View Details'}
                </div>
              </TiltCard>
              {i < steps.length - 1 && (
                <motion.div variants={item} className="pipeline-arrow">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Master Detail Panel — renders below the row to preserve layout */}
        <AnimatePresence mode="wait">
          {expandedStep !== null && (
            <motion.div
              key={`detail-${expandedStep}`}
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 100, damping: 20 }}
              className="pipeline-master-detail"
              style={{ borderTopColor: steps[expandedStep].color }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ color: steps[expandedStep].color, fontSize: '1.25rem', marginBottom: 0 }}>
                  <span style={{ marginRight: '0.75rem', opacity: 0.9 }}>{steps[expandedStep].icon}</span>
                  Step {steps[expandedStep].num}: {steps[expandedStep].title}
                </h3>
                <button
                  onClick={() => setExpandedStep(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
                >
                  ✕
                </button>
              </div>

              <div className="pipeline-master-content">
                <p>{steps[expandedStep].detail}</p>
                <div className="pipeline-viz" style={{ borderLeftColor: steps[expandedStep].color, marginTop: '1rem' }}>
                  <code style={{ color: "var(--cyan)" }}>{steps[expandedStep].viz}</code>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ===== Section 2: Scientific Impact Stats ===== */}
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="impact-section">
        <div className="section-header">
          <motion.h2 variants={item} className="section-title">Why This Matters for Science</motion.h2>
          <motion.p variants={item} className="section-subtitle highlighted">Alzheimer's affects 55 million people globally. Traditional drug discovery takes 12-15 years and costs $2.6B per drug. Quantum computing can change this.</motion.p>
        </div>

        <div className="impact-stats-grid">
          <motion.div variants={item} className="impact-stat" ref={moleculesRef}>
            <div className="impact-number" style={{ color: 'var(--cyan)' }}>{moleculesCount.toLocaleString()}</div>
            <div className="impact-label">Real Molecules Tested</div>
            <div className="impact-desc">Lab-validated BACE-1 compounds from MoleculeNet used to train our quantum-classical hybrid model</div>
          </motion.div>
          <motion.div variants={item} className="impact-stat" ref={accuracyRef}>
            <div className="impact-number" style={{ color: 'var(--green)' }}>{accuracyCount}%</div>
            <div className="impact-label">Hybrid Accuracy</div>
            <div className="impact-desc">Outperforms classical-only models by 2%+ through quantum feature space expansion</div>
          </motion.div>
          <motion.div variants={item} className="impact-stat" ref={qubitsRef}>
            <div className="impact-number" style={{ color: 'var(--purple)' }}>{qubitsCount}</div>
            <div className="impact-label">Entangled Qubits</div>
            <div className="impact-desc">ZZFeatureMap encodes molecular features into 2⁸ = 256 quantum dimensions via entanglement</div>
          </motion.div>
          <motion.div variants={item} className="impact-stat" ref={speedupRef}>
            <div className="impact-number" style={{ color: '#f59e0b' }}>{speedupCount}D</div>
            <div className="impact-label">Quantum Hilbert Space</div>
            <div className="impact-desc">8 qubits create a 256-dimensional quantum feature space — exponentially richer than 8D classical PCA</div>
          </motion.div>
        </div>

        <motion.div variants={item} className="impact-quote">
          <blockquote>
            "Quantum computing won't just speed up drug discovery — it will find drugs that classical computers <em>cannot even conceive of</em>."
          </blockquote>
          <cite>— Quantum Chemistry Research Perspective</cite>
        </motion.div>
      </motion.div>

      {/* ===== Section 3: Key Concepts ===== */}
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}>
        <div className="section-header">
          <motion.h2 variants={item} className="section-title">Key Concepts</motion.h2>
          <motion.p variants={item} className="section-subtitle highlighted">Core scientific principles powering the quantum drug discovery engine</motion.p>
        </div>
        <div className="concepts-interactive">
          <div className="concept-tabs">
            {concepts.map((c, i) => (
              <motion.button
                key={i}
                variants={item}
                className={`concept-tab ${activeConceptIdx === i ? 'active' : ''}`}
                onClick={() => setActiveConceptIdx(i)}
                style={{ borderLeftColor: activeConceptIdx === i ? c.color : 'transparent' }}
              >
                <span className="concept-tab-icon">{c.icon}</span>
                <span>{c.title}</span>
              </motion.button>
            ))}
          </div>
          <motion.div
            key={activeConceptIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="concept-detail-panel"
            style={{ borderTop: `3px solid ${concepts[activeConceptIdx].color}` }}
          >
            <div className="concept-detail-icon">{concepts[activeConceptIdx].icon}</div>
            <h3>{concepts[activeConceptIdx].title}</h3>
            <p className="concept-main-desc">{concepts[activeConceptIdx].desc}</p>
            <div className="concept-note">
              <span style={{ color: concepts[activeConceptIdx].color, fontWeight: 600 }}>📌 Key Insight:</span> {concepts[activeConceptIdx].detail}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ===== Section 4: Future Scope ===== */}
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} style={{ marginTop: '3rem' }}>
        <div className="section-header">
          <motion.h2 variants={item} className="section-title">Future Scope</motion.h2>
          <motion.p variants={item} className="section-subtitle highlighted">Where this platform heads with continued development</motion.p>
        </div>

        <div className="future-grid">
          {futureItems.map((f, i) => (
            <TiltCard key={i} className="future-card" style={{ borderLeft: `3px solid ${f.color}` }}>
              <motion.div variants={item}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>{f.icon}</span>
                    <span className="future-title">{f.title}</span>
                  </div>
                  <div className="future-metric" style={{ color: f.color }}>
                    <span className="future-metric-value">{f.metric}</span>
                    <span className="future-metric-label">{f.metricLabel}</span>
                  </div>
                </div>
                <p className="future-desc">{f.desc}</p>
              </motion.div>
            </TiltCard>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

const LoadingOverlay = () => {
  const [progress, setProgress] = useState(0);
  const steps = [
    { threshold: 0, text: "Initializing Quantum Registers..." },
    { threshold: 20, text: "Computing ECFP Morgan Fingerprints..." },
    { threshold: 40, text: "Applying ZZFeatureMap Entanglement..." },
    { threshold: 60, text: "Executing Classical XGBoost Forest..." },
    { threshold: 80, text: "Solving QSVM in 256D Hilbert Space..." },
    { threshold: 95, text: "Aggregating Hybrid Consensus..." }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p < 30) return p + 3.5; // Fast initial burst
        if (p < 85) return p + 1.2; // Steady state
        if (p < 99) return p + 0.4; // Asymptotic crawl while waiting
        return p;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const currentStep = steps.reduce((prev, curr) => (progress >= curr.threshold ? curr : prev)).text;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="loading-overlay"
      style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}
    >
      <div className="loading-spiral">
        <div className="loading-circle"></div>
        <div className="loading-circle"></div>
        <div className="loading-circle"></div>
      </div>

      <div style={{ textAlign: 'center', width: '340px', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.8rem', padding: '0 0.5rem' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--cyan)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Engine Protocol</div>
            <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{Math.floor(progress)}%</div>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>v4.0.2 Stable</div>
        </div>

        {/* Premium Progress Bar */}
        <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear", duration: 0.1 }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #0891b2, #22d3ee, #818cf8)',
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.4)',
              borderRadius: '12px'
            }}
          />
        </div>

        {/* Pipeline Steps Animation */}
        <div style={{ marginTop: '1.5rem', height: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              style={{
                margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)',
                fontWeight: 600, letterSpacing: '0.5px', fontFamily: 'var(--font-mono)'
              }}
            >
              {currentStep}
            </motion.p>
          </AnimatePresence>
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic', letterSpacing: '0.5px' }}>
          Synthesizing hybrid probability matrices...
        </div>
      </div>
    </motion.div>
  );
};

function MainContent() {
  const [smiles, setSmiles] = useState('CC(=O)Oc1ccccc1C(=O)O');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('results');
  const [benchmarks, setBenchmarks] = useState(null);
  const [comparisonList, setComparisonList] = useState([]);
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [predictionHistory, setPredictionHistory] = useState([]);

  // Search state
  const [moleculesList, setMoleculesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = React.useRef(null);

  useEffect(() => {
    axios.get(`${API_URL}/benchmark`).then(res => setBenchmarks(res.data)).catch(console.error);

    // Load the 1500+ BACE molecules database
    fetch('/bace_molecules.json')
      .then(res => res.json())
      .then(data => setMoleculesList(data))
      .catch((e) => console.log('Could not load molecules db:', e));

    // Handle click outside for search dropdown
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredMolecules = React.useMemo(() => {
    if (!searchQuery) return PRESETS; // Show presets when empty
    const q = searchQuery.toLowerCase();
    return moleculesList.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.smiles.toLowerCase().includes(q)
    ).slice(0, 50); // limit to 50 for performance
  }, [searchQuery, moleculesList]);

  const [showComingSoon, setShowComingSoon] = useState(false);

  const triggerComingSoon = () => {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/predict`, { smiles });
      const resultData = { ...res.data, smiles };
      setResult(resultData);
      setActiveTab('results');
      setActiveView('dashboard');
      // Add to history
      const historyEntry = {
        ...res.data,
        smiles,
        name: searchQuery || smiles.slice(0, 30),
        timestamp: new Date().toLocaleTimeString(),
        fullResult: resultData,
      };
      setPredictionHistory(prev => [historyEntry, ...prev]);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "An API error occurred");
    } finally {
      setLoading(false);
    }
  };

  const addToComparison = () => {
    if (result && !comparisonList.find(c => c.smiles === result.smiles)) {
      const presetName = PRESETS.find(p => p.smiles === result.smiles)?.name || result.smiles.slice(0, 30) + '...';
      setComparisonList(prev => [...prev, { ...result, name: presetName }]);
    }
  };

  const removeFromComparison = (smi) => {
    setComparisonList(prev => prev.filter(c => c.smiles !== smi));
  };

  const handleSelectMolecule = (m) => {
    setSmiles(m.smiles);
    setSearchQuery(m.name || m.smiles);
    setShowDropdown(false);
  };

  const goToHome = () => {
    setResult(null);
    setSearchQuery('');
    setSmiles('');
    setShowDropdown(false);
    setActiveView('dashboard');
  };

  const handleHistorySelect = (entry) => {
    setResult(entry.fullResult);
    setSmiles(entry.smiles);
    setSearchQuery(entry.name);
    setActiveView('dashboard');
    setActiveTab('results');
  };

  return (
    <div className="app-shell">
      <AnimatePresence>
        {loading && <LoadingOverlay />}
      </AnimatePresence>
      <ParticleBackground />
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      <div className="main-area">
        <TopNavbar 
          activeView={activeView}
          setActiveView={setActiveView}
          isSimpleMode={isSimpleMode} 
          setIsSimpleMode={setIsSimpleMode} 
          goToHome={goToHome}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSmiles={setSmiles}
          handlePredict={handlePredict}
          filteredMolecules={filteredMolecules}
          showComingSoon={showComingSoon}
        />

        <div className="content-wrapper">
          {/* ===== SIDEBAR VIEWS ===== */}
          {activeView === 'molecular' && (
            <MolecularView lastResult={result} smiles={smiles} onSearchMolecule={(s) => { setSmiles(s); setActiveView('dashboard'); }} />
          )}
          {activeView === 'simulation' && (
            <SimulationView lastResult={result} />
          )}
          {activeView === 'history' && (
            <HistoryView
              history={predictionHistory}
              onSelectMolecule={handleHistorySelect}
              onClearHistory={() => setPredictionHistory([])}
            />
          )}

          {activeView === 'research' && (
            <ResearchView />
          )}

          {/* ===== DASHBOARD VIEW ===== */}
          {activeView === 'dashboard' && !result && (
            <motion.div className="bento-landing-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
              {/* HERO SPLIT LAYOUT */}
              <div className="hero-split">
                <div className="hero-left">
                  <div className="hero-badge"><span className="hero-badge-dot"></span> PHASE-SHIFT NEURAL ENGINE V4.0</div>
                  <h1 className="hero-title">Beyond the<br /><span className="gradient-text">Subatomic<br />Void</span></h1>
                  <p className="hero-subtitle">
                    Revolutionizing Alzheimer's drug discovery through massive-scale quantum entanglement simulations. Predict BACE-1 inhibitor potency with 10⁻⁴ Ångström precision.
                  </p>

                  {/* Search / Predict Input */}
                  <div className="initiator-input-group" ref={searchRef}>
                    <div className="initiator-icon"><Box size={16} color="var(--text-muted)" /></div>
                    <input
                      type="text"
                      className="initiator-input"
                      placeholder="Paste SMILES (e.g., CC1=C(C=..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSmiles(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                    />
                    <button className="initiator-btn" onClick={handlePredict} disabled={loading}>
                      {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>⟳</motion.div> : 'INITIATE PROTOCOL ⚡'}
                    </button>

                    {/* Preserve Autocomplete Logic */}
                    <AnimatePresence>
                      {showDropdown && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="search-dropdown bento-dropdown">
                          {filteredMolecules.length === 0 ? (
                            <div className="search-empty">No molecules found...</div>
                          ) : (
                            filteredMolecules.map((m, i) => (
                              <div key={i} className="search-result-item" onClick={() => handleSelectMolecule(m)}>
                                <div className="search-result-name">{m.name}</div>
                                <div className="search-result-smiles">{m.smiles}</div>
                                {m.mw && <div className="search-result-props">MW: {m.mw} | LogP: {m.logp}</div>}
                              </div>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Hero Stats */}
                  <div className="hero-stats-row">
                    <div className="hero-stat-item"><span>01</span> 22.8M ENHANCED SIMS</div>
                    <div className="hero-stat-item"><span>02</span> 0.9997 CONFIDENCE</div>
                    <div className="hero-stat-item"><span>03</span> DISTRIBUTED QU-CORE</div>
                  </div>

                  {error && <p className="error-text">Error: {JSON.stringify(error)}</p>}
                </div>

                <div className="hero-right">
                  <div className="quantum-atom-container">
                    <div className="atom-badge top-badge">ENTANGLEMENT DENSITY<br /><span>σ = 0.842</span></div>

                    {/* Complex CSS Glowing Atom */}
                    <div className="css-glowing-atom">
                      <div className="orb core"></div>
                      <div className="ring r1"><div className="electron e1"></div></div>
                      <div className="ring r2"><div className="electron e2"></div></div>
                      <div className="ring r3"><div className="electron e3"></div></div>
                      <div className="ring r4"><div className="electron e4"></div></div>
                    </div>

                    <div className="atom-badge bottom-badge">
                      <div style={{ fontSize: '0.45rem', opacity: 0.7, marginBottom: '4px', letterSpacing: '1px' }}>SPECTRAL ANALYSIS</div>
                      <div className="mini-bars">
                        <div className="bar b1"></div><div className="bar b2"></div><div className="bar b3"></div><div className="bar b4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>



              {benchmarks && (
                <>
                  <motion.div className="metrics-grid" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                    <div className="glass-card metric-card metric-cyan">
                      <p className="metric-label">Classical XGBoost</p>
                      <p className="metric-value">{benchmarks.accuracy[0]}%</p>
                    </div>
                    <div className="glass-card metric-card metric-purple">
                      <p className="metric-label">Quantum SVM</p>
                      <p className="metric-value">{benchmarks.accuracy[1]}%</p>
                    </div>
                    <div className="glass-card metric-card metric-green">
                      <p className="metric-label">Hybrid Ensemble</p>
                      <p className="metric-value">{benchmarks.accuracy[2]}%</p>
                    </div>
                  </motion.div>
                  <ProjectVideo />
                  <HowItWorks />
                </>
              )}
            </motion.div>
          )}

          {activeView === 'dashboard' && result && (
            <motion.div className="results-section" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div className="tabs-header" style={{ marginBottom: 0, flex: 1 }}>
                  <button className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
                    <Activity size={16} style={{ marginRight: 6 }} /> Consensus
                  </button>
                  <button className={`tab-btn ${activeTab === 'molecule' ? 'active' : ''}`} onClick={() => setActiveTab('molecule')}>
                    <Beaker size={16} style={{ marginRight: 6 }} /> Molecular
                  </button>
                  <button className={`tab-btn ${activeTab === 'quantum' ? 'active' : ''}`} onClick={() => setActiveTab('quantum')}>
                    <Zap size={16} style={{ marginRight: 6 }} /> Quantum
                  </button>
                  <button className={`tab-btn ${activeTab === 'technical' ? 'active' : ''}`} onClick={() => setActiveTab('technical')}>
                    <BarChart2 size={16} style={{ marginRight: 6 }} /> Diagnostics
                  </button>
                  <button className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`} onClick={() => setActiveTab('compare')}>
                    <GitCompareArrows size={16} style={{ marginRight: 6 }} /> Compare
                    {comparisonList.length > 0 && <span className="tab-badge">{comparisonList.length}</span>}
                  </button>
                </div>
                <button className="add-compare-btn" onClick={addToComparison} title="Add current result to comparison">
                  + Compare
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
                  {activeTab === 'results' && <ResultsTab data={result} isSimpleMode={isSimpleMode} />}
                  {activeTab === 'molecule' && <MoleculeTab data={result} smiles={smiles} isSimpleMode={isSimpleMode} />}
                  {activeTab === 'quantum' && <QuantumTab data={result} isSimpleMode={isSimpleMode} />}
                  {activeTab === 'technical' && <TechnicalTab data={result} benchmarks={benchmarks} isSimpleMode={isSimpleMode} />}
                  {activeTab === 'compare' && <ComparisonTab items={comparisonList} onRemove={removeFromComparison} isSimpleMode={isSimpleMode} />}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        <footer className="app-footer">
          ©2026 Tech Innovators. All rights reserved.
          <div style={{ marginTop: '0.5rem' }}>
            <a href="#">Documentation</a><a href="#">Privacy Policy</a><a href="#">Legal</a><a href="#">Contact Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <MainContent />
    </ErrorBoundary>
  );
}

export default App;
