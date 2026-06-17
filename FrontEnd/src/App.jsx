import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Link,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BottomBar from "./components/BottomBar";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Home from "./pages/Home.jsx";

import SelectionEntry from "./pages/SelectionEntry.jsx";
import ArticlePage from "./pages/ArticlePage.jsx";
import SignUp from "./pages/SignUp.jsx";
import Login from "./pages/Login.jsx";
import HomeDashboard from "./pages/HomeDashboard.jsx";
import ProductDashboard from "./pages/ProductDashboard.jsx";
import UserActivity from "./pages/UserActivity.jsx";
import Orders from "./pages/Orders.jsx";
import Profile from "./pages/Profile.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";

//Rehab
import { CartProvider } from "./context/CartContext";
import ProductsPage from "./pages/ProductsPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import CropRecommendation from "./pages/CropRecommendation.jsx";
import FertilizerRecommendation from "./pages/FertilizerRecommendation.jsx";

//Mohamed
import History from "./pages/History.jsx";
import HistoryDetails from "./pages/HistoryDetails.jsx";
import Chatbot from "./pages/Chatbot.jsx";
import Reviews from "./pages/Reviews.jsx";
import DetectPlantDiseases from "./pages/DetectPlantDiseases.jsx";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function AppContent() {
  const location = useLocation();
  const path = location.pathname;

  // الصفحات اللي مش عايزة فيها Navbar ولا Footer
  const noHeaderFooterPages = [
    "/login",
    "/signup",
    "/selection",
    "/home-dashboard",
    "/product-dashboard",
    "/user-activity",
    "/orders",
    "/forgot-password",
    // "/chatbot",
  ];

  const noFooterPages = ["/chatbot"];

  const noBottomBarPages = [
    "/login",
    "/signup",
    "/selection",
    "/home-dashboard",
    "/product-dashboard",
    "/user-activity",
    "/orders",
    "/forgot-password",
  ];

  const hideHeaderFooter = noHeaderFooterPages.includes(path);
  const hideBottomBar = noBottomBarPages.includes(path);
  const hideFooter = noFooterPages.includes(path);

  const hideChatbotButton = path === "/chatbot";

  return (
    <div className="min-h-screen flex flex-col font-inter">
      {/* <ScrollToTop /> */}
      <ToastContainer position="top-right" autoClose={3000} theme="light" />

      {!hideHeaderFooter && <Navbar />}

      <main className={`flex-grow ${!hideHeaderFooter ? "pt-16" : ""}`}>
        <Routes>
          <Route path="/" element={<Home />} />

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

          <Route path="/products" element={<ProductsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/crop-recommendation" element={<CropRecommendation />} />
          <Route
            path="/fertilizer-recommendation"
            element={<FertilizerRecommendation />}
          />

          <Route path="/history" element={<History />} />
          <Route path="/history-details/:type" element={<HistoryDetails />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/add-review" element={<Reviews />} />
          <Route path="/detect-disease" element={<DetectPlantDiseases />} />
        </Routes>
      </main>

      {!hideHeaderFooter && !hideFooter && <Footer />}
      {!hideBottomBar && <BottomBar />}

      {/* Floating Chatbot Button*/}
      {!hideChatbotButton && (
        <Link
          to="/chatbot"
          style={{
            position: "fixed",
            bottom: "80px",
            right: "60px",
            zIndex: 9999,
          }}
        >
          <div className="text-4xl hover:scale-110 transition-all cursor-pointer ">
            {/* <div className="text-4xl hover:scale-110 transition-all cursor-pointer shadow-lg bg-white rounded-full p-2 flex items-center justify-center border border-gray-200"> */}
            🤖
          </div>
        </Link>
      )}
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
}

export default App;
