
// const mongoose = require('mongoose');

// module.exports = async function connectDB(){
//   try{
//     await mongoose.connect('mongodb+srv://hiren:hiren12@cluster0.bhothyy.mongodb.net/ecommerce');
//     console.log('MongoDB Connected');
//   }catch(err){
//     console.log(err);
//   }
// }

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Yahan sirf mongoose.connect use hoga, require nahi
    await mongoose.connect('mongodb+srv://hiren:hiren12@cluster0.bhothyy.mongodb.net/ecommerce');
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
};

module.exports = connectDB;