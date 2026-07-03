const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');

// Photo upload ka system (Absolute Preserved Logic)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 1. Saare products fetch karne ka route
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});


// 2. EXPLICIT UPDATE PRODUCT ROUTE (Real-time Broadcast added)
router.put('/update-product/:id', upload.array('images', 3), async (req, res) => {
    try {
        const { name, description, price, discountPrice, weight, flavor, stock, category, returnDays, brand, customAttributes } = req.body;

        const updateData = {
            name, description, price: Number(price), discountPrice: Number(discountPrice),
            weight, flavor, stock: Number(stock), category, brand,
            customAttributes: customAttributes ? (typeof customAttributes === 'string' ? JSON.parse(customAttributes) : customAttributes) : [],
            returnDays: Number(returnDays) || 0
        };

        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map(file => `http://localhost:5000/uploads/${file.filename}`);
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!updatedProduct) return res.status(404).json({ message: "Product nahi mila!" });

        // 🔥 REAL-TIME BROADCAST Trigger
        req.io.emit('product_updated', updatedProduct);

        res.status(200).json({ message: "Sari details update ho gayi hain!", product: updatedProduct });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 3. Product Details Fetch
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product nahi mila!" });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: "Error", error });
    }
});

// 4. Naya product add karne ka route (Preserved absolute original logic)
router.post('/add', upload.array('images', 3), async (req, res) => {
    try {
        const { 
            name, description, price, discountPrice, weight, flavor, 
            stock, category, returnDays, brand, customAttributes 
        } = req.body;
        
        const imagesArray = req.files.map(file => `http://localhost:5000/uploads/${file.filename}`);

        let parsedReturnDays = Number(returnDays);
        if (isNaN(parsedReturnDays) || parsedReturnDays < 0 || parsedReturnDays > 7) {
            parsedReturnDays = 0;
        }

        const newProduct = new Product({
            name,
            description,
            price: Number(price),
            discountPrice: Number(discountPrice),
            images: imagesArray,
            weight,
            flavor,
            stock: Number(stock),
            category,
            returnDays: parsedReturnDays,
            brand: brand, 
            customAttributes: customAttributes ? JSON.parse(customAttributes) : [] 
        });

        await newProduct.save();
        res.status(201).json({ message: "Product sabhi details ke sath save ho gaya!" });
    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ message: "Error aaya", error: error.message });
    }
});

// 5. Product delete karne ka route
router.delete('/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Product deleted" });
    } catch (error) {
        res.status(500).json({ message: "Delete error", error });
    }
});

// 6. Quick Stock Patch reload route (Real-time Broadcast added)
router.patch('/update-stock/:id', async (req, res) => {
    try {
        const { stock } = req.body;
        const product = await Product.findByIdAndUpdate(req.params.id, { stock: Number(stock) }, { new: true });
        
        // 🔥 REAL-TIME STOCK BROADCAST Trigger
        req.io.emit('stock_reloaded', { id: req.params.id, stock: Number(stock) });

        res.status(200).json({ message: "Stock updated!", product });
    } catch (error) {
        res.status(500).json({ message: "Stock update failed", error: error.message });
    }
});
module.exports = router;