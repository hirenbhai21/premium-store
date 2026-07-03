import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  
  // 1. INITIAL LOAD: Page khulte hi localStorage se purana cart uthao
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('myPremiumCart');
      if (savedCart) {
        return JSON.parse(savedCart);
      } else {
        return [];
      }
    } catch (error) {
      console.error("Cart load karne me error:", error);
      return [];
    }
  });

  // 2. AUTO-SAVE: Jab bhi cart me kuch add/remove ho, usko turant memory me save kar do
  useEffect(() => {
    localStorage.setItem('myPremiumCart', JSON.stringify(cart));
  }, [cart]);

  // Add to Cart Function
  const addToCart = (product) => {
    setCart((prevCart) => {
      // Check karo ki item pehle se cart me hai ya nahi
      const existingProduct = prevCart.find(item => item._id === product._id);
      
      if (existingProduct) {
        // 🔥 Alert hata diya hai taaki silent rahe
        return prevCart; 
      }
      
      // 🔥 Alert hata diya hai (Ab Home.jsx ka toast dikhega)
      // Naya item add karo (quantity 1 ke sath)
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Remove from Cart Function
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  // 🔥 SAFE INLINE FIX: Quantity Plus Minus Function (Bina kisi code changes ke)
  const updateQuantity = (productId, amount) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item._id === productId) {
          const newQty = (item.quantity || 1) + amount;
          return { ...item, quantity: newQty < 1 ? 1 : newQty }; // 1 se kam nahi hoga
        }
        return item;
      })
    );
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity }}>
      {children}
    </CartContext.Provider>
  );
};