const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Multer storage setup for user profile images avatar uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, 'DP-' + Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// 🔥 PROFILE COMPLETE UPDATE ENGINE (Bypasses email alteration, saves DP and Address)
router.put('/update-profile/:id', upload.single('profilePic'), async (req, res) => {
    try {
        const { name, phone, password, savedAddress } = req.body;
        const updateData = { name, phone, savedAddress };

        if (password && password.trim() !== "") {
            updateData.password = await bcrypt.hash(password, 10);
        }

        if (req.file) {
            updateData.profilePic = `http://localhost:5000/uploads/${req.file.filename}`;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        ).select('-password');

        res.status(200).json({ message: "Profile update ho gayi!", user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: "Server update error", error: err.message });
    }
});

// 🔥 WALLET TOP-UP DIRECT NODE ENGINE
router.post('/wallet/topup/:id', async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.walletBalance = (user.walletBalance || 0) + Number(amount);
        await user.save();

        res.status(200).json({ message: "Wallet Balance updated!", balance: user.walletBalance, user });
    } catch (err) {
        res.status(500).json({ message: "Wallet logic failure", error: err.message });
    }
});

module.exports = router;