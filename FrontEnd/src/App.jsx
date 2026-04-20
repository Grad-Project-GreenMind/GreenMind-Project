import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomBar from './components/BottomBar'; 

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import SelectionEntry from './pages/SelectionEntry';
import ArticlePage from './pages/ArticlePage';
import SignUp from './pages/SignUp'; 
import Login from './pages/Login'; 
import HomeDashboard from './pages/HomeDashboard'; 
import ProductDashboard from './pages/ProductDashboard'; 
import UserActivity from './pages/UserActivity'; 
import Orders from './pages/Orders'; 
import Profile from './pages/Profile'; 
import ForgotPassword from './pages/ForgotPassword'; 

function AppContent() {
  const location = useLocation();
  const path = location.pathname;
  
  const noHeaderFooterPages = [
    '/login', 
    '/signup',
    '/selection', 
    '/home-dashboard', 
    '/product-dashboard',
    '/user-activity',
    '/orders',
    '/forgot-password',
    // '/chatbot' 
  ];

  const noBottomBarPages = [
    '/login', 
    '/signup',
    '/selection', 
    '/home-dashboard', 
    '/product-dashboard',
    '/user-activity',
    '/orders',
    '/forgot-password'
  ];

  const hideHeaderFooter = noHeaderFooterPages.includes(path);
  const hideBottomBar = noBottomBarPages.includes(path);

  return (
    <div className="min-h-screen flex flex-col font-inter">
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        theme="light"
      />

      {!hideHeaderFooter && <Navbar />}
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<div className="p-10 text-center">Home Page (Coming Soon)</div>} />
          <Route path="/articles" element={<ArticlePage />} />
          <Route path="/selection" element={<SelectionEntry />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/home-dashboard" element={<HomeDashboard />} />
          <Route path="/product-dashboard" element={<ProductDashboard />} />
          <Route path="/user-activity" element={<UserActivity />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          {/* <Route path="/chatbot" element={<Chatbot />} /> */}
        </Routes>
      </main>

      {!hideHeaderFooter && <Footer />}
      {!hideBottomBar && <BottomBar />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;