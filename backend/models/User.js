const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true }, // Mandatory Phone No
    walletBalance: { type: Number, default: 0 },         // Wallet Balance tracking
    profilePic: { type: String, default: "" },            // DP Image url link
    savedAddress: { type: String, default: "" }, 
    role: { type: String, default: "User" }, // User ya Admin
    status: { type: String, default: "Active" }, // Active ya Inactive
    isOnline: { type: Boolean, default: false },         // Recent Saved Address string
    customId: { type: String }
}, { timestamps: true });

// 🔥 FIX: Async hook me se 'next' completely saaf kar diya hai taaki crash na ho
UserSchema.pre('save', async function () {
    if (!this.customId) {
        this.customId = "USR" + Date.now().toString().slice(-6);
    }
});

module.exports = mongoose.model('User', UserSchema);