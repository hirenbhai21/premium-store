const mongoose = require('mongoose');
const Counter = require('./Counter');

const orderSchema = new mongoose.Schema({
    customId: { type: String, unique: true }, // 🔥 Custom Order ID
    userId: { type: String, required: true }, // Mapping Custom User ID here
    items: { type: Array, required: true },
    shippingInfo: {
        fullName: String,
        phone: String,
        pincode: String,
        city: String,
        address: String
    },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'Order Placed' },
    deliveredAt: { type: Date },
    adminNotes: { type: String, default: "" }, 
    returnRejectionReason: { type: String, default: "" },
    statusTimeline: [{ status: String, timestamp: { type: Date, default: Date.now } }]
}, { timestamps: true });

// 🔥 FIX: (next) hata diya taaki next is not a function ka backend crash hamesha ke liye khatam ho jaye!
orderSchema.pre('save', async function () {
    if (!this.customId) {
        const counter = await Counter.findOneAndUpdate(
            { id: 'orderId' },
            { $inc: { seq: 1 } },
            { returnDocument: 'after', upsert: true } // Warning free clean updates
        );
        // Generates: ORD2026-0001, ORD2026-0002...
        this.customId = `ORD2026-${String(counter.seq).padStart(4, '0')}`;
    }
});

module.exports = mongoose.model('Order', orderSchema);