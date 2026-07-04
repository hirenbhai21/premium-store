
const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async(req,res)=>{
 const {name,email,password} = req.body;
 const hash = await bcrypt.hash(password,10);
 const user = new User({name,email,password:hash});
 await user.save();
 res.json(user);
});

router.post('/login', async(req,res)=>{
 const user = await User.findOne({email:req.body.email});
 if(!user) return res.status(400).send('User not found');

 const ok = await bcrypt.compare(req.body.password,user.password);
 if(!ok) return res.status(400).send('Wrong password');

 const token = jwt.sign({id:user._id},'secret');
 res.json({user,token});
});

module.exports = router;
