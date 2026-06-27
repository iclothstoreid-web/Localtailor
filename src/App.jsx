import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    // Demo: set a test user (Teja as tailor)
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
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers(name), order_fitting(kode_bahan, kode_warna)')
        .eq('order_status', 'ACTIVE')
        .limit(20)

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error:', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>🧵 Local Tailor Production Tracking</h1>
        <p>Role: {userRole} | User: {user?.name}</p>
      </header>

      <main>
        {userRole === 'tailor' && <TailorDashboard orders={orders} loading={loading} />}
        {userRole === 'owner' && <OwnerDashboard orders={orders} />}
      </main>
    </div>
  )
}

function TailorDashboard({ orders, loading }) {
  return (
    <div className="dashboard">
      <h2>📋 Pending Tasks</h2>
      {loading ? <p>Loading...</p> : (
        <div className="order-list">
          {orders.length === 0 ? (
            <p>No pending orders</p>
          ) : (
            orders.map(order => (
              <div key={order.id} className="order-card">
                <h3>{order.order_code}</h3>
                <p>Customer: {order.customers?.name}</p>
                <p>Current Step: {order.current_step}</p>
                <p>Bahan: {order.order_fitting?.kode_bahan}</p>
                <button className="btn-scan">Scan QR & Submit</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function OwnerDashboard({ orders }) {
  return (
    <div className="dashboard">
      <h2>📊 Owner Dashboard</h2>
      <p>Total Active Orders: {orders.length}</p>
    </div>
  )
}

export default App
