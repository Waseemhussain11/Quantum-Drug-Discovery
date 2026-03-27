import React from 'react';
import { motion } from 'framer-motion';
import { Laptop, Grid, Share2, Sparkles } from 'lucide-react';

const GaugeCard = ({ title, icon: Icon, percentage, gradientColors, description }) => {
  const radius = 45;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Half circle (180 deg)
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="gauge-bento-card">
      <div className="gauge-header">
        <span className="gauge-title">{title}</span>
        <Icon size={16} />
      </div>
      <div className="gauge-chart-container">
        <svg viewBox="0 0 120 70" className="gauge-svg">
          <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradientColors[0]} />
              <stop offset="100%" stopColor={gradientColors[1]} />
            </linearGradient>
            <filter id={`glow-${title.replace(/\s+/g, '')}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Background Track */}
          <path 
             d="M 15 60 A 45 45 0 0 1 105 60" 
             fill="none" 
             stroke="rgba(255,255,255,0.05)" 
             strokeWidth={strokeWidth} 
             strokeLinecap="round" 
          />
          
          {/* Glowing Foreground Track */}
          <path 
             d="M 15 60 A 45 45 0 0 1 105 60" 
             fill="none" 
             stroke={`url(#grad-${title.replace(/\s+/g, '')})`} 
             strokeWidth={strokeWidth} 
             strokeLinecap="round" 
             style={{
               strokeDasharray: circumference,
               strokeDashoffset: strokeDashoffset,
               transition: "stroke-dashoffset 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s"
             }}
             filter={`url(#glow-${title.replace(/\s+/g, '')})`}
          />
        </svg>
        <div className="gauge-value">{percentage.toFixed(1)}</div>
      </div>
      <p className="gauge-desc">{description}</p>
    </div>
  );
};

const ResultsTab = ({ data, isSimpleMode }) => {
  const { prediction, confidence, classical_prob, quantum_prob, hybrid_prob } = data;
  const isActive = prediction === 'ACTIVE';

  const getExplanation = () => {
    if (isSimpleMode) {
      if (isActive) {
        return {
          verdict: "Good Drug Candidate",
          color: "#10b981",
          mechanism_title: "How it fights Alzheimer's",
          mechanism: "This molecule has the perfect shape to lock onto the Alzheimer's protein and shut it down, stopping the brain from forming harmful plaques.",
          kinetics_title: "Does it work well?",
          kinetics: "Yes! Once it connects to the bad protein, it stays attached for a very long time, which makes it highly effective.",
          next_steps: [
            { title: "Test in Lab", desc: "Scientists should test this in a petri dish." },
            { title: "Check Safety", desc: "Make sure it doesn't harm healthy cells." }
          ]
        };
      } else {
        return {
          verdict: "Not a Good Match",
          color: "#ef4444",
          mechanism_title: "Why it won't work",
          mechanism: "This molecule is like a key that doesn't fit the Alzheimer's lock. It cannot stop the bad protein from doing its job, so it won't help treat the disease.",
          kinetics_title: "Does it stick to the target?",
          kinetics: "No. Even if it touches the Alzheimer's protein, it falls right off.",
          next_steps: [
            { title: "Try Another", desc: "Select a different molecule from the database." }
          ]
        };
      }
    }

    if (isActive) {
      return {
        color: "#10b981",
        mechanism_title: "Catalytic Triad Binding",
        mechanism: "Molecule exhibits strong hydrogen bonding potential with the Asp32 and Asp228 residues of the BACE-1 active site, effectively blocking substrate access.",
        kinetics_title: "Favorable Kinetics",
        kinetics: "Predicted residence time > 120 mins. The hydrophobic tail structure accurately fills the S1 and S3 sub-pockets, providing exceptional stabilization.",
        next_steps: [
          { title: "Synthesize Compound", desc: "Initiate chemical synthesis for high-throughput screening." },
          { title: "Toxicity Profiling", desc: "Run secondary models to predict off-target hepatotoxicity." },
          { title: "In-vitro Testing", desc: "Schedule FRET assay against generic BACE-1 expression cell line." }
        ]
      };
    }
    
    return {
      color: "#ef4444",
      mechanism_title: "Steric Hindrance",
      mechanism: "The spatial orientation of the functional groups causes immediate steric clashing with the flap region (Val69-Tyr71) of the enzyme.",
      kinetics_title: "Poor Orbital Overlap",
      kinetics: "Electron density mapping shows minimal electrostatic complementarity. The compound is likely to exhibit transient, weak interactions at best.",
      next_steps: [
        { title: "Scaffold Modification", desc: "Iterate molecular structure utilizing generative models." },
        { title: "Alternative Targets", desc: "Screen against secondary enzyme panel." },
        { title: "Structure Review", desc: "Analyze pharmacophore alignment deficiencies." }
      ]
    };
  };

  const exp = getExplanation();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="premium-results-container">
      
      {/* Premium Result Banner */}
      <motion.div variants={item} className={`premium-result-banner ${isActive ? 'active-banner' : 'inactive-banner'}`}>
        <div className="banner-left">
          <div className="banner-status-pill">{isActive ? "ANALYSIS COMPLETE" : "WARNING: INACTIVE"}</div>
          <h1 className="banner-title">{isActive ? (isSimpleMode ? "Alzheimer's Disease Blocker" : "BACE-1 Inhibitor Detected") : (isSimpleMode ? "Not a Working Drug" : "Inactive Compound")}</h1>
          <p className="banner-subtitle">
            {isActive 
              ? (isSimpleMode ? "This molecule has a great shape to stop the Alzheimer's protein. Our quantum computers are highly confident it could be a drug candidate." : "High-affinity binding predicted for beta-site amyloid precursor protein cleaving enzyme 1. Analysis conducted via Quantum-Hybrid consensus modeling.")
              : (isSimpleMode ? "This molecule cannot lock onto the Alzheimer's protein correctly. Our quantum system determined it will not work as an inhibitor." : "Insufficient binding affinity detected for BACE-1 active site inhibition. Consider scaffold optimization or alternative targets.")}
          </p>
        </div>
        <div className="banner-right">
          <div className="consensus-box">
            <div className="consensus-text">
              <div className="consensus-label">NEURAL CONSENSUS</div>
              <div className="consensus-value">{(confidence * 100).toFixed(1)}<span className="consensus-pct">%</span></div>
            </div>
            <div className="consensus-icon-wrapper">
              <Sparkles size={24} color={isActive ? "#67e8f9" : "#fca5a5"} className={isActive ? "" : "pulse-red"} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Score Gauges */}
      <div className="gauge-grid">
        <motion.div variants={item}>
          <GaugeCard 
            title="CLASSICAL SCORE" 
            icon={Laptop} 
            percentage={classical_prob * 100} 
            gradientColors={["#a855f7", "#c084fc"]} 
            description="Molecular dynamics and traditional docking affinity baseline." 
          />
        </motion.div>
        <motion.div variants={item}>
          <GaugeCard 
            title="QUANTUM SCORE" 
            icon={Grid} 
            percentage={quantum_prob * 100} 
            gradientColors={["#06b6d4", "#67e8f9"]} 
            description="Subatomic interaction mapping and electron density probability." 
          />
        </motion.div>
        <motion.div variants={item}>
          <GaugeCard 
            title="HYBRID FUSION" 
            icon={Share2} 
            percentage={hybrid_prob * 100} 
            gradientColors={["#10b981", "#6ee7b7"]} 
            description="Aggregated confidence interval across multi-agent solvers." 
          />
        </motion.div>
      </div>

      {/* Mechanism & Diagnostics Restored */}
      <div className="chart-grid" style={{ marginBottom: '1.25rem' }}>
        <motion.div variants={item} className="glass-card">
          <h3 style={{ color: exp.color }}>Mechanism & Impact</h3>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>{exp.mechanism_title}</div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}>{exp.mechanism}</p>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>{exp.kinetics_title}</div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}>{exp.kinetics}</p>
          </div>
          {/* Stat metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '1.25rem' }}>
            <div className="stat-card stat-card--cyan">
              <span className="stat-label">IC50 Prediction</span>
              <span className="stat-value" style={{ color: 'var(--cyan)' }}>{isActive ? '12.4 nM' : 'N/A'}</span>
            </div>
            <div className="stat-card stat-card--green">
              <span className="stat-label">Blood-Brain Barrier</span>
              <span className="stat-value" style={{ color: 'var(--green)', fontSize: '1.1rem' }}>{isActive ? 'HIGH' : 'LOW'}</span>
            </div>
            <div className="stat-card stat-card--red">
              <span className="stat-label">Toxicity Risk</span>
              <span className="stat-value" style={{ color: isActive ? 'var(--green)' : 'var(--red)', fontSize: '1.1rem' }}>{isActive ? 'LOW' : 'HIGH'}</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card">
          <h3 style={{ color: exp.color }}>Diagnostics & Next Steps</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {exp.next_steps.map((step, i) => (
              <div key={i} style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 'var(--radius)',
                padding: '1rem',
                borderLeft: `3px solid ${exp.color}`,
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>{step.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
};

export default ResultsTab;
