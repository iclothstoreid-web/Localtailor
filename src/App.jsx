import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setUserRole('tailor')
    setUser({ id: 'demo-user', name: 'Teja' })
  }, [])

  useEffect(() => {
    if (userRole) {
      fetchOrders()
    }
  }, [userRole])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_code, current_step, order_status, customer_id, created_at')
        .eq('order_status', 'ACTIVE')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Get customers & fittings separately
      if (data && data.length > 0) {
        const customerIds = [...new Set(data.map(o => o.customer_id))]
        const orderIds = [...new Set(data.map(o => o.id))]

        const { data: customersData } = await supabase
          .from('customers')
          .select('id, name, phone')
          .in('id', customerIds)

        const { data: fittingsData } = await supabase
          .from('order_fitting')
          .select('order_id, kode_bahan, kode_warna')
          .in('order_id', orderIds)

        const customersMap = {}
        const fittingsMap = {}

        customersData?.forEach(c => { customersMap[c.id] = c })
        fittingsData?.forEach(f => { fittingsMap[f.order_id] = f })

        const enrichedData = data.map(order => ({
          ...order,
          customers: customersMap[order.customer_id],
          order_fitting: fittingsMap[order.id]
        }))

        setOrders(enrichedData)
      } else {
        setOrders([])
      }
    } catch (error) {
      console.error('Error:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleScan = (orderCode) => {
    alert(`Scan QR for: ${orderCode}`)
  }

  const getStepIndex = (step) => {
    const steps = ['FITTING', 'MATERIAL_CONFIRMATION', 'CUTTING', 'OPERATOR', 'QC_TEKNIS', 'FINISHING', 'PACKING', 'SHIPPED']
    return steps.indexOf(step)
  }

  const steps = ['FITTING', 'MATERIAL', 'CUTTING', 'STITCH', 'QC', 'FINISH', 'PACK', 'SHIP']

  return (
    <div className="app">
      <header>
        <h1>LOCAL PROJECT</h1>
        <p>Production Tracking • {user?.name}</p>
      </header>
      <main>
        <div className="dashboard">
          <h2>📋 PENDING ORDERS</h2>
          {loading ? (
            <p style={{textAlign: 'center', color: '#F2EDD750'}}>Loading...</p>
          ) : orders.length === 0 ? (
            <div className="empty-state"><p>No active orders</p></div>
          ) : (
            <div className="order-list">
              {orders.map(order => {
                const stepIdx = getStepIndex(order.current_step)
                const bahan = order.order_fitting?.kode_bahan || 'TBD'
                const warna = order.order_fitting?.kode_warna || 'TBD'
                
                return (
                  <div key={order.id} className="order-card">
                    <h3>{order.order_code}</h3>
                    <p><strong>Customer:</strong> {order.customers?.name}</p>
                    <p><strong>Phone:</strong> {order.customers?.phone}</p>
                    <p><strong>Material:</strong> {bahan}</p>
                    <p><strong>Color:</strong> {warna}</p>
                    
                    <div className="production-steps">
                      {steps.map((s, i) => (
                        <div key={i} className={`step ${i <= stepIdx ? 'active' : ''}`}>{s}</div>
                      ))}
                    </div>
                    
                    <div className="order-status">{order.current_step.replace(/_/g, ' ')}</div>
                    
                    <button className="btn-scan" onClick={() => handleScan(order.order_code)}>
                      📱 SCAN QR
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
