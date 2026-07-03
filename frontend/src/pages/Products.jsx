import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [reloadStock, setReloadStock] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [preview, setPreview] = useState(null); 
  const [editingProduct, setEditingProduct] = useState(null); 
  const [editFiles, setEditFiles] = useState([]); // 🔥 State for selected images in edit
  const [storeBrands, setStoreBrands] = useState([]); // Dynamic brands synchronized list

  useEffect(() => { 
    fetchProducts(); 
    // 🔥 Dynamic Brand list loading across store components
    const savedBrands = JSON.parse(localStorage.getItem('myStoreBrands')) || ['Premium Brand', 'Generic'];
    setStoreBrands(savedBrands);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      setProducts(res.data);
    } catch (err) { console.error("Error fetching products:", err); }
  };

  const handleQuickStockReload = async (id, currentStock) => {
    const addValue = Number(reloadStock[id]);
    if (!addValue || addValue <= 0) return alert("Sahi number daalo!");
    try {
      await axios.patch(`http://localhost:5000/api/products/update-stock/${id}`, { stock: Number(currentStock) + addValue });
      alert("Stock update ho gaya!");
      setReloadStock({ ...reloadStock, [id]: '' });
      fetchProducts();
    } catch (err) { alert("Stock update nahi ho paya!"); }
  };

  const saveEdit = async () => {
    try {
      // 🔥 FORM DATA SYNC FOR MULTIPART IMAGE UPLOAD HANDLING
      const data = new FormData();
      data.append('name', editingProduct.name || '');
      data.append('description', editingProduct.description || '');
      data.append('price', editingProduct.price || 0);
      data.append('discountPrice', editingProduct.discountPrice || 0);
      data.append('weight', editingProduct.weight || '');
      data.append('flavor', editingProduct.flavor || '');
      data.append('stock', editingProduct.stock || 0);
      data.append('category', editingProduct.category || '');
      data.append('brand', editingProduct.brand || '');
      data.append('returnDays', editingProduct.returnDays || 0);
      data.append('customAttributes', JSON.stringify(editingProduct.customAttributes || []));

      // Append files if selected
      editFiles.forEach(file => data.append('images', file));

      const res = await axios.put(`http://localhost:5000/api/products/update-product/${editingProduct._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setEditingProduct(null);
      setEditFiles([]);
      fetchProducts();
      alert("Sari details update ho gayi hain!");
    } catch (err) { 
      console.error("Asali Error Log:", err);
      const serverError = err.response?.data?.message || err.message;
      alert(`⚠️ Actual Error: ${serverError}`); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Sach me delete karna hai?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      fetchProducts();
    } catch (err) { alert("Delete nahi ho paya!"); }
  };

  const exportCSV = () => {
    const headers = ["Name", "Brand", "Category", "Stock", "Price"];
    const rows = products.map(p => [p.name, p.brand || 'N/A', p.category, p.stock, p.discountPrice || p.price]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'inventory.csv'; a.click();
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === 'All' || p.category === categoryFilter)
    );
  }, [products, searchTerm, categoryFilter]);

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen font-sans w-full">
      
      {/* HEADER CONTROL BAR */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Global Warehouse Inventory</h2>
          <div className="flex gap-2 mt-2">
            <input placeholder="Search name..." onChange={e => setSearchTerm(e.target.value)} className="p-1.5 border rounded-lg text-xs outline-none focus:border-slate-400 bg-white" />
            <select onChange={e => setCategoryFilter(e.target.value)} className="p-1.5 border rounded-lg text-xs bg-white outline-none cursor-pointer">
              <option value="All">All Categories</option>
              {[...new Set(products.map(p => p.category))].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm">Export CSV</button>
          <span className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm">Vault Items: {filteredProducts.length}</span>
        </div>
      </div>

      {/* MASTER INVENTORY TABLE */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="p-4">Image</th>
              <th className="p-4">Product Name</th>
              <th className="p-4">Brand</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock Status</th>
              <th className="p-4">Meta Data</th>
              <th className="p-4">⚡ Quick Stock Reload</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredProducts.map(product => (
              <tr key={product._id} className="hover:bg-slate-50/60 transition-all">
                <td className="p-4">
                  <img src={product.images?.[0]} onClick={() => setPreview(product)} className="w-10 h-10 object-contain cursor-pointer bg-slate-50 rounded-lg p-0.5 border border-slate-100 hover:scale-105 transition-transform" alt="product" />
                </td>
                <td onClick={() => setPreview(product)} className="p-4 font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors">
                  {product.name}
                </td>
                <td className="p-4 text-slate-600 font-semibold">{product.brand || 'N/A'}</td>
                <td className="p-4"><span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[10px] uppercase">{product.category || 'Supplement'}</span></td>
                <td className="p-4 font-bold text-slate-900">₹{product.discountPrice || product.price}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${product.stock > 5 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                    {product.stock} left
                  </span>
                </td>
                <td className="p-4 text-slate-400 text-[10px] font-normal">
                  <div>Refreshed: {new Date(product.updatedAt || Date.now()).toLocaleTimeString()}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5">
                    <input type="number" placeholder="+ Add" value={reloadStock[product._id] || ''} onChange={e => setReloadStock({ ...reloadStock, [product._id]: e.target.value })} className="w-16 p-1.5 border border-slate-200 rounded-lg text-center bg-slate-50/50 outline-none" />
                    <button onClick={() => handleQuickStockReload(product._id, product.stock)} className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase shadow-sm transition-all">Reload</button>
                  </div>
                </td>
                <td className="p-4 text-center space-x-1 whitespace-nowrap">
                  <button onClick={() => setEditingProduct(product)} className="bg-slate-100 hover:bg-slate-200 border text-slate-700 px-2.5 py-1.5 rounded-lg font-semibold transition-colors">Edit</button>
                  <button onClick={() => handleDelete(product._id)} className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-lg font-semibold transition-colors shadow-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: PREVIEW SYSTEM */}
      {preview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50" onClick={() => setPreview(null)}>
          <div className="bg-white p-6 rounded-2xl w-[460px] shadow-xl border border-slate-100 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 font-bold text-sm" onClick={() => setPreview(null)}>✕ Close</button>
            <div className="h-60 border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex items-center justify-center mb-4">
              <img src={preview.images?.[0]} alt="preview" className="max-h-full max-w-full object-contain mix-blend-multiply" />
            </div>
            <div className="flex gap-2 mb-2">
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{preview.category}</span>
              {preview.brand && <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{preview.brand}</span>}
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">{preview.name}</h3>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl my-3 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900">₹{preview.discountPrice || preview.price}</span>
              {preview.discountPrice && <span className="text-xs text-slate-400 line-through font-medium">MRP ₹{preview.price}</span>}
            </div>
            <div className="text-[11px] font-medium text-slate-600 space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <p>⚖️ <span className="text-slate-400">Weight Metric:</span> {preview.weight || 'Standard Pack'}</p>
              {preview.flavor && <p>👅 <span className="text-slate-400">Flavor Profile:</span> {preview.flavor}</p>}
              <p className={preview.stock > 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>📦 Stock Remaining: {preview.stock} units</p>
            </div>
            <div className="mt-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Product Description</h4>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">{preview.description || 'No description added.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITING MAPPING FORM (Dynamic Brand Selector + Image Editor Integrated) */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-4">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">✏️ Alter Product Complete Blueprint</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Database ID Reference: {editingProduct._id}</p>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Product Name / Title</label>
                <input className="w-full border p-2.5 rounded-lg font-medium bg-slate-50/50 outline-none" value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Brand Name Dropdown</label>
                  {/* 🔥 DYNAMIC BRAND DROP-DOWN CONNECTED WITH STORE BRANDS CONFIG */}
                  <select 
                    className="w-full border p-2.5 rounded-lg font-bold bg-slate-50/50 outline-none text-slate-700 cursor-pointer"
                    value={editingProduct.brand || ''} 
                    onChange={e => setEditingProduct({...editingProduct, brand: e.target.value})}
                  >
                    <option value="" disabled>Select Brand...</option>
                    {storeBrands.map((b, i) => <option key={i} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Category Classification</label>
                  <input className="w-full border p-2.5 rounded-lg font-medium bg-slate-50/50 outline-none" value={editingProduct.category || ''} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">M.R.P Base Price (₹)</label>
                  <input type="number" className="w-full border p-2.5 rounded-lg font-medium bg-slate-50/50 outline-none" value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Discounted Deal Price (₹)</label>
                  <input type="number" className="w-full border p-2.5 rounded-lg font-medium bg-slate-50/50 outline-none" value={editingProduct.discountPrice || ''} onChange={e => setEditingProduct({...editingProduct, discountPrice: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Warehouse Stock</label>
                  <input type="number" className="w-full border p-2 rounded-lg font-medium bg-slate-50/50 text-center outline-none" value={editingProduct.stock || '0'} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Net Weight</label>
                  <input className="w-full border p-2 rounded-lg font-medium bg-slate-50/50 text-center outline-none" value={editingProduct.weight || ''} onChange={e => setEditingProduct({...editingProduct, weight: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Flavor Profile</label>
                  <input className="w-full border p-2 rounded-lg font-medium bg-slate-50/50 text-center outline-none" value={editingProduct.flavor || ''} onChange={e => setEditingProduct({...editingProduct, flavor: e.target.value})} />
                </div>
              </div>

              {/* Policy Trigger mapping input */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Return Policy</label>
                <select 
                  value={editingProduct.returnDays || 0} 
                  onChange={(e) => setEditingProduct({...editingProduct, returnDays: Number(e.target.value)})}
                  className="w-full border p-2.5 rounded-lg font-bold bg-slate-50/50 outline-none text-slate-700 cursor-pointer"
                >
                  <option value="0">No Return Allowed (0 Days)</option>
                  <option value="1">1 Day Return</option>
                  <option value="3">3 Days Return</option>
                  <option value="5">5 Days Return</option>
                  <option value="7">7 Days Return</option>
                </select>
              </div>

              {/* 🔥 NEW FEATURE: NEW IMAGE UPLOADER AT THE TIME OF EDIT */}
              <div className="p-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-[10px] font-bold text-slate-500 uppercase text-center">
                <label className="block mb-1 text-slate-700">Change Product Photos (Leaves blank to keep old)</label>
                <input type="file" multiple accept="image/*" onChange={e => setEditFiles(Array.from(e.target.files))} className="w-full file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Product Description</label>
                <textarea rows="3" className="w-full border p-2.5 rounded-lg font-medium bg-slate-50/50 resize-none outline-none leading-relaxed text-slate-600" value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}></textarea>
              </div>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button onClick={() => { setEditingProduct(null); setEditFiles([]); }} className="flex-1 border p-2.5 text-xs font-semibold rounded-xl text-slate-500 hover:bg-slate-50">Abort Changes</button>
              <button onClick={saveEdit} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white p-2.5 text-xs font-semibold rounded-xl shadow-md">Push Updates ⚡</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}