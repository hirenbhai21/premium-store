import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios'; 

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginViaOtp, setLoginViaOtp] = useState(false); 
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', otp: '' });
  const [otpTriggerActive, setOtpTriggerActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestEmailOtp = async () => {
    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail) return alert("Pehle email address fill up karo bhai!");
    try {
      setLoading(true);
      const targetRoute = isLogin ? 'send-login-otp' : 'send-email-otp';
      const res = await axios.post(`http://localhost:5000/api/auth/${targetRoute}`, { email: cleanEmail });
      alert(res.data.message);
      setOtpTriggerActive(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to dispatch verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let endpoint = isLogin ? 'login' : 'register';
    if (isLogin && loginViaOtp) {
      endpoint = 'login-via-otp'; 
    }
    
    const submissionData = {
      name: formData.name,
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      phone: formData.phone.trim(),
      otp: formData.otp.trim()
    };

    try {
      const res = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, submissionData);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        alert(res.data.message || "Welcome back!");
        window.location.href = '/';
      }
    } catch (err) {
      alert(err.response?.data?.message || "Authentication error.");
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30 px-4 py-12 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden p-8 relative">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-200 mb-3 font-sans">
            <span className="text-white text-xl font-black tracking-tighter">PS</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase font-mono">
              <span className="font-light text-slate-400">Premium</span>Store
            </h1>
            <h2 className="text-lg font-bold text-slate-700 mt-2">
              {isLogin ? (loginViaOtp ? '🔑 Passwordless OTP Login' : '🔒 Welcome Back') : '📝 Create Your Account'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block pl-1">Full Identity Name</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-sm">👤</span>
                <input type="text" placeholder="Bhimani Hirenbhai" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 py-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/40 text-slate-800 font-medium" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block pl-1">Email Address</label>
            <div className="flex gap-2 relative items-center">
              <span className="absolute left-3.5 text-slate-400 text-sm">📧</span>
              <input type="email" placeholder="name@company.com" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-24 py-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/40 text-slate-800 font-medium" />
              {(!isLogin || loginViaOtp) && (
                <button type="button" disabled={loading} onClick={handleRequestEmailOtp} className="absolute right-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg font-black uppercase text-[9px] tracking-wide whitespace-nowrap transition-colors">
                  {loading ? 'Sending...' : 'Get OTP'}
                </button>
              )}
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block pl-1">Mandatory Contact No</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-sm">📞</span>
                <input type="text" placeholder="+91 99999 99999" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 py-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/40 text-slate-800 font-bold tracking-wide" />
              </div>
            </div>
          )}

          {(!isLogin || !loginViaOtp) && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block pl-1">Password Access</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-sm">🔑</span>
                <input type="password" placeholder="••••••••" required={!loginViaOtp} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-10 py-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/40 text-slate-800 font-medium" />
              </div>
            </div>
          )}
          
          {otpTriggerActive && (
            <div className="space-y-1.5 mt-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-indigo-600 font-mono block pl-1">Enter 6-Digit Email OTP</label>
              <input type="text" maxLength="6" placeholder="000000" required value={formData.otp} onChange={e => setFormData({...formData, otp: e.target.value})} className="w-full py-3 border border-indigo-200 font-mono font-black text-center text-base rounded-xl outline-none text-indigo-700 tracking-[8px] placeholder:tracking-normal" />
            </div>
          )}

          {isLogin && (
            <div className="text-right">
              <span onClick={() => { setLoginViaOtp(!loginViaOtp); setOtpTriggerActive(false); }} className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">
                {loginViaOtp ? "← Back to Password Login" : "🔑 Forget Password / Login via OTP?"}
              </span>
            </div>
          )}

          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-[11px] mt-4 shadow-md transition-all active:scale-[0.99] cursor-pointer">
            {isLogin ? (loginViaOtp ? 'Verify OTP & Login' : 'Sign In Securely') : 'Verify Email & Launch Account 🚀'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-100 pt-5">
          <p className="text-xs text-slate-500 cursor-pointer hover:text-indigo-600 font-semibold transition-colors inline-block" onClick={() => { setIsLogin(!isLogin); setOtpTriggerActive(false); setLoginViaOtp(false); }}>
            {isLogin ? "Don't have an account? Create one here" : "Already registered? Login to access"}
          </p>
        </div>

      </div>
    </div>
  );
}