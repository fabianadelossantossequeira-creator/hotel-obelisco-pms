import { useState, useEffect, useCallback } from "react";

/* ─────────────────────────── SHARED DATA STORE ─────────────────────────── */
const ROOMS = [
  { id:"101", type:"Standard",     floor:1, cap:1, rate:75,  beds:"1 cama simple" },
  { id:"102", type:"Standard",     floor:1, cap:2, rate:75,  beds:"2 camas simples" },
  { id:"103", type:"Standard",     floor:1, cap:2, rate:75,  beds:"1 cama doble" },
  { id:"104", type:"Doble",        floor:1, cap:3, rate:110, beds:"1 doble + 1 simple" },
  { id:"105", type:"Doble",        floor:1, cap:2, rate:110, beds:"1 cama queen" },
  { id:"201", type:"Doble",        floor:2, cap:2, rate:110, beds:"1 cama king" },
  { id:"202", type:"Superior",     floor:2, cap:2, rate:155, beds:"1 cama king · vista río" },
  { id:"203", type:"Superior",     floor:2, cap:3, rate:155, beds:"1 king + sofá cama" },
  { id:"204", type:"Superior",     floor:2, cap:2, rate:155, beds:"1 cama king · balcón" },
  { id:"301", type:"Suite",        floor:3, cap:4, rate:240, beds:"King + sala · vista panorámica" },
  { id:"302", type:"Suite",        floor:3, cap:4, rate:240, beds:"King + 2 simples · jacuzzi" },
  { id:"303", type:"Suite Junior", floor:3, cap:2, rate:185, beds:"King · kitchenette" },
];

const INITIAL_RES = [
  { id:"R001", roomId:"102", guest:"García, Martín",   doc:"3.456.789-1", nationality:"Uruguay", checkIn:"2026-03-19", checkOut:"2026-03-22", status:"checkin",  pax:2, extras:[{desc:"Desayuno ×2 (3 días)",amount:90},{desc:"Minibar",amount:22}], source:"Directo",    notes:"" },
  { id:"R002", roomId:"203", guest:"López, Andrea",    doc:"5.234.567-0", nationality:"Argentina",checkIn:"2026-03-20", checkOut:"2026-03-24", status:"reserved", pax:2, extras:[], source:"OTA",         notes:"Solicita cuna" },
  { id:"R003", roomId:"301", guest:"Rodríguez, Carlos",doc:"2.987.654-3", nationality:"Brasil",   checkIn:"2026-03-21", checkOut:"2026-03-26", status:"reserved", pax:3, extras:[], source:"OTA",         notes:"" },
  { id:"R004", roomId:"103", guest:"Fernández, Julia", doc:"4.123.456-2", nationality:"Uruguay", checkIn:"2026-03-17", checkOut:"2026-03-20", status:"checkin",  pax:1, extras:[{desc:"Lavandería",amount:18}], source:"Directo", notes:"" },
  { id:"R005", roomId:"104", guest:"Martínez, Pablo",  doc:"6.789.012-4", nationality:"Chile",   checkIn:"2026-03-22", checkOut:"2026-03-25", status:"reserved", pax:2, extras:[], source:"Expedia",      notes:"" },
  { id:"R006", roomId:"202", guest:"Silva, Valentina", doc:"1.654.321-5", nationality:"Uruguay", checkIn:"2026-03-18", checkOut:"2026-03-19", status:"checkout", pax:2, extras:[{desc:"Cena gourmet",amount:65}], source:"Directo", notes:"" },
];

const HK_INIT = { "101":"clean","102":"occupied","103":"occupied","104":"clean","105":"clean","201":"clean","202":"checkout","203":"occupied","204":"inspecting","301":"clean","302":"clean","303":"clean" };

const TODAY = "2026-03-20";

function addDays(dateStr, n) {
  const d = new Date(dateStr+"T12:00:00"); d.setDate(d.getDate()+n);
  return d.toISOString().split("T")[0];
}
function daysBetween(a,b){ return Math.round((new Date(b)-new Date(a))/86400000); }
function fmtDate(s){ const d=new Date(s+"T12:00:00"); return d.toLocaleDateString("es-UY",{day:"2-digit",month:"short"}); }
function fmtFull(s){ const d=new Date(s+"T12:00:00"); return d.toLocaleDateString("es-UY",{day:"2-digit",month:"long",year:"numeric"}); }
function getDates(start,n){ return Array.from({length:n},(_,i)=>addDays(start,i)); }

function calcBill(res){
  const room = ROOMS.find(r=>r.id===res.roomId);
  const nights = daysBetween(res.checkIn,res.checkOut);
  const roomTotal = nights*(room?.rate||0);
  const extrasTotal = res.extras.reduce((a,e)=>a+e.amount,0);
  const subtotal = roomTotal+extrasTotal;
  const tax = Math.round(subtotal*0.22*100)/100;
  return { nights, rate:room?.rate||0, roomTotal, extrasTotal, subtotal, tax, total:Math.round((subtotal+tax)*100)/100 };
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*                              MAIN APP                                      */
/* ══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [view, setView] = useState("pms"); // "pms" | "ota"
  const [reservations, setReservations] = useState(INITIAL_RES);
  const [hk, setHk] = useState(HK_INIT);

  const addReservation = useCallback((res) => {
    setReservations(prev => [...prev, res]);
  }, []);

  const updateReservation = useCallback((id, changes) => {
    setReservations(prev => prev.map(r => r.id===id ? {...r,...changes} : r));
  }, []);

  const isAvailable = useCallback((roomId, checkIn, checkOut, excludeId=null) => {
    return !reservations.some(r =>
      r.roomId===roomId && r.id!==excludeId &&
      r.status!=="cancelled" && r.status!=="checkout" &&
      r.checkIn < checkOut && r.checkOut > checkIn
    );
  }, [reservations]);

  return (
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif",minHeight:"100vh",background:"#060810"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin:0; padding:0; }
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:#0d1117}
        ::-webkit-scrollbar-thumb{background:#2d3748;border-radius:3px}
        input,select,textarea{outline:none;font-family:inherit}
        button{font-family:inherit;cursor:pointer}
        .rack-cell:hover{filter:brightness(1.15)}
        .nav-btn:hover{background:#1a2235!important;color:#93c5fd!important}
        .res-row:hover{border-color:#3b82f6!important;background:#141824!important}
        .room-card:hover{border-color:#3b82f6!important}
        .ota-card:hover{box-shadow:0 4px 20px rgba(0,113,194,0.3)!important;transform:translateY(-2px)}
      `}</style>

      {/* APP SWITCHER */}
      <div style={{position:"fixed",top:12,right:12,zIndex:9999,display:"flex",gap:4,background:"#0d1117",border:"1px solid #1e2433",borderRadius:10,padding:4}}>
        <button onClick={()=>setView("pms")} style={{padding:"6px 16px",background:view==="pms"?"#1d4ed8":"transparent",border:"none",borderRadius:7,color:view==="pms"?"#fff":"#64748b",fontSize:12,fontWeight:600,transition:"all .15s"}}>⚙ PMS</button>
        <button onClick={()=>setView("ota")} style={{padding:"6px 16px",background:view==="ota"?"#0071c2":"transparent",border:"none",borderRadius:7,color:view==="ota"?"#fff":"#64748b",fontSize:12,fontWeight:600,transition:"all .15s"}}>🌐 OTA</button>
      </div>

      {view==="pms"
        ? <PMS reservations={reservations} hk={hk} setHk={setHk} addReservation={addReservation} updateReservation={updateReservation} isAvailable={isAvailable}/>
        : <OTA reservations={reservations} addReservation={addReservation} isAvailable={isAvailable}/>
      }
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*                                 PMS                                        */
/* ══════════════════════════════════════════════════════════════════════════ */
function PMS({ reservations, hk, setHk, addReservation, updateReservation, isAvailable }) {
  const [mod, setMod] = useState("rack");
  const [selRes, setSelRes] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [showInvoice, setShowInvoice] = useState(null);
  const [notif, setNotif] = useState(null);
  const [newRes, setNewRes] = useState({roomId:"",guest:"",doc:"",nationality:"Uruguay",checkIn:"",checkOut:"",pax:1,source:"Directo",notes:""});
  const [extraDesc, setExtraDesc] = useState("");
  const [extraAmt, setExtraAmt] = useState("");
  const [rackStart, setRackStart] = useState(TODAY);
  const rackDates = getDates(rackStart, 9);

  const toast = (msg,type="ok") => { setNotif({msg,type}); setTimeout(()=>setNotif(null),3200); };

  const getRoomRes = (roomId, date) =>
    reservations.find(r => r.roomId===roomId && r.checkIn<=date && r.checkOut>date && r.status!=="checkout" && r.status!=="cancelled");

  const arrivals = reservations.filter(r=>r.checkIn===TODAY && r.status==="reserved");
  const departures = reservations.filter(r=>r.checkOut===TODAY && r.status==="checkin");
  const inhouse = reservations.filter(r=>r.status==="checkin");
  const occupied = inhouse.length;
  const occ = Math.round(occupied/ROOMS.length*100);

  const doCheckIn = (res) => { updateReservation(res.id,{status:"checkin"}); toast(`Check-in: ${res.guest} · Hab ${res.roomId}`); setSelRes(null); };
  const doCheckOut = (res) => {
    updateReservation(res.id,{status:"checkout"});
    setHk(p=>({...p,[res.roomId]:"dirty"}));
    toast(`Check-out: ${res.guest} · Hab ${res.roomId}`);
    setSelRes(null);
  };
  const doAddExtra = (res) => {
    if(!extraDesc||!extraAmt) return;
    const updated = {...res, extras:[...res.extras,{desc:extraDesc,amount:parseFloat(extraAmt)}]};
    updateReservation(res.id,{extras:updated.extras});
    setSelRes(updated);
    setExtraDesc(""); setExtraAmt("");
    toast("Cargo registrado");
  };
  const doNewRes = () => {
    if(!newRes.roomId||!newRes.guest||!newRes.checkIn||!newRes.checkOut){ toast("Completá todos los campos","err"); return; }
    if(!isAvailable(newRes.roomId,newRes.checkIn,newRes.checkOut)){ toast("Habitación no disponible","err"); return; }
    const res={...newRes, id:"R"+String(reservations.length+1).padStart(3,"0"), status:"reserved", extras:[]};
    addReservation(res);
    setShowNew(false);
    setNewRes({roomId:"",guest:"",doc:"",nationality:"Uruguay",checkIn:"",checkOut:"",pax:1,source:"Directo",notes:""});
    toast(`Reserva creada · ${res.guest} · Hab ${res.roomId}`);
  };

  const stColor = {reserved:"#f59e0b",checkin:"#22c55e",checkout:"#64748b",cancelled:"#ef4444"};
  const stLabel = {reserved:"RESERVADO",checkin:"IN-HOUSE",checkout:"CHECK-OUT",cancelled:"CANCELADO"};
  const hkColor = {clean:"#22c55e",dirty:"#ef4444",occupied:"#3b82f6",inspecting:"#f59e0b"};
  const hkLabel = {clean:"Limpia ✓",dirty:"Sucia",occupied:"Ocupada",inspecting:"Inspeccionando"};

  const navItems = [
    {id:"rack",   icon:"▦", label:"Rack"},
    {id:"front",  icon:"🏨",label:"Front Desk"},
    {id:"res",    icon:"📋",label:"Reservas"},
    {id:"hk",     icon:"🧹",label:"Housekeeping"},
    {id:"billing",icon:"💳",label:"Facturación"},
    {id:"reports",icon:"📊",label:"Reportes"},
  ];

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>

      {/* ── SIDEBAR ── */}
      <div style={{width:228,background:"#0b0f1a",borderRight:"1px solid #141824",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"22px 20px 18px",borderBottom:"1px solid #141824"}}>
          <div style={{fontSize:9,color:"#2d4a6b",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>Property Management</div>
          <div style={{fontSize:20,fontWeight:900,color:"#fff",lineHeight:1.1,letterSpacing:"-0.5px"}}>Hotel Obelisco<br/><span style={{color:"#3b82f6"}}>Salto</span></div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px #22c55e"}}/>
            <span style={{fontSize:11,color:"#4a6282"}}>Sistema activo · {TODAY}</span>
          </div>
        </div>

        <nav style={{flex:1,padding:"10px 10px"}}>
          {navItems.map(item=>(
            <button key={item.id} className="nav-btn" onClick={()=>setMod(item.id)} style={{
              width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",
              background:mod===item.id?"#111827":"transparent",
              border:"none",borderLeft:mod===item.id?"3px solid #3b82f6":"3px solid transparent",
              borderRadius:"0 8px 8px 0",color:mod===item.id?"#93c5fd":"#4a6282",
              fontSize:13,fontWeight:mod===item.id?600:400,marginBottom:1,textAlign:"left",transition:"all .15s"
            }}>
              <span style={{fontSize:15,width:20,textAlign:"center"}}>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <button onClick={()=>{if(window.confirm("¿Resetear todas las reservas?")){{setReservations(INITIAL_RES);setHk(HK_INIT);}}}} style={{margin:"20px 10px",padding:"8px",background:"#e53e3e",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",width:"calc(100% - 20px)",fontSize:"12px"}}>🔄 Resetear Sistema</button>

        <div style={{padding:"14px 10px",borderTop:"1px solid #141824"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <div style={{background:"#111827",borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:"#3b82f6"}}>{occ}%</div>
              <div style={{fontSize:9,color:"#4a6282",textTransform:"uppercase",letterSpacing:1}}>Ocupación</div>
            </div>
            <div style={{background:"#111827",borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:"#f59e0b"}}>{arrivals.length}</div>
              <div style={{fontSize:9,color:"#4a6282",textTransform:"uppercase",letterSpacing:1}}>Llegadas</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"#080c14"}}>

        {/* TOP BAR */}
        <div style={{background:"#0b0f1a",borderBottom:"1px solid #141824",padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",gap:28}}>
            {[
              {l:"Ocupadas",v:`${occupied}/${ROOMS.length}`,c:"#60a5fa"},
              {l:"Llegadas",v:arrivals.length,c:"#f59e0b"},
              {l:"Salidas",v:departures.length,c:"#f87171"},
              {l:"Libres",v:ROOMS.length-occupied,c:"#4ade80"},
            ].map(s=>(
              <div key={s.l}>
                <span style={{fontSize:18,fontWeight:800,color:s.c}}>{s.v}</span>
                <span style={{fontSize:10,color:"#4a6282",marginLeft:6,textTransform:"uppercase",letterSpacing:1}}>{s.l}</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowNew(true)} style={{padding:"7px 18px",background:"#1d4ed8",border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,letterSpacing:"-0.2px"}}>
              + Nueva Reserva
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{flex:1,overflow:"auto",padding:24}}>

          {/* ════ RACK ════ */}
          {mod==="rack" && (
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                <h2 style={{fontSize:18,fontWeight:800,color:"#f8fafc",letterSpacing:"-0.5px"}}>Rack de Habitaciones</h2>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <button onClick={()=>setRackStart(s=>addDays(s,-7))} style={{padding:"5px 12px",background:"#111827",border:"1px solid #1e2a3a",borderRadius:7,color:"#94a3b8",fontSize:12}}>‹ Anterior</button>
                  <button onClick={()=>setRackStart(TODAY)} style={{padding:"5px 12px",background:"#1d4ed8",border:"none",borderRadius:7,color:"#fff",fontSize:12,fontWeight:600}}>Hoy</button>
                  <button onClick={()=>setRackStart(s=>addDays(s,7))} style={{padding:"5px 12px",background:"#111827",border:"1px solid #1e2a3a",borderRadius:7,color:"#94a3b8",fontSize:12}}>Siguiente ›</button>
                </div>
              </div>

              <div style={{overflowX:"auto",borderRadius:12,border:"1px solid #141824"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:800}}>
                  <thead>
                    <tr style={{background:"#0b0f1a"}}>
                      <th style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:"#3b5478",fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,borderBottom:"1px solid #141824",minWidth:80}}>Hab</th>
                      <th style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:"#3b5478",fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,borderBottom:"1px solid #141824",minWidth:90}}>Tipo</th>
                      {rackDates.map(d=>(
                        <th key={d} style={{padding:"10px 8px",fontSize:10,fontWeight:700,textAlign:"center",borderBottom:"1px solid #141824",borderLeft:"1px solid #141824",minWidth:95,
                          color:d===TODAY?"#60a5fa":"#3b5478",background:d===TODAY?"#0d1525":"transparent"}}>
                          {d===TODAY && <div style={{fontSize:8,color:"#3b82f6",letterSpacing:2,marginBottom:2}}>HOY</div>}
                          {fmtDate(d)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1,2,3].map(floor=>(
                      <>
                        <tr key={"f"+floor}>
                          <td colSpan={2+rackDates.length} style={{padding:"6px 14px",background:"#0a0e18",fontSize:10,color:"#2d4a6b",fontWeight:700,letterSpacing:2,textTransform:"uppercase",borderBottom:"1px solid #141824"}}>
                            Piso {floor}
                          </td>
                        </tr>
                        {ROOMS.filter(r=>r.floor===floor).map(room=>(
                          <tr key={room.id} style={{borderBottom:"1px solid #0e1420"}}>
                            <td style={{padding:"8px 14px",background:"#0b0f1a",borderRight:"1px solid #141824"}}>
                              <div style={{fontSize:15,fontWeight:800,color:"#e2e8f0"}}>{room.id}</div>
                              <div style={{fontSize:10,color:"#2d4a6b"}}>${room.rate}</div>
                            </td>
                            <td style={{padding:"8px 14px",background:"#0b0f1a",borderRight:"1px solid #141824",fontSize:11,color:"#4a6282",whiteSpace:"nowrap"}}>{room.type}</td>
                            {rackDates.map((date,i)=>{
                              const res = getRoomRes(room.id,date);
                              const prevRes = i>0 ? getRoomRes(room.id,rackDates[i-1]) : null;
                              const isStart = res && (!prevRes || prevRes.id!==res.id);
                              const bg = res
                                ? res.status==="checkin" ? "#0d2040"
                                : res.status==="reserved" ? "#0f2010"
                                : "#1a0a0a"
                                : date===TODAY ? "#0d1020" : "transparent";
                              const tc = res
                                ? res.status==="checkin" ? "#93c5fd"
                                : res.status==="reserved" ? "#86efac"
                                : "#fca5a5"
                                : "#1e3050";
                              const borderL = date===TODAY ? "2px solid #1d4ed8" : "1px solid #141824";
                              return (
                                <td key={date} className="rack-cell" onClick={()=>res&&setSelRes(res)} style={{
                                  padding:"6px 6px",background:bg,borderLeft:borderL,
                                  cursor:res?"pointer":"default",verticalAlign:"middle",transition:"filter .1s"
                                }}>
                                  {res ? (
                                    <div style={{borderRadius:4,background:tc+"18",border:`1px solid ${tc}40`,padding:"4px 7px",fontSize:10,fontWeight:700,color:tc,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:83}}>
                                      {isStart ? res.guest.split(",")[0] : <span style={{opacity:.3}}>─</span>}
                                    </div>
                                  ) : (
                                    <div style={{height:26,borderRadius:4,background:date===TODAY?"#0d1830":"transparent"}}/>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{display:"flex",gap:20,marginTop:14,flexWrap:"wrap"}}>
                {[["#0d2040","#93c5fd","In-House"],["#0f2010","#86efac","Reservado"],["#1a0a0a","#fca5a5","Check-out"],].map(([bg,col,lbl])=>(
                  <div key={lbl} style={{display:"flex",alignItems:"center",gap:7,fontSize:11,color:"#64748b"}}>
                    <div style={{width:14,height:14,background:bg,border:`1.5px solid ${col}`,borderRadius:3}}/>
                    {lbl}
                  </div>
                ))}
                <div style={{display:"flex",alignItems:"center",gap:7,fontSize:11,color:"#64748b"}}>
                  <div style={{width:14,height:14,background:"transparent",border:"1.5px solid #1e3050",borderRadius:3}}/>Libre
                </div>
              </div>
            </div>
          )}

          {/* ════ FRONT DESK ════ */}
          {mod==="front" && (
            <div>
              <h2 style={{fontSize:18,fontWeight:800,color:"#f8fafc",marginBottom:20}}>Front Desk — {fmtFull(TODAY)}</h2>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:28}}>

                {/* ARRIVALS */}
                <div style={{background:"#0b0f1a",border:"1px solid #141824",borderRadius:12,overflow:"hidden"}}>
                  <div style={{padding:"14px 16px",borderBottom:"1px solid #141824",display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:"#f59e0b"}}/>
                    <span style={{fontSize:12,fontWeight:700,color:"#f59e0b",textTransform:"uppercase",letterSpacing:1}}>Llegadas ({arrivals.length})</span>
                  </div>
                  <div style={{padding:12,display:"flex",flexDirection:"column",gap:8}}>
                    {arrivals.length===0 && <div style={{fontSize:12,color:"#2d4a6b",padding:"8px 0",textAlign:"center"}}>Sin llegadas pendientes</div>}
                    {arrivals.map(res=>(
                      <div key={res.id} style={{background:"#111827",borderRadius:8,padding:"10px 12px"}}>
                        <div style={{fontWeight:700,color:"#f1f5f9",fontSize:13}}>{res.guest}</div>
                        <div style={{fontSize:11,color:"#64748b",margin:"3px 0 8px"}}>Hab {res.roomId} · {res.pax} pax · hasta {fmtDate(res.checkOut)}</div>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>doCheckIn(res)} style={{flex:1,padding:"7px",background:"#166534",border:"none",borderRadius:6,color:"#bbf7d0",fontSize:11,fontWeight:700}}>✓ Check-in</button>
                          <button onClick={()=>setSelRes(res)} style={{padding:"7px 10px",background:"#1e2a3a",border:"none",borderRadius:6,color:"#93c5fd",fontSize:11}}>Ver</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DEPARTURES */}
                <div style={{background:"#0b0f1a",border:"1px solid #141824",borderRadius:12,overflow:"hidden"}}>
                  <div style={{padding:"14px 16px",borderBottom:"1px solid #141824",display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:"#f87171"}}/>
                    <span style={{fontSize:12,fontWeight:700,color:"#f87171",textTransform:"uppercase",letterSpacing:1}}>Salidas ({departures.length})</span>
                  </div>
                  <div style={{padding:12,display:"flex",flexDirection:"column",gap:8}}>
                    {departures.length===0 && <div style={{fontSize:12,color:"#2d4a6b",padding:"8px 0",textAlign:"center"}}>Sin salidas pendientes</div>}
                    {departures.map(res=>{
                      const t=calcBill(res);
                      return(
                        <div key={res.id} style={{background:"#111827",borderRadius:8,padding:"10px 12px"}}>
                          <div style={{fontWeight:700,color:"#f1f5f9",fontSize:13}}>{res.guest}</div>
                          <div style={{fontSize:11,color:"#64748b",margin:"3px 0 4px"}}>Hab {res.roomId} · {t.nights} noches</div>
                          <div style={{fontSize:15,fontWeight:800,color:"#f1f5f9",marginBottom:8}}>USD {t.total}</div>
                          <div style={{display:"flex",gap:6}}>
                            <button onClick={()=>doCheckOut(res)} style={{flex:1,padding:"7px",background:"#7f1d1d",border:"none",borderRadius:6,color:"#fecaca",fontSize:11,fontWeight:700}}>↗ Check-out</button>
                            <button onClick={()=>setShowInvoice(res)} style={{padding:"7px 10px",background:"#1e2a3a",border:"none",borderRadius:6,color:"#93c5fd",fontSize:11}}>🧾</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* IN-HOUSE */}
                <div style={{background:"#0b0f1a",border:"1px solid #141824",borderRadius:12,overflow:"hidden"}}>
                  <div style={{padding:"14px 16px",borderBottom:"1px solid #141824",display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:"#60a5fa"}}/>
                    <span style={{fontSize:12,fontWeight:700,color:"#60a5fa",textTransform:"uppercase",letterSpacing:1}}>In-House ({inhouse.length})</span>
                  </div>
                  <div style={{padding:12,display:"flex",flexDirection:"column",gap:6}}>
                    {inhouse.map(res=>(
                      <div key={res.id} onClick={()=>setSelRes(res)} style={{background:"#111827",borderRadius:8,padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                        <div style={{fontSize:18,fontWeight:900,color:"#3b82f6",minWidth:36}}>{res.roomId}</div>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{res.guest.split(",")[0]}</div>
                          <div style={{fontSize:10,color:"#4a6282"}}>Sale {fmtDate(res.checkOut)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* QUICK SEARCH */}
              <div style={{background:"#0b0f1a",border:"1px solid #141824",borderRadius:12,padding:20}}>
                <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:14,textTransform:"uppercase",letterSpacing:1}}>Habitaciones — Estado actual</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8}}>
                  {ROOMS.map(room=>{
                    const res = getRoomRes(room.id,TODAY);
                    const hkS = hk[room.id]||"clean";
                    const statusC = res ? (res.status==="checkin"?"#1e40af":"#1a3d1a") : "#0b1a0b";
                    const textC = res ? (res.status==="checkin"?"#93c5fd":"#86efac") : "#4ade80";
                    return(
                      <div key={room.id} onClick={()=>res&&setSelRes(res)} style={{
                        background:statusC,border:`1px solid ${textC}30`,borderRadius:8,padding:"10px 12px",cursor:res?"pointer":"default"
                      }}>
                        <div style={{fontSize:20,fontWeight:900,color:textC}}>{room.id}</div>
                        <div style={{fontSize:10,color:textC+"aa",marginBottom:4}}>{room.type}</div>
                        <div style={{fontSize:10,color:hkColor[hkS],fontWeight:600}}>{hkLabel[hkS]}</div>
                        {res && <div style={{fontSize:10,color:textC,marginTop:3,fontWeight:600}}>{res.guest.split(",")[0]}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ════ RESERVATIONS LIST ════ */}
          {mod==="res" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <h2 style={{fontSize:18,fontWeight:800,color:"#f8fafc"}}>Reservas</h2>
                <div style={{fontSize:12,color:"#4a6282"}}>{reservations.filter(r=>r.status!=="cancelled").length} reservas activas</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {reservations.sort((a,b)=>a.checkIn.localeCompare(b.checkIn)).map(res=>{
                  const t=calcBill(res);
                  const room=ROOMS.find(r=>r.id===res.roomId);
                  return(
                    <div key={res.id} className="res-row" onClick={()=>setSelRes(res)} style={{
                      background:"#0b0f1a",border:"1px solid #141824",borderRadius:10,padding:"12px 16px",
                      cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"all .15s"
                    }}>
                      <div style={{background:"#111827",borderRadius:8,padding:"8px 12px",minWidth:52,textAlign:"center",flexShrink:0}}>
                        <div style={{fontSize:17,fontWeight:900,color:"#60a5fa"}}>{res.roomId}</div>
                        <div style={{fontSize:9,color:"#2d4a6b"}}>{room?.type}</div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,color:"#f1f5f9",fontSize:14}}>{res.guest}</div>
                        <div style={{fontSize:11,color:"#64748b",marginTop:2}}>
                          {fmtDate(res.checkIn)} → {fmtDate(res.checkOut)} · {t.nights} noches · {res.pax} pax · {res.source}
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0}}>
                        <span style={{fontSize:10,fontWeight:700,color:stColor[res.status],background:stColor[res.status]+"22",padding:"3px 8px",borderRadius:4,letterSpacing:0.5}}>
                          {stLabel[res.status]}
                        </span>
                        <span style={{fontSize:14,fontWeight:800,color:"#f1f5f9"}}>USD {t.total}</span>
                      </div>
                      <div style={{fontSize:11,color:"#2d4a6b",minWidth:40,textAlign:"right"}}>{res.id}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ HOUSEKEEPING ════ */}
          {mod==="hk" && (
            <div>
              <h2 style={{fontSize:18,fontWeight:800,color:"#f8fafc",marginBottom:6}}>Housekeeping</h2>
              <div style={{display:"flex",gap:16,marginBottom:20,flexWrap:"wrap"}}>
                {Object.entries({clean:"Limpias",dirty:"Sucias",occupied:"Ocupadas",inspecting:"Inspeccionando"}).map(([k,l])=>(
                  <div key={k} style={{background:"#0b0f1a",border:`1px solid ${hkColor[k]}30`,borderRadius:8,padding:"8px 16px",display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:hkColor[k]}}/>
                    <span style={{fontSize:12,color:hkColor[k],fontWeight:600}}>{l}</span>
                    <span style={{fontSize:16,fontWeight:800,color:"#f1f5f9",marginLeft:4}}>
                      {Object.values(hk).filter(v=>v===k).length}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
                {ROOMS.map(room=>{
                  const s=hk[room.id]||"clean";
                  return(
                    <div key={room.id} className="room-card" style={{
                      background:"#0b0f1a",border:`1px solid ${hkColor[s]}30`,borderRadius:10,padding:14,transition:"border-color .15s"
                    }}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                        <div style={{fontSize:22,fontWeight:900,color:"#f1f5f9"}}>{room.id}</div>
                        <div style={{width:9,height:9,borderRadius:"50%",background:hkColor[s],marginTop:4,boxShadow:`0 0 6px ${hkColor[s]}`}}/>
                      </div>
                      <div style={{fontSize:11,color:"#4a6282",marginBottom:4}}>{room.type} · Piso {room.floor}</div>
                      <div style={{fontSize:11,fontWeight:700,color:hkColor[s],marginBottom:10}}>{hkLabel[s]}</div>
                      <select value={s} onChange={e=>setHk(p=>({...p,[room.id]:e.target.value}))} style={{
                        width:"100%",background:"#111827",border:"1px solid #1e2a3a",borderRadius:6,
                        color:"#e2e8f0",padding:"5px 8px",fontSize:11
                      }}>
                        <option value="clean">✓ Limpia</option>
                        <option value="dirty">Sucia</option>
                        <option value="inspecting">Inspeccionando</option>
                        <option value="occupied">Ocupada</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ BILLING ════ */}
          {mod==="billing" && (
            <div>
              <h2 style={{fontSize:18,fontWeight:800,color:"#f8fafc",marginBottom:20}}>Facturación</h2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
                {[
                  {l:"RevPAR",v:`$${Math.round(reservations.filter(r=>r.status==="checkin").reduce((a,r)=>a+calcBill(r).rate,0)/ROOMS.length)}`,c:"#a78bfa"},
                  {l:"ADR promedio",v:`$${Math.round(reservations.filter(r=>r.status!=="cancelled"&&r.status!=="checkout").reduce((a,r)=>a+calcBill(r).rate,0)/(reservations.filter(r=>r.status!=="cancelled"&&r.status!=="checkout").length||1))}`,c:"#60a5fa"},
                  {l:"Total facturado",v:`$${reservations.filter(r=>r.status!=="cancelled").reduce((a,r)=>a+calcBill(r).total,0).toLocaleString()}`,c:"#4ade80"},
                  {l:"Pendiente cobro",v:`$${reservations.filter(r=>r.status==="checkin").reduce((a,r)=>a+calcBill(r).total,0).toLocaleString()}`,c:"#fbbf24"},
                ].map(s=>(
                  <div key={s.l} style={{background:"#0b0f1a",border:"1px solid #141824",borderRadius:10,padding:18}}>
                    <div style={{fontSize:24,fontWeight:900,color:s.c}}>{s.v}</div>
                    <div style={{fontSize:11,color:"#4a6282",marginTop:4,textTransform:"uppercase",letterSpacing:0.5}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {reservations.filter(r=>r.status!=="cancelled").map(res=>{
                  const t=calcBill(res);
                  return(
                    <div key={res.id} style={{background:"#0b0f1a",border:"1px solid #141824",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:14}}>
                      <div style={{minWidth:52,fontWeight:900,color:"#60a5fa",fontSize:17}}>{res.roomId}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,color:"#e2e8f0",fontSize:13}}>{res.guest}</div>
                        <div style={{fontSize:11,color:"#4a6282"}}>{t.nights} noches × ${t.rate} + extras ${t.extrasTotal} + IVA 22% ${t.tax}</div>
                      </div>
                      <span style={{fontSize:10,fontWeight:700,color:stColor[res.status],background:stColor[res.status]+"22",padding:"3px 8px",borderRadius:4}}>{stLabel[res.status]}</span>
                      <div style={{fontWeight:900,color:"#f1f5f9",fontSize:18,minWidth:80,textAlign:"right"}}>USD {t.total}</div>
                      <button onClick={()=>setShowInvoice(res)} style={{padding:"7px 14px",background:"#1e2a3a",border:"none",borderRadius:7,color:"#93c5fd",fontSize:12,fontWeight:600}}>🧾 Factura</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ REPORTS ════ */}
          {mod==="reports" && (
            <div>
              <h2 style={{fontSize:18,fontWeight:800,color:"#f8fafc",marginBottom:20}}>Reportes</h2>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {/* Occupancy by type */}
                <div style={{background:"#0b0f1a",border:"1px solid #141824",borderRadius:12,padding:20}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:16,textTransform:"uppercase",letterSpacing:1}}>Ocupación por tipo</div>
                  {["Standard","Doble","Superior","Suite Junior","Suite"].map(type=>{
                    const total=ROOMS.filter(r=>r.type===type).length;
                    const occ=reservations.filter(r=>r.status==="checkin"&&ROOMS.find(rm=>rm.id===r.roomId)?.type===type).length;
                    const pct=total?Math.round(occ/total*100):0;
                    return(
                      <div key={type} style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                          <span style={{color:"#94a3b8"}}>{type}</span>
                          <span style={{color:"#f1f5f9",fontWeight:700}}>{occ}/{total} · {pct}%</span>
                        </div>
                        <div style={{height:6,background:"#111827",borderRadius:3,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#1d4ed8,#7c3aed)",borderRadius:3,transition:"width .4s"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Source breakdown */}
                <div style={{background:"#0b0f1a",border:"1px solid #141824",borderRadius:12,padding:20}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:16,textTransform:"uppercase",letterSpacing:1}}>Canal de origen</div>
                  {["Directo","OTA","Expedia","Booking.com"].map(src=>{
                    const cnt=reservations.filter(r=>r.source===src&&r.status!=="cancelled").length;
                    const rev=reservations.filter(r=>r.source===src&&r.status!=="cancelled").reduce((a,r)=>a+calcBill(r).total,0);
                    return(
                      <div key={src} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #0e1420"}}>
                        <span style={{fontSize:13,color:"#94a3b8"}}>{src}</span>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#f1f5f9"}}>${rev.toLocaleString()}</div>
                          <div style={{fontSize:10,color:"#4a6282"}}>{cnt} reservas</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── NOTIFICATION ── */}
      {notif && (
        <div style={{
          position:"fixed",top:20,right:260,background:notif.type==="err"?"#450a0a":"#052e16",
          border:`1px solid ${notif.type==="err"?"#ef4444":"#22c55e"}`,
          color:"#fff",padding:"11px 20px",borderRadius:10,fontSize:13,fontWeight:600,
          zIndex:9998,boxShadow:"0 8px 32px rgba(0,0,0,.6)",maxWidth:360
        }}>
          {notif.type==="err"?"⚠ ":"✓ "}{notif.msg}
        </div>
      )}

      {/* ── MODAL: RESERVATION DETAIL ── */}
      {selRes && (
        <Modal onClose={()=>setSelRes(null)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
            <div>
              <div style={{fontSize:11,color:"#3b82f6",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Reserva {selRes.id}</div>
              <div style={{fontSize:22,fontWeight:900,color:"#f1f5f9",marginTop:4}}>{selRes.guest}</div>
              <div style={{fontSize:13,color:"#64748b"}}>Hab. {selRes.roomId} · {ROOMS.find(r=>r.id===selRes.roomId)?.type} · {selRes.source}</div>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:stColor[selRes.status],background:stColor[selRes.status]+"22",padding:"4px 10px",borderRadius:5,letterSpacing:0.5,marginTop:4}}>
              {stLabel[selRes.status]}
            </span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            {[["Doc.",selRes.doc||"—"],["Nac.",selRes.nationality],["Pax",selRes.pax],
              ["Check-in",fmtDate(selRes.checkIn)],["Check-out",fmtDate(selRes.checkOut)],["Noches",calcBill(selRes).nights]
            ].map(([k,v])=>(
              <div key={k} style={{background:"#060810",borderRadius:7,padding:"9px 12px"}}>
                <div style={{fontSize:9,color:"#3b5478",textTransform:"uppercase",letterSpacing:1}}>{k}</div>
                <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginTop:2}}>{v}</div>
              </div>
            ))}
          </div>
          {selRes.notes && <div style={{background:"#0d1a2d",border:"1px solid #1e3a5f",borderRadius:7,padding:"8px 12px",fontSize:12,color:"#93c5fd",marginBottom:14}}>📝 {selRes.notes}</div>}

          {/* Extras */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:"#3b5478",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Cargos Extra</div>
            {selRes.extras.length===0 && <div style={{fontSize:12,color:"#2d4a6b",padding:"6px 0"}}>Sin cargos adicionales</div>}
            {selRes.extras.map((e,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#e2e8f0",padding:"6px 0",borderBottom:"1px solid #0e1420"}}>
                <span>{e.desc}</span><span style={{fontWeight:700}}>${e.amount}</span>
              </div>
            ))}
            {selRes.status==="checkin" && (
              <div style={{display:"flex",gap:7,marginTop:10}}>
                <input value={extraDesc} onChange={e=>setExtraDesc(e.target.value)} placeholder="Descripción del cargo" style={{flex:2,background:"#060810",border:"1px solid #1e2a3a",borderRadius:6,color:"#e2e8f0",padding:"7px 10px",fontSize:12}}/>
                <input value={extraAmt} onChange={e=>setExtraAmt(e.target.value)} placeholder="USD" type="number" style={{flex:1,background:"#060810",border:"1px solid #1e2a3a",borderRadius:6,color:"#e2e8f0",padding:"7px 10px",fontSize:12}}/>
                <button onClick={()=>doAddExtra(selRes)} style={{padding:"7px 14px",background:"#1d4ed8",border:"none",borderRadius:6,color:"#fff",fontSize:12,fontWeight:700}}>+</button>
              </div>
            )}
          </div>

          {/* Total preview */}
          <div style={{background:"#060810",borderRadius:8,padding:"12px 14px",marginBottom:16}}>
            {(()=>{const t=calcBill(selRes); return(
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:12,color:"#64748b"}}>{t.nights}n × ${t.rate} + extras ${t.extrasTotal} + IVA ${t.tax}</div>
                <div style={{fontSize:20,fontWeight:900,color:"#f1f5f9"}}>USD {t.total}</div>
              </div>
            );})()}
          </div>

          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {selRes.status==="reserved" && selRes.checkIn===TODAY && (
              <button onClick={()=>doCheckIn(selRes)} style={{padding:"9px 18px",background:"#166534",border:"none",borderRadius:8,color:"#bbf7d0",fontSize:13,fontWeight:700}}>✓ Check-in</button>
            )}
            {selRes.status==="checkin" && (
              <button onClick={()=>doCheckOut(selRes)} style={{padding:"9px 18px",background:"#7f1d1d",border:"none",borderRadius:8,color:"#fecaca",fontSize:13,fontWeight:700}}>↗ Check-out</button>
            )}
            <button onClick={()=>{setShowInvoice(selRes);setSelRes(null);}} style={{padding:"9px 18px",background:"#1e2a3a",border:"none",borderRadius:8,color:"#93c5fd",fontSize:13,fontWeight:600}}>🧾 Ver Factura</button>
            {selRes.status==="reserved" && (
              <button onClick={()=>{updateReservation(selRes.id,{status:"cancelled"});setSelRes(null);toast("Reserva cancelada");}} style={{padding:"9px 18px",background:"#3b0a0a",border:"none",borderRadius:8,color:"#fca5a5",fontSize:13,fontWeight:600}}>✕ Cancelar</button>
            )}
          </div>
        </Modal>
      )}

      {/* ── MODAL: NEW RESERVATION ── */}
      {showNew && (
        <Modal onClose={()=>setShowNew(false)} title="Nueva Reserva">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <Field label="Apellido, Nombre" colSpan={2}>
              <input value={newRes.guest} onChange={e=>setNewRes(p=>({...p,guest:e.target.value}))} placeholder="García, Martín" style={IS}/>
            </Field>
            <Field label="Documento">
              <input value={newRes.doc} onChange={e=>setNewRes(p=>({...p,doc:e.target.value}))} placeholder="3.456.789-1" style={IS}/>
            </Field>
            <Field label="Nacionalidad">
              <select value={newRes.nationality} onChange={e=>setNewRes(p=>({...p,nationality:e.target.value}))} style={IS}>
                {["Uruguay","Argentina","Brasil","Chile","Paraguay","Bolivia","Colombia","España","Otro"].map(n=><option key={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Check-in">
              <input type="date" value={newRes.checkIn} onChange={e=>setNewRes(p=>({...p,checkIn:e.target.value}))} style={IS}/>
            </Field>
            <Field label="Check-out">
              <input type="date" value={newRes.checkOut} onChange={e=>setNewRes(p=>({...p,checkOut:e.target.value}))} style={IS}/>
            </Field>
            <Field label="Habitación" colSpan={2}>
              <select value={newRes.roomId} onChange={e=>setNewRes(p=>({...p,roomId:e.target.value}))} style={IS}>
                <option value="">— Seleccionar —</option>
                {ROOMS.map(r=>{
                  const avail = !newRes.checkIn||!newRes.checkOut||isAvailable(r.id,newRes.checkIn,newRes.checkOut);
                  return <option key={r.id} value={r.id} disabled={!avail}>{r.id} · {r.type} · ${r.rate}/noche · {r.beds}{!avail?" (Ocupada)":""}</option>;
                })}
              </select>
            </Field>
            <Field label="Personas (PAX)">
              <input type="number" min={1} max={6} value={newRes.pax} onChange={e=>setNewRes(p=>({...p,pax:parseInt(e.target.value)}))} style={IS}/>
            </Field>
            <Field label="Canal">
              <select value={newRes.source} onChange={e=>setNewRes(p=>({...p,source:e.target.value}))} style={IS}>
                {["Directo","Teléfono","Email","Walk-in","Agencia"].map(s=><option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Notas" colSpan={2}>
              <input value={newRes.notes} onChange={e=>setNewRes(p=>({...p,notes:e.target.value}))} placeholder="Solicitudes especiales..." style={IS}/>
            </Field>
          </div>
          {newRes.roomId&&newRes.checkIn&&newRes.checkOut&&(()=>{const r=ROOMS.find(rm=>rm.id===newRes.roomId);const n=daysBetween(newRes.checkIn,newRes.checkOut);const tot=n*(r?.rate||0);return(
            <div style={{background:"#0d1a2d",border:"1px solid #1e3a5f",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#93c5fd"}}>
              {n} noches × ${r?.rate} = <strong style={{color:"#fff"}}>USD {tot}</strong> (+ IVA 22% = USD {Math.round(tot*1.22*100)/100})
            </div>
          );})()}
          <button onClick={doNewRes} style={{width:"100%",padding:"11px",background:"linear-gradient(135deg,#1d4ed8,#4338ca)",border:"none",borderRadius:9,color:"#fff",fontSize:14,fontWeight:800,letterSpacing:"-0.3px"}}>
            Confirmar Reserva
          </button>
        </Modal>
      )}

      {/* ── MODAL: INVOICE ── */}
      {showInvoice && <InvoiceModal res={showInvoice} onClose={()=>setShowInvoice(null)}/>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*                                  OTA                                       */
/* ══════════════════════════════════════════════════════════════════════════ */
function OTA({ reservations, addReservation, isAvailable }) {
  const [page, setPage] = useState("home"); // home | search | room | confirm | success
  const [search, setSearch] = useState({checkIn:"",checkOut:"",adults:2,children:0});
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [guest, setGuest] = useState({name:"",surname:"",email:"",phone:"",doc:"",nationality:"Uruguay",requests:""});
  const [notif, setNotif] = useState(null);
  const [confirmCode, setConfirmCode] = useState("");

  const toast = (msg,type="ok") => { setNotif({msg,type}); setTimeout(()=>setNotif(null),3200); };

  // Always computed live from shared reservations state — bidirectional sync
  const liveResults = page==="search" && search.checkIn && search.checkOut
    ? ROOMS.filter(r=>isAvailable(r.id,search.checkIn,search.checkOut)&&r.cap>=(parseInt(search.adults)+parseInt(search.children)))
    : results;

  const doSearch = () => {
    if(!search.checkIn||!search.checkOut){ toast("Ingresá las fechas","err"); return; }
    if(search.checkIn>=search.checkOut){ toast("La salida debe ser posterior al ingreso","err"); return; }
    setResults(ROOMS.filter(r=>isAvailable(r.id,search.checkIn,search.checkOut)&&r.cap>=(parseInt(search.adults)+parseInt(search.children))));
    setPage("search");
  };

  const doBook = () => {
    if(!guest.name||!guest.surname||!guest.email||!guest.doc){ toast("Completá tus datos","err"); return; }
    const nights = daysBetween(search.checkIn,search.checkOut);
    const code = "OTA-"+Math.random().toString(36).slice(2,8).toUpperCase();
    const res = {
      id:"R"+String(reservations.length+1).padStart(3,"0"),
      roomId:selected.id,
      guest:`${guest.surname}, ${guest.name}`,
      doc:guest.doc, nationality:guest.nationality,
      checkIn:search.checkIn, checkOut:search.checkOut,
      pax:parseInt(search.adults)+parseInt(search.children),
      status:"reserved", extras:[], source:"OTA",
      notes:guest.requests
    };
    addReservation(res);
    setConfirmCode(code);
    setPage("success");
  };

  const nights = search.checkIn&&search.checkOut ? daysBetween(search.checkIn,search.checkOut) : 0;

  const roomImages = {
    "Standard":"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
    "Doble":"https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80",
    "Superior":"https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80",
    "Suite Junior":"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80",
    "Suite":"https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80",
  };

  return (
    <div style={{minHeight:"100vh",background:"#fafafa",fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <style>{`
        .ota-btn-primary{background:#0071c2;color:#fff;border:none;border-radius:4px;padding:10px 20px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .15s}
        .ota-btn-primary:hover{background:#005ea2}
        .ota-input{border:1px solid #bbb;border-radius:4px;padding:9px 12px;font-size:14px;font-family:inherit;background:#fff;color:#222;width:100%;box-sizing:border-box}
        .ota-input:focus{border-color:#0071c2;box-shadow:0 0 0 2px rgba(0,113,194,0.15)}
        .ota-room-card:hover{box-shadow:0 2px 16px rgba(0,0,0,.15)!important}
      `}</style>

      {/* HEADER */}
      <div style={{background:"#003580",boxShadow:"0 2px 8px rgba(0,0,0,.3)"}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
          <div onClick={()=>setPage("home")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:"-0.5px"}}>Salto<span style={{color:"#febb02"}}>Hotels</span></div>
            <div style={{fontSize:10,color:"#7fa8d0",marginLeft:4}}>Uruguay</div>
          </div>
          <div style={{display:"flex",gap:20,alignItems:"center"}}>
            {["Alojamiento","Vuelos","Autos","Atracciones"].map(l=>(
              <span key={l} style={{color:"#c8dff0",fontSize:13,cursor:"pointer"}}>{l}</span>
            ))}
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button style={{background:"transparent",border:"1px solid #fff",borderRadius:4,color:"#fff",padding:"5px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Iniciar sesión</button>
            <button className="ota-btn-primary" style={{fontSize:12,padding:"6px 14px"}}>Registrarse</button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 20px 20px"}}>
          <div style={{background:"#fff",borderRadius:8,padding:16,boxShadow:"0 4px 16px rgba(0,0,0,.2)",display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:160}}>
              <label style={{fontSize:11,fontWeight:700,color:"#333",display:"block",marginBottom:5}}>Destino</label>
              <div style={{border:"1px solid #bbb",borderRadius:4,padding:"9px 12px",fontSize:14,color:"#333",background:"#f5f5f5"}}>
                📍 Salto, Uruguay
              </div>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#333",display:"block",marginBottom:5}}>Check-in</label>
              <input type="date" className="ota-input" value={search.checkIn} onChange={e=>setSearch(p=>({...p,checkIn:e.target.value}))} style={{width:145}}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#333",display:"block",marginBottom:5}}>Check-out</label>
              <input type="date" className="ota-input" value={search.checkOut} onChange={e=>setSearch(p=>({...p,checkOut:e.target.value}))} style={{width:145}}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#333",display:"block",marginBottom:5}}>Adultos</label>
              <select className="ota-input" value={search.adults} onChange={e=>setSearch(p=>({...p,adults:e.target.value}))} style={{width:80}}>
                {[1,2,3,4].map(n=><option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#333",display:"block",marginBottom:5}}>Niños</label>
              <select className="ota-input" value={search.children} onChange={e=>setSearch(p=>({...p,children:e.target.value}))} style={{width:80}}>
                {[0,1,2,3].map(n=><option key={n}>{n}</option>)}
              </select>
            </div>
            <button className="ota-btn-primary" onClick={doSearch} style={{padding:"10px 28px",fontSize:15,height:40}}>Buscar</button>
          </div>
        </div>
      </div>

      {/* ── HOME PAGE ── */}
      {page==="home" && (
        <div style={{maxWidth:1100,margin:"30px auto",padding:"0 20px"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <h1 style={{fontSize:28,fontWeight:900,color:"#1a1a2e",marginBottom:8}}>Hotel Obelisco — Uruguay</h1>
            <p style={{color:"#555",fontSize:15,maxWidth:600,margin:"0 auto"}}>
              En el corazón de Salto, con piscina, spa y gastronomía regional. El hotel de referencia de la ciudad.
            </p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16}}>
            {Object.entries(roomImages).map(([type,img])=>{
              const room=ROOMS.find(r=>r.type===type);
              return(
                <div key={type} className="ota-room-card" style={{borderRadius:8,overflow:"hidden",background:"#fff",boxShadow:"0 1px 6px rgba(0,0,0,.1)",transition:"box-shadow .2s",cursor:"pointer"}} onClick={()=>{setSelected(room);setPage("room");}}>
                  <img src={img} alt={type} style={{width:"100%",height:140,objectFit:"cover"}}/>
                  <div style={{padding:"12px 14px"}}>
                    <div style={{fontWeight:700,color:"#1a1a2e",fontSize:14}}>{type}</div>
                    <div style={{fontSize:12,color:"#777",margin:"4px 0 8px"}}>{room?.beds}</div>
                    <div style={{fontSize:13,color:"#0071c2",fontWeight:700}}>Desde USD {room?.rate} / noche</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginTop:32}}>
            {[["🌡️","Termas","Acceso incluido"],["🍽️","Restaurante","Cocina regional"],["🏊","Piscina","Exterior e interior"],["📶","Wi-Fi","Gratuito en todo el hotel"]].map(([ic,t,d])=>(
              <div key={t} style={{background:"#fff",borderRadius:8,padding:"16px",textAlign:"center",boxShadow:"0 1px 4px rgba(0,0,0,.08)"}}>
                <div style={{fontSize:24,marginBottom:8}}>{ic}</div>
                <div style={{fontWeight:700,color:"#1a1a2e",fontSize:13}}>{t}</div>
                <div style={{fontSize:12,color:"#777",marginTop:3}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SEARCH RESULTS ── */}
      {page==="search" && (
        <div style={{maxWidth:1100,margin:"24px auto",padding:"0 20px"}}>
          {/* CHANNEL MANAGER BANNER */}
          <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"10px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",flexShrink:0,boxShadow:"0 0 0 3px #bbf7d0"}}/>
            <div style={{fontSize:12,color:"#166534"}}>
              <strong>Channel Manager activo</strong> — Disponibilidad sincronizada en tiempo real con el PMS. Las reservas directas en recepción se bloquean automáticamente en este canal y viceversa.
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,color:"#555"}}>
              {liveResults.length} habitaciones disponibles · {fmtFull(search.checkIn)} → {fmtFull(search.checkOut)} · {nights} noches · {search.adults} adultos
            </div>
          </div>
          {liveResults.length===0 && (
            <div style={{background:"#fff",borderRadius:8,padding:40,textAlign:"center",boxShadow:"0 1px 4px rgba(0,0,0,.08)"}}>
              <div style={{fontSize:40,marginBottom:12}}>😔</div>
              <div style={{fontWeight:700,color:"#1a1a2e",fontSize:16,marginBottom:6}}>Sin disponibilidad</div>
              <div style={{color:"#777",fontSize:14}}>No hay habitaciones disponibles para esas fechas. Probá con otras fechas.</div>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {liveResults.map(room=>(
              <div key={room.id} className="ota-room-card" style={{background:"#fff",borderRadius:8,boxShadow:"0 1px 6px rgba(0,0,0,.1)",overflow:"hidden",display:"flex",transition:"box-shadow .2s"}}>
                <img src={roomImages[room.type]} alt={room.type} style={{width:200,objectFit:"cover",flexShrink:0}}/>
                <div style={{flex:1,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:17,fontWeight:800,color:"#1a1a2e",marginBottom:4}}>{room.type} — Hab. {room.id}</div>
                    <div style={{fontSize:13,color:"#555",marginBottom:8}}>{room.beds} · Piso {room.floor} · Hasta {room.cap} personas</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                      {["Wi-Fi gratis","Desayuno opcional","Cancela gratis hasta 48h","Sin cargo por reserva"].map(f=>(
                        <span key={f} style={{fontSize:11,background:"#e8f4e8",color:"#1a6b1a",padding:"3px 8px",borderRadius:4,fontWeight:600}}>✓ {f}</span>
                      ))}
                    </div>
                    <div style={{fontSize:11,color:"#0071c2",background:"#e8f4ff",padding:"4px 10px",borderRadius:4,display:"inline-block"}}>
                      🏆 Puntuación 9.2 · Excelente
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,paddingLeft:20}}>
                    <div style={{fontSize:11,color:"#555",marginBottom:4}}>{nights} noches, {search.adults} adultos</div>
                    <div style={{fontSize:26,fontWeight:900,color:"#1a1a2e"}}>USD {room.rate*nights}</div>
                    <div style={{fontSize:11,color:"#777",marginBottom:12}}>USD {room.rate} por noche · Incluye impuestos</div>
                    <button className="ota-btn-primary" onClick={()=>{setSelected(room);setPage("room");}}>
                      Ver disponibilidad
                    </button>
                    <div style={{fontSize:11,color:"#c0392b",marginTop:6,fontWeight:600}}>⏰ ¡Solo quedan 2 habitaciones!</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ROOM DETAIL / BOOKING FORM ── */}
      {(page==="room"||page==="confirm") && selected && (
        <div style={{maxWidth:1100,margin:"24px auto",padding:"0 20px",display:"grid",gridTemplateColumns:"1fr 360px",gap:20,alignItems:"start"}}>
          <div>
            <button onClick={()=>setPage(page==="confirm"?"room":"search")} style={{background:"none",border:"none",color:"#0071c2",cursor:"pointer",fontSize:13,padding:"0 0 14px",fontFamily:"inherit"}}>
              ← Volver
            </button>
            <img src={roomImages[selected.type]} alt={selected.type} style={{width:"100%",height:240,objectFit:"cover",borderRadius:8,marginBottom:16}}/>
            <div style={{background:"#fff",borderRadius:8,padding:20,boxShadow:"0 1px 4px rgba(0,0,0,.08)",marginBottom:16}}>
              <h2 style={{fontSize:20,fontWeight:800,color:"#1a1a2e",marginBottom:4}}>{selected.type} — Habitación {selected.id}</h2>
              <div style={{fontSize:13,color:"#555",marginBottom:12}}>{selected.beds} · Piso {selected.floor}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {["Aire acondicionado","TV smart 50\"","Baño privado","Minibar","Caja fuerte","Teléfono directo","Room service 24h","Vista al río"].map(a=>(
                  <div key={a} style={{fontSize:12,color:"#333",display:"flex",alignItems:"center",gap:6}}>
                    <span style={{color:"#0071c2"}}>✓</span>{a}
                  </div>
                ))}
              </div>
            </div>

            {/* GUEST FORM */}
            <div style={{background:"#fff",borderRadius:8,padding:20,boxShadow:"0 1px 4px rgba(0,0,0,.08)"}}>
              <h3 style={{fontSize:16,fontWeight:800,color:"#1a1a2e",marginBottom:16}}>Tus datos</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div><label style={{fontSize:12,fontWeight:600,color:"#333",display:"block",marginBottom:5}}>Nombre *</label><input className="ota-input" value={guest.name} onChange={e=>setGuest(p=>({...p,name:e.target.value}))} placeholder="Nombre"/></div>
                <div><label style={{fontSize:12,fontWeight:600,color:"#333",display:"block",marginBottom:5}}>Apellido *</label><input className="ota-input" value={guest.surname} onChange={e=>setGuest(p=>({...p,surname:e.target.value}))} placeholder="Apellido"/></div>
                <div><label style={{fontSize:12,fontWeight:600,color:"#333",display:"block",marginBottom:5}}>Email *</label><input className="ota-input" type="email" value={guest.email} onChange={e=>setGuest(p=>({...p,email:e.target.value}))} placeholder="tu@email.com"/></div>
                <div><label style={{fontSize:12,fontWeight:600,color:"#333",display:"block",marginBottom:5}}>Teléfono</label><input className="ota-input" value={guest.phone} onChange={e=>setGuest(p=>({...p,phone:e.target.value}))} placeholder="+598 9X XXX XXX"/></div>
                <div><label style={{fontSize:12,fontWeight:600,color:"#333",display:"block",marginBottom:5}}>Documento *</label><input className="ota-input" value={guest.doc} onChange={e=>setGuest(p=>({...p,doc:e.target.value}))} placeholder="CI / Pasaporte"/></div>
                <div><label style={{fontSize:12,fontWeight:600,color:"#333",display:"block",marginBottom:5}}>Nacionalidad</label>
                  <select className="ota-input" value={guest.nationality} onChange={e=>setGuest(p=>({...p,nationality:e.target.value}))}>
                    {["Uruguay","Argentina","Brasil","Chile","Paraguay","Bolivia","Colombia","España","Otro"].map(n=><option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div style={{marginBottom:16}}>
                <label style={{fontSize:12,fontWeight:600,color:"#333",display:"block",marginBottom:5}}>Solicitudes especiales</label>
                <textarea className="ota-input" value={guest.requests} onChange={e=>setGuest(p=>({...p,requests:e.target.value}))} placeholder="Cuna, piso alto, llegada tardía..." rows={2} style={{resize:"vertical"}}/>
              </div>
              <div style={{background:"#f0f7ff",border:"1px solid #b8d9f5",borderRadius:6,padding:"10px 14px",fontSize:12,color:"#004a8f",marginBottom:16}}>
                🔒 Tus datos están protegidos. Esta reserva se confirma sin cargo hasta 48h antes del check-in.
              </div>
              <button className="ota-btn-primary" onClick={doBook} style={{width:"100%",padding:12,fontSize:15,borderRadius:6}}>
                Confirmar reserva
              </button>
            </div>
          </div>

          {/* PRICE SUMMARY */}
          <div style={{position:"sticky",top:20}}>
            <div style={{background:"#fff",borderRadius:8,padding:20,boxShadow:"0 2px 12px rgba(0,0,0,.12)",border:"1px solid #e0e0e0"}}>
              <div style={{fontSize:15,fontWeight:800,color:"#1a1a2e",marginBottom:4}}>{selected.type}</div>
              <div style={{fontSize:12,color:"#777",marginBottom:16}}>{fmtFull(search.checkIn)} → {fmtFull(search.checkOut)}</div>
              <div style={{borderTop:"1px solid #eee",paddingTop:14}}>
                {[
                  [`USD ${selected.rate} × ${nights} noches`, selected.rate*nights],
                  ["IVA 22%", Math.round(selected.rate*nights*0.22*100)/100],
                ].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#333",marginBottom:8}}>
                    <span>{l}</span><span>USD {v}</span>
                  </div>
                ))}
                <div style={{borderTop:"2px solid #1a1a2e",marginTop:10,paddingTop:10,display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontWeight:800,fontSize:15,color:"#1a1a2e"}}>Total</span>
                  <span style={{fontWeight:900,fontSize:20,color:"#1a1a2e"}}>USD {Math.round(selected.rate*nights*1.22*100)/100}</span>
                </div>
              </div>
              <div style={{marginTop:14,background:"#e8f5e9",borderRadius:6,padding:"8px 12px",fontSize:12,color:"#1b5e20",fontWeight:600}}>
                ✓ Cancelación gratis hasta 48h antes
              </div>
              <div style={{marginTop:8,background:"#fff3e0",borderRadius:6,padding:"8px 12px",fontSize:11,color:"#e65100"}}>
                ⏰ Alta demanda — solo quedan {Math.floor(Math.random()*3)+1} habitaciones
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS PAGE ── */}
      {page==="success" && (
        <div style={{maxWidth:600,margin:"60px auto",padding:"0 20px",textAlign:"center"}}>
          <div style={{background:"#fff",borderRadius:12,padding:40,boxShadow:"0 4px 24px rgba(0,0,0,.1)"}}>
            <div style={{width:64,height:64,background:"#e8f5e9",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:30}}>✓</div>
            <h2 style={{fontSize:24,fontWeight:900,color:"#1a1a2e",marginBottom:8}}>¡Reserva confirmada!</h2>
            <div style={{fontSize:14,color:"#555",marginBottom:24}}>Tu reserva fue sincronizada con el hotel y aparece en el PMS.</div>
            <div style={{background:"#f5f5f5",borderRadius:8,padding:"16px 24px",marginBottom:24}}>
              <div style={{fontSize:11,color:"#777",marginBottom:4}}>Código de confirmación</div>
              <div style={{fontSize:28,fontWeight:900,color:"#003580",letterSpacing:2}}>{confirmCode}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24,textAlign:"left"}}>
              {[
                ["Huésped",`${guest.surname}, ${guest.name}`],
                ["Habitación",`${selected?.id} — ${selected?.type}`],
                ["Check-in",fmtFull(search.checkIn)],
                ["Check-out",fmtFull(search.checkOut)],
                ["Noches",nights],
                ["Total",`USD ${Math.round(selected?.rate*nights*1.22*100)/100}`],
              ].map(([k,v])=>(
                <div key={k} style={{background:"#f9f9f9",borderRadius:6,padding:"8px 12px"}}>
                  <div style={{fontSize:10,color:"#999",textTransform:"uppercase",letterSpacing:1}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:700,color:"#1a1a2e",marginTop:2}}>{v}</div>
                </div>
              ))}
            </div>
            <button className="ota-btn-primary" onClick={()=>setPage("home")} style={{width:"100%",padding:12,fontSize:14}}>
              Volver al inicio
            </button>
            <div style={{marginTop:12,fontSize:12,color:"#888"}}>
              📧 Confirmación enviada a {guest.email}
            </div>
          </div>
        </div>
      )}

      {notif && (
        <div style={{
          position:"fixed",top:20,right:20,background:notif.type==="err"?"#c0392b":"#27ae60",
          color:"#fff",padding:"11px 20px",borderRadius:8,fontSize:13,fontWeight:700,zIndex:9999,boxShadow:"0 4px 16px rgba(0,0,0,.2)"
        }}>
          {notif.type==="err"?"⚠ ":"✓ "}{notif.msg}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*                              SHARED COMPONENTS                              */
/* ══════════════════════════════════════════════════════════════════════════ */
const IS = {background:"#060810",border:"1px solid #1e2a3a",borderRadius:7,color:"#e2e8f0",padding:"8px 12px",fontSize:13,width:"100%",boxSizing:"border-box"};

function Modal({ children, onClose, title }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#0b0f1a",border:"1px solid #1e2a3a",borderRadius:14,padding:26,width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,.7)"}}>
        {title && <div style={{fontSize:16,fontWeight:800,color:"#f1f5f9",marginBottom:20}}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, colSpan }) {
  return (
    <div style={colSpan===2?{gridColumn:"span 2"}:{}}>
      <label style={{fontSize:10,color:"#3b5478",textTransform:"uppercase",letterSpacing:1.2,display:"block",marginBottom:5,fontWeight:700}}>{label}</label>
      {children}
    </div>
  );
}

function InvoiceModal({ res, onClose }) {
  const [step, setStep] = useState("payment"); // "payment" | "receipt"
  const [method, setMethod] = useState(null);
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [bank, setBank] = useState("BROU");
  const [transferRef, setTransferRef] = useState("");
  const [cashGiven, setCashGiven] = useState("");
  const [docType, setDocType] = useState("factura"); // factura | boleta | ticket
  const [paid, setPaid] = useState(false);
  const t = calcBill(res);
  const room = ROOMS.find(r=>r.id===res.roomId);
  const receiptNum = "CPB-" + res.id + "-" + Math.floor(Math.random()*9000+1000);
  const cashChange = cashGiven ? Math.max(0, parseFloat(cashGiven||0) - t.total).toFixed(2) : "0.00";

  const METHODS = [
    { id:"efectivo",   icon:"💵", label:"Efectivo",         sub:"UYU / USD / ARS" },
    { id:"debito",     icon:"💳", label:"Tarjeta Débito",   sub:"Visa / Mastercard" },
    { id:"credito",    icon:"💳", label:"Tarjeta Crédito",  sub:"Visa / Master / Amex" },
    { id:"bancaria",   icon:"🏦", label:"Tarjeta Bancaria", sub:"Tarjeta Uruguay / OCA" },
    { id:"transferencia",icon:"↕",label:"Transferencia",    sub:"BROU / ITAÚ / Santander" },
  ];

  const canConfirm = () => {
    if(!method) return false;
    if(method==="efectivo") return parseFloat(cashGiven||0) >= t.total;
    if(method==="transferencia") return transferRef.length >= 4;
    if(["debito","credito","bancaria"].includes(method)) return cardNum.length>=16 && cardName && cardExp && cardCvv.length>=3;
    return false;
  };

  const methodLabel = METHODS.find(m=>m.id===method)?.label || "";
  const docLabels = { factura:"FACTURA", boleta:"BOLETA DE CONTADO", ticket:"TICKET DE PAGO" };

  if(step==="receipt") return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
      <div style={{background:"#fff",borderRadius:12,width:"100%",maxWidth:460,boxShadow:"0 24px 64px rgba(0,0,0,.6)",color:"#1a202c",fontFamily:"'Outfit',sans-serif",overflow:"hidden"}}>
        {/* PAID BANNER */}
        <div style={{background:"#166534",padding:"14px 20px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#166534",flexShrink:0}}>✓</div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>PAGO REGISTRADO</div>
            <div style={{fontSize:11,color:"#bbf7d0"}}>Transacción procesada correctamente · {TODAY} {new Date().toLocaleTimeString("es-UY",{hour:"2-digit",minute:"2-digit"})}</div>
          </div>
        </div>

        <div style={{padding:"24px 28px"}}>
          {/* HEADER */}
          <div style={{textAlign:"center",borderBottom:"1.5px dashed #e2e8f0",paddingBottom:16,marginBottom:16}}>
            <div style={{fontSize:9,letterSpacing:3,color:"#aaa",textTransform:"uppercase",marginBottom:5}}>República Oriental del Uruguay</div>
            <div style={{fontSize:20,fontWeight:900,color:"#1a202c"}}>HOTEL OBELISCO</div>
            <div style={{fontSize:11,color:"#718096"}}>Costanera 1230 · Salto, Uruguay</div>
            <div style={{fontSize:11,color:"#718096"}}>RUT: 21-XXXXXX-0001 · Tel: +598 4732 0000</div>
            <div style={{display:"inline-block",background:"#1a3a6b",color:"#fff",fontSize:12,fontWeight:800,padding:"5px 18px",borderRadius:4,marginTop:10,letterSpacing:1.5}}>
              {docLabels[docType]}
            </div>
          </div>

          {/* META */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[
              ["N° Comprobante", receiptNum],
              ["Fecha y hora", `${TODAY} ${new Date().toLocaleTimeString("es-UY",{hour:"2-digit",minute:"2-digit"})}`],
              ["Huésped", res.guest],
              ["Documento", res.doc||"—"],
              ["Forma de pago", methodLabel],
              ["Reserva", res.id],
            ].map(([k,v])=>(
              <div key={k} style={{background:"#f8f8f8",borderRadius:6,padding:"7px 10px"}}>
                <div style={{fontSize:9,color:"#aaa",textTransform:"uppercase",letterSpacing:1}}>{k}</div>
                <div style={{fontSize:12,fontWeight:700,color:"#1a202c",marginTop:2}}>{v}</div>
              </div>
            ))}
          </div>

          {/* STAY */}
          <div style={{background:"#f0f4ff",borderRadius:6,padding:"8px 12px",marginBottom:14,fontSize:12,color:"#334"}}>
            Hab. <strong>{res.roomId}</strong> · {room?.type} · {fmtFull(res.checkIn)} → {fmtFull(res.checkOut)} · {t.nights} noches · {res.pax} pax
          </div>

          {/* ITEMS TABLE */}
          <table style={{width:"100%",borderCollapse:"collapse",marginBottom:14,fontSize:12}}>
            <thead>
              <tr style={{background:"#f0f0f0"}}>
                <th style={{textAlign:"left",padding:"7px 10px",fontWeight:700,color:"#555",fontSize:10,textTransform:"uppercase",letterSpacing:.5}}>Concepto</th>
                <th style={{textAlign:"right",padding:"7px 10px",fontWeight:700,color:"#555",fontSize:10,textTransform:"uppercase",letterSpacing:.5}}>Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{borderBottom:"1px solid #eee"}}>
                <td style={{padding:"7px 10px",color:"#333"}}>Estadía: {t.nights} noches × USD {t.rate}</td>
                <td style={{padding:"7px 10px",textAlign:"right",fontWeight:600}}>USD {t.roomTotal}</td>
              </tr>
              {res.extras.map((e,i)=>(
                <tr key={i} style={{borderBottom:"1px solid #eee"}}>
                  <td style={{padding:"7px 10px",color:"#333"}}>{e.desc}</td>
                  <td style={{padding:"7px 10px",textAlign:"right",fontWeight:600}}>USD {e.amount}</td>
                </tr>
              ))}
              <tr style={{borderBottom:"1px solid #ddd"}}>
                <td style={{padding:"7px 10px",color:"#777",fontStyle:"italic"}}>Subtotal</td>
                <td style={{padding:"7px 10px",textAlign:"right",color:"#555"}}>USD {t.subtotal}</td>
              </tr>
              <tr style={{borderBottom:"1px solid #ddd"}}>
                <td style={{padding:"7px 10px",color:"#777",fontStyle:"italic"}}>IVA 22%</td>
                <td style={{padding:"7px 10px",textAlign:"right",color:"#555"}}>USD {t.tax}</td>
              </tr>
              <tr style={{background:"#1a3a6b"}}>
                <td style={{padding:"9px 10px",color:"#fff",fontWeight:800,fontSize:14}}>TOTAL PAGADO</td>
                <td style={{padding:"9px 10px",textAlign:"right",color:"#fff",fontWeight:900,fontSize:16}}>USD {t.total}</td>
              </tr>
            </tbody>
          </table>

          {/* PAYMENT DETAIL */}
          <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:6,padding:"10px 14px",marginBottom:14,fontSize:12}}>
            <div style={{fontWeight:700,color:"#166534",marginBottom:6}}>Detalle del pago</div>
            <div style={{display:"flex",justifyContent:"space-between",color:"#333",marginBottom:3}}>
              <span>Forma de pago</span><span style={{fontWeight:700}}>{methodLabel}</span>
            </div>
            {method==="efectivo" && <>
              <div style={{display:"flex",justifyContent:"space-between",color:"#333",marginBottom:3}}><span>Entregado</span><span style={{fontWeight:700}}>USD {parseFloat(cashGiven).toFixed(2)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",color:"#333"}}><span>Vuelto</span><span style={{fontWeight:700,color:"#166534"}}>USD {cashChange}</span></div>
            </>}
            {["debito","credito","bancaria"].includes(method) && <>
              <div style={{display:"flex",justifyContent:"space-between",color:"#333",marginBottom:3}}><span>Tarjeta</span><span style={{fontWeight:700}}>**** **** **** {cardNum.slice(-4)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",color:"#333"}}><span>Titular</span><span style={{fontWeight:700}}>{cardName}</span></div>
            </>}
            {method==="transferencia" && <>
              <div style={{display:"flex",justifyContent:"space-between",color:"#333",marginBottom:3}}><span>Banco</span><span style={{fontWeight:700}}>{bank}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",color:"#333"}}><span>Referencia</span><span style={{fontWeight:700,fontFamily:"monospace"}}>{transferRef}</span></div>
            </>}
          </div>

          {/* FOOTER */}
          <div style={{textAlign:"center",fontSize:10,color:"#bbb",borderTop:"1px dashed #e2e8f0",paddingTop:12,marginBottom:16,lineHeight:1.6}}>
            Gracias por elegir Hotel Obelisco · Este comprobante es válido como recibo de pago<br/>
            {docType==="factura" ? "Factura electrónica según normativa DGI Uruguay" : docType==="boleta" ? "Boleta de contado — no requiere RUT del comprador" : "Ticket de pago interno — para registros del establecimiento"}
          </div>

          <div style={{display:"flex",gap:8}}>
            <button onClick={onClose} style={{flex:1,padding:"10px",background:"#1a3a6b",border:"none",borderRadius:7,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              ✓ Cerrar
            </button>
            <button onClick={()=>window.print()} style={{padding:"10px 16px",background:"#f0f0f0",border:"1px solid #ddd",borderRadius:7,color:"#333",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              🖨 Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // PAYMENT STEP
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
      <div style={{background:"#0b0f1a",border:"1px solid #1e2a3a",borderRadius:14,width:"100%",maxWidth:520,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,.8)",fontFamily:"'Outfit',sans-serif"}}>

        {/* HEADER */}
        <div style={{padding:"20px 24px",borderBottom:"1px solid #141824",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:11,color:"#3b82f6",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Cobro de estadía</div>
            <div style={{fontSize:20,fontWeight:900,color:"#f1f5f9",marginTop:3}}>{res.guest}</div>
            <div style={{fontSize:12,color:"#64748b"}}>Hab. {res.roomId} · {t.nights} noches · {res.source}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:1}}>Total a cobrar</div>
            <div style={{fontSize:26,fontWeight:900,color:"#f1f5f9"}}>USD {t.total}</div>
            <div style={{fontSize:11,color:"#64748b"}}>incl. IVA 22%</div>
          </div>
        </div>

        <div style={{padding:"20px 24px"}}>

          {/* BREAKDOWN */}
          <div style={{background:"#060810",borderRadius:8,padding:"12px 14px",marginBottom:20}}>
            <div style={{fontSize:11,color:"#3b5478",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Resumen de cuenta</div>
            {[
              [`Estadía ${t.nights}n × $${t.rate}`, t.roomTotal],
              ...res.extras.map(e=>[e.desc, e.amount]),
              ["IVA 22%", t.tax],
            ].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#94a3b8",marginBottom:5}}>
                <span>{l}</span><span>USD {v}</span>
              </div>
            ))}
            <div style={{borderTop:"1px solid #1e2a3a",marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:800,color:"#f1f5f9"}}>
              <span>TOTAL</span><span>USD {t.total}</span>
            </div>
          </div>

          {/* TYPE OF DOC */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,color:"#3b5478",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Tipo de comprobante</div>
            <div style={{display:"flex",gap:8}}>
              {[["factura","🧾","Factura"],["boleta","📄","Boleta"],["ticket","🎫","Ticket"]].map(([id,ic,lbl])=>(
                <button key={id} onClick={()=>setDocType(id)} style={{
                  flex:1,padding:"10px 6px",background:docType===id?"#1e3a5f":"#111827",
                  border:`1px solid ${docType===id?"#3b82f6":"#1e2a3a"}`,borderRadius:8,
                  color:docType===id?"#93c5fd":"#64748b",cursor:"pointer",fontSize:12,fontWeight:docType===id?700:400,
                  fontFamily:"inherit",transition:"all .15s"
                }}>
                  <div style={{fontSize:18,marginBottom:3}}>{ic}</div>{lbl}
                </button>
              ))}
            </div>
            <div style={{fontSize:11,color:"#4a6282",marginTop:6}}>
              {docType==="factura" && "Requiere RUT/CI del cliente · válida ante DGI"}
              {docType==="boleta" && "No requiere datos fiscales del comprador"}
              {docType==="ticket" && "Comprobante interno del hotel"}
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,color:"#3b5478",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Forma de pago</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {METHODS.map(m=>(
                <button key={m.id} onClick={()=>setMethod(m.id)} style={{
                  padding:"11px 14px",background:method===m.id?"#1e3a5f":"#111827",
                  border:`1px solid ${method===m.id?"#3b82f6":"#1e2a3a"}`,borderRadius:9,
                  color:method===m.id?"#93c5fd":"#64748b",cursor:"pointer",textAlign:"left",
                  fontFamily:"inherit",transition:"all .15s",display:"flex",alignItems:"center",gap:10
                }}>
                  <span style={{fontSize:18}}>{m.icon}</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:method===m.id?700:400}}>{m.label}</div>
                    <div style={{fontSize:10,color:"#4a6282"}}>{m.sub}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* EFECTIVO */}
            {method==="efectivo" && (
              <div style={{background:"#060810",borderRadius:8,padding:14}}>
                <div style={{fontSize:11,color:"#64748b",marginBottom:8}}>Monto entregado por el huésped (USD)</div>
                <input type="number" value={cashGiven} onChange={e=>setCashGiven(e.target.value)} placeholder={`Mínimo USD ${t.total}`}
                  style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:7,color:"#f1f5f9",padding:"10px 14px",fontSize:16,fontWeight:700,width:"100%",boxSizing:"border-box",fontFamily:"inherit"}}/>
                {cashGiven && parseFloat(cashGiven)>=t.total && (
                  <div style={{marginTop:10,display:"flex",justifyContent:"space-between",background:"#052e16",border:"1px solid #166534",borderRadius:7,padding:"10px 14px"}}>
                    <span style={{color:"#86efac",fontSize:13}}>Vuelto a entregar</span>
                    <span style={{color:"#4ade80",fontSize:18,fontWeight:900}}>USD {cashChange}</span>
                  </div>
                )}
                {cashGiven && parseFloat(cashGiven)<t.total && (
                  <div style={{marginTop:10,background:"#450a0a",border:"1px solid #ef4444",borderRadius:7,padding:"8px 14px",color:"#fca5a5",fontSize:12}}>
                    ⚠ Monto insuficiente — faltan USD {(t.total-parseFloat(cashGiven)).toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* TARJETAS */}
            {["debito","credito","bancaria"].includes(method) && (
              <div style={{background:"#060810",borderRadius:8,padding:14,display:"flex",flexDirection:"column",gap:10}}>
                <div>
                  <div style={{fontSize:10,color:"#3b5478",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Número de tarjeta</div>
                  <input value={cardNum} onChange={e=>setCardNum(e.target.value.replace(/\D/g,"").slice(0,16))} placeholder="0000 0000 0000 0000" maxLength={16}
                    style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:7,color:"#f1f5f9",padding:"9px 12px",fontSize:14,fontWeight:600,width:"100%",boxSizing:"border-box",fontFamily:"monospace",letterSpacing:2}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:"#3b5478",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Nombre del titular</div>
                  <input value={cardName} onChange={e=>setCardName(e.target.value.toUpperCase())} placeholder="NOMBRE APELLIDO"
                    style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:7,color:"#f1f5f9",padding:"9px 12px",fontSize:13,width:"100%",boxSizing:"border-box",fontFamily:"inherit"}}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <div style={{fontSize:10,color:"#3b5478",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Vencimiento</div>
                    <input value={cardExp} onChange={e=>setCardExp(e.target.value)} placeholder="MM/AA" maxLength={5}
                      style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:7,color:"#f1f5f9",padding:"9px 12px",fontSize:13,width:"100%",boxSizing:"border-box",fontFamily:"monospace"}}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:"#3b5478",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>CVV / CVC</div>
                    <input value={cardCvv} onChange={e=>setCardCvv(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="•••" type="password" maxLength={4}
                      style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:7,color:"#f1f5f9",padding:"9px 12px",fontSize:13,width:"100%",boxSizing:"border-box",fontFamily:"monospace"}}/>
                  </div>
                </div>
                {method==="credito" && (
                  <div style={{background:"#1a2235",borderRadius:6,padding:"8px 12px",fontSize:11,color:"#64748b"}}>
                    💳 Las cuotas aplican según el banco emisor. Consultar con el titular.
                  </div>
                )}
              </div>
            )}

            {/* TRANSFERENCIA */}
            {method==="transferencia" && (
              <div style={{background:"#060810",borderRadius:8,padding:14,display:"flex",flexDirection:"column",gap:10}}>
                <div style={{background:"#0d1a2d",border:"1px solid #1e3a5f",borderRadius:7,padding:"10px 14px",fontSize:12,color:"#93c5fd"}}>
                  <div style={{fontWeight:700,marginBottom:4}}>Datos bancarios del hotel</div>
                  <div>Banco: <strong>BROU</strong> · Cuenta: <strong>001-XXXXXX/12</strong></div>
                  <div>IBAN: <strong>UY21 BROU 0010 0001 XXXX XX</strong></div>
                  <div>Titular: <strong>Hotel Obelisco S.A.</strong> · RUT: 21-XXXXXX-0001</div>
                </div>
                <div>
                  <div style={{fontSize:10,color:"#3b5478",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Banco origen</div>
                  <select value={bank} onChange={e=>setBank(e.target.value)}
                    style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:7,color:"#f1f5f9",padding:"9px 12px",fontSize:13,width:"100%",fontFamily:"inherit"}}>
                    {["BROU","ITAÚ","Santander","BBVA","HSBC","Scotiabank","Otro"].map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:10,color:"#3b5478",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>N° de referencia / comprobante</div>
                  <input value={transferRef} onChange={e=>setTransferRef(e.target.value)} placeholder="Ej: TRF-20260320-XXXXX"
                    style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:7,color:"#f1f5f9",padding:"9px 12px",fontSize:13,width:"100%",boxSizing:"border-box",fontFamily:"monospace"}}/>
                </div>
              </div>
            )}
          </div>

          {/* CONFIRM BUTTON */}
          <button
            disabled={!canConfirm()}
            onClick={()=>{ setPaid(true); setStep("receipt"); }}
            style={{
              width:"100%",padding:"13px",
              background:canConfirm()?"linear-gradient(135deg,#166534,#15803d)":"#1e2a3a",
              border:"none",borderRadius:9,
              color:canConfirm()?"#fff":"#4a6282",
              fontSize:15,fontWeight:800,cursor:canConfirm()?"pointer":"not-allowed",
              fontFamily:"inherit",transition:"all .2s",letterSpacing:"-0.3px"
            }}>
            {canConfirm() ? `✓ Confirmar pago · USD ${t.total}` : "Completá los datos de pago"}
          </button>

          <button onClick={onClose} style={{width:"100%",marginTop:8,padding:"9px",background:"transparent",border:"1px solid #1e2a3a",borderRadius:8,color:"#64748b",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
