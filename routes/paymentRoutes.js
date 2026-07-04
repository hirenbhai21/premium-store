const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

// 🛠️ RAZORPAY MACHINE INSTANCE
const razorpayInstance = new Razorpay({
    key_id: 'rzp_test_T91zhap2D3GM8K',       // 👈 Dashboard se mila Key ID yahan daalo
    key_secret: 'feN5UuwvUNpqYEjqd1cBN6hX' // 👈 Dashboard se mila Key Secret yahan daalo
});

// 🔥 1. CREATE PAYMENT ORDER (Frontend ke liye order ID generate karna)
router.post('/create-order', async (req, res) => {
    try {
        const { amount } = req.body; // Amount INR me hona chahiye (e.g. 500)
        if (!amount || amount <= 0) return res.status(400).json({ message: "Sahi amount pass karo bhai!" });

        const options = {
            amount: Number(amount) * 100, // Razorpay paise me amount leta hai (Rs 100 = 10000 paise)
            currency: "INR",
            receipt: "receipt_rcpt_" + Date.now().toString().slice(-5)
        };

        const order = await razorpayInstance.orders.create(options);
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error("Razorpay Order Error:", error.message);
        res.status(500).json({ message: "Payment initialization failure", error: error.message });
    }
});

// 🔥 2. VERIFY PAYMENT SIGNATURE (Security check to avoid fake transactions)
router.post('/verify-payment/:userId', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amountToAdd } = req.body;
        const { userId } = req.params;

        // Signature verify logic validation
        const hmac = crypto.createHmac('sha256', 'YOUR_RAZORPAY_KEY_SECRET_HERE'); // 👈 Key Secret yahan bhi daalo
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature === razorpay_signature) {
            // 🔥 PAYMENT SUCCESS: Update user wallet balance or mark order inside database
            const user = await User.findById(userId);
            if (user) {
                user.walletBalance = (user.walletBalance || 0) + Number(amountToAdd);
                await user.save();
                return res.status(200).json({ success: true, message: "🎉 Payment verified and balance credited successfully!", user });
            }
            return res.status(404).json({ message: "User not found inside system ledger." });
        } else {
            return res.status(400).json({ success: false, message: "Security Warning: Payment signature mismatch! Fake transaction alert." });
        }
    } catch (error) {
        res.status(500).json({ message: "Signature calculation break", error: error.message });
    }
});

module.exports = router;