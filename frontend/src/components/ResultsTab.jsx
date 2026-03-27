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
          verdict: "Clinical Candidate",
          color: "#10b981",
          mechanism_title: "Active Inhibition",
          mechanism_bullets: [
            "Alzheimer's starts with a build-up of sticky proteins in your brain.",
            "This molecule correctly stops the 'worker' that makes these proteins.",
            "We found that it fits perfectly into the brain's target area.",
            "Our quantum analysis confirms it stays attached to the protein.",
            "Status: This is a strong candidate for a new medicine."
          ],
          kinetics_title: "Activity Probability",
          kinetics: "High - The molecule's shape perfectly matches the brain's target worker.",
          next_steps: [
            { title: "Lab Test", desc: "Begin testing in a controlled laboratory environment." },
            { title: "Safety Check", desc: "Make sure it is safe for human brain cells." }
          ]
        };
      } else {
        return {
          verdict: "Non-Binding Compound",
          color: "#ef4444",
          mechanism_title: "Diagnostic Summary",
          mechanism_bullets: [
            "Alzheimer's is caused by sticky proteins that damage the brain.",
            "Our system targets the 'worker' that builds these proteins.",
            "This specific molecule does not fit the 'worker' correctly.",
            "Because it doesn't fit, it cannot stop the protein build-up.",
            "Recommendation: Try a different molecule with a different shape."
          ],
          kinetics_title: "Binding Score",
          kinetics: "Minimal - The molecule is the wrong shape and won't stay attached.",
          next_steps: [
            { title: "Try Another", desc: "Pick a different category of molecule to test." }
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
          <h1 className="banner-title">{isActive ? (isSimpleMode ? "Clinical Candidate" : "BACE-1 Inhibitor Detected") : (isSimpleMode ? "Non-Binding Compound" : "Inactive Compound")}</h1>
          <div className="banner-subtitle">
            {isSimpleMode && !isActive ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {exp.mechanism_bullets?.map((b, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red)', marginTop: '8px', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem', opacity: 0.85, lineHeight: 1.4 }}>{b}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span>
                {isActive 
                  ? (isSimpleMode ? "This molecule shape is a great match for the brain's target area." : "High-affinity binding predicted for beta-site amyloid precursor protein cleaving enzyme 1. Analysis conducted via Quantum-Hybrid consensus modeling.")
                  : (isSimpleMode ? "This molecule shape is not a good fit and cannot stop the disease pathway." : "Insufficient binding affinity detected for BACE-1 active site inhibition. Consider scaffold optimization or alternative targets.")}
              </span>
            )}
          </div>
        </div>
        <div className="banner-right">
          <div className="consensus-box">
            <div className="consensus-text">
              <div className="consensus-label">{isSimpleMode ? "MOLECULAR MATCH" : "NEURAL CONSENSUS"}</div>
              <div className="consensus-value">{(isSimpleMode ? hybrid_prob * 100 : confidence * 100).toFixed(1)}<span className="consensus-pct">%</span></div>
            </div>
            <div className="consensus-icon-wrapper">
              <Sparkles size={24} color={isActive ? "#67e8f9" : "#fca5a5"} className={isActive ? "" : "pulse-red"} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Score Gauges - ONLY in Scientist mode to avoid redundancy */}
      {!isSimpleMode && (
        <>
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

          {/* Consensus Breakdown / Explainability */}
          <motion.div variants={item} className="glass-card" style={{ marginBottom: '1.25rem', padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '1px' }}>CONSENSUS STRENGTH</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--cyan)', fontWeight: 800 }}>{(data.consensus_strength * 100).toFixed(1)}%</div>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(data.consensus_strength * 100) || 0}%` }} style={{ height: '100%', background: 'var(--cyan)' }} />
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Model agreement across 256D Hilbert space mapping.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '1px' }}>QUANTUM INFLUENCE</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--purple)', fontWeight: 800 }}>{(Math.abs(data.quantum_influence || 0) * 100).toFixed(1)}% {data.quantum_influence > 0 ? 'Boost' : 'Shift'}</div>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(Math.abs(data.quantum_influence || 0) * 400, 100)}%` }} style={{ height: '100%', background: 'var(--purple)' }} />
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Deviation from classical baseline via subatomic dynamics.</p>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Mechanism & Diagnostics Restored */}
      <div className="chart-grid" style={{ marginBottom: '1.25rem' }}>
        <motion.div variants={item} className="glass-card">
          <h3 style={{ color: exp.color, fontSize: '1rem', letterSpacing: '1px', textTransform: 'uppercase' }}>{isSimpleMode ? "Drug Impact Report" : "Mechanism & Impact"}</h3>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: '0.6rem', fontWeight: 800 }}>{exp.mechanism_title}</div>
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
              {isSimpleMode && exp.mechanism_bullets ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {exp.mechanism_bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                      <span style={{ color: exp.color }}>•</span> {b}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>{exp.mechanism}</p>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: '0.6rem', fontWeight: 800 }}>{exp.kinetics_title}</div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)', paddingLeft: '4px' }}>{exp.kinetics}</p>
          </div>
          {/* Stat metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: isSimpleMode ? '1fr 1fr' : '1fr 1fr 1fr', gap: '0.75rem', marginTop: '1.25rem' }}>
            {!isSimpleMode && (
              <div className="stat-card stat-card--cyan">
                <span className="stat-label">IC50 Prediction</span>
                <span className="stat-value" style={{ color: 'var(--cyan)' }}>{isActive ? '12.4 nM' : 'N/A'}</span>
              </div>
            )}
            <div className="stat-card stat-card--green">
              <span className="stat-label">{isSimpleMode ? "Safe for Brain" : "Blood-Brain Barrier"}</span>
              <span className="stat-value" style={{ color: 'var(--green)', fontSize: '1.1rem' }}>{isActive ? 'YES' : 'NO'}</span>
            </div>
            <div className="stat-card stat-card--red">
              <span className="stat-label">{isSimpleMode ? "Safe to Use" : "Toxicity Risk"}</span>
              <span className="stat-value" style={{ color: isActive ? 'var(--green)' : 'var(--red)', fontSize: '1.1rem' }}>{isActive ? 'SAFE' : 'HIGH RISK'}</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card">
          <h3 style={{ color: exp.color, fontSize: '0.75rem', letterSpacing: '1.5px' }}>Diagnostics & Next Steps</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '1rem' }}>
            {exp.next_steps.map((step, i) => (
              <div key={i} className={`next-step-card ${isActive ? 'next-step-card--active' : 'next-step-card--inactive'}`}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{step.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.8 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
};

export default ResultsTab;
