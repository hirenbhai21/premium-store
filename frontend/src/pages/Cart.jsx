import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

export default function Cart() {
  // 🔥 Context se updateQuantity ko bulaya
  const { cart, removeFromCart, updateQuantity } = useContext(CartContext);
  const navigate = useNavigate();

  // Total checkout valuation array reduce math rule
  const totalAmount = cart.reduce((total, item) => total + (item.discountPrice || item.price) * (item.quantity || 1), 0);

  if (cart.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 max-w-md mx-auto mt-12 font-sans shadow-sm">
        <div className="text-4xl mb-3">🛒</div>
        <h3 className="text-base font-bold text-slate-800">Your Vault is Empty</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto font-normal">Kuch assets select karein taaki transaction build ho ske.</p>
        <button onClick={() => navigate('/')} className="mt-5 bg-slate-900 text-white font-bold text-[11px] tracking-wider uppercase px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all">
          Browse items
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 font-sans flex flex-col md:flex-row gap-8 min-h-screen bg-[#f8fafc]">
      {/* Left items mapping list panel */}
      <div className="flex-1 space-y-4">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">🛒 Terminal Basket ({cart.length})</h2>
        {cart.map((item) => (
          <div key={item._id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <img src={item.images?.[0] || '📦'} alt={item.name} className="w-16 h-16 object-contain bg-slate-50 border rounded-lg p-1 shrink-0" />
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-900 truncate max-w-[280px]">{item.name}</h4>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">{item.category}</p>
                <div className="text-xs font-black text-slate-800 mt-1.5">₹{item.discountPrice || item.price}</div>
                
                {/* 🔥 CORE ADDON: Quantity Modifier Buttons (Aapki CSS classes ke matching) */}
                <div className="flex items-center gap-2 mt-2 bg-slate-50 border border-slate-200/60 rounded-lg w-fit p-1">
                  <button type="button" onClick={() => updateQuantity(item._id, -1)} className="w-5 h-5 flex items-center justify-center bg-white border border-slate-200 rounded md font-black text-xs hover:bg-slate-100 text-slate-700">-</button>
                  <span className="text-xs font-bold px-1 text-slate-800 min-w-[12px] text-center">{item.quantity || 1}</span>
                  <button type="button" onClick={() => updateQuantity(item._id, 1)} className="w-5 h-5 flex items-center justify-center bg-white border border-slate-200 rounded md font-black text-xs hover:bg-slate-100 text-slate-700">+</button>
                </div>

              </div>
            </div>
            <button onClick={() => removeFromCart(item._id)} className="text-xs text-red-500 font-bold hover:underline shrink-0 p-2">
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Right side checkout valuation billing block */}
      <div className="w-full md:w-80 bg-white p-5 rounded-xl border border-slate-100 shadow-sm h-fit space-y-4">
        <h3 className="font-black text-sm text-slate-800 tracking-tight uppercase border-b pb-2">Manifest Total</h3>
        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>Items in cart:</span>
          <span className="font-bold text-slate-800">{cart.length} units</span>
        </div>
        <div className="flex justify-between items-baseline border-t border-slate-50 pt-3">
          <span className="text-xs font-bold text-slate-700">Total Payable:</span>
          <span className="text-xl font-black text-red-600">₹{totalAmount}</span>
        </div>
        <button onClick={() => navigate('/checkout')} className="w-full bg-slate-900 text-white font-bold text-xs tracking-wider uppercase py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-[0.99] text-center block">
          Secure Checkout 🔒
        </button>
      </div>
    </div>
  );
}