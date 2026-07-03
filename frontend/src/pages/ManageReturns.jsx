import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ManageReturns() {
  const [returnOrders, setReturnOrders] = useState([]);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/orders/all');
        // 🔥 Filter: Sirf wahi orders nikalo jinka status Return Requested hai
        const filtered = res.data.filter(order => order.status === 'Return Requested');
        setReturnOrders(filtered);
      } catch (error) {
        console.error("Error fetching returns:", error);
      }
    };
    fetchReturns();
  }, []);

  const handleReturnAction = async (id, finalStatus) => {
    try {
      // Hum purane update-status route ka hi use karenge par locked condition bypass karke direct status change marenge
      // Lekin naye rule ke mutabik backend route hamara closed tha, isliye admin panel se direct force update bhejenge
      await axios.put(`http://localhost:5000/api/orders/update-status/${id}`, { status: finalStatus });
      alert(`📢 Return Request: ${finalStatus}`);
      // List se hata do turant
      setReturnOrders(returnOrders.filter(order => order._id !== id));
    } catch (error) {
      alert("Action complete nahi ho paya!");
    }
  };

  return (
    <div style={{ padding: '30px', background: '#f8f9fa', minHeight: '100vh', width: '100%' }}>
      <h2 style={{ margin: 0, fontSize: '26px', color: '#bc0000', marginBottom: '25px' }}>
        ↩️ Customer Return & Refund Desk
        <span style={{ fontSize: '16px', background: '#dc3545', color: 'white', padding: '4px 10px', borderRadius: '50px', marginLeft: '10px' }}>
          {returnOrders.length} Pending
        </span>
      </h2>

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #eee' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f1f3f5', borderBottom: '2px solid #dee2e6' }}>
            <tr>
              <th style={{ padding: '15px 20px' }}>ORDER ID</th>
              <th style={{ padding: '15px 20px' }}>CUSTOMER</th>
              <th style={{ padding: '15px 20px' }}>ITEMS</th>
              <th style={{ padding: '15px 20px' }}>TOTAL REFUND</th>
              <th style={{ padding: '15px 20px', textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {returnOrders.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#777', fontWeight: 'bold' }}>
                  🥳 Sukoon hai! Ek bhi return request pending nahi hai.
                </td>
              </tr>
            ) : (
              returnOrders.map((order) => (
                <tr key={order._id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '18px 20px', fontFamily: 'monospace', color: '#007185', fontWeight: 'bold' }}>
                    #{order._id.substring(0, 8).toUpperCase()}
                  </td>
                  <td style={{ padding: '18px 20px', fontWeight: '500' }}>
                    {order.shippingInfo?.fullName}
                  </td>
                  <td style={{ padding: '18px 20px', fontSize: '14px' }}>
                    {order.items?.map((item, i) => (
                      <div key={i}>{item.quantity}x {item.name}</div>
                    ))}
                  </td>
                  <td style={{ padding: '18px 20px', fontWeight: 'bold', color: '#b12704' }}>
                    ₹{order.totalAmount}
                  </td>
                  <td style={{ padding: '18px 20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button 
                      onClick={() => handleReturnAction(order._id, 'Return Approved & Refunded')}
                      style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ✅ Approve & Refund
                    </button>
                    <button 
                      onClick={() => handleReturnAction(order._id, 'Return Rejected')}
                      style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ❌ Reject
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}