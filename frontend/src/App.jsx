import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext'; 

import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import AddProduct from './pages/AddProduct';
import Products from './pages/Products';
import ManageOrders from './pages/ManageOrders';
import ManageUsers from './pages/ManageUsers';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';  

// 🛡️ ROUTE GUARD: Strict security check block for password-only admin logic
const AdminGuard = ({ children }) => {
  const token = localStorage.getItem('admin_token');
  const user = JSON.parse(localStorage.getItem('admin_user'));

  // 🔥 FIX: Yahan tumhara naya exact database wala email id bitha diya hai!
  if (!token || user?.email !== 'hirenbhimani213@gmail.com' || user?.role !== 'admin') {
    return <Navigate to="/admin-secure-login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="flex-1 p-8 overflow-y-auto">{children}</div>
    </div>
  );
};

const UserLayout = ({ children }) => (
  <div className="min-h-screen bg-[#f8fafc]">
    <Navbar />
    <div className="p-6 max-w-7xl mx-auto">{children}</div>
  </div>
);

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* User Side Endpoints - 100% Intact without changes */}
          <Route path="/" element={<UserLayout><Home /></UserLayout>} />
          <Route path="/cart" element={<UserLayout><Cart /></UserLayout>} />
          <Route path="/product/:id" element={<UserLayout><ProductDetail /></UserLayout>} />
          <Route path="/checkout" element={<UserLayout><Checkout /></UserLayout>} />
          <Route path="/myorders" element={<UserLayout><MyOrders /></UserLayout>} />
          <Route path="/login" element={<Auth />} />

          {/* Admin Portal Password-Only Login Path */}
          <Route path="/admin-secure-login" element={<AdminLogin />} />

          {/* Admin Panels Access Area */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminGuard><Dashboard /></AdminGuard>} />
          <Route path="/admin/products" element={<AdminGuard><Products /></AdminGuard>} />
          <Route path="/admin/add-product" element={<AdminGuard><AddProduct /></AdminGuard>} />
          <Route path="/admin/manage-orders" element={<AdminGuard><ManageOrders /></AdminGuard>} />
          <Route path="/admin/customers" element={<AdminGuard><ManageUsers /></AdminGuard>} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;