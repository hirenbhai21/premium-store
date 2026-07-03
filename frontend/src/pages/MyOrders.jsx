import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client'; // 🔥 Socket client

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchMyOrders = () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const myUserId = user.customId || user.id || user._id;
    axios.get('http://localhost:5000/api/orders/all')
      .then(res => {
        const matchedOrders = res.data.filter(order => order.userId === myUserId);
        setOrders(matchedOrders);
        setLoading(false);
      })
      .catch(err => {
        console.error("Orders fetching failure:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    // 1. Initial load
    fetchMyOrders();

    // 2. 🔥 Connect Socket.IO for live order updates
    const socket = io('http://localhost:5000');

    // Real‑time status sync
    socket.on('order_status_sync', (updatedOrder) => {
      setOrders(prevOrders =>
        prevOrders.map(o => o._id === updatedOrder._id ? updatedOrder : o)
      );
    });

    // 3. Cleanup on unmount
    return () => socket.disconnect();
  }, []); // empty dependency – runs once

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm("Bhai, kya aap sach me ye order cancel karna chahte hain? 🛑");
    if (!confirmCancel) return;

    try {
      const res = await axios.post(`http://localhost:5000/api/orders/cancel/${orderId}`);
      alert(res.data.message || "Order Cancelled!");
      fetchMyOrders(); // refresh after cancellation
    } catch (err) {
      alert(err.response?.data?.message || "Cancellation failed!");
    }
  };

  const handleRequestReturn = async (orderId) => {
    if (!window.confirm("Bhai kya aap sach me ye order return karna chahte hain? 🔄")) return;
    try {
      const res = await axios.post(`http://localhost:5000/api/orders/request-return/${orderId}`);
      alert(res.data.message);
      fetchMyOrders(); // refresh after return request
    } catch (err) {
      alert(err.response?.data?.message || "Return Failed");
    }
  };

  if (loading) return <div className="p-10 text-center font-sans text-xs text-slate-400">Loading your purchase history...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-sans min-h-screen bg-[#f8fafc]">
      <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">📦 My Order History</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Aapne abhi tak koi order place nahi kiya hai! 🛒</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const isPendingOrPlaced = order.status === 'Order Placed' || order.status === 'Pending';
            const isCancelled = order.status === 'Cancelled';
            
            // 🔥 BACKUP LOGIC: Purane items ke liye default 7 days
            const maxReturnDays = Math.max(...(order.items?.map(i => i.returnDays || 7) || [7]));
            let isReturnable = false;
            let daysLeft = 0;
            
            // 🔥 BACKUP LOGIC: Agar deliveredAt missing hai, toh updatedAt use karega
            const deliveryTime = order.deliveredAt || (order.status === 'Delivered' ? order.updatedAt : null);
            
            if (order.status === 'Delivered' && deliveryTime && maxReturnDays > 0) {
                const deliveredDate = new Date(deliveryTime);
                const expiryDate = new Date(deliveredDate.getTime() + maxReturnDays * 24 * 60 * 60 * 1000);
                const currentDate = new Date();
                
                if (currentDate <= expiryDate) {
                    isReturnable = true;
                    daysLeft = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
                }
            }

            return (
              <div key={order._id} className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-sm space-y-4 transition-all hover:border-slate-300">
                
                <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Order Ref:</span>{' '}
                    <span className="font-bold text-slate-800">{order.customId || order._id}</span>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5">Placed on: {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div className={`font-bold px-2.5 py-1 rounded-lg uppercase text-[10px] tracking-wide shadow-sm ${
                    isCancelled ? 'bg-red-50 text-red-600' :
                    order.status === 'Delivered' ? 'bg-green-50 text-green-700' : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {order.status}
                  </div>
                </div>

                <div className="space-y-3.5">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 border-b border-slate-50 pb-2 last:border-none last:pb-0">
                      <Link to={`/product/${item._id || item.productId}`} className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-85 cursor-pointer">
                        <img 
                          src={item.image || item.images?.[0] || 'https://via.placeholder.com/40'} 
                          alt="product" 
                          className="w-10 h-10 object-contain bg-slate-50 border border-slate-100 rounded-lg p-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 text-xs truncate block max-w-[320px] hover:text-indigo-600 transition-colors">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block">Quantity: {item.quantity || 1} unit</span>
                        </div>
                      </Link>
                      <div className="text-right shrink-0">
                        <span className="font-black text-slate-900 text-xs">₹{(item.price || 0) * (item.quantity || 1)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-3.5">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Payment Mode</span>
                    <span className="text-xs font-bold text-slate-700">Cash On Delivery (COD)</span>
                  </div>

                  <div className="flex gap-2">
                      {isPendingOrPlaced && (
                        <button 
                          type="button"
                          onClick={() => handleCancelOrder(order.customId || order._id)}
                          className="bg-red-50 hover:bg-red-100 border border-red-200/60 text-red-600 font-bold px-4 py-2 rounded-xl text-[11px] uppercase tracking-wide transition-all"
                        >
                          Cancel Order 🛑
                        </button>
                      )}

                      {/* 🔥 Dynamic Return Button */}
                      {isReturnable && (
                        <button 
                          type="button"
                          onClick={() => handleRequestReturn(order.customId || order._id)}
                          className="bg-orange-50 hover:bg-orange-100 border border-orange-200/60 text-orange-600 font-bold px-4 py-2 rounded-xl text-[11px] uppercase tracking-wide transition-all shadow-sm"
                        >
                          Request Return 🔄 ({daysLeft} days left)
                        </button>
                      )}

                      {/* Window Closed Message */}
                      {order.status === 'Delivered' && !isReturnable && maxReturnDays > 0 && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-2 border border-slate-100 rounded-xl">
                            Return Window Closed ⏳
                          </span>
                      )}
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500">Total Paid:</span>
                    <span className="text-base font-black text-red-600 block">₹{order.totalAmount}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}