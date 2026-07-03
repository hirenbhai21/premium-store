const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');

// GET /api/admin/users -> Saare users ka aggregated CRM ledger data
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        const orders = await Order.find();

        const processedUsers = users.map(user => {
            const userOrders = orders.filter(o => o.userId.toString() === user._id.toString());
            const totalSpent = userOrders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.totalAmount, 0);
            
            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                isBlocked: user.isBlocked,
                ordersCount: userOrders.length,
                totalSpent
            };
        });

        res.json(processedUsers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user grid matrix", error: error.message });
    }
});

// PUT /api/admin/users/toggle-block/:id -> Block/Unblock switch
router.put('/users/toggle-block/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User nahi mila!" });

        user.isBlocked = !user.isBlocked;
        await user.save();
        res.json({ message: `User status changed to ${user.isBlocked ? 'Blocked' : 'Active'}`, isBlocked: user.isBlocked });
    } catch (error) {
        res.status(500).json({ message: "Error toggling block node", error: error.message });
    }
});

module.exports = router;