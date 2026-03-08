import { useState, useEffect, useCallback } from "react";
import Head from "next/head";

// ─── Constants ────────────────────────────────────────────────────────────────
const ADMIN_PIN  = "1234";
const TOTAL_DAYS = 14;
const TODAY_IDX  = 4;

const SERVICES = [
  "Reel / Short Form","Photo Shoot","Event Coverage",
  "Brand / Commercial","Music Video","Wedding Film","Documentary",
];

const SVC_ICON = {
  "Wedding Film":"🎞","Music Video":"🎬","Brand / Commercial":"📡",
  "Event Coverage":"📹","Photo Shoot":"📷","Reel / Short Form":"▶","Documentary":"🎥",
};

// The 4 production stages
const STAGES = [
  { id:"uploading",  label:"Files",      icon:"⬆",  desc:"Uploading files",       color:"#4488ff" },
  { id:"working",    label:"Working",    icon:"✦",  desc:"Content being worked on",color:"#f0c060" },
  { id:"finishing",  label:"Finishing",  icon:"◎",  desc:"Adding finishing touches",color:"#d4a44c" },
  { id:"delivered",  label:"Delivered",  icon:"✓",  desc:"Link ready for client",  color:"#18d462" },
];

const C = {
  bg:"#07070f", surface:"#0c0c1a", panel:"#0f0f1e",
  border:"#14142a", borderHi:"#1c1c38",
  text:"#dcd8f2", textDim:"#7777a0", muted:"#3d3d5a",
  gold:"#d4a44c", amber:"#ffaa00",
  green:"#18d462", red:"#ff3838", chain:"#f0c060", blue:"#4488ff",
  purple:"#9966ff",
  // Low-anxiety client palette
  calm1:"#a8d8b9",  // soft sage green - start
  calm2:"#7bc8a4",  // mid green
  calm3:"#f5c97a",  // warm amber - midway
  calm4:"#e8a96a",  // soft orange - later
  calm5:"#d4846a",  // muted terracotta - near end
};

const ADMIN_HEARTBEAT_KEY = "frame:admin:heartbeat";
const HEARTBEAT_TTL = 45000; // 45s — admin considered online if pinged within this

const GS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  @keyframes pulsGold{0%,100%{box-shadow:0 0 0 0 rgba(212,164,76,.3)}50%{box-shadow:0 0 0 8px rgba(212,164,76,0)}}
  @keyframes checkPop{0%{transform:scale(0) rotate(-20deg);opacity:0}70%{transform:scale(1.2) rotate(4deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:1}}
  @keyframes shimmer{0%{left:-100%}100%{left:200%}}
  @keyframes modalIn{from{opacity:0;transform:scale(.96) translateX(-10px)}to{opacity:1;transform:scale(1) translateX(0)}}
  @keyframes fadeU{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @keyframes slideLeft{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:none}}
  @keyframes heroIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:none}}
  @keyframes livePulse{0%{box-shadow:0 0 0 0 rgba(24,212,98,.5)}70%{box-shadow:0 0 0 5px rgba(24,212,98,0)}100%{box-shadow:0 0 0 0 rgba(24,212,98,0)}}
  @keyframes liveFadeIn{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes unlockPulse{0%,100%{box-shadow:0 0 0 0 rgba(24,212,98,.4)}60%{box-shadow:0 0 0 12px rgba(24,212,98,0)}}
  @keyframes todayB{0%,100%{opacity:.9}50%{opacity:.3}}
  @keyframes slideUp{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
  input,select,textarea{font-family:'IBM Plex Mono',monospace!important;}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:#0c0c1a}
  ::-webkit-scrollbar-thumb{background:#1c1c38;border-radius:4px}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const todayStr  = () => new Date().toISOString().split("T")[0];
const addDays   = (ds,n) => { const d=new Date(ds); d.setDate(d.getDate()+n); return d.toISOString().split("T")[0]; };
const fmt       = (d) => d ? new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "";
const initials  = (n) => n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const getOrigin = () => addDays(todayStr(),-TODAY_IDX);
const dayOff    = (ds,o) => Math.round((new Date(ds)-new Date(o))/86400000);

// Progress color — calm gradient based on % elapsed
const calmColor = (pct) => {
  if (pct < 25)  return C.calm1;
  if (pct < 50)  return C.calm2;
  if (pct < 70)  return C.calm3;
  if (pct < 88)  return C.calm4;
  return C.calm5;
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_CLIENTS = [
  { id:"c1", name:"Jordan Reeves", email:"jordan@example.com", phone:"555-0101", pin:"1111", type:"retainer", retainerStart:addDays(todayStr(),-30), notes:"Monthly social package" },
  { id:"c2", name:"Mia Fontaine",  email:"mia@example.com",   phone:"555-0202", pin:"2222", type:"retainer", retainerStart:addDays(todayStr(),-14), notes:"Brand content, 4 reels/mo" },
  { id:"c3", name:"Darius Cole",   email:"darius@example.com",phone:"555-0303", pin:"",     type:"single",   retainerStart:"", notes:"" },
  { id:"c4", name:"Priya Nair",    email:"priya@example.com", phone:"555-0404", pin:"",     type:"single",   retainerStart:"", notes:"" },
];

const buildSeedJobs = () => [
  { id:"j1", clientId:"c1", service:"Reel / Short Form",  startDate:addDays(todayStr(),-4), endDate:addDays(todayStr(),-2), stage:"delivered",  deliveryLink:"https://drive.google.com/example1", notes:"3 reels" },
  { id:"j2", clientId:"c2", service:"Brand / Commercial", startDate:addDays(todayStr(),-3), endDate:addDays(todayStr(), 1), stage:"finishing",  deliveryLink:"", notes:"30-sec IG cut" },
  { id:"j3", clientId:"c1", service:"Photo Shoot",        startDate:addDays(todayStr(), 1), endDate:addDays(todayStr(), 4), stage:"working",    deliveryLink:"", notes:"Portrait session" },
  { id:"j4", clientId:"c3", service:"Wedding Film",       startDate:addDays(todayStr(),-2), endDate:addDays(todayStr(), 3), stage:"uploading",  deliveryLink:"", notes:"Full ceremony" },
  { id:"j5", clientId:"c4", service:"Music Video",        startDate:addDays(todayStr(), 2), endDate:addDays(todayStr(), 8), stage:"uploading",  deliveryLink:"", notes:"" },
];

// ─── Storage ──────────────────────────────────────────────────────────────────
const sGet = (k,fb)=>{ try{ const r=localStorage.getItem(k); return r?JSON.parse(r):fb; }catch{ return fb; }};
const sSet = (k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{}};

// ─── UI Atoms ─────────────────────────────────────────────────────────────────
function FInput({label,...props}){
  return(
    <label style={{display:"flex",flexDirection:"column",gap:5}}>
      {label&&<span style={{fontSize:9,color:C.textDim,letterSpacing:2,textTransform:"uppercase"}}>{label}</span>}
      <input {...props} style={{background:"#0a0a18",border:`1px solid ${C.borderHi}`,borderRadius:6,color:C.text,fontFamily:"'IBM Plex Mono',monospace",fontSize:13,padding:"10px 14px",outline:"none",width:"100%",transition:"border-color .15s",...props.style}}
        onFocus={e=>e.target.style.borderColor=C.gold}
        onBlur={e=>e.target.style.borderColor=C.borderHi}
      />
    </label>
  );
}

function FSelect({label,options,...props}){
  return(
    <label style={{display:"flex",flexDirection:"column",gap:5}}>
      {label&&<span style={{fontSize:9,color:C.textDim,letterSpacing:2,textTransform:"uppercase"}}>{label}</span>}
      <select {...props} style={{background:"#0a0a18",border:`1px solid ${C.borderHi}`,borderRadius:6,color:C.text,fontFamily:"'IBM Plex Mono',monospace",fontSize:13,padding:"10px 14px",outline:"none",width:"100%",cursor:"pointer",...props.style}}>
        {options.map(o=><option key={o.value!==undefined?o.value:o} value={o.value!==undefined?o.value:o}>{o.label!==undefined?o.label:o}</option>)}
      </select>
    </label>
  );
}

function Btn({children,variant="primary",style:xs,...props}){
  const S={
    primary:{background:C.gold,       color:"#06060f",  border:"none"},
    danger: {background:"#c03030",    color:"#fff",     border:"none"},
    ghost:  {background:"transparent",color:C.textDim,  border:`1px solid ${C.borderHi}`},
    teal:   {background:"#0d4020",    color:C.green,    border:`1px solid #1a6030`},
    purple: {background:"#1a0d38",    color:C.purple,   border:`1px solid #332266`},
  }[variant]||{background:C.gold,color:"#06060f",border:"none"};
  return(
    <button {...props} style={{...S,borderRadius:8,padding:"10px 18px",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:.5,transition:"all .15s",minHeight:42,...xs}}
      onMouseEnter={e=>{if(!props.disabled){e.currentTarget.style.opacity="0.82";e.currentTarget.style.transform="translateY(-1px)";}}}
      onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="none";}}
    >{children}</button>
  );
}

function Modal({title,onClose,children}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(4,4,12,.88)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"flex-start",padding:"16px 16px 100px",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{background:C.surface,border:`1px solid ${C.borderHi}`,borderRadius:12,padding:26,width:"100%",maxWidth:460,boxShadow:"0 24px 80px rgba(0,0,0,.9)",animation:"modalIn .2s ease both"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button onClick={onClose} style={{background:"#12121e",border:`1px solid ${C.borderHi}`,color:C.muted,cursor:"pointer",fontSize:14,width:36,height:36,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>←</button>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:C.gold}}>{title}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({msg}){
  if(!msg) return null;
  return <div style={{position:"fixed",bottom:88,left:16,background:C.gold,color:"#06060f",padding:"12px 20px",borderRadius:10,fontWeight:700,fontSize:12,zIndex:999,maxWidth:"80vw",boxShadow:`0 8px 30px ${C.gold}50`,animation:"slideLeft .3s ease both"}}>{msg}</div>;
}

// ─── Live Dot — shows on client when admin is in the app ─────────────────────
function LiveDot(){
  const [live,setLive] = useState(false);

  useEffect(()=>{
    const check = async () => {
      try {
        const val = localStorage.getItem(ADMIN_HEARTBEAT_KEY);
        if(val){
          const ts = parseInt(val,10);
          setLive(Date.now() - ts < HEARTBEAT_TTL);
        } else {
          setLive(false);
        }
      } catch { setLive(false); }
    };
    check();
    const id = setInterval(check, 8000);
    return () => clearInterval(id);
  },[]);

  if(!live) return null;
  return(
    <div title="Studio is currently active" style={{display:"flex",alignItems:"center",gap:5,animation:"liveFadeIn .4s ease both"}}>
      <div style={{
        width:7,height:7,borderRadius:"50%",
        background:"#18d462",
        animation:"livePulse 2s ease infinite",
        flexShrink:0,
      }}/>
      <span style={{fontSize:8,color:"#18d46280",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:.5}}>editing</span>
    </div>
  );
}

function BottomNav({tabs,active,onChange,fab,onFab}){
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:90,background:C.surface,borderTop:`1px solid ${C.border}`}}>
      <div style={{display:"flex",alignItems:"stretch",height:64}}>
        {fab&&(
          <button onClick={onFab} style={{width:72,flexShrink:0,background:C.gold,border:"none",color:"#06060f",fontSize:22,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",borderRight:`1px solid ${C.border}`}}
            onMouseEnter={e=>e.currentTarget.style.background="#e8bb60"}
            onMouseLeave={e=>e.currentTarget.style.background=C.gold}
          >+</button>
        )}
        {tabs.map(([id,lbl])=>(
          <button key={id} onClick={()=>onChange(id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,color:active===id?C.gold:C.muted,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:600,letterSpacing:1,borderBottom:active===id?`2px solid ${C.gold}`:"2px solid transparent",transition:"all .18s",padding:"0 4px"}}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 4 Stage Buttons — Admin per-job control ──────────────────────────────────
function StageButtons({job,onSetStage,onOpenDelivery}){
  return(
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
      {STAGES.slice(0,3).map((s,i)=>{
        const active = job.stage===s.id;
        const past   = STAGES.findIndex(x=>x.id===job.stage) > i;
        return(
          <button key={s.id} onClick={()=>onSetStage(job.id,s.id)} style={{
            display:"flex",alignItems:"center",gap:6,
            padding:"8px 14px",borderRadius:8,border:`1px solid ${active||past?s.color+"60":"#1c1c38"}`,
            background:active?`${s.color}18`:past?`${s.color}08`:"transparent",
            color:active?s.color:past?`${s.color}90`:C.muted,
            fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:600,
            cursor:"pointer",transition:"all .18s",minHeight:40,
          }}
            onMouseEnter={e=>{ if(!active){e.currentTarget.style.borderColor=`${s.color}80`;e.currentTarget.style.color=s.color;} }}
            onMouseLeave={e=>{ if(!active){e.currentTarget.style.borderColor=active||past?`${s.color}60`:"#1c1c38";e.currentTarget.style.color=active?s.color:past?`${s.color}90`:C.muted;} }}
          >
            <span style={{fontSize:13}}>{s.icon}</span>
            <span>{s.label}</span>
            {(active||past)&&<span style={{fontSize:9,opacity:.7}}>{past?"✓":""}</span>}
          </button>
        );
      })}

      {/* 4th button — Delivery backdoor */}
      <button onClick={()=>onOpenDelivery(job)} style={{
        display:"flex",alignItems:"center",gap:6,
        padding:"8px 14px",borderRadius:8,
        border:`1px solid ${job.deliveryLink?"#18d46260":"#1c1c38"}`,
        background:job.deliveryLink?"#061f12":"transparent",
        color:job.deliveryLink?C.green:C.muted,
        fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:600,
        cursor:"pointer",transition:"all .18s",minHeight:40,
        animation:job.deliveryLink?"pulsGold 2s ease 1":"none",
      }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.green+"80";e.currentTarget.style.color=C.green;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=job.deliveryLink?"#18d46260":"#1c1c38";e.currentTarget.style.color=job.deliveryLink?C.green:C.muted;}}
      >
        <span style={{fontSize:13}}>🔗</span>
        <span>{job.deliveryLink?"Link Set":"Delivery Link"}</span>
        {job.deliveryLink&&<span style={{fontSize:9}}>✓</span>}
      </button>
    </div>
  );
}

// ─── Client Progress Bar ──────────────────────────────────────────────────────
function ClientProgressBar({job,origin}){
  const s     = dayOff(job.startDate,origin);
  const e     = dayOff(job.endDate,origin);
  const span  = Math.max(e-s,1);
  const elapsed = Math.min(100,Math.max(0,((TODAY_IDX-s)/span)*100));
  const stageIdx = STAGES.findIndex(x=>x.id===job.stage);
  const stagePct = job.stage==="delivered"?100:Math.max(elapsed,(stageIdx/3)*100);
  const color = job.stage==="delivered" ? C.green : calmColor(stagePct);
  const daysLeft = Math.max(0,e-TODAY_IDX);
  const totalDays = span;

  return(
    <div style={{background:"#080c12",borderRadius:16,padding:"20px 22px",border:`1px solid #0f1a20`}}>
      {/* Stage indicator dots — left side */}
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:18}}>
        {STAGES.map((st,i)=>{
          const done  = stageIdx >= i;
          const curr  = stageIdx === i;
          return(
            <div key={st.id} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{
                width:curr?28:20, height:curr?28:20,
                borderRadius:"50%",
                background:done?(curr?color+"30":"#0a1a0a"):"#0a0a14",
                border:`2px solid ${done?color:"#1a1a2a"}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:curr?13:10,
                transition:"all .4s ease",
                flexShrink:0,
              }}>
                {done?<span style={{color:done?color:"#333"}}>{curr?st.icon:"✓"}</span>:null}
              </div>
              {i<STAGES.length-1&&(
                <div style={{width:24,height:2,borderRadius:1,background:stageIdx>i?`${color}60`:"#111",transition:"background .6s ease"}}/>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress track */}
      <div style={{marginBottom:14}}>
        <div style={{background:"#0e121a",borderRadius:8,height:10,overflow:"hidden",position:"relative"}}>
          <div style={{
            position:"absolute",left:0,top:0,bottom:0,
            width:`${stagePct}%`,
            background:`linear-gradient(90deg, ${color}60, ${color})`,
            borderRadius:8,
            transition:"width 1.4s cubic-bezier(.16,1,.3,1)",
            boxShadow:`0 0 14px ${color}40`,
          }}>
            {/* shimmer */}
            {job.stage!=="delivered"&&(
              <div style={{position:"absolute",top:0,bottom:0,width:"40%",background:`linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent)`,animation:"shimmer 2.2s infinite"}}/>
            )}
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:9,color:"#3d4a5a",letterSpacing:1}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",color:`${color}90`}}>
            {job.stage==="delivered"?"Completed":`${Math.round(stagePct)}% complete`}
          </span>
          <span style={{fontFamily:"'DM Sans',sans-serif"}}>
            {job.stage==="delivered"?"Delivered ✓":`${daysLeft} day${daysLeft!==1?"s":""} remaining`}
          </span>
        </div>
      </div>

      {/* Stage label */}
      <div style={{fontSize:11,fontFamily:"'DM Sans',sans-serif",color:`${color}`,fontWeight:500,letterSpacing:.3,marginBottom:4}}>
        {job.stage==="uploading" &&"Your files are being received and organised"}
        {job.stage==="working"   &&"Our team is actively working on your project"}
        {job.stage==="finishing" &&"Final touches and quality checks underway"}
        {job.stage==="delivered" &&"Your project is complete and ready to access"}
      </div>
      <div style={{fontSize:9,fontFamily:"'DM Sans',sans-serif",color:"#3d4a5a"}}>
        Started {fmt(job.startDate)} · Est. completion {fmt(job.endDate)}
      </div>
    </div>
  );
}

// ─── Complete Button (client) — locked until admin sets link ─────────────────
function DeliveryButton({job}){
  const unlocked = !!(job.deliveryLink && job.stage==="delivered");
  const [clicked,setClicked] = useState(false);

  if(clicked && unlocked){
    return(
      <div style={{background:"#030e07",border:`1px solid ${C.green}40`,borderRadius:14,padding:"24px 22px",textAlign:"center",animation:"fadeU .4s ease both"}}>
        <div style={{fontSize:40,marginBottom:10,animation:"checkPop .5s ease both"}}>✓</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:C.green,marginBottom:6}}>All done!</div>
        <div style={{fontSize:11,fontFamily:"'DM Sans',sans-serif",color:"#4a6a5a",lineHeight:1.6}}>Your files are ready. If the link doesn't open automatically, check your downloads folder.</div>
      </div>
    );
  }

  return(
    <div style={{marginTop:4}}>
      <button
        disabled={!unlocked}
        onClick={()=>{
          if(unlocked&&job.deliveryLink){
            window.open(job.deliveryLink,"_blank");
            setClicked(true);
          }
        }}
        style={{
          width:"100%",
          padding:"18px 24px",
          borderRadius:14,
          border:`2px solid ${unlocked?C.green+"60":"#1a1a2a"}`,
          background:unlocked?"#030e07":"#09090f",
          cursor:unlocked?"pointer":"not-allowed",
          transition:"all .3s ease",
          display:"flex",alignItems:"center",justifyContent:"center",gap:14,
          animation:unlocked?"unlockPulse 2.5s ease 1":"none",
          opacity:unlocked?1:.5,
        }}
        onMouseEnter={e=>{ if(unlocked){ e.currentTarget.style.background="#071808"; e.currentTarget.style.borderColor=C.green; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 8px 28px ${C.green}25`; }}}
        onMouseLeave={e=>{ if(unlocked){ e.currentTarget.style.background="#030e07"; e.currentTarget.style.borderColor=`${C.green}60`; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}}
      >
        <div style={{
          width:44,height:44,borderRadius:"50%",
          background:unlocked?`${C.green}15`:"#0f0f18",
          border:`2px solid ${unlocked?C.green+"40":"#1a1a2a"}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:20,flexShrink:0,transition:"all .3s",
        }}>
          {unlocked?"✓":"🔒"}
        </div>
        <div style={{textAlign:"left"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:unlocked?C.green:"#2a2a3a",marginBottom:3}}>
            {unlocked?"Access Your Files":"Awaiting Delivery"}
          </div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:unlocked?"#4a7a5a":"#2a2a3a",lineHeight:1.4}}>
            {unlocked?"Click to open your completed project files":"Your files will be available here once complete"}
          </div>
        </div>
      </button>
    </div>
  );
}

// ─── Delivery Link Modal (admin) ──────────────────────────────────────────────
function DeliveryModal({job,client,onSave,onClose}){
  const [link,setLink] = useState(job.deliveryLink||"");
  const valid = link.trim().startsWith("http");
  return(
    <Modal title="🔗 Delivery Link" onClose={onClose}>
      <div style={{marginBottom:16}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:C.text,marginBottom:3}}>{client?.name}</div>
        <div style={{fontSize:9,color:C.muted}}>
          {SVC_ICON[job.service]||"🎬"} {job.service} · {fmt(job.startDate)} → {fmt(job.endDate)}
        </div>
      </div>

      <div style={{background:"#09091a",border:`1px solid ${C.borderHi}`,borderRadius:8,padding:"14px 16px",marginBottom:16,fontSize:9,color:C.textDim,lineHeight:1.7}}>
        <span style={{color:C.gold,fontWeight:600}}>How this works:</span><br/>
        Paste the file link below (Google Drive, Dropbox, WeTransfer, etc). Once submitted, the client's <span style={{color:C.green}}>Access Files</span> button unlocks automatically and will open this link directly.
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <label style={{display:"flex",flexDirection:"column",gap:5}}>
          <span style={{fontSize:9,color:C.textDim,letterSpacing:2,textTransform:"uppercase"}}>Delivery URL</span>
          <textarea
            value={link}
            onChange={e=>setLink(e.target.value)}
            placeholder="https://drive.google.com/..."
            rows={3}
            style={{background:"#0a0a18",border:`1px solid ${C.borderHi}`,borderRadius:6,color:C.text,fontFamily:"'IBM Plex Mono',monospace",fontSize:12,padding:"10px 14px",outline:"none",width:"100%",resize:"vertical",lineHeight:1.5}}
            onFocus={e=>e.target.style.borderColor=C.green}
            onBlur={e=>e.target.style.borderColor=C.borderHi}
          />
        </label>

        {link&&!valid&&<div style={{fontSize:9,color:C.red}}>Link must start with http:// or https://</div>}
        {link&&valid&&<div style={{fontSize:9,color:C.green}}>✓ Valid link — this will unlock the client's delivery button</div>}

        <div style={{display:"flex",gap:8}}>
          <Btn
            disabled={!valid}
            style={{flex:1,opacity:valid?1:.4,cursor:valid?"pointer":"not-allowed",background:valid?C.green:"#0f1a10",color:valid?"#030e07":C.muted,border:`1px solid ${valid?"#18d46260":"#0f1a10"}`}}
            onClick={()=>{ if(valid){ onSave(job.id,link.trim()); onClose(); }}}
          >
            Unlock for Client ✓
          </Btn>
          <Btn variant="ghost" style={{flex:1}} onClick={onClose}>Cancel</Btn>
        </div>

        {job.deliveryLink&&(
          <button onClick={()=>{ onSave(job.id,""); onClose(); }} style={{background:"none",border:"none",color:C.red,fontSize:9,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",textAlign:"left",padding:"4px 0"}}>
            ✕ Remove existing link (re-locks client button)
          </button>
        )}
      </div>
    </Modal>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function AdminPage(){
  return (
    <>
      <Head><title>Que · Admin</title></Head>
      <AdminApp />
    </>
  );
}

function AdminApp(){
  const [screen,setScreen]             = useState("landing");
  const [clients,setClients]           = useState([]);
  const [jobs,setJobs]                 = useState([]);
  const [loaded,setLoaded]             = useState(false);
  const [toast,setToast]               = useState("");
  const [adminPin,setAdminPin]         = useState("");
  const [pinErr,setPinErr]             = useState(false);
  const [memberPin,setMemberPin]       = useState("");
  const [memberPinErr,setMemberPinErr] = useState(false);
  const [loginCid,setLoginCid]         = useState("");
  const [activeClient,setActiveClient] = useState(null);
  const [singleEmail,setSingleEmail]   = useState("");
  const [singleResult,setSingleResult] = useState(null);
  const [singleSearched,setSingleSearched] = useState(false);
  const [adminTab,setAdminTab]         = useState("projects");
  const [clientsTab,setClientsTab]     = useState("retainer");
  const [modal,setModal]               = useState(null);
  const [editTarget,setEditTarget]     = useState(null);
  const [deliveryTarget,setDeliveryTarget] = useState(null);

  const blankC={name:"",email:"",phone:"",pin:"",type:"single",retainerStart:"",notes:""};
  const blankJ={clientId:"",service:SERVICES[0],startDate:"",endDate:"",stage:"uploading",deliveryLink:"",notes:""};
  const [cForm,setCForm]=useState(blankC);
  const [jForm,setJForm]=useState(blankJ);

  const origin=getOrigin();
  const boom=(msg)=>{ setToast(msg); setTimeout(()=>setToast(""),2400); };
  const persist=useCallback((c,j)=>{ sSet("q:clients",c); sSet("q:jobs",j); },[]);

  useEffect(()=>{
    const c=sGet("q:clients",SEED_CLIENTS);
    const j=sGet("q:jobs",buildSeedJobs());
    setClients(c); setJobs(j); setLoaded(true);
    const m=c.filter(x=>x.type==="retainer");
    if(m.length) setLoginCid(m[0].id);
  },[]);

  const buildRows=(list)=>{
    const map={};
    list.forEach(j=>{ if(!map[j.clientId])map[j.clientId]=[]; map[j.clientId].push(j); });
    return Object.entries(map).map(([cid,jbs])=>({cid,jobs:jbs.sort((a,b)=>new Date(a.startDate)-new Date(b.startDate))}));
  };

  // Admin heartbeat — write timestamp to shared storage every 20s while in admin
  useEffect(()=>{
    if(screen!=="admin") return;
    const ping = () => {
      try { localStorage.setItem(ADMIN_HEARTBEAT_KEY, String(Date.now())); } catch {}
    };
    ping();
    const id = setInterval(ping, 20000);
    return () => {
      clearInterval(id);
      try { localStorage.setItem(ADMIN_HEARTBEAT_KEY, "0"); } catch {}
    };
  },[screen]);

  const doAdminLogin=()=>{ if(adminPin===ADMIN_PIN){setScreen("admin");setPinErr(false);setAdminPin("");}else setPinErr(true); };
  const doMemberLogin=()=>{
    const c=clients.find(x=>x.id===loginCid);
    if(!c) return;
    if(memberPin===c.pin){setActiveClient(c);setScreen("member");setMemberPinErr(false);setMemberPin("");}
    else setMemberPinErr(true);
  };
  const doSingleSearch=()=>{
    const q=singleEmail.trim().toLowerCase();
    if(!q) return;
    const c=clients.find(x=>x.type==="single"&&(x.email.toLowerCase()===q||x.name.toLowerCase()===q));
    setSingleResult(c||"notfound"); setSingleSearched(true);
    if(c) setActiveClient(c);
  };

  // CRUD
  const addClient=()=>{ if(!cForm.name) return; const nc={id:`c${Date.now()}`,...cForm}; const u=[...clients,nc]; setClients(u); persist(u,jobs); setCForm(blankC); setModal(null); boom(`${nc.name} added`); };
  const saveClient=()=>{ const u=clients.map(c=>c.id===editTarget.id?{...c,...cForm}:c); setClients(u); persist(u,jobs); setModal(null); boom("Client updated"); };
  const removeClient=(id)=>{ const uc=clients.filter(c=>c.id!==id),uj=jobs.filter(j=>j.clientId!==id); setClients(uc); setJobs(uj); persist(uc,uj); boom("Client removed"); };
  const addJob=()=>{ if(!jForm.clientId||!jForm.startDate||!jForm.endDate) return; const nj={id:`j${Date.now()}`,...jForm}; const u=[...jobs,nj]; setJobs(u); persist(clients,u); setJForm({...blankJ,clientId:clients[0]?.id||""}); setModal(null); boom("Project added"); };
  const saveJob=()=>{ const u=jobs.map(j=>j.id===editTarget.id?{...j,...jForm}:j); setJobs(u); persist(clients,u); setModal(null); boom("Project updated"); };
  const removeJob=(id)=>{ const u=jobs.filter(j=>j.id!==id); setJobs(u); persist(clients,u); boom("Project removed"); };
  const setStage=(id,stage)=>{ const u=jobs.map(j=>j.id===id?{...j,stage}:j); setJobs(u); persist(clients,u); boom(`Moved to ${stage}`); };
  const setDeliveryLink=(id,link)=>{
    const u=jobs.map(j=>j.id===id?{...j,deliveryLink:link,stage:link?"delivered":j.stage}:j);
    setJobs(u); persist(clients,u);
    boom(link?"🔓 Link set — client button unlocked!":"Link removed");
  };
  const openEditJob=(job)=>{ setEditTarget(job); setJForm({clientId:job.clientId,service:job.service,startDate:job.startDate,endDate:job.endDate,stage:job.stage,deliveryLink:job.deliveryLink||"",notes:job.notes||""}); setModal("editJob"); };
  const openEditClient=(c)=>{ setEditTarget(c); setCForm({name:c.name,email:c.email||"",phone:c.phone||"",pin:c.pin||"",type:c.type||"single",retainerStart:c.retainerStart||"",notes:c.notes||""}); setModal("editClient"); };

  const retainers=clients.filter(c=>c.type==="retainer");
  const singles=clients.filter(c=>c.type==="single");

  const renderTopBar=(sub,right)=>(
    <header style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 16px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:7,height:7,background:C.gold,transform:"rotate(45deg)",flexShrink:0}}/>
        <span style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,color:C.gold}}>Que</span>
        {sub&&<span style={{fontSize:8,color:C.muted,letterSpacing:2}}>{sub}</span>}
      </div>
      {right}
    </header>
  );

  const renderModals=()=>{
    if(deliveryTarget){
      return <DeliveryModal job={deliveryTarget} client={clients.find(c=>c.id===deliveryTarget.clientId)} onSave={setDeliveryLink} onClose={()=>setDeliveryTarget(null)}/>;
    }
    if(modal==="addClient"||modal==="editClient") return(
      <Modal title={modal==="addClient"?"Add Client":"Edit Client"} onClose={()=>setModal(null)}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <FInput label="Full Name *" value={cForm.name} onChange={e=>setCForm(p=>({...p,name:e.target.value}))} placeholder="Jane Smith"/>
          <FInput label="Email" value={cForm.email} onChange={e=>setCForm(p=>({...p,email:e.target.value}))} placeholder="jane@email.com"/>
          <FInput label="Phone" value={cForm.phone} onChange={e=>setCForm(p=>({...p,phone:e.target.value}))} placeholder="555-0100"/>
          <FSelect label="Client Type" options={[{value:"retainer",label:"◈ Monthly Retainer"},{value:"single",label:"◻ Single Project"}]} value={cForm.type} onChange={e=>setCForm(p=>({...p,type:e.target.value}))}/>
          {cForm.type==="retainer"&&<>
            <FInput label="Retainer Start Date" type="date" value={cForm.retainerStart} onChange={e=>setCForm(p=>({...p,retainerStart:e.target.value}))}/>
            <FInput label="Member PIN" value={cForm.pin} onChange={e=>setCForm(p=>({...p,pin:e.target.value}))} placeholder="e.g. 5678"/>
          </>}
          <FInput label="Notes" value={cForm.notes} onChange={e=>setCForm(p=>({...p,notes:e.target.value}))} placeholder="Package details…"/>
          <div style={{display:"flex",gap:8}}>
            <Btn style={{flex:1}} onClick={modal==="addClient"?addClient:saveClient}>{modal==="addClient"?"Add Client":"Save"}</Btn>
            <Btn variant="ghost" style={{flex:1}} onClick={()=>setModal(null)}>Cancel</Btn>
          </div>
        </div>
      </Modal>
    );
    if(modal==="addJob"||modal==="editJob") return(
      <Modal title={modal==="addJob"?"Add Project":"Edit Project"} onClose={()=>setModal(null)}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <FSelect label="Client *" options={clients.map(c=>({value:c.id,label:`${c.type==="retainer"?"◈ ":"◻ "}${c.name}`}))} value={jForm.clientId} onChange={e=>setJForm(p=>({...p,clientId:e.target.value}))}/>
          <FSelect label="Project Type" options={SERVICES} value={jForm.service} onChange={e=>setJForm(p=>({...p,service:e.target.value}))}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FInput label="Start Date *" type="date" value={jForm.startDate} onChange={e=>setJForm(p=>({...p,startDate:e.target.value}))}/>
            <FInput label="Deadline *" type="date" value={jForm.endDate} onChange={e=>setJForm(p=>({...p,endDate:e.target.value}))}/>
          </div>
          <FInput label="Notes" value={jForm.notes} onChange={e=>setJForm(p=>({...p,notes:e.target.value}))} placeholder="Location, deliverables…"/>
          <div style={{display:"flex",gap:8}}>
            <Btn style={{flex:1}} onClick={modal==="addJob"?addJob:saveJob}>{modal==="addJob"?"Add Project":"Save"}</Btn>
            <Btn variant="ghost" style={{flex:1}} onClick={()=>setModal(null)}>Cancel</Btn>
          </div>
        </div>
      </Modal>
    );
    return null;
  };

  if(!loaded) return <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono',monospace",color:C.muted}}>Loading…</div>;

  // ─── LANDING ───────────────────────────────────────────────────────────────
  if(screen==="landing") return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'IBM Plex Mono',monospace",color:C.text,display:"flex",flexDirection:"column"}}>
      <style>{GS}</style>
      <div style={{padding:"18px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:7,height:7,background:C.gold,transform:"rotate(45deg)"}}/>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:C.gold}}>Que</span>
        </div>
        <button onClick={()=>setScreen("adminLogin")} style={{background:"none",border:`1px solid ${C.borderHi}`,color:C.muted,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"6px 14px",borderRadius:4,cursor:"pointer",letterSpacing:1.5,minHeight:36}}>ADMIN ⚙</button>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"flex-start",justifyContent:"center",padding:"10px 20px 80px"}}>
        <div style={{marginBottom:48,animation:"float 4s ease infinite"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:38,fontWeight:800,color:C.gold,letterSpacing:"-2px",lineHeight:1}}>Que</div>
          <div style={{fontSize:9,color:C.muted,letterSpacing:4,textTransform:"uppercase",marginTop:8}}>Videography · Photography · Production</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14,width:"100%",maxWidth:400}}>
          <div onClick={()=>setScreen("memberLogin")} style={{background:C.surface,border:`1px solid ${C.purple}50`,borderRadius:14,padding:"22px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:18,transition:"all .2s",animation:"heroIn .4s ease .1s both"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.purple;e.currentTarget.style.transform="translateX(6px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=`${C.purple}50`;e.currentTarget.style.transform="none";}}>
            <div style={{width:48,height:48,borderRadius:10,background:"#1a0d38",border:`1px solid ${C.purple}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>◈</div>
            <div><div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,color:C.purple,marginBottom:4}}>Members</div><div style={{fontSize:10,color:C.textDim}}>Monthly retainer clients</div></div>
            <div style={{marginLeft:"auto",fontSize:18,color:`${C.purple}60`}}>›</div>
          </div>
          <div onClick={()=>setScreen("singleLookup")} style={{background:C.surface,border:`1px solid ${C.blue}50`,borderRadius:14,padding:"22px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:18,transition:"all .2s",animation:"heroIn .4s ease .2s both"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.blue;e.currentTarget.style.transform="translateX(6px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=`${C.blue}50`;e.currentTarget.style.transform="none";}}>
            <div style={{width:48,height:48,borderRadius:10,background:"#0d1a3a",border:`1px solid ${C.blue}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>◻</div>
            <div><div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,color:C.blue,marginBottom:4}}>Single Project</div><div style={{fontSize:10,color:C.textDim}}>Track delivery with your email</div></div>
            <div style={{marginLeft:"auto",fontSize:18,color:`${C.blue}60`}}>›</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── AUTH SCREENS ──────────────────────────────────────────────────────────
  if(screen==="adminLogin") return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'IBM Plex Mono',monospace",color:C.text,display:"flex",alignItems:"center",justifyContent:"flex-start",padding:20}}>
      <style>{GS}</style>
      <div style={{background:C.surface,border:`1px solid ${C.borderHi}`,borderRadius:12,padding:28,width:"100%",maxWidth:340,animation:"heroIn .3s ease both"}}>
        <button onClick={()=>setScreen("landing")} style={{background:"none",border:`1px solid ${C.borderHi}`,color:C.muted,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,cursor:"pointer",padding:"7px 14px",borderRadius:6,marginBottom:20,letterSpacing:1,minHeight:36}}>← Back</button>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:C.gold,marginBottom:4}}>⚙ Studio Admin</div>
        <div style={{fontSize:9,color:C.muted,marginBottom:18}}>Enter your PIN</div>
        <FInput label="Admin PIN" type="password" placeholder="····" value={adminPin} onChange={e=>{setAdminPin(e.target.value);setPinErr(false);}} onKeyDown={e=>e.key==="Enter"&&doAdminLogin()}/>
        {pinErr&&<div style={{fontSize:9,color:C.red,marginTop:5}}>Incorrect PIN</div>}
        <Btn style={{marginTop:14,width:"100%"}} onClick={doAdminLogin}>Enter Studio</Btn>
        <div style={{fontSize:8,color:C.muted,marginTop:10}}>Default: 1234</div>
      </div>
    </div>
  );

  if(screen==="memberLogin") return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'IBM Plex Mono',monospace",color:C.text,display:"flex",alignItems:"center",justifyContent:"flex-start",padding:20}}>
      <style>{GS}</style>
      <div style={{background:C.surface,border:`1px solid ${C.purple}50`,borderRadius:12,padding:28,width:"100%",maxWidth:340,animation:"heroIn .3s ease both"}}>
        <button onClick={()=>setScreen("landing")} style={{background:"none",border:`1px solid ${C.purple}40`,color:C.purple,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,cursor:"pointer",padding:"7px 14px",borderRadius:6,marginBottom:20,letterSpacing:1,minHeight:36}}>← Back</button>
        <div style={{fontSize:22,marginBottom:8}}>◈</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:C.purple,marginBottom:4}}>Member Login</div>
        <div style={{fontSize:9,color:C.muted,marginBottom:18}}>Select your name, then enter your PIN</div>
        <FSelect label="Your Name" options={retainers.map(c=>({value:c.id,label:c.name}))} value={loginCid} onChange={e=>{setLoginCid(e.target.value);setMemberPinErr(false);}}/>
        <div style={{marginTop:12}}>
          <FInput label="Your PIN" type="password" placeholder="····" value={memberPin} onChange={e=>{setMemberPin(e.target.value);setMemberPinErr(false);}} onKeyDown={e=>e.key==="Enter"&&doMemberLogin()}/>
        </div>
        {memberPinErr&&<div style={{fontSize:9,color:C.red,marginTop:5}}>Incorrect PIN</div>}
        <Btn style={{marginTop:14,width:"100%",background:C.purple,color:"#fff"}} onClick={doMemberLogin}>Enter Member Portal</Btn>
      </div>
    </div>
  );

  if(screen==="singleLookup") return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'IBM Plex Mono',monospace",color:C.text,display:"flex",alignItems:"center",justifyContent:"flex-start",padding:20}}>
      <style>{GS}</style>
      <div style={{background:C.surface,border:`1px solid ${C.blue}50`,borderRadius:12,padding:28,width:"100%",maxWidth:400,animation:"heroIn .3s ease both"}}>
        <button onClick={()=>setScreen("landing")} style={{background:"none",border:`1px solid ${C.blue}40`,color:C.blue,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,cursor:"pointer",padding:"7px 14px",borderRadius:6,marginBottom:20,letterSpacing:1,minHeight:36}}>← Back</button>
        <div style={{fontSize:22,marginBottom:8}}>◻</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:C.blue,marginBottom:4}}>Track Your Project</div>
        <div style={{fontSize:9,color:C.muted,marginBottom:18}}>Enter your name or email — no login needed</div>
        <FInput label="Name or email" placeholder="e.g. Jane Smith or jane@email.com" value={singleEmail} onChange={e=>{setSingleEmail(e.target.value);setSingleSearched(false);setSingleResult(null);}} onKeyDown={e=>e.key==="Enter"&&doSingleSearch()}/>
        {singleSearched&&singleResult==="notfound"&&<div style={{fontSize:9,color:C.red,marginTop:8}}>Not found. Check spelling or contact us.</div>}
        <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
          <Btn style={{background:C.blue,color:"#fff",flex:"1 1 120px"}} onClick={doSingleSearch}>Find My Project</Btn>
          {singleSearched&&singleResult&&singleResult!=="notfound"&&<Btn style={{flex:"1 1 120px"}} onClick={()=>setScreen("singleView")}>View Status →</Btn>}
        </div>
      </div>
    </div>
  );

  // ─── CLIENT VIEWS (member + single) ───────────────────────────────────────
  const ClientView = ({clientObj, backFn, backLabel}) => {
    const myJobs = jobs.filter(j=>j.clientId===clientObj.id).sort((a,b)=>new Date(a.startDate)-new Date(b.startDate));
    const isMember = clientObj.type==="retainer";
    return(
      <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'IBM Plex Mono',monospace",color:C.text}}>
        {renderTopBar(isMember?"/ MEMBER":"/ PROJECT",
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <LiveDot/>
            <Btn variant="ghost" style={{padding:"5px 14px",fontSize:9,borderColor:isMember?C.purple:C.blue,color:isMember?C.purple:C.blue}} onClick={backFn}>{backLabel}</Btn>
          </div>
        )}
        <main style={{padding:"20px 16px 60px",maxWidth:700,margin:"0 auto"}}>
          {isMember&&(
            <div style={{background:"#0e0920",border:`1px solid ${C.purple}40`,borderRadius:10,padding:"14px 18px",marginBottom:22,display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:"#25104a",border:`1px solid ${C.purple}60`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:C.purple,flexShrink:0}}>◈</div>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:C.purple}}>Monthly Member · {clientObj.name}</div>
                <div style={{fontSize:9,color:C.muted,marginTop:2}}>{clientObj.notes}{clientObj.retainerStart?` · Since ${fmt(clientObj.retainerStart)}`:""}</div>
              </div>
            </div>
          )}

          {myJobs.length===0?(
            <div style={{background:"#080c12",border:`1px dashed #141e22`,borderRadius:14,padding:48,textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12}}>◎</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#4a6070",lineHeight:1.6}}>No active projects right now.<br/>We'll notify you when yours begins.</div>
            </div>
          ):(
            myJobs.map((job,i)=>{
              const icon=SVC_ICON[job.service]||"🎬";
              return(
                <div key={job.id} style={{marginBottom:24,animation:`fadeU .4s ease ${i*.12}s both`}}>
                  {/* Project header */}
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingLeft:2}}>
                    <span style={{fontSize:18}}>{icon}</span>
                    <div>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:C.text}}>{job.service}</div>
                      <div style={{fontSize:9,fontFamily:"'DM Sans',sans-serif",color:"#3d5060",marginTop:2}}>{fmt(job.startDate)} → {fmt(job.endDate)}</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <ClientProgressBar job={job} origin={origin}/>

                  {/* Delivery button */}
                  <div style={{marginTop:14}}>
                    <DeliveryButton job={job}/>
                  </div>
                </div>
              );
            })
          )}
        </main>
        <Toast msg={toast}/>
      </div>
    );
  };

  if(screen==="singleView"&&activeClient){
    return <ClientView clientObj={activeClient} backFn={()=>{setScreen("singleLookup");setActiveClient(null);setSingleEmail("");setSingleResult(null);setSingleSearched(false);}} backLabel="← Back"/>;
  }
  if(screen==="member"&&activeClient){
    return <ClientView clientObj={activeClient} backFn={()=>{setScreen("landing");setActiveClient(null);}} backLabel="Logout"/>;
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────────────
  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'IBM Plex Mono',monospace",color:C.text}}>
      <style>{GS}</style>
      {renderTopBar("/ STUDIO",
        <Btn variant="ghost" style={{padding:"5px 12px",fontSize:9}} onClick={()=>setScreen("landing")}>Logout</Btn>
      )}

      <main style={{padding:"16px 16px 100px",maxWidth:900,margin:"0 auto"}}>

        {/* PROJECTS */}
        {adminTab==="projects"&&(
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,marginBottom:4}}>Projects</div>
            <div style={{fontSize:8,color:C.muted,marginBottom:18,letterSpacing:1}}>USE THE 4 BUTTONS TO ADVANCE EACH PROJECT STAGE</div>

            {jobs.length===0&&<div style={{textAlign:"left",color:C.muted,fontSize:11,padding:"20px 0"}}>No projects yet — tap + to add one.</div>}

            {jobs.map((job,i)=>{
              const c=clients.find(x=>x.id===job.clientId);
              const icon=SVC_ICON[job.service]||"🎬";
              const ret=c?.type==="retainer";
              const stageData=STAGES.find(s=>s.id===job.stage)||STAGES[0];
              const hasLink=!!job.deliveryLink;

              return(
                <div key={job.id} style={{background:C.surface,border:`1px solid ${ret?C.purple+"30":C.borderHi}`,borderLeft:`4px solid ${ret?C.purple:stageData.color}`,borderRadius:10,padding:"16px 18px",marginBottom:12,animation:`fadeU .25s ease ${i*.06}s both`}}>

                  {/* Job header */}
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:4}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <div style={{width:30,height:30,borderRadius:"50%",background:ret?"#1a0d38":"#0f0f28",border:`1px solid ${ret?C.purple+"60":C.borderHi}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:ret?C.purple:C.textDim,flexShrink:0}}>{c?initials(c.name):"?"}</div>
                        <div>
                          <div style={{fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:6}}>
                            {c?.name||"Unknown"}
                            {ret&&<span style={{fontSize:7,color:C.purple,background:`${C.purple}15`,border:`1px solid ${C.purple}30`,borderRadius:3,padding:"1px 5px"}}>◈</span>}
                          </div>
                          <div style={{fontSize:8,color:C.muted,marginTop:1}}>{icon} {job.service} · {fmt(job.startDate)} → {fmt(job.endDate)}</div>
                        </div>
                      </div>
                      {job.notes&&<div style={{fontSize:8,color:C.muted,fontStyle:"italic",paddingLeft:38}}>{job.notes}</div>}
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button onClick={()=>openEditJob(job)} style={{background:"none",border:`1px solid ${C.borderHi}`,color:C.muted,fontFamily:"'IBM Plex Mono',monospace",fontSize:8,padding:"5px 10px",borderRadius:5,cursor:"pointer",minHeight:30}}>Edit</button>
                      <button onClick={()=>removeJob(job.id)} style={{background:"none",border:"1px solid #3a1010",color:C.red+"90",fontFamily:"'IBM Plex Mono',monospace",fontSize:8,padding:"5px 10px",borderRadius:5,cursor:"pointer",minHeight:30}}>✕</button>
                    </div>
                  </div>

                  {/* Stage indicator mini-bar */}
                  <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:12,paddingLeft:38}}>
                    {STAGES.map((s,si)=>{
                      const curr=job.stage===s.id;
                      const past=STAGES.findIndex(x=>x.id===job.stage)>si;
                      return(
                        <div key={s.id} style={{display:"flex",alignItems:"center",gap:4}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:curr||past?s.color:"#1c1c2a",transition:"background .3s"}}/>
                          {si<STAGES.length-1&&<div style={{width:16,height:1,background:past?`${s.color}50`:"#1c1c2a"}}/>}
                        </div>
                      );
                    })}
                    <span style={{fontSize:8,color:stageData.color,marginLeft:8,letterSpacing:.5}}>{stageData.desc}</span>
                  </div>

                  {/* The 4 stage buttons */}
                  <StageButtons job={job} onSetStage={setStage} onOpenDelivery={(j)=>setDeliveryTarget(j)}/>

                  {/* Link status indicator */}
                  {hasLink&&(
                    <div style={{marginTop:8,paddingLeft:2,fontSize:8,color:C.green,display:"flex",alignItems:"center",gap:6}}>
                      <span>🔓</span>
                      <span>Client delivery button is <strong>unlocked</strong></span>
                      <span style={{color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:200}}>{job.deliveryLink}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* CLIENTS */}
        {adminTab==="clients"&&(
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,marginBottom:16}}>Client Roster</div>
            <div style={{display:"flex",background:"#09091a",border:`1px solid ${C.border}`,borderRadius:8,padding:4,marginBottom:18,gap:4,width:"fit-content"}}>
              {[["retainer","◈ Retainers",C.purple],["single","◻ One-time",C.blue]].map(([tab,lbl,col])=>(
                <button key={tab} onClick={()=>setClientsTab(tab)} style={{background:clientsTab===tab?`${col}20`:"transparent",border:clientsTab===tab?`1px solid ${col}40`:"1px solid transparent",borderRadius:6,color:clientsTab===tab?col:C.muted,fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:600,padding:"9px 18px",cursor:"pointer",transition:"all .18s",minHeight:40}}>
                  {lbl} <span style={{opacity:.6}}>({(tab==="retainer"?retainers:singles).length})</span>
                </button>
              ))}
            </div>
            {(clientsTab==="retainer"?retainers:singles).map((c,i)=>{
              const cj=jobs.filter(j=>j.clientId===c.id);
              const act=cj.filter(j=>j.stage!=="delivered").length;
              const ret=c.type==="retainer";
              return(
                <div key={c.id} style={{background:ret?"#0e0920":C.surface,border:`1px solid ${ret?C.purple+"30":C.borderHi}`,borderRadius:9,padding:"14px 18px",marginBottom:10,animation:`fadeU .25s ease ${i*.06}s both`}}>
                  <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:ret?"#1a0d38":"#0f0f28",border:`1px solid ${ret?C.purple+"60":C.borderHi}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:ret?C.purple:C.textDim,flexShrink:0}}>{initials(c.name)}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:13}}>{c.name}</div>
                      <div style={{fontSize:9,color:C.muted,marginTop:2}}>{c.email}{c.phone?` · ${c.phone}`:""}{ret&&c.retainerStart?` · Since ${fmt(c.retainerStart)}`:""}</div>
                      {c.notes&&<div style={{fontSize:8,color:C.muted,marginTop:2,fontStyle:"italic"}}>{c.notes}</div>}
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:11,color:act>0?C.green:C.muted,fontWeight:600}}>{cj.length} project{cj.length!==1?"s":""}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>openEditClient(c)} style={{background:"none",border:`1px solid ${C.borderHi}`,color:C.muted,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"7px 16px",borderRadius:6,cursor:"pointer",minHeight:36}}>Edit</button>
                    <button onClick={()=>removeClient(c.id)} style={{background:"none",border:"1px solid #3a1010",color:C.red+"90",fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"7px 16px",borderRadius:6,cursor:"pointer",minHeight:36}}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav
        tabs={[["projects","PROJECTS"],["clients",`CLIENTS`]]}
        active={adminTab}
        onChange={setAdminTab}
        fab={true}
        onFab={()=>{
          if(adminTab==="clients"){ setCForm({...blankC,type:clientsTab}); setModal("addClient"); }
          else { setJForm({...blankJ,clientId:clients[0]?.id||"",startDate:todayStr(),endDate:addDays(todayStr(),7)}); setModal("addJob"); }
        }}
      />

      {renderModals()}
      <Toast msg={toast}/>
    </div>
  );
}
