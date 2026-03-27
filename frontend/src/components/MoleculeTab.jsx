import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const MoleculeTab = ({ data, smiles, isSimpleMode }) => {
  const viewerRef = useRef(null);
  const viewerInstance = useRef(null);
  const { lipinski, properties } = data;
  const [isSpinning, setIsSpinning] = useState(true);

  useEffect(() => {
    let script = document.querySelector('script[src="https://3dmol.org/build/3Dmol-min.js"]');
    if (!script) {
      script = document.createElement('script');
      script.src = "https://3dmol.org/build/3Dmol-min.js";
      script.async = true;
      document.body.appendChild(script);
    }
    
    const initViewer = () => {
      if (window.$3Dmol && viewerRef.current) {
        viewerRef.current.innerHTML = '';
        let viewer = window.$3Dmol.createViewer(viewerRef.current, { defaultcolors: window.$3Dmol.rasmolElementColors });
        viewerInstance.current = viewer;
        viewer.setBackgroundColor(0x0f172a, 1); // Dark navy background to match theme
        
        fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/SDF?record_type=3d`)
          .then(res => {
            if (!res.ok) throw new Error("3D Not Found");
            return res.text();
          })
          .then(sdf => {
            viewer.addModel(sdf, "sdf");
            viewer.setStyle({}, { stick: { radius: 0.15, colorscheme: 'Jmol' }, sphere: { scale: 0.3, colorscheme: 'Jmol' } });
            viewer.zoomTo();
            viewer.render();
            if (isSpinning) viewer.spin("y", 0.5);
          })
          .catch(() => {
            fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/SDF`)
              .then(r => r.text())
              .then(sdf => {
                viewer.addModel(sdf, "sdf");
                viewer.setStyle({}, { stick: { radius: 0.15, colorscheme: 'Jmol' }, sphere: { scale: 0.3, colorscheme: 'Jmol' } });
                viewer.zoomTo();
                viewer.render();
                if (isSpinning) viewer.spin("y", 0.5);
              })
              .catch(e => console.error("PubChem Fetch Error:", e));
          });
      }
    };

    if (window.$3Dmol) {
      initViewer();
    } else {
      script.addEventListener('load', initViewer);
    }
    
    return () => {
      if (script) script.removeEventListener('load', initViewer);
    };
  }, [smiles, isSpinning]); // Added isSpinning to dependencies

  const toggleSpin = () => {
    if (viewerInstance.current) {
      if (isSpinning) {
        viewerInstance.current.spin(false);
      } else {
        viewerInstance.current.spin("y", 0.5);
      }
      setIsSpinning(!isSpinning);
    }
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } } };

  // Count pass/fail - This part was removed from the original, but the instruction didn't explicitly say to remove it.
  // Re-adding it here to maintain functionality if it's used elsewhere, though the new JSX doesn't use it directly.
  // If the intention was to remove it, it should be explicitly stated.
  // For now, I'll keep it as it doesn't conflict.
  const passCount = Object.values(lipinski).filter(d => d.passed).length;
  const totalCount = Object.values(lipinski).length;
  const allPassed = passCount === totalCount;


  return (
    <motion.div variants={container} initial="hidden" animate="show" className="chart-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <motion.div variants={item} className="glass-card" style={{ height: '450px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Interactive 3D Viewer</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>WebGL Structure</span>
          </div>

          <div style={{ position: 'relative', flex: 1, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div ref={viewerRef} style={{ width: '100%', height: '100%' }}>
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Loading 3D Engine...
              </div>
            </div>

            {/* Interaction Instruction Overlay */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', pointerEvents: 'none' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>INTERACTION</div>
              <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 500 }}>Drag to Rotate • Scroll to Zoom</div>
            </div>

            {/* Play/Pause Toggle Overlay */}
            <button 
              onClick={toggleSpin}
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'var(--cyan)', border: '1px solid rgba(6, 182, 212, 0.4)', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', transition: 'all 0.2s', backdropFilter: 'blur(4px)' }}
            >
              {isSpinning ? "⏸ INTERACT" : "▶ AUTO-SPIN"}
            </button>

            {/* Atom Color Legend Overlay */}
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '1px', marginBottom: '2px' }}>ATOM LEGEND (Jmol)</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#909090' }} />
                  <span style={{ fontSize: '0.75rem', color: '#f8fafc' }}>Carbon (C)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff0d0d' }} />
                  <span style={{ fontSize: '0.75rem', color: '#f8fafc' }}>Oxygen (O)</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3050f8' }} />
                  <span style={{ fontSize: '0.75rem', color: '#f8fafc' }}>Nitrogen (N)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffff30' }} />
                  <span style={{ fontSize: '0.75rem', color: '#f8fafc' }}>Sulfur (S)</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1ff01f' }} />
                  <span style={{ fontSize: '0.75rem', color: '#f8fafc' }}>Halogens (F/Cl)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffffff' }} />
                  <span style={{ fontSize: '0.75rem', color: '#f8fafc' }}>Hydrogen (H)</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={item} className="glass-card">
          <h3>2D Topographic Map</h3>
          <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'center', border: '1px solid var(--border)' }}>
            <img src={`http://localhost:8000/api/image/${encodeURIComponent(smiles)}`} alt="2D Molecule" style={{ width: '100%', maxWidth: '350px', borderRadius: '4px', filter: 'invert(1) hue-rotate(180deg) brightness(1.5)' }} />
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <motion.div variants={item} className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>Drug-Likeness Validation</h3>
            <span className={`badge ${allPassed ? 'badge-pass' : 'badge-fail'}`}>
              {passCount}/{totalCount} PASSED
            </span>
          </div>
          {!allPassed && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: 'var(--radius)',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              ⚠️ Warning: One or more Lipinski thresholds exceeded. Consider scaffold modification to improve bioavailability.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(lipinski).map(([rule, details]) => (
              <div key={rule} style={{ 
                display: 'flex', alignItems: 'center', 
                background: 'rgba(0,0,0,0.2)', 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius)', 
                border: `1px solid ${details.passed ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}` 
              }}>
                <span className={`badge ${details.passed ? 'badge-pass' : 'badge-fail'}`} style={{ marginRight: '0.75rem', width: '28px', textAlign: 'center', fontSize: '0.7rem' }}>
                  {details.passed ? '✓' : '✗'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{rule}</div>
                </div>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: details.passed ? 'var(--green)' : 'var(--red)' }}>
                  {details.formatted}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card">
          <h3>Molecular Properties</h3>
          <div className="property-grid">
            {Object.entries(properties).map(([key, val]) => (
              <div key={key} className="property-card">
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 500 }}>{key}</p>
                <p style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.3rem 0 0 0', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{val}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MoleculeTab;
