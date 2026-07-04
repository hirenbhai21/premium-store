import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-60 bg-white border-r border-slate-100 min-h-screen p-5 flex flex-col justify-between shadow-sm font-sans">
      <div>
        <h2 className="text-center text-sm font-bold tracking-widest text-slate-400 uppercase border-b pb-4 mb-6">
            CONTROL BASE
        </h2>
        <ul className="space-y-1">
          <li>
            <Link to="/admin/dashboard" className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-bold transition-all ${isActive('/admin/dashboard') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>
                Overview Stats
            </Link>
          </li>
          <li>
            <Link to="/admin/products" className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-bold transition-all ${isActive('/admin/products') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>
                Vault Products
            </Link>
          </li>
          <li>
            <Link to="/admin/add-product" className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-bold transition-all ${isActive('/admin/add-product') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>
                Mint New Asset
            </Link>
          </li>
          <li>
            <Link to="/admin/manage-orders" className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-bold transition-all ${isActive('/admin/manage-orders') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>
                Order Terminal
            </Link>
          </li>
          <li>
            {/* 🔥 FIXED: Yahan ternary condition `? 'active-class' : 'inactive-class'` ko bilkul perfect set kar diya hai */}
            <Link to="/admin/customers" className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-bold transition-all ${isActive('/admin/customers') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>
                Customer Profiles
            </Link>
          </li>
          
          {/* WhatsApp Style Support Console */}
          <li>
            <Link to="/admin/support" className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-bold transition-all ${isActive('/admin/support') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>
                Support Console 💬
            </Link>
          </li>
        </ul>
      </div>
      <div>
        <Link to="/" className="w-full block py-2.5 text-center text-xs font-bold bg-slate-50 hover:bg-indigo-50 text-indigo-600 rounded-lg border border-slate-100 transition-all">
          🌐 Go to User Store
        </Link>
      </div>
    </div>
  );
}