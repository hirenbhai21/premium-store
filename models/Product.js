const mongoose = require('mongoose');
const Counter = require('./Counter');

const productSchema = new mongoose.Schema({
    customId: { type: String, unique: true }, 
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number, required: true },
    images: { type: [String], required: true }, 
    weight: { type: String, required: true },
    flavor: { type: String },
    stock: { type: Number, required: true, default: 10 },
    returnDays: { type: Number, default: 0, min: 0, max: 7 }, 
    // Product schema me ye add karein
brand: { type: String },
customAttributes: { type: Array, default: [] }, // Dynamic fields store karne ke liye
    category: { type: String, required: true }
}, { timestamps: true });

// 🔥 PURE SIMPLE LOGIC - No 'next' function needed
productSchema.pre('save', async function () {
    if (!this.customId) {
        const counter = await Counter.findOneAndUpdate(
            { id: 'productId' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.customId = `PRODUCT2026-${String(counter.seq).padStart(4, '0')}`;
    }
});


module.exports = mongoose.model('Product', productSchema);