const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const emailOtpCache = {};

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    auth: {
        user: 'hb21ecom.auth@gmail.com', 
        pass: 'uegn nnbv mcdo nudl'      
    },
    tls: {
        rejectUnauthorized: false 
    }
});

// 1. SEND REGISTRATION OTP[cite: 2]
router.post('/send-email-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email mandatory hai bhai!" });
        const emailClean = email.trim().toLowerCase();

        const userExists = await User.findOne({ email: emailClean });
        if (userExists) return res.status(400).json({ message: "Email pehle se registered hai!" });

        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        emailOtpCache[emailClean] = { otp: generatedOtp, expiresAt: Date.now() + 10 * 60 * 1000 };

        await transporter.sendMail({
            from: '"PremiumStore Node" <hb21ecom.auth@gmail.com>',
            to: emailClean,
            subject: '🔒 Registration Code Token',
            html: `<p>Your code is: <b>${generatedOtp}</b></p>`
        });
        res.status(200).json({ message: "🎉 Code email par bhej diya gaya hai!" });
    } catch (error) {
        res.status(500).json({ message: "Gateway offline error", error: error.message });
    }
});

// 2. SEND LOGIN / FORGET OTP[cite: 2]
router.post('/send-login-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email mandatory hai bhai!" });
        const emailClean = email.trim().toLowerCase();

        const user = await User.findOne({ email: emailClean });
        if (!user) return res.status(404).json({ message: "Yeh Email account registered nahi hai!" });

        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        emailOtpCache[emailClean] = { otp: generatedOtp, expiresAt: Date.now() + 10 * 60 * 1000 };

        await transporter.sendMail({
            from: '"PremiumStore Login Gateway" <hb21ecom.auth@gmail.com>',
            to: emailClean,
            subject: '🔑 Login Verification Code',
            html: `<p>Your token code is: <b>${generatedOtp}</b></p>`
        });
        res.status(200).json({ message: "🎉 Secure login code email par deliver ho gaya!" });
    } catch (error) {
        res.status(500).json({ message: "Gateway connection error", error: error.message });
    }
});

// 3. DIRECT OTP LOGIN[cite: 2]
router.post('/login-via-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: "Email aur OTP dono required hain!" });

        const emailClean = email.trim().toLowerCase();
        const cachedRecord = emailOtpCache[emailClean];

        if (!cachedRecord || Date.now() > cachedRecord.expiresAt || otp.trim() !== cachedRecord.otp) {
            return res.status(400).json({ message: "Invalid code ya OTP Expire ho gaya hai!" });
        }

        delete emailOtpCache[emailClean]; 

        const user = await User.findOne({ email: emailClean });
        const token = jwt.sign({ id: user._id, role: user.role || 'user' }, "STORE_SECRET_KEY", { expiresIn: '7d' });
        res.json({ message: "🎉 Login Successful!", token, user });
    } catch (err) {
        res.status(500).json({ message: "OTP login error", error: err.message });
    }
});

// 4. CORE REGISTER FLOW[cite: 2]
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, otp } = req.body;
        if (!name || !email || !password || !phone || !otp) return res.status(400).json({ message: "Sari details mandatory hain!" });

        const emailClean = email.trim().toLowerCase();
        const cachedRecord = emailOtpCache[emailClean];

        if (!cachedRecord || otp.trim() !== cachedRecord.otp) return res.status(400).json({ message: "Galat OTP Token!" });
        delete emailOtpCache[emailClean];

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email: emailClean, password: hashedPassword, phone: phone.trim(), role: "user" });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id, role: "user" }, "STORE_SECRET_KEY", { expiresIn: '7d' });
        res.status(201).json({ message: "🎉 Account created!", token, user: newUser });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 5. STANDARD LOGIN (CORE SYNC INJECTED)[cite: 2]
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid login credentials!" });
        }

        const token = jwt.sign({ id: user._id, role: user.role || 'user' }, "STORE_SECRET_KEY", { expiresIn: '7d' });
        res.json({ message: "Authorized Successful!", token, user });
    } catch (e) { 
        res.status(500).json({ message: e.message }); 
    }
});

module.exports = router;