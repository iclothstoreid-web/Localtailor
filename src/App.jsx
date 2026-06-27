import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    setUserRole('tailor')
    setUser({ id: 'demo-user', name: 'Teja' })
  }

  useEffect(() => {
    if (userRole) {
      fetchOrders()
    }
  }, [userRole])

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .select('*, customers(name, phone, address), order_fitting(kode_bahan, kode_warna)')
        .eq('order_status', 'ACTIVE')
        .order('created_at', { ascending: false })

      if (err) {
        console.error('Supabase error:', err)
        setError(err.message)
        return
      }

      console.log('Orders fetched:', data)
      setOrders(data || [])
    } catch (error) {
      console.error('Error:', error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleScan = (orderId, orderCode) => {
    console.log('Scan clicked for:', orderId, orderCode)
    alert(`QR Scan initiated for: ${orderCode}\n\nProduction step will update in next phase.`)
  }

  const getStepIndex = (currentStep) => {
    const steps = ['FITTING', 'MATERIAL_CONFIRMATION', 'CUTTING', 'OPERATOR', 'QC_TEKNIS', 'FINISHING', 'PACKING', 'SHIPPED']
    return steps.indexOf(currentStep)
  }

  const steps = ['FITTING', 'MATERIAL', 'CUTTING', 'STITCH', 'QC', 'FINISH', 'PACK', 'SHIP']

  return (
    <div className="app">
      <header>
        <h1>LOCAL PROJECT</h1>
        <p>Production Tracking • {user?.name}</p>
      </header>

      <main>
        {error && <div style={{color: '#FF6B6B', marginBottom: '16px', textAlign: 'center'}}>{error}</div>}
        <TailorDashboard orders={orders} loading={loading} handleScan={handleScan} steps={steps} getStepIndex={getStepIndex} />
      </main>
    </div>
  )
}

function TailorDashboard({ orders, loading, handleScan, steps, getStepIndex }) {
  return (
    <div className="dashboard">
      <h2>📋 PENDING ORDERS</h2>
      {loading ? (
        <p style={{textAlign: 'center', color: '#F2EDD750'}}>Loading orders...</p>
      ) : (
        <div className="order-list">
          {orders.length === 0 ? (
            <div className="empty-state">
              <p>No active orders found</p>
              <p style={{fontSize: '11px', marginTop: '8px'}}>Check Supabase for data</p>
            </div>
          ) : (
            orders.map(order => {
              const stepIdx = getStepIndex(order.current_step)
              return (
                <div key={order.id} className="order-card">
                  <h3>{order.order_code}</h3>
                  <p><strong>Customer:</strong> {order.customers?.name}</p>
                  <p><strong>Phone:</strong> {order.customers?.phone}</p>
                  <p><strong>Material:</strong> {order.order_fitting?.kode_bahan || 'TBD'}</p>
                  <p><strong>Color:</strong> {order.order_fitting?.kode_warna || 'TBD'}</p>
                  
                  <div className="production-steps">
                    {steps.map((step, idx) => (
                      <div key={idx} className={`step ${idx <= stepIdx ? 'active' : ''}`}>
                        {step}
                      </div>
                    ))}
                  </div>

                  <div className="order-status">{order.current_step.replace(/_/g, ' ')}</div>
                  
                  <button 
                    className="btn-scan" 
                    onClick={(e) => {
                      e.preventDefault()
                      console.log('Button clicked:', order.order_code)
                      handleScan(order.id, order.order_code)
                    }}
                  >
                    📱 SCAN QR
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default App
