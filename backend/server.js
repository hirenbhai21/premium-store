const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http'); // 🔥 Added for socket
const { Server } = require('socket.io'); // 🔥 Added for socket

const productRoutes = require('./routes/product'); 
const orderRoutes = require('./routes/orderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const authRoutes = require('./routes/authRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');

const app = express();
const server = http.createServer(app); // 🔥 Wrap express app

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io Connection Setup
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Frontend URL
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
});

// 🔥 Attach io instance to req object so routes can use it
app.use((req, res, next) => {
    req.io = io;
    next();
});

io.on('connection', (socket) => {
    console.log('⚡ User connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
    });
});

// Uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/products', productRoutes); 
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes); 
app.use('/api/admin', adminUserRoutes);

// MongoDB Connection
const DB_URI = 'mongodb+srv://hiren:hiren12@cluster0.bhothyy.mongodb.net/ecommerce?retryWrites=true&w=majority';
mongoose.connect(DB_URI)
    .then(() => console.log('MongoDB Connected Ekdum Perfect!'))
    .catch(err => console.log('MongoDB Error:', err));

// Server port 5000 trigger listen
server.listen(5000, () => {
    console.log('Server port 5000 par socket ke sath mast chal raha hai');
});