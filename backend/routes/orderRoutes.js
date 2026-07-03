const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// ----------------------------------------------
// 1. Get all orders (latest first)
// ----------------------------------------------
router.get('/all', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Database read breakdown', error: error.message });
  }
});

// ----------------------------------------------
// 2. Place a new order (with return policy lock)
// ----------------------------------------------
router.post('/place', async (req, res) => {
  try {
    const { userId, items, shippingInfo } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: '❌ Cart khali hai!' });
    }

    let calculatedTotal = 0;
    const verifiedItems = [];

    for (const cartItem of items) {
      // Find product by _id or customId
      const product = await Product.findOne({
        $or: [
          { _id: mongoose.isValidObjectId(cartItem._id) ? cartItem._id : null },
          { customId: cartItem.customId || '' }
        ].filter(c => c !== null)
      });

      if (!product) {
        return res.status(404).json({ message: `❌ Product nahi mila!` });
      }

      const orderQty = Number(cartItem.quantity) || 1;
      if (product.stock < orderQty) {
        return res.status(400).json({ message: `❌ Stock error!` });
      }

      const activePrice = product.discountPrice || product.price;
      calculatedTotal += activePrice * orderQty;

      // Reduce stock
      product.stock -= orderQty;
      await product.save();

      verifiedItems.push({
        _id: product._id,
        customId: product.customId || '',
        name: product.name,
        price: activePrice,
        quantity: orderQty,
        image: product.images?.[0] || '',
        returnDays: product.returnDays || 0   // 🔥 lock the return policy at purchase time
      });
    }

    // Create order
    const newOrder = new Order({
      userId: userId || 'GUEST',
      items: verifiedItems,
      shippingInfo,
      totalAmount: calculatedTotal,
      status: 'Order Placed',
      statusTimeline: [{ status: 'Order Placed', timestamp: new Date() }]
    });

    await newOrder.save();

    // 🔥 Emit real‑time event to admin dashboard
    req.io.emit('new_order_placed', newOrder);

    res.status(201).json({ message: '🎉 Order placed successfully!', order: newOrder });
  } catch (error) {
    res.status(500).json({ message: 'Crash error', error: error.message });
  }
});

// ----------------------------------------------
// 3. Admin updates order status (with timeline)
// ----------------------------------------------
router.put('/update-status/:id', async (req, res) => {
  try {
    const { status, returnRejectionReason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found!' });
    }

    order.status = status;
    if (!order.statusTimeline) order.statusTimeline = [];
    order.statusTimeline.push({ status, timestamp: new Date() });

    if (status === 'Return Rejected' && returnRejectionReason) {
      order.returnRejectionReason = returnRejectionReason;
    }

    // If status is 'Delivered', set deliveredAt
    if (status === 'Delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();

    // 🔥 Broadcast the updated order to all connected clients
    req.io.emit('order_status_sync', order);

    res.json({ message: 'Order status updated!', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------------------------------
// 4. User requests a return (validates return window)
// ----------------------------------------------
router.post('/request-return/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    const order = await Order.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(targetId) ? targetId : null },
        { customId: targetId }
      ].filter(c => c !== null)
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found!' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Sirf delivered order return ho sakte hain!' });
    }

    // Calculate maximum return days from all items (fallback to 0)
    const maxReturnDays = Math.max(...(order.items?.map(i => i.returnDays || 0) || [0]));
    if (maxReturnDays === 0) {
      return res.status(400).json({ message: '❌ Is order par Return Policy applicable nahi hai!' });
    }

    // Use deliveredAt or fallback to updatedAt if missing (for old orders)
    const deliveryTime = order.deliveredAt || order.updatedAt;
    if (!deliveryTime) {
      return res.status(400).json({ message: 'Delivery date missing, cannot validate return window.' });
    }

    const deliveredDate = new Date(deliveryTime);
    const expiryDate = new Date(deliveredDate.getTime() + maxReturnDays * 24 * 60 * 60 * 1000);

    if (new Date() > expiryDate) {
      return res.status(400).json({
        message: `❌ Return Window expire ho chuka hai. Last date ${expiryDate.toLocaleDateString()} thi.`
      });
    }

    // Valid request → set status to 'Return Requested'
    order.status = 'Return Requested';
    order.statusTimeline.push({ status: 'Return Requested', timestamp: new Date() });
    await order.save();

    // Emit update so admin & user see the change live
    req.io.emit('order_status_sync', order);

    res.json({ message: '✅ Return request successfully submit ho gayi hai!', order });
  } catch (error) {
    res.status(500).json({ message: 'Return failed', error: error.message });
  }
});

// ----------------------------------------------
// 5. Cancel a pending order (restores stock)
// ----------------------------------------------
router.post('/cancel/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null },
        { customId: req.params.id }
      ].filter(c => c !== null)
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found!' });
    }

    // Only allow cancellation if status is 'Order Placed' or 'Pending'
    if (['Cancelled', 'Shipped', 'Delivered'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel now!' });
    }

    // Restore stock for each item
    for (const item of order.items) {
      const product = await Product.findById(item._id);
      if (product) {
        product.stock += Number(item.quantity || 1);
        await product.save();
      }
    }

    order.status = 'Cancelled';
    order.statusTimeline.push({ status: 'Cancelled', timestamp: new Date() });
    await order.save();

    // Emit update
    req.io.emit('order_status_sync', order);

    res.json({ message: '🛑 Cancelled Successfully!', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;