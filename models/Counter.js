const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // 'userId', 'orderId', 'productId'
    seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', counterSchema);