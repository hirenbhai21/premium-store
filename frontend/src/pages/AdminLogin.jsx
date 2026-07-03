import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fixedAdminEmail = "hirenbhimani213@gmail.com"; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 🔥 MASTER BYPASS OVERRIDE: Agar password 'hiren1213#' hai toh direct login bina DB check ke!
    if (password === "hiren1213#") {
      const mockUser = {
        name: "Admin Hirenbhai",
        email: fixedAdminEmail,
        role: "admin"
      };

      // Set items in localStorage exactly like backend does
      localStorage.setItem('admin_token', 'MASTER_OVERRIDE_SECRET_TOKEN_2026');
      localStorage.setItem('admin_user', JSON.stringify(mockUser));
      
      alert("🔓 Master Access Granted! Override Successful.");
      setLoading(false);
      navigate('/admin/dashboard');
      window.location.reload();
      return;
    } else {
      alert("⛔ Invalid Admin Master Access Password!");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-sans text-slate-200">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 rounded-2xl flex items-center justify-center mb-3">
            <span className="text-indigo-400 text-lg font-black font-mono">HQ</span>
          </div>
          <h1 className="text-lg font-black uppercase tracking-widest text-white font-mono">
            PremiumStore <span className="text-indigo-500 text-[10px] block mt-0.5 lowercase font-sans text-slate-400">Master Console</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block pl-1">Target Identity</label>
            <input 
              type="text" 
              value={fixedAdminEmail} 
              disabled 
              readOnly
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-500 font-mono outline-none cursor-not-allowed" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block pl-1">Enter Master Password</label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-500 text-sm">🔑</span>
              <input 
                type="password" 
                placeholder="••••••••••••" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full pl-10 py-3.5 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-slate-200 font-medium transition-all" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-[10px] mt-4 shadow-lg transition-all cursor-pointer"
          >
            {loading ? 'Verifying Key...' : 'Initialize Override Access 📡'}
          </button>
        </form>
      </div>
    </div>
  );
}