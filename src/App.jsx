import { useState, useEffect, useCallback } from "react";

const SUPA_URL = "https://wauilgumyskdsrhvnlwq.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdWlsZ3VteXNrZHNyaHZubHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MDgxOTYsImV4cCI6MjA5ODA4NDE5Nn0.kQkmgh-y6oCC8O5FLu7iiP8nQCs__DTIwNlDcdJaoIc";

async function sbFetch(table, params = "") {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
}

const STEPS = [
  { code: "FITTING", label: "Fitting", icon: "📐", desc: "Pengukuran & design request" },
  { code: "MATERIAL_CONFIRMATION", label: "Material Confirmation", icon: "🧵", desc: "Konfirmasi material & warna" },
  { code: "FORMULASI_POLA", label: "Formulasi & Pola", icon: "📋", desc: "Formulasi produksi & pola" },
  { code: "CUTTING", label: "Cutting", icon: "✂️", desc: "Pemotongan kain" },
  { code: "OPERATOR", label: "Sewing", icon: "🪡", desc: "Penjahitan oleh operator" },
  { code: "QC_TEKNIS", label: "QC Teknis", icon: "🔍", desc: "Quality control teknis" },
  { code: "FINISHING", label: "Finishing & Final QC", icon: "✨", desc: "Pressing, steam & final check" },
  { code: "PACKING", label: "Packing", icon: "📦", desc: "Pengemasan produk" },
  { code: "SHIPPED", label: "Shipped", icon: "🚚", desc: "Pengiriman ke customer" },
];

const SC = {
  COMPLETED:   { bg: "#1a3a28", border: "#2D7A4F", text: "#3DAA6A", label: "Selesai" },
  IN_PROGRESS: { bg: "#3a2510", border: "#C97A2A", text: "#E8892F", label: "Sedang" },
  PENDING:     { bg: "#161D30", border: "#2a3550", text: "#6b7a99", label: "Belum" },
};

const NAV = [
  { id: "beranda",    icon: "🏠", label: "Beranda" },
  { id: "alur",       icon: "⚙️", label: "Alur Produksi" },
  { id: "order",      icon: "📋", label: "Order" },
  { id: "kalender",   icon: "📅", label: "Kalender" },
  { id: "material",   icon: "🧵", label: "Material" },
  { id: "laporan",    icon: "📊", label: "Laporan" },
  { id: "arsip",      icon: "🗂️", label: "Arsip" },
  { id: "pengaturan", icon: "⚙️", label: "Pengaturan" },
];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Poppins:wght@400;500;600&family=Amiri:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;-webkit-text-size-adjust:100%}
body{background:#0E1320;color:#F5EFE0;font-family:'Poppins',sans-serif;font-size:14px}
.app{display:flex;flex-direction:column;height:100vh;overflow:hidden}
.topbar{height:56px;min-height:56px;background:#0B1019;border-bottom:1px solid rgba(201,168,76,0.15);display:flex;align-items:center;justify-content:space-between;padding:0 16px;z-index:50}
.topbar-left{display:flex;flex-direction:column;gap:1px}
.topbar-page{font-size:13px;font-weight:600;color:#F5EFE0}
.topbar-date{font-size:10px;color:rgba(245,239,224,0.4)}
.topbar-right{display:flex;align-items:center;gap:10px}
.icon-btn{background:none;border:none;cursor:pointer;font-size:18px;padding:6px;color:rgba(245,239,224,0.55);display:flex;align-items:center;justify-content:center;border-radius:8px;min-width:38px;min-height:38px;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.icon-btn:active{background:rgba(201,168,76,0.1);color:#C9A84C}
.notif-wrap{position:relative}
.notif-dot{position:absolute;top:4px;right:4px;width:6px;height:6px;border-radius:50%;background:#C97A2A}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:90;opacity:0;pointer-events:none;transition:opacity 0.25s}
.overlay.open{opacity:1;pointer-events:auto}
.drawer{position:fixed;top:56px;right:0;width:220px;height:calc(100vh - 56px);background:#0B1019;border-left:1px solid rgba(201,168,76,0.15);display:flex;flex-direction:column;z-index:91;transform:translateX(100%);transition:transform 0.25s ease;overflow-y:auto}
.drawer.open{transform:translateX(0)}
.drawer-brand{padding:20px 16px 16px;border-bottom:1px solid rgba(201,168,76,0.1)}
.drawer-brand-name{font-family:'Playfair Display',serif;font-size:16px;color:#C9A84C}
.drawer-brand-sub{font-size:9px;color:rgba(245,239,224,0.35);text-transform:uppercase;letter-spacing:2px;margin-top:2px}
.nav-item{display:flex;align-items:center;gap:12px;padding:13px 16px;cursor:pointer;font-size:13px;color:rgba(245,239,224,0.55);border-left:3px solid transparent;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:all 0.15s}
.nav-item:active{background:rgba(201,168,76,0.08)}
.nav-item.active{color:#E4C875;background:rgba(201,168,76,0.1);border-left-color:#C9A84C;font-weight:500}
.drawer-footer{padding:16px;border-top:1px solid rgba(201,168,76,0.1);margin-top:auto}
.user-row{display:flex;align-items:center;gap:10px}
.avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#C9A84C,#7a5010);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#0E1320;flex-shrink:0}
.user-name{font-size:12px;font-weight:500;color:#F5EFE0}
.user-role{font-size:9px;color:rgba(245,239,224,0.35);text-transform:uppercase;letter-spacing:1px}
.page{flex:1;overflow-y:auto;padding:14px 14px 24px;-webkit-overflow-scrolling:touch}
.card{background:#161D30;border:1px solid rgba(201,168,76,0.14);border-radius:10px;padding:14px;margin-bottom:12px}
.card-label{font-size:9px;font-weight:600;color:rgba(245,239,224,0.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px}
.row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.hero{background:linear-gradient(135deg,#161D30,#1a2340);border:1px solid rgba(201,168,76,0.18);border-radius:10px;padding:18px;margin-bottom:12px}
.hero-title{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;color:#F5EFE0}
.hero-sub{font-size:11px;color:rgba(245,239,224,0.45);margin-top:4px;line-height:1.4}
.stats-row{display:flex;justify-content:space-around;margin-top:14px}
.stat-val{font-family:'Playfair Display',serif;font-size:20px;color:#C9A84C;font-weight:700;text-align:center}
.stat-lbl{font-size:9px;color:rgba(245,239,224,0.35);text-transform:uppercase;text-align:center;margin-top:1px}
.order-row-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.order-code{font-family:'Playfair Display',serif;font-size:14px;color:#F5EFE0}
.badge{font-size:9px;padding:2px 9px;border-radius:20px;font-weight:600;background:rgba(201,168,76,0.14);color:#C9A84C;border:1px solid rgba(201,168,76,0.28)}
.meta-row{display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px}
.meta-key{color:rgba(245,239,224,0.4)}
.meta-val{color:#F5EFE0;font-weight:500}
.prog-label{display:flex;justify-content:space-between;font-size:10px;margin-top:10px;margin-bottom:4px;color:rgba(245,239,224,0.45)}
.prog-label span:last-child{color:#C9A84C;font-weight:600}
.prog-track{height:5px;background:rgba(201,168,76,0.1);border-radius:3px;overflow:hidden}
.prog-fill{height:100%;background:linear-gradient(90deg,#C9A84C,#E8D87A);border-radius:3px;transition:width 0.8s}
.btn{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;padding:13px 12px;border-radius:8px;font-size:12px;font-weight:500;font-family:'Poppins',sans-serif;border:1px solid rgba(201,168,76,0.22);color:#F5EFE0;background:rgba(201,168,76,0.06);cursor:pointer;margin-bottom:8px;min-height:46px;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:background 0.15s}
.btn:last-child{margin-bottom:0}
.btn:active{background:rgba(201,168,76,0.16);transform:scale(0.98)}
.btn.primary{background:rgba(201,168,76,0.16);border-color:#C9A84C;color:#E4C875}
.btn.primary:active{background:rgba(201,168,76,0.28)}
.btn-sm{display:inline-flex;align-items:center;justify-content:center;padding:5px 12px;border-radius:6px;font-size:10px;font-weight:500;font-family:'Poppins',sans-serif;border:1px solid rgba(201,168,76,0.28);color:#C9A84C;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;min-height:32px}
.btn-sm:active{background:rgba(201,168,76,0.1)}
.sec-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.sec-title{font-family:'Playfair Display',serif;font-size:15px;color:#F5EFE0}
.sec-sub{font-size:10px;color:rgba(245,239,224,0.35);margin-top:1px}
.step-card{display:flex;gap:10px;align-items:flex-start;padding:11px 12px;border-radius:8px;margin-bottom:8px;border:1px solid rgba(201,168,76,0.09);border-left:3px solid rgba(201,168,76,0.08);background:#161D30}
.step-card.COMPLETED{background:#0f2119;border-left-color:#2D7A4F}
.step-card.IN_PROGRESS{background:#1c1208;border-left-color:#C97A2A}
.step-card.PENDING{opacity:0.7}
.step-num{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;background:rgba(201,168,76,0.07);color:rgba(245,239,224,0.3);border:1px solid rgba(201,168,76,0.12)}
.step-num.COMPLETED{background:#2D7A4F;color:#fff;border-color:#2D7A4F}
.step-num.IN_PROGRESS{background:#C97A2A;color:#fff;border-color:#C97A2A}
.step-body{flex:1;min-width:0}
.step-top{display:flex;justify-content:space-between;align-items:flex-start;gap:6px}
.step-name{font-size:12px;font-weight:600;color:#F5EFE0}
.step-name.PENDING{color:rgba(245,239,224,0.35)}
.step-desc-text{font-size:10px;color:rgba(245,239,224,0.38);margin-top:2px}
.step-badge{font-size:9px;padding:2px 7px;border-radius:10px;font-weight:600;flex-shrink:0}
.step-notes{font-size:10px;color:rgba(245,239,224,0.5);background:rgba(201,168,76,0.05);border-left:2px solid rgba(201,168,76,0.22);padding:4px 8px;border-radius:4px;margin-top:6px}
.step-meta{font-size:9px;color:rgba(245,239,224,0.3);margin-top:4px}
.order-list-item{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid rgba(201,168,76,0.07);gap:8px}
.order-list-code{font-size:11px;font-weight:600;color:#C9A84C;font-family:monospace}
.order-list-name{font-size:10px;color:rgba(245,239,224,0.5);margin-top:1px}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px}
.cal-header{text-align:center;font-size:9px;color:rgba(245,239,224,0.3);padding:6px 0}
.cal-day{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:12px;border-radius:4px;color:rgba(245,239,224,0.45);cursor:pointer;-webkit-tap-highlight-color:transparent}
.cal-day.today{background:rgba(201,168,76,0.15);color:#C9A84C;font-weight:700;border:1px solid rgba(201,168,76,0.28)}
.mat-item{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid rgba(201,168,76,0.07)}
.mat-name{font-size:12px;font-weight:500;color:#F5EFE0}
.mat-code{font-size:9px;color:rgba(245,239,224,0.3);margin-top:1px}
.metric-card{text-align:center;padding:12px 8px}
.metric-val{font-family:'Playfair Display',serif;font-size:26px;color:#C9A84C;font-weight:700}
.metric-lbl{font-size:9px;color:rgba(245,239,224,0.38);margin-top:2px;text-transform:uppercase}
.set-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(201,168,76,0.07);gap:12px}
.set-label{font-size:12px;color:#F5EFE0}
.set-sub{font-size:10px;color:rgba(245,239,224,0.35);margin-top:1px}
.toggle{width:40px;height:22px;border-radius:11px;background:rgba(201,168,76,0.15);position:relative;cursor:pointer;border:1px solid rgba(201,168,76,0.18);transition:background 0.2s;flex-shrink:0;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.toggle.on{background:#C9A84C}
.thumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:white;transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.2)}
.toggle.on .thumb{left:18px}
.arsip-item{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid rgba(201,168,76,0.07)}
.arsip-code{font-size:11px;font-weight:600;color:#C9A84C}
.arsip-name{font-size:10px;color:rgba(245,239,224,0.5);margin-top:1px}
.arsip-date{font-size:10px;color:rgba(245,239,224,0.35)}
.quote{background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.13);border-radius:8px;padding:14px;text-align:center;margin-top:4px}
.quote-ar{font-family:'Amiri',serif;font-size:16px;color:#C9A84C;margin-bottom:5px}
.quote-tr{font-size:10px;color:rgba(245,239,224,0.4);font-style:italic;line-height:1.5}
.quote-src{font-size:9px;color:rgba(201,168,76,0.45);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px}
.spin-wrap{display:flex;justify-content:center;padding:48px}
.spin{width:22px;height:22px;border:2px solid rgba(201,168,76,0.15);border-top-color:#C9A84C;border-radius:50%;animation:rot 0.7s linear infinite}
@keyframes rot{to{transform:rotate(360deg)}}
::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.12);border-radius:2px}
`;

const Spinner = () => <div className="spin-wrap"><div className="spin"/></div>;

function Beranda({ orders, steps, loading, setPage }) {
  const order = orders.find(o => o.order_status === "ACTIVE") || orders[0];
  const oSteps = steps.filter(s => s.order_id === order?.id);
  const done = oSteps.filter(s => s.status === "COMPLETED").length;
  const pct = Math.round((done / 9) * 100);
  const curStep = STEPS.find(s => s.code === order?.current_step);
  const dl = order?.deadline ? new Date(order.deadline).toLocaleDateString("id-ID",{day:"numeric",month:"short"}) : "5 Jul 2026";
  const todayStr = new Date().toLocaleDateString("id-ID",{weekday:"short",day:"numeric",month:"short"});
  if (loading) return <Spinner/>;
  return (
    <>
      <div className="hero">
        <div className="hero-title">Assalamu'alaikum, Deka ✦</div>
        <div className="hero-sub">Hari ini {todayStr} — Semoga Allah mudahkan setiap langkah produksi.</div>
        <div className="stats-row">
          <div><div className="stat-val">{orders.length}</div><div className="stat-lbl">Order</div></div>
          <div><div className="stat-val">{orders.filter(o=>o.order_status==="ACTIVE").length}</div><div className="stat-lbl">Aktif</div></div>
          <div><div className="stat-val">{done}/9</div><div className="stat-lbl">Step</div></div>
          <div><div className="stat-val">{pct}%</div><div className="stat-lbl">Progress</div></div>
        </div>
      </div>
      {order && (
        <div className="card">
          <div className="card-label">Order Aktif</div>
          <div className="order-row-top"><div className="order-code">{order.order_code}</div><div className="badge">AKTIF</div></div>
          <div className="meta-row"><span className="meta-key">Step</span><span className="meta-val">{curStep?.icon} {curStep?.label || "—"}</span></div>
          <div className="meta-row"><span className="meta-key">Deadline</span><span className="meta-val" style={{color:"#E8892F"}}>{dl}</span></div>
          <div className="meta-row"><span className="meta-key">Bayar</span><span className="meta-val">{order.payment_status==="dp"?"DP":"Lunas"}</span></div>
          <div className="prog-label"><span>Progress</span><span>{done}/9 Step</span></div>
          <div className="prog-track"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
        </div>
      )}
      <div className="card">
        <div className="card-label">Aksi Cepat</div>
        <button className="btn primary" onClick={() => setPage("alur")}>📋 Lihat Alur Produksi</button>
        <button className="btn" onClick={() => setPage("order")}>📋 Daftar Order</button>
        <button className="btn" onClick={() => alert("Fitur scan QR — coming soon!")}>🔍 Scan QR Order</button>
        <button className="btn" onClick={() => alert("Fitur upload foto — coming soon!")}>📸 Upload Foto Step</button>
      </div>
      <div className="quote">
        <div className="quote-ar">وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ</div>
        <div className="quote-tr">"Bekerjalah kamu, maka Allah akan melihat pekerjaanmu..."</div>
        <div className="quote-src">QS. At-Taubah: 105</div>
      </div>
    </>
  );
}

function AlurProduksi({ orders, steps, loading }) {
  const [sel, setSel] = useState(null);
  useEffect(() => { if (orders.length && !sel) setSel(orders[0]); }, [orders]);
  const oSteps = steps.filter(s => s.order_id === sel?.id);
  const done = oSteps.filter(s => s.status === "COMPLETED").length;
  const pct = Math.round((done / 9) * 100);
  if (loading) return <Spinner/>;
  return (
    <>
      <div className="sec-header">
        <div><div className="sec-title">⚙️ Alur Produksi</div><div className="sec-sub">9-step workflow</div></div>
        {orders.length > 1 && (
          <select style={{background:"#161D30",border:"1px solid rgba(201,168,76,0.2)",color:"#F5EFE0",padding:"5px 8px",borderRadius:"6px",fontSize:"11px"}} value={sel?.id||""} onChange={e=>setSel(orders.find(o=>o.id===e.target.value))}>
            {orders.map(o=><option key={o.id} value={o.id}>{o.order_code}</option>)}
          </select>
        )}
      </div>
      {sel && (
        <div className="card">
          <div className="order-row-top"><div className="order-code">{sel.order_code}</div><div className="badge">{sel.order_status}</div></div>
          <div className="prog-label"><span>{done}/9 Step Selesai</span><span>{pct}%</span></div>
          <div className="prog-track"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
        </div>
      )}
      {STEPS.map((step,i) => {
        const d = oSteps.find(s=>s.step===step.code);
        const st = d?.status||"PENDING";
        const c = SC[st]||SC.PENDING;
        return (
          <div key={step.code} className={`step-card ${st}`}>
            <div className={`step-num ${st}`}>{st==="COMPLETED"?"✓":st==="IN_PROGRESS"?"●":i+1}</div>
            <div className="step-body">
              <div className="step-top">
                <div className={`step-name ${st}`}>{step.icon} {step.label}</div>
                <div className="step-badge" style={{background:c.bg,color:c.text,border:`1px solid ${c.border}`}}>{c.label}</div>
              </div>
              <div className="step-desc-text">{step.desc}</div>
              {d?.handled_by_name && <div className="step-meta">👤 {d.handled_by_name}{d?.completed_at?" · ✓ "+new Date(d.completed_at).toLocaleDateString("id-ID",{day:"numeric",month:"short"}):""}</div>}
              {d?.notes && <div className="step-notes">📝 {d.notes}</div>}
            </div>
          </div>
        );
      })}
    </>
  );
}

function OrderPage({ orders, loading }) {
  if (loading) return <Spinner/>;
  return (
    <>
      <div className="sec-header"><div><div className="sec-title">📋 Order</div><div className="sec-sub">{orders.length} order</div></div></div>
      <div className="card">
        {orders.map(o=>{
          const step=STEPS.find(s=>s.code===o.current_step);
          return (
            <div key={o.id} className="order-list-item">
              <div><div className="order-list-code">{o.order_code}</div><div className="order-list-name">{o.customers?.name||"—"}{step?" · "+step.icon+" "+step.label:""}</div></div>
              <div className="badge" style={{background:o.order_status==="ACTIVE"?"rgba(201,168,76,0.14)":"rgba(45,122,79,0.14)",color:o.order_status==="ACTIVE"?"#C9A84C":"#3DAA6A",border:"none"}}>{o.order_status}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function KalenderPage({ orders }) {
  const now=new Date(); const yr=now.getFullYear(); const mn=now.getMonth();
  const firstDay=new Date(yr,mn,1).getDay(); const total=new Date(yr,mn+1,0).getDate();
  const DAYS=["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
  const evDays=orders.filter(o=>o.deadline).map(o=>new Date(o.deadline).getDate());
  return (
    <>
      <div className="sec-header"><div><div className="sec-title">📅 Kalender</div><div className="sec-sub">{now.toLocaleDateString("id-ID",{month:"long",year:"numeric"})}</div></div></div>
      <div className="card">
        <div className="cal-grid">
          {DAYS.map(d=><div key={d} className="cal-header">{d}</div>)}
          {Array.from({length:firstDay}).map((_,i)=><div key={`b${i}`}/>)}
          {Array.from({length:total}).map((_,i)=>{
            const d=i+1;
            return <div key={d} className={`cal-day${d===now.getDate()?" today":""}${evDays.includes(d)?" event":""}`}>{d}</div>;
          })}
        </div>
      </div>
      {orders.filter(o=>o.deadline).length>0&&(
        <div className="card">
          <div className="card-label">Deadline</div>
          {orders.filter(o=>o.deadline).map(o=>(
            <div key={o.id} className="order-list-item">
              <div><div className="order-list-code">{o.order_code}</div><div className="order-list-name">{o.customers?.name}</div></div>
              <div style={{fontSize:11,color:"#E8892F"}}>{new Date(o.deadline).toLocaleDateString("id-ID",{day:"numeric",month:"short"})}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function MaterialPage() {
  const mats=[
    {name:"VB Wool Dourmil",   code:"WD-001",stock:12,low:5},
    {name:"Cotton Poplin",     code:"CP-002",stock:8, low:5},
    {name:"Japanese Linen",    code:"JL-003",stock:3, low:5},
    {name:"Cashmere Wool",     code:"CW-004",stock:6, low:3},
    {name:"Egyptian Cotton",   code:"EC-005",stock:15,low:5},
  ];
  return (
    <>
      <div className="sec-header"><div><div className="sec-title">🧵 Material</div><div className="sec-sub">{mats.length} item</div></div></div>
      <div className="card">
        {mats.map(m=>(
          <div key={m.code} className="mat-item">
            <div><div className="mat-name">{m.name}</div><div className="mat-code">{m.code}</div></div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:m.stock<=m.low?"#DD5555":m.stock<=m.low*2?"#E8892F":"#C9A84C"}}>{m.stock}</div>
              <div style={{fontSize:9,color:"rgba(245,239,224,0.3)"}}>meter</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function LaporanPage({ orders, steps }) {
  const done=steps.filter(s=>s.status==="COMPLETED").length;
  return (
    <>
      <div className="sec-header"><div><div className="sec-title">📊 Laporan</div></div></div>
      <div className="card">
        <div className="row-3">
          {[{v:orders.length,l:"Order"},{v:done,l:"Selesai"},{v:orders.filter(o=>o.order_status==="ACTIVE").length,l:"Aktif"}].map(m=>(
            <div key={m.l} className="metric-card"><div className="metric-val">{m.v}</div><div className="metric-lbl">{m.l}</div></div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-label">Status Step</div>
        {Object.entries(SC).map(([k,c])=>{
          const n=steps.filter(s=>s.status===k).length; if(!n) return null;
          return (
            <div key={k} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                <span style={{color:"rgba(245,239,224,0.55)"}}>{c.label}</span>
                <span style={{color:c.text,fontWeight:600}}>{n} step</span>
              </div>
              <div style={{height:4,background:"rgba(201,168,76,0.07)",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(n/9)*100}%`,background:c.text,borderRadius:2}}/>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ArsipPage() {
  const data=[
    {code:"LT-2025-001",name:"Ahmad Farid",   model:"Classic Thobe", tgl:"12 Des 2025"},
    {code:"LT-2025-002",name:"Hendra Wijaya", model:"Slim Fit Bisht",tgl:"28 Des 2025"},
    {code:"LT-2025-003",name:"Rizky M.",       model:"Premium Koko",  tgl:"3 Jan 2026"},
  ];
  return (
    <>
      <div className="sec-header"><div><div className="sec-title">🗂️ Arsip</div><div className="sec-sub">{data.length} order</div></div></div>
      <div className="card">
        {data.map(a=>(
          <div key={a.code} className="arsip-item">
            <div><div className="arsip-code">{a.code}</div><div className="arsip-name">{a.name} · {a.model}</div></div>
            <div className="arsip-date">{a.tgl}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function PengaturanPage() {
  const [tog,setTog]=useState({notif:true,qr:true,backup:false});
  const flip=k=>setTog(p=>({...p,[k]:!p[k]}));
  return (
    <>
      <div className="sec-header"><div><div className="sec-title">⚙️ Pengaturan</div></div></div>
      <div className="card">
        <div className="card-label">Preferensi</div>
        {[{k:"notif",l:"Notifikasi WA",s:"Update status ke customer"},{k:"qr",l:"QR Tracking",s:"Aktifkan scan QR"},{k:"backup",l:"Auto Backup",s:"Backup harian ke cloud"}].map(s=>(
          <div key={s.k} className="set-row">
            <div><div className="set-label">{s.l}</div><div className="set-sub">{s.s}</div></div>
            <div className={`toggle ${tog[s.k]?"on":""}`} onClick={()=>flip(s.k)}><div className="thumb"/></div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-label">Database</div>
        <div className="set-row"><div><div className="set-label">Supabase</div><div className="set-sub">wauilgumyskdsrhvnlwq · ap-southeast-1</div></div><span style={{fontSize:10,color:"#3DAA6A",background:"rgba(45,122,79,0.15)",padding:"3px 10px",borderRadius:10}}>● OK</span></div>
      </div>
      <div className="card">
        <div className="card-label">Studio</div>
        <div className="set-row"><div><div className="set-label">Local Tailor — Bandung</div><div className="set-sub">ID: LT-BANDUNG-001</div></div><button className="btn-sm">Edit</button></div>
        <div className="set-row"><div><div className="set-label">Artisan</div><div className="set-sub">Teja, Teten, Rafli, Deka</div></div><button className="btn-sm">Kelola</button></div>
      </div>
    </>
  );
}

export default function App() {
  const [page,setPage]=useState("beranda");
  const [drawer,setDrawer]=useState(false);
  const [orders,setOrders]=useState([]);
  const [steps,setSteps]=useState([]);
  const [loading,setLoading]=useState(true);

  const load=useCallback(async()=>{
    setLoading(true);
    try {
      const [ord,stp,usr]=await Promise.all([
        sbFetch("orders","select=*,customers(name)&order=created_at.desc"),
        sbFetch("production_steps","select=*&order=created_at.asc"),
        sbFetch("users","select=id,name"),
      ]);
      const uMap={}; usr.forEach(u=>{uMap[u.id]=u.name;});
      const enriched=stp.map(s=>({...s,handled_by_name:s.handled_by?uMap[s.handled_by]:null}));
      const seen=new Set(); const uniq=[];
      [...enriched].reverse().forEach(s=>{const k=`${s.order_id}-${s.step}`;if(!seen.has(k)){seen.add(k);uniq.unshift(s);}});
      setOrders(ord); setSteps(uniq);
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{load();},[load]);

  const nav=id=>{setPage(id);setDrawer(false);};
  const now=new Date();
  const curNav=NAV.find(n=>n.id===page);
  const p={orders,steps,loading,setPage};
  const PAGES={
    beranda:<Beranda {...p}/>,
    alur:<AlurProduksi {...p}/>,
    order:<OrderPage {...p}/>,
    kalender:<KalenderPage {...p}/>,
    material:<MaterialPage/>,
    laporan:<LaporanPage {...p}/>,
    arsip:<ArsipPage/>,
    pengaturan:<PengaturanPage/>,
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-page">{curNav?.icon} {curNav?.label}</div>
            <div className="topbar-date">{now.toLocaleDateString("id-ID",{weekday:"short",day:"numeric",month:"short"})} · {now.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}</div>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" onClick={load}>🔄</button>
            <div className="notif-wrap"><button className="icon-btn">🔔</button><div className="notif-dot"/></div>
            <button className="icon-btn" onClick={()=>setDrawer(!drawer)}>☰</button>
          </div>
        </div>

        <div className={`overlay ${drawer?"open":""}`} onClick={()=>setDrawer(false)}/>

        <div className={`drawer ${drawer?"open":""}`}>
          <div className="drawer-brand">
            <div style={{fontSize:10,color:"rgba(201,168,76,0.35)",marginBottom:4}}>✦ ◆ ✦</div>
            <div className="drawer-brand-name">LOCAL TAILOR</div>
            <div className="drawer-brand-sub">Production System</div>
          </div>
          {NAV.map(item=>(
            <div key={item.id} className={`nav-item ${page===item.id?"active":""}`} onClick={()=>nav(item.id)}>
              <span style={{fontSize:15,width:20,textAlign:"center"}}>{item.icon}</span>
              {item.label}
            </div>
          ))}
          <div className="drawer-footer">
            <div className="user-row">
              <div className="avatar">DK</div>
              <div><div className="user-name">Deka Kurniawan</div><div className="user-role">PIC Usaha</div></div>
            </div>
          </div>
        </div>

        <div className="page">{PAGES[page]}</div>
      </div>
    </>
  );
}
