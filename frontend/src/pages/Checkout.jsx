import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import axios from 'axios';

export default function Checkout() {
  const { cart, updateQuantity } = useContext(CartContext);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: null, lon: null });
  const [shippingInfo, setShippingInfo] = useState({ fullName: user?.name || '', phone: '', pincode: '', city: '', address: '' });
  const [savedAddress, setSavedAddress] = useState(null);

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  useEffect(() => {
    const lastAddress = JSON.parse(localStorage.getItem('lastSavedShippingInfo'));
    if (lastAddress) setSavedAddress(lastAddress);
  }, []);

  if (!cart || cart.length === 0) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto font-sans">
        <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
        <button onClick={() => navigate('/')} className="mt-4 bg-slate-900 text-white px-4 py-2 rounded-xl">Back to Store</button>
      </div>
    );
  }

  // Delivery aur Tax (Agar aapko lagana ho toh, abhi click calculate ke liye delivery 0 rakhi hai)
  const deliveryCharges = 0;
  const itemsTotal = cart.reduce((total, item) => total + (item.discountPrice || item.price) * item.quantity, 0);
  const grandTotal = itemsTotal + deliveryCharges;

  const getCurrentLocation = () => {
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      setCoordinates({ lat: latitude, lon: longitude });
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        if (data?.address) {
          setShippingInfo(prev => ({
            ...prev,
            city: data.address.city || data.address.state_district || '',
            pincode: data.address.postcode || '',
            address: data.display_name || ''
          }));
        }
      } catch (err) { console.error(err); }
      setIsFetchingLocation(false);
    }, () => setIsFetchingLocation(false));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('lastSavedShippingInfo', JSON.stringify(shippingInfo));

      const res = await axios.post('http://localhost:5000/api/orders/place', { 
        userId: user?.customId || user?.id || user?._id || "GUEST", 
        items: cart, 
        shippingInfo
      });
      
      alert(res.data.message || "🎉 Order Placed Successfully!");
      localStorage.removeItem('myPremiumCart'); 
      window.location.href = '/myorders';
    } catch (err) { 
      const serverMessage = err.response?.data?.message || "Execution Fail! Server down or Network Issue.";
      alert(serverMessage); 
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 font-sans flex flex-col lg:flex-row gap-8 bg-[#f8fafc] min-h-screen">
      
      {/* LEFT COLUMN: Shipping Form (100% Same design kept) */}
      <div className="flex-1 bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
        {savedAddress && (
          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs flex justify-between items-center">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-indigo-900">📍 Last Used Location Found</p>
              <p className="text-slate-600 truncate mt-0.5">{savedAddress.address} ({savedAddress.city})</p>
            </div>
            <button type="button" onClick={() => setShippingInfo(savedAddress)} className="bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all text-[11px] shrink-0 ml-2">
              Use This Address
            </button>
          </div>
        )}

        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">📍 Delivery Address</h2>
          <button type="button" onClick={getCurrentLocation} disabled={isFetchingLocation} className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
            {isFetchingLocation ? 'Fetching...' : '🎯 Auto-Fill'}
          </button>
        </div>

        {coordinates.lat && (
          <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 h-36 relative">
            <iframe width="100%" height="100%" src={`https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lon}&z=15&output=embed`}></iframe>
          </div>
        )}
        
        <form onSubmit={handlePlaceOrder} className="space-y-3.5">
          <input type="text" placeholder="Consignee Full Name" value={shippingInfo.fullName} onChange={e => setShippingInfo({...shippingInfo, fullName: e.target.value})} required className="w-full p-2.5 border rounded-lg text-xs outline-none font-medium focus:border-slate-400 bg-slate-50/50" />
          <input type="number" placeholder="Active Contact Number" value={shippingInfo.phone} onChange={e => setShippingInfo({...shippingInfo, phone: e.target.value})} required className="w-full p-2.5 border rounded-lg text-xs outline-none font-medium focus:border-slate-400 bg-slate-50/50" />
          
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Area Pincode" value={shippingInfo.pincode} onChange={e => setShippingInfo({...shippingInfo, pincode: e.target.value})} required className="p-2.5 border rounded-lg text-xs outline-none font-medium focus:border-slate-400 bg-slate-50/50" />
            <input type="text" placeholder="Hub Destination City" value={shippingInfo.city} onChange={e => setShippingInfo({...shippingInfo, city: e.target.value})} required className="p-2.5 border rounded-lg text-xs outline-none font-medium focus:border-slate-400 bg-slate-50/50" />
          </div>

          <textarea placeholder="Full Shipping Address" value={shippingInfo.address} onChange={e => setShippingInfo({...shippingInfo, address: e.target.value})} required rows="3" className="w-full p-2.5 border rounded-lg text-xs outline-none font-medium focus:border-slate-400 bg-slate-50/50"></textarea>

          <h3 className="font-bold text-xs uppercase text-slate-400 pt-1">Payment Options</h3>
          <div className="p-3 border border-slate-100 rounded-lg bg-slate-50 flex gap-4 text-[11px] font-bold uppercase text-slate-600">
            <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" required defaultChecked /> Cash on Delivery (COD)</label>
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white p-3.5 rounded-lg font-semibold text-xs tracking-wider uppercase hover:bg-slate-800 transition-all">
            Confirm Order - ₹{grandTotal}
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: Beautiful Manifest Products & Clear Bill Details */}
      <div className="w-full lg:w-80 bg-white p-4 rounded-xl border border-slate-100 shadow-sm h-fit flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2 mb-3">Items Selected ({cart.length})</h3>
          
          {/* Products List Loop */}
          <div className="max-h-60 overflow-y-auto space-y-3 pr-1 mb-4">
            {cart.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 border-b border-slate-50 pb-2.5 last:border-none last:pb-0">
                
                {/* Clickable Product Image Link */}
                <Link to={`/product/${item._id}`} className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                  <img src={item.images?.[0] || '📦'} alt="product" className="w-11 h-11 object-contain bg-slate-50 rounded-lg border border-slate-100 p-0.5" />
                </Link>

                <div className="flex-1 text-[11px] min-w-0">
                  {/* Clickable Product Name Link */}
                  <Link to={`/product/${item._id}`} className="font-bold text-slate-800 truncate block cursor-pointer hover:text-indigo-600 transition-colors">
                    {item.name}
                  </Link>
                  
                  {/* Plus Minus Buttons in a neat compact spot */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <button type="button" onClick={() => updateQuantity(item._id, -1)} className="w-4 h-4 flex items-center justify-center bg-slate-100 border border-slate-200 rounded text-[10px] font-black text-slate-600 hover:bg-slate-200">-</button>
                    <span className="font-black text-slate-700 text-[10px]">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item._id, 1)} className="w-4 h-4 flex items-center justify-center bg-slate-100 border border-slate-200 rounded text-[10px] font-black text-slate-600 hover:bg-slate-200">+</button>
                  </div>
                </div>

                {/* Product Price Right Side */}
                <div className="text-right shrink-0">
                  <div className="font-bold text-xs text-slate-900">₹{(item.discountPrice || item.price) * item.quantity}</div>
                  <div className="text-[9px] text-slate-400 font-medium">₹{item.discountPrice || item.price} / unit</div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* 🔥 NEW COMPONENT: Clean, Detailed Billing Breakdown */}
        <div className="border-t border-slate-100 pt-4 mt-2 space-y-2">
          <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Price Details</h4>
          
          {/* Map Items inside Price details with Quantity Multiplication info */}
          <div className="space-y-1.5 max-h-32 overflow-y-auto bg-slate-50/50 border border-slate-100 p-2.5 rounded-lg">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[10px] text-slate-600 font-medium">
                <span className="truncate max-w-[160px]">{item.name} <span className="text-slate-400">(x{item.quantity})</span></span>
                <span className="font-semibold text-slate-700">₹{(item.discountPrice || item.price) * item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Core Invoice Summary */}
          <div className="flex justify-between text-xs text-slate-500 pt-1">
            <span>Items Total:</span>
            <span className="font-bold text-slate-800">₹{itemsTotal}</span>
          </div>
          
          <div className="flex justify-between text-xs text-slate-500">
            <span>Delivery Charges:</span>
            <span className="font-bold text-green-600">{deliveryCharges === 0 ? "FREE" : `₹${deliveryCharges}`}</span>
          </div>

          <div className="border-t border-slate-200/60 pt-2.5 flex justify-between items-baseline font-sans">
            <span className="text-xs font-black text-slate-800">Total Payable Amount:</span>
            <span className="text-xl font-black text-red-600">₹{grandTotal}</span>
          </div>
        </div>
      </div>

    </div>
  );
}