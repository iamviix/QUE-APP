import { useState, useEffect } from "react"
import Head from "next/head"
import { sGet, CLIENTS_KEY, JOBS_KEY, isAdminLive } from "../storage"

const IG_URL = "https://instagram.com/alphabetfilms"

const STAGES = [
  { id:"uploading", label:"Files",     color:"#4488ff" },
  { id:"working",   label:"Working",   color:"#f0c060" },
  { id:"finishing", label:"Finishing", color:"#d4a44c" },
  { id:"delivered", label:"Complete",  color:"#18d462" },
]

const SVC_ICON = {
  "Wedding Film":"🎞","Music Video":"🎬","Brand / Commercial":"📡",
  "Event Coverage":"📹","Photo Shoot":"📷","Reel / Short Form":"▶","Documentary":"🎥",
}

const C = {
  bg:"#07070f", surface:"#0c0c1a",
  border:"#14142a", borderHi:"#1c1c38",
  text:"#dcd8f2", muted:"#3d3d5a", dim:"#7777a0",
  gold:"#d4a44c", green:"#18d462", blue:"#4488ff", purple:"#9966ff",
}

const GS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{background:#07070f;color:#dcd8f2;font-family:'IBM Plex Mono',monospace;-webkit-font-smoothing:antialiased;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}
  @keyframes spinRing{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{left:-100%}100%{left:200%}}
  @keyframes checkPop{0%{transform:scale(0) rotate(-20deg);opacity:0}70%{transform:scale(1.2) rotate(4deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
  @keyframes unlockPulse{0%,100%{box-shadow:0 0 0 0 rgba(24,212,98,.4)}60%{box-shadow:0 0 0 14px rgba(24,212,98,0)}}
  @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes livePulse{0%{box-shadow:0 0 0 0 rgba(24,212,98,.5)}70%{box-shadow:0 0 0 5px rgba(24,212,98,0)}100%{box-shadow:0 0 0 0 rgba(24,212,98,0)}}
  @keyframes liveFadeIn{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
  input{font-family:'IBM Plex Mono',monospace!important;}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:#0c0c1a}
  ::-webkit-scrollbar-thumb{background:#1c1c38;border-radius:4px}
`

const todayStr  = () => new Date().toISOString().split("T")[0]
const addDays   = (ds,n) => { const d=new Date(ds); d.setDate(d.getDate()+n); return d.toISOString().split("T")[0] }
const fmt       = (d) => d ? new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : ""
const TODAY_IDX = 4
const ORIGIN    = addDays(todayStr(),-TODAY_IDX)
const dayOff    = (ds) => Math.round((new Date(ds)-new Date(ORIGIN))/86400000)

const calmColor = (pct) => {
  if(pct < 25) return "#a8d8b9"
  if(pct < 50) return "#7bc8a4"
  if(pct < 70) return "#f5c97a"
  if(pct < 88) return "#e8a96a"
  return "#d4846a"
}

function Bg() {
  return (
    <>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",width:320,height:320,top:-100,left:-60,borderRadius:"50%",background:"rgba(212,164,76,.07)",filter:"blur(80px)"}}/>
        <div style={{position:"absolute",width:240,height:240,bottom:"10%",right:-60,borderRadius:"50%",background:"rgba(24,212,98,.04)",filter:"blur(80px)"}}/>
        <div style={{position:"absolute",width:200,height:200,top:"45%",right:-40,borderRadius:"50%",background:"rgba(153,102,255,.04)",filter:"blur(70px)"}}/>
      </div>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,opacity:.45,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`}}/>
    </>
  )
}

function LiveDot() {
  const [live, setLive] = useState(false)
  useEffect(() => {
    const check = () => setLive(isAdminLive())
    check()
    const id = setInterval(check, 8000)
    return () => clearInterval(id)
  }, [])
  if(!live) return null
  return (
    <div style={{display:"flex",alignItems:"center",gap:5,animation:"liveFadeIn .4s ease both"}} title="Studio is currently active">
      <div style={{width:7,height:7,borderRadius:"50%",background:"#18d462",animation:"livePulse 2s ease infinite",flexShrink:0}}/>
      <span style={{fontSize:8,color:"#18d46280",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:.5}}>editing</span>
    </div>
  )
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function HomePage({ onTrack }) {
  return (
    <div style={{maxWidth:460,margin:"0 auto",padding:"44px 20px 80px",position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"flex-start"}}>
      <div style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:40,animation:"fadeUp .5s ease both"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:8,height:8,background:C.gold,transform:"rotate(45deg)",flexShrink:0}}/>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.gold}}>Que</span>
        </div>
        <a href={IG_URL} target="_blank" rel="noopener" style={{fontSize:9,letterSpacing:1.5,textTransform:"uppercase",color:C.dim,textDecoration:"none",border:`1px solid ${C.borderHi}`,padding:"6px 13px",borderRadius:5}}>@alphabetfilms ↗</a>
      </div>

      <div style={{position:"relative",width:72,height:72,marginBottom:18,animation:"float 4s ease infinite"}}>
        <div style={{position:"absolute",inset:-3,borderRadius:"50%",background:"conic-gradient(#d4a44c, #ffaa00, #d4a44c 60%, transparent 60%)",animation:"spinRing 8s linear infinite"}}/>
        <div style={{position:"absolute",inset:3,borderRadius:"50%",background:"#12101a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.gold}}>Q</div>
      </div>

      <div style={{fontSize:10,color:C.dim,letterSpacing:2.5,textTransform:"uppercase",marginBottom:10,animation:"fadeUp .5s ease .05s both"}}>@alphabetfilms</div>

      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#9090b8",lineHeight:1.75,marginBottom:20,maxWidth:360,animation:"fadeUp .5s ease .1s both"}}>
        Videography &amp; photography for brands, artists &amp; moments worth keeping. Based everywhere. Delivered on time.
      </p>

      <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:36,animation:"fadeUp .5s ease .15s both"}}>
        {["Videography","Photography","Reels","Brand Content","Events"].map(t=>(
          <span key={t} style={{fontSize:8,letterSpacing:1.5,textTransform:"uppercase",padding:"4px 10px",borderRadius:3,border:`1px solid ${C.borderHi}`,color:C.dim}}>{t}</span>
        ))}
      </div>

      <div style={{width:"100%",animation:"fadeUp .5s ease .2s both"}}>
        <div
          onClick={onTrack}
          style={{display:"flex",alignItems:"center",gap:16,padding:"18px 20px",background:C.surface,border:`1px solid ${C.borderHi}`,borderRadius:14,cursor:"pointer",transition:"all .2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.green;e.currentTarget.style.transform="translateX(5px)";e.currentTarget.style.background="rgba(24,212,98,0.06)"}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.borderHi;e.currentTarget.style.transform="none";e.currentTarget.style.background=C.surface}}
        >
          <div style={{width:44,height:44,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,background:"rgba(24,212,98,.1)",border:"1px solid rgba(24,212,98,.2)"}}>◈</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,marginBottom:4}}>Track Your Project</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.dim}}>Check your delivery status with email or phone</div>
          </div>
          <span style={{fontSize:20,color:C.muted,flexShrink:0}}>›</span>
        </div>
      </div>

      <div style={{width:"100%",height:1,background:`linear-gradient(90deg,${C.gold},transparent)`,opacity:.2,margin:"32px 0"}}/>

      <div style={{fontSize:8,letterSpacing:3,textTransform:"uppercase",color:C.muted,marginBottom:14,display:"flex",alignItems:"center",gap:8,width:"100%"}}>
        Services<div style={{flex:1,height:1,background:C.border}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",animation:"fadeUp .5s ease .35s both"}}>
        {[["▶","Reels / Short Form"],["📷","Photo Shoot"],["📹","Event Coverage"],["📡","Brand & Commercial"],["🎬","Music Video"],["🎞","Wedding Film"],["🎥","Documentary"]].map(([em,nm])=>(
          <div key={nm} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>{em}</span>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.dim}}>{nm}</span>
          </div>
        ))}
      </div>

      <div style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:40}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:5,height:5,background:C.gold,transform:"rotate(45deg)",opacity:.4}}/>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,color:C.muted}}>Que</span>
        </div>
        <a href={IG_URL} target="_blank" rel="noopener" style={{fontSize:8,color:C.muted,textDecoration:"none",letterSpacing:.5}}>instagram.com/alphabetfilms ↗</a>
      </div>
    </div>
  )
}

// ── TRACKER ───────────────────────────────────────────────────────────────────
function TrackPage({ onBack }) {
  const [mode,setMode]       = useState("email")
  const [input,setInput]     = useState("")
  const [loading,setLoading] = useState(false)
  const [error,setError]     = useState(false)
  const [client,setClient]   = useState(null)
  const [jobs,setJobs]       = useState([])
  const [done,setDone]       = useState({})

  const switchMode = (m) => { setMode(m); setInput(""); setError(false); setClient(null); setJobs([]) }

  const find = () => {
    if(!input.trim()) return
    setLoading(true); setError(false); setClient(null); setJobs([])
    // Small delay for UX feel
    setTimeout(() => {
      const q = input.trim().toLowerCase()
      const clients = sGet(CLIENTS_KEY, [])
      const allJobs = sGet(JOBS_KEY, [])
      setLoading(false)
      const found = clients.find(c => {
        if(mode==="email") return (c.email||"").toLowerCase()===q
        const ph=(c.phone||"").replace(/\D/g,"")
        return ph===q.replace(/\D/g,"") && ph.length>0
      })
      if(!found){ setError(true); return }
      setClient(found)
      setJobs(allJobs.filter(j=>j.clientId===found.id).sort((a,b)=>new Date(a.startDate)-new Date(b.startDate)))
    }, 600)
  }

  return (
    <div style={{maxWidth:460,margin:"0 auto",padding:"40px 20px 80px",position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"flex-start"}}>

      <div style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:36,animation:"slideIn .4s ease both"}}>
        <button onClick={onBack} style={{background:"none",border:`1px solid ${C.borderHi}`,color:C.dim,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"7px 14px",borderRadius:6,cursor:"pointer",letterSpacing:1,minHeight:36}}>← Back</button>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <LiveDot/>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:7,height:7,background:C.gold,transform:"rotate(45deg)"}}/>
            <span style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:C.gold}}>Que</span>
          </div>
        </div>
      </div>

      <div style={{marginBottom:28,animation:"slideIn .4s ease .06s both"}}>
        <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,letterSpacing:"-1px",marginBottom:10,lineHeight:1.1}}>
          Track your<br/><span style={{color:C.gold}}>project.</span>
        </h1>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.dim,lineHeight:1.75}}>
          Enter the email or phone you booked with — we'll pull up your project instantly.
        </p>
      </div>

      <div style={{display:"flex",width:"100%",background:"#09091a",border:`1px solid ${C.border}`,borderRadius:8,padding:3,marginBottom:14,animation:"slideIn .4s ease .1s both"}}>
        {[["email","✉ Email"],["phone","☎ Phone"]].map(([m,lbl])=>(
          <button key={m} onClick={()=>switchMode(m)} style={{flex:1,padding:"9px 12px",borderRadius:6,border:mode===m?"1px solid rgba(212,164,76,.4)":"1px solid transparent",background:mode===m?"rgba(212,164,76,.15)":"transparent",color:mode===m?C.gold:C.dim,fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:600,cursor:"pointer",transition:"all .18s",minHeight:38}}>
            {lbl}
          </button>
        ))}
      </div>

      <div style={{width:"100%",marginBottom:12,animation:"slideIn .4s ease .14s both"}}>
        <label style={{display:"block",fontSize:8,letterSpacing:2,textTransform:"uppercase",color:C.dim,marginBottom:6}}>
          {mode==="email" ? "Your email address" : "Your phone number"}
        </label>
        <input
          type={mode==="email" ? "email" : "tel"}
          placeholder={mode==="email" ? "you@example.com" : "555-0100"}
          value={input}
          onChange={e=>{ setInput(e.target.value); setError(false) }}
          onKeyDown={e=>e.key==="Enter"&&find()}
          style={{width:"100%",background:"#0a0a18",border:`1px solid ${error?"#ff606060":C.borderHi}`,borderRadius:8,color:C.text,fontFamily:"'IBM Plex Mono',monospace",fontSize:14,padding:"13px 16px",outline:"none",transition:"border-color .15s"}}
          onFocus={e=>e.target.style.borderColor=C.gold}
          onBlur={e=>e.target.style.borderColor=error?"#ff606060":C.borderHi}
          autoCapitalize="none" autoCorrect="off" spellCheck="false"
        />
      </div>

      {error && (
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#ff9090",marginBottom:12,lineHeight:1.6,animation:"slideIn .3s ease both"}}>
          No project found. Double-check your spelling, or DM{" "}
          <a href={IG_URL} target="_blank" rel="noopener" style={{color:C.gold,textDecoration:"none"}}>@alphabetfilms</a>.
        </div>
      )}

      <button
        onClick={find}
        disabled={loading||!input.trim()}
        style={{width:"100%",padding:"16px 24px",background:C.gold,color:"#06060f",fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,border:"none",borderRadius:10,cursor:(!input.trim()||loading)?"not-allowed":"pointer",opacity:(!input.trim()||loading)?.5:1,marginBottom:28,animation:"slideIn .4s ease .18s both",transition:"all .2s"}}
        onMouseEnter={e=>{if(!loading&&input.trim()){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 12px 36px rgba(212,164,76,.3)"}}}
        onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}
      >
        {loading
          ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <span style={{width:15,height:15,borderRadius:"50%",border:"2px solid rgba(6,6,15,.3)",borderTopColor:"#06060f",animation:"spin .7s linear infinite",display:"inline-block"}}/>
              Searching…
            </span>
          : "Find My Project →"}
      </button>

      {client && (
        <div style={{width:"100%"}}>
          <div style={{height:1,background:`linear-gradient(90deg,${C.gold},transparent)`,opacity:.2,marginBottom:24}}/>
          <div style={{marginBottom:20,animation:"fadeUp .4s ease both"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,marginBottom:4}}>Hey, {client.name.split(" ")[0]} 👋</div>
            <div style={{fontSize:8,letterSpacing:2,textTransform:"uppercase",color:C.dim}}>{jobs.length} project{jobs.length!==1?"s":""} found</div>
          </div>

          {jobs.length===0 && (
            <div style={{background:C.surface,border:`1px dashed ${C.border}`,borderRadius:14,padding:40,textAlign:"center"}}>
              <div style={{fontSize:28,marginBottom:12,opacity:.5}}>◎</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:C.dim,marginBottom:6}}>No active projects</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,lineHeight:1.6}}>
                Questions? DM <a href={IG_URL} target="_blank" rel="noopener" style={{color:C.gold,textDecoration:"none"}}>@alphabetfilms</a>
              </div>
            </div>
          )}

          {jobs.map((job,i) => {
            const icon      = SVC_ICON[job.service]||"🎬"
            const stageIdx  = STAGES.findIndex(s=>s.id===job.stage)
            const s         = dayOff(job.startDate)
            const e         = dayOff(job.endDate)
            const span      = Math.max(e-s,1)
            const elapsed   = Math.min(100,Math.max(0,((TODAY_IDX-s)/span)*100))
            const stagePct  = job.stage==="delivered"?100:Math.max(elapsed,(stageIdx/3)*100)
            const color     = job.stage==="delivered"?"#18d462":calmColor(stagePct)
            const daysLeft  = Math.max(0,e-TODAY_IDX)
            const unlocked  = !!(job.deliveryLink&&job.stage==="delivered")
            const isComplete= done[job.id]

            const stageMsg = {
              uploading:"Your files are being received and organised",
              working:  "Our team is actively working on your project",
              finishing:"Final touches and quality checks underway",
              delivered:"Your project is complete and ready to access",
            }[job.stage]||""

            if(isComplete) return (
              <div key={job.id} style={{background:"#030e07",border:"1px solid rgba(24,212,98,.3)",borderRadius:14,padding:28,textAlign:"center",marginBottom:16,animation:"fadeUp .4s ease both"}}>
                <div style={{fontSize:40,marginBottom:12,animation:"checkPop .5s ease both"}}>✓</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:"#18d462",marginBottom:8}}>All done!</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(24,212,98,.5)",lineHeight:1.6}}>Your files are ready.</div>
              </div>
            )

            return (
              <div key={job.id} style={{background:C.surface,border:`1px solid ${C.borderHi}`,borderLeft:`3px solid ${color}`,borderRadius:14,padding:20,marginBottom:16,animation:`fadeUp .4s ease ${i*.08}s both`}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                  <span style={{fontSize:20,flexShrink:0}}>{icon}</span>
                  <div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700}}>{job.service}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:C.dim,marginTop:2}}>{fmt(job.startDate)} → {fmt(job.endDate)}</div>
                  </div>
                </div>

                <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:10}}>
                  {STAGES.map((st,si) => {
                    const past=stageIdx>si, curr=stageIdx===si
                    return (
                      <div key={st.id} style={{display:"flex",alignItems:"center",gap:4,flex:si<STAGES.length-1?1:"auto"}}>
                        <div style={{width:curr?10:7,height:curr?10:7,borderRadius:"50%",background:(past||curr)?color:"#0a0a14",border:`2px solid ${(past||curr)?color:"#1a1a2a"}`,boxShadow:curr?`0 0 8px ${color}`:"none",transition:"all .4s",flexShrink:0}}/>
                        {si<STAGES.length-1 && <div style={{flex:1,height:1,background:stageIdx>si?`${color}50`:"#1a1a2a",transition:"background .6s"}}/>}
                      </div>
                    )
                  })}
                </div>

                <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                  {STAGES.map((st,si) => (
                    <span key={st.id} style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,color:stageIdx===si?color:C.muted,flex:1,textAlign:si===0?"left":si===STAGES.length-1?"right":"center",transition:"color .3s"}}>{st.label}</span>
                  ))}
                </div>

                <div style={{background:"#0e121a",borderRadius:8,height:8,overflow:"hidden",position:"relative",marginBottom:8}}>
                  <div style={{width:`${stagePct}%`,height:"100%",borderRadius:8,background:`linear-gradient(90deg,${color}60,${color})`,boxShadow:`0 0 10px ${color}40`,transition:"width 1.4s cubic-bezier(.16,1,.3,1)",position:"relative",overflow:"hidden"}}>
                    {job.stage!=="delivered" && <div style={{position:"absolute",top:0,bottom:0,width:"40%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)",animation:"shimmer 2.2s infinite"}}/>}
                  </div>
                </div>

                <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.dim,marginBottom:14}}>
                  <span style={{color,fontWeight:600}}>{job.stage==="delivered"?"Complete":Math.round(stagePct)+"% done"}</span>
                  <span>{job.stage==="delivered"?"Delivered ✓":`${daysLeft} day${daysLeft!==1?"s":""} remaining`}</span>
                </div>

                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color,lineHeight:1.6,marginBottom:job.notes?4:0}}>{stageMsg}</div>
                {job.notes && <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.dim,marginTop:4,fontStyle:"italic"}}>{job.notes}</div>}

                <div
                  onClick={()=>{ if(unlocked&&job.deliveryLink){ window.open(job.deliveryLink,"_blank"); setTimeout(()=>setDone(d=>({...d,[job.id]:true})),600) }}}
                  style={{display:"flex",alignItems:"center",gap:14,padding:"15px 16px",borderRadius:12,border:`2px solid ${unlocked?"rgba(24,212,98,.5)":C.borderHi}`,background:unlocked?"#030e07":"#09090f",cursor:unlocked?"pointer":"not-allowed",transition:"all .3s",marginTop:16,animation:unlocked?"unlockPulse 2.5s ease 1":"none"}}
                  onMouseEnter={e=>{ if(unlocked){e.currentTarget.style.background="#071808";e.currentTarget.style.borderColor="#18d462";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(24,212,98,.2)"}}}
                  onMouseLeave={e=>{ if(unlocked){e.currentTarget.style.background="#030e07";e.currentTarget.style.borderColor="rgba(24,212,98,.5)";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}}
                >
                  <div style={{width:38,height:38,borderRadius:"50%",border:`2px solid ${unlocked?"rgba(24,212,98,.4)":C.borderHi}`,background:unlocked?"rgba(24,212,98,.1)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0,transition:"all .3s"}}>
                    {unlocked ? "✓" : "🔒"}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:unlocked?"#18d462":"#2a2a3a",marginBottom:2,transition:"color .3s"}}>{unlocked?"Access Your Files":"Awaiting Delivery"}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:unlocked?"rgba(24,212,98,.5)":"#2a2a3a",transition:"color .3s"}}>{unlocked?"Tap to open your completed project files":"Your files will be available here once complete"}</div>
                  </div>
                  {unlocked && <span style={{color:"#18d462",fontSize:18,flexShrink:0}}>›</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:client?16:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:5,height:5,background:C.gold,transform:"rotate(45deg)",opacity:.4}}/>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,color:C.muted}}>Que</span>
        </div>
        <a href={IG_URL} target="_blank" rel="noopener" style={{fontSize:8,color:C.muted,textDecoration:"none",letterSpacing:.5}}>instagram.com/alphabetfilms ↗</a>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function QueLinkPage() {
  const [page, setPage] = useState("home")
  return (
    <>
      <Head>
        <title>Que · @alphabetfilms</title>
      </Head>
      <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'IBM Plex Mono',monospace",overflowX:"hidden"}}>
        <style>{GS}</style>
        <Bg/>
        {page==="home"  && <HomePage onTrack={()=>setPage("track")}/>}
        {page==="track" && <TrackPage onBack={()=>setPage("home")}/>}
      </div>
    </>
  )
}
