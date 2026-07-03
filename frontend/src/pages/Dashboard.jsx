import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client'; // 🔥 Socket client

export default function Dashboard() {
  const [stats, setStats] = useState({ totalOrders: 0, aov: 0, totalRevenue: 0, topProducts: [] });
  const [range, setRange] = useState('All');

  // ---------- Date range helper ----------
  const getDatesForRange = (selectedRange) => {
    const end = new Date();
    let start = new Date();
    if (selectedRange === 'Today') start.setHours(0,0,0,0);
    else if (selectedRange === 'Yesterday') start.setDate(start.getDate() - 1);
    else if (selectedRange === 'Last 7 Days') start.setDate(start.getDate() - 7);
    else if (selectedRange === 'Last 30 Days') start.setDate(start.getDate() - 30);
    else return { startDate: '', endDate: '' };
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  // ---------- Fetch stats when range changes ----------
  useEffect(() => {
    const { startDate, endDate } = getDatesForRange(range);
    axios.get(`http://localhost:5000/api/analytics/stats?startDate=${startDate}&endDate=${endDate}`)
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, [range]);

  // ---------- 🔥 Socket.IO live updates ----------
  useEffect(() => {
    const socket = io('http://localhost:5000');

    // Listen for new orders
    socket.on('new_order_placed', (newOrder) => {
      setStats(prev => {
        // Only update if we are viewing "All" or "Today" (live view)
        if (range !== 'All' && range !== 'Today') return prev;

        const updatedTotalOrders = (prev.totalOrders || 0) + 1;
        const updatedTotalRevenue = (prev.totalRevenue || 0) + newOrder.totalAmount;
        const updatedAov = updatedTotalOrders > 0 
          ? Math.round(updatedTotalRevenue / updatedTotalOrders) 
          : 0;

        return {
          ...prev,
          totalOrders: updatedTotalOrders,
          totalRevenue: updatedTotalRevenue,
          aov: updatedAov
        };
      });
    });

    // Cleanup on unmount
    return () => socket.disconnect();
  }, [range]); // re-run when range changes so the condition uses the latest range

  // ---------- UI ----------
  return (
    <div className="font-sans w-full">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Command Center Overview</h2>
          <p className="text-xs text-slate-400">Live operational auditing and macro performance metrics</p>
        </div>
        
        {/* Dynamic Range Filter Dropdown */}
        <select 
          value={range} 
          onChange={e => setRange(e.target.value)} 
          className="p-2 border rounded-lg text-xs font-semibold bg-white outline-none shadow-sm cursor-pointer"
        >
          <option value="All">All Lifetime Records</option>
          <option value="Today">Today (Live Node)</option>
          <option value="Yesterday">Yesterday</option>
          <option value="Last 7 Days">Last 7 Days</option>
          <option value="Last 30 Days">Last 30 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white border p-5 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Clean Revenue</span>
          <h2 className="text-2xl font-bold text-slate-900">₹{stats.totalRevenue}</h2>
        </div>
        <div className="bg-white border p-5 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Segment Manifests Count</span>
          <h2 className="text-2xl font-bold text-slate-900">{stats.totalOrders} Logs</h2>
        </div>
        <div className="bg-white border p-5 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Average Order Index (AOV)</span>
          <h2 className="text-2xl font-bold text-slate-900">₹{stats.aov}</h2>
        </div>
      </div>

      {/* Top Products Volume Mapping */}
      <div className="bg-white border rounded-xl p-5 shadow-sm max-w-md">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 mb-3">🔥 Hot Assets Distribution</h3>
        <div className="space-y-3">
          {stats.topProducts?.map((p, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs font-medium">
              <span className="text-slate-700 truncate max-w-[240px]">{p.name}</span>
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">{p.units} units sold</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}