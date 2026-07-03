import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Profile() {
  const localUser = JSON.parse(localStorage.getItem('user')) || {};
  const [formData, setFormData] = useState({ name: localUser.name || '', phone: localUser.phone || '', password: '' });
  const [walletAmt, setWalletAmt] = useState(0);
  const [topUpInput, setTopUpInput] = useState('');

  const fetchFreshUserData = async () => {
    if (!localUser._id) return;
    try {
      // Direct call mapping users data vectors fields
      const res = await axios.get(`http://localhost:5000/api/orders/all`); // Or write a direct single getter
      // Temporary pulling layout updates directly to keep localState active
      setWalletAmt(localUser.walletBalance || 0);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchFreshUserData();
    if(localUser.walletBalance !== undefined) setWalletAmt(localUser.walletBalance);
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`http://localhost:5000/api/user/update-profile/${localUser._id}`, formData);
      alert(res.data.message);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.reload();
    } catch (err) { alert("Profile modifier error update crash"); }
  };

  const handleWalletRecharge = async () => {
    if (!topUpInput || Number(topUpInput) <= 0) return alert("Valid numbers pack pass karo!");
    try {
      const res = await axios.post(`http://localhost:5000/api/user/wallet/topup/${localUser._id}`, { amount: topUpInput });
      alert(res.data.message);
      const updatedUserObj = { ...localUser, walletBalance: res.data.balance };
      localStorage.setItem('user', JSON.stringify(updatedUserObj));
      setWalletAmt(res.data.balance);
      setTopUpInput('');
    } catch (err) { alert("Wallet recharge node failure"); }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-sans flex flex-col md:flex-row gap-6 min-h-screen bg-[#f8fafc]">
      
      {/* LEFT COMPONENT: PROFILE MANAGER EDIT SCREEN CARD */}
      <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Identity Profile Ledger</h2>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">Modify parameters safely. Email is locked by protocol validation system.</p>
        </div>
        <form onSubmit={handleProfileUpdate} className="space-y-3 text-xs font-medium">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Email Address (Locked)</label>
            <input className="w-full border p-2.5 rounded-lg bg-slate-100 text-slate-400 outline-none cursor-not-allowed" value={localUser.email || ''} readOnly disabled />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Full Name Title</label>
            <input className="w-full border p-2.5 rounded-lg bg-slate-50 outline-none focus:border-slate-400" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Active Contact Number</label>
            <input className="w-full border p-2.5 rounded-lg bg-slate-50 outline-none focus:border-slate-400" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="e.g. +91 9999999999" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Alter Password (Leave blank to keep old)</label>
            <input type="password" className="w-full border p-2.5 rounded-lg bg-slate-50 outline-none focus:border-slate-400" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-3 rounded-xl tracking-wider uppercase text-[10px]">Save Configuration Profiles</button>
        </form>
      </div>

      {/* RIGHT COMPONENT: PREMIUM PERSONAL WALLET SYSTEM CARD */}
      <div className="w-full md:w-80 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-fit space-y-4">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-xl text-white shadow-sm space-y-1 relative overflow-hidden">
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 font-mono">Premium Vault Wallet Balance</span>
          <h2 className="text-3xl font-black font-mono">₹{walletAmt.toLocaleString()}</h2>
          <div className="text-[9px] font-mono opacity-40 pt-4">Verified Holder: #{localUser.customId || "MEMBER"}</div>
          <div className="absolute -right-4 -bottom-4 text-6xl opacity-10">💳</div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">Top-Up Capital Inflow</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Amount (₹)" className="flex-1 border text-xs p-2 rounded-lg outline-none focus:border-slate-400 font-bold" value={topUpInput} onChange={e => setTopUpInput(e.target.value)} />
            <button onClick={handleWalletRecharge} className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] px-4 py-2 rounded-lg uppercase tracking-wide">Add Cash</button>
          </div>
        </div>
      </div>

    </div>
  );
}