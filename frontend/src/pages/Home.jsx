import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client'; // 🔥 Socket client

const calculateDiscount = (price, discountPrice) => {
  if (!price || !discountPrice || price <= discountPrice) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
};

export default function Home() {
  const [products, setProducts] = useState([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [brand, setBrand] = useState('All');
  const [minDiscount, setMinDiscount] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Mobile Filter Drawer State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // TOAST NOTIFICATION STATE
  const [toast, setToast] = useState({ visible: false, message: '' });

  const { cart, addToCart, updateQuantity, removeFromCart } = useContext(CartContext);
  const navigate = useNavigate();

  // ----- 🔥 Socket + product fetching (merged) -----
  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  useEffect(() => {
    // 1. Initial load
    fetchProducts();

    // 2. Connect Socket.IO
    const socket = io('http://localhost:5000');

    // Listen for product updates (full product object)
    socket.on('product_updated', (updatedProd) => {
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === updatedProd._id ? updatedProd : p
        )
      );
    });

    // Listen for stock reloads (only stock field changes)
    socket.on('stock_reloaded', (data) => {
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === data.id ? { ...p, stock: data.stock } : p
        )
      );
    });

    // 3. Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []); // empty dependency – runs once

  // ----- rest of the component (unchanged) -----

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, 3000);
  };

  const handleBuyNow = (e, product) => {
    e.stopPropagation();
    const existing = cart.find(item => item._id === product._id);
    if (!existing) {
      addToCart(product);
    }
    navigate('/checkout');
  };

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const brands = ['All', ...new Set(products.map(p => p.brand).filter(Boolean))];

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = category === 'All' || p.category === category;
      const matchBrand = brand === 'All' || p.brand === brand;
      const pDiscount = calculateDiscount(p.price, p.discountPrice);
      const matchDiscount = minDiscount === 'All' || pDiscount >= parseInt(minDiscount);
      return matchSearch && matchCategory && matchBrand && matchDiscount;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'newest') return a._id < b._id ? 1 : -1;
      if (sortBy === 'price-asc') return (a.discountPrice || a.price) - (b.discountPrice || b.price);
      if (sortBy === 'price-desc') return (b.discountPrice || b.price) - (a.discountPrice || a.price);
      if (sortBy === 'discount-desc') return calculateDiscount(b.price, b.discountPrice) - calculateDiscount(a.price, a.discountPrice);
      return 0;
    });
  }, [products, searchTerm, category, brand, minDiscount, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setCategory('All');
    setBrand('All');
    setMinDiscount('All');
    setSortBy('newest');
    setIsMobileFilterOpen(false);
  };

  const renderFilterPanel = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center lg:hidden">
        <h3 className="font-extrabold text-lg text-slate-900">Filters</h3>
        <button onClick={() => setIsMobileFilterOpen(false)} className="text-slate-400 hover:text-slate-900 font-bold text-lg">
          ✕
        </button>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Search</label>
        <input 
          type="text" placeholder="Search products..." 
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sort By</label>
        <select 
          value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none text-slate-800"
        >
          <option value="newest">New Arrivals</option>
          <option value="discount-desc">Max Discount</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
        <select 
          value={category} onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none text-slate-700"
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Brand</label>
        <select 
          value={brand} onChange={(e) => setBrand(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none text-slate-700"
        >
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Discount</label>
        <select 
          value={minDiscount} onChange={(e) => setMinDiscount(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none text-slate-700"
        >
          <option value="All">Any Discount</option>
          <option value="10">10% Off or more</option>
          <option value="20">20% Off or more</option>
          <option value="50">50% Off or more</option>
        </select>
      </div>

      <button 
        onClick={clearFilters}
        className="w-full py-3 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all"
      >
        Clear All Filters
      </button>
    </div>
  );

  return (
    <div className="py-8 bg-slate-50 min-h-screen px-4 sm:px-6 relative overflow-hidden">
      
      {/* TOAST COMPONENT */}
      {toast.visible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-10 z-[100] bg-slate-900 text-white px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 transform transition-all duration-500 ease-out">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20">
            <span className="text-green-400 text-sm">✔</span>
          </div>
          <p className="text-sm font-semibold tracking-wide">{toast.message}</p>
        </div>
      )}

      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-5 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Our Collection</h2>
          <p className="text-sm text-slate-500 mt-1">Discover premium formulas and latest arrivals.</p>
        </div>
        
        <div className="w-full md:w-auto flex justify-between items-center gap-4">
          <span className="bg-indigo-50 text-indigo-700 font-bold text-xs px-4 py-2 rounded-lg border border-indigo-100">
            {filteredAndSortedProducts.length} Products
          </span>
          <button 
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-slate-700 shadow-sm"
          >
            Filters / Sort
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* DESKTOP SIDEBAR */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-24">
            {renderFilterPanel()}
          </div>
        </div>

        {/* MOBILE FILTER DRAWER */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)}></div>
            <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl p-6 overflow-y-auto">
              {renderFilterPanel()}
            </div>
          </div>
        )}
        
        {/* PRODUCTS GRID */}
        <div className="flex-1">
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800">No matching products</h3>
              <p className="text-slate-500 mt-2 mb-6">Try changing your filters or search term.</p>
              <button 
                onClick={clearFilters}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold tracking-wide hover:bg-slate-800 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedProducts.map((product) => {
                const pDiscount = calculateDiscount(product.price, product.discountPrice);
                const cartItem = cart.find(item => item._id === product._id);

                return (
                  <div 
                    key={product._id} 
                    onClick={() => navigate(`/product/${product._id}`)}
                    className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                  >
                    {/* IMAGE */}
                    <div className="relative h-48 w-full mb-4 bg-slate-50 rounded-lg flex items-center justify-center p-4 border border-slate-100 overflow-hidden">
                      {pDiscount > 0 && (
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm z-10">
                          {pDiscount}% OFF
                        </span>
                      )}
                      {product.images?.[0] ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name} 
                          className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">No Preview</span>
                      )}
                    </div>

                    {/* DETAILS */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-1 rounded font-bold uppercase tracking-wider">
                          {product.category || 'Product'}
                        </span>
                        {product.brand && (
                          <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                            {product.brand}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-1">{product.name}</h3>
                      
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3 h-8 leading-relaxed">
                        {product.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-600 mb-4 bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                        <span className="flex items-center gap-1">
                          <span className="font-semibold text-slate-400">Weight:</span> 
                          <span className="font-bold text-slate-700">{product.weight || 'N/A'}</span>
                        </span>
                        {product.flavor && (
                          <span className="flex items-center gap-1">
                            <span className="font-semibold text-slate-400">Flavor:</span> 
                            <span className="font-bold text-slate-700">{product.flavor}</span>
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="mt-auto mb-4 flex items-baseline gap-2">
                        <span className="text-xl font-extrabold text-slate-900">₹{product.discountPrice || product.price}</span>
                        {product.price && product.discountPrice && (
                          <span className="text-xs text-slate-400 line-through font-medium">MRP ₹{product.price}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* BUTTONS: Add to Cart OR Quantity Plus/Minus */}
                    <div className="flex gap-2 mt-2">
                      {cartItem ? (
                        <div className="flex-1 flex items-center justify-between bg-slate-50 border border-indigo-200 rounded-lg overflow-hidden shadow-sm">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (cartItem.quantity <= 1) {
                                removeFromCart(product._id);
                              } else {
                                updateQuantity(product._id, -1);
                              }
                            }}
                            className="w-10 py-2.5 flex justify-center text-indigo-600 hover:bg-indigo-100 font-bold text-lg leading-none transition-colors"
                          >
                            -
                          </button>
                          <span className="font-bold text-xs text-slate-900">
                            {cartItem.quantity}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(product._id, 1);
                            }}
                            disabled={cartItem.quantity >= product.stock}
                            className="w-10 py-2.5 flex justify-center text-indigo-600 hover:bg-indigo-100 font-bold text-lg leading-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            addToCart(product); 
                            showToast('Item added to cart!'); 
                          }} 
                          disabled={product.stock <= 0}
                          className={`flex-1 py-2.5 px-2 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all border 
                            ${product.stock > 0 
                              ? 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-sm' 
                              : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'}`}
                        >
                          {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                        </button>
                      )}

                      <button 
                        onClick={(e) => handleBuyNow(e, product)} 
                        disabled={product.stock <= 0}
                        className={`flex-1 py-2.5 px-2 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm
                          ${product.stock > 0 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}