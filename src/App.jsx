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

const STATUS_COLOR = {
  COMPLETED: { bg: "#1a3a28", border: "#2D7A4F", dot: "#3DAA6A", text: "#3DAA6A", label: "Selesai" },
  IN_PROGRESS: { bg: "#3a2510", border: "#C97A2A", dot: "#E8892F", text: "#E8892F", label: "Sedang Dikerjakan" },
  PENDING: { bg: "#161D30", border: "#2a3550", dot: "#4a5570", text: "#6b7a99", label: "Belum Dimulai" },
};

const NAV_ITEMS = [
  { id: "beranda", icon: "🏠", label: "Beranda" },
  { id: "alur-produksi", icon: "⚙️", label: "Alur Produksi" },
  { id: "order", icon: "📋", label: "Order" },
  { id: "kalender", icon: "📅", label: "Kalender" },
  { id: "material", icon: "🧵", label: "Material" },
  { id: "laporan", icon: "📊", label: "Laporan" },
  { id: "arsip", icon: "🗂️", label: "Arsip" },
  { id: "pengaturan", icon: "⚙️", label: "Pengaturan" },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Poppins:wght@300;400;500;600&family=Amiri:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 16px; }
  body { background: #0E1320; color: #F5EFE0; font-family: 'Poppins', sans-serif; }
  .app { display: flex; height: 100vh; overflow: hidden; background: #0E1320; }
  .sidebar { width: 240px; background: #0B1019; border-right: 1px solid rgba(201,168,76,0.15); display: flex; flex-direction: column; height: 100vh; overflow-y: auto; transition: transform 0.3s; }
  .sidebar.closed { transform: translateX(-100%); position: absolute; z-index: 999; }
  .sidebar-logo { padding: 24px 20px 20px; border-bottom: 1px solid rgba(201,168,76,0.1); }
  .sidebar-logo .brand { font-family: 'Playfair Display', serif; font-size: 18px; color: #C9A84C; letter-spacing: 1px; }
  .sidebar-logo .sub { font-size: 10px; color: rgba(245,239,224,0.4); letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
  .sidebar-nav { flex: 1; padding: 12px 0; }
  .nav-item { display: flex; align-items: center; gap: 12px; padding: 11px 20px; cursor: pointer; font-size: 13px; color: rgba(245,239,224,0.55); border-left: 3px solid transparent; transition: all 0.2s; }
  .nav-item:active { background: rgba(201,168,76,0.08); }
  .nav-item.active { color: #E4C875; background: rgba(201,168,76,0.1); border-left-color: #C9A84C; font-weight: 500; }
  .nav-icon { font-size: 15px; width: 20px; flex-shrink: 0; }
  .sidebar-footer { padding: 16px 20px; border-top: 1px solid rgba(201,168,76,0.1); }
  .user-card { display: flex; align-items: center; gap: 10px; }
  .user-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #C9A84C, #8a6020); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #0E1320; flex-shrink: 0; }
  .user-name { font-size: 12px; font-weight: 500; color: #F5EFE0; }
  .user-role { font-size: 10px; color: rgba(245,239,224,0.4); text-transform: uppercase; }
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .topbar { height: 60px; background: #0E1320; border-bottom: 1px solid rgba(201,168,76,0.1); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; }
  .topbar-left { display: flex; flex-direction: column; gap: 2px; }
  .topbar-greeting { font-size: 12px; font-weight: 500; color: #F5EFE0; }
  .topbar-date { font-size: 10px; color: rgba(245,239,224,0.4); }
  .topbar-right { display: flex; align-items: center; gap: 12px; }
  .topbar-badge { cursor: pointer; font-size: 16px; color: rgba(245,239,224,0.5); position: relative; }
  .notif-dot { position: absolute; top: -2px; right: -2px; width: 6px; height: 6px; border-radius: 50%; background: #C97A2A; }
  .menu-toggle { background: none; border: none; color: #C9A84C; font-size: 18px; cursor: pointer; padding: 4px; }
  .page { flex: 1; overflow-y: auto; padding: 16px; }
  .hero { background: linear-gradient(135deg, #161D30, #1C2438); border: 1px solid rgba(201,168,76,0.2); border-radius: 10px; padding: 20px; margin-bottom: 16px; }
  .hero-title { font-family: 'Playfair Display', serif; font-size: 20px; color: #F5EFE0; font-weight: 700; }
  .hero-sub { font-size: 11px; color: rgba(245,239,224,0.5); margin-top: 4px; }
  .hero-stats { display: flex; gap: 12px; margin-top: 14px; justify-content: space-around; }
  .hero-stat-val { font-family: 'Playfair Display', serif; font-size: 18px; color: #C9A84C; font-weight: 700; }
  .hero-stat-lbl { font-size: 9px; color: rgba(245,239,224,0.4); text-transform: uppercase; }
  .cards-row { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
  .card { background: #161D30; border: 1px solid rgba(201,168,76,0.15); border-radius: 8px; padding: 16px; }
  .card-title { font-size: 10px; color: rgba(245,239,224,0.4); text-transform: uppercase; margin-bottom: 12px; }
  .order-meta { display: flex; justify-content: space-between; margin-bottom: 12px; gap: 8px; }
  .order-code { font-family: 'Playfair Display', serif; font-size: 14px; color: #F5EFE0; }
  .order-badge { font-size: 9px; padding: 2px 8px; border-radius: 16px; background: rgba(201,168,76,0.15); color: #C9A84C; border: 1px solid rgba(201,168,76,0.3); }
  .order-detail { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
  .order-row { display: flex; justify-content: space-between; font-size: 11px; }
  .order-row-key { color: rgba(245,239,224,0.4); }
  .order-row-val { color: #F5EFE0; font-weight: 500; }
  .progress-bar-wrap { margin-top: 12px; }
  .progress-label { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 4px; }
  .progress-fill { background: linear-gradient(90deg, #C9A84C, #E4C875); height: 5px; border-radius: 3px; }
  .steps-title { font-family: 'Playfair Display', serif; font-size: 16px; color: #F5EFE0; margin-bottom: 12px; }
  .step-card { background: #161D30; border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; gap: 10px; border-left: 3px solid transparent; }
  .step-card.COMPLETED { border-left-color: #2D7A4F; background: #11231a; }
  .step-card.IN_PROGRESS { border-left-color: #C97A2A; background: #1d1509; }
  .step-num { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .step-num.COMPLETED { background: #2D7A4F; color: #fff; }
  .step-num.IN_PROGRESS { background: #C97A2A; color: #fff; }
  .step-info { flex: 1; }
  .step-label { font-size: 12px; font-weight: 600; color: #F5EFE0; }
  .step-desc { font-size: 10px; color: rgba(245,239,224,0.4); margin-top: 2px; }
  .step-status-badge { font-size: 9px; padding: 2px 6px; border-radius: 10px; }
  .section-header { display: flex; justify-content: space-between; margin-bottom: 12px; gap: 8px; }
  .section-title { font-family: 'Playfair Display', serif; font-size: 15px; color: #F5EFE0; }
  .section-sub { font-size: 10px; color: rgba(245,239,224,0.35); }
  .btn-ghost { font-size: 10px; color: #C9A84C; background: none; border: 1px solid rgba(201,168,76,0.3); padding: 4px 10px; border-radius: 5px; cursor: pointer; }
  .qa-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 12px; border-radius: 6px; font-size: 11px; font-weight: 500; border: 1px solid rgba(201,168,76,0.25); color: #F5EFE0; background: rgba(201,168,76,0.06); width: 100%; cursor: pointer; }
  .qa-btn.primary { background: rgba(201,168,76,0.18); border-color: #C9A84C; color: #E4C875; }
  .legend { display: flex; gap: 12px; flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: rgba(245,239,224,0.6); }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
  .material-card { background: #161D30; border: 1px solid rgba(201,168,76,0.1); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .material-name { font-size: 12px; font-weight: 600; color: #F5EFE0; }
  .material-code { font-size: 9px; color: rgba(245,239,224,0.35); margin-top: 1px; }
  .stock-val { font-family: 'Playfair Display', serif; font-size: 16px; color: #C9A84C; font-weight: 700; }
  .stock-unit { font-size: 9px; color: rgba(245,239,224,0.35); }
  .report-metric { text-align: center; padding: 12px; }
  .metric-val { font-family: 'Playfair Display', serif; font-size: 24px; color: #C9A84C; font-weight: 700; }
  .metric-lbl { font-size: 10px; color: rgba(245,239,224,0.4); margin-top: 2px; }
  .setting-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(201,168,76,0.07); gap: 10px; }
  .setting-label { font-size: 12px; color: #F5EFE0; }
  .setting-sub { font-size: 10px; color: rgba(245,239,224,0.35); }
  .toggle { width: 38px; height: 20px; border-radius: 10px; background: rgba(201,168,76,0.2); cursor: pointer; position: relative; border: 1px solid rgba(201,168,76,0.2); }
  .toggle.on { background: #C9A84C; }
  .toggle-thumb { position: absolute; top: 1px; left: 1px; width: 14px; height: 14px; border-radius: 50%; background: white; transition: left 0.2s; }
  .toggle.on .toggle-thumb { left: 18px; }
  .arsip-item { background: #161D30; border: 1px solid rgba(201,168,76,0.08); border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; margin-bottom: 8px; }
  .loading { display: flex; align-items: center; justify-content: center; padding: 40px 16px; }
  .loading-spin { width: 20px; height: 20px; border: 2px solid rgba(201,168,76,0.2); border-top-color: #C9A84C; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .quote-block { background: linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02)); border: 1px solid rgba(201,168,76,0.15); border-radius: 8px; padding: 16px; text-align: center; margin-top: 16px; }
  .quote-arabic { font-family: 'Amiri', serif; font-size: 16px; color: #C9A84C; margin-bottom: 6px; }
  .quote-trans { font-size: 10px; color: rgba(245,239,224,0.45); font-style: italic; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.15); }
  .cal-day { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 11px; border-radius: 4px; color: rgba(245,239,224,0.5); }
  .cal-day.today { background: rgba(201,168,76,0.15); color: #C9A84C; font-weight: 700; }
  .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .data-table th { text-align: left; font-size: 9px; padding: 8px; border-bottom: 1px solid rgba(201,168,76,0.1); }
  .data-table td { padding: 10px; font-size: 11px; border-bottom: 1px solid rgba(201,168,76,0.05); }
  .order-code-cell { font-weight: 600; color: #C9A84C; font-family: monospace; }
`;

function PageBeranda({ orders, steps, loading }) {
  const activeOrder = orders.find(o => o.order_status === "ACTIVE") || orders[0];
  const activeSteps = steps.filter(s => s.order_id === activeOrder?.id);
  const completedCount = activeSteps.filter(s => s.status === "COMPLETED").length;
  const pct = Math.round((completedCount / 9) * 100);
  const currentStepInfo = STEPS.find(s => activeOrder?.current_step === s.code);
  const today = new Date().toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });

  if (loading) return <div className="loading"><div className="loading-spin"/></div>;

  return (
    <>
      <div className="hero">
        <div className="hero-title">Assalamu'alaikum, Deka ✦</div>
        <div className="hero-sub">Hari ini {today} — Semoga Allah mudahkan setiap langkah produksi.</div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">{orders.length}</div><div className="hero-stat-lbl">Order</div></div>
          <div><div className="hero-stat-val">{orders.filter(o=>o.order_status==="ACTIVE").length}</div><div className="hero-stat-lbl">Aktif</div></div>
          <div><div className="hero-stat-val">{pct}%</div><div className="hero-stat-lbl">Progress</div></div>
        </div>
      </div>

      {activeOrder && (
        <div className="cards-row">
          <div className="card">
            <div className="card-title">Order Aktif</div>
            <div className="order-meta">
              <div className="order-code">{activeOrder.order_code}</div>
              <div className="order-badge">AKTIF</div>
            </div>
            <div className="order-detail">
              <div className="order-row"><span className="order-row-key">Step</span><span className="order-row-val">{currentStepInfo?.icon} {currentStepInfo?.label || activeOrder.current_step}</span></div>
              <div className="order-row"><span className="order-row-key">Status</span><span className="order-row-val">{currentStepInfo ? "Berlangsung" : "—"}</span></div>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-label"><span>Progress</span><span>{completedCount}/9</span></div>
              <div style={{height:5,background:"rgba(201,168,76,0.1)",borderRadius:3,overflow:"hidden"}}><div className="progress-fill" style={{width:`${pct}%`,height:"100%"}}/></div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Aksi Cepat</div>
            <div className="cards-row" style={{marginBottom:0}}>
              <button className="qa-btn primary">📋 Alur</button>
              <button className="qa-btn">🔍 Scan</button>
              <button className="qa-btn">📸 Foto</button>
              <button className="qa-btn">✅ Update</button>
            </div>
          </div>
        </div>
      )}

      <div className="quote-block">
        <div className="quote-arabic">وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ</div>
        <div className="quote-trans">Bekerjalah, Allah melihat pekerjaan kamu — QS. At-Taubah: 105</div>
      </div>
    </>
  );
}

function PageAlurProduksi({ orders, steps, loading }) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (orders.length > 0 && !selectedOrder) setSelectedOrder(orders[0]);
  }, [orders]);

  const orderSteps = steps.filter(s => s.order_id === selectedOrder?.id);
  const completedCount = orderSteps.filter(s => s.status === "COMPLETED").length;
  const pct = Math.round((completedCount / 9) * 100);

  if (loading) return <div className="loading"><div className="loading-spin"/></div>;

  return (
    <>
      <div className="section-header">
        <div><div className="section-title">⚙️ Alur Produksi</div></div>
        {orders.length > 1 && (
          <select style={{background:"#161D30",border:"1px solid rgba(201,168,76,0.2)",color:"#F5EFE0",padding:"4px 8px",borderRadius:"5px",fontSize:"11px"}} value={selectedOrder?.id || ""} onChange={e => setSelectedOrder(orders.find(o=>o.id===e.target.value))}>
            {orders.map(o => <option key={o.id} value={o.id}>{o.order_code}</option>)}
          </select>
        )}
      </div>

      {selectedOrder && (
        <div className="card" style={{marginBottom:"12px"}}>
          <div className="order-meta">
            <div className="order-code">{selectedOrder.order_code}</div>
            <div className="order-badge">{selectedOrder.order_status}</div>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-label"><span>Progress: {completedCount}/9</span><span>{pct}%</span></div>
            <div style={{height:5,background:"rgba(201,168,76,0.1)",borderRadius:3,overflow:"hidden"}}><div className="progress-fill" style={{width:`${pct}%`,height:"100%"}}/></div>
          </div>
        </div>
      )}

      <div className="steps-title">Detail Produksi</div>

      {STEPS.map((step, i) => {
        const data = orderSteps.find(s => s.step === step.code);
        const status = data?.status || "PENDING";
        const sc = STATUS_COLOR[status] || STATUS_COLOR.PENDING;

        return (
          <div key={step.code} className={`step-card ${status}`}>
            <div className={`step-num ${status}`}>{status === "COMPLETED" ? "✓" : status === "IN_PROGRESS" ? "●" : i+1}</div>
            <div className="step-info">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div className="step-label" style={{color: status==="PENDING" ? "rgba(245,239,224,0.35)" : "#F5EFE0"}}>{step.icon} {step.label}</div>
                <div className="step-status-badge" style={{background:sc.bg,color:sc.text,border:`1px solid ${sc.border}`}}>{sc.label}</div>
              </div>
              <div className="step-desc">{step.desc}</div>
              {data?.notes && <div style={{fontSize:"10px",color:"rgba(245,239,224,0.55)",background:"rgba(201,168,76,0.06)",borderRadius:"4px",padding:"4px 8px",marginTop:"6px",borderLeft:"2px solid rgba(201,168,76,0.25)"}}>📝 {data.notes}</div>}
            </div>
          </div>
        );
      })}
    </>
  );
}

function PageOrder({ orders, loading }) {
  if (loading) return <div className="loading"><div className="loading-spin"/></div>;
  return (
    <>
      <div className="section-header"><div><div className="section-title">📋 Order</div></div></div>
      <div className="card">
        {orders.map(o => (
          <div key={o.id} style={{padding:"12px 0",borderBottom:"1px solid rgba(201,168,76,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:"12px",fontWeight:600,color:"#C9A84C"}}>{o.order_code}</div><div style={{fontSize:"10px",color:"rgba(245,239,224,0.5)",marginTop:2}}>{o.customers?.name || "—"}</div></div>
            <span style={{fontSize:"9px",padding:"2px 8px",borderRadius:"8px",background:o.order_status==="ACTIVE"?"rgba(201,168,76,0.15)":"rgba(45,122,79,0.15)",color:o.order_status==="ACTIVE"?"#C9A84C":"#3DAA6A"}}>{o.order_status}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function PageKalender({ orders }) {
  const today = new Date();
  const days = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();

  return (
    <>
      <div className="section-header"><div><div className="section-title">📅 Kalender</div></div></div>
      <div className="card">
        <div className="calendar-grid">
          {days.map(d => <div key={d} style={{textAlign:"center",fontSize:"9px",padding:"4px",color:"rgba(245,239,224,0.4)"}}>{d}</div>)}
          {Array.from({length:firstDay}).map((_,i) => <div key={`e${i}`}/>)}
          {Array.from({length:daysInMonth}).map((_,i) => <div key={i+1} className={`cal-day${i+1===today.getDate()?" today":""}`}>{i+1}</div>)}
        </div>
      </div>
    </>
  );
}

function PageMaterial() {
  const materials = [{ name:"VB Wool Dourmil", code:"WD-001", stock:12 }, { name:"Cotton Poplin", code:"CP-002", stock:8 }];
  return (<><div className="section-header"><div><div className="section-title">🧵 Material</div></div></div>{materials.map(m=><div key={m.code} className="material-card"><div><div className="material-name">{m.name}</div><div className="material-code">{m.code}</div></div><div style={{textAlign:"right"}}><div className="stock-val" style={{color:m.stock<5?"#E8892F":"#C9A84C"}}>{m.stock}</div><div className="stock-unit">m</div></div></div>)}</>);
}

function PageLaporan({ orders, steps }) {
  return (<><div className="section-header"><div><div className="section-title">📊 Laporan</div></div></div><div className="cards-row">{[{val:orders.length,lbl:"Order"},{val:steps.filter(s=>s.status==="COMPLETED").length,lbl:"Selesai"},{val:orders.filter(o=>o.order_status==="ACTIVE").length,lbl:"Aktif"}].map(m=><div key={m.lbl} className="card"><div className="report-metric"><div className="metric-val">{m.val}</div><div className="metric-lbl">{m.lbl}</div></div></div>)}</div></>);
}

function PageArsip() {
  const data = [{ code:"LT-2025-001", customer:"Ahmad Farid", selesai:"12 Des 2025" }];
  return (<><div className="section-header"><div><div className="section-title">🗂️ Arsip</div></div></div>{data.map(a=><div key={a.code} className="arsip-item"><div><div style={{fontSize:"11px",fontWeight:600,color:"#C9A84C"}}>{a.code}</div><div style={{fontSize:"10px",color:"rgba(245,239,224,0.6)",marginTop:2}}>{a.customer}</div></div><div style={{fontSize:"10px",color:"rgba(245,239,224,0.4)"}}>{a.selesai}</div></div>)}</>);
}

function PagePengaturan() {
  const [toggles, setToggles] = useState({ notif:true, qr:true });
  const toggle = k => setToggles(p=>({...p,[k]:!p[k]}));
  return (<><div className="section-header"><div><div className="section-title">⚙️ Pengaturan</div></div></div><div className="card">{[{key:"notif",label:"Notifikasi WA"},{key:"qr",label:"QR Tracking"}].map(s=><div key={s.key} className="setting-row"><div className="setting-label">{s.label}</div><div className={`toggle ${toggles[s.key]?"on":""}`} onClick={()=>toggle(s.key)}><div className="toggle-thumb"/></div></div>)}</div></>);
}

export default function App() {
  const [page, setPage] = useState("beranda");
  const [orders, setOrders] = useState([]);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, stepsData, usersData] = await Promise.all([
        sbFetch("orders", "select=*,customers(name)&order=created_at.desc"),
        sbFetch("production_steps", "select=*&order=created_at.asc"),
        sbFetch("users", "select=id,name"),
      ]);

      const userMap = {};
      usersData.forEach(u => { userMap[u.id] = u.name; });

      const enrichedSteps = stepsData.map(s => ({ ...s, handled_by_name: s.handled_by ? userMap[s.handled_by] : null }));

      const seen = new Set();
      const uniqueSteps = [];
      [...enrichedSteps].reverse().forEach(s => {
        const key = `${s.order_id}-${s.step}`;
        if (!seen.has(key)) { seen.add(key); uniqueSteps.unshift(s); }
      });

      setOrders(ordersData);
      setSteps(uniqueSteps);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("id-ID", {hour:"2-digit",minute:"2-digit"});
  const dateStr = now.toLocaleDateString("id-ID", {weekday:"short",day:"numeric",month:"short"});

  const pageProps = { orders, steps, loading };
  const pages = {
    "beranda": <PageBeranda {...pageProps}/>,
    "alur-produksi": <PageAlurProduksi {...pageProps}/>,
    "order": <PageOrder {...pageProps}/>,
    "kalender": <PageKalender {...pageProps}/>,
    "material": <PageMaterial/>,
    "laporan": <PageLaporan {...pageProps}/>,
    "arsip": <PageArsip/>,
    "pengaturan": <PagePengaturan/>,
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar-logo">
            <div style={{fontSize:"10px",color:"rgba(201,168,76,0.4)"}}>✦ ◆ ✦</div>
            <div className="brand">LOCAL TAILOR</div>
            <div className="sub">Production</div>
          </div>
          <nav className="sidebar-nav">
            {NAV_ITEMS.map(item => (
              <div key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => { setPage(item.id); setSidebarOpen(false); }}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">DK</div>
              <div><div className="user-name">Deka</div><div className="user-role">PIC</div></div>
            </div>
          </div>
        </div>

        <div className="main">
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-greeting">{NAV_ITEMS.find(n=>n.id===page)?.icon} {NAV_ITEMS.find(n=>n.id===page)?.label}</div>
              <div className="topbar-date">{dateStr} · {timeStr}</div>
            </div>
            <div className="topbar-right">
              <div className="topbar-badge" onClick={fetchData}>🔄</div>
              <div className="topbar-badge">🔔<div className="notif-dot"/></div>
              <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            </div>
          </div>

          <div className="page">{pages[page]}</div>
        </div>
      </div>
    </>
  );
}
