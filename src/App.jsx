import { useState, useEffect, useRef, useCallback } from "react";

function injectGlobals() {
  if (document.getElementById("lc-g")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@400;500&family=Noto+Serif+SC:wght@700&display=swap";
  document.head.appendChild(link);
  const s = document.createElement("style");
  s.id = "lc-g";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0}
    @keyframes pawWave{0%,100%{transform:rotate(-14deg) translateY(0)}50%{transform:rotate(14deg) translateY(-8px)}}
    @keyframes catIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes catBounce{0%,100%{transform:translateY(0)}45%{transform:translateY(-16px)}75%{transform:translateY(-8px)}}
    @keyframes catHappy{0%,100%{transform:rotate(0) translateY(0)}30%{transform:rotate(-5deg) translateY(-12px)}70%{transform:rotate(5deg) translateY(-12px)}}
    @keyframes shimmerGold{0%,100%{color:#C8112A}50%{color:#D4A017}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes lockIn{0%{transform:scale(1.7)}60%{transform:scale(.92)}100%{transform:scale(1)}}
    @keyframes bellSwing{0%,100%{transform:rotate(-15deg)}50%{transform:rotate(15deg)}}
    @keyframes ticketIn{from{opacity:0;transform:scale(.88) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
    @keyframes reelSpin{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes confettiFall{0%{transform:translateY(-30px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(900deg);opacity:0}}
    @keyframes glowBtn{0%,100%{box-shadow:0 4px 18px rgba(0,0,0,.25)}50%{box-shadow:0 6px 32px rgba(0,0,0,.4)}}
    @keyframes winPop{0%{transform:scale(1)}50%{transform:scale(1.06)}100%{transform:scale(1)}}
  `;
  document.head.appendChild(s);
}

// ── THEMES ──────────────────────────────────────────
const TH = {
  toto: {
    p:"#C8112A", p2:"#880C1E", gold:"#D4A017",
    bg:"linear-gradient(170deg,#FDF3E7 0%,#FAE8D0 55%,#F2DCC0 100%)",
    card:"#FFFDF5", text:"#3D1515", muted:"rgba(100,40,10,.52)",
    border:"rgba(212,160,23,.3)", reel:"linear-gradient(180deg,#78101E,#3E0008,#78101E)",
    collar:"#C8112A", label:"TOTO", zh:"六合彩", toggleBg:"rgba(200,17,42,.1)",
  },
  "4d": {
    p:"#1A6B3C", p2:"#0D4A28", gold:"#D4A017",
    bg:"linear-gradient(170deg,#EEF8F1 0%,#DFF0E5 55%,#D0E8D8 100%)",
    card:"#F4FFF7", text:"#0A2B18", muted:"rgba(10,50,25,.52)",
    border:"rgba(26,107,60,.24)", reel:"linear-gradient(180deg,#0A3D20,#052410,#0A3D20)",
    collar:"#1A6B3C", label:"4D", zh:"四位数", toggleBg:"rgba(26,107,60,.1)",
  },
};

// ── PROBABILITY ENGINE ───────────────────────────────
const TW={1:85,2:72,3:91,4:88,5:76,6:95,7:82,8:103,9:79,10:88,11:91,12:86,13:74,14:93,15:88,16:82,17:97,18:85,19:78,20:91,21:88,22:95,23:103,24:86,25:79,26:91,27:88,28:76,29:95,30:82,31:88,32:91,33:85,34:78,35:93,36:88,37:82,38:97,39:85,40:78,41:91,42:88,43:76,44:93,45:88,46:82,47:97,48:85,49:78};
const DW=[{0:8,1:11,2:10,3:9,4:10,5:11,6:10,7:12,8:13,9:11},{0:10,1:10,2:11,3:10,4:9,5:12,6:11,7:10,8:11,9:10},{0:9,1:11,2:10,3:11,4:10,5:10,6:12,7:11,8:10,9:10},{0:11,1:10,2:10,3:9,4:11,5:10,6:10,7:12,8:11,9:10}];
function wPick(w){const e=Object.entries(w),tot=e.reduce((s,[,v])=>s+v,0);let r=Math.random()*tot;for(const[k,v]of e){r-=v;if(r<=0)return+k;}return+e[e.length-1][0];}
function genTOTO(){const s=new Set();while(s.size<6)s.add(wPick(TW));return[...s].sort((a,b)=>a-b);}
function gen4D(){return DW.map(w=>wPick(w));}

// ── LATEST RESULTS (scraper updates these) ───────────
// ── SUPABASE CONFIG ───────────────────────────────────
const SUPA_URL = "https://zctrxistatxvenkcwjpv.supabase.co";
const SUPA_KEY = "sb_publishable_u0XQ6twMGQ20IsQCe7oRMQ_9K5OENqV";

async function fetchLatestTOTO() {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/toto_results?order=draw_no.desc&limit=1`, {
      headers:{ apikey:SUPA_KEY, Authorization:`Bearer ${SUPA_KEY}` }
    });
    const d = await r.json();
    if (!d || !d[0] || !d[0].num1) return null;
    const row = d[0];
    return {
      date: row.draw_date || "—",
      draw: row.draw_no,
      numbers: [row.num1,row.num2,row.num3,row.num4,row.num5,row.num6].filter(Boolean),
      additional: row.additional,
      jackpot: row.jackpot || "—",
    };
  } catch(e) { return null; }
}

async function fetchLatest4D() {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/4d_results?order=draw_no.desc&limit=1`, {
      headers:{ apikey:SUPA_KEY, Authorization:`Bearer ${SUPA_KEY}` }
    });
    const d = await r.json();
    if (!d || !d[0] || !d[0].first) return null;
    const row = d[0];
    const parse = (v) => { try { return typeof v==="string"?JSON.parse(v):v||[]; } catch{ return []; }};
    return {
      date: row.draw_date || "—",
      draw: row.draw_no,
      first: row.first,
      second: row.second,
      third: row.third,
      special: parse(row.special),
      consolation: parse(row.consolation),
    };
  } catch(e) { return null; }
}

const FALLBACK = {
  toto:{ date:"—", draw:"—", numbers:[], additional:null, jackpot:"—" },
  "4d":{ date:"—", draw:"—", first:"—", second:"—", third:"—", special:[], consolation:[] },
};

// ── CONFETTI ─────────────────────────────────────────
function triggerConfetti() {
  const colors=["#C8112A","#D4A017","#F5C842","#1A6B3C","#FF90A8","#FFFFFF","#FFD700"];
  for(let i=0;i<90;i++){
    const el=document.createElement("div");
    const sz=Math.random()*10+5;
    const isCircle=Math.random()>.5;
    el.style.cssText=`position:fixed;top:-40px;left:${Math.random()*100}vw;width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${isCircle?"50%":"3px"};animation:confettiFall ${1.8+Math.random()*2.2}s ease-in ${Math.random()*.9}s forwards;pointer-events:none;z-index:9998;`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),5000);
  }
}

// ── STORIES IMAGE (1080x1920 portrait) ──────────────
function buildStoriesImage(numbers, mode, theme, cb) {
  const W=1080, H=1920;
  const c=document.createElement("canvas");
  c.width=W; c.height=H;
  const ctx=c.getContext("2d");
  const isT=mode==="toto";

  // Background
  const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0, isT?"#2A0008":"#081A0E");
  bg.addColorStop(0.5, isT?"#C8112A":"#1A6B3C");
  bg.addColorStop(1, isT?"#1A0005":"#040E08");
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

  // Dot pattern
  ctx.fillStyle="rgba(212,160,23,.07)";
  for(let x=0;x<W;x+=44)for(let y=0;y<H;y+=44){ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill();}

  // Borders
  ctx.strokeStyle="#D4A017"; ctx.lineWidth=18; ctx.strokeRect(18,18,W-36,H-36);
  ctx.strokeStyle="rgba(212,160,23,.35)"; ctx.lineWidth=5; ctx.strokeRect(36,36,W-72,H-72);

  // Decorative corner diamonds
  [[60,60],[W-60,60],[60,H-60],[W-60,H-60]].forEach(([x,y])=>{
    ctx.save(); ctx.translate(x,y); ctx.rotate(Math.PI/4);
    ctx.fillStyle="#D4A017"; ctx.fillRect(-14,-14,28,28);
    ctx.fillStyle="rgba(255,255,255,.3)"; ctx.fillRect(-7,-7,14,14);
    ctx.restore();
  });

  // ── CAT ──────────────────────────────────────────────
  const cx=W/2, cy=640, r=260;

  // Round ears (drawn first, head covers bottom)
  [cx-155, cx+155].forEach((ex,i)=>{
    ctx.fillStyle="#FEFAF2"; ctx.beginPath(); ctx.arc(ex,cy-195,82,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#EDD8B0"; ctx.lineWidth=5; ctx.stroke();
    ctx.fillStyle="#FFCCD8"; ctx.beginPath(); ctx.arc(ex,cy-200,52,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=i===0?"rgba(196,123,42,.55)":"rgba(42,26,10,.38)";
    ctx.beginPath(); ctx.arc(ex,cy-204,28,0,Math.PI*2); ctx.fill();
  });

  // Head
  ctx.fillStyle="#FEFAF2"; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#EDD8B0"; ctx.lineWidth=6; ctx.stroke();

  // Calico patches
  ctx.fillStyle="rgba(196,123,42,.45)";
  ctx.beginPath(); ctx.ellipse(cx+115,cy-65,125,105,0.2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="rgba(42,26,10,.25)";
  ctx.beginPath(); ctx.ellipse(cx-95,cy-75,95,80,-0.1,0,Math.PI*2); ctx.fill();

  // Forehead dot
  ctx.fillStyle=isT?"rgba(200,17,42,.55)":"rgba(26,107,60,.55)";
  ctx.beginPath(); ctx.arc(cx,cy-195,22,0,Math.PI*2); ctx.fill();

  // Happy crescent eyes
  ctx.strokeStyle="#2A1A0A"; ctx.lineWidth=15; ctx.lineCap="round";
  ctx.beginPath(); ctx.arc(cx-95,cy-25,58,Math.PI*1.18,Math.PI*1.82); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx+95,cy-25,58,Math.PI*1.18,Math.PI*1.82); ctx.stroke();

  // Nose
  ctx.fillStyle="#FFCCD8"; ctx.beginPath(); ctx.arc(cx,cy+42,18,0,Math.PI*2); ctx.fill();

  // Smile
  ctx.strokeStyle="#904040"; ctx.lineWidth=9; ctx.lineCap="round";
  ctx.beginPath(); ctx.moveTo(cx-55,cy+72); ctx.quadraticCurveTo(cx,cy+115,cx+55,cy+72); ctx.stroke();

  // Whiskers
  ctx.strokeStyle="rgba(200,200,200,.65)"; ctx.lineWidth=4.5; ctx.lineCap="round";
  [[cx-108,cy-10,cx-290,cy-30],[cx-108,cy+18,cx-290,cy+28],
   [cx+108,cy-10,cx+290,cy-30],[cx+108,cy+18,cx+290,cy+28]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });

  // Collar
  ctx.strokeStyle=isT?"#C8112A":"#1A6B3C"; ctx.lineWidth=44; ctx.lineCap="round";
  ctx.beginPath(); ctx.arc(cx,cy,r,Math.PI*0.62,Math.PI*0.38); ctx.stroke();
  // Collar shine
  ctx.strokeStyle="rgba(255,255,255,.2)"; ctx.lineWidth=10;
  ctx.beginPath(); ctx.arc(cx,cy,r,Math.PI*0.64,Math.PI*0.36); ctx.stroke();

  // Bell
  const bellG=ctx.createRadialGradient(cx-12,cy+r-14,4,cx,cy+r+2,32);
  bellG.addColorStop(0,"#F5C842"); bellG.addColorStop(1,"#A07810");
  ctx.fillStyle=bellG; ctx.beginPath(); ctx.arc(cx,cy+r+2,34,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="rgba(0,0,0,.2)"; ctx.beginPath(); ctx.arc(cx,cy+r+2,12,0,Math.PI*2); ctx.fill();

  // Raised paw (right side) - simplified circle paw
  ctx.save(); ctx.translate(cx+245,cy-55); ctx.rotate(-0.4);
  ctx.fillStyle="#FEFAF2"; ctx.strokeStyle="#EDD8B0"; ctx.lineWidth=5;
  ctx.beginPath(); ctx.ellipse(0,0,62,115,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0,-110,50,42,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle="#FFCCD8";
  [[-18,-138],[0,-144],[18,-138]].forEach(([px,py])=>{ctx.beginPath();ctx.arc(px,py,16,0,Math.PI*2);ctx.fill();});
  ctx.restore();

  // ── HEADER TEXT ──────────────────────────────────────
  ctx.textAlign="center"; ctx.fillStyle="#D4A017";
  ctx.font="bold 62px serif"; ctx.fillText("招财猫  Lucky Cat",W/2,120);
  ctx.fillStyle="rgba(255,255,255,.55)"; ctx.font="500 36px monospace";
  ctx.fillText(isT?"六合彩  TOTO":"四位数  4D",W/2,175);

  // ── DIVIDER ──────────────────────────────────────────
  const divY=980;
  ctx.strokeStyle="rgba(212,160,23,.4)"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(80,divY); ctx.lineTo(W-80,divY); ctx.stroke();
  // Divider diamonds
  [W/2-60,W/2,W/2+60].forEach(x=>{
    ctx.save(); ctx.translate(x,divY); ctx.rotate(Math.PI/4);
    ctx.fillStyle="#D4A017"; ctx.fillRect(-7,-7,14,14);
    ctx.restore();
  });

  // ── NUMBERS ──────────────────────────────────────────
  if(isT){
    // TOTO: 6 gold balls in 3+3 grid
    const ballR=105, rows=[[0,1,2],[3,4,5]];
    rows.forEach((row,ri)=>{
      const rowY=1120+ri*240;
      const startX=W/2-(row.length-1)*(ballR*2+18)/2;
      row.forEach((idx,ci)=>{
        const n=numbers[idx];
        if(n==null)return;
        const bx=startX+ci*(ballR*2+18), by=rowY;
        const bg2=ctx.createRadialGradient(bx-ballR*0.35,by-ballR*0.35,8,bx,by,ballR);
        bg2.addColorStop(0,"#F5C842"); bg2.addColorStop(1,"#A07810");
        ctx.fillStyle=bg2; ctx.beginPath(); ctx.arc(bx,by,ballR,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle="rgba(255,255,255,.15)"; ctx.lineWidth=4; ctx.stroke();
        ctx.fillStyle="#3D2000"; ctx.font="bold 88px monospace";
        ctx.fillText(String(n).padStart(2,"0"),bx,by+32);
      });
    });
  } else {
    // 4D: huge single number
    ctx.fillStyle="rgba(255,255,255,.12)";
    ctx.beginPath(); ctx.roundRect(80,1020,W-160,280,30); ctx.fill();
    ctx.fillStyle="#FFFFFF"; ctx.font="bold 220px monospace";
    ctx.fillText(numbers.join(""),W/2,1270);
  }

  // ── HUAT HUAT ────────────────────────────────────────
  const huatY=isT?1590:1430;
  ctx.fillStyle="#F5C842";
  ctx.font="bold 120px serif"; ctx.fillText("HUAT HUAT!",W/2,huatY);
  ctx.fillStyle="rgba(255,255,255,.75)";
  ctx.font="bold 90px serif"; ctx.fillText("发 发! 🧧",W/2,huatY+110);

  // Coins
  const coinY=isT?1760:1620;
  [-360,-180,0,180,360].forEach((ox,i)=>{
    const coinR=i===2?40:28;
    const cg=ctx.createRadialGradient(W/2+ox-coinR*0.3,coinY-coinR*0.3,3,W/2+ox,coinY,coinR);
    cg.addColorStop(0,"#F5C842"); cg.addColorStop(1,"#A07810");
    ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(W/2+ox,coinY,coinR,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.25)"; ctx.beginPath(); ctx.arc(W/2+ox,coinY,coinR*0.5,0,Math.PI*2); ctx.fill();
  });

  // Footer
  ctx.fillStyle="rgba(255,255,255,.3)"; ctx.font="26px monospace";
  ctx.fillText("lucky-cat-ten.vercel.app",W/2,H-80);
  ctx.font="20px monospace";
  ctx.fillText("For entertainment only  ·  NCPG 1800-6-668-668",W/2,H-44);

  c.toBlob(cb,"image/png");
}

async function shareToStories(numbers, mode, theme) {
  buildStoriesImage(numbers, mode, theme, async(blob)=>{
    const file=new File([blob],"lucky-cat-huat.png",{type:"image/png"});
    const txt=`🐱 HUAT HUAT! 发发! My Lucky Cat ${mode.toUpperCase()}: ${mode==="4d"?numbers.join(""):numbers.join(", ")} — lucky-cat-ten.vercel.app`;
    if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
      try{await navigator.share({files:[file],title:"HUAT HUAT! 发发!",text:txt});}
      catch(e){if(e.name!=="AbortError")downloadBlob(blob);}
    } else { downloadBlob(blob); }
  });
}

function downloadBlob(blob){const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download="lucky-cat-huat.png";a.click();setTimeout(()=>URL.revokeObjectURL(u),3000);}

// Legacy square share for WhatsApp/Telegram
async function shareResult(numbers, mode, theme) {
  const c=document.createElement("canvas");
  c.width=1080;c.height=1080;
  const ctx=c.getContext("2d");
  const isT=mode==="toto";
  const g=ctx.createLinearGradient(0,0,1080,1080);
  g.addColorStop(0,isT?"#FDF3E7":"#EEF8F1"); g.addColorStop(1,isT?"#F2DCC0":"#D0E8D8");
  ctx.fillStyle=g; ctx.fillRect(0,0,1080,1080);
  ctx.strokeStyle=isT?"#C8112A":"#1A6B3C"; ctx.lineWidth=28; ctx.strokeRect(14,14,1052,1052);
  ctx.strokeStyle="#D4A017"; ctx.lineWidth=7; ctx.strokeRect(28,28,1024,1024);
  ctx.textAlign="center";
  ctx.fillStyle=isT?"#C8112A":"#1A6B3C"; ctx.font="bold 68px serif"; ctx.fillText("招财猫  Lucky Cat",540,130);
  ctx.fillStyle="#D4A017"; ctx.font="500 38px monospace"; ctx.fillText(isT?"TOTO — 6 LUCKY NUMBERS":"4D — LUCKY NUMBER",540,210);
  if(isT){ctx.font="bold 90px monospace";const row=numbers.map(n=>String(n).padStart(2,"0")).join("  ");ctx.fillStyle="#D4A017";ctx.fillText(row,540,480);}
  else{ctx.fillStyle=isT?"#C8112A":"#1A6B3C";ctx.font="bold 160px monospace";ctx.fillText(numbers.join(""),540,480);}
  ctx.fillStyle="rgba(0,0,0,.3)"; ctx.font="26px monospace"; ctx.fillText("lucky-cat-ten.vercel.app",540,620);
  c.toBlob(async(blob)=>{
    const file=new File([blob],"lucky-cat.png",{type:"image/png"});
    const txt=encodeURIComponent(`🐱 My Lucky Cat ${mode.toUpperCase()}: ${mode==="4d"?numbers.join(""):numbers.join(", ")} HUAT HUAT! lucky-cat-ten.vercel.app`);
    if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file]});}catch(e){downloadBlob(blob);}}
    else{window.open(`https://wa.me/?text=${txt}`,"_blank");}
  });
}


// ── SHARE BUTTONS ────────────────────────────────────
function ShareButtons({ numbers, mode, theme }) {
  const t=theme;
  const txt=encodeURIComponent(`🐱 HUAT HUAT! My Lucky Cat ${mode.toUpperCase()}: ${mode==="4d"?numbers.join(""):numbers.join(", ")} — lucky-cat-ten.vercel.app`);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:12}}>
      {/* Primary CTA — Stories */}
      <button onClick={()=>shareToStories(numbers,mode,t)} style={{width:"100%",padding:"14px",background:`linear-gradient(135deg,${t.p},${t.gold})`,border:"none",borderRadius:14,color:"white",fontFamily:"'DM Mono',monospace",fontSize:13,cursor:"pointer",letterSpacing:.5,fontWeight:"500",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span style={{fontSize:18}}>📲</span>
        Share to Stories — IG · TikTok · Lemon8
      </button>
      {/* Secondary row */}
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>window.open(`https://wa.me/?text=${txt}`,"_blank")} style={{flex:1,padding:"10px 8px",background:"#25D366",border:"none",borderRadius:10,color:"white",fontFamily:"'DM Mono',monospace",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
          <span style={{fontSize:14}}>💬</span>WhatsApp
        </button>
        <button onClick={()=>window.open(`https://t.me/share/url?url=lucky-cat-ten.vercel.app&text=${txt}`,"_blank")} style={{flex:1,padding:"10px 8px",background:"#0088CC",border:"none",borderRadius:10,color:"white",fontFamily:"'DM Mono',monospace",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
          <span style={{fontSize:14}}>✈️</span>Telegram
        </button>
        <button onClick={()=>shareResult(numbers,mode,t)} style={{flex:1,padding:"10px 8px",background:`${t.p}CC`,border:"none",borderRadius:10,color:"white",fontFamily:"'DM Mono',monospace",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
          <span style={{fontSize:14}}>📥</span>Save
        </button>
      </div>
    </div>
  );
}


// ── CAT SVG (all round, no pointy shapes) ────────────
function Cat({ phase, theme }) {
  const spinning=phase==="spinning", done=phase==="done";
  const t=theme;
  return(
    <div style={{display:"flex",justifyContent:"center",userSelect:"none"}}>
      <svg width="240" height="276" viewBox="0 0 240 276" style={{
        animation:spinning?"catBounce .42s ease-in-out infinite":done?"catHappy .55s ease-in-out 4":"catIdle 3.2s ease-in-out infinite",
        filter:`drop-shadow(0 12px 22px ${t.p}38) drop-shadow(0 4px 8px rgba(0,0,0,.09))`,
        transition:"filter .5s",
      }}>
        {/* Red cushion */}
        <rect x="34" y="252" width="172" height="22" rx="11" fill={t.p}/>
        <rect x="34" y="252" width="172" height="7" rx="7" fill="rgba(255,255,255,.22)"/>
        {/* Tassel circles */}
        {[42,198].map((x,i)=>(
          <g key={i}>
            <circle cx={x} cy="252" r="7" fill={t.gold}/>
            <circle cx={x} cy="265" r="5" fill={t.gold} opacity=".7"/>
            <circle cx={x} cy="275" r="4" fill={t.gold} opacity=".5"/>
          </g>
        ))}
        {/* Body */}
        <ellipse cx="120" cy="208" rx="80" ry="52" fill="#FEFAF2" stroke="#EDD8B0" strokeWidth="1.5"/>
        <ellipse cx="168" cy="215" rx="32" ry="25" fill="#C47B2A" opacity=".5"/>
        <ellipse cx="70" cy="222" rx="22" ry="18" fill="#2A1A0A" opacity=".28"/>
        {/* Koban */}
        <ellipse cx="84" cy="216" rx="28" ry="36" fill={t.gold} stroke="#C8960C" strokeWidth="1.8" transform="rotate(-7,84,216)"/>
        <ellipse cx="84" cy="216" rx="22" ry="29" fill="#F5C842" transform="rotate(-7,84,216)"/>
        {["招福","大開","運"].map((ch,i)=>(<text key={i} x="76" y={206+i*12} textAnchor="middle" fontSize="8.5" fill="#6A4C00" fontWeight="bold" fontFamily="Noto Serif SC,serif" transform="rotate(-7,84,216)">{ch}</text>))}
        {/* Left arm */}
        <ellipse cx="70" cy="234" rx="19" ry="13" fill="#FEFAF2" stroke="#EDD8B0" strokeWidth="1.5" transform="rotate(18,70,234)"/>
        <circle cx="60" cy="242" r="9" fill="#FEFAF2" stroke="#EDD8B0" strokeWidth="1.5"/>
        <circle cx="60" cy="242" r="6" fill="#FFCCD8" opacity=".7"/>
        {/* Right arm — always waving, no click on cat */}
        <g style={{animation:"pawWave 1.9s ease-in-out infinite",transformOrigin:"174px 172px"}}>
          <ellipse cx="174" cy="186" rx="18" ry="34" fill="#FEFAF2" stroke="#EDD8B0" strokeWidth="1.5" transform="rotate(8,174,186)"/>
          <circle cx="182" cy="155" r="16" fill="#FEFAF2" stroke="#EDD8B0" strokeWidth="1.5"/>
          <circle cx="182" cy="155" r="11" fill="#FFCCD8" opacity=".65"/>
          {/* Toe circles */}
          {[[175,144],[183,141],[191,145]].map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r="5" fill="#FFCCD8" opacity=".9"/>))}
          <text x="182" y="159" textAnchor="middle" fontSize="7" fill={t.p} fontFamily="Noto Serif SC,serif" opacity=".85" transform="rotate(8,182,155)">開運</text>
          <ellipse cx="177" cy="196" rx="9" ry="7" fill="#C47B2A" opacity=".38" transform="rotate(8,174,186)"/>
        </g>
        {/* ROUND ears — circles, head covers bottom half */}
        <circle cx="74" cy="84" r="32" fill="#FEFAF2" stroke="#EDD8B0" strokeWidth="1.5"/>
        <circle cx="166" cy="84" r="32" fill="#FEFAF2" stroke="#EDD8B0" strokeWidth="1.5"/>
        <circle cx="74" cy="80" r="21" fill="#FFCCD8" opacity=".75"/>
        <circle cx="166" cy="80" r="21" fill="#FFCCD8" opacity=".75"/>
        <circle cx="74" cy="76" r="12" fill="#C47B2A" opacity=".52"/>
        <circle cx="166" cy="76" r="12" fill="#2A1A0A" opacity=".32"/>
        {/* Head covers ears' bottom — drawn after so ears peek out as round bumps */}
        <circle cx="120" cy="138" r="70" fill="#FEFAF2" stroke="#EDD8B0" strokeWidth="1.5"/>
        {/* Patches */}
        <ellipse cx="150" cy="116" rx="34" ry="28" fill="#C47B2A" opacity=".45"/>
        <ellipse cx="88" cy="112" rx="26" ry="21" fill="#2A1A0A" opacity=".24"/>
        {/* Forehead dot */}
        <circle cx="120" cy="100" r="6.5" fill={t.p} opacity=".52"/>
        {/* Happy closed eyes (crescents) */}
        <path d="M94 130 Q107 118 120 130" fill="none" stroke="#2A1A0A" strokeWidth="3.2" strokeLinecap="round"/>
        <path d="M120 130 Q133 118 146 130" fill="none" stroke="#2A1A0A" strokeWidth="3.2" strokeLinecap="round"/>
        {/* Nose */}
        <circle cx="120" cy="144" r="5.5" fill="#FFCCD8"/>
        {/* Mouth */}
        <path d="M112 150 Q120 158 128 150" fill="none" stroke="#904040" strokeWidth="1.8" strokeLinecap="round"/>
        {/* Whiskers */}
        {[[50,138,104,143],[50,146,104,146]].map(([x1,y1,x2,y2],i)=>(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ccc" strokeWidth=".9" opacity=".72"/>))}
        {[[190,138,136,143],[190,146,136,146]].map(([x1,y1,x2,y2],i)=>(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ccc" strokeWidth=".9" opacity=".72"/>))}
        {/* Collar */}
        <path d="M60 172 Q120 192 180 172" fill="none" stroke={t.collar} strokeWidth="11" strokeLinecap="round"/>
        <path d="M64 175 Q120 194 176 175" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="3" strokeLinecap="round"/>
        {[76,93,120,147,164].map((x,i)=>(<circle key={i} cx={x} cy={i%2===0?176:179} r="2.5" fill="white" opacity=".75"/>))}
        {/* Bell */}
        <g style={{animation:"bellSwing 2.1s ease-in-out infinite",transformOrigin:"120px 190px"}}>
          <circle cx="120" cy="195" r="13" fill={t.gold} stroke="#A07810" strokeWidth="1.5"/>
          <circle cx="120" cy="195" r="9" fill="#F5C842"/>
          <circle cx="120" cy="195" r="3.5" fill="#A07810" opacity=".55"/>
        </g>
      </svg>
    </div>
  );
}

// ── REEL ─────────────────────────────────────────────
function Reel({ value, spinning, locked, is4D, theme }) {
  const [disp,setDisp]=useState("?");
  const iv=useRef(null);
  useEffect(()=>{
    if(spinning&&!locked){iv.current=setInterval(()=>setDisp(is4D?String(Math.floor(Math.random()*10)):String(Math.floor(Math.random()*49+1)).padStart(2,"0")),68);}
    else{clearInterval(iv.current);if(value!=null)setDisp(is4D?String(value):String(value).padStart(2,"0"));else if(!spinning)setDisp("?");}
    return()=>clearInterval(iv.current);
  },[spinning,locked,value,is4D]);
  return(
    <div style={{width:is4D?66:62,height:74,background:locked?"linear-gradient(180deg,#FFF9E8,#FFF3CC)":theme.reel,border:`2.5px solid ${locked?theme.gold:theme.p}`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:locked?`0 0 18px ${theme.gold}70,inset 0 1px 0 rgba(255,255,255,.5)`:"inset 0 3px 10px rgba(0,0,0,.45)",transition:"all .38s"}}>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:is4D?31:23,fontWeight:"500",color:locked?"#7A5000":spinning?"rgba(255,180,180,.9)":"rgba(255,180,180,.28)",animation:locked?"lockIn .42s cubic-bezier(.34,1.56,.64,1) forwards":spinning?"reelSpin .18s ease-in-out infinite":"none",letterSpacing:is4D?0:-1,display:"block"}}>{disp}</span>
    </div>
  );
}

// ── TICKET ───────────────────────────────────────────
function Ticket({ numbers, mode, theme }) {
  const t=theme;
  return(
    <div style={{animation:"ticketIn .52s cubic-bezier(.34,1.56,.64,1) forwards",background:t.card,border:`2px solid ${t.gold}`,borderRadius:18,padding:"16px 20px 12px",marginTop:14,boxShadow:`0 8px 28px ${t.gold}38`,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:`linear-gradient(90deg,${t.p},${t.gold},${t.p})`}}/>
      <div style={{position:"absolute",top:4,left:14,right:14,height:1,backgroundImage:`repeating-linear-gradient(90deg,transparent,transparent 5px,${t.gold}44 5px,${t.gold}44 9px)`}}/>
      <div style={{textAlign:"center",margin:"8px 0 12px"}}>
        <div style={{fontFamily:"'Noto Serif SC',serif",fontSize:10,color:t.p,letterSpacing:4}}>招财猫 LUCKY CAT</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:12,color:"#8B5A00",marginTop:2,letterSpacing:1.5}}>{mode==="4d"?"4D LUCKY NUMBER":"TOTO · 6 NUMBERS"}</div>
      </div>
      {mode==="4d"
        ?<div style={{textAlign:"center"}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:52,fontWeight:"500",color:t.p,letterSpacing:10}}>{numbers.join("")}</span></div>
        :<div style={{display:"flex",gap:7,justifyContent:"center",flexWrap:"wrap"}}>{numbers.map((n,i)=>(<div key={i} style={{width:44,height:44,borderRadius:"50%",background:`radial-gradient(circle at 35% 30%,#F5C842,#B07810)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:"500",color:"#3D2000"}}>{String(n).padStart(2,"0")}</div>))}</div>
      }
      <div style={{marginTop:12,paddingTop:8,borderTop:`1px dashed ${t.border}`,textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:9,color:t.muted}}>
        {new Date().toLocaleDateString("en-SG",{day:"2-digit",month:"short",year:"numeric"})} · For entertainment only · Please gamble responsibly
      </div>
    </div>
  );
}

// ── SPIN TAB ─────────────────────────────────────────
function SpinTab({ mode, setMode, theme, phase, spin, pending, locked, result }) {
  const t=theme, is4D=mode==="4d", count=is4D?4:6;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 16px 90px"}}>
      {/* Header */}
      <div style={{textAlign:"center",marginBottom:10}}>
        <div style={{fontFamily:"'Noto Serif SC',serif",fontSize:11,letterSpacing:6,color:t.p,marginBottom:4,transition:"color .5s"}}>{t.zh}</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,color:t.p,animation:"shimmerGold 3s ease-in-out infinite",transition:"color .5s"}}>Lucky Cat</h1>
      </div>
      {/* Mode toggle */}
      <div style={{display:"flex",background:t.toggleBg,borderRadius:50,padding:4,marginBottom:14,border:`1.5px solid ${t.p}28`,transition:"all .5s"}}>
        {["toto","4d"].map(m=>(
          <button key={m} onClick={()=>setMode(m)} style={{padding:"9px 32px",borderRadius:50,border:"none",background:mode===m?`linear-gradient(135deg,${TH[m].p},${TH[m].p2})`:"transparent",color:mode===m?"#FFFBF2":t.muted,fontFamily:"'DM Mono',monospace",fontSize:13,letterSpacing:1.5,cursor:"pointer",transition:"all .45s",fontWeight:"500",boxShadow:mode===m?`0 2px 14px ${TH[m].p}55`:"none"}}>
            {TH[m].label}
          </button>
        ))}
      </div>
      {/* Cat — paw always waves, no click-to-spin */}
      <Cat phase={phase} theme={t}/>
      {/* Hint */}
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:t.muted,letterSpacing:2.5,marginBottom:10,textAlign:"center",opacity: phase==="idle"?1:0,transition:"opacity .3s"}}>TAP SPIN TO GET YOUR NUMBERS</div>
      {/* Reels */}
      {(phase==="spinning"||phase==="done")&&(
        <div style={{display:"flex",gap:is4D?10:8,justifyContent:"center",marginBottom:10,animation:"fadeUp .3s ease-out",flexWrap:"wrap"}}>
          {Array(count).fill(0).map((_,i)=>(<Reel key={`${mode}-${i}`} value={pending[i]??null} spinning={phase==="spinning"} locked={locked.includes(i)} is4D={is4D} theme={t}/>))}
        </div>
      )}
      {/* Spin button */}
      <button onClick={spin} disabled={phase!=="idle"} style={{padding:"13px 48px",background:phase!=="idle"?`${t.p}1A`:`linear-gradient(135deg,${t.p},${t.p2})`,border:`1.5px solid ${t.gold}55`,borderRadius:50,color:phase!=="idle"?t.muted:"#FFFBF2",fontFamily:"'DM Mono',monospace",fontSize:14,letterSpacing:3,cursor:phase!=="idle"?"not-allowed":"pointer",transition:"all .4s",fontWeight:"500",animation:phase==="idle"?"glowBtn 2.8s ease-in-out infinite":"none",boxShadow:phase==="idle"?`0 4px 20px ${t.p}44`:"none"}}>
        {phase==="idle"?"✨  SPIN":phase==="spinning"?"🎰  ROLLING...":"🎉  LUCKY!"}
      </button>
      {/* Result */}
      {result&&phase!=="spinning"&&(
        <div style={{width:"100%",maxWidth:390,animation:"fadeUp .4s ease-out"}}>
          <Ticket numbers={result} mode={mode} theme={t}/>
          <ShareButtons numbers={result} mode={mode} theme={t}/>
        </div>
      )}
    </div>
  );
}

// ── RESULTS TAB ──────────────────────────────────────
function ResultsTab({ theme }) {
  const [rMode,setRMode]=useState("toto");
  const [data,setData]=useState(FALLBACK["toto"]);
  const [loading,setLoading]=useState(true);
  const [selNums,setSelNums]=useState([]);
  const [digits,setDigits]=useState([]);
  const [matched,setMatched]=useState(null);
  const t=theme;

  useEffect(()=>{
    setLoading(true);setData(FALLBACK[rMode]);setMatched(null);setSelNums([]);setDigits([]);
    const fn=rMode==="toto"?fetchLatestTOTO:fetchLatest4D;
    fn().then(r=>{if(r)setData(r);setLoading(false);});
  },[rMode]);

  function toggleNum(n){
    setMatched(null);
    setSelNums(p=>p.includes(n)?p.filter(x=>x!==n):p.length<6?[...p,n]:p);
  }
  function tapDigit(d){setMatched(null);setDigits(p=>p.length<4?[...p,d]:p);}
  function backspace(){setMatched(null);setDigits(p=>p.slice(0,-1));}
  function clearAll(){setMatched(null);setDigits([]);setSelNums([]);}

  function getGroup(hits,bonus){
    if(hits===6)return 1;if(hits===5&&bonus)return 2;if(hits===5)return 3;
    if(hits===4&&bonus)return 4;if(hits===4)return 5;if(hits===3&&bonus)return 6;
    if(hits===3)return 7;return null;
  }
  const TOTO_PRIZE={1:"Jackpot — split among winners",2:"~Varies (8% of pool)",3:"~Varies (5.5% of pool)",4:"~Varies (3% of pool)",5:"$50 fixed",6:"$25 fixed",7:"$10 fixed"};
  const FOURD={first:{label:"1st Prize",big:"$2,000",small:"$3,000"},second:{label:"2nd Prize",big:"$1,000",small:"$2,000"},third:{label:"3rd Prize",big:"$490",small:"$800"},special:{label:"Special Prize",big:"$250",small:"—"},consolation:{label:"Consolation",big:"$60",small:"—"}};

  function check(){
    if(rMode==="toto"){
      if(!selNums.length)return;
      const hits=selNums.filter(n=>data.numbers?.includes(n)).length;
      const bonus=selNums.includes(data.additional);
      const group=getGroup(hits,bonus);
      const win=hits>=3;
      setMatched({hits,bonus,group,prize:TOTO_PRIZE[group],win});
      if(win)triggerConfetti();
    } else {
      if(digits.length<4)return;
      const num=digits.join("");
      const tier=num===data.first?"first":num===data.second?"second":num===data.third?"third":data.special?.includes(num)?"special":data.consolation?.includes(num)?"consolation":null;
      setMatched({num,tier,win:!!tier});
      if(tier)triggerConfetti();
    }
  }

  const canCheck=rMode==="toto"?selNums.length>0:digits.length===4;

  const RBall=({n,hi})=>(
    <div style={{width:38,height:38,borderRadius:"50%",background:hi?`radial-gradient(circle at 35% 30%,${t.gold},#A07810)`:"linear-gradient(135deg,#E0E0E0,#B0B0B0)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:"500",color:hi?"#3D2000":"#555",flexShrink:0}}>
      {String(n).padStart(2,"0")}
    </div>
  );

  return(
    <div style={{padding:"16px 16px 90px",maxWidth:440,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:14}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:t.p,animation:"shimmerGold 3s ease-in-out infinite"}}>Latest Results</div>
        <div style={{fontFamily:"'Noto Serif SC',serif",fontSize:10,color:t.muted,marginTop:2,letterSpacing:2}}>最新开奖结果</div>
      </div>

      {/* Mode toggle */}
      <div style={{display:"flex",background:t.toggleBg,borderRadius:50,padding:3,marginBottom:14,border:`1px solid ${t.p}20`}}>
        {["toto","4d"].map(m=>(<button key={m} onClick={()=>setRMode(m)} style={{flex:1,padding:"8px",borderRadius:50,border:"none",background:rMode===m?`linear-gradient(135deg,${TH[m].p},${TH[m].p2})`:"transparent",color:rMode===m?"white":t.muted,fontFamily:"'DM Mono',monospace",fontSize:12,cursor:"pointer",transition:"all .3s",fontWeight:"500"}}>{TH[m].label}</button>))}
      </div>

      {/* Latest result card */}
      <div style={{background:t.card,border:`1.5px solid ${t.gold}44`,borderRadius:16,padding:16,marginBottom:14,boxShadow:`0 4px 18px ${t.gold}22`}}>
        {loading&&<div style={{textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:11,color:t.muted,padding:"8px 0",letterSpacing:1}}>Loading results...</div>}
        {!loading&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:t.muted}}>Draw #{data.draw}</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:t.muted}}>{data.date}</span>
            </div>
            {rMode==="toto"?(
              <>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginBottom:8}}>
                  {data.numbers?.map((n,i)=>(<RBall key={i} n={n} hi={true}/>))}
                  {data.additional&&<div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#888,#555)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:"500",color:"white"}}>{String(data.additional).padStart(2,"0")}</div>}
                </div>
                <div style={{textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:11,color:t.muted}}>Jackpot: <span style={{color:t.p,fontWeight:"500"}}>{data.jackpot}</span></div>
              </>
            ):(
              <div style={{fontFamily:"'DM Mono',monospace"}}>
                {[["1st Prize","first","#D4A017"],["2nd Prize","second","#909090"],["3rd Prize","third","#A05020"]].map(([lbl,key,col])=>(
                  <div key={lbl} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${t.border}`}}>
                    <span style={{fontSize:11,color:t.muted}}>{lbl}</span>
                    <span style={{fontSize:22,fontWeight:"500",color:col}}>{data[key]}</span>
                  </div>
                ))}
                <div style={{marginTop:10}}>
                  <div style={{fontSize:10,color:t.muted,marginBottom:5}}>Special Prizes</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {data.special?.map((n,i)=>(<span key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:11,background:`${t.p}14`,color:t.p,padding:"3px 9px",borderRadius:20,border:`1px solid ${t.p}22`}}>{n}</span>))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Number picker */}
      <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:14,padding:14}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:t.p,marginBottom:2}}>Check My Numbers</div>
        <div style={{fontFamily:"'Noto Serif SC',serif",fontSize:9,color:t.muted,marginBottom:12,letterSpacing:1}}>核对我的号码</div>

        {rMode==="toto"?(
          <>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:t.muted,marginBottom:8}}>
              Tap your numbers below — <span style={{color:t.p,fontWeight:"500"}}>{selNums.length}/6</span> selected
            </div>
            {/* Number grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:10}}>
              {Array.from({length:49},(_,i)=>i+1).map(n=>{
                const isSel=selNums.includes(n);
                const isWin=data.numbers?.includes(n);
                const isAdd=n===data.additional;
                return(
                  <button key={n} onClick={()=>toggleNum(n)} style={{
                    aspectRatio:"1",borderRadius:"50%",border:"none",cursor:"pointer",fontSize:9,
                    fontFamily:"'DM Mono',monospace",fontWeight:isSel?"500":"400",
                    transition:"all .15s",
                    background:isSel&&isWin?t.gold:isSel?t.p:isWin?`${t.gold}33`:isAdd?"rgba(128,128,128,.15)":`${t.p}0E`,
                    color:isSel?"white":isWin?"#7A5000":isAdd?"#888":t.muted,
                    outline:isWin?`2px solid ${t.gold}`:isAdd?"2px solid #aaa":"none",
                    outlineOffset:1,
                  }}>
                    {String(n).padStart(2,"0")}
                  </button>
                );
              })}
            </div>
            {/* Selected balls row */}
            {selNums.length>0&&(
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10,padding:"8px",background:`${t.p}08`,borderRadius:10}}>
                {[...selNums].sort((a,b)=>a-b).map(n=>(
                  <div key={n} style={{width:32,height:32,borderRadius:"50%",background:`radial-gradient(circle at 35% 30%,${t.gold},#A07810)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace",fontSize:10,color:"#3D2000",fontWeight:"500"}}>
                    {String(n).padStart(2,"0")}
                  </div>
                ))}
                <button onClick={clearAll} style={{width:32,height:32,borderRadius:"50%",background:`${t.p}18`,border:`1px solid ${t.p}44`,color:t.p,fontSize:10,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>CLR</button>
              </div>
            )}
          </>
        ):(
          <>
            {/* 4D slots */}
            <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:14}}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{width:60,height:70,borderRadius:12,background:digits[i]!==undefined?`${t.p}18`:`${t.p}08`,border:`2px solid ${digits[i]!==undefined?t.p:t.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace",fontSize:32,fontWeight:"500",color:digits[i]!==undefined?t.p:"rgba(0,0,0,.15)",transition:"all .2s"}}>
                  {digits[i]!==undefined?digits[i]:"_"}
                </div>
              ))}
            </div>
            {/* Numpad */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,maxWidth:220,margin:"0 auto 12px"}}>
              {[1,2,3,4,5,6,7,8,9].map(d=>(
                <button key={d} onClick={()=>tapDigit(String(d))} style={{padding:"14px 0",borderRadius:12,border:`1px solid ${t.border}`,background:t.card,color:t.text,fontFamily:"'DM Mono',monospace",fontSize:22,cursor:"pointer",transition:"background .1s",fontWeight:"500"}}>
                  {d}
                </button>
              ))}
              <button onClick={clearAll} style={{padding:"14px 0",borderRadius:12,border:`1px solid ${t.p}44`,background:`${t.p}12`,color:t.p,fontFamily:"'DM Mono',monospace",fontSize:12,cursor:"pointer",letterSpacing:.5}}>CLR</button>
              <button onClick={()=>tapDigit("0")} style={{padding:"14px 0",borderRadius:12,border:`1px solid ${t.border}`,background:t.card,color:t.text,fontFamily:"'DM Mono',monospace",fontSize:22,cursor:"pointer",fontWeight:"500"}}>0</button>
              <button onClick={backspace} style={{padding:"14px 0",borderRadius:12,border:`1px solid ${t.p}44`,background:`${t.p}12`,color:t.p,fontFamily:"'DM Mono',monospace",fontSize:20,cursor:"pointer"}}>⌫</button>
            </div>
          </>
        )}

        {/* Check button */}
        <button onClick={check} disabled={!canCheck} style={{width:"100%",padding:"12px",background:canCheck?`linear-gradient(135deg,${t.p},${t.p2})`:`${t.p}1A`,border:"none",borderRadius:10,color:canCheck?"white":t.muted,fontFamily:"'DM Mono',monospace",fontSize:13,cursor:canCheck?"pointer":"not-allowed",letterSpacing:2,fontWeight:"500",transition:"all .3s",marginTop:4}}>
          CHECK ✓
        </button>

        {/* Match result */}
        {matched&&(
          <div style={{marginTop:12,padding:14,background:matched.win?`${t.p}12`:`${t.gold}0C`,borderRadius:12,animation:matched.win?"winPop .4s ease-out":"fadeUp .3s ease-out"}}>
            {rMode==="4d"?matched.win?(
              <>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:t.p,fontWeight:900,textAlign:"center",marginBottom:10}}>🎉 {FOURD[matched.tier]?.label}!</div>
                <div style={{display:"flex",justifyContent:"space-around",marginBottom:10}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:t.muted,marginBottom:3}}>BIG BET / $1</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:22,color:t.p,fontWeight:"500"}}>{FOURD[matched.tier]?.big}</div>
                  </div>
                  {FOURD[matched.tier]?.small!=="—"&&(
                    <div style={{textAlign:"center"}}>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:t.muted,marginBottom:3}}>SMALL BET / $1</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:22,color:t.p,fontWeight:"500"}}>{FOURD[matched.tier]?.small}</div>
                    </div>
                  )}
                </div>
                <ShareButtons numbers={[matched.num]} mode="4d" theme={t}/>
              </>
            ):<div style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:t.muted,textAlign:"center"}}>😔 Not a winner this draw. Try again!</div>
            :matched.win?(
              <>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:t.p,fontWeight:900,textAlign:"center",marginBottom:6}}>🎉 Group {matched.group} Winner!</div>
                <div style={{textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:12,color:t.muted,marginBottom:6}}>
                  {matched.hits} number{matched.hits!==1?"s":""} matched{matched.bonus?" + additional number":""}
                </div>
                <div style={{textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:16,color:t.p,fontWeight:"500",marginBottom:4}}>
                  {matched.prize}
                </div>
                {matched.group<=4&&<div style={{textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:9,color:t.muted,marginBottom:8}}>Exact amount split among all Group {matched.group} winners</div>}
                <ShareButtons numbers={selNums} mode="toto" theme={t}/>
              </>
            ):<div style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:t.muted,textAlign:"center"}}>{matched.hits||0} number{matched.hits===1?"":"s"} matched — not a winner this draw</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── COLLECTION TAB ────────────────────────────────────
function CollectionTab({ theme }) {
  const t=theme;
  const skins=[
    {name:"Classic Calico",zh:"三花猫",emoji:"🐱",unlocked:true,desc:"Default lucky cat"},
    {name:"Gold Cat",zh:"金猫",emoji:"✨",unlocked:false,desc:"All-gold prosperity"},
    {name:"Jade Cat",zh:"翡翠猫",emoji:"💚",unlocked:false,desc:"Jade fortune cat"},
    {name:"Red Cat",zh:"红猫",emoji:"🔴",unlocked:false,desc:"Auspicious red"},
    {name:"Black Cat",zh:"黑猫",emoji:"🖤",unlocked:false,desc:"Midnight mystery"},
    {name:"Rainbow Cat",zh:"彩虹猫",emoji:"🌈",unlocked:false,desc:"Ultra rare"},
  ];
  const companions=[
    {name:"Guan Yin",zh:"观音",emoji:"🙏",unlocked:false,desc:"Goddess of Mercy"},
    {name:"Laughing Buddha",zh:"弥勒佛",emoji:"😊",unlocked:false,desc:"Wealth & joy"},
    {name:"Fu Lu Shou",zh:"福禄寿",emoji:"🌟",unlocked:false,desc:"Fortune, Prosperity, Longevity"},
    {name:"Dragon",zh:"龙",emoji:"🐉",unlocked:false,desc:"Imperial good fortune"},
  ];
  const Item=({item})=>(
    <div style={{background:item.unlocked?t.card:`${t.card}CC`,border:`1.5px solid ${item.unlocked?t.gold:t.border}`,borderRadius:14,padding:"14px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:5,position:"relative",opacity:item.unlocked?1:.72,transition:"all .3s"}}>
      {!item.unlocked&&<div style={{position:"absolute",top:7,right:7,background:t.p,color:"white",fontSize:8,fontFamily:"'DM Mono',monospace",padding:"2px 7px",borderRadius:20,letterSpacing:.5}}>SOON</div>}
      <span style={{fontSize:36}}>{item.emoji}</span>
      <div style={{fontFamily:"'Noto Serif SC',serif",fontSize:11,color:t.text,textAlign:"center",fontWeight:"bold"}}>{item.name}</div>
      <div style={{fontFamily:"'Noto Serif SC',serif",fontSize:9,color:t.muted,textAlign:"center"}}>{item.zh}</div>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:t.muted,textAlign:"center",lineHeight:1.4}}>{item.desc}</div>
      {item.unlocked&&<div style={{background:`${t.gold}22`,border:`1px solid ${t.gold}55`,borderRadius:20,padding:"3px 10px",fontFamily:"'DM Mono',monospace",fontSize:9,color:"#7A5C00"}}>ACTIVE</div>}
    </div>
  );
  return(
    <div style={{padding:"16px 16px 90px",maxWidth:440,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:t.p}}>My Collection</div>
        <div style={{fontFamily:"'Noto Serif SC',serif",fontSize:10,color:t.muted,marginTop:2,letterSpacing:2}}>我的收藏</div>
      </div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:t.p,marginBottom:10}}>Cat Skins 猫咪皮肤</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:20}}>
        {skins.map((s,i)=><Item key={i} item={s}/>)}
      </div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:t.p,marginBottom:10}}>Prayer Companions 祈福伴侣</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:16}}>
        {companions.map((c,i)=><Item key={i} item={c}/>)}
      </div>
      <div style={{padding:14,background:`${t.p}0C`,border:`1.5px dashed ${t.p}38`,borderRadius:14,textAlign:"center"}}>
        <div style={{fontFamily:"'Noto Serif SC',serif",fontSize:12,color:t.p,marginBottom:4}}>解锁更多 Unlock More</div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:t.muted,lineHeight:1.8}}>Top up spin credits via PayNow.<br/>Skins & companions coming soon! 🙏</div>
      </div>
    </div>
  );
}

// ── TAB BAR ──────────────────────────────────────────
function TabBar({ tab, setTab, theme }) {
  const t=theme;
  const tabs=[{id:"spin",icon:"🎰",label:"Spin"},{id:"results",icon:"📋",label:"Results"},{id:"collection",icon:"🎁",label:"Collection"}];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:t.card,borderTop:`1px solid ${t.border}`,display:"flex",justifyContent:"space-around",paddingBottom:"max(env(safe-area-inset-bottom),10px)",paddingTop:2,zIndex:100,boxShadow:"0 -6px 24px rgba(0,0,0,.1)",transition:"background .5s,border-color .5s"}}>
      {tabs.map(tb=>(
        <button key={tb.id} onClick={()=>setTab(tb.id)} style={{flex:1,padding:"8px 0 4px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"transform .2s",transform:tab===tb.id?"scale(1.12)":"scale(1)"}}>
          <span style={{fontSize:22}}>{tb.icon}</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:tab===tb.id?t.p:t.muted,letterSpacing:.5,fontWeight:tab===tb.id?"500":"400",transition:"color .4s"}}>{tb.label}</span>
          {tab===tb.id&&<div style={{width:4,height:4,borderRadius:"50%",background:t.p}}/>}
        </button>
      ))}
    </div>
  );
}

// ── ROOT ─────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("spin");
  const [mode,setMode]=useState("toto");
  const [phase,setPhase]=useState("idle");
  const [pending,setPending]=useState([]);
  const [locked,setLocked]=useState([]);
  const [result,setResult]=useState(null);
  const tids=useRef([]);
  useEffect(()=>{injectGlobals();},[]);
  const t=TH[mode];

  function clearTids(){tids.current.forEach(clearTimeout);tids.current=[];}
  function addTid(fn,d){const id=setTimeout(fn,d);tids.current.push(id);}

  const spin=useCallback(()=>{
    if(phase!=="idle")return;
    clearTids();setLocked([]);setResult(null);
    const nums=mode==="toto"?genTOTO():gen4D();
    setPending(nums);setPhase("spinning");
    nums.forEach((_,i)=>addTid(()=>setLocked(p=>[...p,i]),900+i*380));
    addTid(()=>{setResult(nums);setPhase("done");addTid(()=>setPhase("idle"),2200);},(900+nums.length*380+220));
  },[phase,mode]);

  return(
    <div style={{minHeight:"100vh",background:t.bg,transition:"background .6s ease",position:"relative",overflow:"hidden"}}>
      <div style={{position:"fixed",top:0,left:0,right:0,height:5,background:`linear-gradient(90deg,${t.p},${t.gold},${t.p},${t.gold},${t.p})`,zIndex:200,transition:"background .5s"}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:`radial-gradient(circle,${t.p}07 1px,transparent 1px)`,backgroundSize:"28px 28px",pointerEvents:"none",transition:"background-image .5s"}}/>
      <div style={{paddingTop:10}}>
        {tab==="spin"&&<SpinTab mode={mode} setMode={m=>{setMode(m);setResult(null);setPending([]);setLocked([]);setPhase("idle");}} theme={t} phase={phase} spin={spin} pending={pending} locked={locked} result={result}/>}
        {tab==="results"&&<ResultsTab theme={t}/>}
        {tab==="collection"&&<CollectionTab theme={t}/>}
      </div>
      <TabBar tab={tab} setTab={setTab} theme={t}/>
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:4,background:`linear-gradient(90deg,${t.p},${t.gold},${t.p})`,zIndex:200}}/>
    </div>
  );
}
