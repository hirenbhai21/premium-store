import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ManageUsers() {
  const [orders, setOrders] = useState([]);
  const [selectedUserOrders, setSelectedUserOrders] = useState(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Inspection Layer for nested order items view
  const [inspectedOrder, setInspectedOrder] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/orders/all')
      .then(res => setOrders(res.data))
      .catch(err => console.error(err));
  }, []);

  // Aggregating Customer profiles with intense analytics matrix
  const customerProfiles = orders.reduce((acc, order) => {
    const uId = order.userId;
    if (!uId) return acc;

    if (!acc[uId]) {
      acc[uId] = {
        userId: uId,
        fullName: order.shippingInfo?.fullName || 'Anonymous Client',
        phone: order.shippingInfo?.phone || 'N/A',
        // Future Scope: User profile image dynamically flows here
        profilePic: order.user?.profilePic || null, 
        email: order.user?.email || 'N/A', // Auto mapping placeholder
        address: `${order.shippingInfo?.address || ''}, ${order.shippingInfo?.city || ''} - ${order.shippingInfo?.pincode || ''}`,
        totalSpent: 0,
        ordersCount: 0,
        activeOrders: 0,
        disputedReturns: 0,
        allOrders: []
      };
    }

    acc[uId].ordersCount += 1;
    acc[uId].allOrders.push(order);

    if (order.status === 'Delivered') {
      acc[uId].totalSpent += order.totalAmount;
    }
    if (['Order Placed', 'Shipped', 'Out for Delivery'].includes(order.status)) {
      acc[uId].activeOrders += 1;
    }
    if (order.status === 'Return Requested') {
      acc[uId].disputedReturns += 1;
    }

    return acc;
  }, {});

  const profilesArray = Object.values(customerProfiles).filter(profile => {
    return profile.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || profile.userId.includes(searchQuery);
  });

  const handleInspectUser = (profile) => {
    setSelectedUserOrders(profile.allOrders);
    setSelectedUserInfo({ 
      userId: profile.userId,
      name: profile.fullName, 
      phone: profile.phone, 
      email: profile.email,
      address: profile.address, 
      profilePic: profile.profilePic, // 🔥 Future DP ready node
      totalSpent: profile.totalSpent,
      ordersCount: profile.ordersCount,
      activeOrders: profile.activeOrders,
      disputedReturns: profile.disputedReturns
    });
  };

  const getStatusBadge = (status) => {
    let base = "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ";
    if (status === 'Order Placed') return base + "bg-amber-50 text-amber-700 border-amber-200";
    if (status === 'Shipped') return base + "bg-blue-50 text-blue-700 border-blue-200";
    if (status === 'Out for Delivery') return base + "bg-slate-100 text-slate-700 border-slate-200";
    if (status === 'Delivered') return base + "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === 'Return Requested') return base + "bg-rose-50 text-rose-700 border-rose-200 animate-pulse";
    if (status === 'Return Approved & Refunded') return base + "bg-purple-50 text-purple-700 border-purple-200";
    return base + "bg-zinc-100 text-zinc-500 border-zinc-200";
  };

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen w-full font-sans">
      
      {/* HEADER CONTROLS */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-5 mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">User Dossier Index</h2>
          <p className="text-xs text-slate-400 mt-0.5">Deep-dive customer purchase behavior and identification logs</p>
        </div>
        <input 
          type="text" placeholder="🔍 Search profiles name or database UID..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2.5 w-80 rounded-xl border border-slate-200 text-xs outline-none bg-white shadow-sm focus:border-slate-400"
        />
      </div>

      {/* CUSTOMER PROFILES DATA TABLE */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4 text-center">Total Volumes</th>
              <th className="p-4">Net Lifetime Spent</th>
              <th className="p-4 text-center">Risk Parameters</th>
              <th className="p-4 text-center">Intelligence Sheet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {profilesArray.map(profile => (
              <tr key={profile.userId} className="hover:bg-slate-50/60 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  {/* 🔥 FUTURE DP CHECK: Card profile snapshot placeholder */}
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {profile.profilePic ? (
                      <img src={profile.profilePic} alt="dp" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-slate-400">{profile.fullName.substring(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">{profile.fullName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">UID: #{profile.userId.substring(0, 12).toUpperCase()}</div>
                  </div>
                </td>
                <td className="p-4 text-center text-sm font-bold text-indigo-600">{profile.ordersCount} Invoices</td>
                <td className="p-4 text-sm font-black text-emerald-600">₹{profile.totalSpent}</td>
                <td className="p-4 text-center">
                  {profile.disputedReturns > 0 ? (
                    <span className="bg-rose-50 text-rose-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-rose-200 animate-pulse">⚠️ {profile.disputedReturns} Dispute</span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">✅ Clear Node</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => handleInspectUser(profile)}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Check More 
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* LAYER 1 POPUP: USER INDEPENDENT IDENTITY PROFILE & INVOICES STREAM */}
      {selectedUserOrders && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-40" onClick={() => setSelectedUserOrders(null)}>
          <div className="bg-white p-6 rounded-2xl w-[620px] max-h-[85vh] overflow-y-auto shadow-xl border relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-xl text-slate-400 hover:text-slate-900" onClick={() => setSelectedUserOrders(null)}>✕</button>
            
            {/* 🔥 A TO Z IDENTITY CARD: Shows full profile data with dynamic DP future setup */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                {selectedUserInfo.profilePic ? (
                  <img src={selectedUserInfo.profilePic} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-2xl font-black text-slate-300">{selectedUserInfo.name.substring(0, 1).toUpperCase()}</div>
                )}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{selectedUserInfo.name}</h3>
                <p className="text-xs text-slate-400 font-mono">System Node Ref: #{selectedUserInfo.userId}</p>
                <div className="flex gap-2 pt-1">
                  <span className="bg-slate-100 text-slate-600 text-[9px] px-2 py-0.5 rounded font-bold">📞 {selectedUserInfo.phone}</span>
                  <span className="bg-slate-100 text-slate-600 text-[9px] px-2 py-0.5 rounded font-bold">✉️ {selectedUserInfo.email || 'Registry N/A'}</span>
                </div>
              </div>
            </div>
            
            {/* Financial Performance parameters */}
            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl shadow-sm"><span className="text-[9px] text-slate-400 block font-bold uppercase">Total Receipts</span><span className="text-sm font-bold text-slate-800">{selectedUserInfo.ordersCount}</span></div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl shadow-sm"><span className="text-[9px] text-slate-400 block font-bold uppercase">Active Transits</span><span className="text-sm font-bold text-indigo-600">{selectedUserInfo.activeOrders}</span></div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl shadow-sm"><span className="text-[9px] text-slate-400 block font-bold uppercase">Net Worth Payout</span><span className="text-sm font-black text-emerald-600">₹{selectedUserInfo.totalSpent}</span></div>
            </div>

            <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl text-xs text-slate-600 mb-5 font-medium">
              <span className="font-bold text-[10px] uppercase text-slate-400 block mb-1 tracking-wider">Default Delivery Destination</span>
              {selectedUserInfo.address}
            </div>

            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Historical Order Timeline Matrix</h4>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {selectedUserOrders.map(order => (
                <div 
                  key={order._id} onClick={() => setInspectedOrder(order)}
                  className="p-3 border border-slate-100 rounded-xl bg-white flex justify-between items-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50/30 transition-all shadow-2xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-mono font-bold text-indigo-600 text-xs">#{order._id.toUpperCase()} <span className="text-[10px] font-normal text-slate-400 font-sans tracking-normal">(Click parameters)</span></div>
                    <div className="text-[10px] text-slate-400 font-medium">Logged: {new Date(order.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="font-bold text-slate-900">₹{order.totalAmount}</div>
                    <div><span className={getStatusBadge(order.status)}>{order.status}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LAYER 2 POPUP: NESTED INNER BASKET RENDERING LOGS */}
      {inspectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-center items-center z-50" onClick={() => setInspectedOrder(null)}>
          <div className="bg-white p-6 rounded-2xl w-[460px] max-h-[75vh] overflow-y-auto shadow-2xl border border-slate-200 relative space-y-5" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-slate-900" onClick={() => setInspectedOrder(null)}>✕ Close View</button>
            
            <div>
              <h4 className="text-sm font-bold text-slate-900 border-b pb-1">📦 Package Audit Manifest</h4>
              <p className="text-[10px] font-mono text-slate-400 mt-1">ID: {inspectedOrder._id}</p>
            </div>

            {/* Item Arrays mapping */}
            <div className="space-y-2 border-b pb-4">
              <h5 className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Basket Mapping</h5>
              {inspectedOrder.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs font-medium text-slate-700">
                  <img src={item.images?.[0] || '📦'} alt="product" className="w-9 h-9 object-contain bg-slate-50 rounded border p-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Qty: {item.quantity} x Price: ₹{item.discountPrice || item.price}</div>
                  </div>
                  <div className="font-bold text-slate-900">₹{(item.discountPrice || item.price) * item.quantity}</div>
                </div>
              ))}
            </div>

            {/* Dynamic status timelines verification */}
            <div className="space-y-2 border-b pb-4">
              <h5 className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Transit Logs Timeline Steps</h5>
              <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                {inspectedOrder.statusTimeline?.map((t, idx) => (
                  <div key={idx} className="border-l-2 border-slate-300 pl-3 ml-1 text-[11px] font-medium text-slate-600">
                    <span className="font-bold text-slate-800 uppercase text-[9px] tracking-wide block">{t.status}</span>
                    <span className="text-[10px] text-slate-400">{new Date(t.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Note Parameters */}
            {inspectedOrder.returnRejectionReason && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs font-medium text-rose-800">
                <span className="font-bold block text-[10px] uppercase tracking-wider mb-0.5">Return Rejection Reason</span>
                "{inspectedOrder.returnRejectionReason}"
              </div>
            )}
            {inspectedOrder.adminNotes && (
              <div className="bg-slate-50 border p-3 rounded-xl text-xs font-medium text-slate-600">
                <span className="font-bold block text-[10px] uppercase tracking-wider mb-0.5">Private Memo Log</span>
                "{inspectedOrder.adminNotes}"
              </div>
            )}

            <div className="flex justify-between items-center text-xs font-bold text-slate-800">
              <span>Gross Settled Capital:</span>
              <span className="text-base text-slate-950 font-black">₹{inspectedOrder.totalAmount}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}