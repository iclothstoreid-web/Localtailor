import { useState, useEffect, useCallback } from "react";

// ── SUPABASE CONFIG ──────────────────────────────────────────────
const SUPA_URL = "https://wauilgumyskdsrhvnlwq.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdWlsZ3VteXNrZHNyaHZubHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MDgxOTYsImV4cCI6MjA5ODA4NDE5Nn0.kQkmgh-y6oCC8O5FLu7iiP8nQCs__DTIwNlDcdJaoIc";

async function sbFetch(table, params = "") {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
}

// ── CONSTANTS ────────────────────────────────────────────────────
const STEPS = [
  { code: "FITTING",              label: "Fitting",               icon: "📐", desc: "Pengukuran & design request" },
  { code: "MATERIAL_CONFIRMATION",label: "Material Confirmation", icon: "🧵", desc: "Konfirmasi material & warna" },
  { code: "FORMULASI_POLA",       label: "Formulasi & Pola",      icon: "📋", desc: "Formulasi produksi & pola" },
  { code: "CUTTING",              label: "Cutting",               icon: "✂️", desc: "Pemotongan kain" },
  { code: "OPERATOR",             label: "Sewing",                icon: "🪡", desc: "Penjahitan oleh operator" },
  { code: "QC_TEKNIS",            label: "QC Teknis",             icon: "🔍", desc: "Quality control teknis" },
  { code: "FINISHING",            label: "Finishing & Final QC",  icon: "✨", desc: "Pressing, steam & final check" },
  { code: "PACKING",              label: "Packing",               icon: "📦", desc: "Pengemasan produk" },
  { code: "SHIPPED",              label: "Shipped",               icon: "🚚", desc: "Pengiriman ke customer" },
];

const STATUS_COLOR = {
  COMPLETED:  { bg: "#1a3a28", border: "#2D7A4F", dot: "#3DAA6A", text: "#3DAA6A",  label: "Selesai" },
  IN_PROGRESS:{ bg: "#3a2510", border: "#C97A2A", dot: "#E8892F", text: "#E8892F",  label: "Sedang Dikerjakan" },
  PENDING:    { bg: "#161D30", border: "#2a3550", dot: "#4a5570", text: "#6b7a99",  label: "Belum Dimulai" },
  REJECTED:   { bg: "#3a1010", border: "#7A2D2D", dot: "#AA3D3D", text: "#DD5555",  label: "Ditolak" },
  REJECT_PENDING: { bg: "#3a2010", border: "#7A4A2D", dot: "#AA6A3D", text: "#DD8855", label: "Pending Review" },
};

const NAV_ITEMS = [
  { id: "beranda",        icon: "🏠", label: "Beranda" },
  { id: "alur-produksi",  icon: "⚙️", label: "Alur Produksi" },
  { id: "order",          icon: "📋", label: "Order" },
  { id: "kalender",       icon: "📅", label: "Kalender" },
  { id: "material",       icon: "🧵", label: "Material" },
  { id: "laporan",        icon: "📊", label: "Laporan" },
  { id: "arsip",          icon: "🗂️", label: "Arsip" },
  { id: "pengaturan",     icon: "⚙️", label: "Pengaturan" },
];

// ── CSS STYLES ───────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Poppins:wght@300;400;500;600&family=Amiri:wght@400;700&display=swap');
  
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  body { background: #0E1320; color: #F5EFE0; font-family: 'Poppins', sans-serif; }
  
  .app { display: flex; height: 100vh; overflow: hidden; background: #0E1320; }
  
  /* ── SIDEBAR ── */
  .sidebar {
    width: 240px; min-width: 240px;
    background: #0B1019;
    border-right: 1px solid rgba(201,168,76,0.15);
    display: flex; flex-direction: column;
    height: 100vh; overflow-y: auto;
    padding: 0;
  }
  .sidebar-logo {
    padding: 24px 20px 20px;
    border-bottom: 1px solid rgba(201,168,76,0.1);
  }
  .sidebar-logo .brand { font-family: 'Playfair Display', serif; font-size: 18px; color: #C9A84C; letter-spacing: 1px; }
  .sidebar-logo .sub { font-size: 10px; color: rgba(245,239,224,0.4); letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
  .sidebar-logo .ornament { font-size: 10px; color: rgba(201,168,76,0.4); }

  .sidebar-nav { flex: 1; padding: 12px 0; }
  .nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 20px;
    cursor: pointer;
    font-size: 13px; font-weight: 400;
    color: rgba(245,239,224,0.55);
    border-left: 3px solid transparent;
    transition: all 0.2s;
    user-select: none;
  }
  .nav-item:hover { color: rgba(245,239,224,0.85); background: rgba(201,168,76,0.06); }
  .nav-item.active {
    color: #E4C875;
    background: rgba(201,168,76,0.1);
    border-left-color: #C9A84C;
    font-weight: 500;
  }
  .nav-item .nav-icon { font-size: 15px; width: 20px; text-align: center; }

  .sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid rgba(201,168,76,0.1);
  }
  .user-card { display: flex; align-items: center; gap: 10px; }
  .user-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, #C9A84C, #8a6020);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 600; color: #0E1320;
    flex-shrink: 0;
  }
  .user-name { font-size: 12px; font-weight: 500; color: #F5EFE0; }
  .user-role { font-size: 10px; color: rgba(245,239,224,0.4); text-transform: uppercase; letter-spacing: 1px; }

  /* ── MAIN ── */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  .topbar {
    height: 60px; min-height: 60px;
    background: #0E1320;
    border-bottom: 1px solid rgba(201,168,76,0.1);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px;
  }
  .topbar-left { display: flex; flex-direction: column; }
  .topbar-greeting { font-size: 13px; font-weight: 500; color: #F5EFE0; }
  .topbar-date { font-size: 11px; color: rgba(245,239,224,0.4); margin-top: 1px; }
  .topbar-right { display: flex; align-items: center; gap: 16px; }
  .topbar-badge {
    position: relative; cursor: pointer;
    font-size: 18px;
    color: rgba(245,239,224,0.5);
  }
  .notif-dot {
    position: absolute; top: -2px; right: -2px;
    width: 7px; height: 7px; border-radius: 50%;
    background: #C97A2A; border: 1px solid #0E1320;
  }

  /* ── PAGE ── */
  .page { flex: 1; overflow-y: auto; padding: 28px; }

  /* ── HERO ── */
  .hero {
    background: linear-gradient(135deg, #161D30 0%, #1C2438 100%);
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 12px;
    padding: 28px 32px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '✦';
    position: absolute; top: 16px; right: 24px;
    font-size: 40px; color: rgba(201,168,76,0.08);
  }
  .hero-arabic { font-family: 'Amiri', serif; font-size: 18px; color: rgba(201,168,76,0.6); margin-bottom: 6px; }
  .hero-title { font-family: 'Playfair Display', serif; font-size: 26px; color: #F5EFE0; font-weight: 700; }
  .hero-sub { font-size: 13px; color: rgba(245,239,224,0.5); margin-top: 6px; }
  .hero-stats { display: flex; gap: 24px; margin-top: 20px; }
  .hero-stat { text-align: center; }
  .hero-stat-val { font-family: 'Playfair Display', serif; font-size: 22px; color: #C9A84C; font-weight: 700; }
  .hero-stat-lbl { font-size: 10px; color: rgba(245,239,224,0.4); text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

  /* ── CARDS ── */
  .cards-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .cards-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .card {
    background: #161D30;
    border: 1px solid rgba(201,168,76,0.15);
    border-radius: 10px; padding: 20px;
  }
  .card-title { font-size: 11px; color: rgba(245,239,224,0.4); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px; font-weight: 500; }
  .card-gold { color: #C9A84C; }

  /* ── ORDER CARD ── */
  .order-meta { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .order-code { font-family: 'Playfair Display', serif; font-size: 15px; color: #F5EFE0; }
  .order-badge {
    font-size: 10px; padding: 3px 10px; border-radius: 20px; font-weight: 600;
    background: rgba(201,168,76,0.15); color: #C9A84C; border: 1px solid rgba(201,168,76,0.3);
    text-transform: uppercase; letter-spacing: 1px;
  }
  .order-detail { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
  .order-row { display: flex; justify-content: space-between; font-size: 12px; }
  .order-row-key { color: rgba(245,239,224,0.4); }
  .order-row-val { color: #F5EFE0; font-weight: 500; }
  .progress-bar-wrap { margin-top: 14px; }
  .progress-label { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; }
  .progress-label span:first-child { color: rgba(245,239,224,0.5); }
  .progress-label span:last-child { color: #C9A84C; font-weight: 600; }
  .progress-track {
    height: 6px; background: rgba(201,168,76,0.1); border-radius: 3px; overflow: hidden;
  }
  .progress-fill {
    height: 100%; background: linear-gradient(90deg, #C9A84C, #E4C875);
    border-radius: 3px; transition: width 0.8s ease;
  }

  /* ── STEPS TIMELINE ── */
  .steps-title { font-family: 'Playfair Display', serif; font-size: 18px; color: #F5EFE0; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
  .steps-title .ornament { color: #C9A84C; font-size: 14px; }

  .step-card {
    background: #161D30;
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 10px;
    display: flex; align-items: flex-start; gap: 14px;
    border-left: 3px solid transparent;
    border: 1px solid rgba(201,168,76,0.1);
    transition: all 0.2s;
    position: relative;
  }
  .step-card.COMPLETED  { border-left-color: #2D7A4F; background: #11231a; }
  .step-card.IN_PROGRESS{ border-left-color: #C97A2A; background: #1d1509; }
  .step-card.PENDING    { border-left-color: rgba(201,168,76,0.08); opacity: 0.75; }

  .step-num {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; flex-shrink: 0;
  }
  .step-num.COMPLETED   { background: #2D7A4F; color: #fff; }
  .step-num.IN_PROGRESS { background: #C97A2A; color: #fff; }
  .step-num.PENDING     { background: rgba(201,168,76,0.08); color: rgba(245,239,224,0.3); border: 1px solid rgba(201,168,76,0.15); }

  .step-info { flex: 1; }
  .step-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .step-label { font-size: 13px; font-weight: 600; color: #F5EFE0; }
  .step-label.PENDING { color: rgba(245,239,224,0.4); }
  .step-status-badge {
    font-size: 10px; padding: 2px 8px; border-radius: 12px;
    font-weight: 600; letter-spacing: 0.5px; flex-shrink: 0;
  }
  .step-desc { font-size: 11px; color: rgba(245,239,224,0.4); margin-top: 3px; }
  .step-meta { font-size: 11px; color: rgba(245,239,224,0.35); margin-top: 6px; display: flex; gap: 14px; }
  .step-meta-item { display: flex; align-items: center; gap: 4px; }
  .step-notes {
    font-size: 11px; color: rgba(245,239,224,0.55);
    background: rgba(201,168,76,0.06); border-radius: 6px;
    padding: 6px 10px; margin-top: 8px;
    border-left: 2px solid rgba(201,168,76,0.25);
  }

  /* ── SECTION HEADER ── */
  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .section-title { font-family: 'Playfair Display', serif; font-size: 17px; color: #F5EFE0; }
  .section-sub { font-size: 11px; color: rgba(245,239,224,0.35); margin-top: 2px; }
  .btn-ghost {
    font-size: 11px; color: #C9A84C; background: none; border: 1px solid rgba(201,168,76,0.3);
    padding: 5px 12px; border-radius: 6px; cursor: pointer; font-family: 'Poppins', sans-serif;
    transition: all 0.2s;
  }
  .btn-ghost:hover { background: rgba(201,168,76,0.1); }

  /* ── TABLE ── */
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th {
    text-align: left; font-size: 10px; font-weight: 600;
    color: rgba(245,239,224,0.35); text-transform: uppercase; letter-spacing: 1.5px;
    padding: 10px 14px; border-bottom: 1px solid rgba(201,168,76,0.1);
  }
  .data-table td { padding: 12px 14px; font-size: 12px; border-bottom: 1px solid rgba(201,168,76,0.05); }
  .data-table tr:hover td { background: rgba(201,168,76,0.04); }
  .data-table .order-code-cell { font-weight: 600; color: #C9A84C; font-family: monospace; font-size: 11px; }

  /* ── STATUS LEGEND ── */
  .legend { display: flex; gap: 20px; flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 7px; font-size: 12px; color: rgba(245,239,224,0.6); }
  .legend-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

  /* ── QUICK ACTIONS ── */
  .quick-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .qa-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px; border-radius: 8px; cursor: pointer;
    font-size: 12px; font-weight: 500; font-family: 'Poppins', sans-serif;
    border: 1px solid rgba(201,168,76,0.25); color: #F5EFE0;
    background: rgba(201,168,76,0.06); transition: all 0.2s;
  }
  .qa-btn:hover { background: rgba(201,168,76,0.14); border-color: rgba(201,168,76,0.4); }
  .qa-btn.primary { background: rgba(201,168,76,0.18); border-color: #C9A84C; color: #E4C875; }

  /* ── CALENDAR ── */
  .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
  .cal-day-header { text-align: center; font-size: 10px; color: rgba(245,239,224,0.35); padding: 8px 4px; text-transform: uppercase; letter-spacing: 1px; }
  .cal-day {
    aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
    font-size: 12px; border-radius: 6px; cursor: pointer;
    color: rgba(245,239,224,0.5); transition: all 0.2s;
  }
  .cal-day:hover { background: rgba(201,168,76,0.1); color: #F5EFE0; }
  .cal-day.today { background: rgba(201,168,76,0.15); color: #C9A84C; font-weight: 700; border: 1px solid rgba(201,168,76,0.3); }
  .cal-day.has-event { color: #F5EFE0; font-weight: 600; }
  .cal-day.has-event::after { content: ''; display: block; width: 4px; height: 4px; border-radius: 50%; background: #C9A84C; margin: 1px auto 0; }
  .cal-day.empty { opacity: 0; pointer-events: none; }

  /* ── MATERIAL ── */
  .material-card {
    background: #161D30; border: 1px solid rgba(201,168,76,0.1);
    border-radius: 10px; padding: 16px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .material-info .material-name { font-size: 13px; font-weight: 600; color: #F5EFE0; }
  .material-info .material-code { font-size: 10px; color: rgba(245,239,224,0.35); margin-top: 2px; font-family: monospace; }
  .material-stock {
    text-align: right;
  }
  .material-stock .stock-val { font-family: 'Playfair Display', serif; font-size: 20px; color: #C9A84C; font-weight: 700; }
  .material-stock .stock-unit { font-size: 10px; color: rgba(245,239,224,0.35); }
  .stock-bar-wrap { margin-top: 8px; }
  .stock-bar { height: 3px; background: rgba(201,168,76,0.08); border-radius: 2px; overflow: hidden; }
  .stock-bar-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #C9A84C, #E4C875); }

  /* ── LAPORAN / CHART ── */
  .report-metric { text-align: center; padding: 16px; }
  .report-metric .metric-val { font-family: 'Playfair Display', serif; font-size: 32px; color: #C9A84C; font-weight: 700; }
  .report-metric .metric-lbl { font-size: 11px; color: rgba(245,239,224,0.4); margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .report-metric .metric-delta { font-size: 11px; margin-top: 6px; color: #3DAA6A; }

  /* ── SETTINGS ── */
  .setting-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 0; border-bottom: 1px solid rgba(201,168,76,0.07);
  }
  .setting-label { font-size: 13px; color: #F5EFE0; }
  .setting-sub { font-size: 11px; color: rgba(245,239,224,0.35); margin-top: 2px; }
  .toggle {
    width: 40px; height: 22px; border-radius: 11px;
    background: rgba(201,168,76,0.2); position: relative; cursor: pointer;
    border: 1px solid rgba(201,168,76,0.2); transition: background 0.2s;
  }
  .toggle.on { background: #C9A84C; }
  .toggle-thumb {
    position: absolute; top: 2px; left: 2px;
    width: 16px; height: 16px; border-radius: 50%; background: white;
    transition: left 0.2s;
  }
  .toggle.on .toggle-thumb { left: 20px; }

  /* ── ARSIP ── */
  .arsip-item {
    background: #161D30; border: 1px solid rgba(201,168,76,0.08);
    border-radius: 8px; padding: 14px 16px; opacity: 0.7;
    display: flex; justify-content: space-between; align-items: center;
  }
  .arsip-item:hover { opacity: 0.9; background: rgba(201,168,76,0.05); }

  /* ── LOADING ── */
  .loading { display: flex; align-items: center; justify-content: center; padding: 40px; }
  .loading-spin {
    width: 24px; height: 24px; border: 2px solid rgba(201,168,76,0.2);
    border-top-color: #C9A84C; border-radius: 50%; animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── QUOTE ── */
  .quote-block {
    background: linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02));
    border: 1px solid rgba(201,168,76,0.15); border-radius: 10px;
    padding: 20px 24px; text-align: center; margin-top: 20px;
  }
  .quote-arabic { font-family: 'Amiri', serif; font-size: 20px; color: #C9A84C; margin-bottom: 8px; direction: rtl; }
  .quote-trans { font-size: 11px; color: rgba(245,239,224,0.45); font-style: italic; }
  .quote-src { font-size: 10px; color: rgba(201,168,76,0.5); margin-top: 6px; text-transform: uppercase; letter-spacing: 1px; }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.15); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.3); }

  /* ── EMPTY STATE ── */
  .empty-state { text-align: center; padding: 48px 24px; }
  .empty-state .empty-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.4; }
  .empty-state p { font-size: 13px; color: rgba(245,239,224,0.35); }
`;

// ── PAGES ────────────────────────────────────────────────────────

function PageBeranda({ orders, steps, loading }) {
  const activeOrder = orders.find(o => o.order_status === "ACTIVE") || orders[0];
  const activeSteps = steps.filter(s => s.order_id === activeOrder?.id);
  const completedCount = activeSteps.filter(s => s.status === "COMPLETED").length;
  const totalSteps = 9;
  const pct = Math.round((completedCount / totalSteps) * 100);
  const currentStepInfo = STEPS.find(s => activeOrder?.current_step === s.code);

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const deadline = activeOrder?.deadline ? new Date(activeOrder.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "5 Juli 2026";

  if (loading) return <div className="loading"><div className="loading-spin"/></div>;

  return (
    <>
      <div className="hero">
        <div className="hero-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <div className="hero-title">Assalamu'alaikum, Deka ✦</div>
        <div className="hero-sub">Hari ini {today} — Semoga Allah mudahkan setiap langkah produksi.</div>
        <div className="hero-stats">
          <div className="hero-stat"><div className="hero-stat-val">{orders.length}</div><div className="hero-stat-lbl">Total Order</div></div>
          <div className="hero-stat"><div className="hero-stat-val">{orders.filter(o=>o.order_status==="ACTIVE").length}</div><div className="hero-stat-lbl">Aktif</div></div>
          <div className="hero-stat"><div className="hero-stat-val">{orders.filter(o=>o.order_status==="COMPLETED").length}</div><div className="hero-stat-lbl">Selesai</div></div>
          <div className="hero-stat"><div className="hero-stat-val">{pct}%</div><div className="hero-stat-lbl">Progress</div></div>
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
              <div className="order-row"><span className="order-row-key">Step Saat Ini</span><span className="order-row-val">{currentStepInfo?.icon} {currentStepInfo?.label || activeOrder.current_step}</span></div>
              <div className="order-row"><span className="order-row-key">Deadline</span><span className="order-row-val" style={{color:"#E8892F"}}>{deadline}</span></div>
              <div className="order-row"><span className="order-row-key">Pembayaran</span><span className="order-row-val">{activeOrder.payment_status === "dp" ? "DP" : "Lunas"}</span></div>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-label"><span>Progress Produksi</span><span>{completedCount}/{totalSteps} Step</span></div>
              <div className="progress-track"><div className="progress-fill" style={{width:`${pct}%`}}/></div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Aksi Cepat</div>
            <div className="quick-actions" style={{flexDirection:"column"}}>
              <button className="qa-btn primary">📋 Lihat Alur Produksi</button>
              <button className="qa-btn">📸 Upload Foto Step</button>
              <button className="qa-btn">✅ Update Status Step</button>
              <button className="qa-btn">🔍 Scan QR Order</button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{marginBottom:"20px"}}>
        <div className="section-header">
          <div><div className="section-title">Status Legend</div></div>
        </div>
        <div className="legend">
          {Object.entries(STATUS_COLOR).map(([k,v]) => (
            <div key={k} className="legend-item">
              <div className="legend-dot" style={{background:v.dot}}/>
              {v.label}
            </div>
          ))}
        </div>
      </div>

      <div className="quote-block">
        <div className="quote-arabic">وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ</div>
        <div className="quote-trans">"Katakanlah: Bekerjalah kamu, maka Allah akan melihat pekerjaanmu..."</div>
        <div className="quote-src">QS. At-Taubah: 105</div>
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
        <div>
          <div className="section-title">⚙️ Alur Produksi</div>
          <div className="section-sub">9-step production workflow tracking</div>
        </div>
        {orders.length > 1 && (
          <select
            style={{background:"#161D30",border:"1px solid rgba(201,168,76,0.2)",color:"#F5EFE0",padding:"6px 12px",borderRadius:"6px",fontSize:"12px"}}
            value={selectedOrder?.id || ""}
            onChange={e => setSelectedOrder(orders.find(o=>o.id===e.target.value))}
          >
            {orders.map(o => <option key={o.id} value={o.id}>{o.order_code}</option>)}
          </select>
        )}
      </div>

      {selectedOrder && (
        <div className="card" style={{marginBottom:"16px"}}>
          <div className="order-meta">
            <div className="order-code">{selectedOrder.order_code}</div>
            <div className="order-badge">{selectedOrder.order_status}</div>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-label"><span>Progress: {completedCount} dari 9 Step Selesai</span><span>{pct}%</span></div>
            <div className="progress-track"><div className="progress-fill" style={{width:`${pct}%`}}/></div>
          </div>
        </div>
      )}

      <div className="steps-title">
        <span className="ornament">✦</span>
        Alur Produksi Detail
        <span className="ornament">✦</span>
      </div>

      {STEPS.map((step, i) => {
        const data = orderSteps.find(s => s.step === step.code);
        const status = data?.status || "PENDING";
        const sc = STATUS_COLOR[status] || STATUS_COLOR.PENDING;
        const handledBy = data?.handled_by_name || (status !== "PENDING" ? "Deka" : null);

        return (
          <div key={step.code} className={`step-card ${status}`}>
            <div className={`step-num ${status}`}>
              {status === "COMPLETED" ? "✓" : status === "IN_PROGRESS" ? "●" : i+1}
            </div>
            <div className="step-info">
              <div className="step-header">
                <div className="step-label" style={{color: status==="PENDING" ? "rgba(245,239,224,0.35)" : "#F5EFE0"}}>
                  {step.icon} {step.label}
                </div>
                <div className="step-status-badge" style={{background:sc.bg,color:sc.text,border:`1px solid ${sc.border}`}}>
                  {sc.label}
                </div>
              </div>
              <div className="step-desc">{step.desc}</div>
              {(data?.started_at || data?.completed_at || handledBy) && (
                <div className="step-meta">
                  {handledBy && <span className="step-meta-item">👤 {handledBy}</span>}
                  {data?.started_at && <span className="step-meta-item">🕐 Mulai: {new Date(data.started_at).toLocaleDateString("id-ID")}</span>}
                  {data?.completed_at && <span className="step-meta-item">✓ Selesai: {new Date(data.completed_at).toLocaleDateString("id-ID")}</span>}
                </div>
              )}
              {data?.notes && <div className="step-notes">📝 {data.notes}</div>}
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
      <div className="section-header">
        <div><div className="section-title">📋 Daftar Order</div><div className="section-sub">{orders.length} order ditemukan</div></div>
        <button className="btn-ghost">+ Order Baru</button>
      </div>
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order Code</th>
              <th>Customer</th>
              <th>Step Aktif</th>
              <th>Status</th>
              <th>Deadline</th>
              <th>Pembayaran</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => {
              const step = STEPS.find(s=>s.code===o.current_step);
              return (
                <tr key={o.id}>
                  <td className="order-code-cell">{o.order_code}</td>
                  <td style={{color:"#F5EFE0"}}>{o.customers?.name || "—"}</td>
                  <td style={{color:"rgba(245,239,224,0.6)"}}>{step?.icon} {step?.label || o.current_step || "—"}</td>
                  <td>
                    <span style={{
                      fontSize:"10px",padding:"2px 8px",borderRadius:"10px",fontWeight:600,
                      background: o.order_status==="ACTIVE" ? "rgba(201,168,76,0.15)" : "rgba(45,122,79,0.15)",
                      color: o.order_status==="ACTIVE" ? "#C9A84C" : "#3DAA6A",
                      border: `1px solid ${o.order_status==="ACTIVE" ? "rgba(201,168,76,0.3)" : "rgba(45,122,79,0.3)"}`
                    }}>
                      {o.order_status}
                    </span>
                  </td>
                  <td style={{color:o.deadline && new Date(o.deadline)<new Date() ? "#DD5555" : "rgba(245,239,224,0.6)"}}>
                    {o.deadline ? new Date(o.deadline).toLocaleDateString("id-ID") : "—"}
                  </td>
                  <td style={{color:"rgba(245,239,224,0.6)",textTransform:"uppercase",fontSize:"11px"}}>{o.payment_status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 && <div className="empty-state"><div className="empty-icon">📋</div><p>Belum ada order</p></div>}
      </div>
    </>
  );
}

function PageKalender({ orders }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const monthName = today.toLocaleDateString("id-ID", {month:"long",year:"numeric"});
  const days = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

  const eventDays = orders
    .filter(o => o.deadline)
    .map(o => new Date(o.deadline).getDate());

  return (
    <>
      <div className="section-header">
        <div><div className="section-title">📅 Kalender Produksi</div><div className="section-sub">{monthName}</div></div>
      </div>
      <div className="cards-row">
        <div className="card">
          <div className="calendar-grid">
            {days.map(d => <div key={d} className="cal-day-header">{d}</div>)}
            {Array.from({length:firstDay}).map((_,i) => <div key={`e${i}`} className="cal-day empty">0</div>)}
            {Array.from({length:daysInMonth}).map((_,i) => {
              const d = i+1;
              const isToday = d === today.getDate();
              const hasEvent = eventDays.includes(d);
              return <div key={d} className={`cal-day${isToday?" today":""}${hasEvent?" has-event":""}`}>{d}</div>;
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Deadline Order</div>
          {orders.filter(o=>o.deadline).map(o=>(
            <div key={o.id} style={{padding:"10px 0",borderBottom:"1px solid rgba(201,168,76,0.07)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:"12px",fontWeight:600,color:"#C9A84C",fontFamily:"monospace"}}>{o.order_code}</span>
                <span style={{fontSize:"11px",color:"rgba(245,239,224,0.5)"}}>
                  {new Date(o.deadline).toLocaleDateString("id-ID",{day:"numeric",month:"short"})}
                </span>
              </div>
              <div style={{fontSize:"11px",color:"rgba(245,239,224,0.35)",marginTop:3}}>{o.customers?.name || "—"}</div>
            </div>
          ))}
          {orders.filter(o=>o.deadline).length === 0 && <div className="empty-state"><div className="empty-icon">📅</div><p>Tidak ada deadline bulan ini</p></div>}
        </div>
      </div>
    </>
  );
}

function PageMaterial() {
  const materials = [
    { name:"VB Wool Dourmil", code:"WD-001", color:"Slate Blue 008", stock:12, max:20 },
    { name:"Premium Cotton Poplin", code:"CP-002", color:"Ivory White", stock:8, max:20 },
    { name:"Japanese Linen Blend", code:"JL-003", color:"Sand Beige", stock:3, max:15 },
    { name:"Italian Cashmere Wool", code:"CW-004", color:"Charcoal Grey", stock:6, max:10 },
    { name:"Egyptian Cotton Premium", code:"EC-005", color:"Classic White", stock:15, max:20 },
  ];
  return (
    <>
      <div className="section-header">
        <div><div className="section-title">🧵 Inventori Material</div><div className="section-sub">{materials.length} jenis material terdaftar</div></div>
        <button className="btn-ghost">+ Tambah Material</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
        {materials.map(m=>(
          <div key={m.code} className="material-card">
            <div className="material-info">
              <div className="material-name">{m.name}</div>
              <div className="material-code">{m.code} · {m.color}</div>
              <div className="stock-bar-wrap" style={{marginTop:8,width:160}}>
                <div className="stock-bar"><div className="stock-bar-fill" style={{width:`${(m.stock/m.max)*100}%`,background:m.stock<4?"#DD5555":m.stock<8?"#E8892F":"linear-gradient(90deg,#C9A84C,#E4C875)"}}/></div>
              </div>
            </div>
            <div className="material-stock">
              <div className="stock-val" style={{color:m.stock<4?"#DD5555":m.stock<8?"#E8892F":"#C9A84C"}}>{m.stock}</div>
              <div className="stock-unit">meter tersisa</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PageLaporan({ orders, steps }) {
  const completed = steps.filter(s=>s.status==="COMPLETED").length;
  const active = orders.filter(o=>o.order_status==="ACTIVE").length;
  return (
    <>
      <div className="section-header">
        <div><div className="section-title">📊 Laporan Produksi</div><div className="section-sub">Overview performa bulan ini</div></div>
        <button className="btn-ghost">Export PDF</button>
      </div>
      <div className="cards-row-3">
        {[
          {val:orders.length,lbl:"Total Order",delta:"+2 bulan ini"},
          {val:completed,lbl:"Step Selesai",delta:"dari total "+steps.length},
          {val:active,lbl:"Order Aktif",delta:"sedang proses"},
        ].map(m=>(
          <div key={m.lbl} className="card">
            <div className="report-metric">
              <div className="metric-val">{m.val}</div>
              <div className="metric-lbl">{m.lbl}</div>
              <div className="metric-delta">{m.delta}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-title">Distribusi Status Step — LT-LOCAL-DEKA-001</div>
        <div style={{padding:"16px 0"}}>
          {Object.entries(STATUS_COLOR).map(([status,sc])=>{
            const count = steps.filter(s=>s.status===status).length;
            if(!count) return null;
            return (
              <div key={status} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:4}}>
                  <span style={{color:"rgba(245,239,224,0.6)"}}>{sc.label}</span>
                  <span style={{color:sc.text,fontWeight:600}}>{count} step</span>
                </div>
                <div style={{height:6,background:"rgba(201,168,76,0.06)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(count/9)*100}%`,background:sc.dot,borderRadius:3}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function PageArsip() {
  const arsipData = [
    { code:"LT-2025-001", customer:"Ahmad Farid", model:"Classic Thobe", selesai:"12 Des 2025" },
    { code:"LT-2025-002", customer:"Hendra Wijaya", model:"Slim Fit Bisht", selesai:"28 Des 2025" },
    { code:"LT-2025-003", customer:"Rizky Maulana", model:"Premium Koko", selesai:"3 Jan 2026" },
  ];
  return (
    <>
      <div className="section-header">
        <div><div className="section-title">🗂️ Arsip Order</div><div className="section-sub">{arsipData.length} order selesai diarsipkan</div></div>
        <button className="btn-ghost">Export Arsip</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {arsipData.map(a=>(
          <div key={a.code} className="arsip-item">
            <div>
              <div style={{fontSize:"12px",fontWeight:600,color:"#C9A84C",fontFamily:"monospace"}}>{a.code}</div>
              <div style={{fontSize:"12px",color:"rgba(245,239,224,0.7)",marginTop:3}}>{a.customer} — {a.model}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:"10px",color:"rgba(245,239,224,0.3)",textTransform:"uppercase",letterSpacing:1}}>Selesai</div>
              <div style={{fontSize:"12px",color:"rgba(245,239,224,0.5)",marginTop:2}}>{a.selesai}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PagePengaturan() {
  const [toggles, setToggles] = useState({ notif:true, darkmode:true, qr:true, backup:false });
  const toggle = k => setToggles(p=>({...p,[k]:!p[k]}));
  const settings = [
    {key:"notif", label:"Notifikasi WhatsApp", sub:"Kirim update status ke customer via WA"},
    {key:"darkmode", label:"Dark Mode", sub:"Tema gelap navy (aktif)"},
    {key:"qr", label:"QR Tracking Aktif", sub:"Aktifkan scan QR untuk update step"},
    {key:"backup", label:"Auto Backup Harian", sub:"Backup database ke cloud setiap malam"},
  ];
  return (
    <>
      <div className="section-header">
        <div><div className="section-title">⚙️ Pengaturan</div><div className="section-sub">Konfigurasi sistem Local Tailor</div></div>
      </div>
      <div className="card" style={{marginBottom:16}}>
        <div className="card-title">Profil Studio</div>
        <div className="setting-row">
          <div><div className="setting-label">Local Tailor — Bandung</div><div className="setting-sub">ID Studio: LT-BANDUNG-001</div></div>
          <button className="btn-ghost">Edit</button>
        </div>
        <div className="setting-row">
          <div><div className="setting-label">Artisan Aktif</div><div className="setting-sub">Teja, Teten, Rafli, Deka</div></div>
          <button className="btn-ghost">Kelola</button>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Preferensi Sistem</div>
        {settings.map(s=>(
          <div key={s.key} className="setting-row">
            <div><div className="setting-label">{s.label}</div><div className="setting-sub">{s.sub}</div></div>
            <div className={`toggle ${toggles[s.key]?"on":""}`} onClick={()=>toggle(s.key)}>
              <div className="toggle-thumb"/>
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{marginTop:16}}>
        <div className="card-title">Supabase Connection</div>
        <div className="setting-row">
          <div><div className="setting-label">Project</div><div className="setting-sub">wauilgumyskdsrhvnlwq · ap-southeast-1</div></div>
          <span style={{fontSize:"11px",color:"#3DAA6A",background:"rgba(45,122,79,0.15)",padding:"3px 10px",borderRadius:10,border:"1px solid rgba(45,122,79,0.3)"}}>● Connected</span>
        </div>
        <div className="setting-row">
          <div><div className="setting-label">Database Status</div><div className="setting-sub">PostgreSQL 17.6.1 — ACTIVE_HEALTHY</div></div>
          <span style={{fontSize:"11px",color:"#3DAA6A",background:"rgba(45,122,79,0.15)",padding:"3px 10px",borderRadius:10,border:"1px solid rgba(45,122,79,0.3)"}}>● Healthy</span>
        </div>
      </div>
    </>
  );
}

// ── APP ROOT ─────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("beranda");
  const [orders, setOrders] = useState([]);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

      const enrichedSteps = stepsData.map(s => ({
        ...s,
        handled_by_name: s.handled_by ? userMap[s.handled_by] : null,
      }));

      // Deduplicate steps: take the latest per order_id+step combo
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
  const dateStr = now.toLocaleDateString("id-ID", {weekday:"long",day:"numeric",month:"long"});

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
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="ornament">✦ ◆ ✦</div>
            <div className="brand">LOCAL TAILOR</div>
            <div className="sub">Production System</div>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map(item => (
              <div
                key={item.id}
                className={`nav-item ${page === item.id ? "active" : ""}`}
                onClick={() => setPage(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">DK</div>
              <div>
                <div className="user-name">Deka Kurniawan</div>
                <div className="user-role">PIC Usaha</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="main">
          {/* TOPBAR */}
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-greeting">
                {NAV_ITEMS.find(n=>n.id===page)?.icon} {NAV_ITEMS.find(n=>n.id===page)?.label || "Beranda"}
              </div>
              <div className="topbar-date">{dateStr} · {timeStr}</div>
            </div>
            <div className="topbar-right">
              <div className="topbar-badge">
                🔔
                <div className="notif-dot"/>
              </div>
              <div className="topbar-badge" onClick={fetchData} title="Refresh data" style={{cursor:"pointer",fontSize:16}}>🔄</div>
              <div className="user-avatar" style={{width:32,height:32,fontSize:12}}>DK</div>
            </div>
          </div>

          {/* PAGE CONTENT */}
          <div className="page">
            {pages[page]}
          </div>
        </div>
      </div>
    </>
  );
}
