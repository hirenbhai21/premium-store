const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const orders = await Order.find(dateFilter);

        let totalRevenue = 0;
        let deliveredCount = 0;
        let codCount = 0;
        let productMap = {};

        orders.forEach(order => {
            if (order.status === 'Delivered') {
                totalRevenue += order.totalAmount;
                deliveredCount++;
            }
            // Payment type counters mock logic check (COD implicitly set default)
            codCount++;

            order.items.forEach(item => {
                productMap[item.name] = (productMap[item.name] || 0) + item.quantity;
            });
        });

        // Sort top selling products mapping
        const topProducts = Object.keys(productMap).map(name => ({
            name,
            units: productMap[name]
        })).sort((a,b) => b.units - a.units).slice(0, 5);

        const aov = deliveredCount > 0 ? Math.round(totalRevenue / deliveredCount) : 0;

        res.json({
            totalRevenue,
            totalOrders: orders.length,
            aov,
            topProducts,
            codCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;