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
    page_title="Quantum Drug Discovery",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==========================================
# CUSTOM CSS EXTENSION (Option C)
# ==========================================
st.markdown("""
<style>
    /* Global Dark Theme */
    :root {
        --bg-color: #0a0a1a;
        --card-bg: rgba(22, 33, 62, 0.7);
        --cyan: #00d4ff;
        --purple: #9467bd;
        --green: #00ff88;
        --red: #ff3b30;
    }
    .stApp { background-color: var(--bg-color); color: white; }
    
    /* Hero Section */
    .hero-container { text-align: center; padding: 3rem 1rem; position: relative; z-index: 10; }
    .hero-title {
        font-size: 4rem; font-weight: 900;
        background: linear-gradient(90deg, var(--cyan), var(--purple), var(--green), var(--cyan));
        background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        animation: gradient-shift 8s ease infinite; margin-bottom: 0.5rem;
    }
    .hero-subtitle { font-size: 1.5rem; color: #a0aabf; margin-bottom: 2rem; }
    
    /* Animations */
    @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes pulse-glow { 0% { box-shadow: 0 0 10px rgba(0,212,255,0.2); } 50% { box-shadow: 0 0 25px rgba(0,212,255,0.6); } 100% { box-shadow: 0 0 10px rgba(0,212,255,0.2); } }
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes blink-qubit { 0% { opacity: 0.3; } 50% { opacity: 1; text-shadow: 0 0 10px var(--cyan); } 100% { opacity: 0.3; } }
    
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
    .qubit-pulse { display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: var(--cyan); animation: blink-qubit 1.5s infinite; margin-right: 8px;}
    
    /* BACE Card */
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
    xgb_model  = joblib.load("models/classical_model.pkl")
    qsvm_model = joblib.load("models/quantum_svm.pkl")
    pca        = joblib.load("models/pca.pkl")
    scaler     = joblib.load("models/scaler.pkl")
    return xgb_model, qsvm_model, pca, scaler

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

def run_hybrid_prediction(smiles, xgb_model, qsvm_model, pca, scaler):
    fp = smiles_to_fingerprint(smiles)
    if fp is None: return None
    fp_2d            = fp.reshape(1, -1)
    classical_prob   = float(xgb_model.predict_proba(fp_2d)[0][1])
    fp_pca           = pca.transform(fp_2d)
    fp_scaled        = scaler.transform(fp_pca)
    quantum_prob     = float(qsvm_model.predict_proba(fp_scaled)[0][1])
    hybrid_prob      = (0.6 * classical_prob) + (0.4 * quantum_prob)
    prediction       = "ACTIVE" if hybrid_prob >= 0.5 else "INACTIVE"
    return {
        "prediction": prediction, "hybrid_prob": hybrid_prob, "classical_prob": classical_prob,
        "quantum_prob": quantum_prob, "confidence": hybrid_prob if prediction == "ACTIVE" else 1 - hybrid_prob,
        "fp": fp, "fp_pca": fp_pca, "fp_scaled": fp_scaled,
    }

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

def show_bace1_explanation(prediction, hybrid_prob):
    if prediction == "ACTIVE":
        return {
            "verdict": "✅ Potential BACE-1 Inhibitor", "color": "#00ff88",
            "mechanism": "This molecule shows structural features compatible with BACE-1 active site binding.",
            "impact": f"With {hybrid_prob*100:.1f}% confidence, this molecule may block BACE-1 from cutting APP protein.",
            "next_steps": "Recommended for in-vitro testing against BACE-1 enzyme.",
            "disease": "If confirmed, could reduce Amyloid-Beta production and slow Alzheimer's progression.", "icon": "🧬"
        }
    return {
        "verdict": "❌ Not a BACE-1 Inhibitor", "color": "#ff3b30",
        "mechanism": "This molecule lacks structural features required for BACE-1 active site binding.",
        "impact": f"With {(1-hybrid_prob)*100:.1f}% confidence, this molecule will NOT block BACE-1.",
        "next_steps": "Consider structural modification to improve binding affinity.",
        "disease": "Not suitable as Alzheimer's drug candidate in current form.", "icon": "🔬"
    }

# ==========================================
# PLOTLY CHART FUNCTIONS
# ==========================================
dark_layout = dict(plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)", font=dict(color="#a0aabf"),
                   xaxis=dict(showgrid=False, zeroline=False), yaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.1)", zeroline=False))

def create_benchmark_plotly():
    models, acc, roc = ["Classical XGBoost", "Quantum SVM", "Hybrid"], [82.2, 74.0, 84.0], [0.9225, 0.8487, 0.9400]
    colors = ["#00d4ff", "#9467bd", "#00ff88"]
    fig = make_subplots(rows=1, cols=2, subplot_titles=("Accuracy (%)", "ROC-AUC Score"))
    fig.add_trace(go.Bar(x=models, y=acc, marker_color=colors, text=[f"{v}%" for v in acc], textposition='auto'), row=1, col=1)
    fig.add_trace(go.Bar(x=models, y=roc, marker_color=colors, text=[f"{v:.4f}" for v in roc], textposition='auto'), row=1, col=2)
    fig.update_layout(**dark_layout, showlegend=False, height=400, margin=dict(t=50, l=0, r=0, b=0))
    fig.update_yaxes(range=[0, 100], row=1, col=1); fig.update_yaxes(range=[0, 1.1], row=1, col=2)
    return fig

def create_prob_chart_plotly(c_prob, q_prob, h_prob):
    fig = go.Figure(go.Bar(x=[c_prob, q_prob, h_prob], y=["Classical", "Quantum", "Hybrid"], orientation='h', marker_color=["#00d4ff", "#9467bd", "#00ff88"], text=[f"{v*100:.1f}%" for v in [c_prob, q_prob, h_prob]], textposition='auto'))
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

def create_pca_plotly(pca_vals, scaled_vals):
    fig = make_subplots(rows=1, cols=2, subplot_titles=("PCA Features", "Quantum Angles [0, π]"))
    fig.add_trace(go.Bar(x=[f"PC{i+1}" for i in range(8)], y=pca_vals[0], marker_color="#9467bd"), row=1, col=1)
    fig.add_trace(go.Bar(x=[f"Q{i+1}" for i in range(8)], y=scaled_vals[0], marker_color="#00d4ff"), row=1, col=2)
    fig.add_hline(y=np.pi, line_dash="dash", line_color="#ff3b30", annotation_text="π", row=1, col=2)
    fig.update_layout(**dark_layout, showlegend=False, height=350, margin=dict(t=50, l=0, r=0, b=0))
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

def create_bloch_sphere_plotly(fp_scaled):
    angles = fp_scaled[0][:8]
    fig = make_subplots(rows=2, cols=4, specs=[[{'type': 'surface'}, {'type': 'surface'}, {'type': 'surface'}, {'type': 'surface'}],
                                               [{'type': 'surface'}, {'type': 'surface'}, {'type': 'surface'}, {'type': 'surface'}]])
    u = np.linspace(0, 2 * np.pi, 20); v = np.linspace(0, np.pi, 20)
    x = np.outer(np.cos(u), np.sin(v)); y = np.outer(np.sin(u), np.sin(v)); z = np.outer(np.ones(np.size(u)), np.cos(v))
    for i in range(8):
        row, col = i // 4 + 1, i % 4 + 1
        fig.add_trace(go.Surface(x=x, y=y, z=z, opacity=0.1, showscale=False, colorscale=[[0, '#9467bd'], [1, '#9467bd']]), row=row, col=col)
        theta, phi = angles[i], angles[i] * 2
        qx, qy, qz = np.sin(theta) * np.cos(phi), np.sin(theta) * np.sin(phi), np.cos(theta)
        fig.add_trace(go.Scatter3d(x=[0, qx], y=[0, qy], z=[0, qz], mode='lines', line=dict(color='#00d4ff', width=5)), row=row, col=col)
    fig.update_layout(height=500, showlegend=False, margin=dict(l=0, r=0, b=0, t=30), paper_bgcolor="rgba(0,0,0,0)")
    fig.update_scenes(xaxis_visible=False, yaxis_visible=False, zaxis_visible=False)
    return fig

def create_quantum_circuit_html():
    return """
    <div style='font-family: monospace; background:rgba(0,0,0,0.5); padding:1rem; border-radius:8px; color: #00d4ff; overflow-x: auto; white-space: pre;'>
     ┌───┐ ┌──────────┐                                                             
q_0: ┤ H ├─┤ Rz(x[0]) ├──■────────────────────────────────────────────────────────■─
     ├───┤ ├──────────┤┌─┴─┐┌──────────┐                                          │ 
q_1: ┤ H ├─┤ Rz(x[1]) ├┤ X ├┤ Rz(zz)   ├─■────────────────────────────────────────┼─
     ├───┤ ├──────────┤└───┘└──────────┘┌─┴─┐┌──────────┐                         │ 
q_2: ┤ H ├─┤ Rz(x[2]) ├─────────────────┤ X ├┤ Rz(zz)   ├─■───────────────────────┼─
     ├───┤ ├──────────┤                 └───┘└──────────┘┌─┴─┐┌──────────┐        │ 
q_3: ┤ H ├─┤ Rz(x[3]) ├──────────────────────────────────┤ X ├┤ Rz(zz)   ├─■──────┼─
     ├───┤ ├──────────┤                                  └───┘└──────────┘ │      ...
q_4: ...   ...                                                                    
    </div>
    """

# ==========================================
# SIDEBAR
# ==========================================
with st.sidebar:
    st.markdown("<div style='text-align:center;'><h1 class='sidebar-header'>⚛️ Quantum Sim</h1></div>", unsafe_allow_html=True)
    st.markdown("""
    <div class="glass-card" style="padding: 1rem;">
    <div class="qubit-pulse"></div> <b>System Status:</b> Online<br><br>
    • <b>Qubits:</b> 8<br>
    • <b>Feature Map:</b> ZZFeatureMap<br>
    • <b>Entanglement:</b> Linear<br>
    • <b>Kernel:</b> Fidelity Quantum
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
    
    st.markdown("<div style='text-align:center; color:#666; font-size:0.8rem; margin-top:2rem;'>MoleculeNet BACE Dataset • 1,522 items</div>", unsafe_allow_html=True)

# ==========================================
# MAIN APP
# ==========================================
st.markdown("""
<div class="hero-container">
    <div style="font-size: 5rem; animation: spin-slow 10s linear infinite; display: inline-block;">🧬</div>
    <div class="hero-title">Quantum Drug Discovery</div>
    <div class="hero-subtitle">Alzheimer's BACE-1 Inhibitor Prediction via Hybrid Quantum-Classical AI</div>
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
        with st.spinner("🔄 Initializing Quantum Simulators & Running Pipeline..."):
            xgb, qsvm, pca, scaler = load_models()
            res = run_hybrid_prediction(smiles_input, xgb, qsvm, pca, scaler)
            
        if not res: st.stop()
            
        tab_res, tab_mol, tab_quant, tab_tech = st.tabs(["🎯 Results", "🧪 Molecule", "⚛️ Quantum", "📊 Technical"])
        
        with tab_res:
            exp = show_bace1_explanation(res["prediction"], res["hybrid_prob"])
            cls_name = "result-active" if res["prediction"] == "ACTIVE" else "result-inactive"
            st.markdown(f"""
            <div class="result-banner {cls_name}">
                <div style="font-size: 3rem;">{exp['icon']}</div>
                <div class="result-title">{exp['verdict']}</div>
                <div style="font-size: 1.2rem; color: #fff;">Hybrid Confidence: <b>{res['confidence']*100:.1f}%</b></div>
            </div>
            """, unsafe_allow_html=True)
            
            c_exp1, c_exp2 = st.columns(2)
            c_exp1.markdown(f"<div class='bace-card'><h4 style='color:{exp['color']}'>Mechanism & Impact</h4><p>{exp['mechanism']}</p><p>{exp['impact']}</p></div>", unsafe_allow_html=True)
            c_exp2.markdown(f"<div class='bace-card'><h4 style='color:{exp['color']}'>Next Steps</h4><p>{exp['next_steps']}</p><p>{exp['disease']}</p></div>", unsafe_allow_html=True)
            
            g1, g2, g3 = st.columns(3)
            with g1: st.plotly_chart(create_gauge_plotly(res['classical_prob'], "Classical Score", "#00d4ff"), use_container_width=True)
            with g2: st.plotly_chart(create_gauge_plotly(res['quantum_prob'], "Quantum Score", "#9467bd"), use_container_width=True)
            with g3: st.plotly_chart(create_gauge_plotly(res['hybrid_prob'], "Hybrid Score", "#00ff88"), use_container_width=True)
            
            st.plotly_chart(create_prob_chart_plotly(res['classical_prob'], res['quantum_prob'], res['hybrid_prob']), use_container_width=True)
            
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
                
        with tab_quant:
            st.markdown("<div class='glass-card'><h3>Quantum Circuit Synthesis</h3>", unsafe_allow_html=True)
            st.components.v1.html(create_quantum_circuit_html(), height=150)
            st.markdown("</div>", unsafe_allow_html=True)
            st.markdown("<div class='glass-card'><h3>Bloch Sphere State</h3>", unsafe_allow_html=True)
            st.plotly_chart(create_bloch_sphere_plotly(res["fp_scaled"]), use_container_width=True)
            st.markdown("</div><div class='glass-card'><h3>PCA Reduction [1024 -> 8]</h3>", unsafe_allow_html=True)
            st.plotly_chart(create_pca_plotly(res["fp_pca"], res["fp_scaled"]), use_container_width=True)
            st.markdown("</div>", unsafe_allow_html=True)
            
        with tab_tech:
            st.markdown("<div class='glass-card'><h3>Morgan Fingerprint Heatmap</h3>", unsafe_allow_html=True)
            st.plotly_chart(create_heatmap_plotly(res["fp"]), use_container_width=True)
            st.markdown("</div><div class='glass-card'><h3>Feature Importance (Top 20)</h3>", unsafe_allow_html=True)
            st.plotly_chart(create_feature_importance_plotly(xgb, res["fp"]), use_container_width=True)
            st.markdown("</div><div class='glass-card'><h3>Global Benchmarks</h3>", unsafe_allow_html=True)
            st.plotly_chart(create_benchmark_plotly(), use_container_width=True)
            st.markdown("</div>", unsafe_allow_html=True)

elif not smiles_input:
    c1, c2, c3 = st.columns(3)
    c1.markdown("<div class='glass-card metric-blue'><p class='metric-label'>XGBoost</p><p class='metric-value'>82.2%</p></div>", unsafe_allow_html=True)
    c2.markdown("<div class='glass-card metric-purple'><p class='metric-label'>Quantum SVM</p><p class='metric-value'>74.0%</p></div>", unsafe_allow_html=True)
    c3.markdown("<div class='glass-card metric-green'><p class='metric-label'>Hybrid</p><p class='metric-value'>84.0%</p></div>", unsafe_allow_html=True)
    st.markdown("<div class='glass-card'><h3>Global Benchmarks</h3>", unsafe_allow_html=True)
    st.plotly_chart(create_benchmark_plotly(), use_container_width=True)
    st.markdown("</div>", unsafe_allow_html=True)