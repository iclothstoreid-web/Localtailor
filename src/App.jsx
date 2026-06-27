import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

function App() {
  const [orders, setOrders] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showMeasurements, setShowMeasurements] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('order_status', 'ACTIVE')
        .order('created_at', { ascending: false })

      const { data: customersData } = await supabase
        .from('customers')
        .select('*')

      const { data: fittingsData } = await supabase
        .from('order_fitting')
        .select('*')

      const custMap = {}
      const fitMap = {}

      customersData?.forEach(c => { custMap[c.id] = c })
      fittingsData?.forEach(f => { fitMap[f.order_id] = f })

      const merged = ordersData?.map(o => ({
        ...o,
        customers: custMap[o.customer_id],
        order_fitting: fitMap[o.id]
      })) || []

      setOrders(merged)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{color: '#F2EDD7', padding: '20px', textAlign: 'center'}}>Loading...</div>
  if (orders.length === 0) return <div style={{color: '#F2EDD7', padding: '20px', textAlign: 'center'}}>No orders</div>

  const order = orders[currentIdx]
  const customer = order.customers || {}
  const fitting = order.order_fitting || {}

  const handleNext = () => setCurrentIdx((currentIdx + 1) % orders.length)
  const handlePrev = () => setCurrentIdx((currentIdx - 1 + orders.length) % orders.length)

  return (
    <div className="app">
      <header>
        <h1>LOCAL TAILOR</h1>
        <p>Production Tracking</p>
      </header>

      <main>
        <div className="order-detail">
          <div className="customer-header">
            <h2>{customer.name || 'N/A'}</h2>
            <p>{customer.phone || 'N/A'}</p>
            <p className="small">{customer.address || 'N/A'}</p>
            <p className="order-code">{order.order_code}</p>
          </div>

          <div className="steps-container">
            {/* FITTING */}
            <div className="production-step active">
              <div className="step-header" onClick={() => setShowMeasurements(!showMeasurements)}>
                <span className="step-icon">●</span>
                <span className="step-name">FITTING</span>
                <span className="expand-icon">{showMeasurements ? '▼' : '▶'}</span>
              </div>
              {showMeasurements && (
                <div className="step-details">
                  <p><strong>Collar:</strong> {fitting.lingkar_leher || '—'}cm</p>
                  <p><strong>Cuff:</strong> {fitting.lingkar_pergelangan || '—'}cm</p>
                  <p><strong>Chest:</strong> {fitting.lingkar_dada || '—'}cm</p>
                  <p><strong>Length:</strong> {fitting.panjang_baju || '—'}cm</p>
                </div>
              )}
            </div>

            {/* FORMULASI & POLA */}
            <div className="production-step">
              <div className="step-header">
                <span className="step-icon">○</span>
                <span className="step-name">FORMULASI & POLA</span>
              </div>
              <div className="step-details">
                <p><strong>Material:</strong> {fitting.kode_bahan || 'TBD'}</p>
                <p><strong>Color:</strong> {fitting.kode_warna || 'TBD'}</p>
              </div>
            </div>

            {/* CUTTING */}
            <div className="production-step">
              <div className="step-header">
                <span className="step-icon">○</span>
                <span className="step-name">CUTTING</span>
              </div>
            </div>

            {/* SEWING */}
            <div className="production-step">
              <div className="step-header">
                <span className="step-icon">○</span>
                <span className="step-name">SEWING</span>
              </div>
            </div>

            {/* QC */}
            <div className="production-step">
              <div className="step-header">
                <span className="step-icon">○</span>
                <span className="step-name">QC</span>
              </div>
            </div>

            {/* PACKING */}
            <div className="production-step">
              <div className="step-header">
                <span className="step-icon">○</span>
                <span className="step-name">PACKING</span>
              </div>
            </div>

            {/* SHIPPING */}
            <div className="production-step">
              <div className="step-header">
                <span className="step-icon">○</span>
                <span className="step-name">SHIPPING</span>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-scan" onClick={() => alert(`Scan: ${order.order_code}`)}>📱 SCAN QR</button>
          </div>

          <div className="navigation">
            <button onClick={handlePrev} className="btn-nav">← PREV</button>
            <span className="order-count">{currentIdx + 1} / {orders.length}</span>
            <button onClick={handleNext} className="btn-nav">NEXT →</button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
