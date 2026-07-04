const User = require('../models/User'); // Path to your Auth User Model
const Chat = require('./Message');

// GET /api/admin/users
const getAllUsersList = async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        
        // Map users with individual unread chat analytics logic
        const integratedData = await Promise.all(users.map(async (u) => {
            const unreadCount = await Chat.countDocuments({
                room: u._id.toString(),
                senderId: { $ne: 'ADMIN_SUPER_ID' },
                isSeen: false
            });
            return {
                _id: u._id, name: u.name, email: u.email, phone: u.phone || "N/A",
                role: u.role, status: u.status, isOnline: u.isOnline,
                lastLogin: u.lastLogin, createdAt: u.createdAt, unread: unreadCount
            };
        }));
        
        res.json(integratedData);
    } catch (err) { res.status(500).json({ message: "Failed" }); }
};

// GET /api/admin/user/:id
const getSingleUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "Not Found" });

        const totalChats = await Chat.countDocuments({ room: id });
        
        res.json({
            user,
            analytics: { totalChats }
        });
    } catch (err) { res.status(500).json({ message: "Failed" }); }
};

// PATCH /api/admin/user-status/:id (Block/Unblock action tool)
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "Not Found" });

        user.status = user.status === 'Active' ? 'Inactive' : 'Active';
        await user.save();
        res.json({ success: true, status: user.status });
    } catch (err) { res.status(500).json({ message: "Failed" }); }
};

module.exports = { getAllUsersList, getSingleUserDetails, toggleUserStatus };