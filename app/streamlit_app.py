import streamlit as st
import sys
import os
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from rdkit import Chem
from rdkit.Chem import Draw, AllChem, Descriptors
from rdkit.Chem import rdMolDescriptors
import joblib
from PIL import Image
import io
import base64

sys.path.append("src")

st.set_page_config(
    page_title="Classical AI Drug Discovery",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==========================================
# CUSTOM CSS EXTENSION
# ==========================================
st.markdown("""
<style>
    :root {
        --bg-color: #0a0a1a;
        --card-bg: rgba(22, 33, 62, 0.7);
        --cyan: #00d4ff;
        --purple: #9467bd;
        --green: #00ff88;
        --red: #ff3b30;
    }
    .stApp { background-color: var(--bg-color); color: white; }
    
    .hero-container { text-align: center; padding: 3rem 1rem; position: relative; z-index: 10; }
    .hero-title {
        font-size: 4rem; font-weight: 900;
        background: linear-gradient(90deg, var(--cyan), var(--purple), var(--green), var(--cyan));
        background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        animation: gradient-shift 8s ease infinite; margin-bottom: 0.5rem;
    }
    .hero-subtitle { font-size: 1.5rem; color: #a0aabf; margin-bottom: 2rem; }
    
    @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes pulse-glow { 0% { box-shadow: 0 0 10px rgba(0,212,255,0.2); } 50% { box-shadow: 0 0 25px rgba(0,212,255,0.6); } 100% { box-shadow: 0 0 10px rgba(0,212,255,0.2); } }
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes blink-node { 0% { opacity: 0.3; } 50% { opacity: 1; text-shadow: 0 0 10px var(--cyan); } 100% { opacity: 0.3; } }
    
    .glass-card {
        background: var(--card-bg); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(148, 103, 189, 0.3); border-radius: 16px; padding: 1.5rem; margin: 1rem 0;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .glass-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.4), 0 0 15px rgba(148,103,189,0.4); }
    
    .metric-blue { border-top: 4px solid var(--cyan); }
    .metric-purple { border-top: 4px solid var(--purple); }
    .metric-green { border-top: 4px solid var(--green); }
    .metric-value { font-size: 2.5rem; font-weight: bold; margin: 0; }
    .metric-label { color: #a0aabf; font-size: 1rem; text-transform: uppercase; letter-spacing: 1px; }
    
    .result-banner { padding: 2rem; border-radius: 16px; text-align: center; margin-bottom: 2rem; position: relative; overflow: hidden; }
    .result-active { background: linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,255,136,0.2)); border: 2px solid var(--green); box-shadow: 0 0 30px rgba(0,255,136,0.2); }
    .result-inactive { background: linear-gradient(135deg, rgba(255,59,48,0.1), rgba(255,59,48,0.2)); border: 2px solid var(--red); box-shadow: 0 0 30px rgba(255,59,48,0.2); }
    .result-title { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; }
    .result-active .result-title { color: var(--green); }
    .result-inactive .result-title { color: var(--red); }
    
    .badge { padding: 0.5rem 1rem; border-radius: 20px; font-weight: bold; display: inline-block; margin: 0.2rem; }
    .badge-pass { background: rgba(0,255,136,0.2); color: var(--green); border: 1px solid var(--green); }
    .badge-fail { background: rgba(255,59,48,0.2); color: var(--red); border: 1px solid var(--red); }
    
    .stTabs [data-baseweb="tab-list"] { gap: 2rem; background-color: transparent; }
    .stTabs [data-baseweb="tab"] { background-color: transparent; border-radius: 4px 4px 0 0; color: #a0aabf; }
    .stTabs [aria-selected="true"] { color: var(--cyan); border-bottom-color: var(--cyan) !important; }
    
    .stButton>button {
        background: linear-gradient(90deg, #1f77b4, #9467bd); color: white; border: none; border-radius: 30px;
        font-weight: bold; font-size: 1.2rem; padding: 0.75rem 2rem; transition: all 0.3s ease; animation: pulse-glow 2s infinite;
    }
    .stButton>button:hover { background: linear-gradient(90deg, #9467bd, #1f77b4); transform: scale(1.05); }
    
    .sidebar-header { color: var(--cyan); font-weight: 900; text-transform: uppercase; text-shadow: 0 0 10px rgba(0,212,255,0.5); }
    .node-pulse { display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: var(--cyan); animation: blink-node 1.5s infinite; margin-right: 8px;}
    
    .bace-card { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.5rem; margin-top: 1rem; }
</style>
""", unsafe_allow_html=True)

# Particle JS Background
st.components.v1.html("""
<canvas id="q-canvas" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; pointer-events: none;"></canvas>
<script>
    const canvas = document.getElementById('q-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    const color = 'rgba(0, 212, 255, 0.5)';
    for(let i=0; i<80; i++){
        particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5, s: Math.random()*2 });
    }
    function draw(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        for(let i=0; i<particles.length; i++){
            let p = particles[i];
            p.x += p.vx; p.y += p.vy;
            if(p.x<0||p.x>canvas.width) p.vx*=-1;
            if(p.y<0||p.y>canvas.height) p.vy*=-1;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI*2); ctx.fillStyle = color; ctx.fill();
            for(let j=i+1; j<particles.length; j++){
                let p2 = particles[j];
                let d = Math.sqrt((p2.x-p.x)**2 + (p2.y-p.y)**2);
                if(d < 150){
                    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(148, 103, 189, ${1 - d/150})`; ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw);
    }
    draw();
</script>
""", height=0)


# ==========================================
# BACKEND LOGIC
# ==========================================
@st.cache_resource
def load_models():
    xgb_model = joblib.load("models/classical_model.pkl")
    rf_model  = joblib.load("models/rf_model.pkl")
    return xgb_model, rf_model

def smiles_to_fingerprint(smiles, n_bits=1024):
    mol = Chem.MolFromSmiles(smiles)
    if mol is None: return None
    fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius=2, nBits=n_bits)
    return np.array(fp)

def get_molecule_properties(smiles):
    mol = Chem.MolFromSmiles(smiles)
    if mol is None: return None
    return {
        "Molecular Weight"    : round(Descriptors.MolWt(mol), 2),
        "LogP (Lipophilicity)": round(Descriptors.MolLogP(mol), 2),
        "H-Bond Donors"       : rdMolDescriptors.CalcNumHBD(mol),
        "H-Bond Acceptors"    : rdMolDescriptors.CalcNumHBA(mol),
        "Rotatable Bonds"     : rdMolDescriptors.CalcNumRotatableBonds(mol),
        "Aromatic Rings"      : rdMolDescriptors.CalcNumAromaticRings(mol),
        "Heavy Atoms"         : mol.GetNumHeavyAtoms(),
        "Ring Count"          : rdMolDescriptors.CalcNumRings(mol),
    }

def smiles_to_2d_image(smiles, size=(400, 300)):
    mol = Chem.MolFromSmiles(smiles)
    if mol is None: return None
    img = Draw.MolToImage(mol, size=size)
    return img

def get_3d_html(smiles):
    try:
        mol = Chem.MolFromSmiles(smiles)
        if mol is None: return None
        mol = Chem.AddHs(mol)
        AllChem.EmbedMolecule(mol, randomSeed=42)
        AllChem.MMFFOptimizeMolecule(mol)
        mol_block = Chem.MolToMolBlock(mol)
        html = f"""
        <script src="https://3dmol.org/build/3Dmol-min.js"></script>
        <div id="viewer" style="width:100%;height:400px;border-radius:12px;
             background:rgba(22, 33, 62, 0.7);border:1px solid rgba(148, 103, 189, 0.3);"></div>
        <script>
            let viewer = $3Dmol.createViewer("viewer", {{backgroundColor: "transparent"}});
            let molData = `{mol_block}`;
            viewer.addModel(molData, "mol");
            viewer.setStyle({{}}, {{
                stick: {{colorscheme: "Jmol", radius: 0.15}},
                sphere: {{colorscheme: "Jmol", scale: 0.3}}
            }});
            viewer.zoomTo(); viewer.spin(true); viewer.render();
        </script>
        """
        return html
    except:
        return None

def run_classical_prediction(smiles, xgb_model, rf_model):
    fp = smiles_to_fingerprint(smiles)
    if fp is None: return None
    fp_2d          = fp.reshape(1, -1)
    classical_prob = float(xgb_model.predict_proba(fp_2d)[0][1])
    rf_prob        = float(rf_model.predict_proba(fp_2d)[0][1])
    
    # 55% XGBoost + 45% Random Forest ensemble
    ensemble_prob  = float(0.55 * classical_prob + 0.45 * rf_prob)
    prediction     = "ACTIVE" if ensemble_prob >= 0.5 else "INACTIVE"
    confidence     = ensemble_prob if prediction == "ACTIVE" else 1.0 - ensemble_prob
    agreement      = 1.0 - abs(classical_prob - rf_prob)

    return {
        "prediction": prediction,
        "hybrid_prob": ensemble_prob,
        "ensemble_prob": ensemble_prob,
        "classical_prob": classical_prob,
        "quantum_prob": rf_prob,
        "rf_prob": rf_prob,
        "confidence": confidence,
        "consensus_strength": float(agreement),
        "fp": fp,
    }

# Backward compatibility alias
run_hybrid_prediction = run_classical_prediction

def check_lipinski(smiles):
    mol = Chem.MolFromSmiles(smiles)
    if mol is None: return None
    mw, logp = Descriptors.MolWt(mol), Descriptors.MolLogP(mol)
    hbd, hba = rdMolDescriptors.CalcNumHBD(mol), rdMolDescriptors.CalcNumHBA(mol)
    tpsa, rb = Descriptors.TPSA(mol), rdMolDescriptors.CalcNumRotatableBonds(mol)
    rules = {
        "Mol Weight < 500 Da" : (mw, mw < 500, f"{mw:.1f} Da"),
        "LogP < 5"            : (logp, logp < 5, f"{logp:.2f}"),
        "H-Bond Donors ≤ 5"   : (hbd, hbd <= 5, str(hbd)),
        "H-Bond Acc. ≤ 10"    : (hba, hba <= 10, str(hba)),
        "TPSA < 140 Å²"       : (tpsa, tpsa < 140, f"{tpsa:.1f} Å²"),
        "Rotatable Bonds ≤ 10": (rb, rb <= 10, str(rb)),
    }
    return rules, sum(1 for _, (_, ok, _) in rules.items() if ok)

def show_bace1_explanation(prediction, ensemble_prob):
    if prediction == "ACTIVE":
        return {
            "verdict": "✅ Potential BACE-1 Inhibitor", "color": "#00ff88",
            "mechanism": "This molecule shows structural features compatible with BACE-1 active site binding.",
            "impact": f"With {ensemble_prob*100:.1f}% confidence, this molecule is predicted to block BACE-1 cleavage of APP.",
            "next_steps": "Recommended for in-vitro assay testing against recombinant BACE-1 enzyme.",
            "disease": "If confirmed, could reduce toxic Amyloid-Beta production and slow Alzheimer's progression.", "icon": "🧬"
        }
    return {
        "verdict": "❌ Not a BACE-1 Inhibitor", "color": "#ff3b30",
        "mechanism": "This molecule lacks structural features required for BACE-1 active site binding.",
        "impact": f"With {(1-ensemble_prob)*100:.1f}% confidence, this molecule will NOT block BACE-1.",
        "next_steps": "Consider structural modification to improve binding affinity and pharmacophore fit.",
        "disease": "Not suitable as Alzheimer's drug candidate in current form.", "icon": "🔬"
    }

# ==========================================
# PLOTLY CHART FUNCTIONS
# ==========================================
dark_layout = dict(plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)", font=dict(color="#a0aabf"),
                   xaxis=dict(showgrid=False, zeroline=False), yaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.1)", zeroline=False))

def create_benchmark_plotly():
    models = ["Classical XGBoost", "Random Forest", "Classical Ensemble"]
    acc = [93.1, 91.1, 93.4]
    roc = [0.9724, 0.9585, 0.9654]
    colors = ["#00d4ff", "#9467bd", "#00ff88"]
    fig = make_subplots(rows=1, cols=2, subplot_titles=("Accuracy (%)", "ROC-AUC Score"))
    fig.add_trace(go.Bar(x=models, y=acc, marker_color=colors, text=[f"{v}%" for v in acc], textposition='auto'), row=1, col=1)
    fig.add_trace(go.Bar(x=models, y=roc, marker_color=colors, text=[f"{v:.4f}" for v in roc], textposition='auto'), row=1, col=2)
    fig.update_layout(**dark_layout, showlegend=False, height=400, margin=dict(t=50, l=0, r=0, b=0))
    fig.update_yaxes(range=[0, 100], row=1, col=1); fig.update_yaxes(range=[0, 1.1], row=1, col=2)
    return fig

def create_prob_chart_plotly(c_prob, rf_prob, h_prob):
    fig = go.Figure(go.Bar(x=[c_prob, rf_prob, h_prob], y=["XGBoost", "Random Forest", "Ensemble"], orientation='h', marker_color=["#00d4ff", "#9467bd", "#00ff88"], text=[f"{v*100:.1f}%" for v in [c_prob, rf_prob, h_prob]], textposition='auto'))
    fig.add_vline(x=0.5, line_dash="dash", line_color="#ff3b30", annotation_text="Threshold (0.5)")
    fig.update_layout(**dark_layout, xaxis_title="Probability", xaxis_range=[0,1], height=250, margin=dict(t=20, l=0, r=0, b=0))
    return fig

def create_gauge_plotly(val, title, color):
    fig = go.Figure(go.Indicator(
        mode="gauge+number", value=val * 100, title={'text': title, 'font': {'color': 'white'}}, number={'suffix': "%", 'font': {'color': color}},
        gauge={'axis': {'range': [0, 100], 'tickcolor': "white"}, 'bar': {'color': color}, 'bgcolor': "rgba(255,255,255,0.1)",
               'steps': [{'range': [0, 50], 'color': "rgba(255,59,48,0.2)"}, {'range': [50, 100], 'color': "rgba(0,255,136,0.2)"}],
               'threshold': {'line': {'color': "white", 'width': 2}, 'thickness': 0.75, 'value': 50}}
    ))
    fig.update_layout(**dark_layout, height=250, margin=dict(t=50, l=20, r=20, b=20))
    return fig

def create_heatmap_plotly(fp):
    fig = go.Figure(data=go.Heatmap(z=fp.reshape(32, 32), colorscale="Plasma", showscale=False, hoverinfo="none", xgap=1, ygap=1))
    fig.update_layout(**dark_layout, xaxis_visible=False, yaxis_visible=False, height=400, margin=dict(t=0, l=0, r=0, b=0))
    return fig

def create_feature_importance_plotly(xgb_model, fp):
    importances = xgb_model.feature_importances_
    top_idx = np.argsort(importances)[::-1][:20]
    top_imp = importances[top_idx]
    mol_bits = fp[top_idx]
    colors = ["#00ff88" if bit == 1 else "#ff3b30" for bit in mol_bits]
    fig = go.Figure(go.Bar(x=[f"Bit {i}" for i in top_idx], y=top_imp, marker_color=colors))
    fig.update_layout(**dark_layout, height=350, margin=dict(t=20, l=0, r=0, b=0))
    return fig

def create_dual_feature_plotly(xgb_model, rf_model):
    xgb_imp = xgb_model.feature_importances_
    rf_imp = rf_model.feature_importances_
    top_idx = np.argsort(xgb_imp)[::-1][:10]
    fig = make_subplots(rows=1, cols=2, subplot_titles=("XGBoost Top 10 Bits", "Random Forest Top 10 Bits"))
    fig.add_trace(go.Bar(x=[f"Bit {i}" for i in top_idx], y=xgb_imp[top_idx], marker_color="#00d4ff"), row=1, col=1)
    fig.add_trace(go.Bar(x=[f"Bit {i}" for i in top_idx], y=rf_imp[top_idx], marker_color="#9467bd"), row=1, col=2)
    fig.update_layout(**dark_layout, showlegend=False, height=350, margin=dict(t=50, l=0, r=0, b=0))
    return fig

# ==========================================
# SIDEBAR
# ==========================================
with st.sidebar:
    st.markdown("<div style='text-align:center;'><h1 class='sidebar-header'>🧪 Classical AI Lab</h1></div>", unsafe_allow_html=True)
    st.markdown("""
    <div class="glass-card" style="padding: 1rem;">
    <div class="node-pulse"></div> <b>System Status:</b> Online<br><br>
    • <b>Architecture:</b> Dual Tree Ensemble<br>
    • <b>Model 1:</b> XGBoost Classifier<br>
    • <b>Model 2:</b> Random Forest Classifier<br>
    • <b>Features:</b> 1024-bit Morgan Fingerprints
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("<h3 class='sidebar-header'>💊 Molecule Selector</h3>", unsafe_allow_html=True)
    examples = {
        "Aspirin": "CC(=O)Oc1ccccc1C(=O)O", "Ibuprofen": "CC(C)Cc1ccc(cc1)C(C)C(=O)O", "Caffeine": "Cn1c(=O)c2c(ncn2C)n(c1=O)C", "Known BACE-1 Inhibitor": "Fc1ncccc1-c1cc(ccc1)C1(N=C(N2C1=NCC(F)(F)C2)N)c1ccc(OC(F)F)cc1"
    }
    selected = st.selectbox("Select example:", list(examples.keys()), label_visibility="collapsed")
    example_smiles = examples[selected]
    
    # VisualThumbnail
    img_thumb = smiles_to_2d_image(example_smiles, size=(200, 150))
    if img_thumb: st.image(img_thumb, use_container_width=True)
    
    st.markdown("<div style='text-align:center; color:#666; font-size:0.8rem; margin-top:2rem;'>ChEMBL BACE Dataset • 1,513 curated compounds</div>", unsafe_allow_html=True)

# ==========================================
# MAIN APP
# ==========================================
st.markdown("""
<div class="hero-container">
    <div style="font-size: 5rem; animation: spin-slow 10s linear infinite; display: inline-block;">🧬</div>
    <div class="hero-title">Classical AI Drug Discovery</div>
    <div class="hero-subtitle">Alzheimer's BACE-1 Inhibitor Prediction via Advanced Classical ML Ensemble</div>
</div>
""", unsafe_allow_html=True)

col1, col2, col3 = st.columns([1, 4, 1])
with col2:
    st.markdown("<p style='text-align: center; font-weight: bold; color: var(--cyan);'>ENTER MOLECULE SMILES</p>", unsafe_allow_html=True)
    smiles_input = st.text_input("", value=example_smiles, label_visibility="collapsed")
    _, c_btn, _ = st.columns([1, 1, 1])
    with c_btn: predict_btn = st.button("RUN PREDICTION 🚀", use_container_width=True)

if predict_btn and smiles_input:
    mol = Chem.MolFromSmiles(smiles_input)
    if mol is None: st.error("❌ Invalid SMILES!")
    else:
        with st.spinner("🔄 Running Classical Ensemble Pipeline..."):
            xgb, rf = load_models()
            res = run_classical_prediction(smiles_input, xgb, rf)
            
        if not res: st.stop()
            
        tab_res, tab_mol, tab_ens, tab_tech = st.tabs(["🎯 Results", "🧪 Molecule", "🌲 Tree Ensemble", "📊 Diagnostics"])
        
        with tab_res:
            exp = show_bace1_explanation(res["prediction"], res["hybrid_prob"])
            cls_name = "result-active" if res["prediction"] == "ACTIVE" else "result-inactive"
            st.markdown(f"""
            <div class="result-banner {cls_name}">
                <div style="font-size: 3rem;">{exp['icon']}</div>
                <div class="result-title">{exp['verdict']}</div>
                <div style="font-size: 1.2rem; color: #fff;">Ensemble Confidence: <b>{res['confidence']*100:.1f}%</b></div>
            </div>
            """, unsafe_allow_html=True)
            
            c_exp1, c_exp2 = st.columns(2)
            c_exp1.markdown(f"<div class='bace-card'><h4 style='color:{exp['color']}'>Mechanism & Impact</h4><p>{exp['mechanism']}</p><p>{exp['impact']}</p></div>", unsafe_allow_html=True)
            c_exp2.markdown(f"<div class='bace-card'><h4 style='color:{exp['color']}'>Next Steps</h4><p>{exp['next_steps']}</p><p>{exp['disease']}</p></div>", unsafe_allow_html=True)
            
            g1, g2, g3 = st.columns(3)
            with g1: st.plotly_chart(create_gauge_plotly(res['classical_prob'], "XGBoost Score", "#00d4ff"), use_container_width=True)
            with g2: st.plotly_chart(create_gauge_plotly(res['rf_prob'], "Random Forest Score", "#9467bd"), use_container_width=True)
            with g3: st.plotly_chart(create_gauge_plotly(res['hybrid_prob'], "Ensemble Score", "#00ff88"), use_container_width=True)
            
            st.plotly_chart(create_prob_chart_plotly(res['classical_prob'], res['rf_prob'], res['hybrid_prob']), use_container_width=True)
            
        with tab_mol:
            c1, c2 = st.columns(2)
            with c1:
                st.markdown("<div class='glass-card'><h3>3D Interactive</h3>", unsafe_allow_html=True)
                html_3d = get_3d_html(smiles_input)
                if html_3d: st.components.v1.html(html_3d, height=420)
                st.markdown("</div>", unsafe_allow_html=True)
            with c2:
                st.markdown("<div class='glass-card'><h3>Drug-Likeness (Lipinski)</h3>", unsafe_allow_html=True)
                rules, _ = check_lipinski(smiles_input)
                for r, (_, ok, disp) in rules.items():
                    st.markdown(f"<div><span class='badge {'badge-pass' if ok else 'badge-fail'}'>{'✅' if ok else '❌'}</span> <b>{r}</b>: {disp}</div>", unsafe_allow_html=True)
                st.markdown("</div><div class='glass-card'><h3>Properties</h3>", unsafe_allow_html=True)
                props = get_molecule_properties(smiles_input)
                if props:
                    p1, p2 = st.columns(2)
                    for i, (k, v) in enumerate(props.items()):
                        (p1 if i%2==0 else p2).write(f"**{k}:** {v}")
                st.markdown("</div>", unsafe_allow_html=True)
                
        with tab_ens:
            st.markdown("<div class='glass-card'><h3>Dual Model Feature Alignment</h3>", unsafe_allow_html=True)
            st.plotly_chart(create_dual_feature_plotly(xgb, rf), use_container_width=True)
            st.markdown("</div><div class='glass-card'><h3>Ensemble Architecture</h3>", unsafe_allow_html=True)
            st.markdown("""
            - **XGBoost Classifier**: 200 Gradient-Boosted Trees, max depth 6, logloss metric.
            - **Random Forest**: 200 Bagged Decision Trees, max depth 10, bootstrap sampling.
            - **Consensus Fusion**: Weighted soft-voting ensemble across 1024-bit Morgan Fingerprint space.
            """, unsafe_allow_html=True)
            st.markdown("</div>", unsafe_allow_html=True)
            
        with tab_tech:
            st.markdown("<div class='glass-card'><h3>Morgan Fingerprint Heatmap</h3>", unsafe_allow_html=True)
            st.plotly_chart(create_heatmap_plotly(res["fp"]), use_container_width=True)
            st.markdown("</div><div class='glass-card'><h3>Feature Importance (Top 20 XGBoost)</h3>", unsafe_allow_html=True)
            st.plotly_chart(create_feature_importance_plotly(xgb, res["fp"]), use_container_width=True)
            st.markdown("</div><div class='glass-card'><h3>Global Benchmarks</h3>", unsafe_allow_html=True)
            st.plotly_chart(create_benchmark_plotly(), use_container_width=True)
            st.markdown("</div>", unsafe_allow_html=True)

elif not smiles_input:
    c1, c2, c3 = st.columns(3)
    c1.markdown("<div class='glass-card metric-blue'><p class='metric-label'>XGBoost</p><p class='metric-value'>93.1%</p></div>", unsafe_allow_html=True)
    c2.markdown("<div class='glass-card metric-purple'><p class='metric-label'>Random Forest</p><p class='metric-value'>91.1%</p></div>", unsafe_allow_html=True)
    c3.markdown("<div class='glass-card metric-green'><p class='metric-label'>Classical Ensemble</p><p class='metric-value'>93.4%</p></div>", unsafe_allow_html=True)
    st.markdown("<div class='glass-card'><h3>Global Benchmarks</h3>", unsafe_allow_html=True)
    st.plotly_chart(create_benchmark_plotly(), use_container_width=True)
    st.markdown("</div>", unsafe_allow_html=True)
