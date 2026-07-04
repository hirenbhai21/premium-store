const Chat = require('./Message'); // Same models folder

const handleChatSockets = (io) => {
    io.on('connection', (socket) => {
        console.log('⚡ Connected to Global Hub:', socket.id);

        // History Request from User
        socket.on('get_chat_history', async (userId) => {
            if (!userId) return;
            try {
                const history = await Chat.find({ room: userId }).sort({ createdAt: 1 });
                socket.emit('chat_history', history);
            } catch (err) { console.error(err); }
        });

        // Mark as Seen Receipt
        socket.on('mark_as_seen', async ({ room, readerId }) => {
            try {
                await Chat.updateMany(
                    { room, senderId: { $ne: readerId }, isSeen: false }, 
                    { $set: { isSeen: true } }
                );
                io.emit('messages_marked_seen', { room });
            } catch (err) { console.error(err); }
        });

        // Global Direct Message Router
        socket.on('send_message', async (data) => {
            try {
                const newChatMsg = new Chat({
                    room: data.room,
                    senderId: data.senderId,
                    senderName: data.senderName,
                    message: data.message,
                    timestamp: data.timestamp,
                    isSeen: false,
                    isClosed: data.isClosed || false
                });
                const savedMsg = await newChatMsg.save();
                
                // 🔥 Broadcast globally to everyone connected
                io.emit('receive_message_global', savedMsg); 
            } catch (err) { console.error(err); }
        });
    });
};

// GET /api/admin/support-chats (Sidebar List Fix)
const getActiveChats = async (req, res) => {
    try {
        const uniqueChats = await Chat.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$room",
                    // Hamesha non-admin name filter karne ke liye array push logic
                    allNames: { $push: { $cond: [{ $ne: ["$senderId", "ADMIN_SUPER_ID"] }, "$senderName", "$$REMOVE"] } },
                    lastMessage: { $first: "$message" },
                    lastTime: { $first: "$timestamp" },
                    createdAt: { $first: "$createdAt" }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        const formatted = await Promise.all(uniqueChats.map(async (chat) => {
            const unreadCount = await Chat.countDocuments({
                room: chat._id,
                senderId: { $ne: 'ADMIN_SUPER_ID' },
                isSeen: false
            });
            const finalName = chat.allNames && chat.allNames.length > 0 ? chat.allNames[0] : "User";
            return { id: chat._id, name: finalName, lastMessage: chat.lastMessage, lastTime: chat.lastTime, unread: unreadCount };
        }));

        res.json(formatted);
    } catch (err) { res.status(500).json({ message: "Failed" }); }
};

// 🔥 CRITICAL ADDITION: Direct API Route to pull chat for Admin Box without failures
const getSpecificUserHistory = async (req, res) => {
    try {
        const { room } = req.params;
        const history = await Chat.find({ room }).sort({ createdAt: 1 });
        res.json(history);
    } catch (err) { res.status(500).json({ message: "Failed fetching history" }); }
};

// DELETE /api/admin/clear-chat/:room (Soft Delete Splitter)
const clearChatLogs = async (req, res) => {
    try {
        const { room } = req.params;
        await Chat.updateMany({ room, isClosed: false }, { $set: { isClosed: true } });
        io.emit('chat_cleared_sync_global', { room });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: "Failed" }); }
};

module.exports = { handleChatSockets, getActiveChats, getSpecificUserHistory, clearChatLogs };