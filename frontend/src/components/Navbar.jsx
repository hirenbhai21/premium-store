import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { CartContext } from '../context/CartContext';
import axios from 'axios';

export default function Navbar() {
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  
  // Safely grab user from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  
  // Modals Visibility States (Only User Profile left)
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Edit Forms state trackers
  const [profileData, setProfileData] = useState({ 
    name: user?.name || '', 
    phone: user?.phone || '', 
    password: '' 
  });
  const [dpFile, setDpFile] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(user?.walletBalance || 0);

  useEffect(() => {
    if (user) {
      setCurrentBalance(user.walletBalance || 0);
      setProfileData({ 
        name: user.name || '', 
        phone: user.phone || '', 
        password: '' 
      });
    }
  }, [showProfileModal]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    window.location.reload();
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', profileData.name);
      data.append('phone', profileData.phone);
      if (profileData.password) data.append('password', profileData.password);
      if (dpFile) data.append('profilePic', dpFile);

      const res = await axios.put(`http://localhost:5000/api/user/update-profile/${user._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert(res.data.message);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setShowProfileModal(false);
      window.location.reload();
    } catch (err) { 
      alert(err.response?.data?.message || "Profile update failed."); 
    }
  };

  // Direct Coming Soon Alert for Wallet Click
  const handleWalletClickComingSoon = () => {
    alert("🚀 Feature Coming Soon! Online Payment Gateway integration is currently under development.");
  };

  return (
    <nav className="bg-white border-b border-slate-100 px-8 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm font-sans">
      {/* Brand Logo */}
      <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 hover:opacity-80 transition-opacity">
          <span className="font-light text-slate-500">Premium</span>Store
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center gap-8 text-sm font-medium text-slate-600">
        <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
        <Link to="/cart" className="hover:text-slate-900 transition-colors relative flex items-center gap-1">
          Cart
          {cart?.length > 0 && (
            <span className="bg-indigo-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold absolute -top-3 -right-4">
              {cart.length}
            </span>
          )}
        </Link>

        {user ? (
          <div className="flex items-center gap-6 border-l border-slate-200 pl-6 relative">
            
            {/* Wallet Button */}
            <div className="relative">
              <button 
                onClick={handleWalletClickComingSoon}
                className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-black uppercase font-mono tracking-wide cursor-pointer flex items-center gap-1 focus:outline-none hover:bg-emerald-100/70 transition-colors"
              >
                💳 Wallet: ₹{currentBalance.toLocaleString()}
              </button>
            </div>

            <Link to="/myorders" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">My Orders</Link>
            
            {/* Profile Avatar Clickable */}
            <div 
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 cursor-pointer group hover:opacity-85 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 border overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                {user.profilePic ? (
                  <img src={user.profilePic} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-slate-500">{user.name?.substring(0,1).toUpperCase()}</span>
                )}
              </div>
              <div className="text-xs text-slate-400 text-left">
                <span className="block text-[9px] font-bold text-slate-400 font-mono uppercase leading-none mb-0.5">Account</span>
                <strong className="text-slate-700 block text-sm font-semibold group-hover:text-indigo-600 leading-none transition-colors">{user.name}</strong>
              </div>
            </div>

            <button onClick={handleLogout} className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer">
              Logout
            </button>
          </div>
        ) : (
          <div className="border-l border-slate-200 pl-6">
            <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-sm">
              Login / Signup
            </Link>
          </div>
        )}
      </div>

      {/* User Update Profile Modal Overlay */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setShowProfileModal(false)}>
          <div className="bg-white p-6 rounded-3xl w-[440px] shadow-2xl border border-slate-100 relative space-y-4 max-h-[90vh] overflow-y-auto text-slate-800 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button className="absolute top-5 right-5 text-slate-400 hover:text-black text-xs font-bold font-mono transition-colors cursor-pointer" onClick={() => setShowProfileModal(false)}>✕ CLOSE</button>
            
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-950">✏️ Update Account Settings</h3>
              <p className="text-[9px] font-mono text-slate-400 mt-0.5 uppercase tracking-wider">MEMBER ACCOUNT DETAILS</p>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4 text-xs font-semibold">
              <div className="flex justify-center mb-2">
                <div className="relative w-16 h-16 rounded-full border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 shadow-xs">
                  {user?.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-slate-300">👤</span>}
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block pl-0.5">Avatar Image (DP)</label>
                <input type="file" accept="image/*" onChange={e => setDpFile(e.target.files[0])} className="w-full border p-1.5 rounded-xl bg-slate-50/50 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-900 file:text-white cursor-pointer" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block pl-0.5">Email Destination (Locked)</label>
                <input className="w-full border p-2.5 rounded-xl bg-slate-100 text-slate-400 outline-none cursor-not-allowed font-medium" value={user?.email || ''} disabled readOnly />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block pl-0.5">Full Holder Name</label>
                <input type="text" className="w-full border p-2.5 rounded-xl bg-slate-50/50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} required />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block pl-0.5">Contact Number</label>
                <input type="text" className="w-full border p-2.5 rounded-xl bg-slate-50/50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} required />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block pl-0.5">New Password (Blank to keep old)</label>
                <input type="password" className="w-full border p-2.5 rounded-xl bg-slate-50/50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} placeholder="••••••••" />
              </div>
              
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-3.5 rounded-xl uppercase tracking-wider text-[10px] shadow-md transition-all active:scale-[0.99] cursor-pointer mt-2">Commit Profile Updates ⚡</button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}