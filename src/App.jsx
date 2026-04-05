import { useState, useEffect, useRef, useCallback } from "react";

function injectGlobals() {
  if (document.getElementById("lc-g")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@400;500&family=Noto+Serif+SC:wght@600;700&display=swap";
  document.head.appendChild(link);
  const s = document.createElement("style");
  s.id = "lc-g";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#FDF3E7}
    @keyframes pawWave{0%,100%{transform:rotate(-12deg) translateY(0)}50%{transform:rotate(12deg) translateY(-6px)}}
    @keyframes pawFast{0%,100%{transform:rotate(-20deg) translateY(0)}50%{transform:rotate(20deg) translateY(-10px)}}
    @keyframes catIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
    @keyframes catBounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-14px)}70%{transform:translateY(-8px)}}
    @keyframes catHappy{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-12px) rotate(-4deg)}75%{transform:translateY(-12px) rotate(4deg)}}
    @keyframes shimmerGold{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes lockIn{0%{transform:scale(1.5);color:#C8112A}100%{transform:scale(1)}}
    @keyframes bellSwing{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}}
    @keyframes glowRed{0%,100%{box-shadow:0 4px 18px rgba(200,17,42,.35)}50%{box-shadow:0 4px 32px rgba(200,17,42,.65)}}
    @keyframes ticketIn{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
    @keyframes reelFlash{0%,100%{opacity:1}50%{opacity:.5}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
  `;
  document.head.appendChild(s);
}

const TW = {1:85,2:72,3:91,4:88,5:76,6:95,7:82,8:103,9:79,10:88,11:91,12:86,13:74,14:93,15:88,16:82,17:97,18:85,19:78,20:91,21:88,22:95,23:103,24:86,25:79,26:91,27:88,28:76,29:95,30:82,31:88,32:91,33:85,34:78,35:93,36:88,37:82,38:97,39:85,40:78,41:91,42:88,43:76,44:93,45:88,46:82,47:97,48:85,49:78};
const DW = [{0:8,1:11,2:10,3:9,4:10,5:11,6:10,7:12,8:13,9:11},{0:10,1:10,2:11,3:10,4:9,5:12,6:11,7:10,8:11,9:10},{0:9,1:11,2:10,3:11,4:10,5:10,6:12,7:11,8:10,9:10},{0:11,1:10,2:10,3:9,4:11,5:10,6:10,7:12,8:11,9:10}];
function wPick(w){const e=Object.entries(w);const tot=e.reduce((s,[,v])=>s+v,0);let r=Math.random()*tot;for(const [k,v] of e){r-=v;if(r<=0)return +k;}return +e[e.length-1][0];}
function genTOTO(){const s=new Set();while(s.size<6)s.add(wPick(TW));return[...s].sort((a,b)=>a-b);}
function gen4D(){return DW.map(w=>wPick(w));}

function Cat({ phase, onSpin }) {
  const spinning = phase==="spinning", done=phase==="done", idle=phase==="idle";
  return (
    <div onClick={idle?onSpin:undefined} style={{display:"flex",justifyContent:"center",cursor:idle?"pointer":"default",userSelect:"none"}}>
      <svg width="240" height="290" viewBox="0 0 240 290" style={{animation:spinning?"catBounce .4s ease-in-out infinite":done?"catHappy .55s ease-in-out 4":"catIdle 3s ease-in-out infinite",filter:"drop-shadow(0 12px 24px rgba(200,17,42,.22)) drop-shadow(0 4px 8px rgba(0,0,0,.1))"}}>
        <ellipse cx="120" cy="274" rx="82" ry="12" fill="#B8001E" opacity=".25"/>
        <rect x="42" y="258" width="156" height="18" rx="5" fill="#C8112A"/>
        <rect x="42" y="258" width="156" height="5" rx="3" fill="#E8314A"/>
        <circle cx="46" cy="276" r="5" fill="#D4A017"/><line x1="46" y1="271" x2="46" y2="258" stroke="#D4A017" strokeWidth="2"/>
        <circle cx="194" cy="276" r="5" fill="#D4A017"/><line x1="194" y1="271" x2="194" y2="258" stroke="#D4A017" strokeWidth="2"/>
        <ellipse cx="120" cy="210" rx="76" ry="56" fill="#FEFAF2" stroke="#E8D8B8" strokeWidth="1.5"/>
        <ellipse cx="168" cy="220" rx="28" ry="22" fill="#C47B2A" opacity=".55"/>
        <ellipse cx="72" cy="230" rx="18" ry="16" fill="#2A1A0A" opacity=".35"/>
        <ellipse cx="82" cy="222" rx="30" ry="38" fill="#F5C842" stroke="#C8960C" strokeWidth="2" transform="rotate(-8,82,222)"/>
        <ellipse cx="82" cy="222" rx="25" ry="33" fill="#F5C842" stroke="#D4A017" strokeWidth="1" transform="rotate(-8,82,222)"/>
        <text x="74" y="212" textAnchor="middle" fontSize="9" fill="#7A5C00" fontWeight="bold" fontFamily="Noto Serif SC,serif" transform="rotate(-8,82,222)">招福</text>
        <text x="74" y="224" textAnchor="middle" fontSize="9" fill="#7A5C00" fontWeight="bold" fontFamily="Noto Serif SC,serif" transform="rotate(-8,82,222)">大開</text>
        <text x="74" y="236" textAnchor="middle" fontSize="9" fill="#7A5C00" fontWeight="bold" fontFamily="Noto Serif SC,serif" transform="rotate(-8,82,222)">運</text>
        <ellipse cx="72" cy="240" rx="20" ry="14" fill="#FEFAF2" stroke="#E8D8B8" strokeWidth="1.5" transform="rotate(20,72,240)"/>
        <text x="148" y="235" fontSize="14" fill="#C8112A" opacity=".45" fontFamily="sans-serif">鶴</text>
        <circle cx="140" cy="250" r="3" fill="#C8112A" opacity=".3"/>
        <circle cx="148" cy="246" r="3" fill="#C8112A" opacity=".3"/>
        <circle cx="155" cy="252" r="3" fill="#C8112A" opacity=".3"/>
        <g style={{animation:spinning?"pawFast .22s ease-in-out infinite":"pawWave 1.8s ease-in-out infinite",transformOrigin:"178px 168px",cursor:idle?"pointer":"default"}}>
          <ellipse cx="175" cy="185" rx="19" ry="36" fill="#FEFAF2" stroke="#E8D8B8" strokeWidth="1.5" transform="rotate(10,175,185)"/>
          <ellipse cx="183" cy="155" rx="17" ry="14" fill="#FEFAF2" stroke="#E8D8B8" strokeWidth="1.5" transform="rotate(10,183,155)"/>
          <line x1="177" y1="146" x2="175" y2="140" stroke="#C8112A" strokeWidth="1.5" strokeLinecap="round" opacity=".7"/>
          <line x1="183" y1="144" x2="183" y2="138" stroke="#C8112A" strokeWidth="1.5" strokeLinecap="round" opacity=".7"/>
          <line x1="189" y1="147" x2="191" y2="142" stroke="#C8112A" strokeWidth="1.5" strokeLinecap="round" opacity=".7"/>
          <text x="183" y="159" textAnchor="middle" fontSize="7" fill="#C8112A" fontFamily="Noto Serif SC,serif" opacity=".8" transform="rotate(10,183,155)">開運</text>
          <ellipse cx="178" cy="195" rx="10" ry="8" fill="#C47B2A" opacity=".4" transform="rotate(10,175,185)"/>
        </g>
        <circle cx="120" cy="130" r="68" fill="#FEFAF2" stroke="#E8D8B8" strokeWidth="1.5"/>
        <ellipse cx="152" cy="108" rx="30" ry="26" fill="#C47B2A" opacity=".5"/>
        <ellipse cx="90" cy="105" rx="22" ry="18" fill="#2A1A0A" opacity=".28"/>
        <polygon points="58,72 44,36 84,60" fill="#FEFAF2" stroke="#E8D8B8" strokeWidth="1.5"/>
        <polygon points="182,72 196,36 156,60" fill="#FEFAF2" stroke="#E8D8B8" strokeWidth="1.5"/>
        <polygon points="58,70 46,40 80,62" fill="#2A1A0A" opacity=".55"/>
        <polygon points="182,70 194,40 160,62" fill="#C47B2A" opacity=".75"/>
        <polygon points="60,68 52,48 76,63" fill="#FFBDCA" opacity=".8"/>
        <polygon points="180,68 188,48 164,63" fill="#FFBDCA" opacity=".8"/>
        <circle cx="120" cy="94" r="5" fill="#C8112A" opacity=".6"/>
        <path d="M94 122 Q104 114 114 122" fill="none" stroke="#2A1A0A" strokeWidth="3" strokeLinecap="round"/>
        <path d="M126 122 Q136 114 146 122" fill="none" stroke="#2A1A0A" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="99" cy="119" r="1.5" fill="#2A1A0A" opacity=".6"/>
        <circle cx="141" cy="119" r="1.5" fill="#2A1A0A" opacity=".6"/>
        <polygon points="120,136 116,131 124,131" fill="#FFBDCA"/>
        <path d="M113 138 Q120 144 127 138" fill="none" stroke="#8B4040" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="56" y1="132" x2="106" y2="136" stroke="#bbb" strokeWidth="1" opacity=".7"/>
        <line x1="56" y1="138" x2="106" y2="138" stroke="#bbb" strokeWidth="1" opacity=".7"/>
        <line x1="60" y1="144" x2="108" y2="141" stroke="#bbb" strokeWidth="1" opacity=".7"/>
        <line x1="184" y1="132" x2="134" y2="136" stroke="#bbb" strokeWidth="1" opacity=".7"/>
        <line x1="184" y1="138" x2="134" y2="138" stroke="#bbb" strokeWidth="1" opacity=".7"/>
        <line x1="180" y1="144" x2="132" y2="141" stroke="#bbb" strokeWidth="1" opacity=".7"/>
        <path d="M65 168 Q120 184 175 168" fill="none" stroke="#C8112A" strokeWidth="10" strokeLinecap="round"/>
        <path d="M75 171 Q120 186 165 171" fill="none" stroke="#E8314A" strokeWidth="1" strokeLinecap="round" opacity=".6"/>
        {[85,100,120,140,155].map((x,i)=>(<circle key={i} cx={x} cy={i%2===0?174:176} r="2.5" fill="white" opacity=".7"/>))}
        <g style={{animation:"bellSwing 2.2s ease-in-out infinite",transformOrigin:"120px 182px"}}>
          <ellipse cx="120" cy="186" rx="10" ry="12" fill="#D4A017" stroke="#B8890A" strokeWidth="1.5"/>
          <ellipse cx="120" cy="186" rx="7" ry="9" fill="#F5C842"/>
          <line x1="120" y1="194" x2="120" y2="197" stroke="#B8890A" strokeWidth="2"/>
          <circle cx="120" cy="186" r="3" fill="#B8890A" opacity=".5"/>
        </g>
        {idle&&(<g style={{animation:"float 2s ease-in-out infinite"}}><rect x="158" y="96" width="52" height="20" rx="10" fill="#C8112A" opacity=".9"/><text x="184" y="111" textAnchor="middle" fontSize="10" fill="white" fontFamily="DM Mono,monospace" fontWeight="500">TAP! ✨</text></g>)}
      </svg>
    </div>
  );
}

function Reel({ value, spinning, locked, is4D }) {
  const [disp,setDisp]=useState("?");
  const iv=useRef(null);
  useEffect(()=>{
    if(spinning&&!locked){iv.current=setInterval(()=>{setDisp(is4D?String(Math.floor(Math.random()*10)):String(Math.floor(Math.random()*49+1)).padStart(2,"0"));},72);}
    else{clearInterval(iv.current);if(value!=null)setDisp(is4D?String(value):String(value).padStart(2,"0"));else if(!spinning)setDisp("?");}
    return()=>clearInterval(iv.current);
  },[spinning,locked,value,is4D]);
  return(
    <div style={{width:is4D?64:60,height:72,background:locked?"linear-gradient(180deg,#FFF8E8,#FFF3D0)":"linear-gradient(180deg,#7A1020,#4A0010,#7A1020)",border:`2.5px solid ${locked?"#D4A017":"#C8112A"}`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:locked?"0 0 16px rgba(212,160,23,.5),inset 0 1px 0 rgba(255,255,255,.5)":"inset 0 2px 8px rgba(0,0,0,.4)",transition:"all .35s",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:locked?"rgba(255,255,255,.8)":"rgba(255,255,255,.08)"}}/>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:is4D?30:22,fontWeight:"500",color:locked?"#8B5A00":spinning?"#FFB0B0":"rgba(255,200,200,.3)",animation:locked?"lockIn .45s ease-out forwards":spinning?"reelFlash .18s ease-in-out infinite":"none",letterSpacing:is4D?0:-1}}>{disp}</span>
    </div>
  );
}

function Ticket({ numbers, mode }) {
  return(
    <div style={{animation:"ticketIn .52s cubic-bezier(.34,1.56,.64,1) forwards",background:"linear-gradient(135deg,#FFFDF5,#FFF8E0)",border:"2px solid #D4A017",borderRadius:18,padding:"18px 22px 14px",marginTop:18,boxShadow:"0 8px 28px rgba(212,160,23,.25),0 2px 8px rgba(200,17,42,.12)",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:"linear-gradient(90deg,#C8112A,#D4A017,#C8112A)"}}/>
      <div style={{position:"absolute",top:4,left:16,right:16,height:1,backgroundImage:"repeating-linear-gradient(90deg,transparent,transparent 5px,rgba(212,160,23,.4) 5px,rgba(212,160,23,.4) 9px)"}}/>
      <div style={{textAlign:"center",marginBottom:14,marginTop:6}}>
        <div style={{fontFamily:"'Noto Serif SC',serif",fontSize:11,color:"#C8112A",letterSpacing:4}}>招财猫 LUCKY CAT</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:"#8B5A00",marginTop:3,letterSpacing:1.5}}>{mode==="4d"?"4D LUCKY NUMBER":"TOTO · 6 NUMBERS"}</div>
      </div>
      {mode==="4d"?(<div style={{textAlign:"center"}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:52,fontWeight:"500",color:"#C8112A",letterSpacing:10}}>{numbers.join("")}</span></div>):(<div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>{numbers.map((n,i)=>(<div key={i} style={{width:46,height:46,borderRadius:"50%",background:"radial-gradient(circle at 35% 30%,#F5C842,#B8890A)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:"500",color:"#3D2000",boxShadow:"0 4px 12px rgba(184,137,10,.4)"}}>{String(n).padStart(2,"0")}</div>))}</div>)}
      <div style={{marginTop:14,paddingTop:10,borderTop:"1px dashed rgba(212,160,23,.3)",textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(100,50,0,.45)",letterSpacing:.5}}>{new Date().toLocaleDateString("en-SG",{day:"2-digit",month:"short",year:"numeric"})} · For entertainment only · Please gamble responsibly</div>
    </div>
  );
}

function HistoryRow({ item }) {
  const label=item.mode==="toto"?item.numbers.map(n=>String(n).padStart(2,"0")).join("  ·  "):item.numbers.join("");
  return(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,.7)",border:"1px solid rgba(212,160,23,.25)",borderRadius:10,padding:"9px 14px",animation:"fadeUp .4s ease-out",gap:10}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#C8112A",fontWeight:"500",minWidth:28}}>{item.mode.toUpperCase()}</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#3D2000",letterSpacing:item.mode==="4d"?4:1.5,flex:1,textAlign:"center"}}>{label}</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(100,50,0,.4)"}}>{item.time}</span></div>);
}

export default function App() {
  const [mode,setMode]=useState("toto");
  const [phase,setPhase]=useState("idle");
  const [pending,setPending]=useState([]);
  const [locked,setLocked]=useState([]);
  const [result,setResult]=useState(null);
  const [history,setHistory]=useState([]);
  const tids=useRef([]);
  useEffect(()=>{injectGlobals();},[]);
  function clearTids(){tids.current.forEach(clearTimeout);tids.current=[];}
  function addTid(fn,d){const id=setTimeout(fn,d);tids.current.push(id);}
  const spin=useCallback(()=>{
    if(phase!=="idle")return;
    clearTids();setLocked([]);setResult(null);
    const nums=mode==="toto"?genTOTO():gen4D();
    setPending(nums);setPhase("spinning");
    nums.forEach((_,i)=>addTid(()=>setLocked(p=>[...p,i]),900+i*380));
    addTid(()=>{setResult(nums);setPhase("done");setHistory(p=>[{mode,numbers:nums,time:new Date().toLocaleTimeString("en-SG",{hour:"2-digit",minute:"2-digit"})},...p.slice(0,9)]);addTid(()=>setPhase("idle"),2000);},(900+nums.length*380+220));
  },[phase,mode]);
  const count=mode==="toto"?6:4;const is4D=mode==="4d";
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#FDF3E7 0%,#FAE8D0 60%,#F5DCC0 100%)",color:"#3D1515",display:"flex",flexDirection:"column",alignItems:"center",padding:"22px 18px 52px",position:"relative",overflow:"hidden",fontFamily:"'Playfair Display',serif"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:6,background:"linear-gradient(90deg,#C8112A,#D4A017,#C8112A,#D4A017,#C8112A)"}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,rgba(200,17,42,.04) 1px,transparent 1px)",backgroundSize:"28px 28px",pointerEvents:"none"}}/>
      <div style={{textAlign:"center",marginBottom:10,zIndex:1,marginTop:8}}>
        <div style={{fontFamily:"'Noto Serif SC',serif",fontSize:11,letterSpacing:6,color:"#C8112A",marginBottom:4}}>招财猫</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,lineHeight:1,background:"linear-gradient(135deg,#C8112A 0%,#D4A017 50%,#C8112A 100%)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmerGold 4s linear infinite"}}>Lucky Cat</h1>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(100,40,10,.5)",marginTop:5,letterSpacing:2}}>probability-powered · sg lottery</div>
      </div>
      <div style={{display:"flex",background:"rgba(200,17,42,.08)",borderRadius:50,padding:4,marginBottom:14,border:"1.5px solid rgba(200,17,42,.18)",zIndex:1}}>
        {["toto","4d"].map(m=>(<button key={m} onClick={()=>{if(phase==="idle"){setMode(m);setResult(null);setPending([]);setLocked([]);}}} style={{padding:"9px 34px",borderRadius:50,border:"none",background:mode===m?"linear-gradient(135deg,#C8112A,#880C1E)":"transparent",color:mode===m?"#FFFBF2":"rgba(100,40,10,.55)",fontFamily:"'DM Mono',monospace",fontSize:13,letterSpacing:1.5,cursor:"pointer",transition:"all .25s",fontWeight:"500",boxShadow:mode===m?"0 2px 14px rgba(200,17,42,.4)":"none"}}>{m.toUpperCase()}</button>))}
      </div>
      <Cat phase={phase} onSpin={spin}/>
      {phase==="idle"&&(<div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(100,40,10,.45)",letterSpacing:3,marginBottom:10,animation:"fadeUp .5s ease-out",textAlign:"center"}}>TAP THE CAT'S PAW TO SPIN</div>)}
      {(phase==="spinning"||phase==="done")&&(<div style={{display:"flex",gap:is4D?10:8,justifyContent:"center",marginBottom:10,animation:"fadeUp .3s ease-out",flexWrap:"wrap",zIndex:1}}>{Array(count).fill(0).map((_,i)=>(<Reel key={`${mode}-${i}`} value={pending[i]??null} spinning={phase==="spinning"} locked={locked.includes(i)} is4D={is4D}/>))}</div>)}
      <button onClick={spin} disabled={phase!=="idle"} style={{marginTop:phase==="idle"?4:12,padding:"14px 48px",background:phase!=="idle"?"rgba(200,17,42,.15)":"linear-gradient(135deg,#C8112A,#880C1E)",border:"1.5px solid rgba(212,160,23,.4)",borderRadius:50,color:phase!=="idle"?"rgba(100,40,10,.4)":"#FFFBF2",fontFamily:"'DM Mono',monospace",fontSize:14,letterSpacing:3,cursor:phase!=="idle"?"not-allowed":"pointer",transition:"all .3s",zIndex:1,fontWeight:"500",animation:phase==="idle"?"glowRed 2.8s ease-in-out infinite":"none",boxShadow:phase==="idle"?"0 4px 20px rgba(200,17,42,.35)":"none"}}>
        {phase==="idle"?"✨  SPIN":phase==="spinning"?"🎰  ROLLING...":"🎉  LUCKY!"}
      </button>
      {result&&phase!=="spinning"&&(<div style={{width:"100%",maxWidth:390,zIndex:1}}><Ticket numbers={result} mode={mode}/></div>)}
      {history.length>0&&(<div style={{width:"100%",maxWidth:390,marginTop:28,zIndex:1}}><div style={{fontFamily:"'Noto Serif SC',serif",fontSize:12,color:"rgba(100,40,10,.5)",textAlign:"center",letterSpacing:4,marginBottom:10}}>过去转动</div><div style={{display:"flex",flexDirection:"column",gap:6}}>{history.slice(0,6).map((h,i)=>(<HistoryRow key={i} item={h}/>))}</div></div>)}
      <div style={{marginTop:36,textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(100,40,10,.35)",letterSpacing:.5,lineHeight:1.9,maxWidth:290,zIndex:1}}>For entertainment only. Numbers are statistically weighted but do not predict or guarantee lottery wins. Please gamble responsibly.<br/>NCPG Helpline: 1800-6-668-668</div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:4,background:"linear-gradient(90deg,#C8112A,#D4A017,#C8112A,#D4A017,#C8112A)"}}/>
    </div>
  );
}
