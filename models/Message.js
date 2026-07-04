const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    room: { type: String, required: true },       // User ID
    senderId: { type: String, required: true },   // User ID or 'ADMIN_SUPER_ID'
    senderName: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: String, required: true },
    isSeen: { type: Boolean, default: false },
    isClosed: { type: Boolean, default: false }   
}, { timestamps: true });

module.exports = mongoose.model('Chat', MessageSchema, 'chats');