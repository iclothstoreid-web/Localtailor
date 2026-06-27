const fetchOrders = async () => {
  setLoading(true)
  setError(null)
  try {
    // Fetch orders first
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_status', 'ACTIVE')
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    // Fetch customers
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*')

    if (customersError) throw customersError

    // Fetch fittings
    const { data: fittingsData, error: fittingsError } = await supabase
      .from('order_fitting')
      .select('*')

    if (fittingsError) throw fittingsError

    // Merge data manually
    const customersMap = {}
    customersData.forEach(c => {
      customersMap[c.id] = c
    })

    const fittingsMap = {}
    fittingsData.forEach(f => {
      fittingsMap[f.order_id] = f
    })

    const mergedOrders = ordersData.map(order => ({
      ...order,
      customers: customersMap[order.customer_id],
      order_fitting: fittingsMap[order.id]
    }))

    console.log('Merged orders:', mergedOrders)
    setOrders(mergedOrders)
  } catch (error) {
    console.error('Error:', error.message)
    setError(error.message)
  } finally {
    setLoading(false)
  }
}
