// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');
// const Product = require('../models/Product');

// // Multer Storage Configuration (Absolute Original Logic Preserved)
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });

// const upload = multer({ storage: storage });

// // 1. GET ALL PRODUCTS
// router.get('/', async (req, res) => {
//     try {
//         const products = await Product.find().sort({ createdAt: -1 });
//         res.json(products);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching inventory records", error: error.message });
//     }
// });

// // 2. 🔥 EXPLICIT UPDATE PRODUCT ROUTE (Placed strictly on top of generic parameters to resolve 404)
// router.put('/update-product/:id', async (req, res) => {
//     try {
//         const { name, description, price, discountPrice, weight, flavor, stock, category, returnDays, brand, customAttributes } = req.body;

//         const updatedProduct = await Product.findByIdAndUpdate(
//             req.params.id,
//             {
//                 name,
//                 description,
//                 price: Number(price),
//                 discountPrice: Number(discountPrice),
//                 weight,
//                 flavor,
//                 stock: Number(stock),
//                 category,
//                 brand,
//                 customAttributes: customAttributes || [], 
//                 returnDays: Number(returnDays) || 0      
//             },
//             { new: true, runValidators: false } // Bypasses missing fields blockages on older documents
//         );

//         if (!updatedProduct) {
//             return res.status(404).json({ message: "Product database me nahi mila!" });
//         }

//         res.json({ message: "Sari details update ho gayi hain!", product: updatedProduct });
//     } catch (error) {
//         console.error("Master Update Endpoint Error:", error);
//         res.status(500).json({ message: "Backend core crash error", error: error.message });
//     }
// });

// // 3. MINT / ADD NEW PRODUCT (Original multi-upload logic fully preserved)
// router.post('/add', upload.array('images', 3), async (req, res) => {
//     try {
//         const { name, description, price, discountPrice, weight, flavor, stock, category, returnDays, brand, customAttributes } = req.body;
//         const imagePaths = req.files.map(file => `http://localhost:5000/uploads/${file.filename}`);

//         const newProduct = new Product({
//             name,
//             description,
//             price: Number(price),
//             discountPrice: Number(discountPrice),
//             images: imagePaths,
//             weight,
//             flavor,
//             stock: Number(stock),
//             category,
//             brand,
//             customAttributes: customAttributes ? JSON.parse(customAttributes) : [],
//             returnDays: Number(returnDays) || 0
//         });

//         await newProduct.save();
//         res.status(201).json({ message: "Product sabhi details ke sath save ho gaya!" });
//     } catch (error) {
//         console.error("Save Error:", error);
//         res.status(500).json({ message: "Error aaya", error: error.message });
//     }
// });

// // 4. QUICK PATCH UPDATE STOCK RELOAD
// router.patch('/update-stock/:id', async (req, res) => {
//     try {
//         const { stock } = req.body;
//         const updated = await Product.findByIdAndUpdate(req.params.id, { stock: Number(stock) }, { new: true });
//         res.json(updated);
//     } catch (err) {
//         res.status(500).json({ message: "Stock update failure" });
//     }
// });

// // 5. DELETE PRODUCT ASSET
// router.delete('/:id', async (req, res) => {
//     try {
//         await Product.findByIdAndDelete(req.params.id);
//         res.json({ message: "Deleted successfully" });
//     } catch (e) {
//         res.status(500).json({ message: "Fail to delete" });
//     }
// });

// module.exports = router;