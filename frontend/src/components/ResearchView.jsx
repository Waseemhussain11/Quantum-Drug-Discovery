import React from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Sparkles, Microscope, Search, Database } from 'lucide-react';

const ResearchView = () => {
  return (
    <div className="research-coming-soon">
      <div className="research-hero-bg">
        <div className="molecular-mesh"></div>
      </div>
      
      <motion.div 
        className="research-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="research-badge">
          <FlaskConical size={14} /> RESEARCH DIVISION
        </div>
        
        <h1 className="research-title">
          The Future of <span className="gradient-text">Molecular Discovery</span>
        </h1>
        
        <p className="research-subtitle">
          Our scientists are currently synthesizing advanced quantum-hybrid models for protein folding and multi-target drug design. The research portal will provide direct access to our 10PB molecular database.
        </p>
        
        <div className="modules-grid">
          {[
            { icon: Microscope, name: "Protein Folding", status: "SIMULATING" },
            { icon: Search, name: "Scaffold Hopping", status: "OPTIMIZING" },
            { icon: Database, name: "Solvent Mapping", status: "WAITING" },
            { icon: Sparkles, name: "Generative De-Novo", status: "CODING" }
          ].map((mod, i) => (
            <motion.div 
              key={i} 
              className="research-module-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
            >
              <div className="mod-icon">
                <mod.icon size={20} />
              </div>
              <div className="mod-name">{mod.name}</div>
              <div className="mod-status">
                <span className="status-dot pulse"></span>
                {mod.status}
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="coming-soon-banner">
          <div className="banner-line"></div>
          <span className="banner-text">COMING SOON Q4 2026</span>
          <div className="banner-line"></div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .research-coming-soon {
          height: calc(100vh - 120px);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 2rem;
        }
        .research-hero-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(6, 182, 212, 0.05) 0%, transparent 70%);
          z-index: 0;
        }
        .molecular-mesh {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.03) 1px, transparent 0);
          background-size: 40px 40px;
          mask-image: linear-gradient(to bottom, black, transparent);
        }
        .research-content {
          max-width: 800px;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        .research-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--cyan);
          background: rgba(6, 182, 212, 0.1);
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 2rem;
          border: 1px solid rgba(6, 182, 212, 0.2);
        }
        .research-title {
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          line-height: 1.1;
        }
        .research-subtitle {
          font-size: 1.15rem;
          color: var(--text-secondary);
          max-width: 650px;
          margin: 0 auto 3rem;
          line-height: 1.6;
        }
        .modules-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 4rem;
        }
        .research-module-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 1.5rem 1rem;
          border-radius: var(--radius-lg);
          transition: all 0.3s ease;
        }
        .research-module-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--cyan);
          transform: translateY(-5px);
        }
        .mod-icon {
          color: var(--cyan);
          margin-bottom: 1rem;
          opacity: 0.8;
        }
        .mod-name {
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
        .mod-status {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }
        .status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--cyan);
        }
        .pulse {
          animation: status-pulse 1.5s infinite;
        }
        @keyframes status-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.4; }
          100% { transform: scale(1); opacity: 1; }
        }
        .coming-soon-banner {
          display: flex;
          align-items: center;
          gap: 2rem;
          opacity: 0.5;
        }
        .banner-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
        }
        .banner-text {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 4px;
          color: var(--text-muted);
        }
      `}} />
    </div>
  );
};

export default ResearchView;
