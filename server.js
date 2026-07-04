const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http'); 
const { Server } = require('socket.io'); 

const chatController = require('./models/chatController'); 

const productRoutes = require('./routes/product'); 
const orderRoutes = require('./routes/orderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const authRoutes = require('./routes/authRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');

const app = express();
const server = http.createServer(app); 

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const adminUserController = require('./models/adminUserController');

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", 
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

chatController.handleChatSockets(io);

// 🔥 CHAT HTTP ENDPOINTS Connected cleanly
app.get('/api/admin/support-chats', chatController.getActiveChats);
app.get('/api/admin/chat-history/:room', chatController.getSpecificUserHistory); // Dedicated API call line
app.delete('/api/admin/clear-chat/:room', chatController.clearChatLogs);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/products', productRoutes); 
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes); 
app.use('/api/admin', adminUserRoutes);
app.get('/api/admin/users', adminUserController.getAllUsersList);
app.get('/api/admin/user/:id', adminUserController.getSingleUserDetails);
app.patch('/api/admin/user-status/:id', adminUserController.toggleUserStatus);


const DB_URI = 'mongodb+srv://hiren:hiren12@cluster0.bhothyy.mongodb.net/ecommerce?retryWrites=true&w=majority';
mongoose.connect(DB_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 })
.then(() => console.log('MongoDB Connected Ekdum Perfect!'))
.catch(err => console.log('MongoDB Error:', err));

server.listen(5000, () => console.log('Server live on 5000'));