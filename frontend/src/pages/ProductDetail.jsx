import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';

// 🔹 Utility
const calculateDiscount = (price, discountPrice) => {
  if (!price || !discountPrice || price <= discountPrice) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart, updateQuantity, removeFromCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/products/${id}`);
        setProduct(data);
        setMainImage(data.images?.[0] || '');
      } catch (err) {
        console.error("Error fetching product:", err);
      }
    };

    fetchProduct();
  }, [id]);

  if (!product) {
    return (
      <div className="text-center py-20 text-slate-400 font-medium">
        Loading product...
      </div>
    );
  }

  const discountPercent = calculateDiscount(product.price, product.discountPrice);
  const cartItem = cart.find(item => item._id === product._id);

  const handleBuyNow = () => {
    if (!cartItem) addToCart(product);
    navigate('/checkout');
  };

  return (
    <div className="max-w-6xl mx-auto pt-4 pb-8 px-4 bg-[#f8fafc] min-h-screen">

      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm grid md:grid-cols-2 gap-10 relative">

        {/* 🔙 BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-sm text-slate-500 hover:text-slate-900 bg-slate-100 px-3 py-1 rounded-lg"
        >
          ← Back
        </button>

        {/* LEFT - IMAGES */}
        <div>
          <div className="h-96 flex items-center justify-center bg-slate-50 rounded-2xl p-6">
            <img
              src={mainImage}
              alt={product.name}
              className="max-h-full object-contain"
            />
          </div>

          <div className="flex gap-2 mt-3">
            {product.images?.map((img, i) => (
              <img
                key={i}
                src={img}
                alt="thumb"
                onClick={() => setMainImage(img)}
                className={`w-20 h-20 object-contain p-2 rounded-xl cursor-pointer border-2 ${
                  mainImage === img ? 'border-indigo-600' : 'border-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* RIGHT - DETAILS */}
        <div className="flex flex-col pt-6 md:pt-0">

          {/* CATEGORY + BRAND */}
          <div className="flex flex-row-reverse gap-2 mb-3">
  {/* Category Label - Right Side */}
  <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-medium text-slate-600">
    <span className="font-bold text-slate-800">Category:</span> {product.category}
  </span>

  {/* Brand Label - Next to Category (Right Side) */}
  {product.brand && (
    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
      <span className="font-bold text-indigo-800">Brand:</span> {product.brand}
    </span>
  )}
</div>

          {/* NAME */}
          <h1 className="text-3xl font-black text-slate-900 mb-3">
            {product.name}
          </h1>

          {/* PRICE */}
          <div className="flex items-center gap-4 mb-5">
            <span className="text-4xl font-bold">
              ₹{product.discountPrice || product.price}
            </span>

            {product.discountPrice && (
              <span className="line-through text-slate-400">
                ₹{product.price}
              </span>
            )}

            {discountPercent > 0 && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* DESCRIPTION */}
          <p className="text-slate-600 text-sm mb-6">
            {product.description}
          </p>

          {/* INFO BOX */}
          <div className="bg-slate-50 p-5 rounded-2xl space-y-4 text-sm mb-6">

            <div className="grid grid-cols-2 gap-4">
              <p>
                <span className="text-slate-400">Weight</span><br />
                <strong>{product.weight}</strong>
              </p>

              <p>
                <span className="text-slate-400">Flavor</span><br />
                <strong>{product.flavor || 'N/A'}</strong>
              </p>
            </div>

            {/* RETURN */}
            <div className="border-t pt-3 text-indigo-600 font-semibold">
              🔄 {product.returnDays > 0
                ? `${product.returnDays} Days Replacement`
                : "No Return"}
            </div>

            {/* CUSTOM ATTRIBUTES */}
            {product.customAttributes?.map((attr, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-slate-400">{attr.key}</span>
                <span className="font-semibold">{attr.value}</span>
              </div>
            ))}

          </div>

          {/* ACTIONS */}
          {/* ACTION BUTTONS */}
<div className="flex flex-col gap-3 mt-auto">
  
  {/* Add to Cart & Buy Now Buttons */}
  <div className="flex gap-4">
    {cartItem ? (
      <div className="flex-1 flex items-center justify-between bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
        <button onClick={() => cartItem.quantity <= 1 ? removeFromCart(product._id) : updateQuantity(product._id, -1)} className="px-6 py-4 text-xl font-bold hover:bg-slate-200">-</button>
        <span className="font-bold text-lg">{cartItem.quantity}</span>
        <button onClick={() => updateQuantity(product._id, 1)} disabled={cartItem.quantity >= product.stock} className="px-6 py-4 text-xl font-bold hover:bg-slate-200 disabled:opacity-40">+</button>
      </div>
    ) : (
      <button onClick={() => addToCart(product)} disabled={product.stock <= 0} className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition">
        {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
      </button>
    )}

    <button onClick={handleBuyNow} disabled={product.stock <= 0} className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition shadow-md">
      Buy Now
    </button>
  </div>

  {/* NEW BACK BUTTON - CENTERED */}
  {/* NEW BACK BUTTON - CENTERED & PREMIUM */}
<div className="flex justify-center mt-4">
  <button 
    onClick={() => navigate(-1)} 
    className="group flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest px-4 py-2 rounded-full border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-white transition-all duration-300"
  >
    <span className="transition-transform group-hover:-translate-x-1">←</span>
    Back to Store
  </button>
</div>
  
</div>

        </div>
      </div>
    </div>
  );
}