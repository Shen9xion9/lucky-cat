import { useState, useEffect, useRef, useCallback } from "react";

function injectGlobals() {
  if (document.getElementById("lc-g")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@400;500&family=Noto+Serif+SC:wght@600&display=swap";
  document.head.appendChild(link);
  const s = document.createElement("style");
  s.id = "lc-g";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0}
    @keyframes pawWave{0%,100%{transform:rotate(-18deg)}50%{transform:rotate(18deg)}}
    @keyframes pawFast{0%,100%{transform:rotate(-30deg)}50%{transform:rotate(30deg)}}
    @keyframes blink{0%,88%,100%{transform:scaleY(1)}94%{transform:scaleY(0.07)}}
    @keyframes eyeWide{0%,100%{transform:scale(1.3)}50%{transform:scale(1.5)}}
    @keyframes catIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
    @keyframes catBounce{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-12px) rotate(-3deg)}70%{transform:translateY(-12px) rotate(3deg)}}
    @keyframes catHappy{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-14px) rotate(-5deg)}75%{transform:translateY(-14px) rotate(5deg)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes lockIn{0%{transform:scale(1.6);color:#F5C842}100%{transform:scale(1)}}
    @keyframes bellSwing{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}}
    @keyframes glow{0%,100%{box-shadow:0 0 14px rgba(212,20,58,.35)}50%{box-shadow:0 0 28px rgba(212,20,58,.7)}}
    @keyframes ticketIn{from{opacity:0;transform:scale(.9) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
    @keyframes reelFlash{0%,100%{opacity:1}50%{opacity:.4}}
    @keyframes coinSpin{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}
  `;
  document.head.appendChild(s);
}

/* ── PROBABILITY ENGINE ─────────────────────────── */
const TW = {1:85,2:72,3:91,4:88,5:76,6:95,7:82,8:103,9:79,10:88,11:91,12:86,13:74,14:93,15:88,16:82,17:97,18:85,19:78,20:91,21:88,22:95,23:103,24:86,25:79,26:91,27:88,28:76,29:95,30:82,31:88,32:91,33:85,34:78,35:93,36:88,37:82,38:97,39:85,40:78,41:91,42:88,43:76,44:93,45:88,46:82,47:97,48:85,49:78};
const DW = [
  {0:8,1:11,2:10,3:9,4:10,5:11,6:10,7:12,8:13,9:11},
  {0:10,1:10,2:11,3:10,4:9,5:12,6:11,7:10,8:11,9:10},
  {0:9,1:11,2:10,3:11,4:10,5:10,6:12,7:11,8:10,9:10},
  {0:11,1:10,2:10,3:9,4:11,5:10,6:10,7:12,8:11,9:10}
];

function wPick(w) {
  const e = Object.entries(w);
  const tot = e.reduce((s,[,v])=>s+v,0);
  let r = Math.random()*tot;
  for(const [k,v] of e){ r-=v; if(r<=0) return +k; }
  return +e[e.length-1][0];
}
function genTOTO(){const s=new Set();while(s.size<6)s.add(wPick(TW));return[...s].sort((a,b)=>a-b);}
function gen4D(){return DW.map(w=>wPick(w));}

/* ── LUCKY CAT SVG ──────────────────────────────── */
function Cat({ phase, onSpin }) {
  const spinning = phase==="spinning";
  const done = phase==="done";
  const idle = phase==="idle";
  return (
    <div
      onClick={idle ? onSpin : undefined}
      style={{display:"flex",justifyContent:"center",cursor:idle?"pointer":"default",userSelect:"none"}}
    >
      <svg width="220" height="256" viewBox="0 0 220 256" style={{
        animation: spinning?"catBounce .38s ease-in-out infinite":done?"catHappy .52s ease-in-out 4":"catIdle 3.2s ease-in-out infinite",
        filter:"drop-shadow(0 14px 32px rgba(212,20,58,.5))",
      }}>
        {/* Body */}
        <ellipse cx="110" cy="196" rx="73" ry="56" fill="#FFFBF2" stroke="#C8112A" strokeWidth="2.5"/>
        {/* Red bib */}
        <path d="M70 180 Q110 212 150 180 Q146 222 110 228 Q74 222 70 180Z" fill="#C8112A"/>
        <path d="M70 180 Q110 212 150 180" fill="none" stroke="#F5C842" strokeWidth="2.5"/>
        {/* Coin */}
        <circle cx="110" cy="206" r="13" fill="#F5C842" stroke="#B8890A" strokeWidth="1.5"/>
        <text x="110" y="211" textAnchor="middle" fontSize="11" fill="#7A5C00" fontWeight="bold" fontFamily="Noto Serif SC,serif">福</text>
        {/* Head */}
        <circle cx="110" cy="110" r="65" fill="#FFFBF2" stroke="#C8112A" strokeWidth="2.5"/>
        {/* Ears */}
        <polygon points="50,62 38,24 78,52" fill="#FFFBF2" stroke="#C8112A" strokeWidth="2.5"/>
        <polygon points="170,62 182,24 142,52" fill="#FFFBF2" stroke="#C8112A" strokeWidth="2.5"/>
        <polygon points="54,58 46,34 74,54" fill="#FFBDCA"/>
        <polygon points="166,58 174,34 146,54" fill="#FFBDCA"/>
        {/* Forehead */}
        <text x="110" y="86" textAnchor="middle" fontSize="15" fill="#C8112A" opacity=".45" fontFamily="Noto Serif SC,serif">招财</text>
        {/* Left eye */}
        <g style={{animation:spinning?"eyeWide .3s ease-in-out infinite":"blink 4.5s ease-in-out infinite",transformOrigin:"82px 106px"}}>
          <circle cx="82" cy="106" r="15" fill="white" stroke="#3a3a3a" strokeWidth="1"/>
          <circle cx="85" cy="108" r="9" fill="#0D0208"/>
          <circle cx="89" cy="104" r="3.5" fill="white"/>
        </g>
        {/* Right eye */}
        <g style={{animation:spinning?"eyeWide .3s ease-in-out infinite":"blink 4.5s ease-in-out infinite",transformOrigin:"138px 106px"}}>
          <circle cx="138" cy="106" r="15" fill="white" stroke="#3a3a3a" strokeWidth="1"/>
          <circle cx="141" cy="108" r="9" fill="#0D0208"/>
          <circle cx="145" cy="104" r="3.5" fill="white"/>
        </g>
        {/* Nose */}
        <polygon points="110,122 107,118 113,118" fill="#FFBDCA"/>
        {/* Mouth */}
        <path d="M103 126 Q110 132 117 126" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Whiskers L */}
        <line x1="52" y1="116" x2="94" y2="120" stroke="#bbb" strokeWidth=".9" opacity=".65"/>
        <line x1="52" y1="122" x2="94" y2="122" stroke="#bbb" strokeWidth=".9" opacity=".65"/>
        <line x1="55" y1="128" x2="96" y2="125" stroke="#bbb" strokeWidth=".9" opacity=".65"/>
        {/* Whiskers R */}
        <line x1="168" y1="116" x2="126" y2="120" stroke="#bbb" strokeWidth=".9" opacity=".65"/>
        <line x1="168" y1="122" x2="126" y2="122" stroke="#bbb" strokeWidth=".9" opacity=".65"/>
        <line x1="165" y1="128" x2="124" y2="125" stroke="#bbb" strokeWidth=".9" opacity=".65"/>
        {/* Collar */}
        <path d="M58 154 Q110 172 162 154" fill="none" stroke="#F5C842" strokeWidth="7" strokeLinecap="round"/>
        <path d="M58 154 Q110 172 162 154" fill="none" stroke="#C8960C" strokeWidth="1" strokeLinecap="round"/>
        {/* Bell */}
        <g style={{animation:"bellSwing 2.2s ease-in-out infinite",transformOrigin:"110px 164px"}}>
          <ellipse cx="110" cy="169" rx="7.5" ry="9" fill="#F5C842" stroke="#B8890A" strokeWidth="1.2"/>
          <line x1="110" y1="175" x2="110" y2="178" stroke="#B8890A" strokeWidth="1.5"/>
          <circle cx="110" cy="169" r="2.5" fill="#B8890A" opacity=".5"/>
        </g>
        {/* Left arm (down) */}
        <ellipse cx="42" cy="190" rx="18" ry="30" fill="#FFFBF2" stroke="#C8112A" strokeWidth="2" transform="rotate(-10,42,190)"/>
        <ellipse cx="34" cy="214" rx="12" ry="9" fill="#FFBDCA" transform="rotate(-10,34,214)"/>
        {/* Right arm (raised - SPIN BUTTON) */}
        <g style={{
          animation:spinning?"pawFast .22s ease-in-out infinite":"pawWave 1.7s ease-in-out infinite",
          transformOrigin:"172px 156px",
          cursor:idle?"pointer":"default"
        }}>
          <ellipse cx="172" cy="148" rx="18" ry="34" fill="#FFFBF2" stroke="#C8112A" strokeWidth="2" transform="rotate(20,172,148)"/>
          <ellipse cx="180" cy="124" rx="14" ry="11" fill="#FFBDCA" transform="rotate(20,180,124)"/>
          <circle cx="173" cy="117" r="4.5" fill="#FFBDCA"/>
          <circle cx="183" cy="118" r="4" fill="#FFBDCA"/>
          <circle cx="188" cy="125" r="4" fill="#FFBDCA"/>
        </g>
        {/* TAP hint */}
        {idle && (
          <text x="198" y="112" fontSize="9" fill="#F5C842" fontWeight="500" fontFamily="DM Mono,monospace" opacity=".9">TAP!</text>
        )}
      </svg>
    </div>
  );
}

/* ── SLOT REEL ───────────────────────────────────── */
function Reel({ value, spinning, locked, is4D }) {
  const [disp, setDisp] = useState("?");
  const iv = useRef(null);

  useEffect(() => {
    if (spinning && !locked) {
      iv.current = setInterval(() => {
        setDisp(is4D
          ? String(Math.floor(Math.random()*10))
          : String(Math.floor(Math.random()*49+1)).padStart(2,"0")
        );
      }, 72);
    } else {
      clearInterval(iv.current);
      if (value != null) {
        setDisp(is4D ? String(value) : String(value).padStart(2,"0"));
      } else if (!spinning) {
        setDisp("?");
      }
    }
    return () => clearInterval(iv.current);
  }, [spinning, locked, value, is4D]);

  return (
    <div style={{
      width: is4D ? 62 : 58,
      height: 70,
      background: "linear-gradient(180deg,#1E0A14,#2E1022,#1E0A14)",
      border: `2px solid ${locked ? "#F5C842" : "#4A1230"}`,
      borderRadius: 12,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: locked ? "0 0 20px rgba(245,200,66,.6), inset 0 1px 0 rgba(255,255,255,.06)" : "inset 0 2px 10px rgba(0,0,0,.5)",
      transition: "border-color .3s, box-shadow .35s",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"rgba(255,255,255,.07)"}}/>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: is4D ? 30 : 22,
        fontWeight: "500",
        color: locked ? "#F5C842" : spinning ? "#FF90A8" : "rgba(255,245,230,.25)",
        animation: locked ? "lockIn .45s ease-out forwards" : spinning ? "reelFlash .18s ease-in-out infinite" : "none",
        letterSpacing: is4D ? 0 : -1,
        lineHeight: 1,
      }}>
        {disp}
      </span>
    </div>
  );
}

/* ── RESULT TICKET ──────────────────────────────── */
function Ticket({ numbers, mode }) {
  return (
    <div style={{
      animation: "ticketIn .52s cubic-bezier(.34,1.56,.64,1) forwards",
      background: "linear-gradient(135deg,#200C16,#2E1022)",
      border: "1px solid rgba(245,200,66,.38)",
      borderRadius: 18,
      padding: "18px 22px 14px",
      marginTop: 18,
      boxShadow: "0 10px 36px rgba(200,10,40,.28), inset 0 1px 0 rgba(245,200,66,.1)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{position:"absolute",top:0,left:20,right:20,height:1,backgroundImage:"repeating-linear-gradient(90deg,transparent,transparent 6px,rgba(245,200,66,.22) 6px,rgba(245,200,66,.22) 10px)"}}/>
      <div style={{textAlign:"center",marginBottom:14}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(245,200,66,.7)",letterSpacing:4}}>🐱 LUCKY CAT PICKS</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:12,color:"#FF90A8",marginTop:3,letterSpacing:1.5}}>
          {mode==="4d" ? "4D NUMBER" : "TOTO · 6 NUMBERS"}
        </div>
      </div>

      {mode==="4d" ? (
        <div style={{textAlign:"center"}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:52,fontWeight:"500",color:"#F5C842",letterSpacing:10,textShadow:"0 0 28px rgba(245,200,66,.45)"}}>
            {numbers.join("")}
          </span>
        </div>
      ) : (
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          {numbers.map((n,i) => (
            <div key={i} style={{
              width:44,height:44,borderRadius:"50%",
              background:"radial-gradient(circle at 35% 30%,#F5C842,#B8890A)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:"500",color:"#1A0810",
              boxShadow:"0 4px 14px rgba(184,137,10,.45)",
            }}>
              {String(n).padStart(2,"0")}
            </div>
          ))}
        </div>
      )}

      <div style={{marginTop:14,paddingTop:10,borderTop:"1px dashed rgba(245,200,66,.14)",textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(255,245,230,.28)",letterSpacing:.5}}>
        {new Date().toLocaleDateString("en-SG",{day:"2-digit",month:"short",year:"numeric"})} · For entertainment only · Please gamble responsibly
      </div>
    </div>
  );
}

/* ── HISTORY ROW ─────────────────────────────────── */
function HistoryRow({ item }) {
  const label = item.mode==="toto"
    ? item.numbers.map(n=>String(n).padStart(2,"0")).join("  ·  ")
    : item.numbers.join("");
  return (
    <div style={{
      display:"flex",alignItems:"center",justifyContent:"space-between",
      background:"rgba(255,255,255,.025)",border:"1px solid rgba(245,200,66,.07)",
      borderRadius:10,padding:"9px 14px",animation:"fadeUp .4s ease-out",gap:10,
    }}>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#C8112A",opacity:.8,minWidth:28}}>{item.mode.toUpperCase()}</span>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"rgba(255,245,230,.7)",letterSpacing:item.mode==="4d"?4:1.5,flex:1,textAlign:"center"}}>{label}</span>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,245,230,.25)"}}>{item.time}</span>
    </div>
  );
}

/* ── APP ─────────────────────────────────────────── */
export default function App() {
  const [mode, setMode] = useState("toto");
  const [phase, setPhase] = useState("idle");
  const [pending, setPending] = useState([]);
  const [locked, setLocked] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const tids = useRef([]);

  useEffect(() => { injectGlobals(); }, []);

  function clearTids() { tids.current.forEach(clearTimeout); tids.current = []; }
  function addTid(fn, d) { const id = setTimeout(fn, d); tids.current.push(id); }

  const spin = useCallback(() => {
    if (phase !== "idle") return;
    clearTids();
    setLocked([]);
    setResult(null);

    const nums = mode === "toto" ? genTOTO() : gen4D();
    setPending(nums);
    setPhase("spinning");

    nums.forEach((_, i) => {
      addTid(() => setLocked(p => [...p, i]), 900 + i * 380);
    });

    addTid(() => {
      setResult(nums);
      setPhase("done");
      setHistory(p => [{
        mode,
        numbers: nums,
        time: new Date().toLocaleTimeString("en-SG", { hour:"2-digit", minute:"2-digit" })
      }, ...p.slice(0, 9)]);
      addTid(() => setPhase("idle"), 2000);
    }, 900 + nums.length * 380 + 220);
  }, [phase, mode]);

  const count = mode === "toto" ? 6 : 4;
  const is4D = mode === "4d";

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 90% 55% at 50% 0%, #2E1020, #0D0208 60%)",
      color: "#FFF5E6",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "22px 18px 52px",
      position: "relative", overflow: "hidden",
      fontFamily: "'Playfair Display', serif",
    }}>
      {/* Ambient blobs */}
      {[["-70px","-70px",260,"rgba(200,10,40,.07)"],[null,"-100px",340,"rgba(245,200,66,.04)"],["-50px","38%",200,"rgba(200,10,40,.04)"]].map(([l,t,sz,bg],i)=>(
        <div key={i} style={{position:"absolute",top:t??undefined,bottom:!t?"-100px":undefined,left:l??undefined,right:!l?"-70px":undefined,width:sz,height:sz,borderRadius:"50%",background:`radial-gradient(circle,${bg} 0%,transparent 70%)`,pointerEvents:"none"}}/>
      ))}

      {/* Header */}
      <div style={{textAlign:"center",marginBottom:8,zIndex:1}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:6,color:"rgba(200,17,42,.85)",marginBottom:2}}>招财猫</div>
        <h1 style={{
          fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,lineHeight:1,
          background:"linear-gradient(135deg,#F5C842 0%,#FFD0E0 40%,#F5C842 80%)",
          backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
          animation:"shimmer 4s linear infinite",
        }}>Lucky Cat</h1>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,245,230,.32)",marginTop:4,letterSpacing:2}}>
          probability-powered · sg lottery
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{display:"flex",background:"rgba(255,255,255,.042)",borderRadius:50,padding:4,marginBottom:14,border:"1px solid rgba(245,200,66,.11)",zIndex:1}}>
        {["toto","4d"].map(m => (
          <button key={m}
            onClick={() => { if(phase==="idle"){setMode(m);setResult(null);setPending([]);setLocked([]);} }}
            style={{
              padding:"8px 32px",borderRadius:50,border:"none",
              background:mode===m?"linear-gradient(135deg,#C8112A,#880C1E)":"transparent",
              color:mode===m?"#FFFBF2":"rgba(255,245,230,.38)",
              fontFamily:"'DM Mono',monospace",fontSize:13,letterSpacing:1.5,
              cursor:"pointer",transition:"all .25s",
              boxShadow:mode===m?"0 2px 14px rgba(200,17,42,.48)":"none",
            }}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Cat */}
      <Cat phase={phase} onSpin={spin} />

      {/* Idle hint */}
      {phase==="idle" && (
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,245,230,.32)",letterSpacing:3,marginBottom:10,animation:"fadeUp .5s ease-out"}}>
          TAP THE CAT TO SPIN
        </div>
      )}

      {/* Reels */}
      {(phase==="spinning"||phase==="done") && (
        <div style={{display:"flex",gap:is4D?10:8,justifyContent:"center",marginBottom:10,animation:"fadeUp .3s ease-out",flexWrap:"wrap",zIndex:1}}>
          {Array(count).fill(0).map((_,i) => (
            <Reel
              key={`${mode}-reel-${i}`}
              value={pending[i]??null}
              spinning={phase==="spinning"}
              locked={locked.includes(i)}
              is4D={is4D}
            />
          ))}
        </div>
      )}

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={phase!=="idle"}
        style={{
          marginTop: phase==="idle" ? 4 : 12,
          padding:"13px 46px",
          background: phase!=="idle" ? "rgba(200,17,42,.18)" : "linear-gradient(135deg,#C8112A,#880C1E)",
          border:"1px solid rgba(245,200,66,.22)",borderRadius:50,
          color: phase!=="idle" ? "rgba(255,245,230,.45)" : "#FFFBF2",
          fontFamily:"'DM Mono',monospace",fontSize:13,letterSpacing:3,
          cursor: phase!=="idle" ? "not-allowed" : "pointer",
          transition:"all .3s",zIndex:1,
          animation: phase==="idle" ? "glow 2.8s ease-in-out infinite" : "none",
        }}>
        {phase==="idle" ? "✨  SPIN" : phase==="spinning" ? "🎰  ROLLING..." : "🎉  LUCKY!"}
      </button>

      {/* Result */}
      {result && phase!=="spinning" && (
        <div style={{width:"100%",maxWidth:390,zIndex:1}}>
          <Ticket numbers={result} mode={mode}/>
        </div>
      )}

      {/* History */}
      {history.length>0 && (
        <div style={{width:"100%",maxWidth:390,marginTop:28,zIndex:1}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:11,color:"rgba(255,245,230,.3)",textAlign:"center",letterSpacing:4,marginBottom:10}}>
            PAST SPINS
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {history.slice(0,6).map((h,i) => <HistoryRow key={i} item={h}/>)}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{marginTop:36,textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:8,color:"rgba(255,245,230,.18)",letterSpacing:.5,lineHeight:1.9,maxWidth:290,zIndex:1}}>
        For entertainment only. Numbers are statistically weighted but do not predict or guarantee lottery wins. Please gamble responsibly.
        <br/>NCPG Helpline: 1800-6-668-668
      </div>
    </div>
  );
}
