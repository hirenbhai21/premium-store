import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AddProduct() {
  // 1. Core Form State
  const [formData, setFormData] = useState({ 
    name: '', description: '', price: '', discountPrice: '', 
    weight: '', flavor: '', stock: '10', category: '', returnDays: 0, brand: '' 
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  // 2. Brand Management State
  const [brands, setBrands] = useState([]);
  const [newBrand, setNewBrand] = useState('');
  const [showBrandManager, setShowBrandManager] = useState(false);

  // 3. Dynamic Custom Fields State
  const [customFields, setCustomFields] = useState([]);

  // Load brands from LocalStorage on mount
  useEffect(() => {
    const savedBrands = JSON.parse(localStorage.getItem('myStoreBrands')) || ['Premium Brand', 'Generic'];
    setBrands(savedBrands);
  }, []);

  // Brand Handlers
  const handleAddBrand = () => {
    if (!newBrand.trim() || brands.includes(newBrand)) return;
    const updatedBrands = [...brands, newBrand];
    setBrands(updatedBrands);
    localStorage.setItem('myStoreBrands', JSON.stringify(updatedBrands));
    setNewBrand('');
  };

  const handleDeleteBrand = (brandToRemove) => {
    const updatedBrands = brands.filter(b => b !== brandToRemove);
    setBrands(updatedBrands);
    localStorage.setItem('myStoreBrands', JSON.stringify(updatedBrands));
    if (formData.brand === brandToRemove) setFormData({ ...formData, brand: '' });
  };

  // Custom Field Handlers
  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const updateCustomField = (index, field, val) => {
    const updated = [...customFields];
    updated[index][field] = val;
    setCustomFields(updated);
  };

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return alert("Photo required!");
    
    const data = new FormData();
    
    // Add standard fields
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    
    // Add custom fields as a JSON string
    if (customFields.length > 0) {
      data.append('customAttributes', JSON.stringify(customFields));
    }

    // Add images
    selectedFiles.forEach(file => data.append('images', file));

    try {
      const res = await axios.post('http://localhost:5000/api/products/add', data, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      alert(res.data.message || "Product Saved!");
      
      // Reset Form
      setFormData({ 
        name: '', description: '', price: '', discountPrice: '', 
        weight: '', flavor: '', stock: '10', category: '', returnDays: 0, brand: '' 
      });
      setSelectedFiles([]);
      setCustomFields([]);
    } catch (error) {
      const realError = error.response?.data?.error || error.response?.data?.message || error.message;
      alert("ERROR: \n\n" + realError);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen flex flex-col items-center font-sans">
      
      {/* BRAND MANAGER TOP PANEL */}
      <div className="max-w-2xl w-full mb-6">
        <button 
          type="button"
          onClick={() => setShowBrandManager(!showBrandManager)}
          className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider w-full flex justify-between items-center shadow-sm hover:bg-indigo-100 transition-colors"
        >
          <span>🏷️ Manage Store Brands</span>
          <span>{showBrandManager ? '▲ Close' : '▼ Open'}</span>
        </button>

        {showBrandManager && (
          <div className="mt-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
            <div className="flex gap-2 mb-4">
              <input 
                type="text" placeholder="Type new brand name..." 
                value={newBrand} onChange={e => setNewBrand(e.target.value)}
                className="flex-1 p-2.5 border rounded-lg text-xs font-medium outline-none focus:border-indigo-400 bg-slate-50"
              />
              <button 
                onClick={handleAddBrand}
                className="bg-slate-900 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase hover:bg-slate-800"
              >
                Add Brand
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {brands.length === 0 ? <span className="text-xs text-slate-400">No brands added yet.</span> : null}
              {brands.map((b, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700">
                  {b}
                  <button onClick={() => handleDeleteBrand(b)} className="text-rose-500 hover:text-rose-700 ml-1 text-sm leading-none">
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MAIN ADD PRODUCT FORM */}
      <div className="max-w-2xl w-full bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3 mb-5">
          Mint New Asset
        </h2>
        
        <form onSubmit={handleAddProduct} className="space-y-4">
          <input type="text" placeholder="Product Title" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full p-3 border rounded-xl text-xs font-medium outline-none focus:border-indigo-400 bg-slate-50" />
          
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required className="w-full p-3 border rounded-xl text-xs font-medium outline-none focus:border-indigo-400 bg-slate-50" />
            
            <select 
              value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} required
              className="w-full p-3 border rounded-xl text-xs font-bold outline-none focus:border-indigo-400 bg-slate-50 text-slate-700 cursor-pointer"
            >
              <option value="" disabled>Select Brand...</option>
              {brands.map((b, i) => <option key={i} value={b}>{b}</option>)}
            </select>
          </div>

          <textarea placeholder="Product Description..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required rows="3" className="w-full p-3 border rounded-xl text-xs font-medium outline-none focus:border-indigo-400 bg-slate-50"></textarea>
          
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="M.R.P (₹)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="p-3 border rounded-xl text-xs font-medium outline-none focus:border-indigo-400 bg-slate-50" />
            <input type="number" placeholder="Sale Price (₹)" value={formData.discountPrice} onChange={e => setFormData({...formData, discountPrice: e.target.value})} required className="p-3 border rounded-xl text-xs font-medium outline-none focus:border-indigo-400 bg-slate-50" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <input type="text" placeholder="Weight" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} required className="p-3 border rounded-xl text-xs font-medium outline-none focus:border-indigo-400 bg-slate-50" />
            <input type="text" placeholder="Flavor" value={formData.flavor} onChange={e => setFormData({...formData, flavor: e.target.value})} className="p-3 border rounded-xl text-xs font-medium outline-none focus:border-indigo-400 bg-slate-50" />
            <input type="number" placeholder="Stock" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required className="p-3 border rounded-xl text-xs font-medium outline-none focus:border-indigo-400 bg-slate-50" />
          </div>

          {/* DYNAMIC CUSTOM FIELDS SECTION */}
          <div className="p-4 border border-indigo-100 rounded-xl bg-indigo-50/30 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Dynamic Fields</label>
              <button type="button" onClick={addCustomField} className="text-[10px] font-bold bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-50">
                + Add Custom Field
              </button>
            </div>
            
            {customFields.length === 0 && <p className="text-[10px] text-slate-400 font-medium">Add extra product specifications here (e.g. Dimensions, Material, Origin).</p>}
            
            {customFields.map((field, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input 
                  type="text" placeholder="e.g. Origin" value={field.key} 
                  onChange={(e) => updateCustomField(index, 'key', e.target.value)} 
                  className="flex-1 p-2.5 border rounded-lg text-xs font-medium outline-none focus:border-indigo-400 bg-white" 
                />
                <input 
                  type="text" placeholder="e.g. Made in India" value={field.value} 
                  onChange={(e) => updateCustomField(index, 'value', e.target.value)} 
                  className="flex-1 p-2.5 border rounded-lg text-xs font-medium outline-none focus:border-indigo-400 bg-white" 
                />
                <button type="button" onClick={() => removeCustomField(index)} className="bg-rose-50 text-rose-500 border border-rose-200 p-2.5 rounded-lg hover:bg-rose-100 transition-colors">
                  ✖
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Return Policy</label>
            <select 
              value={formData.returnDays} onChange={(e) => setFormData({...formData, returnDays: Number(e.target.value)})}
              className="p-3 border rounded-xl text-xs font-bold outline-none bg-slate-50 focus:border-indigo-400 text-slate-700"
            >
              <option value="0">No Return Allowed (0 Days)</option>
              <option value="1">1 Day Return</option>
              <option value="3">3 Days Return</option>
              <option value="5">5 Days Return</option>
              <option value="7">7 Days Return</option>
            </select>
          </div>
          
          <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
            <label className="block mb-2 text-slate-700">Upload Product Images</label>
            <input type="file" multiple accept="image/*" onChange={e => setSelectedFiles(Array.from(e.target.files))} className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
          </div>
          
          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all shadow-md active:scale-[0.99]">
            Save Product to Catalog
          </button>
        </form>
      </div>
    </div>
  );
}