import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client'; // 🔥 Socket client

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // Multi-Order Selection States
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  
  // City Filter State
  const [selectedCity, setSelectedCity] = useState('All Cities');

  // ---------- Fetch initial data ----------
  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders/all');
      setOrders(res.data);
      
      // If a modal is open, refresh its data too
      if (selectedOrder) {
        const freshData = res.data.find(o => o._id === selectedOrder._id || o.customId === selectedOrder.customId);
        if (freshData) setSelectedOrder(freshData);
      }
    } catch (e) {
      console.error("Live stream connection lag error:", e);
    }
  };

  // ---------- Socket.IO real‑time setup ----------
  useEffect(() => {
    // 1. Initial load
    fetchOrders();

    // 2. Connect to Socket.IO server
    const socket = io('http://localhost:5000');

    // 3. Listen for new orders (admin dashboard)
    socket.on('new_order_placed', (newOrder) => {
      setOrders(prev => [newOrder, ...prev]); // prepend to top
    });

    // 4. Listen for status updates on any order
    socket.on('order_status_sync', (updatedOrder) => {
      setOrders(prev =>
        prev.map(o => (o._id === updatedOrder._id ? updatedOrder : o))
      );
      // Also update the modal if it's the currently open one
      if (selectedOrder && selectedOrder._id === updatedOrder._id) {
        setSelectedOrder(updatedOrder);
      }
    });

    // 5. Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []); // runs only once on mount

  // ---------- Unique cities list ----------
  const uniqueCities = ['All Cities', ...new Set(orders.map(o => o.shippingInfo?.city).filter(Boolean))];

  // ---------- Status update (single) ----------
  const updateStatus = async (orderId, newStatus) => {
    let reason = "";
    if (newStatus === 'Return Rejected') {
      reason = prompt("Enter Return Rejection Reason:");
      if (!reason) return alert("Text reason mandatory hai!");
    }
    
    try {
      await axios.put(`http://localhost:5000/api/orders/update-status/${orderId}`, { 
        status: newStatus, 
        returnRejectionReason: reason 
      });
      alert(`Status changed to: ${newStatus}`);
      // No need to call fetchOrders – socket will update it automatically
    } catch (err) { 
      alert(err.response?.data?.message || "Status synchronization failure."); 
    }
  };

  // ---------- Bulk status update ----------
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedOrderIds.length === 0) return;
    const confirmBulk = window.confirm(`Kya aap sach me ${selectedOrderIds.length} orders ko ek sath "${newStatus}" karna chahte hain? ⚡`);
    if (!confirmBulk) return;

    try {
      await Promise.all(
        selectedOrderIds.map(orderId => 
          axios.put(`http://localhost:5000/api/orders/update-status/${orderId}`, { status: newStatus })
        )
      );
      alert(`🎉 Bulk operation completed successfully for ${selectedOrderIds.length} orders!`);
      setSelectedOrderIds([]); 
      // socket will handle updates, no need to refetch
    } catch (err) {
      alert(err.response?.data?.message || "Bulk update me error aaya. Backend check karein.");
    }
  };

  // ---------- Save admin notes ----------
  const handleSaveNotes = async (orderId) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/update-notes/${orderId}`, { 
        adminNotes: adminNoteInput 
      });
      alert("Internal system note locked!");
      // We can optionally update the local order's notes, but we can rely on next refresh or socket
      // For simplicity, we'll update the selectedOrder directly if it matches
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, adminNotes: adminNoteInput }));
      }
    } catch (e) { 
      alert("Fail to write remark logs."); 
    }
  };

  // ---------- Selection helpers ----------
  const handleSelectOrder = (orderId) => {
    if (selectedOrderIds.includes(orderId)) {
      setSelectedOrderIds(selectedOrderIds.filter(id => id !== orderId));
    } else {
      setSelectedOrderIds([...selectedOrderIds, orderId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]); 
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o._id));
    }
  };

  // ---------- Filtering logic ----------
  const filteredOrders = orders.filter(o => {
    const name = o.shippingInfo?.fullName?.toLowerCase() || '';
    const idString = o.customId?.toLowerCase() || '';
    const cityString = o.shippingInfo?.city || '';
    const search = searchQuery.toLowerCase();
    
    if (!name.includes(search) && !idString.includes(search)) return false;
    if (selectedCity !== 'All Cities' && cityString !== selectedCity) return false;
    
    if (activeTab === 'Active') return ['Order Placed', 'Shipped', 'Out for Delivery'].includes(o.status);
    if (activeTab === 'Returns') return o.status === 'Return Requested';
    if (activeTab === 'Completed') return ['Delivered', 'Return Approved & Refunded'].includes(o.status);
    if (activeTab === 'Rejected') return o.status === 'Return Rejected' || o.status === 'Cancelled';
    return true;
  });

  return (
    <div className="font-sans w-full bg-[#f8fafc] min-h-screen p-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-4 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Live Order Stream</h2>
          <p className="text-xs text-slate-400">Courier systems timeline node logging engine</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* City Filter Dropdown */}
          <select 
            value={selectedCity} 
            onChange={e => { setSelectedCity(e.target.value); setSelectedOrderIds([]); }}
            className="p-2.5 border border-slate-200 text-xs font-bold rounded-xl outline-none bg-white shadow-sm focus:border-slate-400 cursor-pointer"
          >
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city === 'All Cities' ? "📍 All Cities" : `🏙️ ${city}`}</option>
            ))}
          </select>

          <input 
            type="text" 
            placeholder="🔍 Search name or ORD sequence..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="p-2.5 border text-xs rounded-xl outline-none shadow-sm w-64 bg-white focus:border-slate-400 font-medium" 
          />
        </div>
      </div>

      {/* Bulk action bar */}
      <div className="h-14 transition-all duration-200 mb-2 flex items-center">
        {selectedOrderIds.length > 0 ? (
          <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-md flex justify-between items-center w-full animate-fade-in">
            <div className="text-xs font-bold">
              Batching Operations: Selected <span className="underline font-black bg-indigo-700 px-2 py-0.5 rounded">{selectedOrderIds.length}</span> orders
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleBulkStatusUpdate('Shipped')} className="bg-white hover:bg-slate-100 text-indigo-700 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase transition-all shadow-sm">Shipped 🚚</button>
              <button type="button" onClick={() => handleBulkStatusUpdate('Out for Delivery')} className="bg-white hover:bg-slate-100 text-indigo-700 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase transition-all shadow-sm">Delivery 🛵</button>
              <button type="button" onClick={() => handleBulkStatusUpdate('Delivered')} className="bg-white hover:bg-slate-100 text-green-700 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase transition-all shadow-sm">Delivered ✅</button>
              <button type="button" onClick={() => setSelectedOrderIds([])} className="bg-indigo-800 text-slate-200 hover:text-white px-2 py-1 rounded-lg text-[10px] font-medium">Clear</button>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 font-medium italic pl-1">Orders select karein batch action panel access karne ke liye.</div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b pb-2.5 mb-6 overflow-x-auto">
        {['All', 'Active', 'Returns', 'Completed', 'Rejected'].map(t => (
          <button 
            key={t} 
            onClick={() => { setActiveTab(t); setSelectedOrderIds([]); }} 
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${activeTab === t ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="p-4 w-10 text-center">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll} 
                  checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                  className="cursor-pointer"
                />
              </th>
              <th className="p-4">ORDER ID</th>
              <th className="p-4">CLIENT (CITY)</th>
              <th className="p-4">TOTAL BILL</th>
              <th className="p-4">STATUS</th>
              <th className="p-4 text-center">CORE DESK DESPATCH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-10 text-slate-400 font-normal">Is terminal stream me abhi koi metrics available nahi hain.</td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const targetRowId = order._id;
                return (
                  <tr key={order._id} className={`transition-colors ${selectedOrderIds.includes(targetRowId) ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedOrderIds.includes(targetRowId)} 
                        onChange={() => handleSelectOrder(targetRowId)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td 
                      onClick={() => { setSelectedOrder(order); setAdminNoteInput(order.adminNotes || ''); }} 
                      className="p-4 font-mono font-bold text-indigo-600 underline cursor-pointer hover:text-indigo-800"
                    >
                      {order.customId || 'ORD-PROCESSING'} 🔍
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-900">
                      {order.shippingInfo?.fullName}{' '}
                      <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                        {order.shippingInfo?.city || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-900 font-black">₹{order.totalAmount}</td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2.5 py-0.5 font-bold border rounded-full uppercase ${
                        order.status === 'Cancelled' || order.status === 'Return Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                        order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {order.status === 'Return Requested' ? (
                        <div className="flex justify-center gap-1">
                          <button onClick={() => updateStatus(targetRowId, 'Return Approved & Refunded')} className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded text-[10px]">Approve</button>
                          <button onClick={() => updateStatus(targetRowId, 'Return Rejected')} className="bg-rose-600 text-white font-bold px-2.5 py-1 rounded text-[10px]">Reject</button>
                        </div>
                      ) : order.status?.includes('Refunded') || order.status?.includes('Rejected') || order.status === 'Cancelled' ? (
                        <span className="text-slate-400 font-normal text-[11px]">🔒 Settled Node</span>
                      ) : (
                        <select 
                          value={order.status} 
                          onChange={e => updateStatus(targetRowId, e.target.value)} 
                          className="p-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold outline-none shadow-sm cursor-pointer"
                        >
                          <option value="Order Placed">Placed</option>
                          <option value="Shipped">Shipped 🚚</option>
                          <option value="Out for Delivery">Delivery 🛵</option>
                          <option value="Delivered">Delivered ✅</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL VIEW */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white p-6 rounded-2xl w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 relative space-y-5" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-lg text-slate-400 hover:text-black transition-colors font-bold" onClick={() => setSelectedOrder(null)}>✕</button>
            
            <div>
              <h3 className="text-base font-black text-slate-900 border-b pb-1.5">Advanced Dispatch Ledger Audit</h3>
              <p className="text-[10px] font-mono text-slate-400 mt-1">Manifest ID Reference: {selectedOrder.customId || selectedOrder._id}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-xs space-y-1.5">
              <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">👤 Customer & Shipping Profile</h4>
              <p><span className="text-slate-400 font-normal">Full Name:</span> <span className="font-bold text-slate-800 text-sm">{selectedOrder.shippingInfo?.fullName || 'N/A'}</span></p>
              <p><span className="text-slate-400 font-normal">Phone:</span> <span className="font-bold text-slate-800">{selectedOrder.shippingInfo?.phone || 'N/A'}</span></p>
              <p><span className="text-slate-400 font-normal">Destination Hub:</span> <span className="font-semibold text-slate-700">{selectedOrder.shippingInfo?.city || 'N/A'} - {selectedOrder.shippingInfo?.pincode || 'N/A'}</span></p>
              <p className="leading-relaxed"><span className="text-slate-400 font-normal">Full Address:</span> <span className="text-slate-600 font-medium">{selectedOrder.shippingInfo?.address || 'N/A'}</span></p>
            </div>

            <div className="border border-slate-100 rounded-xl p-3 bg-white space-y-2">
              <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">🛒 Manifest Items Loaded ({selectedOrder.items?.length || 0})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 bg-slate-50/60 border p-2 rounded-lg text-[11px]">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <img src={item.image || '📦'} alt="img" className="w-8 h-8 object-contain bg-white border rounded p-0.5 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{item.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-slate-900 block">₹{item.price * (item.quantity || 1)}</span>
                      <span className="text-[9px] text-slate-400 font-medium">{item.quantity || 1} unit x ₹{item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400">📝 Internal Operation Remarks</h4>
              <textarea 
                value={adminNoteInput} 
                onChange={e => setAdminNoteInput(e.target.value)} 
                placeholder="Type private operations logs notes here..." 
                rows="2" 
                className="w-full border text-xs p-2.5 rounded-lg bg-slate-50/50 outline-none focus:border-slate-400 font-medium"
              ></textarea>
              <button 
                type="button"
                onClick={() => handleSaveNotes(selectedOrder._id)} 
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-[10px] tracking-wider uppercase transition-all"
              >
                Save Private Remark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}