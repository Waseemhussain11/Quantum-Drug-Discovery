import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, Download, FlaskConical, CheckCircle2, XCircle, Search, ArrowRight } from 'lucide-react';

const HistoryView = ({ history, onSelectMolecule, onClearHistory }) => {
  const [filter, setFilter] = useState('all'); // all | pass | fail
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = history.filter(item => {
    const matchesFilter = filter === 'all' || 
      (filter === 'pass' && item.prediction === 'ACTIVE') || 
      (filter === 'fail' && item.prediction !== 'ACTIVE');
    const matchesSearch = !searchTerm || 
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.smiles.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const passCount = history.filter(h => h.prediction === 'ACTIVE').length;
  const failCount = history.length - passCount;

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum-research-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } } };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={22} color="var(--cyan)" />
            Research History
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Session log of all quantum-classical predictions
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={exportJSON} className="history-action-btn" disabled={history.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.08)', color: 'var(--cyan)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}>
            <Download size={14} /> Export JSON
          </button>
          <button onClick={onClearHistory} className="history-action-btn" disabled={history.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: 'var(--red)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}>
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{history.length}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.25rem' }}>Total Predictions</div>
        </div>
        <div className="glass-card" style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{passCount}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.25rem' }}>Active Candidates</div>
        </div>
        <div className="glass-card" style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>{failCount}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.25rem' }}>Inactive Results</div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {['all', 'pass', 'fail'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '0.5rem 1rem', border: 'none', background: filter === f ? 'rgba(6,182,212,0.15)' : 'transparent', color: filter === f ? 'var(--cyan)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'all 0.2s' }}>
              {f === 'all' ? `All (${history.length})` : f === 'pass' ? `Pass (${passCount})` : `Fail (${failCount})`}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', gap: '0.5rem' }}>
          <Search size={14} color="var(--text-muted)" />
          <input type="text" placeholder="Search history..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.8rem', outline: 'none', flex: 1, fontFamily: 'var(--font-sans)' }} />
        </div>
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <FlaskConical size={48} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>No predictions yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Go to the Dashboard and run a prediction to start building your research history.
          </p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map((entry, idx) => (
            <motion.div key={entry.timestamp + idx} variants={item}
              onClick={() => onSelectMolecule(entry)}
              className="glass-card history-item"
              style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s', borderLeft: `3px solid ${entry.prediction === 'ACTIVE' ? 'var(--green)' : 'var(--red)'}` }}>
              
              {/* Status Icon */}
              <div style={{ flexShrink: 0 }}>
                {entry.prediction === 'ACTIVE' ? 
                  <CheckCircle2 size={20} color="var(--green)" /> : 
                  <XCircle size={20} color="var(--red)" />}
              </div>

              {/* Main Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {entry.name || entry.smiles.slice(0, 40) + (entry.smiles.length > 40 ? '...' : '')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.smiles}
                </div>
              </div>

              {/* Scores */}
              <div style={{ display: 'flex', gap: '1.25rem', flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Classical</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
                    {((entry.classical_prob !== undefined ? entry.classical_prob * 100 : (entry.classical_score || 0))).toFixed(1)}%
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quantum</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--purple)' }}>
                    {((entry.quantum_prob !== undefined ? entry.quantum_prob * 100 : (entry.quantum_score || 0))).toFixed(1)}%
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hybrid</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: entry.prediction === 'ACTIVE' ? 'var(--green)' : 'var(--red)' }}>
                    {((entry.hybrid_prob !== undefined ? entry.hybrid_prob * 100 : (entry.hybrid_score || 0))).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0, minWidth: '65px', textAlign: 'right' }}>
                {entry.timestamp}
              </div>

              {/* Arrow */}
              <ArrowRight size={14} color="var(--text-muted)" style={{ flexShrink: 0, opacity: 0.5 }} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default HistoryView;
