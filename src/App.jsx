import { useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

function App() {
  const [orders, setOrders] = useState([])
  const [currentOrderIdx, setCurrentOrderIdx] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch orders on mount
  useState(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('id, order_code, current_step, customer_id, created_at')
          .eq('order_status', 'ACTIVE')
          .order('created_at', { ascending: false })

        if (data && data.length > 0) {
          const customerIds = [...new Set(data.map(o => o.customer_id))]
          const orderIds = [...new Set(data.map(o => o.id))]

          const { data: customersData } = await supabase
            .from('customers')
            .select('id, name, phone, address')
            .in('id', customerIds)

          const { data: fittingsData } = await supabase
            .from('order_fitting')
            .select('order_id, kode_bahan, kode_warna, lingkar_leher, lingkar_pergelangan, lingkar_dada, panjang_baju')
            .in('order_id', orderIds)

          const customersMap = {}
          const fittingsMap = {}

          customersData?.forEach(c => { customersMap[c.id] = c })
          fittingsData?.forEach(f => { fittingsMap[f.order_id] = f })

          const enriched = data.map(o => ({
            ...o,
            customers: customersMap[o.customer_id],
            order_fitting: fittingsMap[o.id]
          }))

          setOrders(enriched)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  if (loading) return <div style={{color: '#F2EDD7', padding: '20px', textAlign: 'center'}}>Loading...</div>
  if (orders.length === 0) return <div style={{color: '#F2EDD7', padding: '20px', textAlign: 'center'}}>No orders</div>

  const order = orders[currentOrderIdx]
  const fitting = order.order_fitting || {}
  const customer = order.customers || {}

  const steps = [
    { name: 'FITTING', code: 'FITTING' },
    { name: 'FORMULASI & POLA', code: 'MATERIAL_CONFIRMATION' },
    { name: 'CUTTING', code: 'CUTTING' },
    { name: 'SEWING', code: 'OPERATOR' },
    { name: 'QC', code: 'QC_TEKNIS' },
    { name: 'PACKING', code: 'PACKING' },
    { name: 'SHIPPING', code: 'SHIPPED' }
  ]

  const stepOrder = ['FITTING', 'MATERIAL_CONFIRMATION', 'CUTTING', 'OPERATOR', 'QC_TEKNIS', 'PACKING', 'SHIPPED']
  const currentStepIdx = stepOrder.indexOf(order.current_step)

  return (
    <div className="app">
      <header>
        <h1>LOCAL TAILOR</h1>
        <p>Production Tracking</p>
      </header>

      <main>
        <OrderDetailView 
          order={order}
          customer={customer}
          fitting={fitting}
          steps={steps}
          currentStepIdx={currentStepIdx}
          onNext={() => setCurrentOrderIdx((currentOrderIdx + 1) % orders.length)}
          onPrev={() => setCurrentOrderIdx((currentOrderIdx - 1 + orders.length) % orders.length)}
          totalOrders={orders.length}
          currentOrder={currentOrderIdx + 1}
        />
      </main>
    </div>
  )
}

function OrderDetailView({ order, customer, fitting, steps, currentStepIdx, onNext, onPrev, totalOrders, currentOrder }) {
  const [expandFitting, setExpandFitting] = useState(false)

  const handleScan = () => {
    alert(`Scan QR for: ${order.order_code}`)
  }

  return (
    <div className="order-detail">
      {/* Header */}
      <div className="customer-header">
        <h2>{customer.name}</h2>
        <p>{customer.phone}</p>
        <p className="small">{customer.address}</p>
        <p className="order-code">{order.order_code}</p>
      </div>

      {/* Production Steps */}
      <div className="steps-container">
        {steps.map((step, idx) => (
          <ProductionStep
            key={step.code}
            step={step}
            isActive={idx === currentStepIdx}
            isCompleted={idx < currentStepIdx}
            expanded={step.code === 'FITTING' && expandFitting}
            onToggle={() => step.code === 'FITTING' && setExpandFitting(!expandFitting)}
            fitting={step.code === 'FITTING' ? fitting : null}
            material={step.code === 'MATERIAL_CONFIRMATION' ? fitting : null}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn-scan" onClick={handleScan}>📱 SCAN QR</button>
      </div>

      {/* Navigation */}
      <div className="navigation">
        <button onClick={onPrev} className="btn-nav">← PREV</button>
        <span className="order-count">{currentOrder} / {totalOrders}</span>
        <button onClick={onNext} className="btn-nav">NEXT →</button>
      </div>
    </div>
  )
}
function ProductionStep({ step, isActive, isCompleted, expanded, onToggle, fitting, material }) {
  const statusIcon = isCompleted ? '✓' : isActive ? '●' : '○'
  const statusClass = isCompleted ? 'completed' : isActive ? 'active' : ''

  return (
    <div className={`production-step ${statusClass}`}>
      <div className="step-header" onClick={onToggle}>
        <span className="step-icon">{statusIcon}</span>
        <span className="step-name">{step.name}</span>
        {(step.code === 'FITTING' || step.code === 'MATERIAL_CONFIRMATION') && <span className="expand-icon">{expanded ? '▼' : '▶'}</span>}
      </div>

      {/* FITTING Details — expanded */}
      {expanded && step.code === 'FITTING' && fitting && (
        <div className="step-details">
          <p><strong>Collar:</strong> {fitting.lingkar_leher || '—'}cm</p>
          <p><strong>Cuff:</strong> {fitting.lingkar_pergelangan || '—'}cm</p>
          <p><strong>Chest:</strong> {fitting.lingkar_dada || '—'}cm</p>
          <p><strong>Length:</strong> {fitting.panjang_baju || '—'}cm</p>
        </div>
      )}

      {/* FORMULASI & POLA Details — ALWAYS show material, even when not active */}
      {step.code === 'MATERIAL_CONFIRMATION' && material && (
        <div className="step-details">
          <p><strong>Material:</strong> {material.kode_bahan || 'TBD'}</p>
          <p><strong>Color:</strong> {material.kode_warna || 'TBD'}</p>
        </div>
      )}
    </div>
  )
}
